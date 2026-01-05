// Overview.tsx (or ProposalOverviewTable.tsx)
import React from 'react';

// Interface for the props expected by THIS component
interface OverviewProposal {
    id: string;
    title: string;
    start: string; // Event start date/time string from API
    end: string;   // Event end date/time string from API
    description: string;
    status: string;           // <<< ADDED: Status field
    awaiting?: string | null; // Role awaiting approval
    originalItem?: any;
    event?:string;     // Original item for click handler
}

interface OverviewProps {
    eventProposals: OverviewProposal[]; // Use the updated interface
    handleProposalClick: (proposalItem: any) => void; // Use 'any' or a more specific list item type
}

// Format awaiting role (e.g., 'vice_chair' → 'Vice Chair')
const formatRole = (role: string | null | undefined): string => {
    if (!role) return '-';
    return role
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
};

// Format date string (YYYY-MM-DD HH:MM:SS) to DD MMM YYYY
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        // Use a simple split if format is consistently YYYY-MM-DD...
        const datePart = dateString.split(' ')[0];
        const dateObj = new Date(datePart);
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric"
            });
        }
         // Fallback for potentially different formats
         return new Date(dateString).toLocaleDateString("en-GB", {
             day: "2-digit", month: "short", year: "numeric"
         });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

// Helper to get status badge class
const getStatusClass = (status: string): string => {
    const lowerStatus = status?.toLowerCase() || 'unknown';
    switch (lowerStatus) {
        case 'approved': return 'bg-green-100 text-green-700';
        case 'completed': return 'bg-purple-100 text-purple-700';
        case 'pending': return 'bg-yellow-100 text-yellow-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        case 'review': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

const Overview: React.FC<OverviewProps> = ({ eventProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Adhoc Proposals Overview</h2>
                <div className="overflow-x-auto">
                    
                    <table className="table table-compact w-full">
                        <thead>
  <tr className="bg-blue-100 text-blue-900 text-xs uppercase tracking-wider">
    <th className="p-3">Title</th>
    <th className="p-3">Start Date</th>
    <th className="p-3">End Date</th>
    <th className="p-3">Description</th>
    <th className="p-3 text-center">Status</th>
    <th className="p-3">Awaiting</th>
    <th className="p-3">Event status</th>
  </tr>
</thead>

                       <tbody>
  {eventProposals.length > 0 ? (
    eventProposals.map((proposal) => (
      <tr
        key={proposal.id}
        onClick={() => handleProposalClick(proposal.originalItem || proposal)}
        className="cursor-pointer hover:bg-gray-100 text-sm border-b border-gray-200 last:border-b-0"
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

        <td
          className="p-2 text-gray-600 max-w-xs truncate"
          title={proposal.description || "-"}
        >
          {proposal.description ? proposal.description : "-"}
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

        <td className="p-2 text-gray-600 font-medium">
          {formatRole(proposal.awaiting)}
        </td>

        <td className="p-2 cursor-pointer">
          <span
            className={`px-2 py-1 rounded-full text-sm font-medium ${
              proposal.event === "rescheduled"
                ? "bg-yellow-100 text-yellow-800"
                : proposal.event === "cancelled"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {proposal.event}
          </span>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td
        colSpan={7}
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