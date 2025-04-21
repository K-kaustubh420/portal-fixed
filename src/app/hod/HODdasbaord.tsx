// pages/hod/dashboard.tsx (or app/hod/dashboard/page.tsx)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Overview from './overview'; // Adjust path if needed
import Stats from './stats';       // Adjust path if needed
import Popup from './Popup';         // Adjust path - CHECK FILENAME CASING
import Recents from './recents';     // Adjust path if needed
import CalendarView from './CalnderView'; // Adjust path & NAME (or CalnderView)
import { loadAuthData, clearAuthData, User } from '@/lib/users'; // Adjust path if needed

// --- Interfaces ---

// Interface for LIST items from /api/hod/proposals
interface HODProposalListItem {
    id: number;
    user_id: number;
    chief_id: number | null;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    created_at: string;
    updated_at: string;
    user?: { name: string; email: string; }
}

// Interface for DETAILED data from /api/hod/proposals/{id}
interface HODDetailedProposalResponse {
    proposal: {
        id: number;
        user_id: number;
        chief_id: number | null;
        title: string;
        description: string;
        start: string;
        end: string;
        category: string;
        past: string | null;
        other: string | null;
        status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
        participant_expected: number | null;
        participant_categories: string | null;
        fund_uni: number | null;
        fund_registration: number | null;
        fund_sponsor: number | null;
        fund_others: number | null;
        created_at: string;
        updated_at: string;
        cheif_reason: string | null;
        cheif_hotel_name: string | null;
        cheif_hotel_address: string | null;
        cheif_hotel_duration: string | null;
        cheif_hotel_type: string | null;
        cheif_travel_name: string | null;
        cheif_travel_address: string | null;
        cheif_travel_duration: string | null;
        cheif_travel_type: string | null;
    };
    chief: User | null;
    items: Array<{
        id: number;
        proposal_id: number;
        category: string;
        sub_category: string;
        type: string;
        quantity: number;
        cost: number;
        amount: number;
        created_at: string;
        updated_at: string;
        status: string;
    }>;
    sponsors: Array<{
        id: number;
        proposal_id: number;
        category: string;
        amount: number;
        reward: string;
        mode: string;
        about: string;
        benefit: string;
        created_at: string;
        updated_at: string;
    }>;
    messages: Array<{
        id: number;
        proposal_id: number;
        user_id: number;
        message: string;
        created_at: string;
        updated_at: string;
    }>;
}


// Interface for the data structure expected by the Popup component
interface PopupProposal {
    id: string;
    title: string;
    date: string;
    organizer: string;
    convenerName: string;
    email?: string;
    cost?: number;
    category: string;
    description: string;
    designation?: string;
    detailedBudget?: { mainCategory: string; subCategory: string; totalAmount?: number }[];
    durationEvent?: string;
    estimatedBudget?: number;
    eventDate?: string;
    eventDescription?: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle?: string;
    organizingDepartment?: string;
    proposalStatus?: string;
    submissionTimestamp: string;
    convenerEmail?: string;
    location?: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    pastEvents?: string | string[] | null;
    relevantDetails?: string | null;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: any[];
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    participant_expected?: number | null;
    participant_categories?: string[] | null;
}
// --- End Interfaces ---

// Define the expected structure if the API returns an object containing the array
interface HODProposalListResponseObject {
    data?: HODProposalListItem[]; // Common key
    proposals?: HODProposalListItem[]; // Another possible key
    // Add other potential top-level keys if needed
}


const API_BASE_URL ="https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const HODDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<HODProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [localToken, setLocalToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authCheckComplete, setAuthCheckComplete] = useState(false);

    const router = useRouter();

    // --- Effect to Load Auth Data from LocalStorage ---
    useEffect(() => {
        console.log("HODDashboard: Running auth check effect...");
        const authData = loadAuthData();
        console.log("HODDashboard: Loaded auth data:", authData);
        setLocalToken(authData.token);
        setCurrentUser(authData.user);
        setAuthCheckComplete(true);
    }, []);

    // --- Logout Handler ---
    const handleLogout = useCallback(() => {
        console.log("HODDashboard: Logging out...");
        clearAuthData();
        setLocalToken(null);
        setCurrentUser(null);
        router.replace('/');
    }, [router]);

    // --- Effect for Authorization & Initial Data Fetch ---
    useEffect(() => {
        if (!authCheckComplete) {
             console.log("HODDashboard: Waiting for auth check...");
             setLoading(true);
            return;
        }
        console.log("HODDashboard: Auth check complete. Token:", !!localToken, "User:", !!currentUser);
        if (currentUser && localToken && currentUser.role === 'hod') {
            console.log("HODDashboard: User is HOD, fetching proposals...");
            fetchProposals(localToken);
        } else if (currentUser && localToken && currentUser.role !== 'hod') {
             console.log("HODDashboard: Access denied, user role is not HOD.");
             setError("Access Denied: You do not have HOD privileges.");
             setLoading(false);
        } else {
            console.log("HODDashboard: Not authorized or missing auth data, redirecting.");
            handleLogout();
        }
    }, [authCheckComplete, currentUser, localToken, handleLogout]);


    // --- Data Fetching Functions ---
    const fetchProposals = useCallback(async (authToken: string) => {
        setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/hod/proposals`;
        try {
            console.log(`HOD: Fetching proposals from: ${proposalEndpoint}`);
            const response = await axios.get<any>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
            });
            console.log("HOD: Raw API Response:", response.data); // <-- CHECK THIS LOG!!

            // *** CHECK AND ADJUST THIS BLOCK BASED ON YOUR ACTUAL API RESPONSE ***
            let proposalsArray: HODProposalListItem[] | null = null;
            if (response.data && Array.isArray(response.data.data)) {
                 console.log("HOD: Proposals array found in response.data.data");
                 proposalsArray = response.data.data;
            } else if (response.data && Array.isArray(response.data.proposals)) {
                console.log("HOD: Proposals array found in response.data.proposals");
                proposalsArray = response.data.proposals;
            } else if (Array.isArray(response.data)) {
                 console.log("HOD: Proposals array found directly in response.data");
                 proposalsArray = response.data;
            }
            // *** END OF BLOCK TO CHECK ***

            if (proposalsArray !== null) {
                 setProposals(proposalsArray);
            } else {
                console.error("HOD API Error: Proposals endpoint did not return an array or known object structure.", response.data);
                setProposals([]);
                setError("Received invalid data format from server. Check console for details.");
            }
        } catch (err: any) {
            console.error("HOD: Error fetching proposals:", err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) { setError("Authentication error."); handleLogout(); }
                else { setError(`Failed to fetch proposals: ${ (axiosError.response?.data as any)?.message || axiosError.message }`); }
            } else { setError(err.message || 'An unknown error occurred'); }
            setProposals([]);
        } finally {
             if (authCheckComplete) { setLoading(false); }
        }
    }, [authCheckComplete, handleLogout]);

    // Refetch proposals
    const refreshProposals = useCallback(() => {
        if (localToken) { fetchProposals(localToken); }
    }, [localToken, fetchProposals]);

    // Fetch proposal detail
    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!localToken || !currentUser || currentUser.role !== 'hod') return;
        setIsPopupLoading(true);
        setActionError(null);
        setSelectedProposalDetail(null);
        const detailEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            console.log(`HOD: Fetching proposal detail from: ${detailEndpoint}`);
            const response = await axios.get<HODDetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${localToken}`, Accept: 'application/json' },
            });
            console.log("HOD: Proposal detail fetched:", response.data);
            const apiData = response.data;
             if (!apiData || !apiData.proposal) { throw new Error("Invalid proposal detail structure received from API."); }
            const proposal = apiData.proposal;
            const chiefInfo = apiData.chief;
            const calculatedCost = (proposal?.fund_uni ?? 0) + (proposal?.fund_registration ?? 0) + (proposal?.fund_sponsor ?? 0) + (proposal?.fund_others ?? 0);
            const parseParticipantCategories = (categoriesString: string | null): string[] | null => {
                if (!categoriesString) return null; try { const p = JSON.parse(categoriesString); return Array.isArray(p)?p:null; } catch(e){return null;}
            };
            const rejectionMsg = proposal.status === 'Rejected' ? proposal.cheif_reason : apiData.messages?.find(m => m.message?.toLowerCase().includes('reject'))?.message;
            const reviewMsg = proposal.status === 'Review' ? proposal.cheif_reason : apiData.messages?.find(m => m.message?.toLowerCase().includes('review') || m.message?.toLowerCase().includes('clarify'))?.message;

            const detailedDataForPopup: PopupProposal = {
                id: String(proposal.id), title: proposal.title || 'N/A', description: proposal.description || 'N/A', category: proposal.category || 'N/A', status: proposal.status,
                eventStartDate: proposal.start, eventEndDate: proposal.end, submissionTimestamp: proposal.created_at, date: proposal.start,
                organizer: chiefInfo?.name || `User ${proposal.user_id}`, convenerName: chiefInfo?.name || `User ${proposal.user_id}`, convenerEmail: chiefInfo?.email, email: chiefInfo?.email, designation: chiefInfo?.designation, organizingDepartment: String(chiefInfo?.dept_id) || 'N/A',
                cost: calculatedCost > 0 ? calculatedCost : undefined, estimatedBudget: calculatedCost > 0 ? calculatedCost : undefined,
                detailedBudget: apiData.items?.map(item => ({ mainCategory: item.category || 'N/A', subCategory: item.sub_category || 'N/A', totalAmount: item.amount ?? undefined })) || [],
                durationEvent: proposal.cheif_hotel_duration || proposal.cheif_travel_duration || '', location: proposal.cheif_hotel_address || proposal.cheif_travel_address, chiefGuestName: undefined, chiefGuestDesignation: undefined,
                fundingDetails: { registrationFund: proposal.fund_registration ?? undefined, sponsorshipFund: proposal.fund_sponsor ?? undefined, universityFund: proposal.fund_uni ?? undefined, otherSourcesFund: proposal.fund_others ?? undefined, },
                pastEvents: proposal.past, relevantDetails: proposal.other,
                sponsorshipDetails: apiData.sponsors?.map(s => s ? `${s.category || 'Sponsor'}: ${s.amount?.toLocaleString()}` : null).filter(Boolean) as string[] || [], sponsorshipDetailsRows: apiData.sponsors || [],
                rejectionMessage: rejectionMsg || '', reviewMessage: reviewMsg || '', clarificationMessage: reviewMsg || '',
                participant_expected: proposal.participant_expected, participant_categories: parseParticipantCategories(proposal.participant_categories),
                eventDate: proposal.start, eventDescription: proposal.description || 'N/A', eventTitle: proposal.title || 'N/A', proposalStatus: proposal.status,
             };
             setSelectedProposalDetail(detailedDataForPopup);
        } catch (err: any) {
            console.error("HOD: Error fetching proposal detail:", err);
             if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) { setActionError("Authentication error."); handleLogout(); }
                else { setActionError(`Failed to load details: ${ (axiosError.response?.data as any)?.message || axiosError.message }`); }
            } else { setActionError(`An unknown error occurred: ${err.message}`); }
        } finally {
            setIsPopupLoading(false);
        }
    }, [localToken, currentUser, handleLogout]);

    // --- Action Handlers (Approve: POST, Reject: DELETE, Review: PUT) ---
    const handleApprove = useCallback(async (proposalId: string) => {
        if (!localToken || !currentUser || currentUser.role !== 'hod') return;
        setIsActionLoading(true); setActionError(null);
        const approveEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // POST
        try {
            console.log(`HOD: Approving proposal ${proposalId} via POST`);
            await axios.post(approveEndpoint, {}, { headers: { Authorization: `Bearer ${localToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, });
            console.log(`HOD: Proposal ${proposalId} approved.`);
            refreshProposals(); closePopup();
        } catch (err: any) {
             console.error("HOD: Approve error:", err);
             if (axios.isAxiosError(err)) {
                 const axiosError = err as AxiosError; setActionError(`Failed to approve: ${ (axiosError.response?.data as any)?.message || axiosError.message }`);
                 if (axiosError.response?.status === 401) handleLogout();
             } else { setActionError(`Unknown error during approval: ${err.message}`); }
        } finally { setIsActionLoading(false); }
    }, [localToken, currentUser, refreshProposals, handleLogout]);

    const handleReject = useCallback(async (proposalId: string, reason: string) => {
        // Note: Reason is captured but NOT sent with DELETE as per API docs
        if (!localToken || !currentUser || currentUser.role !== 'hod') return;
        if (!reason.trim()) { setActionError("Rejection reason required."); return; }
        setIsActionLoading(true); setActionError(null);
        const rejectEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // DELETE
        console.warn(`HOD: Rejecting proposal ${proposalId} via DELETE. Reason ("${reason}") will not be sent.`);
        try {
             console.log(`HOD: Rejecting proposal ${proposalId} via DELETE`);
             await axios.delete(rejectEndpoint, { headers: { Authorization: `Bearer ${localToken}`, Accept: 'application/json', }, });
             console.log(`HOD: Proposal ${proposalId} rejected.`);
             refreshProposals(); closePopup();
         } catch (err: any) {
             console.error("HOD: Reject error (DELETE):", err);
             if (axios.isAxiosError(err)) {
                 const axiosError = err as AxiosError; let errMsg = (axiosError.response?.data as any)?.message || axiosError.message;
                 // Add specific error messages
                 if (axiosError.response?.status === 409) errMsg = `Could not reject. Proposal might be already processed. (${errMsg})`;
                 else if (axiosError.response?.status === 404) errMsg = `Proposal not found. (${errMsg})`;
                 setActionError(`Failed to reject: ${errMsg}`);
                 if (axiosError.response?.status === 401) handleLogout();
             } else { setActionError(`Unknown error during rejection: ${err.message}`); }
         } finally { setIsActionLoading(false); }
    }, [localToken, currentUser, refreshProposals, handleLogout]);

    const handleReview = useCallback(async (proposalId: string, comments: string) => {
        if (!localToken || !currentUser || currentUser.role !== 'hod') return;
        if (!comments.trim()) { setActionError("Review comments required."); return; }
        setIsActionLoading(true); setActionError(null);
        const reviewEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // PUT with message
        try {
            console.log(`HOD: Submitting review message for ${proposalId} via PUT`);
            await axios.put(reviewEndpoint, { message: comments }, { // Body: { message: comments }
                headers: { Authorization: `Bearer ${localToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
            });
            console.log(`HOD: Review message for ${proposalId} submitted.`);
            refreshProposals(); closePopup();
        } catch (err: any) {
             console.error("HOD: Review/message error:", err);
             if (axios.isAxiosError(err)) {
                 const axiosError = err as AxiosError; let errMsg = (axiosError.response?.data as any)?.message || axiosError.message;
                 if (axiosError.response?.status === 422) errMsg = `Validation failed. Check comments. (${errMsg})`;
                 else if (axiosError.response?.status === 409) errMsg = `Could not submit review. Status may have changed. (${errMsg})`;
                 setActionError(`Failed to submit review: ${errMsg}`);
                 if (axiosError.response?.status === 401) handleLogout();
             } else { setActionError(`Unknown error during review submission: ${err.message}`); }
        } finally { setIsActionLoading(false); }
    }, [localToken, currentUser, refreshProposals, handleLogout]);


    // --- Popup Handling ---
    const closePopup = () => { setSelectedProposalDetail(null); setActionError(null); };
    const handleListItemClick = (proposalItem: HODProposalListItem) => { fetchProposalDetail(proposalItem.id); };
    const handleCalendarEventClick = (eventInfo: any) => {
         const proposalId = eventInfo.event.id;
         if (proposalId) { fetchProposalDetail(proposalId); }
         else { console.warn("Calendar event clicked, but no ID found:", eventInfo); }
     };

    // --- Render Logic ---
    if (!authCheckComplete || loading) {
        return ( <div className="flex justify-center items-center h-screen"><span className="loading loading-lg loading-spinner text-primary"></span><span className="ml-3 text-lg">Loading...</span></div> );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                 <div className={`alert ${error.startsWith("Access Denied") ? 'alert-warning' : 'alert-error'} shadow-lg max-w-md mb-4`}>
                     <div> <svg /* icon */ >{error.startsWith("Access Denied") ? <path /* warn */ /> : <path /* error */ />}</svg> <span>{error}</span> </div>
                 </div>
                 {localToken && currentUser && currentUser.role === 'hod' && !error.startsWith("Access Denied") && ( <button onClick={() => fetchProposals(localToken)} className="btn btn-primary">Retry</button> )}
                 {!localToken && ( <button onClick={() => router.push('/')} className="btn btn-secondary mt-2">Login</button> )}
                 {localToken && !error.startsWith("Access Denied") && ( <button onClick={handleLogout} className="btn btn-ghost mt-2">Logout</button> )}
            </div>
        );
    }

    // --- Data Derivations ---
    const validProposals = Array.isArray(proposals) ? proposals : [];
    const approvedProposalsCount = validProposals.filter(p => p?.status === 'Approved').length;
    const pendingProposalsCount = validProposals.filter(p => p?.status === 'Pending').length;
    const rejectedProposalsCount = validProposals.filter(p => p?.status === 'Rejected').length;
    const reviewProposalsCount = validProposals.filter(p => p?.status === 'Review').length;
    const totalProposalsCount = validProposals.length;
    const recentPendingProposals = [...validProposals].filter(p => p.status === 'Pending').sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    // --- JSX Return ---
    return (
        <div className="hod-dashboard p-4 md:p-6 space-y-6  min-h-screen bg-white text-black">
            <h1 className="text-2xl md:text-3xl font-bold text-base-600 mb-4 text">HOD Dashboard</h1>
            <Stats {...{totalProposalsCount, approvedProposalsCount, pendingProposalsCount, rejectedProposalsCount, reviewProposalsCount}} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-6">
                     <Recents recentAppliedProposals={recentPendingProposals.map(p => ({ id: String(p.id), title: p.title || 'N/A', status: p.status, submissionTimestamp: p.created_at, organizer: p.user?.name || `User ${p.user_id}`, convenerEmail: p.user?.email || `user${p.user_id}@example.com`, originalItem: p }))} handleProposalClick={handleListItemClick} />
                 </div>
                 <div className="lg:col-span-2 space-y-6">
                     <Overview eventProposals={validProposals.map(p => ({ id: String(p.id), title: p.title || 'N/A', date: p.start, organizer: p.user?.name || `User ${p.user_id}`, status: p.status, convenerName: p.user?.name || `User ${p.user_id}`, category: p.category || 'N/A', originalItem: p }))} handleProposalClick={handleListItemClick} />
                 </div>
            </div>
             <div className="mt-6">
                 <CalendarView proposals={validProposals.map(p => ({ id: String(p.id), title: p.title || 'N/A', date: p.start, start: p.start, end: p.end, status: p.status, category: p.category, description: p.description, submissionTimestamp: p.created_at, organizer: p.user?.name || `User ${p.user_id}`, convenerName: p.user?.name || `User ${p.user_id}`, convenerEmail: p.user?.email || `user${p.user_id}@example.com`, email: p.user?.email || `user${p.user_id}@example.com`, cost: (p as any).fund_uni || 0, estimatedBudget: (p as any).fund_uni || 0, designation: '', detailedBudget: [], durationEvent: '', eventDate: p.start, eventDescription: p.description, eventEndDate: p.end, eventStartDate: p.start, eventTitle: p.title, organizingDepartment: '', proposalStatus: p.status, tags: [p.status] }))} onEventClick={handleCalendarEventClick} />
             </div>
            {(selectedProposalDetail || isPopupLoading) && (
                 <Popup selectedProposal={!isPopupLoading ? selectedProposalDetail : null} closePopup={closePopup} onAccept={handleApprove} onReject={handleReject} onReview={handleReview} isLoading={isActionLoading} errorMessage={actionError} isDetailLoading={isPopupLoading} />
            )}
        </div>
    );
};

export default HODDashboard;