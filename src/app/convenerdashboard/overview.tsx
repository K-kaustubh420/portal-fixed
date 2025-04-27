// Overview.tsx (or rename ProposalOverviewTable.tsx)
import React from 'react';

// Interface for the props expected by THIS component
interface OverviewProposal {
    id: string;
    title: string;
    start: string; // Event start date/time string from API
    end: string;   // Event end date/time string from API
    description: string;
    awaiting?: string | null; // Role awaiting approval
    // We might still need the original item if handleProposalClick needs the full API object
    originalItem?: any;
}

interface OverviewProps {
    eventProposals: OverviewProposal[]; // Use the updated interface
    // The click handler likely needs the original full item or at least the ID
    handleProposalClick: (proposalItem: any) => void; // Use 'any' or a more specific list item type
}

// Format awaiting role (e.g., 'vice_chair' → 'Vice Chair')
const formatAwaiting = (awaiting: string | null | undefined): string => {
    if (!awaiting) return '-'; // Use dash for null/undefined
    return awaiting
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

// Format date string (YYYY-MM-DD HH:MM:SS) to DD MMM YYYY
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short", // Use short month name
            year: "numeric"
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};


const Overview: React.FC<OverviewProps> = ({ eventProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">All Proposals Overview</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr className="bg-blue-200 text-gray-700 text-xs uppercase tracking-wider">
                                <th className="p-3">Title</th>
                                <th className="p-3">Start Date</th>
                                <th className="p-3">End Date</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Awaiting</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventProposals.length > 0 ? (
                                eventProposals.map((proposal) => (
                                    <tr
                                        // Pass the original item or ID needed by the handler
                                        onClick={() => handleProposalClick(proposal.originalItem || proposal)}
                                        key={proposal.id}
                                        className="cursor-pointer hover:bg-gray-100 text-sm"
                                    >
                                        <td className="p-2 font-medium text-gray-800">{proposal.title}</td>
                                        <td className="p-2 text-gray-600">{formatDate(proposal.start)}</td>
                                        <td className="p-2 text-gray-600">{formatDate(proposal.end)}</td>
                                        {/* Truncate long descriptions */}
                                        <td className="p-2 text-gray-600 max-w-xs truncate" title={proposal.description}>
                                            {proposal.description}
                                        </td>
                                        <td className="p-2 text-gray-600 font-medium">{formatAwaiting(proposal.awaiting)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    {/* Adjusted colSpan */}
                                    <td colSpan={5} className="text-center italic py-4 text-gray-500">No proposals submitted yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Overview; // Or export default ProposalOverviewTable;