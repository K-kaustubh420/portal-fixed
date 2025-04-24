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

// Shared Interfaces (unchanged, copied as-is)
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

const API_BASE_URL = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const ViceChairDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalData, setSelectedProposalData] = useState<DetailedProposalResponse | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const { token, user, logout } = useAuth();

    useEffect(() => {
        console.log('ViceChairDashboard: useAuth output:', { token, user, userRole: user?.role });
        console.log('ViceChairDashboard: proposals state:', proposals);
        console.log('ViceChairDashboard: stats computed:', calculateStats(proposals));
        if (typeof window !== 'undefined' && window.localStorage) {
            console.log('ViceChairDashboard: localStorage contents:', {
                authToken: localStorage.getItem('authToken'),
                userData: localStorage.getItem('userData'),
                allKeys: Object.keys(localStorage)
            });
            const authData = loadAuthData();
            console.log('ViceChairDashboard: loadAuthData result:', authData);
        }
    }, [token, user, proposals]);

    const fetchProposals = useCallback(async () => {
        if (!token || !user || user.role !== 'vice_chair') {
            setError(user ? "Access denied. User is not a Vice Chairperson." : "User not authenticated.");
            setLoading(false);
            console.log('ViceChairDashboard: fetchProposals skipped due to invalid auth:', { tokenExists: !!token, userRole: user?.role });
            return;
        }
        setLoading(true);
        setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/vice/proposals`;
        try {
            console.log('ViceChairDashboard: Fetching proposals with token:', token.slice(0, 10) + '...');
            interface ApiResponse {
                status: string;
                proposals: ProposalListItem[];
            }
            const response = await axios.get<ApiResponse>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setProposals(response.data.proposals);
            console.log('ViceChairDashboard: Proposals fetched:', response.data.proposals.length);
        } catch (err: any) {
            console.error("ViceChairDashboard: Error fetching Vice proposals:", err);
            const axiosError = err as AxiosError;
            if (axiosError.response?.status === 401) {
                setError("Authentication failed.");
                logout();
                console.log('ViceChairDashboard: 401 error, logging out');
            } else if (axiosError.response?.status === 403) {
                setError("Forbidden.");
                console.log('ViceChairDashboard: 403 Forbidden');
            } else {
                setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals');
                console.log('ViceChairDashboard: Fetch error:', axiosError.message);
            }
            setProposals([]);
        } finally {
            setLoading(false);
        }
    }, [token, user, logout]);

    useEffect(() => {
        if (user?.role === 'vice_chair') {
            fetchProposals();
        } else if (user) {
            setError("Access denied. This dashboard is for Vice Chairpersons only.");
            setLoading(false);
            console.log('ViceChairDashboard: Access denied, user role:', user?.role);
        } else {
            setError("User not authenticated.");
            setLoading(false);
            console.log('ViceChairDashboard: No user authenticated');
        }
    }, [fetchProposals, user]);

    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'vice_chair') {
            console.error("ViceChairDashboard: fetchProposalDetail cancelled: Missing token, user, or incorrect role.", { tokenExists: !!token, userRole: user?.role });
            return;
        }
        setIsPopupLoading(true);
        setError(null);
        const detailEndpoint = `${API_BASE_URL}/api/vice/proposal/${proposalId}`;
        try {
            console.log('ViceChairDashboard: Fetching proposal detail:', { proposalId, endpoint: detailEndpoint });
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            console.log('ViceChairDashboard: Proposal detail fetched:', response.data);
            setSelectedProposalData(response.data);
        } catch (err: any) {
            console.error("ViceChairDashboard: Error fetching proposal detail:", err);
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
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const placeholderEmail = p.faculty?.email || `user${p.user_id}@example.com`;
        const placeholderName = p.faculty?.name || `User ID: ${p.user_id}`;
        const submissionTs = p.created_at || '';

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting === 'vice_chair') tags.push('Awaiting Action');
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
            console.error("ViceChairDashboard: mapDetailResponseToUnifiedProposal received invalid detailData:", detailData);
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
        if (lowerStatus === 'pending' && p.awaiting === 'vice_chair') tags.push('Awaiting Action');
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
        console.log('ViceChairDashboard: Proposal clicked:', proposal);
        const proposalIdNum = parseInt(proposal.id, 10);
        if (!isNaN(proposalIdNum)) {
            fetchProposalDetail(proposalIdNum);
        } else {
            console.error("ViceChairDashboard: Invalid numeric ID parsed from proposal:", proposal.id);
            setError("Could not load details for the selected proposal.");
        }
    }, [fetchProposalDetail]);

    const closePopup = () => setSelectedProposalData(null);
    const handleProposalUpdated = () => { fetchProposals(); closePopup(); };

    if (loading && !error && proposals.length === 0) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
    }

    if (user?.role !== 'vice_chair' && !loading) {
        return <div className="alert alert-error shadow-lg m-4"><div><span>Access Denied: This dashboard is for Vice Chairpersons only. Current role: {user?.role || 'none'}</span></div></div>;
    }

    if (!user && !loading) {
        return <div className="alert alert-warning shadow-lg m-4"><div><span>Please log in to view the dashboard.</span></div></div>;
    }

    if (error && !isPopupLoading && !selectedProposalData) {
        return <div className="alert alert-error shadow-lg m-4"><div><span>Error: {error}</span></div></div>;
    }

    const unifiedProposals: UnifiedProposal[] = Array.isArray(proposals) ? proposals.map(mapListItemToUnifiedProposal) : [];
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentsForView: Proposal[] = Array.isArray(recentAppliedProposals) ? recentAppliedProposals.map(mapListItemToUnifiedProposal).map(mapUnifiedToSimplifiedProposal) : [];
    const proposalForPopup: UnifiedProposal | null = selectedProposalData ? mapDetailResponseToUnifiedProposal(selectedProposalData) : null;

    return (
        <div className="vice-chair-dashboard p-4 md:p-6 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                Vice Chairperson Dashboard
            </h1>

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
                    userRole={user?.role || 'vice_chair'}
                />
            ) : error ? (
                <div className="alert alert-error shadow-lg m-4">
                    <div><span>Error: {error}</span></div>
                </div>
            ) : null}
        </div>
    );
};

export default ViceChairDashboard;