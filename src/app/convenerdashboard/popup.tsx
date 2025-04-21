// popup.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns'; // Import isValid
import { X } from 'lucide-react';
import axios from 'axios';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string; // This corresponds to 'start' from the API detail
    status: string;
    category: string;
    cost?: number; // Make optional if sometimes missing
    email?: string; // Make optional if sometimes missing
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string; // Make optional if sometimes missing
    detailedBudget?: { mainCategory: string; subCategory: string; totalAmount?: number }[]; // Make optional
    durationEvent?: string; // Make optional if sometimes missing
    estimatedBudget?: number; // Make optional if sometimes missing
    eventDate?: string; // Potentially redundant with 'date' (start)
    eventDescription?: string; // Potentially redundant with 'description'
    eventEndDate: string; // Corresponds to 'end' from the API detail
    eventStartDate: string; // Corresponds to 'start' from the API detail
    eventTitle?: string; // Potentially redundant with 'title'
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    organizingDepartment?: string; // Make optional
    pastEvents?: string | string[]; // Allow string or array based on your actual data
    proposalStatus?: string; // Potentially redundant with 'status'
    relevantDetails?: string;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: { [key: string]: string | number | boolean }[];
    submissionTimestamp: string; // Corresponds to 'created_at' from API
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
}


interface PopupProps {
    selectedProposal: Proposal;
    closePopup: () => void;
    onProposalUpdated: () => void
}

const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup, onProposalUpdated }) => {
    const [rejectionInput, setRejectionInput] = useState('');
    const [reviewInput, setReviewInput] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Ensure your API Base URL is correctly configured, maybe use environment variables
    const API_BASE_URL = 'http://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net';

    // Determine the correct endpoint prefix based on user role if needed here,
    // though the parent component seems to handle fetching.
    // For actions (PUT requests), ensure the role is considered if the API requires it.
    // Example (you might need to pass the user role down or fetch it):
    // const apiEndpoint = `${API_BASE_URL}/api/${userRole}/proposals/${selectedProposal.id}`;

    const handleRejectClick = () => {
        setIsRejecting(true);
        setIsReviewing(false);
    };

    const handleReviewClick = () => {
        setIsReviewing(true);
        setIsRejecting(false);
    };

    const cancelRejectReview = () => {
        setIsRejecting(false);
        setIsReviewing(false);
        setRejectionInput('');
        setReviewInput('');
        setErrorMessage(null);
    };

    const handleAccept = async () => {
        // You might need the user's role to determine the correct API endpoint
        // For simplicity, assuming the parent passes a correct base API URL or it's fixed
        const acceptEndpoint = `${API_BASE_URL}/api/faculty/proposals/${selectedProposal.id}`; // Adjust '/faculty/' if needed based on role

        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.put(acceptEndpoint, { status: 'Approved' }); // Consider sending the correct token if needed
            onProposalUpdated(); // Notify parent component
            closePopup();
        } catch (error: any) {
             console.error("Accept error:", error);
            setErrorMessage(error.response?.data?.message || error.message || 'Failed to accept proposal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        const rejectEndpoint = `${API_BASE_URL}/api/faculty/proposals/${selectedProposal.id}`; // Adjust '/faculty/' if needed based on role

        try {
            // Optional: More user-friendly confirmation
            // if (!window.confirm('Are you sure you want to reject this proposal?')) {
            //     return;
            // }
            setIsLoading(true);
            setErrorMessage(null);
            await axios.put(rejectEndpoint, {
                status: 'Rejected',
                rejectionMessage: rejectionInput, // Ensure API accepts this field name
                // Alternatively, the API might expect messages via a separate endpoint or field
                // cheif_reason: rejectionInput, // If API uses this field name
            });
            onProposalUpdated(); // Notify parent component
            closePopup();
        } catch (error: any) {
             console.error("Reject error:", error);
            setErrorMessage(error.response?.data?.message || error.message || 'Failed to reject proposal');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReview = async () => {
        const reviewEndpoint = `${API_BASE_URL}/api/faculty/proposals/${selectedProposal.id}`; // Adjust '/faculty/' if needed based on role

        try {
            // Optional: More user-friendly confirmation
            // if (!window.confirm('Are you sure you want to submit a review for this proposal?')) {
            //     return;
            // }
            setIsLoading(true);
            setErrorMessage(null);
            await axios.put(reviewEndpoint, {
                status: 'Review',
                reviewMessage: reviewInput, // Ensure API accepts this field name
                 // Alternatively:
                 // cheif_reason: reviewInput, // If API uses this field name for review/rejection comments
            });
            onProposalUpdated(); // Notify parent component
            closePopup();
        } catch (error: any) {
             console.error("Review error:", error);
            setErrorMessage(error.response?.data?.message || error.message || 'Failed to submit review');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function for safe date formatting
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try {
            const dateObj = new Date(dateString);
            if (isValid(dateObj)) {
                return format(dateObj, formatString);
            }
        } catch (e) {
            // Log error if needed: console.error("Date parsing error:", e);
        }
        return 'Invalid Date'; // Indicate if parsing failed
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-opacity-75" // Darker overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Apply theme colors here */}
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-800 shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col" // White background, blue border top
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-blue-900">Proposal Details</h2> {/* Blue header text */}
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600" aria-label="Close pop-up">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-grow">
                     {/* Use text-gray-700/800 for labels and text-gray-600/700 for values */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-gray-700 font-semibold">ID:</p>
                            <p className="text-gray-600">{selectedProposal.id || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Title:</p>
                            <p className="text-gray-600">{selectedProposal.title || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Organizer / Department:</p>
                            <p className="text-gray-600">{selectedProposal.organizer || selectedProposal.organizingDepartment || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Category:</p>
                            <p className="text-gray-600">{selectedProposal.category || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Convener:</p>
                            <p className="text-gray-600">{selectedProposal.convenerName || 'N/A'} ({selectedProposal.convenerEmail || 'N/A'})</p>
                        </div>
                         {selectedProposal.designation && (
                            <div>
                                <p className="text-gray-700 font-semibold">Convener Designation:</p>
                                <p className="text-gray-600">{selectedProposal.designation}</p>
                            </div>
                         )}
                        <div>
                            <p className="text-gray-700 font-semibold">Status:</p>
                            <p className={`font-medium ${selectedProposal.status === 'Approved' ? 'text-green-600' : selectedProposal.status === 'Pending' ? 'text-yellow-600' : selectedProposal.status === 'Rejected' ? 'text-red-600' : selectedProposal.status === 'Review' ? 'text-blue-600' : 'text-gray-600'}`}>
                                {selectedProposal.status || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Event Start Date:</p>
                            {/* Use the helper function for safe formatting */}
                            <p className="text-gray-600">{formatDateSafe(selectedProposal.eventStartDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Event End Date:</p>
                            <p className="text-gray-600">{formatDateSafe(selectedProposal.eventEndDate)}</p>
                        </div>
                         {selectedProposal.durationEvent && (
                            <div>
                                <p className="text-gray-700 font-semibold">Duration:</p>
                                <p className="text-gray-600">{selectedProposal.durationEvent}</p>
                            </div>
                         )}
                         {selectedProposal.location && (
                             <div>
                                 <p className="text-gray-700 font-semibold">Location:</p>
                                 <p className="text-gray-600">{selectedProposal.location}</p>
                             </div>
                         )}
                        {/* Display calculated or estimated cost */}
                         <div>
                            <p className="text-gray-700 font-semibold">Estimated Budget / Cost:</p>
                            <p className="text-gray-600">
                                {selectedProposal.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? // Prefer specific cost if available
                                 selectedProposal.estimatedBudget?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? // Fallback to estimated
                                 'N/A'}
                            </p>
                         </div>

                        {/* Chief Guest */}
                         {selectedProposal.chiefGuestName && (
                             <div>
                                 <p className="text-gray-700 font-semibold">Chief Guest:</p>
                                 <p className="text-gray-600">{selectedProposal.chiefGuestName} ({selectedProposal.chiefGuestDesignation || 'N/A'})</p>
                             </div>
                         )}

                        {/* Description (spans both columns on small screens) */}
                        <div className="sm:col-span-2">
                            <p className="text-gray-700 font-semibold">Description:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{selectedProposal.description || 'N/A'}</p>
                        </div>
                    </div>

                    {/* --- Additional Sections (Conditionally Rendered) --- */}

                    {/* Past Events */}
                    {(selectedProposal.pastEvents && selectedProposal.pastEvents.length > 0) && (
                         <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-blue-800 font-semibold">Past Events:</p>
                             {Array.isArray(selectedProposal.pastEvents) ? (
                                <ul className="text-gray-600 list-disc list-inside pl-2">
                                    {selectedProposal.pastEvents.map((event, index) => <li key={index}>{event}</li>)}
                                </ul>
                             ) : (
                                <p className="text-gray-600 whitespace-pre-wrap">{selectedProposal.pastEvents}</p>
                             )}
                         </div>
                     )}

                    {/* Relevant Details */}
                     {selectedProposal.relevantDetails && (
                         <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-blue-800 font-semibold">Relevant Details:</p>
                             <p className="text-gray-600 whitespace-pre-wrap">{selectedProposal.relevantDetails}</p>
                         </div>
                     )}

                    {/* Sponsorship Details */}
                    {(selectedProposal.sponsorshipDetails && selectedProposal.sponsorshipDetails.length > 0) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-blue-800 font-semibold">Sponsorship Details:</p>
                            <ul className="text-gray-600 list-disc list-inside pl-2">
                                {selectedProposal.sponsorshipDetails.map((sponsor, index) => (
                                    <li key={index}>{sponsor}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Sponsorship Rows (Example display) */}
                    {(selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0) && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-blue-800 font-semibold">Sponsorship Rows:</p>
                            {/* Consider formatting this better, e.g., a table */}
                            <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                                {JSON.stringify(selectedProposal.sponsorshipDetailsRows, null, 2)}
                            </pre>
                        </div>
                    )}

                     {/* Detailed Budget */}
                     {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) && (
                         <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-blue-800 font-semibold">Detailed Budget:</p>
                             <ul className="list-disc list-inside text-gray-600 pl-2">
                                 {selectedProposal.detailedBudget.map((item, index) => (
                                     <li key={index}>
                                         {item.mainCategory || 'N/A'} - {item.subCategory || 'N/A'}
                                         {item.totalAmount != null ? ` (${item.totalAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})` : ' (N/A)'}
                                     </li>
                                 ))}
                             </ul>
                         </div>
                     )}

                     {/* Funding Details */}
                     {selectedProposal.fundingDetails && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                             <p className="text-blue-800 font-semibold">Funding Details:</p>
                             <ul className="list-disc list-inside text-gray-600 pl-2">
                                 {selectedProposal.fundingDetails.registrationFund != null && <li>Registration: {selectedProposal.fundingDetails.registrationFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</li>}
                                 {selectedProposal.fundingDetails.sponsorshipFund != null && <li>Sponsorship: {selectedProposal.fundingDetails.sponsorshipFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</li>}
                                 {selectedProposal.fundingDetails.universityFund != null && <li>University: {selectedProposal.fundingDetails.universityFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</li>}
                                 {selectedProposal.fundingDetails.otherSourcesFund != null && <li>Other: {selectedProposal.fundingDetails.otherSourcesFund.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</li>}
                             </ul>
                             {/* Check if *any* funding detail exists */}
                             {Object.values(selectedProposal.fundingDetails).every(val => val == null) && (
                                 <p className="text-gray-500 italic">No funding details provided.</p>
                             )}
                         </div>
                     )}

                    {/* Submission Timestamp */}
                     {selectedProposal.submissionTimestamp && (
                         <div className="mt-4 text-sm text-gray-500">
                             Submitted On: {formatDateSafe(selectedProposal.submissionTimestamp)}
                         </div>
                     )}

                    {/* Messages */}
                     {selectedProposal.rejectionMessage && (
                         <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                             <p className="font-semibold">Rejection Reason:</p>
                             <p className="whitespace-pre-wrap">{selectedProposal.rejectionMessage}</p>
                         </div>
                     )}
                     {selectedProposal.reviewMessage && (
                         <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 rounded-md border border-yellow-200">
                             <p className="font-semibold">Review Comments:</p>
                             <p className="whitespace-pre-wrap">{selectedProposal.reviewMessage}</p>
                         </div>
                     )}
                     {/* Add clarificationMessage if needed */}
                     {selectedProposal.clarificationMessage && (
                         <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                             <p className="font-semibold">Clarification Request:</p>
                             <p className="whitespace-pre-wrap">{selectedProposal.clarificationMessage}</p>
                         </div>
                     )}

                </div>

                {/* Footer / Actions Area */}
                <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    {errorMessage && (
                        <div className="text-red-600 text-sm mb-3 p-2 bg-red-100 border border-red-300 rounded">{errorMessage}</div>
                    )}

                    {/* Action Buttons (Only if Pending) */}
                    {selectedProposal.status === 'Pending' && !isRejecting && !isReviewing && (
                        <div className="flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={handleAccept}
                                className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-200 shadow-sm disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                onClick={handleReviewClick}
                                className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition duration-200 shadow-sm disabled:opacity-50"
                                disabled={isLoading}
                            >
                                Request Review/Clarification
                            </button>
                            <button
                                onClick={handleRejectClick}
                                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200 shadow-sm disabled:opacity-50"
                                disabled={isLoading}
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {/* Rejection Input Area */}
                    {isRejecting && (
                        <div className="mt-4 space-y-3">
                            <label htmlFor="rejectionMessage" className="block text-sm font-semibold text-gray-700">Reason for Rejection:</label>
                            <textarea
                                id="rejectionMessage"
                                rows={3}
                                className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm bg-white text-black" // Ensure text is visible
                                placeholder="Enter rejection reason here..."
                                value={rejectionInput}
                                onChange={(e) => setRejectionInput(e.target.value)}
                                disabled={isLoading}
                                required // Make sure a reason is provided
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelRejectReview}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-200 disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading || !rejectionInput.trim()} // Disable if no input or loading
                                >
                                    {isLoading ? 'Rejecting...' : 'Confirm Reject'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Input Area */}
                    {isReviewing && (
                         <div className="mt-4 space-y-3">
                            <label htmlFor="reviewMessage" className="block text-sm font-semibold text-gray-700">Comments for Review / Clarification Request:</label>
                            <textarea
                                id="reviewMessage"
                                rows={3}
                                className="mt-1 p-2 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 sm:text-sm bg-white text-black" // Ensure text is visible
                                placeholder="Enter review comments or clarification questions here..."
                                value={reviewInput}
                                onChange={(e) => setReviewInput(e.target.value)}
                                disabled={isLoading}
                                required // Make sure comments are provided
                            />
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={cancelRejectReview}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-200 disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReview}
                                     // Corrected class name - assuming you use Tailwind JIT or have baffle-yellow-500 defined elsewhere
                                     // If not, use standard Tailwind: bg-yellow-500
                                    className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isLoading || !reviewInput.trim()} // Disable if no input or loading
                                >
                                    {isLoading ? 'Submitting...' : 'Submit for Review'}
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