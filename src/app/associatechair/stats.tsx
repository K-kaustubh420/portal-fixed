import React from 'react';

interface StatsProps {
    approvedProposalsCount?: number;
    pendingProposalsCount?: number;
    rejectedProposalsCount?: number;
    reviewProposalsCount?: number;
    totalProposalsCount?: number;
}

const Stats: React.FC<StatsProps> = ({
    approvedProposalsCount = 0,
    pendingProposalsCount = 0,
    rejectedProposalsCount = 0,
    reviewProposalsCount = 0,
    totalProposalsCount = 0
}) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Associate Chair Proposal Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stat">
                        <div className="stat-title">Total Proposals</div>
                        <div className="stat-value">{totalProposalsCount.toLocaleString()}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Approved</div>
                        <div className="stat-value text-success">{approvedProposalsCount.toLocaleString()}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Pending</div>
                        <div className="stat-value text-warning">{pendingProposalsCount.toLocaleString()}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Rejected</div>
                        <div className="stat-value text-error">{rejectedProposalsCount.toLocaleString()}</div>
                    </div>
                    <div className="stat">
                        <div className="stat-title">Under Review</div>
                        <div className="stat-value text-info">{reviewProposalsCount.toLocaleString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Stats;
