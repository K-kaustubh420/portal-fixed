// components/dashboard/overview.tsx
import React from 'react';
import { format, isValid } from 'date-fns'; // Import date-fns for formatting

// Interface for the data expected by this specific component
interface ProposalForOverview {
    id: string; // Expecting string ID after mapping in parent
    title: string;
    organizer: string; // Mapped name
    date: string;      // Expecting date string (e.g., from 'start')
    status: string;
    convenerName: string; // Mapped name
    category: string;
    originalItem: any; // Keep original item to pass back to handler (could be HODProposalListItem, etc.)
}

interface ProposalOverviewTableProps {
    eventProposals: ProposalForOverview[];
    // Handler expects the original item, which contains at least an id
    handleProposalClick: (proposalItem: { id: number | string, [key: string]: any }) => void;
}

const ProposalOverviewTable: React.FC<ProposalOverviewTableProps> = ({ eventProposals, handleProposalClick }) => {

    // Helper to get initials
    const getInitials = (name: string | undefined): string => {
        if (!name || typeof name !== 'string') return '?';
        // Basic check if name is just placeholder like "User 123"
        if (/^User \d+$/.test(name)) {
            return name.substring(0, 3).toUpperCase(); // e.g., US1
        }
        return name.split(' ')
                   .map(n => n ? n[0] : '') // Handle potential empty strings from split
                   .filter(Boolean) // Remove empty strings
                   .filter((_, i, arr) => i === 0 || i === arr.length - 1) // First and Last initial
                   .join('')
                   .toUpperCase() || '?'; // Fallback if result is empty
    };

    // Helper function for safe date formatting
    const formatDateSafe = (dateString: string | null | undefined): string => {
        if (!dateString) return 'N/A';
        try {
            const dateObj = new Date(dateString);
            // Check if the date is valid before formatting
            if (isValid(dateObj)) {
                return format(dateObj, 'dd MMM yyyy'); // Format like "21 Apr 2024"
            }
        } catch (e) {
             console.error("Date formatting error in Overview:", e, "Input:", dateString);
        }
        return 'Invalid Date';
    };

    // Function to format category string (replace underscores, capitalize)
    const formatCategory = (category: string | undefined): string => {
        if (!category) return 'N/A';
        try {
             return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        } catch (e) {
             console.error("Category formatting error:", e, "Input:", category);
             return category; // Return original on error
        }
    }

    return (
        <div className="card shadow-md rounded-lg bg-inherit "> {/* Use base-100 for theme compatibility */}
            <div className="card-body p-4 sm:p-6"> {/* Adjust padding */}
                <h2 className="card-title text-shadow-base-200 sm:text-lg font-bold mb-4">Proposals Overview</h2>
                <div className="overflow-x-auto">
                    {/* Use DaisyUI table classes */}
                    <table className="table table-sm sm:table-md w-full">
                      
                        <thead className="text-xs text-base-200 uppercase bg-slate-100 "> 
                            <tr>
                                <th>Convener / Event</th>
                                <th>Category</th>
                                <th>Event Date</th>
                                <th>Status</th>
                                <th>Action</th> 
                            </tr>
                        </thead>
                        <tbody>
                            {eventProposals && eventProposals.length > 0 ? (
                                eventProposals.map((proposal) => (
                                    <tr key={proposal.id} className="hover"> 
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar placeholder">
                                                     {/* Use theme colors */}
                                                    <div className="bg-neutral text-neutral-content rounded-full w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-lg text-center items-center justify-center">
                                                        <span>{'U'}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                   
                                                    <div className="font-bold text-gray-300 text-sm sm:text-base">{proposal.convenerName || 'N/A'}</div>
                                                    <div className="text-xs sm:text-sm text-slate-500">{proposal.title || 'N/A'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        {/* Category Column */}
                                        <td className="text-xs sm:text-sm whitespace-nowrap">{formatCategory(proposal.category)}</td>
                                        {/* Date Column */}
                                        <td className="text-xs sm:text-sm whitespace-nowrap">{formatDateSafe(proposal.date)}</td>
                                        {/* Status Column */}
                                         <td>
                                            {/* Use DaisyUI badges with appropriate colors */}
                                            <div className={`badge badge-sm ${
                                                proposal.status === 'Approved' ? 'badge-success' :
                                                proposal.status === 'Pending' ? 'badge-warning' :
                                                proposal.status === 'Rejected' ? 'badge-error' :
                                                proposal.status === 'Review' ? 'badge-info' :
                                                'badge-ghost' // Default fallback
                                            }`}>
                                                 {proposal.status || 'N/A'}
                                            </div>
                                         </td>
                                        {/* Details Button Column */}
                                        <td>
                                            <button
                                                onClick={() => handleProposalClick(proposal.originalItem)} // Pass the original item
                                                className="btn btn-ghost btn-xs text-info hover:bg-info/10" // Themed button
                                                aria-label={`View details for proposal ${proposal.title}`}
                                            >
                                                details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center text-base-content/70 italic py-4">No proposals found.</td>
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