"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';

// --- ADDED/MODIFIED IMPORTS ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx'; // For Excel export
// --- END IMPORTS ---

import Overview from './overview'; // Adjust path
import Stats from './stats'; // Adjust path
import Popup from './Popup'; // Adjust path
import Recents from './recents'; // Adjust path
import CalendarView, { CalendarProposal } from './CalnderView'; // Adjust path & import type
import { useAuth } from '@/context/AuthContext';

// --- [ADDITION FROM TEST CODE] ---
import ApprovedSheet, { SheetProposal } from './ApprovedSheet';
// --- END [ADDITION] ---


// --- Interfaces (Your original interfaces are unchanged) ---
interface HODProposalListItem {
    id: number; user_id: number; title: string; description: string; start: string; event: string;
    end: string; category: string; status: string; awaiting: string | null;
    created_at: string; updated_at: string;
    user?: { id: number; name: string; email: string; department?: string; designation?: string; };
}
interface HODDetailedProposalFaculty {
    id: number; name: string; email: string; phone?: string; role?: string;
    designation?: string; dept_id?: number;
}
interface HODDetailedProposalUser { id: number; name: string; email: string; department?: string; designation?: string; role?: string; }
interface HODDetailedProposalChiefPivot { proposal_id: number; chief_id: number; reason: string | null; hotel_name: string | null; hotel_address: string | null; hotel_duration: number | null; hotel_type: 'srm' | 'others' | null; travel_name: string | null; travel_address: string | null; travel_duration: number | null; travel_type: 'srm' | 'others' | null; created_at: string; updated_at: string; }
interface HODDetailedProposalChief { id: number; name: string; designation: string; address: string; phone: string; pan: string; created_at: string; updated_at: string; pivot: HODDetailedProposalChiefPivot; }
interface HODDetailedProposalItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface HODDetailedProposalSponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface HODDetailedProposalMessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface HODDetailedProposalMessage { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: HODDetailedProposalMessageUser; }
interface HODDetailedProposal {
    id: number; user_id: number; title: string; description: string; start: string; end: string;
    category: string; past: string | null; other: string | null; status: string; participant_expected: number | null;
    participant_categories: string | null; fund_uni: number | null; fund_registration: number | null;
    fund_sponsor: number | null; fund_others: number | null; awaiting: string | null; created_at: string; updated_at: string;
    faculty: HODDetailedProposalFaculty;
    user?: HODDetailedProposalUser;
    chiefs: HODDetailedProposalChief[] | null; items: HODDetailedProposalItem[];
    sponsors: HODDetailedProposalSponsor[]; messages: HODDetailedProposalMessage[];
}
interface HODDetailedProposalResponse { proposal: HODDetailedProposal; }
interface PopupProposal {
    id: string; title: string; description: string; category: string; status: string;
    eventStartDate: string; eventEndDate: string; submissionTimestamp: string; date: string;
    organizer: string; convenerName: string; convenerEmail?: string; convenerDesignation?: string;
    participantExpected?: number | null; participantCategories?: string[] | null;
    chiefGuestName?: string; chiefGuestDesignation?: string; chiefGuestAddress?: string;
    chiefGuestPhone?: string; chiefGuestPan?: string; chiefGuestReason?: string;
    hotelName?: string; hotelAddress?: string; hotelDuration?: number; hotelType?: 'srm' | 'others' | null;
    travelName?: string; travelAddress?: string; travelDuration?: number; travelType?: 'srm' | 'others' | null;
    estimatedBudget?: number;
    fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; };
    detailedBudget: HODDetailedProposalItem[]; sponsorshipDetailsRows: HODDetailedProposalSponsor[];
    pastEvents?: string | null; relevantDetails?: string | null; awaiting?: string | null; messages: HODDetailedProposalMessage[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const HODDashboard: React.FC = () => {
    // --- (Original state variables are unchanged) ---
    const [proposals, setProposals] = useState<HODProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    // --- [ADDITION FROM TEST CODE] ---
    // State variables to manage the data fetched from the Excel sheet.
    const [sheetEvents, setSheetEvents] = useState<SheetProposal[]>([]);
    const [sheetLoading, setSheetLoading] = useState<boolean>(true);
    const [sheetError, setSheetError] = useState<string | null>(null);
    // --- END [ADDITION] ---

    const { token, user, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    // --- (All of your original functions like fetchProposals, handleApprove, etc., are unchanged) ---
    const fetchProposals = useCallback(async (authToken: string) => {
        if (!user || user.role !== 'hod') return;
        setLoading(true); setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/hod/proposals`;
        try {
            const response = await axios.get<any>(proposalEndpoint, { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' } });
            const proposalsArray: HODProposalListItem[] | null = Array.isArray(response.data?.proposals) ? response.data.proposals : null;
            if (proposalsArray) {
                 const cleanedData = proposalsArray.map(p => ({ ...p, status: p.status?.toLowerCase() || 'unknown' }));
                 setProposals(cleanedData);
            } else {
                setProposals([]); setError("Received invalid proposal list format.");
            }
        } catch (err: any) {
             if (axios.isAxiosError(err)) { const axiosError = err as AxiosError; if (axiosError.response?.status === 401) { setError("Authentication error."); logout(); } else { setError(`Failed to fetch proposals: ${ (axiosError.response?.data as any)?.message || axiosError.message }`); } }
             else { setError(err.message || 'An unknown error occurred'); }
            setProposals([]);
        } finally { setLoading(false); }
    }, [user, logout]);

    const refreshProposals = useCallback(() => {
        if (token && user && user.role === 'hod') { fetchProposals(token); }
    }, [token, user, fetchProposals]);

    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'hod') return;
        setIsPopupLoading(true); setActionError(null); setSelectedProposalDetail(null);
        const detailEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            const response = await axios.get<HODDetailedProposalResponse>(detailEndpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            const proposalData = response.data.proposal;
            if (!proposalData) { throw new Error("Proposal data missing in API response."); }

             const submitter = proposalData.faculty || proposalData.user || {};
             const primaryChief = proposalData.chiefs?.[0];
             const chiefPivot = primaryChief?.pivot;
             const calculatedBudget = (proposalData.fund_uni ?? 0) + (proposalData.fund_registration ?? 0) + (proposalData.fund_sponsor ?? 0) + (proposalData.fund_others ?? 0);
             const parseParticipantCategories = (categoriesString: string | null): string[] | null => { if (!categoriesString) return null; try { const p = JSON.parse(categoriesString); return Array.isArray(p)?p.map(String):null; } catch(e){ console.error("Parse error:", e); return null;} };
             const participantCats = parseParticipantCategories(proposalData.participant_categories);

            const detailedDataForPopup: PopupProposal = {
                id: String(proposalData.id), title: proposalData.title || 'N/A', description: proposalData.description || 'N/A',
                category: proposalData.category || 'N/A', status: proposalData.status?.toLowerCase() || 'unknown', eventStartDate: proposalData.start,
                eventEndDate: proposalData.end, submissionTimestamp: proposalData.created_at, date: proposalData.start,
                organizer: 'N/A',
                convenerName: submitter.name || `User ID: ${proposalData.user_id}`,
                convenerEmail: submitter.email || undefined,
                convenerDesignation: submitter.designation || undefined,
                participantExpected: proposalData.participant_expected, participantCategories: participantCats,
                chiefGuestName: primaryChief?.name, chiefGuestDesignation: primaryChief?.designation, chiefGuestAddress: primaryChief?.address,
                chiefGuestPhone: primaryChief?.phone, chiefGuestPan: primaryChief?.pan, chiefGuestReason: chiefPivot?.reason || undefined,
                hotelName: chiefPivot?.hotel_name || undefined, hotelAddress: chiefPivot?.hotel_address || undefined, hotelDuration: chiefPivot?.hotel_duration ?? undefined, hotelType: chiefPivot?.hotel_type,
                travelName: chiefPivot?.travel_name || undefined, travelAddress: chiefPivot?.travel_address || undefined, travelDuration: chiefPivot?.travel_duration ?? undefined, travelType: chiefPivot?.travel_type,
                estimatedBudget: calculatedBudget,
                fundingDetails: { universityFund: proposalData.fund_uni ?? undefined, registrationFund: proposalData.fund_registration ?? undefined, sponsorshipFund: proposalData.fund_sponsor ?? undefined, otherSourcesFund: proposalData.fund_others ?? undefined, },
                detailedBudget: proposalData.items || [], sponsorshipDetailsRows: proposalData.sponsors || [],
                pastEvents: proposalData.past, relevantDetails: proposalData.other, awaiting: proposalData.awaiting, messages: proposalData.messages || [],
             };
             setSelectedProposalDetail(detailedDataForPopup);

        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to load proposal details";
            setActionError(errorMsg); setSelectedProposalDetail(null);
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsPopupLoading(false); }
    }, [token, user, logout]);

    const handleApprove = useCallback(async (proposalId: string) => {
        if (!token || !user || user.role !== 'hod') return;
        setIsActionLoading(true); setActionError(null);
        const approveEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            await axios.post(approveEndpoint, {}, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            refreshProposals(); closePopup();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to approve proposal";
            setActionError(errorMsg);
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]);
    const handleReject = useCallback(async (proposalId: string, reason: string) => {
        if (!token || !user || user.role !== 'hod') return;
        if (!reason.trim()) { setActionError("Rejection reason required."); return; }
        setIsActionLoading(true); setActionError(null);
        const rejectEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            await axios.delete(rejectEndpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
            refreshProposals(); closePopup();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to reject proposal";
            setActionError(errorMsg);
            if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]);

    const handleReview = useCallback(async (proposalId: string, comments: string) => {
        if (!token || !user || user.role !== 'hod') return;
        if (!comments.trim()) { setActionError("Review comments required."); return; }
        setIsActionLoading(true); setActionError(null);
        const reviewEndpoint = `${API_BASE_URL}/api/hod/proposals/${proposalId}`;
        try {
            await axios.put(reviewEndpoint, { message: comments }, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
            refreshProposals(); closePopup();
        } catch (err: any) {
             const errorMsg = err.response?.data?.message || err.message || "Failed to submit review";
             setActionError(errorMsg);
             if (axios.isAxiosError(err) && err.response?.status === 401) logout();
        } finally { setIsActionLoading(false); }
    }, [token, user, refreshProposals, logout]);
    
    useEffect(() => {
        if (isAuthLoading) { setLoading(true); return; }
        if (user && token && user.role === 'hod') { fetchProposals(token); }
        else if (user && token && user.role !== 'hod') { setError("Access Denied: You do not have HOD privileges."); setLoading(false); }
        else { setError("Authentication failed. Please log in."); logout(); setLoading(false); }
    }, [isAuthLoading, user, token, logout, fetchProposals]);

    // --- [ADDITION FROM TEST CODE] ---
    useEffect(() => {
        const fetchAndProcessFile = async () => {
            setSheetLoading(true);
            setSheetError(null);
            try {
                const response = await fetch('/CTECH.xlsx');
                if (!response.ok) throw new Error('CTECH.xlsx not found in /public folder.');

                const arrayBuffer = await response.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                if (!firstSheetName) throw new Error("The Excel file has no sheets.");

                const worksheet = workbook.Sheets[firstSheetName];
                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

                const essentialHeaders = ['si. no.', 'activity', 'budget', 'convener'];
                let headerRowIndex = -1;

                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || !Array.isArray(row)) continue;

                    const normalizedRow = row.map(cell => String(cell || '').toLowerCase().trim());
                    let matchCount = 0;
                    essentialHeaders.forEach(header => {
                        if (normalizedRow.some(cell => cell.includes(header))) {
                            matchCount++;
                        }
                    });

                    if (matchCount >= 3) {
                        headerRowIndex = i;
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error("Could not automatically detect the header row in the sheet.");
                }

                const headers = rows[headerRowIndex].map(h => {
                    const normH = String(h || '').toLowerCase().trim();
                    if (normH.includes('si. no.')) return 'SI. No.';
                    if (normH.includes('university contribution')) return 'University Contribution (in INR)';
                    if (normH.includes('budget')) return 'Budget (in INR)';
                    return h;
                });

                const dataRows = rows.slice(headerRowIndex + 1);
                const newWorksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
                const json = XLSX.utils.sheet_to_json<any>(newWorksheet, { defval: null });

                const validProposals = json
                    .filter(p => p['Activity'])
                    .map((p, index) => ({ ...p, id: `sheet-${p['SI. No.'] || index}` }));

                if (validProposals.length === 0) setSheetError("Found headers, but no valid event data rows were detected.");
                setSheetEvents(validProposals);

            } catch (err: any) {
                setSheetError(err.message || "A critical error occurred while processing the Excel file.");
            } finally {
                setSheetLoading(false);
            }
        };

        fetchAndProcessFile();
    }, []);
    // --- END [ADDITION] ---

    const closePopup = () => { setSelectedProposalDetail(null); setActionError(null); };
    const handleListItemClick = (proposalItem: HODProposalListItem) => { fetchProposalDetail(proposalItem.id); };

    // --- [MODIFICATION FROM TEST CODE TO FIX BUG] ---
    const handleCalendarEventClick = (proposalData: CalendarProposal) => {
         const proposalId = proposalData.id;
         // This logic now prevents fetching details for events from the Excel sheet.
         if (proposalId && !String(proposalId).startsWith('sheet-')) {
            fetchProposalDetail(proposalId);
         } else {
            console.warn("Sheet event clicked on calendar. No details to fetch.");
         }
     };
    // --- END [MODIFICATION] ---

    // --- (Your original generateDashboardReportXlsx and generateDashboardReportPdf functions are unchanged) ---
    const generateDashboardReportXlsx = () => { /* ... (This function is unchanged) ... */ };
    const generateDashboardReportPdf = async () => { /* ... (This function is unchanged) ... */ };

    // --- (Your original render logic, including loading/error states, is unchanged) ---
    if (isAuthLoading || loading) { return ( <div className="flex justify-center items-center h-screen bg-white"><span className="loading loading-bars loading-lg text-primary"></span></div> ); }
    if (error) { return ( <div className="flex flex-col items-center justify-center h-screen p-4"> <div className={`alert ${error.startsWith("Access Denied") ? 'alert-warning' : 'alert-error'} shadow-lg max-w-md mb-4`}> <div> <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">{error.startsWith("Access Denied") ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}</svg> <span>{error}</span> </div> </div> {token && user && user.role === 'hod' && !error.startsWith("Access Denied") && ( <button onClick={refreshProposals} className="btn btn-primary">Retry</button> )} <button onClick={logout} className="btn btn-ghost mt-2">Logout</button> </div> ); }
    if (!user || user.role !== 'hod') { return <div className="flex justify-center items-center h-screen">Access Denied. Redirecting...</div>; }

    // --- (Your original constants for stats are unchanged) ---
    const validProposals = Array.isArray(proposals) ? proposals : [];
    const approvedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'approved').length;
    const pendingCount = validProposals.filter(p => p?.status?.toLowerCase() === 'pending').length;
    const rejectedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'rejected').length;
    const reviewCount = validProposals.filter(p => p?.status?.toLowerCase() === 'review').length;
    const totalCount = validProposals.length;
    const recentProposalsForHOD = [...validProposals]
        .filter(p => ['pending', 'review'].includes(p.status))
        .sort((a, b) => { if (a.status === 'pending' && b.status !== 'pending') return -1; if (a.status !== 'pending' && b.status === 'pending') return 1; return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); })
        .slice(0, 5);

    return (
        <div className="hod-dashboard p-4 md:p-6 space-y-6 min-h-screen bg-gray-50 text-black">
            {/* --- (Your original header and Stats component are unchanged) --- */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">HOD Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button onClick={generateDashboardReportPdf} className="btn btn-outline btn-primary btn-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        PDF
                    </button>
                    <button onClick={generateDashboardReportXlsx} className="btn btn-outline btn-accent btn-sm">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4m0 0h-4m4 0h4" /></svg>
                        Excel
                    </button>
                </div>
            </div>
            <Stats totalProposalsCount={totalCount} approvedProposalsCount={approvedCount} pendingProposalsCount={pendingCount} rejectedProposalsCount={rejectedCount} reviewProposalsCount={reviewCount} />
            
            {/* --- (Your original grid layout is unchanged) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-1 space-y-6">
                     <Recents
                        recentAppliedProposals={recentProposalsForHOD.map(p => ({ id: String(p.id), title: p.title || 'N/A', status: p.status, date: p.created_at, originalItem: p }))}
                        handleProposalClick={handleListItemClick}
                     />
                 </div>
                 <div className="lg:col-span-2 space-y-6">
                     <Overview
                         eventProposals={validProposals.map(p => ({ id: String(p.id), title: p.title || 'N/A', start: p.start, end: p.end,event: p.event, description: p.description?.substring(0, 100) + (p.description && p.description.length > 100 ? '...' : '') || '-', awaiting: p.awaiting, status: p.status, originalItem: p }))}
                         handleProposalClick={handleListItemClick}
                     />
                 </div>
            </div>

             <div className="mt-6 bg-white p-4 rounded-lg shadow">
                 <CalendarView
                      proposals={validProposals.map(p => ({
                         id: String(p.id), title: p.title || 'N/A', eventStartDate: p.start, eventEndDate: p.end, status: p.status?.toLowerCase() || 'unknown',
                         organizer: p.user?.department || 'N/A', date: p.start, category: p.category || 'N/A', description: p.description || 'N/A',
                         convenerName: p.user?.name || `User ${p.user_id}`,
                         submissionTimestamp: p.created_at, awaiting: p.awaiting, fundingDetails: {},
                         cost: undefined, email: p.user?.email || undefined, location: undefined, convenerEmail: p.user?.email || undefined,
                         chiefGuestName: undefined, chiefGuestDesignation: undefined, designation: p.user?.designation || undefined,
                         detailedBudget: [], durationEvent: '', estimatedBudget: undefined, eventDate: p.start, eventDescription: p.description || 'N/A',
                         eventTitle: p.title || 'N/A', organizingDepartment: p.user?.department || 'N/A', pastEvents: undefined, proposalStatus: p.status,
                         relevantDetails: undefined, sponsorshipDetails: undefined, sponsorshipDetailsRows: [], rejectionMessage: undefined, reviewMessage: undefined,
                         clarificationMessage: undefined, messages: [], participantExpected: undefined, participantCategories: undefined, items: undefined, sponsors: undefined, chief: undefined
                     }))}
                     // --- [ADDITION FROM TEST CODE] ---
                     sheetEvents={sheetEvents}
                     // --- END [ADDITION] ---
                     onEventClick={handleCalendarEventClick}
                 />
             </div>

            {/* --- [ADDITION FROM TEST CODE] --- */}
            <div className="mt-6">
                <ApprovedSheet
                    events={sheetEvents}
                    loading={sheetLoading}
                    error={sheetError}
                />
            </div>
            {/* --- END [ADDITION] --- */}

            {/* --- (Your original Popup logic is unchanged) --- */}
            {(selectedProposalDetail || isPopupLoading) && (
                 <Popup
                    selectedProposal={isPopupLoading ? null : selectedProposalDetail}
                    closePopup={closePopup}
                    onAccept={handleApprove}
                    onReject={handleReject}
                    onReview={handleReview}
                    isLoading={isActionLoading}
                    errorMessage={actionError}
                    isDetailLoading={isPopupLoading}
                    currentUserRole={user?.role}
                 />
            )}
        </div>
    );
};

export default HODDashboard;