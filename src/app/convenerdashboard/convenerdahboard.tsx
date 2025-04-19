// ConvenerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Overview from './overview';
import Stats from './stats';
import Popup from './popup';
import Recents from './recents';
import CalendarView from './calendarview';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: string;
    category: string;
    cost: number;
    email: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation: string;
    detailedBudget: { mainCategory: string; subCategory: string; totalAmount?: number }[];
    durationEvent: string;
    estimatedBudget: number;
    eventDate: string;
    eventDescription: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle: string;
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    organizingDepartment: string;
    pastEvents?: string[];
    proposalStatus: string;
    relevantDetails?: string;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: { [key: string]: string | number | boolean }[];
    submissionTimestamp: string;
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
}

const ConvenerDashboard: React.FC = () => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

    const API_BASE_URL = 'http://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty';

    const fetchProposals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get<Proposal[]>(`${API_BASE_URL}/proposals`);
            setProposals(response.data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch proposals');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    // Derive Stats from Proposals
    const approvedProposalsCount = proposals.filter(p => p.status === 'Approved').length;
    const pendingProposalsCount = proposals.filter(p => p.status === 'Pending').length;
    const rejectedProposalsCount = proposals.filter(p => p.status === 'Rejected').length;
    const reviewProposalsCount = proposals.filter(p => p.status === 'Review').length;
    const totalProposalsCount = proposals.length;

    //Sort proposals by updated date
    const recentAppliedProposals = [...proposals].sort((a, b) => new Date(b.submissionTimestamp).getTime() - new Date(a.submissionTimestamp).getTime()).slice(0, 5);

    const handleProposalClick = (proposal: Proposal) => {
        setSelectedProposal(proposal);
    };

    const closePopup = () => {
        setSelectedProposal(null);
    };

    const handleProposalUpdated = () => {
        fetchProposals();
    };

    if (loading) {
        return <div>Loading proposals...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="convener-dashboard">
            <h1>Faculty/Convener Dashboard</h1>

            <Overview eventProposals={proposals} handleProposalClick={handleProposalClick} />
            <Stats
                totalProposalsCount={totalProposalsCount}
                approvedProposalsCount={approvedProposalsCount}
                pendingProposalsCount={pendingProposalsCount}
                rejectedProposalsCount={rejectedProposalsCount}
                reviewProposalsCount={reviewProposalsCount}
            />
            <Recents recentAppliedProposals={recentAppliedProposals} handleProposalClick={handleProposalClick} />
            <CalendarView proposals = {proposals}/>
            {selectedProposal && (
                <Popup
                    selectedProposal={selectedProposal}
                    closePopup={closePopup}
                    onProposalUpdated={handleProposalUpdated}
                />
            )}
        </div>
    );
};

export default ConvenerDashboard;