import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { X } from 'lucide-react';

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: string;
    category: string;
    cost: number;
    email: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation: string;
    detailedBudget: { mainCategory: string; subCategory: string; totalAmount?: number }[];
    durationEvent: string;
    estimatedBudget: number;
    eventDate: string;
    eventDescription: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle: string;
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    organizingDepartment: string;
    pastEvents?: string[];
    proposalStatus: string;
    relevantDetails?: string;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: { [key: string]: string | number | boolean }[];
    submissionTimestamp: string;
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
}

interface PopupProps {
    selectedProposal: Proposal;
    closePopup: () => void;
}

const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup }) => {
    const [rejectionInput, setRejectionInput] = useState('');
    const [reviewInput, setReviewInput] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

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
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-gray-500 bg-opacity-50"
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="bg-blue-50 rounded-lg border-t-4 border-blue-800 shadow-md shadow-blue-950 p-8 max-w-2xl w-full"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
            >
                <div className="flex justify-between rounded-md items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Proposal Details</h2>
                    <button onClick={closePopup} className="text-gray-600 hover:text-gray-800" aria-label="Close pop-up">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[500px]">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-gray-700 font-semibold">ID:</p>
                            <p className="text-gray-600">{selectedProposal.id}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Title:</p>
                            <p className="text-gray-600">{selectedProposal.title}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Organizer:</p>
                            <p className="text-gray-600">{selectedProposal.organizer}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Date:</p>
                            <p className="text-gray-600">{format(new Date(selectedProposal.date), 'dd-MM-yyyy hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Status:</p>
                            <p className="text-gray-600">{selectedProposal.status}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Category:</p>
                            <p className="text-gray-600">{selectedProposal.category}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Cost:</p>
                            <p className="text-gray-600">{selectedProposal.cost ? `$${selectedProposal.cost.toLocaleString()}` : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Estimated Budget:</p>
                            <p className="text-gray-600">{selectedProposal.estimatedBudget ? `$${selectedProposal.estimatedBudget.toLocaleString()}` : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Email:</p>
                            <p className="text-gray-600">{selectedProposal.email}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Convener:</p>
                            <p className="text-gray-600">{selectedProposal.convenerName} ({selectedProposal.convenerEmail})</p>
                        </div>
                        {selectedProposal.location && (
                            <div>
                                <p className="text-gray-700 font-semibold">Location:</p>
                                <p className="text-gray-600">{selectedProposal.location}</p>
                            </div>
                        )}
                        {selectedProposal.chiefGuestName && (
                            <div>
                                <p className="text-gray-700 font-semibold">Chief Guest:</p>
                                <p className="text-gray-600">{selectedProposal.chiefGuestName} ({selectedProposal.chiefGuestDesignation})</p>
                            </div>
                        )}
                        {selectedProposal.designation && (
                            <div>
                                <p className="text-gray-700 font-semibold">Designation:</p>
                                <p className="text-gray-600">{selectedProposal.designation}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-gray-700 font-semibold">Duration:</p>
                            <p className="text-gray-600">{selectedProposal.durationEvent}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">Start Date:</p>
                            <p className="text-gray-600">{format(new Date(selectedProposal.eventStartDate), 'dd-MM-yyyy hh:mm a')}</p>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold">End Date:</p>
                            <p className="text-gray-600">{format(new Date(selectedProposal.eventEndDate), 'dd-MM-yyyy hh:mm a')}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-700 font-semibold">Description:</p>
                            <p className="text-gray-600">{selectedProposal.description}</p>
                        </div>
                    </div>

                    {selectedProposal.pastEvents && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Past Events:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{selectedProposal.pastEvents}</p>
                        </div>
                    )}

                    {selectedProposal.relevantDetails && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Relevant Details:</p>
                            <p className="text-gray-600 whitespace-pre-wrap">{selectedProposal.relevantDetails}</p>
                        </div>
                    )}

                    {selectedProposal.sponsorshipDetails && Array.isArray(selectedProposal.sponsorshipDetails) && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Sponsorship Details:</p>
                            <ul className="text-gray-600 list-disc list-inside">
                                {selectedProposal.sponsorshipDetails.map((sponsor, index) => (
                                    <li key={index}>{sponsor}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedProposal.sponsorshipDetailsRows && Array.isArray(selectedProposal.sponsorshipDetailsRows) && selectedProposal.sponsorshipDetailsRows.length > 0 && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Sponsorship Details Rows:</p>
                            <ul className="text-gray-600 list-disc list-inside">
                                {selectedProposal.sponsorshipDetailsRows.map((row, index) => (
                                    <li key={index}>{JSON.stringify(row)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0 && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Detailed Budget:</p>
                            <ul className="list-disc list-inside text-gray-600">
                                {selectedProposal.detailedBudget.map((item, index) => (
                                    <li key={index}>
                                        {item.mainCategory} - {item.subCategory} (${item.totalAmount?.toLocaleString() || 'N/A'})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {selectedProposal.fundingDetails && (
                        <div className="mt-4 p-4 rounded-md">
                            <p className="text-gray-700 font-semibold">Funding Details:</p>
                            <ul className="list-disc list-inside text-gray-600">
                                {selectedProposal.fundingDetails.registrationFund && (
                                    <li><span className="font-semibold">Registration Fund:</span> ${selectedProposal.fundingDetails.registrationFund}</li>
                                )}
                                {selectedProposal.fundingDetails.sponsorshipFund && (
                                    <li><span className="font-semibold">Sponsorship Fund:</span> ${selectedProposal.fundingDetails.sponsorshipFund}</li>
                                )}
                                {selectedProposal.fundingDetails.universityFund && (
                                    <li><span className="font-semibold">University Fund:</span> ${selectedProposal.fundingDetails.universityFund}</li>
                                )}
                                {selectedProposal.fundingDetails.otherSourcesFund && (
                                    <li><span className="font-semibold">Other Sources:</span> ${selectedProposal.fundingDetails.otherSourcesFund}</li>
                                )}
                            </ul>
                            {!selectedProposal.fundingDetails.registrationFund &&
                                !selectedProposal.fundingDetails.sponsorshipFund &&
                                !selectedProposal.fundingDetails.universityFund &&
                                !selectedProposal.fundingDetails.otherSourcesFund && (
                                    <p className="text-gray-600">No funding details available</p>
                                )}
                        </div>
                    )}

                    {selectedProposal.submissionTimestamp && (
                        <div className="mt-4">
                            <p className="text-gray-700 font-semibold">Submitted On:</p>
                            <p className="text-gray-600">{format(new Date(selectedProposal.submissionTimestamp), 'dd-MM-yyyy hh:mm a')}</p>
                        </div>
                    )}

                    {selectedProposal.rejectionMessage && (
                        <div className="mt-4 p-4 bg-red-100 rounded-md">
                            <p className="text-gray-700 font-semibold">Rejection Reason:</p>
                            <p className="text-gray-600">{selectedProposal.rejectionMessage}</p>
                        </div>
                    )}

                    {selectedProposal.reviewMessage && (
                        <div className="mt-4 p-4 bg-yellow-100 rounded-md">
                            <p className="text-gray-700 font-semibold">Review Comments:</p>
                            <p className="text-gray-600">{selectedProposal.reviewMessage}</p>
                        </div>
                    )}
                </div>

                {selectedProposal.status === 'Pending' && !isRejecting && !isReviewing && (
                    <div className="flex space-x-4 mt-6">
                        <button
                            onClick={() => {}}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition duration-300"
                        >
                            Accept
                        </button>
                        <button
                            onClick={handleReviewClick}
                            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition duration-300"
                        >
                            Review
                        </button>
                        <button
                            onClick={handleRejectClick}
                            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300"
                        >
                            Reject
                        </button>
                    </div>
                )}

                {isRejecting && (
                    <div className="mt-6">
                        <div className="mb-2">
                            <label htmlFor="rejectionMessage" className="block text-sm font-semibold text-gray-700">Reason for Rejection:</label>
                            <textarea
                                id="rejectionMessage"
                                rows={3}
                                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white text-black"
                                placeholder="Enter rejection reason here..."
                                value={rejectionInput}
                                onChange={(e) => setRejectionInput(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-4 justify-end">
                            <button
                                onClick={cancelRejectReview}
                                className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {}}
                                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition duration-300"
                                disabled={!rejectionInput.trim()}
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                )}

                {isReviewing && (
                    <div className="mt-6">
                        <div className="mb-2">
                            <label htmlFor="reviewMessage" className="block text-sm font-semibold text-gray-700">Comments for Review:</label>
                            <textarea
                                id="reviewMessage"
                                rows={3}
                                className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-black bg-white"
                                placeholder="Enter review comments here..."
                                value={reviewInput}
                                onChange={(e) => setReviewInput(e.target.value)}
                            />
                        </div>
                        <div className="flex space-x-4 justify-end">
                            <button
                                onClick={cancelRejectReview}
                                className="px-4 py-2 text-gray-600 bg-gray-200 hover:bg-gray-300 rounded-md transition duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {}}
                                className="px-6 py-2 baffle-yellow-500 hover:bg-yellow-600 text-white rounded-md transition duration-300"
                                disabled={!reviewInput.trim()}
                            >
                                Confirm Review
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default Popup;
