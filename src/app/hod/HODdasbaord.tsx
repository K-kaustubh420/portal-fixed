// pages/hod/dashboard.tsx (or app/hod/dashboard/page.tsx)
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Overview from './overview'; // Adjust path if needed
import Stats from './stats';       // Adjust path if needed
import Popup from './Popup';         // Adjust path - Use the generic Popup component
import Recents from './recents';    
import CalendarView from './CalnderView'; // <-- VERIFY NAME & PATH
import { useAuth } from '@/context/AuthContext'; // Use the Auth Context

// --- HOD Specific Interfaces ---

// Interface for LIST items from /api/hod/proposals
interface HODProposalListItem {
    id: number;
    user_id: number;
    title: string;
    description: string; // Likely truncated
    start: string;
    end: string;
    category: string;
    status: string; // Keep raw status, will lowercase later
    awaiting: string | null;
    created_at: string;
    updated_at: string;
    user?: { // Submitter info might be included
        id: number;
        name: string;
        email: string;
        department?: string;
        designation?: string;
    };
    // Add other relevant list fields if provided by API
}

// --- Detailed Proposal Interfaces (Based on HOD GET /proposals/{id} response) ---
// Using consistent nested structure like ConvenerDashboard for clarity
interface HODDetailedProposalUser { id: number; name: string; email: string; department?: string; designation?: string; role?: string; }
interface HODDetailedProposalChiefPivot { proposal_id: number; chief_id: number; reason: string | null; hotel_name: string | null; hotel_address: string | null; hotel_duration: number | null; hotel_type: 'srm' | 'others' | null; travel_name: string | null; travel_address: string | null; travel_duration: number | null; travel_type: 'srm' | 'others' | null; created_at: string; updated_at: string; }
interface HODDetailedProposalChief { id: number; name: string; designation: string; address: string; phone: string; pan: string; created_at: string; updated_at: string; pivot: HODDetailedProposalChiefPivot; }
interface HODDetailedProposalItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface HODDetailedProposalSponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface HODDetailedProposalMessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface HODDetailedProposalMessage { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: HODDetailedProposalMessageUser; }

// Interface for the main DETAILED proposal object WITHIN the HOD GET response
interface HODDetailedProposal {
    id: number;
    user_id: number;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    past: string | null;
    other: string | null;
    status: string; // Raw status
    participant_expected: number | null;
    participant_categories: string | null;
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    awaiting: string | null;
    created_at: string;
    updated_at: string;
    user: HODDetailedProposalUser; // Submitter/Convener details (API sends this nested)
    chiefs: HODDetailedProposalChief[] | null;
    items: HODDetailedProposalItem[];
    sponsors: HODDetailedProposalSponsor[];
    messages: HODDetailedProposalMessage[];
    // Removed HOD specific 'cheif_reason', etc. Use data from 'chiefs' array instead for consistency.
}

// Interface for the *entire* HOD GET /proposals/{id} response structure
interface HODDetailedProposalResponse {
     proposal: HODDetailedProposal;
     // The other arrays (chiefs, items, sponsors, messages) seem NESTED inside proposal in the provided JSON
     // If they were top-level siblings, add them here:
     // chiefs?: HODDetailedProposalChief[];
     // items?: HODDetailedProposalItem[];
     // ...etc
}

// Interface for the data structure passed TO THE POPUP component
// (Matches the structure defined in ConvenerDashboard and expected by Popup.tsx)
interface PopupProposal {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string; // Use consistent lowercase
    eventStartDate: string;
    eventEndDate: string;
    submissionTimestamp: string;
    date: string; // Alias

    // Convener/Organizer Details
    organizer: string; // Department
    convenerName: string;
    convenerEmail?: string;
    convenerDesignation?: string;

    // Participant Details
    participantExpected?: number | null;
    participantCategories?: string[] | null;

    // Chief Guest Details
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    chiefGuestAddress?: string;
    chiefGuestPhone?: string;
    chiefGuestPan?: string;
    chiefGuestReason?: string;

    // Accommodation Details
    hotelName?: string;
    hotelAddress?: string;
    hotelDuration?: number;
    hotelType?: 'srm' | 'others' | null;

    // Travel Details
    travelName?: string;
    travelAddress?: string;
    travelDuration?: number;
    travelType?: 'srm' | 'others' | null;

    // Financial Details
    estimatedBudget?: number;
    fundingDetails: {
        universityFund?: number;
        registrationFund?: number;
        sponsorshipFund?: number;
        otherSourcesFund?: number;
    };
    detailedBudget: HODDetailedProposalItem[]; // Use HOD Item structure
    sponsorshipDetailsRows: HODDetailedProposalSponsor[]; // Use HOD Sponsor structure

    // Other Form Details
    pastEvents?: string | null;
    relevantDetails?: string | null;

    // Status & Messages
    awaiting?: string | null;
    messages: HODDetailedProposalMessage[]; // Pass full messages
}
// --- End Interfaces ---


const API_BASE_URL = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

// --- HOD Dashboard Component ---
const HODDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<HODProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const { token, user, logout, isLoading: isAuthLoading } = useAuth(); // Use context
    const router = useRouter();

    // --- Effect for Auth Check & Initial Fetch ---
    useEffect(() => {
        if (isAuthLoading) { setLoading(true); return; }

        if (user && token && user.role === 'hod') {
            console.log("HODDashboard: User is HOD, fetching proposals...");
            fetchProposals(token);
        } else if (user && token && user.role !== 'hod') {
             console.error("HODDashboard: Access denied, user role is not HOD.");
             setError("Access Denied: You do not have HOD privileges.");
             setLoading(false);
        } else {
            console.log("HODDashboard: Not authorized or missing auth data.");
            setError("Authentication failed. Please log in."); // Set error before logout
            logout(); // Use logout from context
            setLoading(false);
        }
    }, [isAuthLoading, user, token, logout]); // Include fetchProposals after defining it

    // --- Data Fetching ---
    const fetchProposals = useCallback(async (authToken: string) => {
        if (!user || user.role !== 'hod') return; // Re-check auth
        setLoading(true); setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/hod/proposals`;
        try {
            console.log(`HOD: Fetching proposals from: ${proposalEndpoint}`);
            const response = await axios.get<any>(proposalEndpoint, { // Use any initially to inspect structure
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
            });
            console.log("HOD: Raw List Response:", response.data);

            // Adapt based on actual structure logged above
            const proposalsArray: HODProposalListItem[] | null =
                Array.isArray(response.data) ? response.data :
                Array.isArray(response.data?.data) ? response.data.data :
                Array.isArray(response.data?.proposals) ? response.data.proposals :
                null;

            if (proposalsArray) {
                 const cleanedData = proposalsArray.map(p => ({
                     ...p,
                     status: p.status?.toLowerCase() || 'unknown', // Standardize status
                     user: p.user || { id: -1, name: 'Unknown Submitter', email: 'N/A' }
                 }));
                 setProposals(cleanedData);
            } else {
                console.error("HOD API Error: Proposal list format not recognized.", response.data);
                setProposals([]);
                setError("Received invalid proposal list format.");
            }
        } catch (err: any) {
             console.error("HOD: Error fetching proposals:", err);
             if (axios.isAxiosError(err)) { const axiosError = err as AxiosError; if (axiosError.response?.status === 401) { setError("Authentication error."); logout(); } else { setError(`Failed to fetch proposals: ${ (axiosError.response?.data as any)?.message || axiosError.message }`); } }
             else { setError(err.message || 'An unknown error occurred'); }
            setProposals([]);
        } finally {
            setLoading(false);
        }
    }, [user, logout]); // Add dependencies

    // Refetch proposals helper
    const refreshProposals = useCallback(() => {
        if (token && user && user.role === 'hod') { fetchProposals(token); }
    }, [token, user, fetchProposals]); // Include fetchProposals


    // Fetch proposal detail
    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'hod') return;

        setIsPopupLoading(true); setActionError(null); setSelectedProposalDetail(null);
        const detailEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            console.log(`HOD: Fetching proposal detail from: ${detailEndpoint}`);
            const response = await axios.get<HODDetailedProposalResponse>(detailEndpoint, { // Use the specific response type
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            console.log("HOD: Proposal detail fetched:", response.data);

            // Ensure the proposal object exists
            const proposalData = response.data.proposal;
            if (!proposalData) { throw new Error("Proposal data missing in API response."); }

            // --- Mapping Logic ---
             const submitter = proposalData.user || {}; // Get submitter from nested proposal.user
             const primaryChief = proposalData.chiefs?.[0]; // Get chief from nested proposal.chiefs
             const chiefPivot = primaryChief?.pivot;

             const calculatedBudget = (proposalData.fund_uni ?? 0) + (proposalData.fund_registration ?? 0) + (proposalData.fund_sponsor ?? 0) + (proposalData.fund_others ?? 0);

             const parseParticipantCategories = (categoriesString: string | null): string[] | null => {
                if (!categoriesString) return null; try { const p = JSON.parse(categoriesString); return Array.isArray(p)?p.map(String):null; } catch(e){ console.error("Parse error:", e); return null;}
             };
             const participantCats = parseParticipantCategories(proposalData.participant_categories);

            // Map to PopupProposal interface
            const detailedDataForPopup: PopupProposal = {
                id: String(proposalData.id),
                title: proposalData.title || 'N/A',
                description: proposalData.description || 'N/A',
                category: proposalData.category || 'N/A',
                status: proposalData.status?.toLowerCase() || 'unknown', // Lowercase status
                eventStartDate: proposalData.start,
                eventEndDate: proposalData.end,
                submissionTimestamp: proposalData.created_at,
                date: proposalData.start, // Alias

                // Convener/Organizer (Submitter)
                organizer: submitter.department || 'N/A',
                convenerName: submitter.name || `User ID: ${proposalData.user_id}`,
                convenerEmail: submitter.email || undefined,
                convenerDesignation: submitter.designation || undefined,

                // Participants
                participantExpected: proposalData.participant_expected,
                participantCategories: participantCats,

                // Chief Guest (from nested chiefs array)
                chiefGuestName: primaryChief?.name,
                chiefGuestDesignation: primaryChief?.designation,
                chiefGuestAddress: primaryChief?.address,
                chiefGuestPhone: primaryChief?.phone,
                chiefGuestPan: primaryChief?.pan,
                chiefGuestReason: chiefPivot?.reason || undefined,

                // Accommodation & Travel (from Pivot within chief)
                hotelName: chiefPivot?.hotel_name || undefined,
                hotelAddress: chiefPivot?.hotel_address || undefined,
                hotelDuration: chiefPivot?.hotel_duration ?? undefined,
                hotelType: chiefPivot?.hotel_type,
                travelName: chiefPivot?.travel_name || undefined,
                travelAddress: chiefPivot?.travel_address || undefined,
                travelDuration: chiefPivot?.travel_duration ?? undefined,
                travelType: chiefPivot?.travel_type,

                // Financial
                estimatedBudget: calculatedBudget,
                fundingDetails: {
                    universityFund: proposalData.fund_uni ?? undefined,
                    registrationFund: proposalData.fund_registration ?? undefined,
                    sponsorshipFund: proposalData.fund_sponsor ?? undefined,
                    otherSourcesFund: proposalData.fund_others ?? undefined,
                },
                // Pass detailed items/sponsors arrays directly (assuming they are nested)
                detailedBudget: proposalData.items || [],
                sponsorshipDetailsRows: proposalData.sponsors || [],

                // Other Form Details
                pastEvents: proposalData.past,
                relevantDetails: proposalData.other,

                // Status & Messages (assuming messages are nested)
                awaiting: proposalData.awaiting,
                messages: proposalData.messages || [],
             };
             setSelectedProposalDetail(detailedDataForPopup);

        } catch (err: any) {
            console.error("HOD: Error fetching proposal detail:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to load proposal details";
            setActionError(errorMsg); // Use actionError to display error in popup context if needed
            setSelectedProposalDetail(null);
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally {
            setIsPopupLoading(false);
        }
    }, [token, user, logout]);

     // --- Action Handlers (Using HOD Endpoints) ---
    const handleApprove = useCallback(async (proposalId: string) => {
        if (!token || !user || user.role !== 'hod') return;
        setIsActionLoading(true); setActionError(null);
        const approveEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // POST
        try {
            console.log(`HOD: Approving proposal ${proposalId} via POST`);
            await axios.post(approveEndpoint, {}, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            console.log(`HOD: Proposal ${proposalId} approved.`);
            refreshProposals(); closePopup(); // Refresh list and close popup on success
        } catch (err: any) {
            console.error("HOD: Approve error:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to approve proposal";
            setActionError(errorMsg); // Set error to display in Popup
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]); // Include refreshProposals & logout

    const handleReject = useCallback(async (proposalId: string, reason: string) => {
        if (!token || !user || user.role !== 'hod') return;
        if (!reason.trim()) { setActionError("Rejection reason required."); return; } // Keep client-side check
        setIsActionLoading(true); setActionError(null);
        const rejectEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // DELETE

        // Check if API needs reason in DELETE (unlikely but possible)
        // const config = { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } };
        // if (API_REQUIRES_DELETE_BODY) { config.data = { message: reason }; } // Example if needed

        console.warn(`HOD: Rejecting proposal ${proposalId} via DELETE.`);
        try {
            await axios.delete(rejectEndpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            console.log(`HOD: Proposal ${proposalId} rejected.`);
            refreshProposals(); closePopup();
        } catch (err: any) {
            console.error("HOD: Reject error (DELETE):", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to reject proposal";
            setActionError(errorMsg); // Set error to display in Popup
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]); // Include refreshProposals & logout

    const handleReview = useCallback(async (proposalId: string, comments: string) => {
        if (!token || !user || user.role !== 'hod') return;
        if (!comments.trim()) { setActionError("Review comments required."); return; }
        setIsActionLoading(true); setActionError(null);
        const reviewEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`; // PUT with message
        try {
            console.log(`HOD: Submitting review message for ${proposalId} via PUT`);
            await axios.put(reviewEndpoint, { message: comments }, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
            });
            console.log(`HOD: Review message for ${proposalId} submitted.`);
            refreshProposals(); closePopup(); // Refresh and close on success
        } catch (err: any) {
             console.error("HOD: Review/message error:", err);
             const errorMsg = err.response?.data?.message || err.message || "Failed to submit review";
             setActionError(errorMsg); // Set error to display in Popup
             if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]); // Include refreshProposals & logout


    // --- Popup Handling ---
    const closePopup = () => { setSelectedProposalDetail(null); setActionError(null); }; // Clear action error on close
    const handleListItemClick = (proposalItem: HODProposalListItem) => { fetchProposalDetail(proposalItem.id); };
    const handleCalendarEventClick = (eventInfo: any) => {
         const proposalId = eventInfo.event.id;
         if (proposalId) { fetchProposalDetail(proposalId); }
         else { console.warn("Calendar event clicked, but no ID found:", eventInfo); }
     };


     // --- Render Logic ---
    if (isAuthLoading || loading) { return ( <div className="flex justify-center items-center h-screen bg-white"><span className="loading loading-bars loading-lg text-primary"></span></div> ); }
    if (error) { /* ... (Error display logic remains similar) ... */ return ( <div className="flex flex-col items-center justify-center h-screen p-4"> <div className={`alert ${error.startsWith("Access Denied") ? 'alert-warning' : 'alert-error'} shadow-lg max-w-md mb-4`}> <div> <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">{error.startsWith("Access Denied") ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}</svg> <span>{error}</span> </div> </div> {token && user && user.role === 'hod' && !error.startsWith("Access Denied") && ( <button onClick={refreshProposals} className="btn btn-primary">Retry</button> )} <button onClick={logout} className="btn btn-ghost mt-2">Logout</button> </div> ); }
    if (!user || user.role !== 'hod') { /* ... (Redirect or access denied message) ... */ return <div className="flex justify-center items-center h-screen">Access Denied. Redirecting...</div>; }


    // --- Data Derivations ---
    const validProposals = Array.isArray(proposals) ? proposals : [];
    const approvedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'approved').length; // Use lowercase for counts
    const pendingCount = validProposals.filter(p => p?.status?.toLowerCase() === 'pending').length;
    const rejectedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'rejected').length;
    const reviewCount = validProposals.filter(p => p?.status?.toLowerCase() === 'review').length;
    const totalCount = validProposals.length;
    // HOD Recents: Show pending first, then review, sorted newest first
    const recentProposalsForHOD = [...validProposals]
        .filter(p => ['pending', 'review'].includes(p.status)) // Filter for pending/review
        .sort((a, b) => {
            // Prioritize pending
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            // If same status, sort by date
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 5); // Limit to 5

    // --- JSX Return ---
    return (
        <div className="hod-dashboard p-4 md:p-6 space-y-6 min-h-screen bg-gray-50 text-black">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">HOD Dashboard</h1>
            <Stats totalProposalsCount={totalCount} approvedProposalsCount={approvedCount} pendingProposalsCount={pendingCount} rejectedProposalsCount={rejectedCount} reviewProposalsCount={reviewCount} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-6">
                     <Recents
                        // Use recentProposalsForHOD derived above
                        recentAppliedProposals={recentProposalsForHOD.map(p => ({
                            id: String(p.id),
                            title: p.title || 'N/A',
                            status: p.status, // Pass the lowercase status
                            date: p.created_at,
                            originalItem: p
                        }))}
                        handleProposalClick={handleListItemClick}
                     />
                 </div>
                 <div className="lg:col-span-2 space-y-6">
                     <Overview
                         // Pass necessary fields, using lowercase status
                         eventProposals={validProposals.map(p => ({
                             id: String(p.id),
                             title: p.title || 'N/A',
                             start: p.start,
                             end: p.end,
                             description: p.description?.substring(0, 100) + (p.description && p.description.length > 100 ? '...' : '') || '-',
                             awaiting: p.awaiting,
                             status: p.status, // Pass lowercase status
                             originalItem: p
                         }))}
                         handleProposalClick={handleListItemClick}
                     />
                 </div>
            </div>
             <div className="mt-6 bg-white p-4 rounded-lg shadow">
                 <CalendarView
                      proposals={validProposals.map(p => ({
                         id: String(p.id),
                         title: p.title || 'N/A',
                         start: p.start,
                         end: p.end,
                         status: p.status, // Pass lowercase status
                         // --- Map other fields required by CalendarView, using defaults ---
                         date: p.start,
                         organizer: p.user?.department || 'N/A',
                         convenerName: p.user?.name || `User ${p.user_id}`,
                         email: p.user?.email || undefined,
                         cost: 0, // Default or calculate if possible from list data
                         category: p.category || 'N/A',
                         description: p.description || 'N/A',
                         designation: p.user?.designation || undefined,
                         detailedBudget: [], durationEvent: '', estimatedBudget: 0, eventDate: p.start, eventDescription: p.description || 'N/A', eventEndDate: p.end, eventStartDate: p.start, eventTitle: p.title || 'N/A', organizingDepartment: p.user?.department || 'N/A', proposalStatus: p.status, submissionTimestamp: p.created_at, convenerEmail: p.user?.email || undefined, location: undefined, chiefGuestName: undefined, chiefGuestDesignation: undefined, fundingDetails: undefined, pastEvents: undefined, relevantDetails: undefined, sponsorshipDetails: undefined, sponsorshipDetailsRows: undefined, rejectionMessage: undefined, reviewMessage: undefined, clarificationMessage: undefined, messages: []
                     }))}
                     onEventClick={handleCalendarEventClick}
                 />
             </div>

            {/* Conditionally render Popup - Pass HOD-specific handlers */}
            {(selectedProposalDetail || isPopupLoading) && (
                 <Popup
                    selectedProposal={isPopupLoading ? null : selectedProposalDetail}
                    closePopup={closePopup}
                    // Pass HOD Action Handlers
                    onAccept={handleApprove}
                    onReject={handleReject}
                    onReview={handleReview}
                    // Pass Loading/Error States
                    isLoading={isActionLoading}
                    errorMessage={actionError}
                    isDetailLoading={isPopupLoading}
                    // Pass current user role for conditional logic inside Popup if needed
                    currentUserRole={user?.role}
                    // onProposalUpdated={refreshProposals} // Optional: called after successful actions
                 />
            )}
        </div>
    );
};

export default HODDashboard;