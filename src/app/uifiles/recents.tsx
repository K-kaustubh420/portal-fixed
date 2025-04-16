import React from 'react';
import Image from 'next/image';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    status: string;
    convenerEmail: string;
}

interface RecentsProps {
    recentAppliedProposals: Proposal[];
    handleProposalClick: (proposal: Proposal) => void;
}

const Recents: React.FC<RecentsProps> = ({ recentAppliedProposals, handleProposalClick }) => {
    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-lg font-bold text-gray-700">Recently Applied Proposals</h2>
                </div>
                <div className="space-y-3">
                    {recentAppliedProposals.map(proposal => (
                        <div
                            key={proposal.id}
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => handleProposalClick(proposal)}
                        >
                            <div className="flex items-center">
                                <div className="avatar mr-3">
                                    <div className="mask mask-squircle w-8 h-8">
                                        {parseInt(proposal.id) % 3 === 0 ? (
                                            <Image
                                                src={`/avatar.png`}
                                                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                                                alt={proposal.title || "Avatar"}
                                                className="w-full h-full object-cover"
                                                height={10}
                                                width={10}
                                                placeholder="blur"
                                                blurDataURL="/placeholder.png"
                                            />
                                        ) : (
                                            <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center rounded-full">
                                                <span className="text-xs font-bold">{proposal.convenerEmail?.substring(0, 2).toUpperCase() || "NA"}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-600">{proposal.organizer}</div>
                                    <div className="text-sm text-gray-500">{proposal.title}</div>
                                </div>
                            </div>
                            <div className={`badge badge-sm badge-${proposal.status === 'Approved' ? 'success' : proposal.status === 'Pending' ? 'warning' : 'error'}`}>
                                {proposal.status}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Recents;
