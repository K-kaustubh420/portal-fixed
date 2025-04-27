// popup.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isValid, differenceInCalendarDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign, Info, CalendarDays, AlertCircle, MessageSquare, Edit } from 'lucide-react';

// --- Interfaces (Keep BudgetItem, SponsorItem, MessageUser, Message, Proposal as before) ---
interface BudgetItem { id: number; proposal_id: number; category: string; sub_category: string; type: 'Domestic' | 'International' | null; quantity: number; cost: number; amount: number; status: string; created_at: string; updated_at: string; }
interface SponsorItem { id: number; proposal_id: number; category: string; amount: number; reward: string; mode: string; about: string; benefit: string; created_at: string; updated_at: string; }
interface MessageUser { id: number; name: string; email: string; role: string; designation?: string; }
interface Message { id: number; proposal_id: number; user_id: number; message: string; created_at: string; updated_at: string; user: MessageUser; }
interface Proposal { id: string; title: string; description: string; category: string; status: string; eventStartDate: string; eventEndDate: string; submissionTimestamp: string; date: string; organizer: string; convenerName: string; convenerEmail?: string; convenerDesignation?: string; participantExpected?: number | null; participantCategories?: string[] | null; chiefGuestName?: string; chiefGuestDesignation?: string; chiefGuestAddress?: string; chiefGuestPhone?: string; chiefGuestPan?: string; chiefGuestReason?: string; hotelName?: string; hotelAddress?: string; hotelDuration?: number; hotelType?: 'srm' | 'others' | null; travelName?: string; travelAddress?: string; travelDuration?: number; travelType?: 'srm' | 'others' | null; estimatedBudget?: number; fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; }; detailedBudget: BudgetItem[]; sponsorshipDetailsRows: SponsorItem[]; pastEvents?: string | null; relevantDetails?: string | null; awaiting?: string | null; messages: Message[]; }


// --- Popup Props ---
interface PopupProps {
    selectedProposal: Proposal;
    closePopup: () => void;
    onProposalUpdated?: () => void;
}

// --- Helper Components (DetailItem) ---
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => {
    // ... (keep existing implementation)
    if (!children && (value === null || value === undefined || value === '')) { return null; }
    return (<div className={className}> <p className="text-sm font-semibold text-gray-700">{label}:</p> {children ? <div className="text-sm text-gray-600 mt-0.5">{children}</div> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>} </div>);
};

// --- Main Popup Component ---
const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup, onProposalUpdated }) => {
    // State and Router setup (keep as before)
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const router = useRouter();

    // --- Helper Functions (Keep as before) ---
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try { const dateObj = new Date(dateString); if (isValid(dateObj)) { return format(dateObj, formatString); } } catch (e) { /* ignore */ }
        return 'Invalid Date';
    };
    const calculateDuration = () => {
        try { const start = new Date(selectedProposal.eventStartDate); const end = new Date(selectedProposal.eventEndDate); if (isValid(start) && isValid(end) && end >= start) { const days = differenceInCalendarDays(end, start) + 1; return `${days} day${days !== 1 ? 's' : ''}`; } } catch (e) { /* ignore */ }
        return 'N/A';
    };
    const eventDuration = calculateDuration();
    const formatCurrency = (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'N/A';
        return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    };

    // --- Format Role Function ---
    const formatRole = (role: string | null | undefined): string => {
        if (!role) return 'N/A';
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // --- JSX ---
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-opacity-60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-blue-900">{selectedProposal.title || 'Proposal Details'}</h2>
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Close pop-up">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow">
                    {/* --- Core Event Details --- */}
                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><Info size={18} /> Event Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                            {/* Details Items... */}
                            <DetailItem label="Proposal ID" value={selectedProposal.id} />
                            <DetailItem label="Category" value={selectedProposal.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'} />
                            <DetailItem label="Status" >
                                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedProposal.status === 'approved' ? 'bg-green-100 text-green-700' :
                                        selectedProposal.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                                            selectedProposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                selectedProposal.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    selectedProposal.status === 'review' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                    {formatRole(selectedProposal.status)}
                                </span>
                            </DetailItem>
                            <DetailItem label="Awaiting Approval From" value={formatRole(selectedProposal.awaiting) || (selectedProposal.status !== 'pending' && selectedProposal.status !== 'review' ? '-' : 'N/A')} />
                            <DetailItem label="Event Start Date" value={formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} />
                            <DetailItem label="Event End Date" value={formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} />
                            <DetailItem label="Duration" value={eventDuration} />
                            <DetailItem label="Submitted On" value={formatDateSafe(selectedProposal.submissionTimestamp)} />
                            <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Description" value={selectedProposal.description || 'N/A'} /> </div>
                            <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Past Relevant Events" value={selectedProposal.pastEvents || 'N/A'} /> </div>
                            <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Other Relevant Details" value={selectedProposal.relevantDetails || 'N/A'} /> </div>
                        </div>
                    </section>


                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><Users size={18} /> Organizer & Participants</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">

                            <DetailItem label="Organizing Dept." value={selectedProposal.organizer} />
                            <DetailItem label="Convener Name" value={selectedProposal.convenerName} />
                            <DetailItem label="Convener Email" value={selectedProposal.convenerEmail} />
                            <DetailItem label="Convener Designation" value={selectedProposal.convenerDesignation || 'N/A'} />
                            <DetailItem label="Expected Participants" value={selectedProposal.participantExpected ?? 'N/A'} />
                            <DetailItem label="Participant Categories" className="md:col-span-2">
                                {selectedProposal.participantCategories && selectedProposal.participantCategories.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-1"> {selectedProposal.participantCategories.map((cat, index) => (<span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cat}</span>))} </div>
                                ) : <p className="text-sm text-gray-600">N/A</p>}
                            </DetailItem>
                        </div>
                    </section>

                    {/* --- Chief Guest Details --- */}
                    {selectedProposal.chiefGuestName && (
                        <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">

                            <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><UserCheck size={18} /> Chief Guest</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                <DetailItem label="Name" value={selectedProposal.chiefGuestName} /> <DetailItem label="Designation" value={selectedProposal.chiefGuestDesignation} /> <DetailItem label="Phone" value={selectedProposal.chiefGuestPhone} />
                                <DetailItem label="PAN" value={selectedProposal.chiefGuestPan} /> <DetailItem label="Address" value={selectedProposal.chiefGuestAddress} className="md:col-span-2" /> <DetailItem label="Reason for Inviting" value={selectedProposal.chiefGuestReason || 'N/A'} className="md:col-span-3" />
                            </div>
                            {(selectedProposal.hotelName || selectedProposal.travelName) && (
                                <div className="mt-4 pt-3 border-t border-gray-200">
                                    <h4 className="text-md font-medium text-gray-700 mb-2">Accommodation & Travel</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                        <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><BedDouble size={16} /> Accommodation</p> <DetailItem label="Hotel" value={`${selectedProposal.hotelName || 'N/A'} (${selectedProposal.hotelType || 'N/A'})`} /> <DetailItem label="Hotel Address" value={selectedProposal.hotelAddress || 'N/A'} /> <DetailItem label="Stay Duration" value={selectedProposal.hotelDuration ? `${selectedProposal.hotelDuration} day(s)` : 'N/A'} /> </div>
                                        <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><Car size={16} /> Travel</p> <DetailItem label="Mode" value={`${selectedProposal.travelName || 'N/A'} (${selectedProposal.travelType || 'N/A'})`} /> <DetailItem label="From/To" value={selectedProposal.travelAddress || 'N/A'} /> <DetailItem label="Travel Duration/Trips" value={selectedProposal.travelDuration ? `${selectedProposal.travelDuration} day(s)/trip(s)` : 'N/A'} /> </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* --- Financial Details --- */}
                    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">

                        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Financial Overview</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4"> <DetailItem label="Est. Total Budget" value={formatCurrency(selectedProposal.estimatedBudget)} /> <DetailItem label="University Fund" value={formatCurrency(selectedProposal.fundingDetails?.universityFund)} /> <DetailItem label="Registration Fund" value={formatCurrency(selectedProposal.fundingDetails?.registrationFund)} /> <DetailItem label="Sponsorship Fund" value={formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)} /> <DetailItem label="Other Fund" value={formatCurrency(selectedProposal.fundingDetails?.otherSourcesFund)} /> </div>
                        {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) && (
                            <div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><FileText size={16} /> Detailed Budget Items</h4> <div className="overflow-x-auto max-h-60 border rounded-md"> <table className="table table-sm w-full text-xs">
                                <thead className="sticky top-0 bg-gray-100 z-10"> <tr>
                                    <th className="p-2">Category</th>

                                    <th className="p-2">Subcategory</th>
                                    <th className="p-2">Type</th>
                                    <th className="p-2 text-center">Status</th>
                                    <th className='p-2 text-right'>Qty</th>
                                    <th className='p-2 text-right'>Cost/Unit</th>
                                    <th className='p-2 text-right'>Total</th>
                                </tr> </thead>
                                <tbody> {selectedProposal.detailedBudget.map((item, index) => (<tr key={item.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                                    <td className="p-2">{item.category}</td>
                                    <td className="p-2">{item.sub_category}</td> <td className="p-2">{item.type || '-'}</td>
                                    <td className='p-2 text-center'> <span className={`font-medium px-1.5 py-0.5 rounded-full text-[10px] ${item.status === 'actual' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}> {item.status || 'N/A'} </span> </td>
                                    <td className='p-2 text-right'>{item.quantity}</td> <td className='p-2 text-right'>{formatCurrency(item.cost)}</td>
                                    <td className='p-2 text-right font-medium'>{formatCurrency(item.amount)}</td> </tr>))}
                                </tbody> <tfoot className='sticky bottom-0'>
                                    <tr className='font-bold bg-gray-100'>
                                        <td colSpan={6} className='p-2 text-right'>Total:</td>
                                        <td className='p-2 text-right'>{formatCurrency(selectedProposal.estimatedBudget)}</td>
                                    </tr> </tfoot>
                            </table>
                            </div>
                            </div>
                        )}
                        {(selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0) && (
                            <div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><Award size={16} /> Sponsorship Details</h4> <div className="overflow-x-auto max-h-60 border rounded-md"> <table className="table table-sm w-full text-xs"> <thead className="sticky top-0 bg-gray-100 z-10"> <tr> <th className='p-2'>Sponsor/Category</th> <th className='p-2'>Mode</th> <th className='p-2 text-right'>Amount</th> <th className='p-2'>Reward</th> <th className='p-2'>Benefit</th> <th className='p-2'>About</th> </tr> </thead> <tbody> {selectedProposal.sponsorshipDetailsRows.map((sponsor, index) => (<tr key={sponsor.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200"> <td className='p-2'>{sponsor.category}</td> <td className='p-2'>{sponsor.mode}</td> <td className='p-2 text-right'>{formatCurrency(sponsor.amount)}</td> <td className='p-2'>{sponsor.reward}</td> <td className='p-2'>{sponsor.benefit}</td> <td className="p-2 max-w-[150px] truncate" title={sponsor.about}>{sponsor.about}</td> </tr>))} </tbody> </table> </div> </div>
                        )}
                    </section>

                    {/* --- Communication Log --- */}

                    {(selectedProposal.messages && selectedProposal.messages.length > 0) && (
                        <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                                <MessageSquare size={18} /> Communication Log
                            </h3>
                            <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar"> {/* Added custom-scrollbar class if needed */}
                                {selectedProposal.messages
                                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                                    .map((msg) => (
                                        <div key={msg.id} className="p-3 border-l-4 border-blue-300 rounded-r-md bg-white shadow-sm"> {/* Left border highlight */}
                                            {/* Message content */}
                                            <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p>
                                            {/* Sender and Timestamp Row */}
                                            <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-1.5"> {/* Separator line */}
                                                <span>
                                                    By: <span className='font-medium text-gray-700'>{msg.user?.name || 'Unknown User'}</span>
                                                    <span className='italic ml-1'>({formatRole(msg.user?.role)})</span>
                                                </span>
                                                <span title={formatDateSafe(msg.created_at, 'PPpp')}> {/* Full date+time on hover */}
                                                    {formatDateSafe(msg.created_at, 'dd-MM-yy hh:mm a')} {/* Shorter format */}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer / Actions Area */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {errorMessage && (<div className="text-red-600 text-sm mb-3 p-2 bg-red-100 border border-red-300 rounded flex items-center gap-2"> <AlertCircle size={16} /> {errorMessage} </div>)}
                    {selectedProposal.awaiting?.toLowerCase() === 'hod' && !['completed', 'rejected'].includes(selectedProposal.status) && (
                        <div className="flex justify-end">
                            <button onClick={() => router.push(`/proposal/edit?proposalId=${selectedProposal.id}`)} className="btn btn-info btn-sm text-white flex items-center gap-1" disabled={isLoading}> <Edit size={14} /> Edit Proposal </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Popup;