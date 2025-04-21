// overview.tsx
import React from 'react';

// Update interface to include category and the original item for the click handler
interface ProposalForOverview {
    id: string;
    title: string;
    organizer: string; // Could be User Name or Placeholder
    date: string; // Expecting date string (e.g., from 'start')
    status: string;
    convenerName: string; // Could be User Name or Placeholder
    category: string;
    originalItem: any; // Keep original item to pass back to handler
}

interface ProposalOverviewTableProps {
    eventProposals: ProposalForOverview[];
    // Update handler to expect the original item type (e.g., ProposalListItem)
    handleProposalClick: (proposal: any) => void;
}

const ProposalOverviewTable: React.FC<ProposalOverviewTableProps> = ({ eventProposals, handleProposalClick }) => {

    // Helper to get initials
    const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        return name.split(' ')
                   .map(n => n[0])
                   .filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and Last initial
                   .join('')
                   .toUpperCase();
    };

    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Proposals Overview</h2>
                {/* Use the new table structure */}
                <div className="overflow-x-auto">
                    <table className="table w-full"> {/* Removed table-compact */}
                        {/* head */}
                        <thead>
                            <tr className="text-sm text-gray-500 uppercase"> {/* Adjusted styling */}
                                <th>Convener / Event</th>
                                <th>Category</th>
                                <th>Event Date</th>
                                <th>Status</th>
                                <th></th> {/* Empty header for details button */}
                            </tr>
                        </thead>
                        <tbody>
                            {eventProposals.length > 0 ? (
                                eventProposals.map((proposal) => (
                                    <tr key={proposal.id} className="hover"> {/* Added hover effect */}
                                        {/* Convener/Event Column */}
                                        <td>
                                            <div className="flex items-center gap-3">
                                                {/* Avatar Fallback */}
                                                <div className="avatar placeholder"> {/* Added placeholder class */}
                                                    <div className="bg-neutral text-neutral-content rounded-full w-12 h-12"> {/* Adjusted size */}
                                                        <span className="text-xl font-semibold">{getInitials(proposal.convenerName)}</span>
                                                    </div>
                                                </div>
                                                {/* Text */}
                                                <div>
                                                    <div className="font-bold text-gray-800">{proposal.convenerName}</div>
                                                    <div className="text-sm text-gray-600 opacity-80">{proposal.title}</div> {/* Adjusted opacity */}
                                                </div>
                                            </div>
                                        </td>
                                        {/* Category Column */}
                                        <td>
                                            {proposal.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                             {/* Optional: Add badge for category */}
                                             {/* <br />
                                             <span className="badge badge-ghost badge-sm">Category</span> */}
                                        </td>
                                        {/* Date Column */}
                                        <td>
                                             {/* Make sure proposal.date is a valid string */}
                                            {proposal.date ? new Date(proposal.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : 'N/A'}
                                        </td>
                                        {/* Status Column */}
                                         <td>
                                            <div className={`badge badge-sm ${proposal.status === 'Approved' ? 'badge-success' : proposal.status === 'Pending' ? 'badge-warning' : proposal.status === 'Rejected' ? 'badge-error' : proposal.status === 'Review' ? 'badge-info' : 'badge-ghost'}`}>
                                                 {proposal.status}
                                            </div>
                                         </td>
                                        {/* Details Button Column */}
                                        <td> {/* Changed from th to td */}
                                            <button
                                                onClick={() => handleProposalClick(proposal.originalItem)} // Pass the original item back
                                                className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-100" // Styled button
                                            >
                                                details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center italic py-4">No proposals found.</td>
                                </tr>
                            )}
                        </tbody>
                        {/* Optional: Footer */}
                         {/* <tfoot>
                             <tr>
                                <th>Convener / Event</th>
                                <th>Category</th>
                                <th>Event Date</th>
                                <th>Status</th>
                                <th></th>
                             </tr>
                         </tfoot> */}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProposalOverviewTable;