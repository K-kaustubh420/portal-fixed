"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';
import AwaitingAtU from './awaitingatu';
import { useAuth } from '@/context/AuthContext';

// Interfaces (unchanged, included for completeness)
export interface Item { id: number; proposal_id: number; category: string; sub_category: string; type: string | null; quantity: number; cost: number; amount: number; created_at: string | null; updated_at: string | null; status: string; }
export interface Sponsor { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string | null; updated_at: string | null; }
export interface Message { id: number; proposal_id: number; user_id: number; message: string; created_at: string | null; updated_at: string | null; }
export interface User {
    name: string;
    department: number | string | { id: number; name: string; };
    email: string;
    role: string;
    designation: string;
    dept_id: number;
}
export interface Proposal { id: string; title: string; status: 'Approved' | 'Pending' | 'Rejected' | 'Review'; date: string; organizer: string; convenerName: string; awaiting?: string | null; event?: string; }
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
    location?: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string;
    durationEvent?: string;
    fundingDetails?: { [key: string]: number | null; };
    organizingDepartment?: string;
    department_name?: string;
    pastEvents?: string | string[] | null;
    proposalStatus?: string;
    relevantDetails?: string | null;
    sponsorshipDetails: Sponsor[];
    sponsorshipDetailsRows?: any[];
    rejectionMessage?: string;
    tags?: string[];
    messages: Message[];
    chief?: User | null;
    user?: User | null;
    awaiting: string | null;
    event?: string;
}
export interface ProposalListItem {
    id: number;
    user_id: number;
    chief_id?: number | null;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    past: string | null;
    other: string | null;
    status: 'completed' | 'pending' | 'rejected' | 'review';
    participant_expected: number | null;
    participant_categories: string | null;
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    created_at: string | null;
    updated_at: string | null;
    department_name: string;
    awaiting: string | null;
    faculty?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        role: string;
        designation: string;
        dept_id: number;
        department?: { id: number; name: string; };
    };
    event?: string; // <<< ADDED
}
export interface DetailedProposalResponse {
    proposal: ProposalListItem;
    chief: User | null;
    items: Item[];
    sponsors: Sponsor[];
    messages: Message[];
    user?: User | null;
    department_name: string;
}
export interface ApiResponse {
    status: string;
    proposals: ProposalListItem[];
}

const capitalize = (str: string): string => {
    if (!str) return '';
    if (str === 'vice_chair') return 'Vice Chair';
    return str
        .split(/[\s_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

interface DashboardState {
    loading: boolean;
    error: string | null;
    proposals: ProposalListItem[];
}

interface PopupState {
    isLoading: boolean;
    selectedProposal: UnifiedProposal | null;
    fetchError: string | null;
}

const ViceChairDashboard: React.FC = () => {
    const [dashboardState, setDashboardState] = useState<DashboardState>({
        loading: true,
        error: null,
        proposals: [],
    });
    const [popupState, setPopupState] = useState<PopupState>({
        isLoading: false,
        selectedProposal: null,
        fetchError: null,
    });
    const [selectedEvent, setSelectedEvent] = useState<Proposal | null>(null);
    const { token, user, logout } = useAuth();
    const apiBaseUrl = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";
    const expectedUserRole = 'vice_chair';
    const apiRoleSegment = 'vice';

    const calculateStats = useMemo(
        () => (proposalList: ProposalListItem[]) => {
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
        },
        []
    );

    const fetchProposals = useCallback(async () => {
        if (!token || !user || user.role !== expectedUserRole) {
            setDashboardState({
                loading: false,
                error: user ? `Access denied. User is not a ${capitalize(expectedUserRole)}.` : "User not authenticated.",
                proposals: [],
            });
            return;
        }
        setDashboardState(prev => ({ ...prev, loading: true, error: null }));
        const proposalEndpoint = `${apiBaseUrl}/api/${apiRoleSegment}/proposals`;
        try {
            const response = await axios.get<ApiResponse>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            setDashboardState({
                loading: false,
                error: null,
                proposals: response.data.proposals || [],
            });
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposals';
            if (axiosError.response?.status === 401) {
                errorMessage = "Authentication failed.";
                logout();
            } else if (axiosError.response?.status === 403) {
                errorMessage = `Forbidden: You lack permission to view ${capitalize(expectedUserRole)} proposals.`;
            } else {
                errorMessage =
                    (axiosError.response?.data as any)?.message ||
                    axiosError.message ||
                    `Failed to fetch ${capitalize(expectedUserRole)} proposals`;
            }
            setDashboardState({
                loading: false,
                error: errorMessage,
                proposals: [],
            });
        }
    }, [token, user, logout, apiBaseUrl, expectedUserRole, apiRoleSegment]);

    const fetchProposalDetail = useCallback(async (proposalId: number): Promise<UnifiedProposal | null> => {
        if (!token || !user || user.role !== expectedUserRole) {
            setPopupState(prev => ({ ...prev, fetchError: "Authentication or authorization failed.", isLoading: false }));
            return null;
        }
        setPopupState(prev => ({ ...prev, isLoading: true, fetchError: null }));
        const detailEndpoint = `${apiBaseUrl}/api/${apiRoleSegment}/proposals/${proposalId}`;
        try {
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
            });
            const proposal = mapDetailResponseToUnifiedProposal(response.data);
            setPopupState(prev => ({ ...prev, isLoading: false, selectedProposal: proposal, fetchError: null }));
            return proposal;
        } catch (err: any) {
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposal details';
            if (axiosError.response?.status === 404) {
                errorMessage = `Proposal not found or is not awaiting at the ${capitalize(apiRoleSegment)} level.`;
            } else if (axiosError.response?.status === 401) {
                errorMessage = "Authentication failed.";
                logout();
            } else if (axiosError.response?.status === 403) {
                errorMessage = `Forbidden: You lack permission to view this proposal as ${capitalize(expectedUserRole)}.`;
            } else {
                errorMessage =
                    (axiosError.response?.data as any)?.message ||
                    axiosError.message ||
                    'An unexpected error occurred while fetching details';
            }
            setPopupState(prev => ({ ...prev, isLoading: false, fetchError: errorMessage, selectedProposal: null }));
            return null;
        }
    }, [token, user, logout, apiBaseUrl, expectedUserRole, apiRoleSegment]);

    const mapListItemToUnifiedProposal = useCallback((p: ProposalListItem): UnifiedProposal => {
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convener = p.faculty;
        const convenerName = convener?.name || `User ID ${p.user_id}`;
        const convenerEmail = convener?.email || 'N/A';
        const designation = convener?.designation || '';
        const departmentName = p.department_name || convener?.department?.name || 'Unknown Department';
        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === apiRoleSegment) tags.push('Awaiting Action');
        if (lowerStatus === 'review') tags.push('Review');
        let userDepartmentValue: string | number | { id: number; name: string; };
        if (convener?.department) {
            if (typeof convener.department === 'object' && convener.department !== null && 'id' in convener.department && 'name' in convener.department) {
                userDepartmentValue = convener.department;
            } else if (typeof convener.department === 'string' || typeof convener.department === 'number') {
                userDepartmentValue = convener.department;
            } else {
                userDepartmentValue = convener.dept_id;
            }
        } else {
            userDepartmentValue = convener?.dept_id ?? -1;
        }
        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            status: p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '',
            organizer: departmentName,
            convenerName,
            convenerEmail,
            submissionTimestamp: p.created_at || '',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            event: p.event, // <<< ADDED
            cost: calculatedCost,
            detailedBudget: [],
            estimatedBudget: calculatedCost,
            email: convenerEmail,
            designation,
            organizingDepartment: departmentName,
            department_name: departmentName,
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: [],
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            tags,
            messages: [],
            awaiting: p.awaiting,
            chief: null,
            user: convener
                ? { name: convener.name, department: userDepartmentValue, email: convener.email, role: convener.role, designation: convener.designation, dept_id: convener.dept_id }
                : null,
        };
    }, [apiRoleSegment]);

    const mapDetailResponseToUnifiedProposal = useCallback((detailData: DetailedProposalResponse): UnifiedProposal => {
        const p = detailData.proposal;
        const submitter = detailData.user || p.faculty;
        const chiefGuest = detailData.chief;
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = submitter?.name || `User ID: ${p.user_id}`;
        const convenerEmail = submitter?.email || 'N/A';
        const designation = submitter?.designation || '';
        const departmentName =
            detailData.department_name ||
            (submitter?.department && typeof submitter.department === 'object' && submitter.department !== null && 'name' in submitter.department
                ? submitter.department.name
                : undefined) ||
            p.department_name ||
            (submitter?.department && typeof submitter.department === 'object' && submitter.department !== null && 'name' in submitter.department
                ? submitter.department.name
                : undefined) ||
            p.department_name ||
            (p.faculty?.department ? p.faculty.department.name : undefined) ||
            'Unknown Department';
        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting?.toLowerCase() === apiRoleSegment) tags.push('Awaiting Action');
        if (lowerStatus === 'review') tags.push('Review');
        let rejectionMsg = '';
        if (p.status === 'rejected') {
            rejectionMsg = detailData.messages?.slice().reverse().find(msg => msg.message.toLowerCase().includes('reject'))?.message || 'Rejected (Reason not specified)';
        }
        let userDepartmentValue: string | number | { id: number; name: string; };
        if (submitter?.department) {
            if (typeof submitter.department === 'object' && submitter.department !== null && 'id' in submitter.department && 'name' in submitter.department) {
                userDepartmentValue = submitter.department;
            } else if (typeof submitter.department === 'string' || typeof submitter.department === 'number') {
                userDepartmentValue = submitter.department;
            } else {
                userDepartmentValue = submitter.dept_id;
            }
        } else {
            userDepartmentValue = submitter?.dept_id ?? -1;
        }
        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            status: p.status === 'completed' ? 'Approved' : capitalize(p.status) as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '',
            organizer: departmentName,
            convenerName,
            convenerEmail,
            submissionTimestamp: p.created_at || '',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            event: p.event, // <<< ADDED
            cost: calculatedCost,
            detailedBudget: detailData.items || [],
            estimatedBudget: calculatedCost,
            email: convenerEmail,
            designation,
            organizingDepartment: departmentName,
            department_name: departmentName,
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: detailData.sponsors || [],
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            tags,
            messages: detailData.messages || [],
            awaiting: p.awaiting,
            chief: chiefGuest,
            user: submitter
                ? { name: submitter.name, department: userDepartmentValue, email: submitter.email, role: submitter.role, designation: submitter.designation, dept_id: submitter.dept_id }
                : null,
            rejectionMessage: rejectionMsg,
        };
    }, [apiRoleSegment]);

    const mapUnifiedToSimplifiedProposal = useCallback((p: UnifiedProposal): Proposal => ({
        id: p.id,
        title: p.title,
        status: p.status,
        date: p.date,
        organizer: p.organizer,
        convenerName: p.convenerName,
        awaiting: p.awaiting,
        event: p.event,
    }), []);

    const handleProposalClick = useCallback(async (proposal: Proposal) => {
        const proposalId = proposal.id ? String(proposal.id).trim() : null;
        if (!proposalId || isNaN(parseInt(proposalId, 10))) {
            setPopupState(prev => ({ ...prev, fetchError: 'Selected proposal has an invalid ID.', selectedProposal: null, isLoading: false }));
            return;
        }
        const numericId = parseInt(proposalId, 10);
        setPopupState(prev => ({ ...prev, selectedProposal: null, fetchError: null, isLoading: true }));
        await fetchProposalDetail(numericId);
    }, [fetchProposalDetail]);

    const closePopup = useCallback(() => {
        setPopupState(prev => ({ ...prev, selectedProposal: null, fetchError: null, isLoading: false }));
    }, []);

    const handlePopupUpdate = useCallback(() => {
        fetchProposals();
        closePopup();
    }, [fetchProposals, closePopup]);

    useEffect(() => {
        if (user?.role === expectedUserRole) {
            fetchProposals();
        } else {
            setDashboardState({
                loading: false,
                error: user
                    ? `Access denied. This dashboard is for ${capitalize(expectedUserRole)}s only.`
                    : "User not authenticated.",
                proposals: [],
            });
        }
    }, [fetchProposals, user, expectedUserRole]);

    const stats = calculateStats(dashboardState.proposals);
    const unifiedProposals: UnifiedProposal[] = dashboardState.proposals.map(mapListItemToUnifiedProposal);
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentAppliedProposals = Array.isArray(dashboardState.proposals)
        ? [...dashboardState.proposals]
            .filter(p => p && p.created_at)
            .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
            .slice(0, 5)
        : [];
    const recentsForView: Proposal[] = recentAppliedProposals
        .map(mapListItemToUnifiedProposal)
        .map(mapUnifiedToSimplifiedProposal);

    return (
        <div className="vice-chair-dashboard p-4 md:p-6 space-y-6 bg-gray-50 text-gray-900 min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 border-b pb-3">
             Associate Chair Dashboard
            </h1>

            {dashboardState.loading && (
                <div className="flex justify-center items-center h-64">
                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                    <p className="ml-3">Loading proposals...</p>
                </div>
            )}

            {!dashboardState.loading && dashboardState.error && (
                <div className="alert alert-error shadow-lg max-w-xl mx-auto">
                    <div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Error! {dashboardState.error}</span>
                    </div>
                </div>
            )}

            {!dashboardState.loading && !dashboardState.error && (
                <>
                    <Stats {...stats} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Overview eventProposals={proposalsForView} handleProposalClick={handleProposalClick} />
                            <Recents recentAppliedProposals={recentsForView} handleProposalClick={handleProposalClick} />
                        </div>
                        <div className="space-y-6">
                            <AwaitingAtU proposals={unifiedProposals} userRole={apiRoleSegment} />
                        </div>
                    </div>
                    <div className="mt-8 bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold text-slate-800 mb-4">Event Calendar</h2>
                        <CalendarView proposals={unifiedProposals} />
                    </div>
                </>
            )}

            {popupState.isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-60 backdrop-blur-sm">
                    <span className="loading loading-lg loading-spinner text-white"></span>
                </div>
            )}

            {popupState.fetchError && !popupState.isLoading && (
                <Popup
                    selectedProposal={popupState.selectedProposal}
                    closePopup={closePopup}
                    onProposalUpdated={() => { }}
                    authToken={null}
                    apiBaseUrl=""
                    userRole=""
                    fetchError={popupState.fetchError}
                />
            )}

            {popupState.selectedProposal && !popupState.isLoading && !popupState.fetchError && (
                <Popup
                    selectedProposal={popupState.selectedProposal}
                    closePopup={closePopup}
                    onProposalUpdated={handlePopupUpdate}
                    authToken={token}
                    apiBaseUrl={apiBaseUrl}
                    userRole={apiRoleSegment}
                    fetchError={null}
                />
            )}
        </div>
    );
};

export default React.memo(ViceChairDashboard);