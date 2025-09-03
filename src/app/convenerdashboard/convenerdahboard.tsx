import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
// --- ADDED IMPORTS ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// --- END ADDED IMPORTS ---
import Overview from './overview'; // Adjust path if needed
import Stats from './stats';       // Adjust path if needed
import Popup from './popup';       // Adjust path if needed (Details Popup)
import TransportFormPopup from './TransportFormPopup'; // Adjust path if needed (NEW Transport Popup)
import Recents from './recents';     // Adjust path if needed
import CalendarView from './calendarview'; // Adjust path if needed
import { useAuth } from '@/context/AuthContext';
import { User } from '@/lib/users';


interface ProposalListItem { id: number; user_id: number; event: string; title: string; description: string; start: string; end: string; category: string; status: string; awaiting: string | null; created_at: string; updated_at: string; user?: { id: number; name: string; email: string; department?: string; designation?: string; }; payment?: number;} // Added payment to ProposalListItem

// --- Nested interfaces for DetailedProposal ---
interface DetailedProposalUser { id: number; name: string; email: string; department?: string; designation?: string; role?: string; }
interface DetailedProposalChiefPivot { proposal_id: number; chief_id: number; reason: string | null; hotel_name: string | null; hotel_address: string | null; hotel_duration: number | null; hotel_type: 'srm' | 'others' | null; travel_name: string | null; travel_address: string | null; travel_duration: number | null; travel_type: 'srm' | 'others' | null; created_at: string; updated_at: string; }
interface DetailedProposalChief { id: number; name: string; designation: string; address: string; phone: string; pan: string; created_at: string; updated_at: string; pivot: DetailedProposalChiefPivot; }
interface DetailedProposalItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface DetailedProposalSponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface DetailedProposalMessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface DetailedProposalMessage { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: DetailedProposalMessageUser; } // <-- Matches API response
// Interface for the main DETAILED proposal from /api/faculty/proposals/{id}
interface DetailedProposal { id: number; user_id: number; title: string; description: string; start: string; end: string; category: string; past: string | null; other: string | null; status: string; participant_expected: number | null; participant_categories: string | null; fund_uni: number | null; fund_registration: number | null; fund_sponsor: number | null; fund_others: number | null; awaiting: string | null; created_at: string; updated_at: string; user: DetailedProposalUser; // Submitter details
    chiefs: DetailedProposalChief[] | null; items: DetailedProposalItem[]; sponsors: DetailedProposalSponsor[]; messages: DetailedProposalMessage[]; // <-- Updated to use the detailed message structure; payment?: number;
}
interface PopupProposal { id: string; title: string; description: string; category: string; status: string; eventStartDate: string; eventEndDate: string; submissionTimestamp: string; date: string; // Alias
    // Convener/Organizer Details
    organizer: string; convenerName: string; convenerEmail?: string; convenerDesignation?: string; // Participant Details
    participantExpected?: number | null; participantCategories?: string[] | null; // Chief Guest Details
    chiefGuestName?: string; chiefGuestDesignation?: string; chiefGuestAddress?: string; chiefGuestPhone?: string; chiefGuestPan?: string; chiefGuestReason?: string; // Accommodation Details
    hotelName?: string; hotelAddress?: string; hotelDuration?: number; hotelType?: 'srm' | 'others' | null; // Travel Details
    travelName?: string; travelAddress?: string; travelDuration?: number; travelType?: 'srm' | 'others' | null; // Financial Details
    estimatedBudget?: number; fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; }; // Pass the detailed arrays directly as Popup expects them
    detailedBudget: DetailedProposalItem[]; sponsorshipDetailsRows: DetailedProposalSponsor[]; // Other Form Details
    pastEvents?: string | null; relevantDetails?: string | null; // Status & Messages
    awaiting?: string | null; messages: DetailedProposalMessage[]; // <-- Pass the full, structured messages array
}

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";


// --- Component ---
const ConvenerDashboard: React.FC = () => {
    // Existing State
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false); // Loading state for Detail Popup
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

    // --- NEW State for Transport Popup ---
    const [isTransportPopupOpen, setIsTransportPopupOpen] = useState(false);
    const [selectedProposalIdForTransport, setSelectedProposalIdForTransport] = useState<string | null>(null);
    // ---

    const { token, user, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    // Authorization and Initial Data Fetch Effect
    useEffect(() => {
        if (isAuthLoading) {
            setLoading(true);
            setIsAuthorized(false);
            return;
        }
        if (user && token) {
            setIsAuthorized(true);
            // Initial fetch when authorized
            fetchProposals(token, user);
        } else {
            setIsAuthorized(false);
            setLoading(false);
            // Optional: Redirect to login if not authorized and not loading
            // if (!isAuthLoading) router.push('/login');
        }
    }, [isAuthLoading, user, token, router]); // Removed fetchProposals from deps, call it directly

    // Fetch All Proposals
    const fetchProposals = useCallback(async (authToken: string, currentUser: User) => {
        if (!currentUser || !authToken) return;
        setLoading(true);
        setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/faculty/proposals`; // Use role-specific endpoint if necessary
        try {
            console.log(`Fetching proposals from: ${proposalEndpoint} for role: ${currentUser.role}`);
            const response = await axios.get<{ data: ProposalListItem[] } | ProposalListItem[]>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
            });
            const proposalsData = Array.isArray(response.data) ? response.data : response.data?.data;

            if (Array.isArray(proposalsData)) {
                console.log("Proposals fetched:", proposalsData.length);
                // Normalize status and ensure user object exists
                const cleanedData = proposalsData.map(p => ({
                    ...p,
                    status: p.status?.toLowerCase() || 'unknown',
                    user: p.user || { id: -1, name: 'Unknown User', email: 'N/A' },
                     payment: p.payment, // Keep the payment from the API response

                }));
                setProposals(cleanedData);
            } else {
                console.error("API Error: Proposals data is not an array.", response.data);
                setProposals([]);
                setError("Received invalid proposal data format from server.");
            }
        } catch (err: any) {
            console.error("Error fetching proposals:", err);
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) {
                    setError("Authentication error. Please log in again.");
                    logout(); // Logout on auth error
                } else if (axiosError.code === 'ERR_NETWORK') {
                    setError("Network error. Could not reach server.");
                } else {
                    setError(`Failed to fetch proposals: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
                }
            } else {
                setError(err.message || 'An unknown error occurred while fetching proposals');
            }
            setProposals([]); // Clear proposals on error
        } finally {
            setLoading(false);
        }
    }, [logout, API_BASE_URL]); // Added API_BASE_URL dependency

    // Fetch Detailed Proposal for Detail Popup
    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!isAuthorized || !token || !user) {
            setError("Cannot fetch details: Not authorized.");
            return;
        }
        closeTransportPopup(); // Close transport popup if it was open
        setIsPopupLoading(true); // Show loading indicator for detail popup
        setError(null);
        const detailEndpoint = `${API_BASE_URL}/api/faculty/proposals/${proposalId}`;

        try {
            console.log(`Fetching proposal detail from: ${detailEndpoint}`);
            const response = await axios.get<{ proposal: DetailedProposal }>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            console.log("Raw proposal detail fetched:", response.data);

            const apiData = response.data.proposal;
            if (!apiData) {
                throw new Error("Proposal data not found in API response.");
            }

            // --- Mapping Logic (Simplified - copy your existing mapping logic here) ---
            const submitter = apiData.user || {};
            // ... (rest of your mapping logic to PopupProposal) ...
            const primaryChief = apiData.chiefs?.[0];
            const chiefPivot = primaryChief?.pivot;
            const calculatedBudget = apiData.items?.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0;
            const parseParticipantCategories = (categoriesString: string | null): string[] | null => {
                if (!categoriesString) return null;
                try { const parsed = JSON.parse(categoriesString); return Array.isArray(parsed) ? parsed.map(String) : null; }
                catch (e) { console.error("Error parsing participant_categories:", categoriesString, e); return null; }
            };
            const participantCats = parseParticipantCategories(apiData.participant_categories);

            const detailedDataForPopup: PopupProposal = {
                id: String(apiData.id),
                title: apiData.title || 'N/A',
                description: apiData.description || 'N/A',
                category: apiData.category || 'N/A',
                status: apiData.status?.toLowerCase() || 'unknown',
                eventStartDate: apiData.start,
                eventEndDate: apiData.end,
                submissionTimestamp: apiData.created_at,
                date: apiData.start,
                organizer: submitter.department || 'N/A',
                convenerName: submitter.name || `User ID: ${apiData.user_id}`,
                convenerEmail: submitter.email || undefined,
                convenerDesignation: submitter.designation || undefined,
                participantExpected: apiData.participant_expected,
                participantCategories: participantCats,
                chiefGuestName: primaryChief?.name,
                chiefGuestDesignation: primaryChief?.designation,
                chiefGuestAddress: primaryChief?.address,
                chiefGuestPhone: primaryChief?.phone,
                chiefGuestPan: primaryChief?.pan,
                chiefGuestReason: chiefPivot?.reason || undefined,
                hotelName: chiefPivot?.hotel_name || undefined,
                hotelAddress: chiefPivot?.hotel_address || undefined,
                hotelDuration: chiefPivot?.hotel_duration ?? undefined,
                hotelType: chiefPivot?.hotel_type,
                travelName: chiefPivot?.travel_name || undefined,
                travelAddress: chiefPivot?.travel_address || undefined,
                travelDuration: chiefPivot?.travel_duration ?? undefined,
                travelType: chiefPivot?.travel_type,
                estimatedBudget: calculatedBudget,
                fundingDetails: {
                    universityFund: apiData.fund_uni ?? undefined,
                    registrationFund: apiData.fund_registration ?? undefined,
                    sponsorshipFund: apiData.fund_sponsor ?? undefined,
                    otherSourcesFund: apiData.fund_others ?? undefined,
                },
                detailedBudget: apiData.items || [],
                sponsorshipDetailsRows: apiData.sponsors || [],
                pastEvents: apiData.past,
                relevantDetails: apiData.other,
                awaiting: apiData.awaiting,
                messages: apiData.messages || [],
            };


            console.log("Mapped data for Detail Popup:", detailedDataForPopup);
            setSelectedProposalDetail(detailedDataForPopup);

        } catch (err: any) {
            console.error("Error fetching or processing proposal detail:", err);
            setSelectedProposalDetail(null); // Clear selection on error
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError;
                if (axiosError.response?.status === 401) {
                    setError("Authentication error fetching details. Please log in again.");
                    logout();
                } else if (axiosError.response?.status === 404) {
                    setError("Proposal details not found.");
                } else {
                    setError(`Failed to load details: ${(axiosError.response?.data as any)?.message || axiosError.message}`);
                }
            } else {
                setError(`An error occurred: ${err.message}`);
            }
        } finally {
            setIsPopupLoading(false); // Hide loading indicator
        }
    }, [isAuthorized, token, user, logout, API_BASE_URL]); // Added dependencies

    // --- Detail Popup Handlers ---
    const closeDetailPopup = () => setSelectedProposalDetail(null);
    const handleProposalUpdated = () => {
        if (token && user) {
            fetchProposals(token, user); // Re-fetch list after update
        }
        closeDetailPopup();
    };

    // --- Transport Popup Handlers ---
    const openTransportPopup = (proposalId: string) => {
        console.log("Opening transport request form for proposal ID:", proposalId);
        closeDetailPopup(); // Close detail popup if it was open
        setSelectedProposalIdForTransport(proposalId);
        setIsTransportPopupOpen(true);
    };

    const closeTransportPopup = () => {
        setIsTransportPopupOpen(false);
        setSelectedProposalIdForTransport(null);
    };
    // ---

    // --- Render Logic ---
    // Loading State
    if (isAuthLoading || (loading && proposals.length === 0)) { // Show loading if auth is loading OR initial data fetch is happening
        return <div className="flex justify-center items-center h-screen bg-white"><span className="loading loading-bars loading-lg text-primary"></span></div>;
    }

    // Error State
    if (error && !isPopupLoading) { // Don't show main error if only popup loading failed
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4">
                <div className="alert alert-error shadow-lg max-w-md mb-4">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Error: {error}</span>
                    </div>
                </div>
                {isAuthorized && token && user && (
                    <button onClick={() => fetchProposals(token, user)} className="btn btn-primary">Retry Fetching Proposals</button>
                )}
                {!isAuthorized && (
                    <button onClick={() => router.push('/login')} className="btn btn-secondary">Go to Login</button>
                )}
            </div>
        );
    }

    // Unauthorized State
     if (!isAuthorized) {
         return (
             <div className="flex flex-col justify-center items-center h-screen">
                 <span className="text-warning text-lg">Access Denied or Session Expired.</span>
                 <button onClick={() => router.push('/login')} className="btn btn-primary mt-4">Login</button>
             </div>
         );
     }

    // --- Data Derivations for UI ---
    const validProposals = Array.isArray(proposals) ? proposals : [];
    const recentPendingOrReview = validProposals
        .filter(p => ['pending', 'review'].includes(p.status))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
    const approvedCount = validProposals.filter(p => ['approved', 'completed'].includes(p.status)).length;
    const pendingCount = validProposals.filter(p => p.status === 'pending').length;
    const rejectedCount = validProposals.filter(p => p.status === 'rejected').length;
    const reviewCount = validProposals.filter(p => p.status === 'review').length;
    const totalCount = validProposals.length;

    // Click handler for list items (Recents/Overview) to open DETAIL popup
    const handleListItemClick = (proposalItem: ProposalListItem) => {
        if (proposalItem && proposalItem.id) {
            fetchProposalDetail(proposalItem.id);
        } else {
            console.error("Cannot fetch details: Invalid proposal item data.", proposalItem);
            setError("Could not open proposal details due to missing data.");
        }
    };

    // --- ADDED PDF FUNCTION ---
    const generateOverviewPdf = () => {
        if (!validProposals.length) {
            alert("No proposals available to generate a report.");
            return;
        }

        const doc = new jsPDF();
        const tableColumns = ["ID", "Title", "Event Type", "Status", "Start Date", "Awaiting"];

        // Map data and ensure all values are strings to prevent type errors
        const tableRows = validProposals.map(p => [
            String(p.id),
            p.title || 'N/A',
            p.event || 'N/A',
            p.status ? (p.status.charAt(0).toUpperCase() + p.status.slice(1)) : 'Unknown',
            new Date(p.start).toLocaleDateString(),
            p.awaiting || '-',
        ]);

        doc.setFontSize(18);
        doc.text("Proposals Overview Report", 14, 22);

        autoTable(doc, {
            startY: 30,
            head: [tableColumns],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [22, 160, 133] },
        });

        doc.save('proposals_overview.pdf');
    };
    // --- END ADDED PDF FUNCTION ---

    // --- Main Render ---
    return (
        <div className="convener-dashboard p-4 md:p-6 space-y-6 bg-gray-50 text-black min-h-screen">
            {/* --- ADDED HEADER AND BUTTON --- */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Convener Dashboard</h1>
                <button
                    onClick={generateOverviewPdf}
                    className="btn btn-outline btn-primary"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Overview
                </button>
            </div>
            {/* --- END ADDED HEADER AND BUTTON --- */}
            
            {/* Stats Component */}
            <Stats
                totalProposalsCount={totalCount}
                approvedProposalsCount={approvedCount}
                pendingProposalsCount={pendingCount}
                rejectedProposalsCount={rejectedCount}
                reviewProposalsCount={reviewCount}
            />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Recents */}
                <div className="lg:col-span-1 space-y-6">
                    <Recents
                        recentAppliedProposals={recentPendingOrReview.map(p => ({
                            id: String(p.id),
                            title: p.title || 'N/A',
                            status: p.status,
                            date: p.created_at,
                            originalItem: p
                        }))}
                        handleProposalClick={handleListItemClick} // Opens detail popup
                    />
                </div>
                {/* Right Column: Overview Table */}
                <div className="lg:col-span-2 space-y-6">
                    <Overview
                        eventProposals={validProposals.map(p => ({
                            id: String(p.id),
                            title: p.title || 'N/A',
                            start: p.start,
                            end: p.end,
                            description: p.description?.substring(0, 100) + (p.description && p.description.length > 100 ? '...' : '') || '-',
                            awaiting: p.awaiting,
                            originalItem: p,
                            status: p.status,
                            payment:p.payment,
                            event:p.event

                        }))}
                        handleProposalClick={handleListItemClick} // Opens detail popup
                        onRequestTransportClick={openTransportPopup} // <-- Pass handler to Overview
                    />
                </div>
            </div>

            {/* Calendar View */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
                 <CalendarView
                     proposals={validProposals.map(p => ({
                         id: String(p.id), title: p.title || 'N/A', start: p.start, end: p.end, status: p.status, date: p.start, organizer: p.user?.department || 'N/A', convenerName: p.user?.name || `User ${p.user_id}`, email: p.user?.email || undefined, // ...(map rest of your CalendarView props)
                         cost: 0, category: p.category || 'N/A', description: p.description || 'N/A', designation: p.user?.designation || undefined, detailedBudget: [], durationEvent: '', estimatedBudget: 0, eventDate: p.start, eventDescription: p.description || 'N/A', eventEndDate: p.end, eventStartDate: p.start, eventTitle: p.title || 'N/A', organizingDepartment: p.user?.department || 'N/A', proposalStatus: p.status, submissionTimestamp: p.created_at, convenerEmail: p.user?.email || undefined, location: undefined, chiefGuestName: undefined, chiefGuestDesignation: undefined, fundingDetails: undefined, pastEvents: undefined, relevantDetails: undefined, sponsorshipDetails: undefined, sponsorshipDetailsRows: undefined, rejectionMessage: undefined, reviewMessage: undefined, clarificationMessage: undefined, messages: []
                     }))}
                 />
            </div>

            {/* Detail Popup Modal */}
            {selectedProposalDetail && token && (
                <Popup
                    selectedProposal={selectedProposalDetail}
                    closePopup={closeDetailPopup}
                    onProposalUpdated={handleProposalUpdated}
                    token={token} // Pass token
                    apiBaseUrl={API_BASE_URL} // Pass API base URL
                />
            )}

            {/* --- Transport Form Popup Modal --- */}
            {isTransportPopupOpen && selectedProposalIdForTransport && token && (
                <TransportFormPopup
                    proposalId={selectedProposalIdForTransport}
                    isOpen={isTransportPopupOpen}
                    onClose={closeTransportPopup}
                    token={token}
                    apiBaseUrl={API_BASE_URL}
                />
            )}
     


            {/* Loading indicator for *detail* popup data fetching */}
            {isPopupLoading && (
                <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex justify-center items-center z-[60]">
                    <span className="loading loading-bars text-white loading-lg"></span>
                </div>
            )}
        </div>
    );
};

export default ConvenerDashboard;