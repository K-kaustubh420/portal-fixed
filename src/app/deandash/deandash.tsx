"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';
import BillStatus from './billstatus';
import AwaitingAtU from './awaitingatu';
import { useAuth } from '@/context/AuthContext';

// Shared Interfaces
export interface Item {
    id: number;
    proposal_id: number;
    category: string;
    sub_category: string;
    type: string | null;
    quantity: number;
    cost: number;
    amount: number;
    created_at: string | null;
    updated_at: string | null;
    status: string;
}

export interface Sponsor {
    id: number;
    proposal_id: number;
    category: string;
    amount: number;
    reward: string;
    mode: string;
    about: string;
    benefit: string;
    created_at: string | null;
    updated_at: string | null;
}

// Updated Message Interface
export interface Message {
    id: number;
    message: string;
    created_at: string | null;

    // Fields from the root `messages` array in DetailedProposalResponse (as per your API sample)
    user_name?: string; // Added
    user_role?: string; // Added

    // Fields that might exist if the message object includes a nested user object (optional)
    user_id?: number;
    user?: User | null; // Added (can be null)
    updated_at?: string | null; // Kept as original, but often present in message objects
    proposal_id?: number; // Added for completeness if needed elsewhere
}

export interface User {
    name: string;
    department: number | string | null; // Changed to allow null based on API sample (Chair user)
    email: string;
    role: string;
    designation: string;
    dept_id: number | null; // Changed to allow null based on API sample (Chair user)
    // Optional fields often included in user details from API
    id?: number;
    email_verified_at?: string | null;
    phone?: string | null; // Changed to allow null
    scope?: string | null | string[]; // Changed to allow string[] based on API sample (Vice_Chair user)
    created_at?: string | null;
    updated_at?: string | null;
}

export interface Proposal {
    id: string;
    title: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Review';
    date: string;
    organizer: string;
    convenerName: string;
    awaiting?: string | null;
    event?: string | null; // MODIFICATION: Added event field
}

export interface UnifiedProposal {
    id: string;
    title: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Review';
    date: string;
    organizer: string;
    convenerName: string;
    convenerEmail: string;
    submissionTimestamp: string;
    description: string;
    category: string;
    eventStartDate: string;
    eventEndDate: string;
    eventDate: string;
    eventDescription: string;
    eventTitle: string;
    cost: number;
    detailedBudget: Item[];
    estimatedBudget: number;
    email: string;
    location?: string | null; // Added null
    chiefGuestName?: string | null; // Added null
    chiefGuestDesignation?: string | null; // Added null
    designation?: string | null; // Added null
    durationEvent?: string | null; // Added null
    fundingDetails?: {
        registrationFund?: number | null;
        sponsorshipFund?: number | null;
        universityFund?: number | null;
        otherSourcesFund?: number | null;
    };
    organizingDepartment?: string | null; // Added null
    department_name?: string | null; // Added null
    pastEvents?: string | string[] | null;
    proposalStatus?: string | null; // Added null
    relevantDetails?: string | null;
    sponsorshipDetails: Sponsor[];
    sponsorshipDetailsRows?: any[];
    rejectionMessage?: string | null; // Added null
    tags?: string[];
    messages: Message[]; // Uses the updated Message interface
    chief?: User | null; // This seems inconsistent with 'chiefs' array in API, but keeping as per original UnifiedProposal
    user?: User | null; // Submitter User details
    awaiting: string | null;
    event?: string | null; // MODIFICATION: Added event field
}

// Interface mirroring the structure returned by /api/dean/proposals
interface ProposalListItem {
    id: number;
    user_id: number; // ID of the submitting user
    chief_id?: number | null;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    past: string | null;
    other: string | null;
    status: 'completed' | 'pending' | 'rejected' | 'review'; // Note: API uses lowercase strings
    participant_expected: number | null;
    participant_categories: string | null; // Seems like a JSON string in API
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    created_at: string | null;
    updated_at: string | null;
    cheif_reason?: string | null;
    cheif_hotel_name?: string | null;
    cheif_hotel_address?: string | null;
    cheif_hotel_duration?: string | null;
    cheif_hotel_type?: string | null;
    cheif_travel_name?: string | null;
    cheif_travel_address?: string | null;
    cheif_travel_duration?: string | null;
    cheif_travel_type?: string | null;
    department_name: string;
    awaiting: string | null;
    payment?: number | null; // Added based on sample
    event?: string | null; // Already present, this is correct

    // Nested relations often returned in the list endpoint
    faculty?: User; // User details for the submitter
    // chiefs?: Array<User & { pivot: any }>; // Sample shows this structure, but UnifiedProposal has chief?: User
}

// Interface mirroring the structure returned by /api/dean/proposals/{id}
interface DetailedProposalResponse {
    proposal: ProposalListItem; // Includes core proposal details
    chief?: User | null; // Keeping this as per original code's mapping, adjust if API returns array differently
    chiefs?: Array<User & { pivot: any }> | null; // Added based on API sample array structure
    items: Item[]; // Estimated/Actual bill items
    sponsors: Sponsor[];
    messages: Message[]; // Uses the updated Message interface - this is the array from the root response
    user?: User | null; // The submitting user details, seems to be the same as proposal.faculty
    department_name: string;
}

interface ApiResponse {
    status: string;
    proposals: ProposalListItem[];
}

const DeanDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<UnifiedProposal | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const { token, user, logout } = useAuth();

    // Helper function to capitalize status
    const capitalize = (str: string): string => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    const fetchProposals = useCallback(async () => {
        if (!token || !user || user.role !== 'dean') {
            setError(user ? "Access denied. User is not a Dean." : "User not authenticated.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        const Baseuril =process.env.NEXT_PUBLIC_API_BASE_URL;
        const proposalEndpoint = `${Baseuril}/api/dean/proposals`;
        try {
            const response = await axios.get<ApiResponse>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
             // Ensure status is lowercase before setting state if needed, or handle case in UI mapping
            const formattedProposals = response.data.proposals?.map(p => ({
                 ...p,
                 status: p.status ? p.status.toLowerCase() as 'completed' | 'pending' | 'rejected' | 'review' : 'pending' // Normalize status
             })) || [];
             setProposals(formattedProposals);
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposals';
            if (axiosError.code === 'ERR_NETWORK') {
                errorMessage = "Network error: Unable to reach the server.";
            } else if (axiosError.response?.status === 401) {
                errorMessage = "Authentication failed.";
                logout();
            } else if (axiosError.response?.status === 403) {
                errorMessage = "Forbidden: You lack permission to view proposals.";
            } else {
                errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals';
            }
            console.error('DeanDashboard: Error fetching proposals:', { errorMessage, status: axiosError.response?.status });
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [token, user, logout]);

    useEffect(() => {
        if (user?.role === 'dean') {
            fetchProposals();
        } else if (user) {
            setError("Access denied. This dashboard is for Deans only.");
            setLoading(false);
        } else {
            setError("User not authenticated.");
            setLoading(false);
        }
    }, [fetchProposals, user]);

    const fetchProposalDetail = useCallback(async (proposalId: number): Promise<UnifiedProposal | null> => {
        if (!token || !user || user.role !== 'dean') {
            console.error('DeanDashboard: fetchProposalDetail cancelled: Invalid auth.', {
                tokenExists: !!token,
                userRole: user?.role
            });
            setFetchError("Authentication or authorization failed.");
            return null;
        }
        setIsPopupLoading(true);
        setFetchError(null);
        const Baseuril = process.env.NEXT_PUBLIC_API_BASE_URL;
        const detailEndpoint = `${Baseuril}/api/dean/proposals/${proposalId}`;
        try {
            console.log('DeanDashboard: Fetching proposal detail:', { proposalId, detailEndpoint });
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            return mapDetailResponseToUnifiedProposal(response.data);
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposal details';
             if (axiosError.response?.status === 404) {
                // A 404 might mean the proposal isn't found OR it's not awaiting the current user (Dean)
                // The API structure implies dean/proposals/{id} only returns proposals awaiting the dean.
                // If it returns 404 for proposals awaiting others, this message is fine.
                // If it returns 404 for proposals that don't exist AT ALL, message is also ok.
                 errorMessage = `Proposal not found or is not currently awaiting action from the Dean.`;
             } else if (axiosError.response?.status === 401) {
                errorMessage = "Authentication failed.";
                logout();
             } else if (axiosError.response?.status === 403) {
                errorMessage = "Forbidden: You lack permission to view this proposal.";
             } else {
                errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposal details';
            }
            console.error('DeanDashboard: Error fetching proposal detail:', {
                proposalId,
                errorMessage,
                status: axiosError.response?.status,
                 responseData: axiosError.response?.data // Log response data for debugging
            });
            setFetchError(errorMessage);
            return null;
        } finally {
            setIsPopupLoading(false);
        }
    }, [token, user, logout]);

    const calculateStats = (proposalList: ProposalListItem[]) => {
        if (!Array.isArray(proposalList)) {
            return { approvedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, reviewProposalsCount: 0, totalProposalsCount: 0 };
        }
        let approved = 0, pending = 0, rejected = 0, review = 0;
        proposalList.forEach(p => {
            if (!p || typeof p.status !== 'string') return;
            // Note: Assuming 'completed' in API list maps to 'Approved' in UI
            const status = p.status.toLowerCase();
            if (status === 'completed') approved++;
            else if (status === 'pending') pending++;
            else if (status === 'rejected') rejected++;
            else if (status === 'review') review++;
        });
        return {
            approvedProposalsCount: approved,
            pendingProposalsCount: pending,
            rejectedProposalsCount: rejected,
            reviewProposalsCount: review,
            totalProposalsCount: proposalList.length
        };
    };
     // Calculate stats based on the fetched proposals state
    const stats = Array.isArray(proposals) ? calculateStats(proposals) : {
        approvedProposalsCount: 0,
        pendingProposalsCount: 0,
        rejectedProposalsCount: 0,
        reviewProposalsCount: 0,
        totalProposalsCount: 0
    };

     // Sort and slice for recents, ensure proposals is an array
    const recentAppliedProposals = Array.isArray(proposals) ? [...proposals]
        .filter(p => p && p.created_at) // Filter out potentially invalid entries
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5) : [];

    // Maps a ProposalListItem (from the list API) to UnifiedProposal
    const mapListItemToUnifiedProposal = useCallback((p: ProposalListItem): UnifiedProposal => {
        try {
            if (!p.id || isNaN(p.id)) {
                console.error('DeanDashboard: Invalid proposal ID in mapListItemToUnifiedProposal:', { proposalId: p.id, proposal: p });
                 // Return a minimal error object if ID is invalid
                 return {
                    id: 'invalid-id', title: 'Error: Invalid Proposal Data', status: 'Rejected', date: '',
                    organizer: 'Unknown', convenerName: 'Unknown', convenerEmail: '', submissionTimestamp: '',
                    description: '', category: 'Unknown', eventStartDate: '', eventEndDate: '', eventDate: '',
                    eventDescription: '', eventTitle: '', cost: 0, detailedBudget: [], estimatedBudget: 0, email: '',
                    sponsorshipDetails: [], messages: [], awaiting: null, rejectionMessage: 'Invalid data received',
                    event: null // MODIFICATION: Added event field
                 };
            }
             // Sum up funds from all sources for estimatedBudget and cost
            const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);

             // Use nested faculty/user data if available, otherwise fallbacks
            const convenerName = p.faculty?.name || `User ID: ${p.user_id}`;
            const convenerEmail = p.faculty?.email || `user${p.user_id}@example.com`; // Placeholder
            const designation = p.faculty?.designation || '';

             // Map status from list API ('completed', 'pending', etc.) to UnifiedProposal status ('Approved', 'Pending', etc.)
            const unifiedStatus = p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review';

            const tags: string[] = [];
            const lowerStatus = p.status ? p.status.toLowerCase() : '';
            if (lowerStatus === 'completed') tags.push('Done');
            if (lowerStatus === 'rejected') tags.push('Rejected');
            // Only tag 'Awaiting Action' if status is pending AND it's awaiting the dean
            if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === 'dean') tags.push('Awaiting Action');
            if (lowerStatus === 'review') tags.push('Review');

            return {
                id: String(p.id),
                title: p.title || 'Untitled Proposal',
                description: p.description || '',
                category: p.category || 'Uncategorized',
                status: unifiedStatus,
                date: p.start || '', // Assuming 'date' means start date for list view
                eventStartDate: p.start || '',
                eventEndDate: p.end || '',
                submissionTimestamp: p.created_at || '',
                eventDate: p.start || '', // Duplicate, maybe eventStartDate/EndDate is better?
                eventDescription: p.description || '', // Duplicate
                eventTitle: p.title || 'Untitled Proposal', // Duplicate
                organizer: p.department_name || convenerName, // Use department if available, else convener
                convenerName: convenerName,
                convenerEmail: convenerEmail,
                email: convenerEmail, // Duplicate
                designation: designation,
                cost: calculatedCost, // Use calculated cost based on fund details
                estimatedBudget: calculatedCost, // Estimated budget is the same as calculated cost here
                organizingDepartment: p.department_name || '',
                detailedBudget: [], // detailedBudget is only available in the detail API response
                durationEvent: null, // Not available in list item
                fundingDetails: {
                    universityFund: p.fund_uni,
                    registrationFund: p.fund_registration,
                    sponsorshipFund: p.fund_sponsor,
                    otherSourcesFund: p.fund_others
                },
                sponsorshipDetails: [], // Sponsorship details are only available in the detail API response
                tags: tags,
                chiefGuestName: null, // Not available in list item
                chiefGuestDesignation: null, // Not available in list item
                pastEvents: p.past || null,
                relevantDetails: p.other || null,
                rejectionMessage: null, // Rejection message is only in detail API/messages
                messages: [], // Messages are only available in the detail API response
                 // Pass user and chief data if available in the list item (though detail fetch is primary source)
                user: p.faculty || null,
                chief: null, // Chief details only in detail API
                awaiting: p.awaiting || null,
                event: p.event || null // MODIFICATION: Populating event field
            };
        } catch (error) {
            console.error('DeanDashboard: Error in mapListItemToUnifiedProposal:', { error, proposalId: p?.id });
            // Return a clearly marked error object for bad data
            return {
                id: String(p?.id || 'unknown'),
                title: 'Error Parsing Proposal Data',
                description: '', category: 'Unknown', status: 'Rejected', date: '',
                organizer: 'Unknown', convenerName: 'Unknown', convenerEmail: '', submissionTimestamp: '',
                eventStartDate: '', eventEndDate: '', eventDate: '', eventDescription: '', eventTitle: '',
                cost: 0, detailedBudget: [], estimatedBudget: 0, email: '', sponsorshipDetails: [],
                tags: [], messages: [], awaiting: null, rejectionMessage: 'Failed to parse proposal data.',
                event: null // MODIFICATION: Added event field
            };
        }
    }, []);

    // Maps a Simplified UnifiedProposal (used for overview/recents)
    const mapUnifiedToSimplifiedProposal = useCallback((p: UnifiedProposal): Proposal => ({
        id: p.id,
        title: p.title,
        status: p.status,
        date: p.date,
        organizer: p.organizer,
        convenerName: p.convenerName,
        awaiting: p.awaiting,
        event: p.event || null // MODIFICATION: Populating event field
    }), []);

    // Maps the detailed API response structure to UnifiedProposal
    const mapDetailResponseToUnifiedProposal = useCallback((detailData: DetailedProposalResponse): UnifiedProposal => {
        if (!detailData || !detailData.proposal) {
            console.error('DeanDashboard: Invalid detailData in mapDetailResponseToUnifiedProposal:', detailData);
            throw new Error('Invalid proposal data received from detail API.');
        }

        const p = detailData.proposal;
        const submitterUser = detailData.user || p.faculty; // Prefer top-level user if available, fallback to nested faculty
        // The API sample shows a 'chiefs' array in both list item and detail response.
        // Your UnifiedProposal interface has a single 'chief'.
        // Assuming the API sample's 'chiefs' array contains the main chief guest details,
        // we'll take the first one. Adjust this logic if multiple chiefs are important.
        const mainChief = detailData.chiefs?.[0] || null; // Get first chief from the array

        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = submitterUser?.name || `User ID: ${p.user_id}`;
        const convenerEmail = submitterUser?.email || `user${p.user_id}@example.com`; // Placeholder
        const designation = submitterUser?.designation || '';
        const submissionTs = p.created_at || '';

        let rejectionMsg = '';
        // Find a rejection message in the detailed messages if status is rejected
        if (p.status?.toLowerCase() === 'rejected') {
             const rejectMsg = detailData.messages?.find(msg =>
                 msg.user_role?.toLowerCase() === p.awaiting?.toLowerCase() && // Optional: Match message from the role that rejected it
                 msg.message?.toLowerCase().includes('reject') // Simple check for rejection message
                 // A more robust check might involve backend providing a specific message type or flag
             );
            rejectionMsg = rejectMsg?.message || 'Proposal rejected.';
        }


        const tags: string[] = [];
        const lowerStatus = p.status ? p.status.toLowerCase() : '';
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        // Only tag 'Awaiting Action' if status is pending AND it's awaiting the dean
        if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === 'dean') tags.push('Awaiting Action');
        if (lowerStatus === 'review') tags.push('Review');
         // Add 'Cancelled' tag if event is cancelled
        if (p.event?.toLowerCase() === 'cancelled') tags.push('Cancelled');


        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            status: p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '', // Use start date
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            submissionTimestamp: submissionTs,
            eventDate: p.start || '', // Duplicate, should align usage
            eventDescription: p.description || '', // Duplicate
            eventTitle: p.title || 'Untitled Proposal', // Duplicate
            organizer: detailData.department_name || convenerName, // Use department if available, else convener
            convenerName: convenerName,
            convenerEmail: convenerEmail,
            email: convenerEmail, // Duplicate
            designation: designation,
            cost: calculatedCost,
            estimatedBudget: calculatedCost, // Use calculated budget
            organizingDepartment: detailData.department_name || p.department_name || '', // Use department name from detailData or proposal
            detailedBudget: detailData.items || [], // Items from detail API
            durationEvent: null, // Not explicitly available in API structure
            fundingDetails: {
                universityFund: p.fund_uni,
                registrationFund: p.fund_registration,
                sponsorshipFund: p.fund_sponsor,
                otherSourcesFund: p.fund_others
            },
            sponsorshipDetails: detailData.sponsors || [], // Sponsors from detail API
            tags: tags,
             // Use details from the main chief guest object
            chiefGuestName: mainChief?.name || null,
            chiefGuestDesignation: mainChief?.designation || null,
            pastEvents: p.past || null,
            relevantDetails: p.other || null,
            rejectionMessage: rejectionMsg,
             // Pass messages from detail API response (which contain user_name/user_role)
            messages: detailData.messages || [],
            chief: mainChief, // Assign the mapped main chief
            user: submitterUser || null, // Assign the submitter user
            awaiting: p.awaiting || null,
            event: p.event || null // MODIFICATION: Populating event field
        };
    }, []);


    const handleProposalClick = useCallback(async (proposal: Proposal) => {
        const proposalId = proposal.id ? String(proposal.id).trim() : null;
        if (proposalId && !isNaN(parseInt(proposalId, 10))) {
            console.log('DeanDashboard: Proposal clicked, fetching detail:', { proposalId, title: proposal.title });
            const numericId = parseInt(proposalId, 10);
            // Always try to fetch detailed data first for the popup
            const detailedProposal = await fetchProposalDetail(numericId);
            if (detailedProposal) {
                setSelectedProposal(detailedProposal);
            } else {
                 // If detail fetch failed (e.g., 404), the fetchError state is already set.
                 // The popup component will handle displaying the error based on fetchError.
                setSelectedProposal(null); // Clear any previous selection
                 // Error message is set in fetchProposalDetail
            }
        } else {
            console.error('DeanDashboard: Invalid proposal ID for click handler:', { proposalIdRaw: proposal.id });
            setFetchError('Could not load details for the selected proposal due to invalid ID.'); // Set fetchError here too
            setSelectedProposal(null); // Clear any previous selection
        }
    }, [fetchProposalDetail]);

    const closePopup = () => {
        setSelectedProposal(null);
        setFetchError(null); // Also clear fetch error when closing popup
        // Do NOT clear the main dashboard error (`error`) here
    };

     // Map proposals data for the view components
     // Ensure proposals state is an array before mapping
    const unifiedProposals: UnifiedProposal[] = Array.isArray(proposals) ? proposals.map(mapListItemToUnifiedProposal) : [];
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentsForView: Proposal[] = Array.isArray(recentAppliedProposals) ? recentAppliedProposals.map(mapListItemToUnifiedProposal).map(mapUnifiedToSimplifiedProposal) : [];


    return (
        <div className="dean-dashboard p-4 md:p-6 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                Dean Dashboard
            </h1>
            {loading && !error && (
                 <div className="text-center p-4"><span className="loading loading-dots loading-lg text-info"></span><p className="text-sm text-gray-500 mt-1">Loading dashboard data...</p></div>
            )}
            {!loading && error && (
                 <div className="alert alert-error shadow-lg m-4">
                    <div><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Error loading dashboard: {error}</span></div>
                 </div>
            )}

            {!loading && !error && <Stats {...stats} />}
            {!loading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    <div className="space-y-6">
                         {/* Pass unifiedProposals to BillStatus for more data if needed, or just simple list items */}
                        <BillStatus
                            proposals={proposalsForView} // Using simplified view models here
                            authToken={token}
                            apiBaseUrl={process.env.NEXT_PUBLIC_API_BASE_URL!}
                        />
                        <AwaitingAtU
                             proposals={unifiedProposals.filter(p => p.status === 'Pending' && p.awaiting !== user?.role?.toLowerCase())} // Filter to show proposals awaiting others
                            userRole={user?.role || ''}
                        />
                    </div>
                </div>
            )}
            {!loading && !error && (
                <div className="mt-6">
                    <CalendarView proposals={unifiedProposals} />
                </div>
            )}

            {isPopupLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-60">
                    <span className="loading loading-lg loading-spinner text-white"></span>
                </div>
            )}

             {/* Popup component handles its own loading/error display */}
            <Popup
                selectedProposal={selectedProposal}
                closePopup={closePopup}
                onProposalUpdated={() => fetchProposals()} // Pass fetchProposals to refresh data after action
                authToken={token}
                apiBaseUrl= {process.env.NEXT_PUBLIC_API_BASE_URL!}
                fetchError={fetchError} // Pass error from fetchProposalDetail
            />

        </div>
    );
};

export default DeanDashboard;