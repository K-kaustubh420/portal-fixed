import React from 'react';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: string;
    convenerName: string;
}

interface ProposalOverviewTableProps {
    eventProposals: Proposal[];
    handleProposalClick: (proposal: Proposal) => void;
}

const ProposalOverviewTable: React.FC<ProposalOverviewTableProps> = ({ eventProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Proposal Overview</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Organizing department</th>
                                <th>Convener</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventProposals.length > 0 ? (
                                eventProposals.map((proposal) => (
                                    <tr onClick={() => handleProposalClick(proposal)} key={proposal.id} className="cursor-pointer">
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
                                    <td colSpan={5} className="text-center italic">No proposals submitted yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProposalOverviewTable;