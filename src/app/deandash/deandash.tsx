"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';
import { useAuth } from '@/context/AuthContext';
import { loadAuthData } from '@/lib/users';

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

export interface Message {
    id: number;
    proposal_id: number;
    user_id: number;
    message: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface User {
    name: string;
    department: number | string;
    email: string;
    role: string;
    designation: string;
    dept_id: number;
}

export interface Proposal {
    id: string;
    title: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Review';
    date: string;
    organizer: string;
    convenerName: string;
    awaiting?: string | null;
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
    location?: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string;
    durationEvent?: string;
    fundingDetails?: {
        registrationFund?: number | null;
        sponsorshipFund?: number | null;
        universityFund?: number | null;
        otherSourcesFund?: number | null;
    };
    organizingDepartment?: string;
    pastEvents?: string | string[] | null;
    proposalStatus?: string;
    relevantDetails?: string | null;
    sponsorshipDetails?: Sponsor[];
    sponsorshipDetailsRows?: any[];
    rejectionMessage?: string;
    tags?: string[];
    messages?: Message[];
    chief?: User | null;
    user?: User | null;
    awaiting: string | null;
}

interface ProposalListItem {
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
    faculty?: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string | null;
        phone: string;
        role: string;
        scope: string | null;
        designation: string;
        dept_id: number;
        created_at: string;
        updated_at: string;
        department: {
            id: number;
            name: string;
            scope: string;
            status: string;
            created_at: string;
            updated_at: string;
            hod_id: number;
        };
    };
}

interface DetailedProposalResponse {
    proposal: ProposalListItem;
    chief: User | null;
    items: Item[];
    sponsors: Sponsor[];
    messages: Message[];
    user?: User | null;
    department_name: string;
}

interface ApiResponse {
    status: string;
    proposals: ProposalListItem[];
}

const API_BASE_URL = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const DeanDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalData, setSelectedProposalData] = useState<DetailedProposalResponse | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        console.log('DeanDashboard: useAuth output:', { token, user, userRole: user?.role });
        console.log('DeanDashboard: proposals state:', proposals);
        console.log('DeanDashboard: stats computed:', calculateStats(proposals));
        if (typeof window !== 'undefined' && window.localStorage) {
            console.log('DeanDashboard: localStorage contents:', {
                authToken: localStorage.getItem('authToken'),
                userData: localStorage.getItem('userData'),
                allKeys: Object.keys(localStorage)
            });
            const authData = loadAuthData();
            console.log('DeanDashboard: loadAuthData result:', authData);
        }
    }, [token, user, proposals]);

    useEffect(() => {
        console.log('DeanDashboard: Proposals state updated:', proposals);
    }, [proposals]);

    const fetchProposals = useCallback(async () => {
        if (!token || !user || user.role !== 'dean') {
            setError(user ? "Access denied. User is not a Dean." : "User not authenticated.");
            setLoading(false);
            console.log('DeanDashboard: fetchProposals skipped due to invalid auth:', { tokenExists: !!token, userRole: user?.role });
            return;
        }
        setLoading(true);
        setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/dean/proposals`;
        try {
            console.log('DeanDashboard: Fetching proposals from:', proposalEndpoint);
            console.log('DeanDashboard: Using token:', token ? token.slice(0, 10) + '...' : 'No token');
            const response = await axios.get<ApiResponse>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            console.log('DeanDashboard: Proposals fetched:', response.data.proposals);
            setProposals(response.data.proposals);
        } catch (err: any) {
            console.error('DeanDashboard: Detailed error:', err);
            const axiosError = err as AxiosError;
            console.log('DeanDashboard: Error code:', axiosError.code);
            console.log('DeanDashboard: Error message:', axiosError.message);
            console.log('DeanDashboard: Error response:', axiosError.response);
            console.log('DeanDashboard: Error request:', axiosError.request);
            if (axiosError.code === 'ERR_NETWORK') {
                setError("Network error: Unable to reach the server. Please check your connection or server status.");
            } else if (axiosError.response?.status === 401) {
                setError("Authentication failed.");
                logout();
            } else if (axiosError.response?.status === 403) {
                setError("Forbidden.");
            } else {
                setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals');
            }
            // Avoid resetting proposals to keep existing data
            // setProposals([]);
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
            console.log('DeanDashboard: Access denied, user role:', user?.role);
        } else {
            setError("User not authenticated.");
            setLoading(false);
            console.log('DeanDashboard: No user authenticated');
        }
    }, [fetchProposals, user]);

    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'dean') {
            console.error("DeanDashboard: fetchProposalDetail cancelled: Missing token, user, or incorrect role.", { tokenExists: !!token, userRole: user?.role });
            return;
        }
        setIsPopupLoading(true);
        setError(null);
        const detailEndpoint = `${API_BASE_URL}/api/dean/proposal/${proposalId}`;
        try {
            console.log('DeanDashboard: Fetching proposal detail:', { proposalId, endpoint: detailEndpoint });
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            console.log('DeanDashboard: Proposal detail fetched:', response.data);
            setSelectedProposalData(response.data);
        } catch (err: any) {
            console.error("DeanDashboard: Error fetching proposal detail:", err);
            const axiosError = err as AxiosError;
            let errorMessage = 'Failed to fetch proposal details';
            if (axiosError.response?.status === 401) {
                errorMessage = "Authentication failed.";
                logout();
            } else if (axiosError.response?.status === 403) {
                errorMessage = "Forbidden to view this proposal.";
            } else if (axiosError.response?.status === 404) {
                errorMessage = `Proposal with ID ${proposalId} not found.`;
            } else {
                errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposal details';
            }
            setError(errorMessage);
            setSelectedProposalData(null);
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
            const status = p.status.toLowerCase();
            if (status === 'completed') approved++;
            else if (status === 'pending') pending++;
            else if (status === 'rejected') rejected++;
            else if (status === 'review') review++;
        });
        return { approvedProposalsCount: approved, pendingProposalsCount: pending, rejectedProposalsCount: rejected, reviewProposalsCount: review, totalProposalsCount: proposalList.length };
    };
    const stats = Array.isArray(proposals) ? calculateStats(proposals) : { approvedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, reviewProposalsCount: 0, totalProposalsCount: 0 };

    const recentAppliedProposals = Array.isArray(proposals) ? [...proposals]
        .filter(p => p && p.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5) : [];

    const mapListItemToUnifiedProposal = (p: ProposalListItem): UnifiedProposal => {
        try {
            const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
            const placeholderEmail = p.faculty?.email || `user${p.user_id}@example.com`;
            const placeholderName = p.faculty?.name || `User ID: ${p.user_id}`;
            const submissionTs = p.created_at || '';

            const tags: string[] = [];
            const lowerStatus = p.status.toLowerCase();
            if (lowerStatus === 'completed') tags.push('Done');
            if (lowerStatus === 'rejected') tags.push('Rejected');
            if (lowerStatus === 'pending' && p.awaiting === 'dean') tags.push('Awaiting Action');
            if (lowerStatus === 'review') tags.push('Review');

            return {
                id: String(p.id),
                title: p.title || 'Untitled Proposal',
                description: p.description || '',
                category: p.category || 'Uncategorized',
                status: p.status === 'completed' ? 'Approved' : p.status as 'Pending' | 'Rejected' | 'Review',
                date: p.start || '',
                eventStartDate: p.start || '',
                eventEndDate: p.end || '',
                submissionTimestamp: submissionTs,
                eventDate: p.start || '',
                eventDescription: p.description || '',
                eventTitle: p.title || 'Untitled Proposal',
                organizer: p.department_name || placeholderName,
                convenerName: placeholderName,
                convenerEmail: placeholderEmail,
                email: placeholderEmail,
                cost: calculatedCost,
                estimatedBudget: calculatedCost,
                detailedBudget: [],
                fundingDetails: {
                    universityFund: p.fund_uni,
                    registrationFund: p.fund_registration,
                    sponsorshipFund: p.fund_sponsor,
                    otherSourcesFund: p.fund_others
                },
                sponsorshipDetails: [],
                tags: tags,
                pastEvents: p.past || '',
                relevantDetails: p.other || '',
                designation: p.faculty?.designation || '',
                durationEvent: '',
                organizingDepartment: p.department_name || '',
                awaiting: p.awaiting,
                messages: [],
                rejectionMessage: '',
                chief: null,
                user: p.faculty ? {
                    name: p.faculty.name,
                    department: p.faculty.dept_id,
                    email: p.faculty.email,
                    role: p.faculty.role,
                    designation: p.faculty.designation,
                    dept_id: p.faculty.dept_id
                } : null
            };
        } catch (error) {
            console.error('DeanDashboard: Error in mapListItemToUnifiedProposal:', error, 'Proposal:', p);
            return {
                id: String(p.id),
                title: 'Error Parsing Proposal',
                description: '',
                category: 'Unknown',
                status: 'Pending',
                date: '',
                eventStartDate: '',
                eventEndDate: '',
                submissionTimestamp: '',
                eventDate: '',
                eventDescription: '',
                eventTitle: 'Error',
                organizer: 'Unknown',
                convenerName: 'Unknown',
                convenerEmail: '',
                email: '',
                cost: 0,
                estimatedBudget: 0,
                detailedBudget: [],
                fundingDetails: {},
                sponsorshipDetails: [],
                tags: [],
                pastEvents: '',
                relevantDetails: '',
                designation: '',
                durationEvent: '',
                organizingDepartment: '',
                awaiting: null,
                messages: [],
                rejectionMessage: '',
                chief: null,
                user: null
            };
        }
    };

    const mapUnifiedToSimplifiedProposal = (p: UnifiedProposal): Proposal => ({
        id: p.id,
        title: p.title,
        status: p.status,
        date: p.date,
        organizer: p.organizer,
        convenerName: p.convenerName,
        awaiting: p.awaiting
    });

    const mapDetailResponseToUnifiedProposal = (detailData: DetailedProposalResponse): UnifiedProposal | null => {
        if (!detailData || !detailData.proposal) {
            console.error("DeanDashboard: mapDetailResponseToUnifiedProposal received invalid detailData:", detailData);
            return null;
        }

        const p = detailData.proposal;
        const submitter = detailData.user;
        const chiefGuest = detailData.chief;
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = submitter?.name || p.faculty?.name || `User ID: ${p.user_id}`;
        const convenerEmail = submitter?.email || p.faculty?.email || `user${p.user_id}@example.com`;
        const designation = submitter?.designation || p.faculty?.designation || '';
        const submissionTs = p.created_at || '';

        let rejectionMsg = '';
        detailData.messages?.forEach(msg => {
            if (p.status === 'rejected' && !rejectionMsg) rejectionMsg = msg.message;
        });

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting === 'dean') tags.push('Awaiting Action');
        if (lowerStatus === 'review') tags.push('Review');

        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            status: p.status === 'completed' ? 'Approved' : p.status as 'Pending' | 'Rejected' | 'Review',
            date: p.start || '',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            submissionTimestamp: submissionTs,
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            organizer: detailData.department_name || convenerName,
            convenerName: convenerName,
            convenerEmail: convenerEmail,
            email: convenerEmail,
            designation: designation,
            cost: calculatedCost,
            estimatedBudget: calculatedCost,
            organizingDepartment: detailData.department_name || '',
            detailedBudget: detailData.items || [],
            durationEvent: '',
            fundingDetails: {
                universityFund: p.fund_uni,
                registrationFund: p.fund_registration,
                sponsorshipFund: p.fund_sponsor,
                otherSourcesFund: p.fund_others
            },
            sponsorshipDetails: detailData.sponsors || [],
            tags: tags,
            chiefGuestName: chiefGuest?.name || '',
            chiefGuestDesignation: chiefGuest?.designation || '',
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            rejectionMessage: rejectionMsg,
            messages: detailData.messages || [],
            chief: detailData.chief,
            user: detailData.user || (p.faculty ? {
                name: p.faculty.name,
                department: p.faculty.dept_id,
                email: p.faculty.email,
                role: p.faculty.role,
                designation: p.faculty.designation,
                dept_id: p.faculty.dept_id
            } : null),
            awaiting: p.awaiting
        };
    };

    const handleProposalClick = useCallback((proposal: Proposal) => {
        console.log('DeanDashboard: Proposal clicked:', proposal);
        const proposalIdNum = parseInt(proposal.id, 10);
        if (!isNaN(proposalIdNum)) {
            fetchProposalDetail(proposalIdNum);
        } else {
            console.error("DeanDashboard: Invalid numeric ID parsed from proposal:", proposal.id);
            setError("Could not load details for the selected proposal.");
        }
    }, [fetchProposalDetail]);

    const closePopup = () => setSelectedProposalData(null);
    const handleProposalUpdated = () => { fetchProposals(); closePopup(); };

    console.log('DeanDashboard: Render state:', { loading, error, userRole: user?.role, proposalsLength: proposals.length });

    // Simplified rendering for debugging
    const unifiedProposals: UnifiedProposal[] = Array.isArray(proposals) ? proposals.map(mapListItemToUnifiedProposal) : [];
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentsForView: Proposal[] = Array.isArray(recentAppliedProposals) ? recentAppliedProposals.map(mapListItemToUnifiedProposal).map(mapUnifiedToSimplifiedProposal) : [];
    const proposalForPopup: UnifiedProposal | null = selectedProposalData ? mapDetailResponseToUnifiedProposal(selectedProposalData) : null;

    console.log('DeanDashboard: Props for Overview:', proposalsForView);
    console.log('DeanDashboard: Props for Recents:', recentsForView);
    console.log('DeanDashboard: Props for Stats:', stats);

    return (
        <div className="dean-dashboard p-4 md:p-6 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                Dean Dashboard
            </h1>
            {/*<pre>{JSON.stringify(proposals, null, 2)}</pre> Debug: Display raw proposals */}
            {!loading && !error && <Stats {...stats} />}
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
            </div>
            <div className="mt-6">
                <CalendarView proposals={unifiedProposals} />
            </div>
            {isPopupLoading ? (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-60">
                    <span className="loading loading-lg loading-spinner text-white"></span>
                </div>
            ) : proposalForPopup ? (
                <Popup
                    selectedProposal={proposalForPopup}
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated}
                    authToken={token}
                    apiBaseUrl={API_BASE_URL}
                    userRole={user?.role || 'dean'}
                />
            ) : error ? (
                <div className="alert alert-error shadow-lg m-4">
                    <div><span>Error: {error}</span></div>
                </div>
            ) : null}
        </div>
    );
};

export default DeanDashboard;