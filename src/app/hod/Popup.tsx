// components/dashboard/Popup.tsx (Ensure correct filename casing)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X, Loader2 } from 'lucide-react';
import { User } from '@/lib/users'; // Assuming path is correct

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    category: string;
    cost?: number;
    email?: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string;
    detailedBudget?: { mainCategory: string; subCategory: string; totalAmount?: number }[];
    durationEvent?: string;
    estimatedBudget?: number;
    eventDate?: string;
    eventDescription?: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle?: string;
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    organizingDepartment?: string;
    pastEvents?: string | string[] | null;
    proposalStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Review';
    relevantDetails?: string;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: any[];
    submissionTimestamp: string;
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
    participant_expected?: number | null;
    participant_categories?: string[] | null;
}

interface PopupProps {
    selectedProposal: Proposal | null; // Allow null when loading detail
    closePopup: () => void;
    // Action Handlers passed from Parent (HODDashboard)
    onAccept: (proposalId: string) => Promise<void>;
    onReject: (proposalId: string, reason: string) => Promise<void>;
    onReview: (proposalId: string, comments: string) => Promise<void>;
    // Loading/Error states passed from Parent
    isLoading: boolean; // General action loading state
    errorMessage: string | null; // Error message from actions
    isDetailLoading: boolean; // Loading state specifically for fetching details
}

const Popup: React.FC<PopupProps> = ({
    selectedProposal, closePopup, onAccept, onReject, onReview,
    isLoading, errorMessage, isDetailLoading
}) => {
    // Local state for managing UI elements within the popup (input fields, visibility)
    const [rejectionInput, setRejectionInput] = useState('');
    const [reviewInput, setReviewInput] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Reset local UI state when the selected proposal changes or popup closes
    useEffect(() => {
        if (!selectedProposal) {
            setIsRejecting(false); setIsReviewing(false);
            setRejectionInput(''); setReviewInput('');
        }
        // Clear inputs when proposal changes to avoid showing old reasons/comments
        // for a new proposal before user interacts
        else {
             setIsRejecting(false); setIsReviewing(false); // Reset view state
             setRejectionInput(''); setReviewInput('');   // Clear inputs
        }
    }, [selectedProposal]); // Rerun when the proposal object itself changes

    // --- UI State Handlers ---
    const handleRejectClick = () => {
        // Show rejection input, hide review input
        setIsRejecting(true);
        setIsReviewing(false);
        setReviewInput(''); // Clear other input
    };

    const handleReviewClick = () => {
        // Show review input, hide rejection input
        setIsReviewing(true);
        setIsRejecting(false);
        setRejectionInput(''); // Clear other input
    };

    const cancelRejectReview = () => {
        // Hide both input areas
        setIsRejecting(false);
        setIsReviewing(false);
        setRejectionInput('');
        setReviewInput('');
        // Note: errorMessage is controlled by the parent, not cleared here
    };

    // --- Trigger Functions (Call Parent Handlers) ---
    // These functions bridge the UI click to the actual logic in HODDashboard
    const triggerAccept = () => {
        // Only call parent if a proposal is selected and no actions/loading are in progress
        if (selectedProposal && !isLoading && !isDetailLoading) {
            onAccept(selectedProposal.id); // Calls the onAccept prop passed from HODDashboard
        }
    };

    const triggerReject = () => {
        // Check for proposal, ensure reason is provided, and no actions/loading in progress
        if (selectedProposal && rejectionInput.trim() && !isLoading && !isDetailLoading) {
            onReject(selectedProposal.id, rejectionInput); // Calls the onReject prop passed from HODDashboard
        }
    };

    const triggerReview = () => {
        // Check for proposal, ensure comments are provided, and no actions/loading in progress
        if (selectedProposal && reviewInput.trim() && !isLoading && !isDetailLoading) {
            onReview(selectedProposal.id, reviewInput); // Calls the onReview prop passed from HODDashboard
        }
    };

    // --- Helper Functions ---
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try {
            const d = new Date(dateString);
            return isValid(d) ? format(d, formatString) : 'Invalid Date';
        } catch (e) {
            console.error("Date parsing error:", e, "Input:", dateString);
            return 'Invalid Date';
        }
    };
    const formatCurrency = (amount: number | null | undefined): string => {
        if (amount == null || isNaN(amount)) return 'N/A';
        try {
            return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
        } catch (e) {
            console.error("Currency formatting error:", e, "Input:", amount);
            return "Error";
        }
    };

    // --- Render ---
    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={closePopup}>
            <motion.div className="bg-white rounded-xl border shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-xl sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-gray-800">Proposal Details</h2>
                    <button onClick={closePopup} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50" aria-label="Close pop-up" disabled={isLoading || isDetailLoading}> <X className="h-5 w-5" /> </button>
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-4 overflow-y-auto flex-grow relative">
                    {/* Loading Indicator */}
                    {isDetailLoading && ( <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-20"> <Loader2 className="h-8 w-8 animate-spin text-blue-600" /> <p className='mt-2 text-gray-600'>Loading...</p> </div> )}

                    {/* Details Display */}
                    {!isDetailLoading && selectedProposal && (
                        <>
                            {/* Grid for main details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                {/* All the <p> tags displaying proposal info */}
                                <div> <p className="text-sm text-gray-500 font-medium">ID:</p> <p className="text-sm text-gray-800">{selectedProposal.id || 'N/A'}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Title:</p> <p className="text-sm text-gray-800 font-semibold">{selectedProposal.title || 'N/A'}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Convener:</p> <p className="text-sm text-gray-800">{selectedProposal.convenerName || 'N/A'}</p> <p className="text-xs text-gray-600">{selectedProposal.convenerEmail || 'No email'}</p> {selectedProposal.designation && <p className="text-xs text-gray-600">{selectedProposal.designation}</p>} </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Department:</p> <p className="text-sm text-gray-800">{selectedProposal.organizingDepartment || 'N/A'}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Category:</p> <p className="text-sm text-gray-800">{selectedProposal.category || 'N/A'}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Status:</p> <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ selectedProposal.status === 'Approved' ? 'bg-green-100 text-green-800' : selectedProposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : selectedProposal.status === 'Rejected' ? 'bg-red-100 text-red-800' : selectedProposal.status === 'Review' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800' }`}>{selectedProposal.status || 'N/A'}</span> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Event Start:</p> <p className="text-sm text-gray-800">{formatDateSafe(selectedProposal.eventStartDate, 'dd MMM yyyy')}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Event End:</p> <p className="text-sm text-gray-800">{formatDateSafe(selectedProposal.eventEndDate, 'dd MMM yyyy')}</p> </div>
                                <div> <p className="text-sm text-gray-500 font-medium">Est. Budget:</p> <p className="text-sm text-gray-800 font-semibold">{formatCurrency(selectedProposal.estimatedBudget)}</p> </div>
                                {selectedProposal.location && ( <div><p className="text-sm text-gray-500 font-medium">Location:</p><p className="text-sm text-gray-800">{selectedProposal.location}</p></div> )}
                                {selectedProposal.durationEvent && ( <div><p className="text-sm text-gray-500 font-medium">Duration:</p><p className="text-sm text-gray-800">{selectedProposal.durationEvent}</p></div> )}
                                {selectedProposal.participant_expected != null && ( <div><p className="text-sm text-gray-500 font-medium">Expected Participants:</p><p className="text-sm text-gray-800">{selectedProposal.participant_expected}</p></div> )}
                                {(selectedProposal.participant_categories && selectedProposal.participant_categories.length > 0) && ( <div><p className="text-sm text-gray-500 font-medium">Participant Categories:</p><p className="text-sm text-gray-800">{selectedProposal.participant_categories.join(', ')}</p></div> )}
                                {selectedProposal.chiefGuestName && ( <div><p className="text-sm text-gray-500 font-medium">Chief Guest:</p><p className="text-sm text-gray-800">{selectedProposal.chiefGuestName} {selectedProposal.chiefGuestDesignation ? `(${selectedProposal.chiefGuestDesignation})` : ''}</p></div> )}
                                <div className="sm:col-span-2"> <p className="text-sm text-gray-500 font-medium">Description:</p> <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedProposal.description || 'N/A'}</p> </div>
                            </div>

                            {/* Additional Sections (Budget, Funding, Sponsorship, History, etc.) */}
                            {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) && ( <div className="mt-3 pt-3 border-t"><p className="text-sm text-gray-600 font-semibold mb-1">Detailed Budget:</p><ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-2">{selectedProposal.detailedBudget.map((item, index) => (<li key={index}>{item.mainCategory||'N/A'} - {item.subCategory||'N/A'}{item.totalAmount!=null?`: ${formatCurrency(item.totalAmount)}`:''}</li>))} <li className='font-semibold mt-2 pt-1 border-t'>Total Estimated: {formatCurrency(selectedProposal.estimatedBudget)}</li></ul></div> )}
                            {selectedProposal.fundingDetails && Object.values(selectedProposal.fundingDetails).some(v => v != null) && ( <div className="mt-3 pt-3 border-t"><p className="text-sm text-gray-600 font-semibold mb-1">Funding Sources:</p><ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-2">{Object.entries(selectedProposal.fundingDetails).filter(([_,v])=>v!=null&&v>0).map(([k,v])=>(<li key={k}>{k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).replace(' Fund','')} : {formatCurrency(v)}</li>))}</ul></div> )}
                            {(selectedProposal.sponsorshipDetails && selectedProposal.sponsorshipDetails.length > 0) && ( <div className="mt-3 pt-3 border-t"><p className="text-sm text-gray-600 font-semibold mb-1">Sponsorship Info:</p><ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-2">{selectedProposal.sponsorshipDetails.map((d,i)=><li key={i}>{d}</li>)}</ul></div> )}
                            {(selectedProposal.pastEvents) && ( <div className="mt-3 pt-3 border-t"><p className="text-sm text-gray-600 font-semibold mb-1">Past Related Events:</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{typeof selectedProposal.pastEvents==='string'?selectedProposal.pastEvents:selectedProposal.pastEvents?.join('\n')||'N/A'}</p></div> )}
                            {(selectedProposal.relevantDetails) && ( <div className="mt-3 pt-3 border-t"><p className="text-sm text-gray-600 font-semibold mb-1">Other Relevant Details:</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedProposal.relevantDetails||'N/A'}</p></div> )}
                            {(selectedProposal.rejectionMessage || selectedProposal.reviewMessage || selectedProposal.clarificationMessage) && ( <div className="mt-3 pt-3 border-t space-y-3"><p className="text-sm text-gray-600 font-semibold">Communication:</p> {selectedProposal.rejectionMessage && (<div><p className="text-xs font-semibold text-red-600 mb-0.5">Rejection Reason:</p><p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100 whitespace-pre-wrap">{selectedProposal.rejectionMessage}</p></div>)} {selectedProposal.reviewMessage && (<div><p className="text-xs font-semibold text-blue-600 mb-0.5">Review/Clarification:</p><p className="text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 whitespace-pre-wrap">{selectedProposal.reviewMessage}</p></div>)} </div> )}
                            {selectedProposal.submissionTimestamp && ( <div className="mt-3 pt-3 border-t text-xs text-gray-400 text-right">Submitted: {formatDateSafe(selectedProposal.submissionTimestamp,'dd MMM yyyy, hh:mm a')}</div> )}
                        </>
                    )}
                    {/* Message if no proposal loaded */}
                    {!isDetailLoading && !selectedProposal && ( <div className="text-center text-gray-500 py-10">No proposal details.</div> )}
                </div>

                {/* Footer / Actions Area */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl sticky bottom-0 z-10">
                    {/* Error display */}
                    {errorMessage && ( <div className="text-red-600 text-xs mb-3 p-2 bg-red-50 border border-red-200 rounded text-center">{errorMessage}</div> )}

                    {/* Initial Action Buttons (Only show if status is Pending and not already rejecting/reviewing) */}
                    {!isDetailLoading && selectedProposal && selectedProposal.status === 'Pending' && !isRejecting && !isReviewing && (
                        <div className="flex flex-wrap gap-2 justify-end">
                            {/* Approve Button: Calls triggerAccept -> onAccept(id) */}
                            <button onClick={triggerAccept} className="btn btn-sm btn-success text-white" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Approve'}
                            </button>
                            {/* Review Button: Shows the review input section */}
                            <button onClick={handleReviewClick} className="btn btn-sm btn-info text-white" disabled={isLoading}>
                                Request Review
                            </button>
                            {/* Reject Button: Shows the rejection input section */}
                            <button onClick={handleRejectClick} className="btn btn-sm btn-error text-white" disabled={isLoading}>
                                Reject
                            </button>
                        </div>
                    )}

                    {/* Rejection Input Section (Shown when isRejecting is true) */}
                    {isRejecting && (
                        <div className="mt-2 space-y-2">
                            <label htmlFor="rejectionMessage" className="block text-sm font-medium text-gray-700">Reason for Rejection:</label>
                            <textarea id="rejectionMessage" rows={3} className="textarea textarea-bordered w-full text-sm disabled:bg-gray-100" placeholder="Enter rejection reason..." value={rejectionInput} onChange={(e) => setRejectionInput(e.target.value)} disabled={isLoading} required />
                            <div className="flex gap-2 justify-end">
                                <button onClick={cancelRejectReview} className="btn btn-sm btn-ghost" disabled={isLoading}> Cancel </button>
                                {/* Confirm Reject Button: Calls triggerReject -> onReject(id, reason) */}
                                <button onClick={triggerReject} className="btn btn-sm btn-error text-white" disabled={isLoading || !rejectionInput.trim()}>
                                    {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null} Confirm Reject
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Input Section (Shown when isReviewing is true) */}
                    {isReviewing && (
                         <div className="mt-2 space-y-2">
                            <label htmlFor="reviewMessage" className="block text-sm font-medium text-gray-700">Comments for Review / Clarification:</label>
                            <textarea id="reviewMessage" rows={3} className="textarea textarea-bordered w-full text-sm disabled:bg-gray-100" placeholder="Enter comments..." value={reviewInput} onChange={(e) => setReviewInput(e.target.value)} disabled={isLoading} required />
                            <div className="flex gap-2 justify-end">
                                <button onClick={cancelRejectReview} className="btn btn-sm btn-ghost" disabled={isLoading}> Cancel </button>
                                {/* Submit Review Button: Calls triggerReview -> onReview(id, comments) */}
                                <button onClick={triggerReview} className="btn btn-sm btn-info text-white" disabled={isLoading || !reviewInput.trim()}>
                                     {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null} Submit for Review
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