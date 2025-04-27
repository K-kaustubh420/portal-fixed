"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview'; // Reusable
import Stats from './stats'; // Reusable
import Popup from './popup'; // Use the MODIFIED Popup component
import Recents from './recents'; // Reusable
import CalendarView from './calendarview'; // Reusable
import AwaitingAtU from './awaitingatu'; // Reusable
import { useAuth } from '@/context/AuthContext'; // Reusable

// --- Define or Import Interfaces ---
// (Make sure these match your actual data structure)
export interface Item { id: number; proposal_id: number; category: string; sub_category: string; type: string | null; quantity: number; cost: number; amount: number; created_at: string | null; updated_at: string | null; status: string; }
export interface Sponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string | null; updated_at: string | null; }
export interface Message { id: number; proposal_id: number; user_id: number; message: string; created_at: string | null; updated_at: string | null; }
export interface User { name: string; department: number | string; email: string; role: string; designation: string; dept_id: number; }
export interface Proposal { id: string; title: string; status: 'Approved' | 'Pending' | 'Rejected' | 'Review'; date: string; organizer: string; convenerName: string; awaiting?: string | null; }
export interface UnifiedProposal { id: string; title: string; status: 'Approved' | 'Pending' | 'Rejected' | 'Review'; date: string; organizer: string; convenerName: string; convenerEmail: string; submissionTimestamp: string; description: string; category: string; eventStartDate: string; eventEndDate: string; eventDate: string; eventDescription: string; eventTitle: string; cost: number; detailedBudget: Item[]; estimatedBudget: number; email: string; location?: string; chiefGuestName?: string; chiefGuestDesignation?: string; designation?: string; durationEvent?: string; fundingDetails?: { [key: string]: number | null; }; organizingDepartment?: string; department_name?: string; pastEvents?: string | string[] | null; proposalStatus?: string; relevantDetails?: string | null; sponsorshipDetails: Sponsor[]; sponsorshipDetailsRows?: any[]; rejectionMessage?: string; tags?: string[]; messages: Message[]; chief?: User | null; user?: User | null; awaiting: string | null; }
export interface ProposalListItem { id: number; user_id: number; chief_id?: number | null; title: string; description: string; start: string; end: string; category: string; past: string | null; other: string | null; status: 'completed' | 'pending' | 'rejected' | 'review'; participant_expected: number | null; participant_categories: string | null; fund_uni: number | null; fund_registration: number | null; fund_sponsor: number | null; fund_others: number | null; created_at: string | null; updated_at: string | null; department_name: string; awaiting: string | null; faculty?: { id: number; name: string; email: string; phone: string; role: string; designation: string; dept_id: number; department: { id: number; name: string; }; }; /* other fields */ }
export interface DetailedProposalResponse { proposal: ProposalListItem; chief: User | null; items: Item[]; sponsors: Sponsor[]; messages: Message[]; user?: User | null; department_name: string; }
export interface ApiResponse { status: string; proposals: ProposalListItem[]; }
// --- End Interfaces ---


const ChairDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<UnifiedProposal | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null); // Error specific to fetching details for popup
    const [isPopupLoading, setIsPopupLoading] = useState(false); // Loading state for popup details fetch
    const { token, user, logout } = useAuth();
    const apiBaseUrl = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";
    const currentUserRole = 'chair'; // Define the role for this dashboard

    // Helper function to capitalize status (no changes needed)
    const capitalize = (str: string): string => { /* ... */ };

    const fetchProposals = useCallback(async () => {
        // Check for correct role
        if (!token || !user || user.role !== currentUserRole) {
            setError(user ? `Access denied. User is not a ${capitalize(currentUserRole)}.` : "User not authenticated.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        // Use role-specific API endpoint
        const proposalEndpoint = `${apiBaseUrl}/api/${currentUserRole}/proposals`;
        console.log(`ChairDashboard: Fetching proposals from ${proposalEndpoint}`); // Log endpoint

        try {
            const response = await axios.get<ApiResponse>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setProposals(response.data.proposals || []);
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposals';
             if (axiosError.response?.status === 401) { errorMessage = "Authentication failed."; logout(); }
             else if (axiosError.response?.status === 403) { errorMessage = `Forbidden: You lack permission to view ${currentUserRole} proposals.`; }
             else { errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || `Failed to fetch ${currentUserRole} proposals`; }
             console.error(`${capitalize(currentUserRole)}Dashboard: Error fetching proposals:`, { errorMessage, status: axiosError.response?.status });
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [token, user, logout, apiBaseUrl, currentUserRole]); // Added dependencies

    useEffect(() => {
        if (user?.role === currentUserRole) {
            fetchProposals();
        } else if (user) {
            setError(`Access denied. This dashboard is for ${capitalize(currentUserRole)}s only.`);
            setLoading(false);
        } else {
            setError("User not authenticated.");
            setLoading(false);
        }
    }, [fetchProposals, user, currentUserRole]); // Added dependency

    const fetchProposalDetail = useCallback(async (proposalId: number): Promise<UnifiedProposal | null> => {
        // Check for correct role
        if (!token || !user || user.role !== currentUserRole) {
             console.error(`${capitalize(currentUserRole)}Dashboard: fetchProposalDetail cancelled: Invalid auth.`, { tokenExists: !!token, userRole: user?.role });
            setFetchError("Authentication or authorization failed."); // Set popup-specific error
            return null;
        }
        setIsPopupLoading(true);
        setFetchError(null);
        // Use role-specific API endpoint
        const detailEndpoint = `${apiBaseUrl}/api/${currentUserRole}/proposals/${proposalId}`;
        console.log(`${capitalize(currentUserRole)}Dashboard: Fetching proposal detail from ${detailEndpoint}`);

        try {
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            // Assume mapDetailResponseToUnifiedProposal exists and works
            return mapDetailResponseToUnifiedProposal(response.data);
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposal details';
            if (axiosError.response?.status === 404) { errorMessage = `Proposal not found or not awaiting at the ${currentUserRole} level.`; }
            else if (axiosError.response?.status === 401) { errorMessage = "Authentication failed."; logout(); }
            else if (axiosError.response?.status === 403) { errorMessage = `Forbidden: You lack permission to view this proposal as ${currentUserRole}.`; }
            else { errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposal details'; }
            console.error(`${capitalize(currentUserRole)}Dashboard: Error fetching proposal detail:`, { proposalId, errorMessage, status: axiosError.response?.status });
            setFetchError(errorMessage); // Set popup-specific error
            return null;
        } finally {
            setIsPopupLoading(false);
        }
    }, [token, user, logout, apiBaseUrl, currentUserRole]); // Added dependencies

    // --- Mapping and Stat Functions (Copy from DeanDashboard or ensure they are correct) ---
    const calculateStats = (proposalList: ProposalListItem[]) => {
         if (!Array.isArray(proposalList)) return { approvedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, reviewProposalsCount: 0, totalProposalsCount: 0 };
         let approved = 0, pending = 0, rejected = 0, review = 0;
         proposalList.forEach(p => {
             if (!p || typeof p.status !== 'string') return;
             const status = p.status.toLowerCase();
             if (status === 'completed') approved++;
             else if (status === 'pending') pending++;
             else if (status === 'rejected') rejected++;
             else if (status === 'review') review++;
         });
         return { approvedProposalsCount: approved, pendingProposalsCount: pending, rejectedProposalsCount: rejected, reviewProposalsCount: review, totalProposalsCount: proposalList.length };
    };
    const stats = calculateStats(proposals);

    const recentAppliedProposals = Array.isArray(proposals) ? [...proposals].filter(p => p && p.created_at).sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()).slice(0, 5) : [];

    const mapListItemToUnifiedProposal = (p: ProposalListItem): UnifiedProposal => {
        // This function needs careful implementation based on ProposalListItem structure
        // Example structure (adapt as needed):
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = p.faculty?.name || `User ID ${p.user_id}`;
        const convenerEmail = p.faculty?.email || 'N/A';
        const designation = p.faculty?.designation || '';
        const departmentName = p.department_name || p.faculty?.department?.name || 'Unknown Department';

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        // Check if awaiting current role
        if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === currentUserRole) tags.push('Awaiting Action');
        if (lowerStatus === 'review') tags.push('Review');

        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            status: p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '',
            organizer: departmentName, // Use department name
            convenerName: convenerName,
            convenerEmail: convenerEmail,
            submissionTimestamp: p.created_at || '',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            cost: calculatedCost,
            detailedBudget: [], // Populated by detail fetch
            estimatedBudget: calculatedCost,
            email: convenerEmail,
            designation: designation,
            organizingDepartment: departmentName,
            department_name: departmentName,
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: [], // Populated by detail fetch
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            tags: tags,
            messages: [], // Populated by detail fetch
            awaiting: p.awaiting,
            chief: null, // Populated by detail fetch
            user: p.faculty ? { name: p.faculty.name, department: p.faculty.dept_id, email: p.faculty.email, role: p.faculty.role, designation: p.faculty.designation, dept_id: p.faculty.dept_id } : null,
            // Add other fields as needed, mapping from ProposalListItem
        };
    };

    const mapDetailResponseToUnifiedProposal = (detailData: DetailedProposalResponse): UnifiedProposal => {
        // Similar to DeanDashboard, but ensure all fields are mapped correctly
        const p = detailData.proposal;
        const submitter = detailData.user || p.faculty; // Prioritize top-level user if available
        const chiefGuest = detailData.chief;
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = submitter?.name || `User ID: ${p.user_id}`;
        const convenerEmail = submitter?.email || 'N/A';
        const designation = submitter?.designation || '';
        const departmentName = detailData.department_name || submitter?.department?.name || 'Unknown Department';

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
         if (lowerStatus === 'completed') tags.push('Done');
         if (lowerStatus === 'rejected') tags.push('Rejected');
         if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === currentUserRole) tags.push('Awaiting Action');
         if (lowerStatus === 'review') tags.push('Review');

        let rejectionMsg = '';
        if (p.status === 'rejected') {
            // Find the last rejection message, maybe? API structure dependent.
            rejectionMsg = detailData.messages?.slice().reverse().find(msg => msg.message.toLowerCase().includes('reject'))?.message || 'Rejected';
        }

        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            status: p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '',
            organizer: departmentName,
            convenerName: convenerName,
            convenerEmail: convenerEmail,
            submissionTimestamp: p.created_at || '',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            cost: calculatedCost,
            detailedBudget: detailData.items || [],
            estimatedBudget: calculatedCost,
            email: convenerEmail,
            designation: designation,
            organizingDepartment: departmentName,
            department_name: departmentName,
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: detailData.sponsors || [],
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            tags: tags,
            messages: detailData.messages || [],
            awaiting: p.awaiting,
            chief: chiefGuest,
            user: submitter ? { name: submitter.name, department: submitter.dept_id, email: submitter.email, role: submitter.role, designation: submitter.designation, dept_id: submitter.dept_id } : null,
            rejectionMessage: rejectionMsg,
             // Map other fields from DetailedProposalResponse if necessary
             // location: ???, durationEvent: ???, etc. - Add based on your API response
        };
    };

    const mapUnifiedToSimplifiedProposal = (p: UnifiedProposal): Proposal => ({
        id: p.id, title: p.title, status: p.status, date: p.date, organizer: p.organizer, convenerName: p.convenerName, awaiting: p.awaiting
    });

    const handleProposalClick = useCallback(async (proposal: Proposal) => {
        const proposalId = proposal.id ? String(proposal.id).trim() : null;
        if (proposalId && !isNaN(parseInt(proposalId, 10))) {
            const numericId = parseInt(proposalId, 10);
            console.log(`${capitalize(currentUserRole)}Dashboard: Proposal clicked: ID ${numericId}`);
            const detailedProposal = await fetchProposalDetail(numericId);
            if (detailedProposal) {
                setSelectedProposal(detailedProposal);
                setError(null); // Clear list error if detail fetch succeeds
            } else {
                // fetchProposalDetail already sets fetchError, so no need to set main error here
                 // Optionally, show a generic error if detail fetch fails without a specific message
                 if (!fetchError) {
                    setError(`Could not load details for proposal ${proposalId}.`);
                 }
            }
        } else {
            console.error(`${capitalize(currentUserRole)}Dashboard: Invalid proposal ID clicked:`, proposal.id);
            setError('Selected proposal has an invalid ID.');
        }
    }, [fetchProposalDetail, currentUserRole, fetchError]); // Include fetchError to avoid resetting it unintentionally

    const closePopup = () => {
        setSelectedProposal(null);
        setFetchError(null); // Clear popup-specific error on close
    };

    // Derive lists for child components
    const unifiedProposals: UnifiedProposal[] = proposals.map(mapListItemToUnifiedProposal);
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentsForView: Proposal[] = recentAppliedProposals.map(mapListItemToUnifiedProposal).map(mapUnifiedToSimplifiedProposal);

    // --- RENDER SECTION ---
    return (
        <div className="chair-dashboard p-4 md:p-6 space-y-6 bg-gray-50 text-gray-900 min-h-screen"> {/* Adjusted styles */}
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 border-b pb-3">
                Chair Dashboard
            </h1>

            {/* Loading State */}
            {loading && <div className="flex justify-center items-center h-64"><span className="loading loading-spinner loading-lg text-blue-600"></span><p className='ml-3'>Loading proposals...</p></div>}

            {/* Error State */}
            {!loading && error && (
                 <div className="alert alert-error shadow-lg max-w-xl mx-auto">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <span>Error! {error}</span>
                     </div>
                 </div>
             )}

            {/* Content When Loaded Successfully */}
            {!loading && !error && (
                <>
                    <Stats {...stats} />
                    {/* Layout Grid - Removed BillStatus */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        {/* Left Column (Overview, Recents) */}
                        <div className="lg:col-span-2 space-y-6">
                            <Overview
                                eventProposals={proposalsForView}
                                handleProposalClick={handleProposalClick}
                            />
                            <Recents
                                recentAppliedProposals={recentsForView}
                                handleProposalClick={handleProposalClick}
                            />
                        </div>
                        {/* Right Column (Awaiting) */}
                        <div className="space-y-6">
                            <AwaitingAtU
                                proposals={unifiedProposals}
                                userRole={currentUserRole} // Pass the specific role
                            />
                             {/* Add other chair-specific components here if needed */}
                        </div>
                    </div>
                    {/* Calendar View */}
                    <div className="mt-8 bg-white p-4 rounded-lg shadow">
                         <h2 className="text-xl font-semibold text-slate-800 mb-4">Event Calendar</h2>
                        <CalendarView proposals={unifiedProposals} />
                    </div>
                </>
            )}

            {/* Popup - Uses the modified Popup component */}
             {isPopupLoading ? (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60 backdrop-blur-sm">
                    <span className="loading loading-lg loading-spinner text-white"></span>
                 </div>
             ) : selectedProposal ? (
                <Popup
                    selectedProposal={selectedProposal}
                    closePopup={closePopup}
                    onProposalUpdated={() => {
                        fetchProposals(); // Refresh the list after an action
                        closePopup(); // Close popup after successful action
                    }}
                    authToken={token}
                    apiBaseUrl={apiBaseUrl}
                    userRole={currentUserRole} // Pass the specific role here
                    fetchError={fetchError} // Pass the detail fetch error
                />
            ) : null}
        </div>
    );
};

export default ChairDashboard;