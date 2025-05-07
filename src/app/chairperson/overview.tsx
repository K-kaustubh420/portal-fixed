import React from 'react';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Review'; // Changed from string
    convenerName: string;
    awaiting?: string | null;
    event?: string; // Original item for click handler
}

interface ProposalOverviewTableProps {
    eventProposals: Proposal[];
    handleProposalClick: (proposal: Proposal) => void;
}

// Format awaiting role (e.g., 'vice_chair' → 'Vice Chair')
const formatAwaiting = (awaiting: string | null | undefined): string => {
    if (!awaiting) return 'None';
    return awaiting
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const ProposalOverviewTable: React.FC<ProposalOverviewTableProps> = ({ eventProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Proposal Overview</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr className='bg-blue-400 text-gray-700'>
                                <th>Title</th>
                                <th>Organizing department</th>
                                <th>Convener</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Awaiting</th>
                                <th>Event status</th>
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
                                        <td>{formatAwaiting(proposal.awaiting)}</td>
                                        <td className="p-2 cursor-pointer">
  <span
    className={`px-2 py-1 rounded-full text-sm font-medium ${
      proposal.event === 'rescheduled'
        ? 'bg-yellow-100 text-yellow-800'
        : proposal.event === 'cancelled'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-600'
    }`}
  >
    {proposal.event}
  </span>
</td>

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center italic">No proposals submitted yet.</td>
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
