"use client";

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';
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

export interface Message {
    id: number;
    proposal_id: number;
    user_id: number;
    message: string;
    created_at: string | null;
    updated_at: string | null;
}

export interface User {
    id: number;
    name: string;
    email: string;
    designation?: string;
    role: string;
}

export interface Proposal {
    id: string;
    title: string;
    status: 'Completed' | 'Pending' | 'Rejected' | 'Review';
    date: string;
    organizer: string;
    convenerName: string;
    convenerEmail: string;
    submissionTimestamp: string;
    designation?: string;
    tags?: string[];
    awaiting?: string | null;
}

export interface UnifiedProposal {
    id: string;
    title: string;
    status: 'Completed' | 'Pending' | 'Rejected' | 'Review';
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

// Interface matching items from GET /api/chair/proposals LIST response
interface ProposalListItem {
    id: number;
    user_id: number;
    chief_id: number;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    past: string | null;
    other: string | null;
    status: 'Completed' | 'Pending' | 'Rejected' | 'Review';
    participant_expected: number | null;
    participant_categories: string | null;
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    created_at: string | null;
    updated_at: string | null;
    cheif_reason: string;
    cheif_hotel_name: string;
    cheif_hotel_address: string;
    cheif_hotel_duration: string;
    cheif_hotel_type: string;
    cheif_travel_name: string;
    cheif_travel_address: string;
    cheif_travel_duration: string;
    cheif_travel_type: string;
    department_name: string;
    awaiting: string | null;
}

// Interface matching the FULL response of GET /api/chair/proposals/{proposal}
interface DetailedProposalResponse {
    proposal: ProposalListItem;
    chief: User | null;
    items: Item[];
    sponsors: Sponsor[];
    messages: Message[];
    user?: User | null;
    department_name: string;
}

// API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const ChairDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<ProposalListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposalData, setSelectedProposalData] = useState<DetailedProposalResponse | null>(null);
    const [isPopupLoading, setIsPopupLoading] = useState(false);
    const { token, user, logout } = useAuth();

    // Fetch Proposals
    const fetchProposals = useCallback(async () => {
        if (!token || !user || user.role !== 'chair') {
            setError(user ? "Access denied. User is not a Chairperson." : "User not authenticated.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        const proposalEndpoint = `${API_BASE_URL}/api/chair/proposals`;
        try {
            const response = await axios.get<ProposalListItem[]>(proposalEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setProposals(response.data);
        } catch (err: any) {
            console.error("Error fetching Chair proposals:", err);
            const axiosError = err as AxiosError;
            if (axiosError.response?.status === 401) {
                setError("Authentication failed.");
                logout();
            } else if (axiosError.response?.status === 403) {
                setError("Forbidden.");
            } else {
                setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch proposals');
            }
            setProposals([]);
        } finally {
            setLoading(false);
        }
    }, [token, user, logout]);

    useEffect(() => {
        if (user?.role === 'chair') {
            fetchProposals();
        } else if (user) {
            setError("Access denied. This dashboard is for Chairpersons only.");
            setLoading(false);
        }
    }, [fetchProposals, user]);

    // Fetch Proposal Detail
    const fetchProposalDetail = useCallback(async (proposalId: number | string) => {
        if (!token || !user || user.role !== 'chair') {
            console.error("fetchProposalDetail cancelled: Missing token, user, or incorrect role.");
            return;
        }
        setIsPopupLoading(true);
        setError(null);
        const detailEndpoint = `${API_BASE_URL}/api/chair/proposals/${proposalId}`;
        try {
            const response = await axios.get<DetailedProposalResponse>(detailEndpoint, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setSelectedProposalData(response.data);
        } catch (err: any) {
            console.error("Error fetching proposal detail:", err);
            const axiosError = err as AxiosError;
            if (axiosError.response?.status === 401) {
                setError("Authentication failed.");
                logout();
            } else if (axiosError.response?.status === 403) {
                setError("Forbidden to view this detail.");
            } else if (axiosError.response?.status === 404) {
                setError("Proposal not found.");
            } else {
                setError((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch detail');
            }
            setSelectedProposalData(null);
        } finally {
            setIsPopupLoading(false);
        }
    }, [token, user, logout]);

    // Stats Calculation
    const calculateStats = (proposalList: ProposalListItem[]) => {
        if (!Array.isArray(proposalList)) {
            return { completedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, awaitingChairCount: 0, totalProposalsCount: 0 };
        }
        let completed = 0, pending = 0, rejected = 0, awaitingChairCount = 0;
        proposalList.forEach(p => {
            if (!p || typeof p.status !== 'string') return;
            const status = p.status.toLowerCase();
            if (status === 'completed') completed++;
            else if (status === 'pending') {
                pending++;
                if (p.awaiting === 'chair') awaitingChairCount++;
            }
            else if (status === 'rejected') rejected++;
            // // Uncomment if backend adds 'Review' status
            // else if (status === 'review') {
            //     pending++;
            //     if (p.awaiting === 'chair') awaitingChairCount++;
            // }
        });
        return { completedProposalsCount: completed, pendingProposalsCount: pending, rejectedProposalsCount: rejected, awaitingChairCount, totalProposalsCount: proposalList.length };
    };
    const stats = Array.isArray(proposals) ? calculateStats(proposals) : { completedProposalsCount: 0, pendingProposalsCount: 0, rejectedProposalsCount: 0, awaitingChairCount: 0, totalProposalsCount: 0 };

    // Recent Proposals
    const recentAppliedProposals = Array.isArray(proposals) ? [...proposals]
        .filter(p => p && p.created_at)
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5) : [];

    // Map List Item to UnifiedProposal
    const mapListItemToUnifiedProposal = (p: ProposalListItem): UnifiedProposal => {
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const placeholderEmail = `user${p.user_id}@example.com`;
        const placeholderName = `User ID: ${p.user_id}`;
        const submissionTs = p.created_at || '';

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting === 'chair') tags.push('Awaiting Action');
        // // Uncomment if backend adds 'Review' status
        // if (lowerStatus === 'review') tags.push('Review');

        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            status: p.status,
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
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: [],
            tags: tags,
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            designation: '',
            durationEvent: '',
            organizingDepartment: p.department_name || '',
            awaiting: p.awaiting,
            messages: [],
            rejectionMessage: ''
        };
    };

    // Map UnifiedProposal to Simplified Proposal for child components
    const mapUnifiedToSimplifiedProposal = (p: UnifiedProposal): Proposal => ({
        id: p.id,
        title: p.title,
        status: p.status,
        date: p.date,
        organizer: p.organizer,
        convenerName: p.convenerName,
        convenerEmail: p.convenerEmail,
        submissionTimestamp: p.submissionTimestamp,
        designation: p.designation,
        tags: p.tags,
        awaiting: p.awaiting
    });

    // Map Detailed Response to UnifiedProposal
    const mapDetailResponseToUnifiedProposal = (detailData: DetailedProposalResponse): UnifiedProposal | null => {
        if (!detailData || !detailData.proposal) {
            console.error("mapDetailResponseToUnifiedProposal received invalid detailData:", detailData);
            return null;
        }

        const p = detailData.proposal;
        const submitter = detailData.user;
        const chiefGuest = detailData.chief;
        const calculatedCost = (p.fund_uni ?? 0) + (p.fund_registration ?? 0) + (p.fund_sponsor ?? 0) + (p.fund_others ?? 0);
        const convenerName = submitter?.name || `User ID: ${p.user_id}`;
        const convenerEmail = submitter?.email || `user${p.user_id}@example.com`;
        const designation = submitter?.designation || '';
        const submissionTs = p.created_at || '';

        let rejectionMsg = '';
        // let reviewMsg = '';
        detailData.messages?.forEach(msg => {
            if (p.status === 'Rejected' && !rejectionMsg) rejectionMsg = msg.message;
            // // Uncomment if backend adds 'Review' status
            // if (p.status === 'Review' && !reviewMsg) reviewMsg = msg.message;
        });

        const tags: string[] = [];
        const lowerStatus = p.status.toLowerCase();
        if (lowerStatus === 'completed') tags.push('Done');
        if (lowerStatus === 'rejected') tags.push('Rejected');
        if (lowerStatus === 'pending' && p.awaiting === 'chair') tags.push('Awaiting Action');
        // // Uncomment if backend adds 'Review' status
        // if (lowerStatus === 'review') tags.push('Review');

        return {
            id: String(p.id),
            title: p.title || 'Untitled Proposal',
            description: p.description || '',
            category: p.category || 'Uncategorized',
            status: p.status,
            date: p.start || '',
            eventStartDate: p.start || '',
            eventEndDate: p.end || '',
            submissionTimestamp: submissionTs,
            eventDate: p.start || '',
            eventDescription: p.description || '',
            eventTitle: p.title || 'Untitled Proposal',
            organizer: detailData.department_name || submitter?.name || `User ID: ${p.user_id}`,
            convenerName: convenerName,
            convenerEmail: convenerEmail,
            email: convenerEmail,
            designation: designation,
            cost: calculatedCost,
            estimatedBudget: calculatedCost,
            organizingDepartment: detailData.department_name || '',
            detailedBudget: detailData.items || [],
            durationEvent: '',
            fundingDetails: { universityFund: p.fund_uni, registrationFund: p.fund_registration, sponsorshipFund: p.fund_sponsor, otherSourcesFund: p.fund_others },
            sponsorshipDetails: detailData.sponsors || [],
            tags: tags,
            chiefGuestName: chiefGuest?.name || '',
            chiefGuestDesignation: chiefGuest?.designation || '',
            pastEvents: p.past || '',
            relevantDetails: p.other || '',
            rejectionMessage: rejectionMsg,
            // reviewMessage: reviewMsg,
            messages: detailData.messages,
            chief: detailData.chief,
            user: detailData.user,
            awaiting: p.awaiting
        };
    };

    // Event Handlers
    const handleProposalClick = useCallback((proposal: Proposal) => {
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

    // Render Logic
    if (loading && !error && proposals.length === 0) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-lg loading-spinner text-primary"></span></div>;
    }

    if (user?.role !== 'chair' && !loading) {
        return <div className="alert alert-error shadow-lg m-4"><div><span>Access Denied: This dashboard is for Chairpersons only.</span></div></div>;
    }

    if (!user && !loading) {
        return <div className="alert alert-warning shadow-lg m-4"><div><span>Please log in to view the dashboard.</span></div></div>;
    }

    if (error && !isPopupLoading) {
        return <div className="alert alert-error shadow-lg m-4"><div><span>Error: {error}</span></div></div>;
    }

    const unifiedProposals: UnifiedProposal[] = Array.isArray(proposals) ? proposals.map(mapListItemToUnifiedProposal) : [];
    const proposalsForView: Proposal[] = unifiedProposals.map(mapUnifiedToSimplifiedProposal);
    const recentsForView: Proposal[] = Array.isArray(recentAppliedProposals) ? recentAppliedProposals.map(mapListItemToUnifiedProposal).map(mapUnifiedToSimplifiedProposal) : [];
    const proposalForPopup: UnifiedProposal | null = selectedProposalData ? mapDetailResponseToUnifiedProposal(selectedProposalData) : null;

    return (
        <div className="chair-dashboard p-4 md:p-6 space-y-6 bg-white text-black min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-4">
                Chairperson Dashboard
            </h1>

            <Stats {...stats} />

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

            {proposalForPopup && (
                <Popup
                    selectedProposal={proposalForPopup}
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated}
                    authToken={token}
                    apiBaseUrl={API_BASE_URL}
                    userRole={user?.role || ''}
                />
            )}

            {isPopupLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-60">
                    <span className="loading loading-lg loading-spinner text-white"></span>
                </div>
            )}
        </div>
    );
};

export default ChairDashboard;