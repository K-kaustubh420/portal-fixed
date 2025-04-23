import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { UnifiedProposal, Message } from './ViceDashboard';

interface PopupProps {
    selectedProposal: UnifiedProposal;
    closePopup: () => void;
    onProposalUpdated: () => void;
    authToken: string | null;
    apiBaseUrl: string;
    userRole: string;
}

const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup, onProposalUpdated, authToken, apiBaseUrl, userRole }) => {
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [comment, setComment] = useState<string>('');

    const handleAction = async (action: 'approve' | 'reject') => {
        if (!authToken || userRole !== 'vice_chair') {
            setActionError('Access denied. Only Associate Chairpersons can perform this action.');
            return;
        }
        setActionLoading(true);
        setActionError(null);
        try {
            const endpoint = `${apiBaseUrl}/api/vice/proposal/${selectedProposal.id}/${action}`;
            await axios.post(
                endpoint,
                { comment },
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' } }
            );
            onProposalUpdated();
        } catch (err: unknown) {
            const axiosError = err as AxiosError;
            setActionError(
                axiosError.response?.status === 401
                    ? 'Authentication failed.'
                    : axiosError.response?.status === 403
                    ? 'Forbidden action.'
                    : (axiosError.response?.data as any)?.message || 'Failed to process action'
            );
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-800 mb-4">{selectedProposal.title}</h2>
                <div className="space-y-4">
                    <div>
                        <strong>Status:</strong>
                        <span className={`ml-2 badge badge-sm badge-${selectedProposal.status === 'Approved' ? 'success' : selectedProposal.status === 'Pending' ? 'warning' : selectedProposal.status === 'Rejected' ? 'error' : 'info'}`}>
                            {selectedProposal.status}
                        </span>
                    </div>
                    <div>
                        <strong>Organizer:</strong> {selectedProposal.organizer}
                    </div>
                    <div>
                        <strong>Convener:</strong> {selectedProposal.convenerName}
                    </div>
                    <div>
                        <strong>Date:</strong> {new Date(selectedProposal.date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                    <div>
                        <strong>Awaiting:</strong> {selectedProposal.awaiting ? selectedProposal.awaiting === 'vice_chair' ? 'Associate Chair' : selectedProposal.awaiting : 'None'}
                    </div>
                    <div>
                        <strong>Description:</strong> {selectedProposal.description || 'No description provided.'}
                    </div>
                    <div>
                        <strong>Cost:</strong> ${selectedProposal.cost.toLocaleString()}
                    </div>
                    {selectedProposal.messages && selectedProposal.messages.length > 0 && (
                        <div>
                            <strong>Communication Log:</strong>
                            <ul className="list-disc pl-5 mt-2">
                                {selectedProposal.messages.map((msg: Message) => (
                                    <li key={msg.id}>
                                        User {msg.user_id} ({new Date(msg.created_at || '').toLocaleDateString()}): {msg.message}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {userRole === 'vice_chair' && selectedProposal.status === 'Pending' && (
                    <div className="mt-4">
                        <textarea
                            className="textarea textarea-bordered w-full"
                            placeholder="Add a comment (optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end space-x-2 mt-2">
                            <button
                                className="btn btn-success"
                                onClick={() => handleAction('approve')}
                                disabled={actionLoading}
                            >
                                Approve
                            </button>
                            <button
                                className="btn btn-error"
                                onClick={() => handleAction('reject')}
                                disabled={actionLoading}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {actionError && (
                    <div className="alert alert-error mt-4">
                        <span>{actionError}</span>
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <button className="btn btn-secondary" onClick={closePopup} disabled={actionLoading}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Popup;
