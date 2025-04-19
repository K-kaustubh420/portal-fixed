// ConvenerDashboard.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios'; // Import Axios types
import Overview from './overview';
import Stats from './stats';
import Popup from './popup'; // Assuming popup handles specific proposal details
import Recents from './recents';
import CalendarView from './calendarview'; // Assuming this shows event dates
import { useAuth } from '@/context/AuthContext'; // Import Auth context
import { User } from '@/lib/users';

interface Proposal {
    id: number | string;
    title: string;
    date: string;
    organizer: string;
    convenerName: string;
    email?: string;
    cost?: number;
    category: string;
    description: string;
    designation: string;
    detailedBudget: any[];
    durationEvent: string;
    estimatedBudget: number;
    eventDate: string;
    eventDescription: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle: string;
    organizingDepartment: string;
    proposalStatus: string;
    submissionTimestamp: string;
    convenerEmail: string;
}

// Interface matching the /api/faculty/proposals response item
// Adjust based on *exactly* what the LIST endpoint returns
interface ProposalListItem {
    id: number;
    user_id: number;
    chief_id: number;
    title: string;
    description: string;
    start: string; // Use string for dates from API initially
    end: string;
    category: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review'; // Use specific statuses if known
    created_at: string; // For sorting recents
    updated_at: string;
    // Add other fields *if* returned by the LIST endpoint (often less detailed than the single proposal endpoint)
    // Example: May only return title, id, status, created_at in the list view
}

interface DetailedProposal extends ProposalListItem {
    // Add all the detailed fields shown in the API docs for GET /proposals/{id}
    past: string | null;
    other: string | null;
    participant_expected: number | null;
    participant_categories: string | null; // API shows string, adjust if it's array
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    cheif_reason: string;
    cheif_hotel_name: string;
    cheif_hotel_address: string;
    cheif_hotel_duration: string; // API shows string, parse if needed
    cheif_hotel_type: string;
    cheif_travel_name: string;
    cheif_travel_address: string;
    cheif_travel_duration: string; // API shows string, parse if needed
    cheif_travel_type: string;
    chief: User; // Assuming User interface from lib/users
    items: any[]; // Define Item interface if needed
    sponsors: any[]; // Define Sponsor interface if needed
    messages: any[]; // Define Message interface if needed
    // Fields potentially needed by child components but not directly in API list response
    // These might need mapping or simplification depending on child component needs
    organizer?: string; // This might be user.name or department name - needs clarification
    date?: string; // This is likely 'start' or 'created_at' depending on context
    cost?: number; // This needs calculation from 'items' or 'fund_*' fields
    email?: string; // Likely user.email
    convenerName?: string; // Likely user.name
    convenerEmail?: string; // Likely user.email
    designation?: string; // Likely user.designation
    rejectionMessage?: string; // Comes from messages potentially
    reviewMessage?: string; // Comes from messages potentially
    clarificationMessage?: string; // Comes from messages potentially

}


// Centralize API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const ConvenerDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]); // State holds list items
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<DetailedProposal | null>(null); // State for detailed popup data
    const [isPopupLoading, setIsPopupLoading] = useState(false);

    const { token, user, logout } = useAuth(); // Get token and user role from context

    // Function to fetch the list of proposals
    const fetchProposals = useCallback(async () => {
        if (!token || !user) { // Ensure token and user exist
             setError("User not authenticated.");
             setLoading(false);
             return;
        }

        setLoading(true);
        setError(null);

        // Determine endpoint based on user role
        let proposalEndpoint = '';
        switch(user.role) {
            case 'faculty':
                proposalEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty/proposals`;
                break;
            case 'hod':
                 proposalEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net//api/hod/proposals`;
                 break;
            case 'dean':
                 proposalEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net//api/dean/proposals`;
                 break;
            default:
                 setError("Invalid user role for fetching proposals.");
                 setLoading(false);
                 return;
        }


        try {
            console.log(`Fetching proposals from: ${proposalEndpoint}`);
            const response = await axios.get<ProposalListItem[]>(proposalEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`, // Add Authorization header
                    Accept: 'application/json',
                },
            });
            console.log("Proposals fetched:", response.data);
            setProposals(response.data);
        } catch (err: any) {
            console.error("Error fetching proposals:", err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) {
                    setError("Authentication failed. Please log in again.");
                    logout(); // Log out if token is invalid
                } else if (axiosError.code === 'ERR_NETWORK' || axiosError.message.includes('CORS')) {
                     setError("Network or CORS error. Please check connection and backend CORS configuration.");
                 } else {
                    setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals');
                }
            } else {
                 setError(err.message || 'An unknown error occurred');
            }
        } finally {
            setLoading(false);
        }
    }, [token, user, logout]); // Add user and logout to dependencies

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]); // Fetch when function reference changes (initially)


    // Function to fetch DETAILED proposal for the popup
    const fetchProposalDetail = async (proposalId: number | string) => {
        if (!token || !user) return; // Need token/user

        setIsPopupLoading(true);
        setError(null); // Clear previous errors

         // Determine endpoint based on user role
         let detailEndpoint = '';
         switch(user.role) {
             case 'faculty':
                 detailEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty/proposals/${proposalId}`;
                 break;
             case 'hod':
                  detailEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/hod/proposals/${proposalId}`;
                  break;
             case 'dean':
                  detailEndpoint = `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/dean/proposals{proposalId}`;
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
             // Add mapping here if child components expect different field names
             const detailedData = {
                ...response.data,
                // Example mapping (adjust based on actual needs and API data)
                organizer: response.data.chief?.name || 'N/A', // Map organizer
                date: response.data.start, // Use start date for calendar/overview date
                cost: (response.data.fund_uni ?? 0) + (response.data.fund_registration ?? 0) + (response.data.fund_sponsor ?? 0) + (response.data.fund_others ?? 0), // Example cost calculation
                email: response.data.chief?.email || 'N/A',
                convenerName: response.data.chief?.name || 'N/A',
                convenerEmail: response.data.chief?.email || 'N/A',
                designation: response.data.chief?.designation || 'N/A',
             };
             setSelectedProposalDetail(detailedData);
        } catch (err: any) {
             console.error("Error fetching proposal detail:", err);
             if (axios.isAxiosError(err)) {
                 const axiosError = err as AxiosError;
                 if (axiosError.response?.status === 401) {
                     setError("Authentication failed. Please log in again.");
                     logout();
                 } else {
                     setError((axiosError.response?.data as { message?: string })?.message || axiosError.message || 'Failed to fetch proposal detail');
                 }
             } else {
                  setError(err.message || 'An unknown error occurred fetching detail');
             }
        } finally {
            setIsPopupLoading(false);
        }
    }

    // Derive Stats from the fetched proposals list
    const approvedProposalsCount = proposals.filter(p => p.status === 'Approved').length;
    const pendingProposalsCount = proposals.filter(p => p.status === 'Pending').length;
    const rejectedProposalsCount = proposals.filter(p => p.status === 'Rejected').length;
    const reviewProposalsCount = proposals.filter(p => p.status === 'Review').length;
    const totalProposalsCount = proposals.length;

    // Sort proposals by creation date for Recents
    const recentAppliedProposals = [...proposals]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

    // Handle click on a proposal row (fetches detailed data)
    const handleProposalClick = (proposal: ProposalListItem) => {
        fetchProposalDetail(proposal.id);
    };

    const closePopup = () => {
        setSelectedProposalDetail(null);
    };

    // Callback after popup action updates a proposal
    const handleProposalUpdated = () => {
        fetchProposals(); // Refetch the list
        closePopup(); // Close the popup
    };

    // --- Render Logic ---
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
    }

    if (error) {
        return <div className="alert alert-error shadow-lg"><div><span>Error: {error}</span></div></div>;
    }

    return (
        <div className="convener-dashboard p-4 md:p-6 space-y-6 bg-base-200 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-base-content mb-4">
                {user?.role ? `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard` : 'Dashboard'}
             </h1>

            {/* Stats Section - Using DaisyUI Stats component */}
            <Stats
                totalProposalsCount={totalProposalsCount}
                approvedProposalsCount={approvedProposalsCount}
                pendingProposalsCount={pendingProposalsCount}
                rejectedProposalsCount={rejectedProposalsCount}
                reviewProposalsCount={reviewProposalsCount}
            />

            {/* Main Content Area - Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Overview + Recents) */}
                 <div className="lg:col-span-2 space-y-6">
                     <Overview
                         // Pass simplified/mapped data if needed, or full list if Overview handles it
                         eventProposals={proposals.map(p => ({
                             id: String(p.id), // Ensure id is a string
                             title: p.title,
                             date: p.start,
                             organizer: `User ${p.user_id}`,
                             status: p.status,
                             convenerName: `User ${p.user_id}`,
                         }))}
                         handleProposalClick={(proposal: ProposalListItem) => {
                            const proposalData: Proposal = {
                                id: proposal.id,
                                title: proposal.title,
                                date: proposal.start,
                                organizer: `User ${proposal.user_id}`,
                                convenerName: `User ${proposal.user_id}`,
                                email: `user${proposal.user_id}@example.com`,
                                cost: 0,
                                category: proposal.category,
                                description: proposal.description,
                                designation: '',
                                detailedBudget: [],
                                durationEvent: '',
                                estimatedBudget: 0,
                                eventDate: proposal.start,
                                eventDescription: proposal.description,
                                eventEndDate: proposal.end,
                                eventStartDate: proposal.start,
                                eventTitle: proposal.title,
                                organizingDepartment: '',
                                proposalStatus: proposal.status,
                                submissionTimestamp: proposal.created_at,
                                convenerEmail: `user${proposal.user_id}@example.com`
                            };
                            handleProposalClick(proposalData);
                         }}
                     />
                     <Recents
                         // Pass simplified/mapped data if needed
                          recentAppliedProposals={recentAppliedProposals.map(p => ({ ...p, organizer: `User ${p.user_id}`, convenerEmail: `user${p.user_id}@example.com`, submissionTimestamp: p.created_at }))} // Example mapping
                          handleProposalClick={handleProposalClick}
                      />
                 </div>

                 {/* Right Column (Optional - could be Calendar or other widgets) */}
                 {/* <div className="lg:col-span-1 space-y-6">
                     <CalendarView proposals={proposals} />
                 </div> */}

            </div>

                {/* Calendar View (Full Width below main grid or inside grid) */}
             <div className="mt-6">
                 <CalendarView proposals={proposals.map(p => ({...p, date: p.start, organizer: `User ${p.user_id}`, convenerName: `User ${p.user_id}`, email: `user${p.user_id}@example.com`, cost: 0, category: p.category, description: p.description, designation: '', detailedBudget: [], durationEvent: '', estimatedBudget: 0, eventDate: p.start, eventDescription: p.description, eventEndDate: p.end, eventStartDate: p.start, eventTitle: p.title, organizingDepartment: '', proposalStatus: p.status, submissionTimestamp: p.created_at, convenerEmail: `user${p.user_id}@example.com` }))} />
             </div>


            {/* Popup Modal */}
            {selectedProposalDetail && (
                <Popup
                    selectedProposal={selectedProposalDetail} // Pass detailed data
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated} // Pass callback to refetch list
                />
            )}
             {/* Loading indicator for popup fetch */}
             {isPopupLoading && (
                 <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-60">
                     <span className="loading loading-lg loading-spinner text-white"></span>
                 </div>
             )}
        </div>
    );
};

export default ConvenerDashboard;