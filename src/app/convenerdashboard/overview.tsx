import React from 'react';

// Interface for individual proposal data
interface OverviewProposal {
  id: string;
  title: string;
  start: string;
  end: string;
  description: string;
  status: string;
  event?: string;
  originalItem?: any;
}

// Props for Convenor Overview
interface OverviewProps {
  eventProposals: OverviewProposal[];
  handleProposalClick: (proposalItem: any) => void;
}

// Helper: format role/status
const formatRole = (role: string | null | undefined): string => {
  if (!role) return '-';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper: format date
const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const datePart = dateString.split(' ')[0];
    const dateObj = new Date(datePart);
    return !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Invalid Date';
  } catch {
    return 'Invalid Date';
  }
};

// Helper: status badge class
const getStatusClass = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-700';
    case 'completed':
      return 'bg-purple-100 text-purple-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'review':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const Overview: React.FC<OverviewProps> = ({
  eventProposals,
  handleProposalClick,
}) => {
  return (
    <div className="card shadow-md rounded-lg bg-white">
      <div className="card-body">
        <h2 className="card-title text-lg font-bold text-gray-700 mb-4">
          My Event Proposals
        </h2>

        <div className="overflow-x-auto">
          <table className="table table-compact w-full">
            <thead>
              <tr className="bg-blue-100 text-blue-900 text-xs uppercase tracking-wider">
                <th className="p-3">Title</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">End Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Event Status</th>
              </tr>
            </thead>

            <tbody>
              {eventProposals.length > 0 ? (
                eventProposals.map((proposal) => (
                  <tr
                    key={proposal.id}
                    className="text-sm border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      handleProposalClick(proposal.originalItem || proposal)
                    }
                  >
                    <td className="p-2 font-medium text-gray-800">
                      {proposal.title}
                    </td>
                    <td className="p-2 text-gray-600">
                      {formatDate(proposal.start)}
                    </td>
                    <td className="p-2 text-gray-600">
                      {formatDate(proposal.end)}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(
                          proposal.status
                        )}`}
                      >
                        {formatRole(proposal.status)}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          proposal.event === 'rescheduled'
                            ? 'bg-yellow-100 text-yellow-800'
                            : proposal.event === 'cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {proposal.event || '-'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center italic py-4 text-gray-500"
                  >
                    No proposals submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
