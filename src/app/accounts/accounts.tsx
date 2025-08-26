// src/app/accounts/accounts.tsx
'use client'; // Necessary for hooks (useState, useEffect) and client-side interactions

import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import { ClockIcon, CurrencyRupeeIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Loader2 } from 'lucide-react'; // Added for dashboard loading state
import { useAuth } from '@/context/AuthContext';
import Stats from './Statsbar'; // Or './stats' - ensure filename matches
import ProposalPopup from './popup'; // <--- IMPORT THE POPUP COMPONENT (ensure path is correct, e.g., ./ProposalPopup.tsx)
import { Proposal, DepartmentTotal } from '@/types';

// --- Helper Functions (Keep as they are) ---
const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || typeof value === 'undefined' || isNaN(value)) return '₹ N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

// Calculate total for the main dashboard/stats
const calculateProposalTotal = (proposal: Proposal): number => {
    if (!proposal || !proposal.bill_items) return 0;
    return proposal.bill_items.reduce((sum, item) => { const amount = typeof item.amount === 'number' ? item.amount : 0; return sum + amount; }, 0);
};

// --- Main Component ---
const AccountsDashboard: React.FC = () => {
    // --- State Definitions ---
    const [proposals, setProposals] = useState<Proposal[]>([]); // Stores the list of proposals from API
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- Auth State ---
    const { token, isLoading: isAuthLoading, isLoggedIn } = useAuth();

    // --- State for Popup ---
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

    // --- State for Settlement Action ---
    const [settlementStatus, setSettlementStatus] = useState<{ [key: number]: 'idle' | 'loading' | 'success' | 'error' }>({});
    const [settlementError, setSettlementError] = useState<string | null>(null);

    // --- Fetch Data Effect ---
    useEffect(() => {
        if (isAuthLoading || !isLoggedIn || !token) {
            if (!isAuthLoading) setIsLoadingData(false);
            return;
        }
        const fetchData = async () => {
            setIsLoadingData(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/proposals/`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', }
                });
                if (!response.ok) {
                    let errorMsg = `Failed to fetch data. Status: ${response.status}`;
                    try { const errorData = await response.json(); errorMsg = (errorData as { message?: string })?.message || errorMsg; } catch { }
                    throw new Error(errorMsg);
                }
                const data: Proposal[] = await response.json();
                // Initialize proposals with isSettled: false and set initial settlement status map
                const proposalsWithStatus = data.map(p => ({ ...p, isSettled: false }));
                setProposals(proposalsWithStatus);
                const initialStatus: { [key: number]: 'idle' } = {};
                data.forEach(p => initialStatus[p.id] = 'idle');
                setSettlementStatus(initialStatus);

            } catch (err: unknown) {
                console.error("Error fetching pending settlements:", err);
                const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
                setError(message);
                setProposals([]);
            } finally { setIsLoadingData(false); }
        };
        fetchData();
    }, [token, isLoggedIn, isAuthLoading]);


    // --- Derived Data Calculations (Memoized) ---
    // Filter based on settlement status map OR the proposal's isSettled flag
    const pendingProposals = useMemo(() => {
        return proposals.filter(p => !(settlementStatus[p.id] === 'success' || p.isSettled));
    }, [proposals, settlementStatus]);

    const pendingCount = pendingProposals.length;

    const totalPendingValue = useMemo(() => {
        return pendingProposals.reduce((totalSum, proposal) => {
            return totalSum + calculateProposalTotal(proposal); // Use the main helper
        }, 0);
    }, [pendingProposals]);

    const departmentTotals = useMemo(() => {
        return pendingProposals.reduce<DepartmentTotal[]>((accumulator, proposal) => {
            const departmentName = proposal.department_name || 'Unknown Department';
            const proposalTotal = calculateProposalTotal(proposal); // Use the main helper
            const existingDept = accumulator.find(d => d.department_name === departmentName);
            if (existingDept) { existingDept.totalAmount += proposalTotal; }
            else { accumulator.push({ department_name: departmentName, totalAmount: proposalTotal }); }
            return accumulator;
        }, []);
    }, [pendingProposals]);

    // --- Popup Handlers ---
    const handleRowClick = (proposal: Proposal) => {
        setSelectedProposal(proposal);
        setIsPopupOpen(true);
        setSettlementError(null);
        // Determine initial status for the popup
        const currentEffectiveStatus = (settlementStatus[proposal.id] === 'success' || proposal.isSettled) ? 'success' : settlementStatus[proposal.id] ?? 'idle';
        // Ensure the status map reflects the current state when opening
        setSettlementStatus(prev => ({
            ...prev,
            [proposal.id]: currentEffectiveStatus
        }));
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setTimeout(() => setSelectedProposal(null), 300); // Delay clear for animation
    };

    // --- Bill Settlement Handler ---
    const handleSettleBill = async (proposalId: number) => {
        if (!token) {
            setSettlementError("Authentication token not found.");
            setSettlementStatus(prev => ({ ...prev, [proposalId]: 'error' }));
            return;
        }
        if (!selectedProposal || selectedProposal.id !== proposalId) return;

        console.log(`Attempting to settle bill for proposal ID: ${proposalId}`);
        setSettlementStatus(prev => ({ ...prev, [proposalId]: 'loading' }));
        setSettlementError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/accounts/proposals/${proposalId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                 // body: JSON.stringify({}) // Add body if needed
            });

            if (!response.ok) {
                let errorMsg = `Settlement failed! Status: ${response.status}`;
                try { const errorData = await response.json(); errorMsg = (errorData as { message?: string })?.message || errorMsg; } catch { }
                throw new Error(errorMsg);
            }

            console.log(`Bill settled successfully via API for proposal ID: ${proposalId}`);
            // Update state: Mark success in map AND flag proposal as settled
            setSettlementStatus(prev => ({ ...prev, [proposalId]: 'success' }));
            setProposals(prevProposals =>
                prevProposals.map(p =>
                    p.id === proposalId ? { ...p, isSettled: true } : p
                )
            );
            // Update selected proposal so popup shows settled state
             setSelectedProposal(prev => prev ? { ...prev, isSettled: true } : null);

        } catch (err: unknown) {
            console.error("AccountsDashboard: Error settling bill:", err);
            const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred during settlement.";
            setSettlementError(errorMsg);
            setSettlementStatus(prev => ({ ...prev, [proposalId]: 'error' }));
        }
    };

    // --- Render Logic ---

    // Auth Loading
    if (isAuthLoading) return ( /* ... Auth loading indicator ... */
        <div className="flex justify-center items-center min-h-[calc(100vh-150px)] bg-white text-gray-700">
            <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
            <p className="ml-3 text-lg">Authenticating...</p>
        </div>
    );
    // Not Logged In
    if (!isLoggedIn) return ( /* ... Not logged in message ... */
         <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center p-8 bg-white">
             <p className="text-xl text-orange-600 font-semibold mb-4">Access Denied</p>
             <p className="text-gray-800 mb-6">Please log in to view the Accounts Dashboard.</p>
         </div>
    );
    // Data Loading
    if (isLoadingData) return ( /* ... Data loading indicator ... */
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)] bg-white text-gray-700">
        <Loader2 className="animate-spin text-blue-600 h-12 w-12" />
         <p className="ml-4 text-lg">Loading Pending Proposals...</p>
      </div>
    );
     // Error Fetching Data
     if (error && !isLoadingData) return ( /* ... Error message ... */
       <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center p-8 bg-white">
         <p className="text-2xl text-red-600 font-semibold mb-4">Oops! Something went wrong.</p>
         <p className="text-gray-800 mb-6">{error}</p>
         <button className="btn bg-blue-600 hover:bg-blue-700 text-white btn-sm" onClick={() => window.location.reload()}> Try Again </button>
       </div>
     );

    // Filter proposals for display using the memoized list
    const proposalsToDisplay = pendingProposals;

    // --- Main Dashboard Content ---
    return (
        // Use light theme classes
        <div className="p-4 md:p-6 lg:p-8 bg-white text-gray-900 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-black">Accounts Dashboard</h1>

            {/* --- Top Row: Summary Cards --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                {/* Card 1: Pending Settlement Count */}
                <div className="card bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 uppercase font-semibold tracking-wider">Pending Settlements</p>
                                <p className="text-2xl md:text-3xl font-bold mt-1 text-gray-800">{pendingCount}</p>
                                <p className="text-xs text-gray-400 mt-1">Proposals awaiting action</p>
                            </div>
                            <div className="bg-yellow-100 p-2 rounded-full">
                                <ClockIcon className="h-6 w-6 md:h-8 md:w-8 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Total Pending Value */}
                <div className="card bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 uppercase font-semibold tracking-wider">Total Pending Value</p>
                                <p className="text-2xl md:text-3xl font-bold mt-1 text-gray-800">{formatCurrency(totalPendingValue)}</p>
                                <p className="text-xs text-gray-400 mt-1">Estimated sum of pending bills</p>
                            </div>
                            <div className="bg-green-100 p-2 rounded-full">
                                <CurrencyRupeeIcon className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Departments Overview */}
                <div className="card bg-white border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="card-body">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500 uppercase font-semibold tracking-wider">Departments Overview</p>
                                <p className="text-2xl md:text-3xl font-bold mt-1 text-gray-800">{departmentTotals.length}</p>
                                <p className="text-xs text-gray-400 mt-1">Departments with pending items</p>
                            </div>
                            <div className="bg-blue-100 p-2 rounded-full">
                                <ChartBarIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Chart Section --- */}
            <div className="mb-6 md:mb-8">
                {/* Pass departmentTotals derived from pendingProposals */}
                <Stats data={departmentTotals} title="Department-wise Pending Amount Distribution" />
            </div>

            {/* --- Pending Settlements Table Section --- */}
            <div>
                <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">Pending Settlements List</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-200">
                    <table className="table-auto w-full">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-600 tracking-wider">
                            <tr>
                                <th className="p-3 text-left">#</th>
                                <th className="p-3 text-left">Event Name</th>
                                <th className="p-3 text-left">Department</th>
                                <th className="p-3 text-left">Convener</th>
                                <th className="p-3 text-right">Est. Amount</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {/* Handle Empty State */}
                            {proposalsToDisplay.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500">
                                        {proposals.length > 0 ? 'All pending proposals have been settled.' : 'No pending proposals found.'}
                                    </td>
                                </tr>
                            ) : (
                                // Map through proposalsToDisplay (filtered list)
                                proposalsToDisplay.map((proposal, index) => (
                                    <tr
                                        key={proposal.id}
                                        className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer"
                                        // --->>> ONCLICK ADDED HERE <<<---
                                        onClick={() => handleRowClick(proposal)}
                                    >
                                        <th className="p-3 text-sm font-medium text-gray-700">{index + 1}</th>
                                        <td className="p-3 text-sm font-medium text-gray-900">{proposal.event_name}</td>
                                        <td className="p-3 text-sm text-gray-700">{proposal.department_name || 'N/A'}</td>
                                        <td className="p-3 text-sm text-gray-700">
                                            <div>{proposal.convener_name || 'N/A'}</div>
                                            {proposal.convener_email && <div className="text-xs text-gray-500">{proposal.convener_email}</div>}
                                        </td>
                                        <td className="p-3 text-sm text-right font-semibold text-gray-800">{formatCurrency(calculateProposalTotal(proposal))}</td>
                                        <td className="p-3 text-center">
                                            {/* Changed Button to Span as visual cue */}
                                            <span className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                                                View Details
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {/* Table Footer */}
                        {proposalsToDisplay.length > 0 && (
                            <tfoot className="bg-gray-100 font-bold text-gray-700">
                                <tr>
                                    <td colSpan={4} className="p-3 text-right uppercase text-sm">Total Pending Value:</td>
                                    <td className="p-3 text-right text-sm">{formatCurrency(totalPendingValue)}</td>
                                    <td className="p-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {/* --- RENDER THE POPUP CONDITIONALLY --- */}
            {isPopupOpen && selectedProposal && (
                <ProposalPopup
                    proposal={selectedProposal}
                    onClose={closePopup}
                    onSettleBill={handleSettleBill}
                    // Pass the effective settlement status
                    settlementStatus={(settlementStatus[selectedProposal.id] === 'success' || selectedProposal.isSettled) ? 'success' : settlementStatus[selectedProposal.id] ?? 'idle'}
                    settlementError={settlementError}
                />
            )}
            {/* End of Popup Rendering */}

        </div> // End of main content container
    );
};

export default AccountsDashboard;