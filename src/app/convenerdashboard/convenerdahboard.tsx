// ConvenerDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation'; // Using App router
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/users'; // Assuming User interface is defined here

// Interface for the data structure expected by the Popup component
interface PopupProposal {
    id: number | string;
    title: string;
    date: string; // Corresponds to 'start'
    organizer: string; // Mapped (e.g., chief.name)
    convenerName: string; // Mapped (e.g., chief.name)
    email?: string; // Mapped (e.g., chief.email)
    cost?: number; // Mapped/Calculated
    category: string;
    description: string;
    designation?: string; // Mapped (e.g., chief.designation)
    detailedBudget?: any[]; // Mapped from 'items' or similar
    durationEvent?: string; // Mapped
    estimatedBudget?: number; // Mapped/Calculated
    eventDate?: string; // Mapped from 'start'
    eventDescription?: string; // Mapped from 'description'
    eventEndDate: string; // Corresponds to 'end'
    eventStartDate: string; // Corresponds to 'start'
    eventTitle?: string; // Mapped from 'title'
    organizingDepartment?: string; // Mapped
    proposalStatus?: string; // Corresponds to 'status'
    submissionTimestamp: string; // Corresponds to 'created_at'
    convenerEmail?: string; // Mapped (e.g., chief.email)
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
    sponsorshipDetailsRows?: { [key: string]: string | number | boolean }[];
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    // Add fields from DetailedProposal needed for display in Popup
    participant_expected?: number | null;
    participant_categories?: string[] | null; // Assuming parsed string
    items?: any[]; // Detailed budget items
    sponsors?: any[]; // Sponsors list
    chief?: User | null; // Include full chief object if needed
    cheif_reason?: string | null; // Rejection/Review reason from API if different
}


// Interface matching the API list response item
interface ProposalListItem {
    id: number;
    user_id: number;
    chief_id: number;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    created_at: string;
    updated_at: string;
    // Potentially add fields if the LIST API returns them (like user name)
    user?: { // Example if the API includes basic user info in the list
        name: string;
        email: string;
    }
}

// Interface matching the API detailed response item
interface DetailedProposal extends ProposalListItem {
    past: string | null;
    other: string | null;
    participant_expected: number | null;
    participant_categories: string | null; // API might return stringified JSON array
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    cheif_reason: string | null;
    cheif_hotel_name: string | null;
    cheif_hotel_address: string | null;
    cheif_hotel_duration: string | null;
    cheif_hotel_type: string | null;
    cheif_travel_name: string | null;
    cheif_travel_address: string | null;
    cheif_travel_duration: string | null;
    cheif_travel_type: string | null;
    chief: User | null; // Changed from User to User | null
    items: Array<{ // Define budget item structure more precisely
        mainCategory: string;
        subCategory: string;
        totalAmount?: number;
        // Add other fields returned by API if needed
    }>;
    sponsors: Array<{ // Define sponsor structure
        category: string;
        amount: number;
        reward: string;
        mode: string;
        about: string;
        benefit: string;
        // Add other fields if needed
    }>;
    messages: Array<{ type: string; content: string }>; // Example structure
}

// Centralize API URL
const API_BASE_URL = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const ConvenerDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null); // Use PopupProposal type
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

    const { token, user, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
     useEffect(() => {
         if (isAuthLoading) {
             setLoading(true);
             return;
         }
         if (user && token) { // Check role specific access if needed later
             setIsAuthorized(true);
             fetchProposals(token, user); // Pass user to determine endpoint
         } else {
             setIsAuthorized(false);
             setLoading(false);
             router.replace('/'); // Redirect if not logged in
         }
     }, [isAuthLoading, user, token, router]); // Removed fetchProposals

    // --- Data Fetching Functions ---
    const fetchProposals = useCallback(async (authToken: string, currentUser: User) => {
        setLoading(true);
        setError(null);

        // Determine endpoint based on user role
        let proposalEndpoint = '';
        switch (currentUser.role) {
            case 'faculty':
                proposalEndpoint = `${API_BASE_URL}/api/faculty/proposals`;
                break;
            case 'hod':
                proposalEndpoint = `${API_BASE_URL}/api/hod/proposals`; // Fixed double slash
                break;
            case 'dean':
                proposalEndpoint = `${API_BASE_URL}/api/dean/proposals`; // Fixed double slash
                break;
            default:
                setError("Invalid user role for fetching proposals.");
                setLoading(false);
                return;
        }

        try {
            console.log(`Fetching proposals from: ${proposalEndpoint} for role: ${currentUser.role}`);
            const response = await axios.get<ProposalListItem[]>(proposalEndpoint, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: 'application/json',
                },
            });

            if (Array.isArray(response.data)) {
                console.log("Proposals fetched:", response.data);
                setProposals(response.data);
            } else {
                console.error("API Error: Proposals endpoint did not return an array.", response.data);
                setProposals([]);
                setError("Received invalid data format from server.");
            }
        } catch (err: any) {
            console.error("Error fetching proposals:", err);
             if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) {
                    setError("Authentication error. Please log in again.");
                    logout();
                } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message.includes('CORS')) {
                    setError("Network error. Please check your connection.");
                } else {
                    setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals');
                }
            } else {
                 setError(err.message || 'An unknown error occurred');
            }
             setProposals([]);
        } finally {
            setLoading(false);
        }
    }, [logout]); // Dependency on logout

    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!isAuthorized || !token || !user) return;

        setIsPopupLoading(true);
        setError(null);

        let detailEndpoint = '';
         switch(user.role) {
             case 'faculty':
                 detailEndpoint = `${API_BASE_URL}/api/faculty/proposals/${proposalId}`;
                 break;
             case 'hod':
                  detailEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
                  break;
             case 'dean':
                  // Corrected template literal syntax
                  detailEndpoint = `${API_BASE_URL}/api/dean/proposals/${proposalId}`;
                  break;
             default:
                  setError("Invalid user role for fetching proposal detail.");
                  setIsPopupLoading(false);
                  return;
         }

        try {
            console.log(`Fetching proposal detail from: ${detailEndpoint}`);
            const response = await axios.get<DetailedProposal>(detailEndpoint, {
                 headers: {
                     Authorization: `Bearer ${token}`,
                     Accept: 'application/json',
                 },
             });
             console.log("Proposal detail fetched:", response.data);

             // --- Map API response (DetailedProposal) to PopupProposal ---
             const apiData = response.data;
             const chief = apiData?.chief; // Can be null
             const calculatedCost = (apiData?.fund_uni ?? 0) + (apiData?.fund_registration ?? 0) + (apiData?.fund_sponsor ?? 0) + (apiData?.fund_others ?? 0);

              // Function to safely parse participant categories
              const parseParticipantCategories = (categoriesString: string | null): string[] | null => {
                if (!categoriesString) return null;
                try {
                    const parsed = JSON.parse(categoriesString);
                    return Array.isArray(parsed) ? parsed : null;
                } catch (e) {
                    console.error("Error parsing participant_categories:", e);
                    return null; // Return null or empty array if parsing fails
                }
             };

             const detailedDataForPopup: PopupProposal = {
                id: String(apiData.id), // Ensure ID is string for Popup
                title: apiData.title || 'Untitled Proposal',
                description: apiData.description || 'No description.',
                category: apiData.category || 'Uncategorized',
                status: apiData.status,
                eventStartDate: apiData.start,
                eventEndDate: apiData.end,
                submissionTimestamp: apiData.created_at,
                date: apiData.start, // Alias for Popup if needed

                // Mapped fields
                organizer: chief?.name || `User ${apiData.user_id}`, // Use chief name or fallback
                convenerName: chief?.name || `User ${apiData.user_id}`,
                convenerEmail: chief?.email || undefined,
                email: chief?.email || undefined,
                designation: chief?.designation || undefined,
                organizingDepartment: String(chief?.department) || 'N/A',

                // Costs
                cost: calculatedCost > 0 ? calculatedCost : undefined,
                estimatedBudget: calculatedCost > 0 ? calculatedCost : undefined,

                // Mapped Optional Fields from DetailedProposal
                detailedBudget: apiData.items?.map(item => ({ // Map items to match Popup's expected budget structure
                    mainCategory: item.mainCategory || 'N/A',
                    subCategory: item.subCategory || 'N/A',
                    totalAmount: item.totalAmount ?? undefined
                })) || [],
                durationEvent: apiData.cheif_hotel_duration || apiData.cheif_travel_duration || undefined,
                location: apiData.cheif_hotel_address || apiData.cheif_travel_address || undefined,
                chiefGuestName: chief?.name || undefined, // API structure seems to use 'chief' for the guest object
                chiefGuestDesignation: chief?.designation || undefined,
                fundingDetails: {
                    registrationFund: apiData.fund_registration ?? undefined,
                    sponsorshipFund: apiData.fund_sponsor ?? undefined,
                    universityFund: apiData.fund_uni ?? undefined,
                    otherSourcesFund: apiData.fund_others ?? undefined,
                },
                pastEvents: apiData.past,
                relevantDetails: apiData.other,
                // Map sponsors if API returns an array of objects with a 'category' or 'name' property
                sponsorshipDetails: apiData.sponsors?.map(s => s?.category || s?.name).filter(Boolean) as string[] || [],
                // sponsorshipDetailsRows: apiData.sponsors || [], // Or map differently if needed
                rejectionMessage: apiData.messages?.find(m => m.type === 'rejection')?.content || apiData.cheif_reason || undefined, // Use cheif_reason as fallback
                reviewMessage: apiData.messages?.find(m => m.type === 'review')?.content || undefined,
                clarificationMessage: apiData.messages?.find(m => m.type === 'clarification')?.content || undefined,
                participant_expected: apiData.participant_expected,
                participant_categories: parseParticipantCategories(apiData.participant_categories),
                items: apiData.items || [],
                sponsors: apiData.sponsors || [],
                chief: apiData.chief,
                cheif_reason: apiData.cheif_reason, // Pass along if Popup needs it directly

                 // Fields potentially redundant but might be used by Popup directly
                 eventDate: apiData.start,
                 eventDescription: apiData.description || 'No description.',
                 eventTitle: apiData.title || 'Untitled Proposal',
                 proposalStatus: apiData.status,
             };

             setSelectedProposalDetail(detailedDataForPopup);

        } catch (err: any) {
             console.error("Error fetching proposal detail:", err);
              if (axios.isAxiosError(err)) {
                 const axiosError = err as AxiosError;
                 if (axiosError.response?.status === 401) {
                     setError("Authentication error fetching details. Please log in again.");
                     logout();
                 } else {
                     setError(`Failed to load details: ${ (axiosError.response?.data as any)?.message || axiosError.message }`);
                 }
             } else {
                  setError(`An unknown error occurred while fetching details: ${err.message}`);
             }
             setSelectedProposalDetail(null);
        } finally {
            setIsPopupLoading(false);
        }
    }, [isAuthorized, token, user, logout]); // Include user role dependency

    // --- Popup Handling ---
    const closePopup = () => {
        setSelectedProposalDetail(null);
    };

    const handleProposalUpdated = () => {
        if (token && user) {
            fetchProposals(token, user); // Refetch list after update
        }
        closePopup();
    };

    // --- Render Logic ---
    if (loading) { // Covers auth check and initial data fetch
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="loading loading-lg loading-spinner text-primary"></span>
                <span className="ml-3 text-lg">Loading Dashboard...</span>
            </div>
        );
    }

    if (!isAuthorized) { // Should be handled by redirect, but good safety check
         return (
            <div className="flex justify-center items-center h-screen">
                 <span className="text-error">Access Denied.</span>
            </div>
         );
    }

    if (error) { // Only show if authorized but data fetch failed
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="alert alert-error shadow-lg max-w-md mb-4">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Error: {error}</span>
                    </div>
                </div>
                 {token && user && (
                    <button onClick={() => fetchProposals(token, user)} className="btn btn-primary">
                         Retry Fetching Data
                    </button>
                 )}
            </div>
        );
    }

    // --- Data Derivations for Child Components ---
    const validProposals = Array.isArray(proposals) ? proposals : [];
    const approvedProposalsCount = validProposals.filter(p => p?.status === 'Approved').length;
    const pendingProposalsCount = validProposals.filter(p => p?.status === 'Pending').length;
    const rejectedProposalsCount = validProposals.filter(p => p?.status === 'Rejected').length;
    const reviewProposalsCount = validProposals.filter(p => p?.status === 'Review').length;
    const totalProposalsCount = validProposals.length;

    const recentAppliedProposals = [...validProposals]
        .sort((a, b) => {
            try { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); }
            catch (e) { return 0; }
        })
        .slice(0, 5);

    // Click handler for list items -> Fetches Full Detail
    const handleListItemClick = (proposalItem: ProposalListItem) => {
        fetchProposalDetail(proposalItem.id);
    };

    return (
        <div className="convener-dashboard p-4 md:p-6 space-y-6 bg-base-200 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-base-content mb-4">
                {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard` : 'Dashboard'}
             </h1>

            <Stats
                totalProposalsCount={totalProposalsCount}
                approvedProposalsCount={approvedProposalsCount}
                pendingProposalsCount={pendingProposalsCount}
                rejectedProposalsCount={rejectedProposalsCount}
                reviewProposalsCount={reviewProposalsCount}
            />

            {/* --- UPDATED GRID LAYOUT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Recents) */}
                 <div className="lg:col-span-1 space-y-6">
                     <Recents
                        // Map ProposalListItem to what Recents expects
                        recentAppliedProposals={recentAppliedProposals.map(p => ({
                            id: String(p.id), // Ensure string ID
                            title: p.title || 'N/A',
                            status: p.status,
                            submissionTimestamp: p.created_at,
                            // Use actual user name if available from list API, else fallback
                            organizer: p.user?.name || `User ${p.user_id}`,
                            convenerEmail: p.user?.email || `user${p.user_id}@example.com`, // Use real email if available
                             // Include original item for click handler if needed by Recents' internal logic
                            originalItem: p
                        }))}
                        // Pass the dashboard's click handler
                        handleProposalClick={handleListItemClick}
                      />
                 </div>

                 {/* Right Column (Overview) */}
                 <div className="lg:col-span-2 space-y-6">
                     <Overview
                        // Map ProposalListItem to what Overview now expects
                         eventProposals={validProposals.map(p => ({
                             id: String(p.id), // Ensure string ID
                             title: p.title || 'N/A',
                             date: p.start,
                             // Use actual user name if available from list API, else fallback
                             organizer: p.user?.name || `User ${p.user_id}`,
                             status: p.status,
                             convenerName: p.user?.name || `User ${p.user_id}`, // Use name for display
                             category: p.category || 'N/A', // Pass category
                             // Include original item for click handler if needed by Overview's internal logic
                             originalItem: p
                         }))}
                         // Pass the dashboard's click handler
                         handleProposalClick={handleListItemClick}
                     />
                 </div>
            </div>
             {/* --- END UPDATED GRID LAYOUT --- */}


            {/* Calendar View (Full Width below main grid or inside grid) */}
             <div className="mt-6">
                 <CalendarView proposals={validProposals.map(p => ({
                    // Map to what CalendarView expects
                    id: p.id,
                    title: p.title || 'N/A',
                    start: p.start,
                    end: p.end,
                    status: p.status,
                    // Add other needed fields with fallbacks
                    date: p.start,
                    organizer: p.user?.name || `User ${p.user_id}`,
                    convenerName: p.user?.name || `User ${p.user_id}`,
                    email: p.user?.email || `user${p.user_id}@example.com`,
                    cost: 0, // Or calculate if possible from list data
                    category: p.category,
                    description: p.description,
                    designation: '', // Likely not available in list
                    detailedBudget: [],
                    durationEvent: '', // Calculate if possible
                    estimatedBudget: 0,
                    eventDate: p.start,
                    eventDescription: p.description,
                    eventEndDate: p.end,
                    eventStartDate: p.start,
                    eventTitle: p.title,
                    organizingDepartment: '', // Likely not available in list
                    proposalStatus: p.status,
                    submissionTimestamp: p.created_at,
                    convenerEmail: p.user?.email || `user${p.user_id}@example.com`
                 }))} />
             </div>

            {/* Popup Modal */}
            {selectedProposalDetail && (
                <Popup
                    selectedProposal={selectedProposalDetail} // Pass detailed mapped data
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated}
                />
            )}

            {/* Loading indicator for popup fetch */}
            {isPopupLoading && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"> {/* Ensure high z-index */}
                     <span className="loading loading-lg loading-spinner text-white"></span>
                 </div>
             )}
        </div>
    );
};

export default ConvenerDashboard;