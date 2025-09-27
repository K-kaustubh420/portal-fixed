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

// --- Interfaces ---

// For the main list of proposals
interface HODProposalListItem {
    id: number; user_id: number; title: string; description: string; start: string; event: string;
    end: string; category: string; status: string; awaiting: string | null;
    created_at: string; updated_at: string;
    // User object is not provided in the list API, so it's optional
    user?: { id: number; name: string; email: string; department?: string; designation?: string; };
}

// --- MODIFIED INTERFACES FOR DETAILED VIEW TO MATCH YOUR API RESPONSE ---
interface HODDetailedProposalFaculty {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role?: string;
    designation?: string;
    dept_id?: number; // Department is referenced by ID
}

interface HODDetailedProposalUser { id: number; name: string; email: string; department?: string; designation?: string; role?: string; }
interface HODDetailedProposalChiefPivot { proposal_id: number; chief_id: number; reason: string | null; hotel_name: string | null; hotel_address: string | null; hotel_duration: number | null; hotel_type: 'srm' | 'others' | null; travel_name: string | null; travel_address: string | null; travel_duration: number | null; travel_type: 'srm' | 'others' | null; created_at: string; updated_at: string; }
interface HODDetailedProposalChief { id: number; name: string; designation: string; address: string; phone: string; pan: string; created_at: string; updated_at: string; pivot: HODDetailedProposalChiefPivot; }
interface HODDetailedProposalItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface HODDetailedProposalSponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface HODDetailedProposalMessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface HODDetailedProposalMessage { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: HODDetailedProposalMessageUser; }

// Main interface for a single, detailed proposal
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
// --- END MODIFIED INTERFACES ---

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
// --- End Interfaces ---

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const HODDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<HODProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalDetail, setSelectedProposalDetail] = useState<PopupProposal | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const { token, user, logout, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();

    const fetchProposals = useCallback(async (authToken: string) => {
        if (!user || user.role !== 'hod') return;
        setLoading(true); setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/hod/proposals`;
        try {
            const response = await axios.get<any>(proposalEndpoint, { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' } });
            // Your API nests the array in `response.data.proposals`
            const proposalsArray: HODProposalListItem[] | null = Array.isArray(response.data?.proposals) ? response.data.proposals : null;
            if (proposalsArray) {
                 // --- FIX: Don't create a fake user object. Just clean the status. ---
                 // The 'user' property will be undefined for each item in the list, which is accurate.
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
                organizer: 'N/A', // Your API provides dept_id, not a department name string.
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

    const closePopup = () => { setSelectedProposalDetail(null); setActionError(null); };
    const handleListItemClick = (proposalItem: HODProposalListItem) => { fetchProposalDetail(proposalItem.id); };

    const handleCalendarEventClick = (proposalData: CalendarProposal) => {
         const proposalId = proposalData.id;
         if (proposalId) { fetchProposalDetail(proposalId); }
         else { console.warn("Calendar event clicked, but no ID found in data:", proposalData); }
     };

    const generateDashboardReportXlsx = () => {
        const validProposals = Array.isArray(proposals) ? proposals : [];
        if (validProposals.length === 0) {
            alert("No proposal data available to generate an Excel report.");
            return;
        }
        // --- FIX: Change column to 'Submitter ID' as name is not available in the list view ---
        const dataForSheet = validProposals.map(p => ({
            "ID": p.id,
            "Title": p.title ?? 'N/A',
            "Event Type": p.event ?? 'N/A',
            "Category": p.category ?? 'N/A',
            "Status": p.status ?? 'N/A',
            "Awaiting": p.awaiting ?? '-',
            "Submitter ID": p.user_id, // Use the user_id which is available
            "Start Date": new Date(p.start).toLocaleDateString(),
        }));
        const ws = XLSX.utils.json_to_sheet(dataForSheet);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Proposals");
        XLSX.writeFile(wb, "HOD_Dashboard_Report.xlsx");
    };

    const generateDashboardReportPdf = async () => {
        const validProposals = Array.isArray(proposals) ? proposals : [];
        if (validProposals.length === 0) {
            alert("No proposal data available to generate a report.");
            return;
        }

        const doc = new jsPDF();
        const approvedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'approved').length;
        const pendingCount = validProposals.filter(p => p?.status?.toLowerCase() === 'pending').length;
        const rejectedCount = validProposals.filter(p => p?.status?.toLowerCase() === 'rejected').length;
        const reviewCount = validProposals.filter(p => p?.status?.toLowerCase() === 'review').length;
        const totalCount = validProposals.length;
        const eventTypeCounts: { [key: string]: number } = validProposals.reduce((acc, proposal) => {
            const eventType = proposal.event || "Uncategorized";
            acc[eventType] = (acc[eventType] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const renderChart = (type: 'pie' | 'bar', data: any, options: any): Promise<string> => {
            return new Promise((resolve, reject) => {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 200;

                try {
                    const chart = new Chart(canvas, {
                        type,
                        data,
                        options: { ...options, animation: false, responsive: false }
                    });
                    const image = canvas.toDataURL('image/png');
                    chart.destroy();
                    resolve(image);
                } catch (error) {
                    reject(error);
                }
            });
        };

        try {
            doc.setFontSize(20).text("HOD Dashboard - Proposal Overview", 105, 20, { align: 'center' });
            doc.setFontSize(11).setTextColor(100).text(`Report Generated: ${new Date().toLocaleDateString()}`, 105, 26, { align: 'center' });
            doc.setFontSize(14).setTextColor(0).text("Summary Statistics", 14, 40);
            doc.setFontSize(11).text(
                `Total Proposals: ${totalCount} | Approved: ${approvedCount} | Pending: ${pendingCount} | Rejected: ${rejectedCount} | In Review: ${reviewCount}`,
                14, 48
            );

            const statusChartImage = await renderChart('pie', {
                labels: ['Approved', 'Pending', 'Rejected', 'In Review'],
                datasets: [{ data: [approvedCount, pendingCount, rejectedCount, reviewCount], backgroundColor: ['#28a745', '#ffc107', '#dc3545', '#17a2b8'] }],
            }, { plugins: { title: { display: true, text: 'Proposal Status Distribution' } } });
            doc.addImage(statusChartImage, 'PNG', 14, 60, 80, 40);

            const eventTypeChartImage = await renderChart('bar', {
                labels: Object.keys(eventTypeCounts),
                datasets: [{ label: 'Number of Proposals', data: Object.values(eventTypeCounts), backgroundColor: '#007bff' }],
            }, { plugins: { title: { display: true, text: 'Proposals by Event Type' } } });
            doc.addImage(eventTypeChartImage, 'PNG', 110, 60, 85, 42.5);

            // --- FIX: Change column to 'Submitter ID' as name is not available in the list view ---
            const tableColumns = ["ID", "Title", "Event Type", "Status", "Awaiting", "Submitter ID"];
            const tableRows = validProposals.map(p => [ p.id.toString(), p.title ?? 'N/A', p.event ?? 'N/A', p.status ?? 'N/A', p.awaiting ?? '-', p.user_id.toString() ]);

            autoTable(doc, {
                startY: 115, head: [tableColumns], body: tableRows, theme: 'striped', headStyles: { fillColor: [41, 128, 185] },
            });

            doc.save('HOD_Dashboard_Report.pdf');
        } catch (chartError) {
            console.error("Failed to render chart for PDF:", chartError);
            alert("Could not generate the PDF report due to a chart rendering error. Please try again.");
        }
    };

     if (isAuthLoading || loading) { return ( <div className="flex justify-center items-center h-screen bg-white"><span className="loading loading-bars loading-lg text-primary"></span></div> ); }
     if (error) { return ( <div className="flex flex-col items-center justify-center h-screen p-4"> <div className={`alert ${error.startsWith("Access Denied") ? 'alert-warning' : 'alert-error'} shadow-lg max-w-md mb-4`}> <div> <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">{error.startsWith("Access Denied") ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />}</svg> <span>{error}</span> </div> </div> {token && user && user.role === 'hod' && !error.startsWith("Access Denied") && ( <button onClick={refreshProposals} className="btn btn-primary">Retry</button> )} <button onClick={logout} className="btn btn-ghost mt-2">Logout</button> </div> ); }
     if (!user || user.role !== 'hod') { return <div className="flex justify-center items-center h-screen">Access Denied. Redirecting...</div>; }

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
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">HOD Dashboard</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={generateDashboardReportPdf}
                        className="btn btn-outline btn-primary btn-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        PDF
                    </button>
                    <button
                        onClick={generateDashboardReportXlsx}
                        className="btn btn-outline btn-accent btn-sm"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4m0 0h-4m4 0h4" /></svg>
                        Excel
                    </button>
                </div>
            </div>
            
            <Stats totalProposalsCount={totalCount} approvedProposalsCount={approvedCount} pendingProposalsCount={pendingCount} rejectedProposalsCount={rejectedCount} reviewProposalsCount={reviewCount} />
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
                         // --- FIX: Use user_id as a fallback since name isn't in the list API ---
                         convenerName: p.user?.name || `User ${p.user_id}`,
                         submissionTimestamp: p.created_at, awaiting: p.awaiting, fundingDetails: {},
                         cost: undefined, email: p.user?.email || undefined, location: undefined, convenerEmail: p.user?.email || undefined,
                         chiefGuestName: undefined, chiefGuestDesignation: undefined, designation: p.user?.designation || undefined,
                         detailedBudget: [], durationEvent: '', estimatedBudget: undefined, eventDate: p.start, eventDescription: p.description || 'N/A',
                         eventTitle: p.title || 'N/A', organizingDepartment: p.user?.department || 'N/A', pastEvents: undefined, proposalStatus: p.status,
                         relevantDetails: undefined, sponsorshipDetails: undefined, sponsorshipDetailsRows: [], rejectionMessage: undefined, reviewMessage: undefined,
                         clarificationMessage: undefined, messages: [], participantExpected: undefined, participantCategories: undefined, items: undefined, sponsors: undefined, chief: undefined
                     }))}
                     onEventClick={handleCalendarEventClick}
                 />
             </div>

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