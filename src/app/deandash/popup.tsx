// popup.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { User } from '@/lib/users'; // Ensure path is correct

// --- Define necessary types locally based on the UnifiedProposal structure ---
// These match the structure provided by DeanDashboard's mapping functions
interface Item {
    id: number; proposal_id: number; category: string; sub_category: string; type: string | null; quantity: number; cost: number; amount: number; created_at: string | null; updated_at: string | null; status: string;
}
interface Sponsor {
    id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string | null; updated_at: string | null;
}
interface Message {
    id: number; proposal_id: number; user_id: number; message: string; created_at: string | null; updated_at: string | null;
}

// --- Interface matching the props received from DeanDashboard ---
// This should align exactly with the UnifiedProposal interface in DeanDashboard
interface Proposal {
    id: string; title: string; status: string; date: string; organizer: string; convenerName: string; convenerEmail: string; submissionTimestamp: string; description: string; category: string; eventStartDate: string; eventEndDate: string; eventDate: string; eventDescription: string; eventTitle: string; cost: number; detailedBudget: Item[]; estimatedBudget: number; email: string; location?: string; chiefGuestName?: string; chiefGuestDesignation?: string; designation?: string; durationEvent?: string; fundingDetails?: { registrationFund?: number | null; sponsorshipFund?: number | null; universityFund?: number | null; otherSourcesFund?: number | null; }; organizingDepartment?: string; pastEvents?: string | string[] | null; proposalStatus?: string; relevantDetails?: string | null; sponsorshipDetails?: Sponsor[]; sponsorshipDetailsRows?: any[]; rejectionMessage?: string; reviewMessage?: string; clarificationMessage?: string; tags?: string[]; messages?: Message[]; chief?: User | null; user?: User | null;
}

interface PopupProps {
    selectedProposal: Proposal;
    closePopup: () => void;
    onProposalUpdated: () => void;
    authToken: string | null;
    apiBaseUrl: string;
    userRole: string;
}

const Popup: React.FC<PopupProps> = ({
    selectedProposal,
    closePopup,
    onProposalUpdated,
    authToken,
    apiBaseUrl,
    userRole // Typically 'dean' when rendered from DeanDashboard
}) => {
    const [clarificationInput, setClarificationInput] = useState('');
    const [isClarifying, setIsClarifying] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRejectClick = () => {
        setIsRejecting(true); setIsClarifying(false); setClarificationInput('');
    };
    const handleClarificationClick = () => {
        setIsClarifying(true); setIsRejecting(false); setClarificationInput('');
    };
    const cancelActions = () => {
        setIsRejecting(false); setIsClarifying(false); setClarificationInput(''); setErrorMessage(null);
    };

    // --- ACTION: Request Clarification ---
    const handleRequestClarification = async () => {
        if (!authToken) { setErrorMessage("Authentication token missing."); return; }
        if (!clarificationInput.trim()) { setErrorMessage("Please enter comments for clarification."); return; }
        // Dean uses PUT with message payload for clarification
        const clarifyEndpoint = `${apiBaseUrl}/api/dean/proposals/${selectedProposal.id}`;
        try {
            setIsLoading(true); setErrorMessage(null);
            console.log(`Requesting clarification for proposal ${selectedProposal.id} at ${clarifyEndpoint}`);
            await axios.put(
                clarifyEndpoint,
                { message: clarificationInput }, // Payload defined by API docs
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
            );
            console.log("Clarification requested successfully.");
            onProposalUpdated(); closePopup();
        } catch (error: any) {
             console.error("Clarification request error:", error);
             const axiosError = error as AxiosError;
             setErrorMessage((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to request clarification');
        } finally { setIsLoading(false); }
    };

    // --- ACTION: Reject Proposal ---
    const handleReject = async () => {
        if (!authToken) { setErrorMessage("Authentication token missing."); return; }
        // Dean uses DELETE for rejection
        const rejectEndpoint = `${apiBaseUrl}/api/dean/proposals/${selectedProposal.id}`;
        if (!window.confirm('Are you sure you want to reject this proposal? This action might be irreversible.')) return;
        try {
            setIsLoading(true); setErrorMessage(null);
            console.log(`Rejecting proposal ${selectedProposal.id} at ${rejectEndpoint}`);
            await axios.delete(
                rejectEndpoint,
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' } }
            );
             console.log("Proposal rejected successfully.");
            onProposalUpdated(); closePopup();
        } catch (error: any) {
             console.error("Reject error:", error);
             const axiosError = error as AxiosError;
             setErrorMessage((axiosError.response?.data as any)?.message || axiosError.message || 'Failed to reject proposal');
        } finally { setIsLoading(false); }
    };

    // --- Helper: Format Date Safely ---
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
         if (!dateString) return 'N/A';
         try { const dateObj = new Date(dateString); if (isValid(dateObj)) return format(dateObj, formatString);
         } catch (e) { /* ignore */ } return 'Invalid Date';
    };

    // --- Render Component ---
    return (
        <motion.div
            className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-gray-800 bg-opacity-75"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-800 shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-blue-900">Proposal Details</h2>
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600" aria-label="Close pop-up"><X size={24} /></button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-grow">
                    {/* Display main details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div><p className="text-sm font-medium text-gray-500">ID:</p><p className="text-sm text-gray-900">{selectedProposal.id || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Title:</p><p className="text-sm text-gray-900">{selectedProposal.title || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Organizer / Department:</p><p className="text-sm text-gray-900">{selectedProposal.organizer || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Category:</p><p className="text-sm text-gray-900">{selectedProposal.category || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Convener:</p><p className="text-sm text-gray-900">{selectedProposal.convenerName || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Convener Email:</p><p className="text-sm text-gray-900">{selectedProposal.convenerEmail || 'N/A'}</p></div>
                         {selectedProposal.designation && (<div><p className="text-sm font-medium text-gray-500">Convener Designation:</p><p className="text-sm text-gray-900">{selectedProposal.designation}</p></div>)}
                        <div><p className="text-sm font-medium text-gray-500">Status:</p><p className={`text-sm font-medium ${selectedProposal.status === 'Approved' ? 'text-green-600' : selectedProposal.status === 'Pending' || selectedProposal.status === 'Forwarded_Dean' ? 'text-yellow-600' : selectedProposal.status === 'Rejected' ? 'text-red-600' : selectedProposal.status === 'Review' ? 'text-blue-600' : 'text-gray-900'}`}>{selectedProposal.status || 'N/A'}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Event Start Date:</p><p className="text-sm text-gray-900">{formatDateSafe(selectedProposal.eventStartDate, 'PPP p')}</p></div>
                        <div><p className="text-sm font-medium text-gray-500">Event End Date:</p><p className="text-sm text-gray-900">{formatDateSafe(selectedProposal.eventEndDate, 'PPP p')}</p></div>
                         {selectedProposal.durationEvent && (<div><p className="text-sm font-medium text-gray-500">Duration:</p><p className="text-sm text-gray-900">{selectedProposal.durationEvent}</p></div>)}
                         {selectedProposal.location && (<div><p className="text-sm font-medium text-gray-500">Location:</p><p className="text-sm text-gray-900">{selectedProposal.location}</p></div>)}
                         <div><p className="text-sm font-medium text-gray-500">Estimated Budget:</p><p className="text-sm text-gray-900">{selectedProposal.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? 'N/A'}</p></div>
                         {selectedProposal.chiefGuestName && (<div><p className="text-sm font-medium text-gray-500">Chief Guest:</p><p className="text-sm text-gray-900">{selectedProposal.chiefGuestName} ({selectedProposal.chiefGuestDesignation || 'N/A'})</p></div>)}
                        <div className="sm:col-span-2"><p className="text-sm font-medium text-gray-500">Description:</p><p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedProposal.description || 'N/A'}</p></div>
                    </div>

                    {/* Display Budget Items */}
                     {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) && (
                         <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-sm font-semibold text-blue-800">Budget Items:</p>
                             <ul className="list-disc list-inside text-gray-600 pl-2 text-xs space-y-1 mt-1">
                                 {selectedProposal.detailedBudget.map((item) => (
                                     <li key={item.id}>
                                         {item.category} - {item.sub_category}: {item.quantity} x {item.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} = {item.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     )}
                     {/* Display Sponsors */}
                     {(selectedProposal.sponsorshipDetails && selectedProposal.sponsorshipDetails.length > 0) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-sm font-semibold text-blue-800">Sponsors:</p>
                             <ul className="list-disc list-inside text-gray-600 pl-2 text-xs space-y-1 mt-1">
                                 {selectedProposal.sponsorshipDetails.map((sponsor) => (
                                     <li key={sponsor.id}>
                                         {sponsor.category} ({sponsor.mode}): {sponsor.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} | Reward: {sponsor.reward || 'N/A'} | About: {sponsor.about || 'N/A'}
                                     </li>
                                 ))}
                             </ul>
                        </div>
                     )}
                     {/* Display Messages */}
                     {(selectedProposal.messages && selectedProposal.messages.length > 0) && (
                         <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <p className="text-sm font-semibold text-gray-800">Communication Log:</p>
                              <ul className="space-y-2 text-xs text-gray-600 mt-2">
                                  {selectedProposal.messages.slice().reverse().map((msg) => ( // Show newest first
                                      <li key={msg.id} className="border-b border-gray-100 pb-1">
                                          <span className="font-medium text-gray-700">User {msg.user_id}</span> ({formatDateSafe(msg.created_at)}):<br/> <span className='pl-2'>{msg.message}</span>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                    {/* Display Submission Timestamp */}
                    <div className="mt-4 text-xs text-gray-500 text-right">
                        Submitted On: {formatDateSafe(selectedProposal.submissionTimestamp)}
                    </div>
                </div>

                {/* Footer / Actions Area */}
                <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    {errorMessage && (<div className="alert alert-error text-xs p-2 mb-3"><div><span>{errorMessage}</span></div></div>)}

                    {/* Dean's Action Buttons (Only show if status allows action) */}
                    {(selectedProposal.status === 'Pending' || selectedProposal.status === 'Forwarded_Dean') && !isRejecting && !isClarifying && (
                        <div className="flex flex-wrap gap-3 justify-end">
                            <button onClick={handleClarificationClick} className="btn btn-sm btn-warning" disabled={isLoading}>Request Clarification</button>
                            <button onClick={handleRejectClick} className="btn btn-sm btn-error" disabled={isLoading}>Reject</button>
                        </div>
                    )}
                    {/* Rejection Confirmation */}
                    {isRejecting && (
                         <div className="mt-4 space-y-3 text-center">
                            <p className="text-lg font-semibold text-red-700">Confirm Rejection</p>
                            <p className="text-sm text-gray-600">Are you sure you want to reject this proposal?</p>
                            <div className="flex gap-3 justify-center pt-2">
                                <button onClick={cancelActions} className="btn btn-sm btn-ghost" disabled={isLoading}>Cancel</button>
                                <button onClick={handleReject} className="btn btn-sm btn-error" disabled={isLoading}>
                                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Confirm Reject'}
                                </button>
                            </div>
                         </div>
                    )}
                    {/* Clarification Input */}
                    {isClarifying && (
                         <div className="mt-4 space-y-3">
                            <label htmlFor="clarificationMessage" className="block text-sm font-semibold text-gray-700">Comments for Clarification Request:</label>
                            <textarea id="clarificationMessage" rows={3} className="textarea textarea-bordered w-full text-sm" placeholder="Enter clarification questions here..." value={clarificationInput} onChange={(e) => setClarificationInput(e.target.value)} disabled={isLoading} required />
                            <div className="flex gap-3 justify-end">
                                <button onClick={cancelActions} className="btn btn-sm btn-ghost" disabled={isLoading}>Cancel</button>
                                <button onClick={handleRequestClarification} className="btn btn-sm btn-warning" disabled={isLoading || !clarificationInput.trim()}>
                                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Submit Request'}
                                </button>
                            </div>
                         </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Popup;