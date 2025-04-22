// DeanDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview';       // Ensure path is correct
import Stats from './stats';           // Ensure path is correct
import Popup from './popup';           // Ensure path is correct
import Recents from './recents';         // Ensure path is correct
import CalendarView from './calendarview'; // Ensure path is correct
import { useAuth } from '@/context/AuthContext'; // Ensure path is correct
import { User } from '@/lib/users'; // Ensure path is correct and User interface matches API 'chief' structure

// --- Interfaces based on API Docs ---

interface Item {
    id: number; proposal_id: number; category: string; sub_category: string; type: string | null; quantity: number; cost: number; amount: number; created_at: string | null; updated_at: string | null; status: string;
}
interface Sponsor {
    id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string | null; updated_at: string | null;
}
interface Message {
    id: number; proposal_id: number; user_id: number; message: string; created_at: string | null; updated_at: string | null;
}

// Interface matching items from GET /api/dean/proposals LIST response (API Structure)
interface ProposalListItem {
    id: number; user_id: number; chief_id: number | null; title: string; description: string; start: string; end: string; category: string; past: string | null; other: string | null; status: string; participant_expected: number | null; participant_categories: string | null; fund_uni: number | null; fund_registration: number | null; fund_sponsor: number | null; fund_others: number | null; created_at: string | null; updated_at: string | null; cheif_reason: string | null; cheif_hotel_name: string | null; cheif_hotel_address: string | null; cheif_hotel_duration: string | null; cheif_hotel_type: string | null; cheif_travel_name: string | null; cheif_travel_address: string | null; cheif_travel_duration: string | null; cheif_travel_type: string | null;
}

// Interface matching the FULL response of GET /api/dean/proposals/{proposal} (API Structure)
interface DetailedProposalResponse {
    proposal: ProposalListItem; chief: User | null; items: Item[]; sponsors: Sponsor[]; messages: Message[]; user?: User | null; // Submitter details (optional from API)
}

// --- Unified Interface (Expected by ALL Child Components) ---
// Renamed to avoid conflicts with child component interfaces
interface UnifiedProposal {
    // Required by most/all
    id: string; // String ID
    title: string;
    status: string; // Use 'status' name
    date: string; // Generally maps to start date
    organizer: string; // Placeholder or mapped name/dept
    convenerName: string; // Placeholder or mapped name

    // Required specifically by Recents (non-optional strings)
    convenerEmail: string;
    submissionTimestamp: string; // maps to 'created_at', ensure non-null string

    // Required specifically by CalendarView / Popup
    description: string;
    category: string;
    eventStartDate: string; // maps to 'start'
    eventEndDate: string; // maps to 'end'
    eventDate: string; // maps to 'start' (for CalendarView)
    eventDescription: string; // maps to 'description' (for CalendarView)
    eventTitle: string; // maps to 'title' (for CalendarView)
    cost: number; // Calculated
    detailedBudget: Item[]; // Use API's Item interface directly
    estimatedBudget: number; // Use calculated cost
    email: string; // Required by CalendarView (non-optional string)

    // Optional fields used by CalendarView/Popup
    location?: string; // Default ''
    chiefGuestName?: string; // Map from detailed 'chief.name'
    chiefGuestDesignation?: string; // Map from detailed 'chief.designation'
    designation?: string; // Map from detailed 'user.designation' (submitter)
    durationEvent?: string; // Default ''
    fundingDetails?: { registrationFund?: number | null; sponsorshipFund?: number | null; universityFund?: number | null; otherSourcesFund?: number | null; };
    organizingDepartment?: string; // Map from detailed 'user.department.name' if possible
    pastEvents?: string | string[] | null; // Map from 'past' field
    proposalStatus?: string; // Redundant with 'status'
    relevantDetails?: string | null; // Map from 'other' field?
    sponsorshipDetails?: Sponsor[]; // Use API's Sponsor interface directly
    sponsorshipDetailsRows?: any[]; // Maybe map from Sponsor[]? Default []
    rejectionMessage?: string; // Extract from messages
    reviewMessage?: string; // Extract from messages (clarification/review)
    clarificationMessage?: string; // Extract from messages
    tags?: string[]; // Add based on status for CalendarView

    // Raw detailed data potentially needed by Popup logic
    messages?: Message[];
    chief?: User | null;
    user?: User | null; // Submitter details
}

// --- API URL ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net"; // Use HTTPS

// --- Component Logic ---
const DeanDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalData, setSelectedProposalData] = useState<DetailedProposalResponse | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);

    const { token, user, logout } = useAuth();

    // --- Data Fetching (fetchProposals, fetchProposalDetail) ---
    const fetchProposals = useCallback(async () => {
         if (!token || !user || user.role !== 'dean') {
            setError(user ? "Access denied. User is not a Dean." : "User not authenticated."); setLoading(false); return; }
         setLoading(true); setError(null);
         const proposalEndpoint = `${API_BASE_URL}/api/dean/proposals`;
         try {
             // Use <any> for initial fetch to handle potential structure deviations
             const response = await axios.get<any>(proposalEndpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
             const fetchedData = response.data; console.log("Raw API Response Data (List):", fetchedData);

             let proposalsToSet: ProposalListItem[] = []; // Default to empty array

             // Defensively check the structure before setting state
             if (Array.isArray(fetchedData)) {
                 proposalsToSet = fetchedData as ProposalListItem[]; // Assume items match ProposalListItem if it's an array
                 console.log("API returned an array. Count:", proposalsToSet.length);
             } else if (fetchedData && typeof fetchedData === 'object' && Array.isArray((fetchedData as any).data)) {
                 // Handle common wrapper object like { data: [...] }
                 console.warn("API Warning: Expected direct array from /api/dean/proposals, but received object with 'data' property.");
                 proposalsToSet = (fetchedData as any).data as ProposalListItem[];
             } else if (fetchedData) {
                 // Log error if it's something else (object without 'data' array, string, etc.)
                 console.error("API Error: Expected an array or { data: [...] } from /api/dean/proposals, but received:", fetchedData);
             } else {
                 // Handle null or undefined response
                 console.error("API Error: Received empty or invalid response from /api/dean/proposals.");
             }
             setProposals(proposalsToSet); // Always set an array
         } catch (err: any) { console.error("Error fetching Dean proposals:", err);
             if (axios.isAxiosError(err)) { const axiosError = err as AxiosError;
                 if (axiosError.response?.status === 401) { setError("Authentication failed."); logout();
                 } else if (axiosError.response?.status === 403) { setError("Forbidden.");
                 } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message.includes('CORS')) { setError(`Network Error: ${axiosError.message}. Check connection/CORS.`);
                 } else { setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals'); }
             } else { setError(err.message || 'An unknown error occurred'); }
             setProposals([]); // Reset to empty array on error
         } finally { setLoading(false); }
    }, [token, user, logout]);

    useEffect(() => {
        // Fetch proposals only if the user is logged in and is a dean
        if (user?.role === 'dean') {
             fetchProposals();
        } else if (user) {
             // User is logged in but not a dean
             setError("Access denied. This dashboard is for Deans only.");
             setLoading(false);
        }
        // If user is null (initially), wait for auth context to provide it
    }, [fetchProposals, user]); // Rerun when user or fetchProposals changes

    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'dean') {
            console.error("fetchProposalDetail cancelled: Missing token, user, or incorrect role.");
            return;
        }
        setIsPopupLoading(true); setError(null);
        const detailEndpoint = `${API_BASE_URL}/api/dean/proposals/${proposalId}`;
        try {
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            console.log("Proposal detail fetched for Dean:", response.data);
            // Basic validation of the response structure
            if (response.data && response.data.proposal && response.data.items !== undefined) {
                 setSelectedProposalData(response.data);
            } else {
                 console.error("Invalid structure received for detailed proposal:", response.data);
                 setError("Received invalid data format for proposal detail.");
                 setSelectedProposalData(null); // Clear any previous data
            }
        } catch (err: any) { console.error("Error fetching proposal detail:", err);
             if (axios.isAxiosError(err)) { const axiosError = err as AxiosError;
                 if (axiosError.response?.status === 401) { setError("Authentication failed."); logout();
                 } else if (axiosError.response?.status === 403) { setError("Forbidden to view this detail.");
                 } else if (axiosError.response?.status === 404) { setError("Proposal not found.");
                 } else if (axiosError.code === 'ERR_NETWORK') { setError(`Network Error: ${axiosError.message}. Check connection/API status.`);
                 } else { setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch detail'); }
             } else { setError(err.message || 'An unknown error occurred fetching detail'); }
             setSelectedProposalData(null); // Clear selection on error
        } finally { setIsPopupLoading(false); }
    }, [token, user, logout]); // Added dependencies


    // --- Derived Data Calculation (Stats) ---
    const calculateStats = (proposalList: ProposalListItem[]) => {
         // Safety check added previously
         if (!Array.isArray(proposalList)) { console.error("calculateStats called with non-array"); return { approvedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, reviewProposalsCount: 0, totalProposalsCount: 0 }; }
         let approved = 0, pending = 0, rejected = 0, review = 0;
         proposalList.forEach(p => {
             // Ensure p is valid and has a status before proceeding
             if (!p || typeof p.status !== 'string') return;
             const status = p.status.toLowerCase();
             if (status === 'approved') approved++;
             else if (status === 'rejected') rejected++;
             else if (status === 'review') { review++; pending++; } // Assuming review counts as pending too
             else if (['pending', 'submitted', 'forwarded_dean', 'clarification_requested'].includes(status)) pending++;
         });
         return { approvedProposalsCount: approved, pendingProposalsCount: pending, rejectedProposalsCount: rejected, reviewProposalsCount: review, totalProposalsCount: proposalList.length };
    };
    // Calculate stats only if proposals is an array
    const stats = Array.isArray(proposals) ? calculateStats(proposals) : { approvedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, reviewProposalsCount: 0, totalProposalsCount: 0 };


    // --- Recent proposals sorting ---
    // Ensure proposals is an array before attempting to sort/slice
    const recentAppliedProposals = Array.isArray(proposals) ? [...proposals]
        .filter(p => p && p.created_at) // Filter valid items with creation date
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5) : [];


    // --- Mapping Function: ProposalListItem -> UnifiedProposal ---
    const mapListItemToProposal = (p: ProposalListItem): UnifiedProposal => {
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const placeholderEmail = `user${p.user_id}@example.com`; // Ensure non-empty
        const placeholderName = `User ID: ${p.user_id}`;
        const submissionTs = p.created_at || ''; // Ensure non-empty string

        const tags: string[] = [];
        const lowerStatus = p.status?.toLowerCase() || '';
         if (lowerStatus === 'approved') tags.push('Done');
         if (lowerStatus === 'rejected') tags.push('Rejected');
         if (lowerStatus === 'review' || lowerStatus === 'clarification_requested') tags.push('Review');

        // Construct the object ensuring required fields have defaults
        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal', // Add default for title
            description: p.description || '',
            category: p.category || 'Uncategorized',
            status: p.status || 'Unknown',
            date: p.start || '',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            submissionTimestamp: submissionTs,
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            organizer: placeholderName,
            convenerName: placeholderName,
            convenerEmail: placeholderEmail,
            email: placeholderEmail,
            cost: calculatedCost,
            estimatedBudget: calculatedCost,
            detailedBudget: [], // Default empty for list view
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: [], // Default empty for list view
            tags: tags,
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            designation: '', // Default empty
            durationEvent: '', // Default empty
            organizingDepartment: '', // Default empty
            // Optional fields like chiefGuestName, messages, etc., are omitted here
        };
    };

     // --- Mapping Function: DetailedProposalResponse -> UnifiedProposal ---
     const mapDetailResponseToProposal = (detailData: DetailedProposalResponse): UnifiedProposal | null => {
         // Add validation for the detailed data structure
         if (!detailData || !detailData.proposal) {
             console.error("mapDetailResponseToProposal received invalid detailData:", detailData);
             return null; // Return null if data is invalid
         }

         const p = detailData.proposal;
         const submitter = detailData.user;
         const chiefGuest = detailData.chief;
         const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
         const convenerName = submitter?.name || `User ID: ${p.user_id}`;
         const convenerEmail = submitter?.email || `user${p.user_id}@example.com`;
         const designation = submitter?.designation || '';
         const organizer = (typeof submitter?.department === 'object' && submitter.department && typeof (submitter.department as any).name === 'string') ? (submitter.department as any).name : `User ID: ${p.user_id}`;
         const organizingDept = (typeof submitter?.department === 'object' && submitter.department && typeof (submitter.department as any).name === 'string') ? (submitter.department as any).name : '';
         const submissionTs = p.created_at || '';

         let rejectionMsg = '', reviewMsg = '', clarificationMsg = '';
         detailData.messages?.forEach(msg => { // Basic message extraction logic
             if (p.status === 'Rejected' && !rejectionMsg) rejectionMsg = msg.message;
             if ((p.status === 'Review' || p.status === 'Clarification Requested') && !reviewMsg) reviewMsg = msg.message;
         });

         const tags: string[] = [];
         const lowerStatus = p.status?.toLowerCase() || '';
         if (lowerStatus === 'approved') tags.push('Done');
         if (lowerStatus === 'rejected') tags.push('Rejected');
         if (lowerStatus === 'review' || lowerStatus === 'clarification_requested') tags.push('Review');

         return {
             id: String(p.id),
             title: p.title || 'Untitled Proposal',
             description: p.description || '',
             category: p.category || 'Uncategorized',
             status: p.status || 'Unknown',
             date: p.start || '',
             eventStartDate: p.start || '',
             eventEndDate: p.end || '',
             submissionTimestamp: submissionTs,
             eventDate: p.start || '',
             eventDescription: p.description || '',
             eventTitle: p.title || 'Untitled Proposal',
             organizer: organizer,
             convenerName: convenerName,
             convenerEmail: convenerEmail,
             email: convenerEmail,
             designation: designation,
             cost: calculatedCost,
             estimatedBudget: calculatedCost,
             organizingDepartment: organizingDept,
             detailedBudget: detailData.items || [],
             durationEvent: '', // Calculate if needed
             fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
             sponsorshipDetails: detailData.sponsors || [],
             tags: tags,
             chiefGuestName: chiefGuest?.name || '',
             chiefGuestDesignation: chiefGuest?.designation || '',
             pastEvents: p.past || '',
             relevantDetails: p.other || '',
             rejectionMessage: rejectionMsg,
             reviewMessage: reviewMsg,
             clarificationMessage: clarificationMsg,
             messages: detailData.messages,
             chief: detailData.chief,
             user: detailData.user,
         };
     };


    // --- Event Handlers ---
     const handleProposalClick = useCallback((proposal: UnifiedProposal) => {
         // Use the string ID directly if fetchProposalDetail can handle it, otherwise parse
         const proposalIdNum = parseInt(proposal.id, 10);
         if (!isNaN(proposalIdNum)) {
             fetchProposalDetail(proposalIdNum);
         } else {
             console.error("Invalid numeric ID parsed from proposal:", proposal.id);
             setError("Could not load details for the selected proposal.");
         }
     }, [fetchProposalDetail]);

     const closePopup = () => setSelectedProposalData(null);
     const handleProposalUpdated = () => { fetchProposals(); closePopup(); };


    // --- Render Logic ---
     // Initial loading state
     if (loading && !error && proposals.length === 0) {
         return <div className="flex justify-center items-center h-screen"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
     }

     // Handle access denied separately
     if (user && user.role !== 'dean' && !loading) {
         return <div className="alert alert-error shadow-lg m-4"><div><span>Access Denied: This dashboard is for Deans only.</span></div></div>;
     }
     // Handle user not logged in (though AuthContext might handle this)
     if (!user && !loading) {
          return <div className="alert alert-warning shadow-lg m-4"><div><span>Please log in to view the dashboard.</span></div></div>;
     }

     // Display general error state, but not if only the popup is loading
     if (error && !isPopupLoading) {
         return <div className="alert alert-error shadow-lg m-4"><div><span>Error: {error}</span></div></div>;
     }

    // Map data for child components - ensure proposals is an array
    const proposalsForView: UnifiedProposal[] = Array.isArray(proposals) ? proposals.map(mapListItemToProposal) : [];
    const recentsForView: UnifiedProposal[] = Array.isArray(recentAppliedProposals) ? recentAppliedProposals.map(mapListItemToProposal) : [];
    const proposalForPopup: UnifiedProposal | null = selectedProposalData ? mapDetailResponseToProposal(selectedProposalData) : null;

    return (
        <div className="dean-dashboard p-4 md:p-6 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                Dean Dashboard
             </h1>

            {/* Stats Component */}
            <Stats {...stats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 space-y-6">
                     {/* Overview Component */}
                     <Overview
                         eventProposals={proposalsForView}
                         handleProposalClick={handleProposalClick}
                     />
                     {/* Recents Component */}
                     <Recents
                          recentAppliedProposals={recentsForView}
                          handleProposalClick={handleProposalClick}
                      />
                 </div>
                 {/* Optional Right Column can go here */}
            </div>

             {/* Calendar View */}
             <div className="mt-6">
                 <CalendarView proposals={proposalsForView} />
             </div>

            {/* Popup Modal - Render only if proposalForPopup is valid */}
            {proposalForPopup && (
                <Popup
                    selectedProposal={proposalForPopup}
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated}
                    authToken={token}
                    apiBaseUrl={API_BASE_URL}
                    userRole={user.role as string} // Pass role as string
                />
            )}

             {/* Loading Indicator for Popup */}
             {isPopupLoading && (
                 <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-60">
                     <span className="loading loading-lg loading-spinner text-white"></span>
                 </div>
             )}
        </div>
    );
};

export default DeanDashboard;