// popup.tsx (Modified for HOD actions)
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isValid, differenceInCalendarDays } from 'date-fns';
import { useRouter } from 'next/navigation'; // Keep for potential future use
import {
    X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign, Info,
    CalendarDays, AlertCircle, MessageSquare, Edit, Loader2, ThumbsUp, ThumbsDown,
    MessageCircle, Send // Added Send icon
} from 'lucide-react';

// --- Interfaces (Keep as defined previously) ---
interface BudgetItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface SponsorItem { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface MessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface Message { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: MessageUser; }
interface Proposal { id: string; title: string; description: string; category: string; status: string; eventStartDate: string; eventEndDate: string; submissionTimestamp: string; date: string; organizer: string; convenerName: string; convenerEmail?: string; convenerDesignation?: string; participantExpected?: number | null; participantCategories?: string[] | null; chiefGuestName?: string; chiefGuestDesignation?: string; chiefGuestAddress?: string; chiefGuestPhone?: string; chiefGuestPan?: string; chiefGuestReason?: string; hotelName?: string; hotelAddress?: string; hotelDuration?: number; hotelType?: 'srm' | 'others' | null; travelName?: string; travelAddress?: string; travelDuration?: number; travelType?: 'srm' | 'others' | null; estimatedBudget?: number; fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; }; detailedBudget: BudgetItem[]; sponsorshipDetailsRows: SponsorItem[]; pastEvents?: string | null; relevantDetails?: string | null; awaiting?: string | null; messages: Message[]; }

// --- Popup Props ---
interface PopupProps {
    selectedProposal: Proposal | null; // Can be null when loading details
    closePopup: () => void;
    // HOD Action Handlers passed from HODDashboard
    onAccept?: (proposalId: string) => Promise<void> | void;
    onReject?: (proposalId: string, reason: string) => Promise<void> | void;
    onReview?: (proposalId: string, comments: string) => Promise<void> | void;
    // Loading/Error states passed from HODDashboard
    isLoading?: boolean; // Loading state for actions (Accept/Reject/Review)
    errorMessage?: string | null; // Error message FOR actions
    isDetailLoading?: boolean; // Loading state for fetching the detail itself
    // Optional callback after successful action (can be handled by dashboard too)
    onProposalUpdated?: () => void;
    // Current user role (optional, but good for clarity)
    currentUserRole?: 'faculty' | 'hod' | 'dean' | 'chair' | 'vice_chair' | string;
}

// --- Helper Components (DetailItem) ---
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => {
    if (!children && (value === null || value === undefined || value === '')) { return null; }
    return (<div className={className}> <p className="text-sm font-semibold text-gray-700">{label}:</p> {children ? <div className="text-sm text-gray-600 mt-0.5">{children}</div> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>} </div>);
};

// --- Loading Skeleton Component ---
const PopupSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col animate-pulse">
        {/* Simplified Skeleton */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center"> <div className="h-6 bg-gray-300 rounded w-3/4"></div> <div className="h-6 w-6 bg-gray-300 rounded-full"></div> </div>
        <div className="p-6 flex-grow"> <div className="space-y-4"> <div className="h-4 bg-gray-300 rounded w-1/2"></div> <div className="h-4 bg-gray-200 rounded w-full"></div> <div className="h-4 bg-gray-200 rounded w-5/6"></div> <div className="h-4 bg-gray-300 rounded w-1/3 mt-6"></div> <div className="h-4 bg-gray-200 rounded w-full"></div> <div className="h-4 bg-gray-200 rounded w-4/6"></div> </div> </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50"> <div className="h-8 bg-gray-300 rounded w-1/4 float-right"></div> </div>
    </div>
);


// --- Main Popup Component ---
const Popup: React.FC<PopupProps> = ({
    selectedProposal,
    closePopup,
    onAccept,
    onReject,
    onReview,
    isLoading = false, // Default action loading state
    errorMessage = null, // Default action error message
    isDetailLoading = false, // Default detail loading state
    onProposalUpdated,
    currentUserRole
}) => {
    const [rejectionInput, setRejectionInput] = useState('');
    const [reviewInput, setReviewInput] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);
    const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(null); // For input validation

    const router = useRouter(); // Keep for potential future use

    // Clear local state when proposal changes or popup closes
    useEffect(() => {
        setIsRejecting(false);
        setIsReviewing(false);
        setRejectionInput('');
        setReviewInput('');
        setLocalErrorMessage(null);
    }, [selectedProposal]); // Trigger reset when the selected proposal changes

    // Action Click Handlers to show/hide inputs
    const handleRejectClick = () => { setIsRejecting(true); setIsReviewing(false); setLocalErrorMessage(null); };
    const handleReviewClick = () => { setIsReviewing(true); setIsRejecting(false); setLocalErrorMessage(null); };
    const cancelAction = () => { setIsRejecting(false); setIsReviewing(false); setRejectionInput(''); setReviewInput(''); setLocalErrorMessage(null); };

    // Action Execution Handlers (Call props passed from dashboard)
    const executeAccept = async () => {
        if (onAccept && selectedProposal) {
            setLocalErrorMessage(null);
            await onAccept(selectedProposal.id);
            // Parent (HODDashboard) handles success (refresh/close)
        }
    };

    const executeReject = async () => {
        if (!rejectionInput.trim()) { setLocalErrorMessage("Rejection reason cannot be empty."); return; }
        if (onReject && selectedProposal) {
            setLocalErrorMessage(null);
            await onReject(selectedProposal.id, rejectionInput);
            // Parent (HODDashboard) handles success (refresh/close)
        }
    };

    const executeReview = async () => {
        if (!reviewInput.trim()) { setLocalErrorMessage("Review comments cannot be empty."); return; }
        if (onReview && selectedProposal) {
            setLocalErrorMessage(null);
            await onReview(selectedProposal.id, reviewInput);
            // Parent (HODDashboard) handles success (refresh/close)
        }
    };

    // --- Helper Functions ---
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => { if (!dateString) return 'N/A'; try { const d = new Date(dateString); if (isValid(d)) return format(d, formatString); } catch (e) { } return 'Invalid Date'; };
    const calculateDuration = () => { if (!selectedProposal) return 'N/A'; try { const s = new Date(selectedProposal.eventStartDate), e = new Date(selectedProposal.eventEndDate); if (isValid(s) && isValid(e) && e >= s) { const d = differenceInCalendarDays(e, s) + 1; return `${d} day${d !== 1 ? 's' : ''}`; } } catch (e) { } return 'N/A'; };
    const formatCurrency = (value: number | null | undefined) => { if (value == null) return 'N/A'; return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }); };
    const formatRole = (role: string | null | undefined): string => { if (!role) return 'N/A'; return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); };

    // --- Render Logic ---

    if (isDetailLoading) {
        return (<motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-opacity-60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}> <PopupSkeleton /> </motion.div>);
    }
    if (!selectedProposal) { return null; /* Or some minimal message/error */ }

    const eventDuration = calculateDuration();

    // Determine if HOD actions should be shown
    // HOD can act if status is pending/review AND they are the one awaited OR if no specific role is awaited.
    const canHodAct = currentUserRole === 'hod' &&
        ['pending', 'review'].includes(selectedProposal.status) &&
        (!selectedProposal.awaiting || selectedProposal.awaiting.toLowerCase() === 'hod');

    // --- JSX Return ---
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center  backdrop-blur-md bg-opacity-50 p-4" // Adjusted background
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-indigo-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col" // Changed border color slightly
                initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-indigo-900">{selectedProposal.title || 'Proposal Details'}</h2>
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Close pop-up"> <X className="h-6 w-6" /> </button>
                </div>

                {/* Scrollable Content Area (Sections remain the same) */}
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                    {/* --- Core Event Details --- */}
                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80"> <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><Info size={18} /> Event Information</h3> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3"> <DetailItem label="Proposal ID" value={selectedProposal.id} /> <DetailItem label="Category" value={formatRole(selectedProposal.category)} /> <DetailItem label="Status" > <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedProposal.status === 'approved' ? 'bg-green-100 text-green-700' : selectedProposal.status === 'completed' ? 'bg-purple-100 text-purple-700' : selectedProposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selectedProposal.status === 'rejected' ? 'bg-red-100 text-red-700' : selectedProposal.status === 'review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}> {formatRole(selectedProposal.status)} </span> </DetailItem> <DetailItem label="Awaiting Approval From" value={formatRole(selectedProposal.awaiting) || (selectedProposal.status !== 'pending' && selectedProposal.status !== 'review' ? '-' : 'N/A')} /> <DetailItem label="Event Start Date" value={formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} /> <DetailItem label="Event End Date" value={formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} /> <DetailItem label="Duration" value={eventDuration} /> <DetailItem label="Submitted On" value={formatDateSafe(selectedProposal.submissionTimestamp)} /> <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Description" value={selectedProposal.description || 'N/A'} /> </div> <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Past Relevant Events" value={selectedProposal.pastEvents || 'N/A'} /> </div> <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Other Relevant Details" value={selectedProposal.relevantDetails || 'N/A'} /> </div> </div> </section>
                    {/* --- Convener & Participants --- */}
                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80"> <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><Users size={18} /> Organizer & Participants</h3> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3"> <DetailItem label="Organizing Dept." value={selectedProposal.organizer} /> <DetailItem label="Convener Name" value={selectedProposal.convenerName} /> <DetailItem label="Convener Email" value={selectedProposal.convenerEmail} /> <DetailItem label="Convener Designation" value={selectedProposal.convenerDesignation || 'N/A'} /> <DetailItem label="Expected Participants" value={selectedProposal.participantExpected ?? 'N/A'} /> <DetailItem label="Participant Categories" className="md:col-span-2"> {(selectedProposal.participantCategories && selectedProposal.participantCategories.length > 0) ? (<div className="flex flex-wrap gap-1 mt-1"> {selectedProposal.participantCategories.map((cat, index) => (<span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cat}</span>))} </div>) : <p className="text-sm text-gray-600">N/A</p>} </DetailItem> </div> </section>
                    {/* --- Chief Guest Details (Conditional) --- */}
                    {selectedProposal.chiefGuestName && (<section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80"> <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><UserCheck size={18} /> Chief Guest</h3> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3"> <DetailItem label="Name" value={selectedProposal.chiefGuestName} /> <DetailItem label="Designation" value={selectedProposal.chiefGuestDesignation} /> <DetailItem label="Phone" value={selectedProposal.chiefGuestPhone} /> <DetailItem label="PAN" value={selectedProposal.chiefGuestPan} /> <DetailItem label="Address" value={selectedProposal.chiefGuestAddress} className="md:col-span-2" /> <DetailItem label="Reason for Inviting" value={selectedProposal.chiefGuestReason || 'N/A'} className="md:col-span-3" /> </div> {(selectedProposal.hotelName || selectedProposal.travelName) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2">Accommodation & Travel</h4> <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3"> <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><BedDouble size={16} /> Accommodation</p> <DetailItem label="Hotel" value={`${selectedProposal.hotelName || 'N/A'} (${selectedProposal.hotelType || 'N/A'})`} /> <DetailItem label="Hotel Address" value={selectedProposal.hotelAddress || 'N/A'} /> <DetailItem label="Stay Duration" value={selectedProposal.hotelDuration ? `${selectedProposal.hotelDuration} day(s)` : 'N/A'} /> </div> <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><Car size={16} /> Travel</p> <DetailItem label="Mode" value={`${selectedProposal.travelName || 'N/A'} (${selectedProposal.travelType || 'N/A'})`} /> <DetailItem label="From/To" value={selectedProposal.travelAddress || 'N/A'} /> <DetailItem label="Travel Duration/Trips" value={selectedProposal.travelDuration ? `${selectedProposal.travelDuration} day(s)/trip(s)` : 'N/A'} /> </div> </div> </div>)} </section>)}
                    {/* --- Financial Details --- */}
                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80"> <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Financial Overview</h3> <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4"> <DetailItem label="Est. Total Budget" value={formatCurrency(selectedProposal.estimatedBudget)} /> <DetailItem label="University Fund" value={formatCurrency(selectedProposal.fundingDetails?.universityFund)} /> <DetailItem label="Registration Fund" value={formatCurrency(selectedProposal.fundingDetails?.registrationFund)} /> <DetailItem label="Sponsorship Fund" value={formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)} /> <DetailItem label="Other Fund" value={formatCurrency(selectedProposal.fundingDetails?.otherSourcesFund)} /> </div> {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><FileText size={16} /> Detailed Budget Items</h4> <div className="overflow-x-auto max-h-60 border rounded-md"> <table className="table table-sm w-full text-xs"> <thead className="sticky top-0 bg-gray-100 z-10"> <tr> <th className="p-2">Category</th> <th className="p-2">Subcategory</th> <th className="p-2">Type</th> <th className="p-2 text-center">Status</th> <th className='p-2 text-right'>Qty</th> <th className='p-2 text-right'>Cost/Unit</th> <th className='p-2 text-right'>Total</th> </tr> </thead> <tbody> {selectedProposal.detailedBudget.map((item, index) => (<tr key={item.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200"> <td className="p-2">{item.category}</td> <td className="p-2">{item.sub_category}</td> <td className="p-2">{item.type || '-'}</td> <td className='p-2 text-center'> <span className={`font-medium px-1.5 py-0.5 rounded-full text-[10px] ${item.status === 'actual' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}> {item.status || 'N/A'} </span> </td> <td className='p-2 text-right'>{item.quantity}</td> <td className='p-2 text-right'>{formatCurrency(item.cost)}</td> <td className='p-2 text-right font-medium'>{formatCurrency(item.amount)}</td> </tr>))} </tbody> <tfoot className='sticky bottom-0'> <tr className='font-bold bg-gray-100'> <td colSpan={6} className='p-2 text-right'>Total:</td> <td className='p-2 text-right'>{formatCurrency(selectedProposal.estimatedBudget)}</td> </tr> </tfoot> </table> </div> </div>)} {(selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><Award size={16} /> Sponsorship Details</h4> <div className="overflow-x-auto max-h-60 border rounded-md"> <table className="table table-sm w-full text-xs"> <thead className="sticky top-0 bg-gray-100 z-10"> <tr> <th className='p-2'>Sponsor/Category</th> <th className='p-2'>Mode</th> <th className='p-2 text-right'>Amount</th> <th className='p-2'>Reward</th> <th className='p-2'>Benefit</th> <th className='p-2'>About</th> </tr> </thead> <tbody> {selectedProposal.sponsorshipDetailsRows.map((sponsor, index) => (<tr key={sponsor.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200"> <td className='p-2'>{sponsor.category}</td> <td className='p-2'>{sponsor.mode}</td> <td className='p-2 text-right'>{formatCurrency(sponsor.amount)}</td> <td className='p-2'>{sponsor.reward}</td> <td className='p-2'>{sponsor.benefit}</td> <td className="p-2 max-w-[150px] truncate" title={sponsor.about}>{sponsor.about}</td> </tr>))} </tbody> </table> </div> </div>)} </section>
                    {/* --- Communication Log --- */}
                    {(selectedProposal.messages && selectedProposal.messages.length > 0) && (<section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80"> <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2"> <MessageSquare size={18} /> Communication Log </h3> <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar"> {selectedProposal.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg) => (<div key={msg.id} className="p-3 border-l-4 border-indigo-300 rounded-r-md bg-white shadow-sm"> <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p> <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-1.5"> <span> By: <span className='font-medium text-gray-700'>{msg.user?.name || 'Unknown User'}</span> <span className='italic ml-1'>({formatRole(msg.user?.role)})</span> </span> <span title={formatDateSafe(msg.created_at, 'PPpp')}> {formatDateSafe(msg.created_at, 'dd-MM-yy hh:mm a')} </span> </div> </div>))} </div> </section>)}

                </div> {/* End Scrollable Content Area */}

                {/* Footer / Actions Area */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {/* Global Action Error Display */}
                    {errorMessage && (<div className="alert alert-error shadow-lg text-xs p-2 mb-3"> <div> <AlertCircle size={16} /> <span>Action Error: {errorMessage}</span> </div> </div>)}
                    {/* Local Input Error Display */}
                    {localErrorMessage && (<div className="alert alert-warning shadow-lg text-xs p-2 mb-3"> <div> <AlertCircle size={16} /> <span>{localErrorMessage}</span> </div> </div>)}

                    {/* --- Action Buttons Logic --- */}
                    {/* Only HOD actions are relevant here based on previous context */}
                    {canHodAct && !isRejecting && !isReviewing && (
                        <div className="flex flex-wrap gap-3 justify-end">
                            {/* Accept Button */}
                            <button onClick={executeAccept} className="btn btn-success btn-sm text-white" disabled={isLoading}> {isLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : <ThumbsUp size={16} className="mr-1" />} Accept </button>
                            {/* Review Button */}
                            <button onClick={handleReviewClick} className="btn btn-warning btn-sm text-white" disabled={isLoading}> <MessageCircle size={16} className="mr-1" /> Request Review/Clarification </button>
                            {/* Reject Button */}
                            <button onClick={handleRejectClick} className="btn btn-error btn-sm text-white" disabled={isLoading}> <ThumbsDown size={16} className="mr-1" /> Reject </button>
                        </div>
                    )}

                    {/* --- Input Areas (Only show if corresponding action is initiated) --- */}
                    {isRejecting && (
                        <div className="mt-3 space-y-2">
                            <label htmlFor="rejectionMessage" className="block text-sm font-semibold text-gray-700">Reason for Rejection: <span className="text-red-500">*</span></label>
                            <textarea id="rejectionMessage" rows={2} className={`textarea textarea-bordered w-full bg-white text-black ${localErrorMessage?.includes('Rejection') ? 'textarea-error' : ''}`} placeholder="Enter rejection reason here..." value={rejectionInput} onChange={(e) => setRejectionInput(e.target.value)} disabled={isLoading} required />
                            <div className="flex gap-3 justify-end mt-2">
                                <button onClick={cancelAction} className="btn btn-ghost btn-sm" disabled={isLoading}>Cancel</button>
                                <button onClick={executeReject} className="btn btn-error btn-sm text-white" disabled={isLoading || !rejectionInput.trim()}> {isLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : <ThumbsDown size={16} className="mr-1" />} Confirm Reject </button>
                            </div>
                        </div>
                    )}

                    {isReviewing && (
                        <div className="mt-3 space-y-2">
                            <label htmlFor="reviewMessage" className="block text-sm font-semibold text-gray-700">Comments for Review / Clarification Request: <span className="text-red-500">*</span></label>
                            <textarea id="reviewMessage" rows={2} className={`textarea textarea-bordered w-full bg-white text-black ${localErrorMessage?.includes('Review') ? 'textarea-error' : ''}`} placeholder="Enter comments or questions here..." value={reviewInput} onChange={(e) => setReviewInput(e.target.value)} disabled={isLoading} required />
                            <div className="flex gap-3 justify-end mt-2">
                                <button onClick={cancelAction} className="btn btn-ghost btn-sm" disabled={isLoading}>Cancel</button>
                                <button onClick={executeReview} className="btn btn-warning btn-sm text-white" disabled={isLoading || !reviewInput.trim()}> {isLoading ? <Loader2 className="animate-spin mr-1" size={16} /> : <Send size={16} className="mr-1" />} Submit Review </button>
                            </div>
                        </div>
                    )}
                </div> {/* End Footer */}
            </motion.div>
        </motion.div>
    );
};

export default Popup;