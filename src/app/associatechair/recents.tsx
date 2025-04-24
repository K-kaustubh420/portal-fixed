import React from 'react';

interface Proposal {
    id: string;
    title: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Review'; // Changed from string
    date: string;
    organizer: string;
    convenerName: string;
    awaiting?: string | null;
}

interface RecentsProps {
    recentAppliedProposals: Proposal[];
    handleProposalClick: (proposal: Proposal) => void;
}

const Recents: React.FC<RecentsProps> = ({ recentAppliedProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Recent Proposals</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Organizing Department</th>
                                <th>Convener</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAppliedProposals.length > 0 ? (
                                recentAppliedProposals.map((proposal) => (
                                    <tr
                                        onClick={() => handleProposalClick(proposal)}
                                        key={proposal.id}
                                        className="cursor-pointer"
                                    >
                                        <td>{proposal.title}</td>
                                        <td>{proposal.organizer}</td>
                                        <td>{proposal.convenerName}</td>
                                        <td>{new Date(proposal.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</td>
                                        <td>
                                            <div className={`badge badge-sm badge-${proposal.status === 'Approved' ? 'success' : proposal.status === 'Pending' ? 'warning' : proposal.status === 'Rejected' ? 'error' : proposal.status === 'Review' ? 'info' : ''}`}>
                                                {proposal.status}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center italic">No recent proposals.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Recents;
