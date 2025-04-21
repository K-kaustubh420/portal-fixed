// recents.tsx
import React from 'react';
import Image from 'next/image'; // Keep if you might have real images

// Update interface to accept the original item
interface ProposalForRecents {
    id: string;
    title: string;
    organizer: string; // User Name or Placeholder
    status: string;
    convenerEmail: string; // User Email or Placeholder
    submissionTimestamp: string;
    originalItem: any; // Keep original item for click handler
}

interface RecentsProps {
    recentAppliedProposals: ProposalForRecents[];
    // Handler expects the original item type (e.g., ProposalListItem)
    handleProposalClick: (proposal: any) => void;
}

const Recents: React.FC<RecentsProps> = ({ recentAppliedProposals, handleProposalClick }) => {

     // Helper to get initials (can be shared or defined locally)
     const getInitials = (name: string | undefined): string => {
        if (!name) return '?';
        // Use email prefix if name isn't useful (like 'User 123')
        if (name.startsWith('User ')) {
            const emailPrefix = name.split('@')[0]; // Basic split
            return emailPrefix.substring(0, 2).toUpperCase();
        }
        return name.split(' ')
                   .map(n => n[0])
                   .filter((_, i, arr) => i === 0 || i === arr.length - 1)
                   .join('')
                   .toUpperCase();
    };


    return (
        <div className="card shadow-md rounded-lg bg-white  ">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Recent Activity</h2>
                <div className="space-y-4"> {/* Increased spacing */}
                    {recentAppliedProposals.length > 0 ? (
                        recentAppliedProposals.map(proposal => (
                            <div
                                key={proposal.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors duration-150" // Added padding, hover, rounding
                                onClick={() => handleProposalClick(proposal.originalItem)} // Pass the original item
                            >
                                <div className="flex items-center gap-3"> {/* Added gap */}
                                    {/* Avatar using initials */}
                                     <div className="avatar placeholder">
                                         <div className="bg-neutral text-neutral-content rounded-full w-9 h-9"> {/* Adjusted size */}
                                             <span className="text-sm font-semibold">{getInitials(proposal.organizer)}</span>
                                         </div>
                                     </div>
                                    {/* Text */}
                                    <div>
                                        <div className="font-semibold text-gray-700">{proposal.organizer}</div> {/* Darker text */}
                                        <div className="text-sm text-gray-500">{proposal.title}</div>
                                    </div>
                                </div>
                                {/* Status Badge */}
                                <div className={`badge badge-sm font-medium ${proposal.status === 'Approved' ? 'badge-success text-success-content' : proposal.status === 'Pending' ? 'badge-warning text-warning-content' : proposal.status === 'Rejected' ? 'badge-error text-error-content' : proposal.status === 'Review' ? 'badge-info text-info-content' : 'badge-ghost'}`}>
                                    {proposal.status}
                                </div>
                            </div>
                        ))
                    ) : (
                         <p className="text-center italic text-gray-500 py-4">No recent proposals.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recents;