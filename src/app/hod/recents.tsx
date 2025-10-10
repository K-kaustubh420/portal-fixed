// Recents.tsx
import React from 'react';


interface RecentProposal {
    id: string;
    title: string;
    // Use status values consistent with API response (lowercase) or map them in parent
    status: 'pending' | 'approved' | 'rejected' | 'review' | 'completed' | string; // Allow lowercase, add 'completed' if API uses it
    date: string; // This will be the submission/creation date passed from parent
    
    originalItem?: any; // Optional: Pass original item if needed by click handler
}

interface RecentsProps {
    recentAppliedProposals: RecentProposal[]; // Use the updated interface
    // The click handler likely needs the original full item or at least the ID
    handleProposalClick: (proposalItem: any) => void; // Use 'any' or a more specific list item type
}

const Recents: React.FC<RecentsProps> = ({ recentAppliedProposals, handleProposalClick }) => {
    // Function to format status for display (optional, makes status title case)
    const formatStatus = (status: string): string => {
        if (!status) return 'N/A';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Awaiting HOD Approval (adhoc) </h2> {/* Title reflects filtering */}
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        <thead>
                            <tr className='bg-blue-200 text-gray-700 text-xs uppercase tracking-wider'>
                                <th className="p-3">Title</th>
                                <th className="p-3">Submitted Date</th> 
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAppliedProposals.length > 0 ? (
                                recentAppliedProposals.map((proposal) => (
                                    <tr
                                        // Pass the original item or ID needed by the handler
                                        onClick={() => handleProposalClick(proposal.originalItem || proposal)}
                                        key={proposal.id}
                                        className="cursor-pointer hover:bg-gray-100 text-sm"
                                    >
                                        <td className="p-2 font-medium text-gray-800">{proposal.title}</td>
                                        {/* Display the 'date' prop (mapped to created_at in parent) */}
                                        <td className="p-2 text-gray-600">
                                            {new Date(proposal.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </td>
                                        <td className="p-2">
                                            {/* Use lowercase status from API for logic */}
                                            <div className={`badge badge-sm font-medium py-2 px-1.5 rounded-full text-xs
                                                ${proposal.status === 'approved' || proposal.status === 'completed' ? 'badge-success bg-green-100 text-green-700' :
                                                proposal.status === 'pending' ? 'badge-warning bg-yellow-100 text-yellow-700' :
                                                proposal.status === 'rejected' ? 'badge-error bg-red-100 text-red-700' :
                                                proposal.status === 'review' ? 'badge-info bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'}`}>
                                                {formatStatus(proposal.status)} {/* Display formatted status */}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    {/* Adjusted colSpan */}
                                    <td colSpan={3} className="text-center italic py-4 text-gray-500">No proposals currently awaiting HOD approval.</td>
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