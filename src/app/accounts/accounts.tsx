// src/components/AccountsDashboard.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext'; // Adjust path if needed
import ProposalPopup from './popup'; // Import the popup component
import Stats from './stats'; // Import the updated Stats component
import { Loader2, CheckCircle } from 'lucide-react'; // For loading spinner and status icon

// --- Define TypeScript Interfaces (no changes needed here) ---
interface BillItem {
    id: number;
    proposal_id: number;
    category: string;
    sub_category: string;
    type: string;
    quantity: number;
    cost: number;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Proposal {
    id: number;
    event_name: string;
    convener_name: string;
    convener_email: string;
    department_name: string;
    bill_items: BillItem[];
    isSettled?: boolean; // Keep this for UI updates after settlement
}

// --- Helper function to calculate total amount for one proposal ---
// (Moved outside component or place in utils if preferred)
const calculateTotalAmountForProposal = (billItems: BillItem[]): number => {
    return billItems.reduce((sum, item) => sum + (item.amount || 0), 0);
};

// --- Format Currency Helper ---
// (Moved outside component or place in utils if preferred)
const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'N/A';
    // Adjust locale and currency as needed
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

// --- The Dashboard Component ---
const AccountsDashboard: React.FC = () => {
    const { token, isLoading: isAuthLoading, isLoggedIn } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // --- State for Popup ---
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

    // --- State for Settlement Action ---
    const [settlementStatus, setSettlementStatus] = useState<{ [key: number]: 'idle' | 'loading' | 'success' | 'error' }>({});
    const [settlementError, setSettlementError] = useState<string | null>(null);

    // --- Fetch Data Effect ---
    useEffect(() => {
        if (isAuthLoading || !token) {
            if (!isAuthLoading && !token) setIsLoadingData(false);
            return;
        }

        const fetchProposals = async () => {
            setIsLoadingData(true);
            setError(null);
            console.log("AccountsDashboard: Fetching UNSETTLED proposals list..."); // Updated log

            try {
                const response = await fetch("https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/accounts/proposals/", {
                    method: "GET",
                    headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
                });

                if (!response.ok) {
                    let errorMsg = `HTTP error! Status: ${response.status}`;
                    try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { }
                    throw new Error(errorMsg);
                }

                const data: Proposal[] = await response.json();
                console.log("AccountsDashboard: Unsettled proposals list received:", data);
                // All proposals fetched are initially unsettled
                const proposalsWithStatus = data.map(p => ({ ...p, isSettled: false }));
                setProposals(proposalsWithStatus);

                const initialStatus: { [key: number]: 'idle' } = {};
                data.forEach(p => initialStatus[p.id] = 'idle');
                setSettlementStatus(initialStatus);

            } catch (err: any) {
                console.error("AccountsDashboard: Error fetching proposals list:", err);
                setError(err.message || "Failed to fetch proposal data.");
                setProposals([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchProposals();

    }, [token, isAuthLoading]);

    // --- Calculate Stats based ONLY on the fetched (pending) proposals ---
    const statsData = useMemo(() => {
        // Filter proposals that are NOT marked as settled on the client-side
        // This ensures stats update correctly after a successful settlement action
        const pendingProposals = proposals.filter(p => !(settlementStatus[p.id] === 'success' || p.isSettled));

        const count = pendingProposals.length;
        const totalValue = pendingProposals.reduce((sum, proposal) => {
            return sum + calculateTotalAmountForProposal(proposal.bill_items);
        }, 0);

        return {
            pendingProposalsCount: count,
            totalPendingValue: totalValue,
        };
    }, [proposals, settlementStatus]); // Recalculate when proposals list or settlement status changes


    // --- Popup Handlers (no changes needed) ---
    const handleRowClick = (proposal: Proposal) => {
        setSelectedProposal(proposal);
        setIsPopupOpen(true);
        setSettlementError(null);
        const currentEffectiveStatus = (settlementStatus[proposal.id] === 'success' || proposal.isSettled) ? 'success' : settlementStatus[proposal.id] ?? 'idle';
        setSettlementStatus(prev => ({
            ...prev,
            [proposal.id]: currentEffectiveStatus
        }));
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedProposal(null);
    };

    // --- Bill Settlement Handler (no changes needed) ---
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
            const response = await fetch(`https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/accounts/proposals/${proposalId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                // body: JSON.stringify({}) // Uncomment if needed
            });

            if (!response.ok) {
                let errorMsg = `Settlement failed! Status: ${response.status}`;
                try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { }
                throw new Error(errorMsg);
            }

            console.log(`Bill settled successfully via API for proposal ID: ${proposalId}`);
            setSettlementStatus(prev => ({ ...prev, [proposalId]: 'success' }));

            setProposals(prevProposals =>
                prevProposals.map(p =>
                    p.id === proposalId ? { ...p, isSettled: true } : p
                )
            );
            setSelectedProposal(prev => prev ? { ...prev, isSettled: true } : null);

        } catch (err: any) {
            console.error("AccountsDashboard: Error settling bill:", err);
            const errorMsg = err.message || "An unexpected error occurred during settlement.";
            setSettlementError(errorMsg);
            setSettlementStatus(prev => ({ ...prev, [proposalId]: 'error' }));
        }
    };


    // --- Render Logic ---
    if (isAuthLoading) {
        return <div className="p-6 text-center text-gray-500">Authenticating...</div>;
    }
    if (!isLoggedIn && !isAuthLoading) {
        return <div className="p-6 text-center text-red-600">Please log in to view the accounts dashboard.</div>;
    }
    if (isLoadingData) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-blue-500 h-12 w-12" />
                <span className="ml-4 text-lg text-gray-600">Loading Pending Proposals...</span>
            </div>
        );
    }
    if (error) {
        return <div className="p-6 my-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow"><strong>Error loading data:</strong> {error}</div>;
    }

    // Filter out settled proposals for the main table display
    const proposalsToDisplay = proposals.filter(p => !(settlementStatus[p.id] === 'success' || p.isSettled));


    return (
        <div className="p-4 md:p-6 space-y-6">
            <h1 className="text-2xl font-semibold text-gray-800">Accounts Dashboard</h1>

            {/* Render Stats Section with pending data */}
            <Stats {...statsData} />

            <h2 className="text-xl font-semibold text-gray-700 mt-2 mb-4">Pending Settlements</h2>

            {/* Display table only if there are proposals to display */}
            {proposalsToDisplay.length === 0 && !isLoadingData ? (
                 <div className="p-6 text-center text-gray-500 bg-white rounded-lg shadow border">
                     {proposals.length > 0 ? 'All proposals have been settled.' : 'No pending proposals found.'}
                 </div>
             ) : (
                <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Convener</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Est. Amount</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {proposalsToDisplay.map((proposal) => (
                                <tr
                                    key={proposal.id}
                                    className="hover:bg-indigo-50 transition-colors duration-150 cursor-pointer"
                                    onClick={() => handleRowClick(proposal)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{proposal.event_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{proposal.department_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {proposal.convener_name}
                                        {proposal.convener_email && <span className="block text-xs text-gray-400">{proposal.convener_email}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-semibold">
                                        {/* Use the helper function for consistency */}
                                        {formatCurrency(calculateTotalAmountForProposal(proposal.bill_items))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                                         {/* Changed status column to View/Settle action hint */}
                                         <span className="text-blue-600 hover:text-blue-800 font-medium">
                                             View Details
                                         </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}


            {/* Render the Popup conditionally */}
            {isPopupOpen && selectedProposal && (
                <ProposalPopup
                    proposal={selectedProposal}
                    onClose={closePopup}
                    onSettleBill={handleSettleBill}
                    settlementStatus={ (settlementStatus[selectedProposal.id] === 'success' || selectedProposal.isSettled) ? 'success' : settlementStatus[selectedProposal.id] ?? 'idle' }
                    settlementError={settlementError}
                />
            )}
        </div>
    );
};

export default AccountsDashboard;