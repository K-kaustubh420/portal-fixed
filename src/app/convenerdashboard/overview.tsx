import React from 'react';
import { LiaFilePdfSolid } from "react-icons/lia";
// Interface for individual proposal data passed to this component
interface OverviewProposal {
    id: string;
    title: string;
    start: string; // Event start date/time string from API
    end: string;   // Event end date/time string from API
    description: string;
    status: string;
    awaiting?: string | null; // Role awaiting approval
    originalItem?: any;     // Original full proposal item for click handlers
    payment?: number;   
    event?: string;     // Bill settlement status: 0 (pending), 1 (completed)
}

// Interface for the props received by the Overview component
interface OverviewProps {
    eventProposals: OverviewProposal[];
    handleProposalClick: (proposalItem: any) => void; // Function to open the main details popup
    onRequestTransportClick: (proposalId: string) => void; // Function to open the transport form popup
}

// Helper function to format role strings (e.g., 'vice_chair' -> 'Vice Chair')
const formatRole = (role: string | null | undefined): string => {
    if (!role) return '-';
    return role
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
};

const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const datePart = dateString.split(' ')[0]; // Get date part only
        const dateObj = new Date(datePart);
        // Check if the date object is valid before formatting
        if (!isNaN(dateObj.getTime())) {
            return dateObj.toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric"
            });
        }
        // Fallback for potentially different formats or invalid dates
        return 'Invalid Date';
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
};

// Helper function to determine the CSS class for status badges
const getStatusClass = (status: string): string => {
    const lowerStatus = status?.toLowerCase() || 'unknown';
    switch (lowerStatus) {
        case 'approved': return 'bg-green-100 text-green-700';
        case 'completed': return 'bg-purple-100 text-purple-700'; // Assuming 'completed' is like approved for transport
        case 'pending': return 'bg-yellow-100 text-yellow-700';
        case 'rejected': return 'bg-red-100 text-red-700';
        case 'review': return 'bg-blue-100 text-blue-700';
        default: return 'bg-gray-100 text-gray-700'; // Default/Unknown status
    }
};

// Helper function to determine the Bill Settlement status
const getBillSettlementStatus = (status: string, payment: number | undefined): string => {
    const lowerStatus = status?.toLowerCase() || 'unknown';

    if (lowerStatus === 'pending') {
        return '-';
    }

    if (lowerStatus === 'approved') {
        if (payment === 0) {
            return 'Pending';
        } else if (payment === 1) {
            return 'Completed';
        }
    }

    return '-'; // Default status if not pending or approved
};

// Helper function to determine the CSS class for Bill Settlement
const getBillSettlementClass = (status: string, payment: number | undefined): string => {
    const lowerStatus = status?.toLowerCase() || 'unknown';

    if (lowerStatus === 'pending') {
        return 'bg-yellow-100 text-yellow-700';
    }

    if (lowerStatus === 'approved') {
        if (payment === 0) {
            return 'bg-yellow-100 text-yellow-700';
        } else if (payment === 1) {
            return 'bg-green-100 text-green-700';
        }
    }

    return 'bg-gray-100 text-gray-700'; // Default/Unknown status
};

const Overview: React.FC<OverviewProps> = ({ eventProposals, handleProposalClick, onRequestTransportClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">All Proposals Overview</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">

                        <thead>
                            <tr className="bg-blue-100 text-blue-900 text-xs uppercase tracking-wider">
                                <th className="p-3">Title</th>
                                <th className="p-3">Start Date</th>
                                <th className="p-3">End Date</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3">Awaiting</th>
                                <th className='p-3'>Event status</th>
                                <th className="p-3 text-center">Bill Settlement</th>{/* New Column */}
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {eventProposals.length > 0 ? (
                                eventProposals.map((proposal) => (
                                    <tr
                                        key={proposal.id}
                                        className="text-sm border-b border-gray-200 last:border-b-0" // Base row style
                                    >
                                        <td onClick={() => handleProposalClick(proposal.originalItem || proposal)} className="p-2 font-medium text-gray-800 cursor-pointer hover:underline">{proposal.title}</td>
                                        <td onClick={() => handleProposalClick(proposal.originalItem || proposal)} className="p-2 text-gray-600 cursor-pointer">{formatDate(proposal.start)}</td>
                                        <td onClick={() => handleProposalClick(proposal.originalItem || proposal)} className="p-2 text-gray-600 cursor-pointer">{formatDate(proposal.end)}</td>
                                        <td onClick={() => handleProposalClick(proposal.originalItem || proposal)} className="p-2 text-center cursor-pointer">
                                            <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${getStatusClass(proposal.status)}`}>
                                                {formatRole(proposal.status)}
                                            </span>
                                        </td>
                                        <td onClick={() => handleProposalClick(proposal.originalItem || proposal)} className="p-2 text-gray-600 font-medium cursor-pointer">{formatRole(proposal.awaiting)}</td>
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

                                        <td className="p-2 text-center">
                                            <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${getBillSettlementClass(proposal.status, proposal.payment)}`}>
                                                {getBillSettlementStatus(proposal.status, proposal.payment)}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            {(proposal.status.toLowerCase() === 'approved' || proposal.status.toLowerCase() === 'completed') && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent triggering row click
                                                        onRequestTransportClick(proposal.id);
                                                    }}
                                                    className=" text-xl text-black bg-white "
                                                    title="Request vehicle for this event"
                                                >
                                                    <LiaFilePdfSolid />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center italic py-4 text-gray-500">
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