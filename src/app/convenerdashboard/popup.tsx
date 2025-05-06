// src/components/dashboard/convener/popup.tsx (or your specific path)
"use client";

import React, { useState, useId, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { format, isValid, differenceInCalendarDays, isPast, startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign,
    Info, CalendarDays, AlertCircle, MessageSquare, Edit, UploadCloud,
    PlusCircle, Trash2, CheckCircle
} from 'lucide-react';

// --- Interfaces ---
interface BudgetItem {
    id: number;
    proposal_id: number;
    category: string;
    sub_category: string;
    type: 'Domestic' | 'International' | null;
    quantity: number;
    cost: number;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
}
interface ActualBillItemEdit {
    localId: string;
    originalId: number; // ID from the database BudgetItem.id (0 for new items)
    category: string;
    sub_category: string;
    type: 'Domestic' | 'International' | null;
    quantity: string;
    cost: string;
    amount: string;
    notes?: string;
}
interface SponsorItem {
    id: number; proposal_id: number; category: string; amount: number; reward: string;
    mode: string; about: string; benefit: string; created_at: string; updated_at: string;
}
interface MessageUser {
    id: number; name: string; email: string; role: string; designation?: string;
}
interface Message {
    id: number; proposal_id: number; user_id: number; message: string;
    created_at: string; updated_at: string; user: MessageUser;
}
interface Proposal {
    id: string; title: string; description: string; category: string; status: string;
    eventStartDate: string; eventEndDate: string; submissionTimestamp: string; date: string;
    organizer: string; convenerName: string; convenerEmail?: string; convenerDesignation?: string;
    participantExpected?: number | null; participantCategories?: string[] | null;
    chiefGuestName?: string; chiefGuestDesignation?: string; chiefGuestAddress?: string;
    chiefGuestPhone?: string; chiefGuestPan?: string; chiefGuestReason?: string;
    hotelName?: string; hotelAddress?: string; hotelDuration?: number; hotelType?: 'srm' | 'others' | null;
    travelName?: string; travelAddress?: string; travelDuration?: number; travelType?: 'srm' | 'others' | null;
    estimatedBudget?: number;
    fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; };
    detailedBudget: BudgetItem[];
    sponsorshipDetailsRows: SponsorItem[];
    pastEvents?: string | null; relevantDetails?: string | null; awaiting?: string | null; messages: Message[];
}
interface PopupProps {
    selectedProposal: Proposal;
    closePopup: () => void;
    onProposalUpdated?: () => void;
    token: string | null;
    apiBaseUrl: string;
}

// --- Constants for Dropdowns ---
const BUDGET_CATEGORIES = [
    "Budgetary Expenditures", "Publicity", "General", "Honorarium",
    "Hospitality", "Inaugural and Valedictory", "Resource Materials",
    "Conference Paper Publication", "Miscellaneous"
];
const SUB_CATEGORIES: Record<string, string[]> = {
    "Budgetary Expenditures": ["Number of Sessions Planned", "Number of Keynote Speakers", "Number of Session Judges", "Number of Celebrities / Chief Guests"],
    "Publicity": ["Invitation", "Press Coverage", "Brochures/Flyers", "Website/Social Media"],
    "General": ["Conference Kits", "Printing and Stationery", "Secretarial Expenses", "Mementos", "Certificates"],
    "Honorarium": ["Keynote Speakers", "Session Judges", "Chief Guests", "Invited Speakers"],
    "Hospitality": ["Train / Flight for Chief Guest / Keynote Speakers", "Accommodation for Chief Guest / Keynote Speakers", "Food and Beverages for Chief Guest / Keynote Speakers", "Local Travel Expenses", "Food for Participants", "Food & Snacks for Volunteers / Organizers", "Hostel Accommodation"],
    "Inaugural and Valedictory": ["Banners, Pandal etc", "Lighting and Decoration", "Flower Bouquet", "Cultural Events", "Field Visits / Sightseeing"],
    "Resource Materials": ["Preparation, Printing, Binding", "Software/Licenses"],
    "Conference Paper Publication": ["Extended Abstract", "Full Paper", "Journal Publication Fees", "Proceedings"],
    "Miscellaneous": ["Contingency", "Bank Charges", "Other Unforeseen"]
};
const SUB_CATEGORY_DISPLAY_NAMES: Record<string, string> = {
    "Number of Sessions Planned": "Sessions Planned", "Number of Keynote Speakers": "Keynote Speakers", "Number of Session Judges": "Session Judges", "Number of Celebrities / Chief Guests": "Celebrities/Guests",
    "Train / Flight for Chief Guest / Keynote Speakers": "Travel (Guests)", "Accommodation for Chief Guest / Keynote Speakers": "Accommodation (Guests)", "Food and Beverages for Chief Guest / Keynote Speakers": "Food (Guests)",
    "Food for Participants": "Food (Participants)", "Food & Snacks for Volunteers / Organizers": "Food/Snacks (Team)", "Banners, Pandal etc": "Banners/Pandal", "Printing and Stationery": "Printing/Stationery",
    "Preparation, Printing, Binding": "Preparation/Printing" /* Add others if needed */
};

// --- Helper Component: DetailItem ---
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => {
    const isEmpty = !children && (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value)));
    if (isEmpty) { return null; }
    return (<div className={className}><p className="text-sm font-semibold text-gray-700">{label}:</p>{children ? <div className="text-sm text-gray-600 mt-0.5">{children}</div> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>}</div>);
};

// --- Helper Function: Format Currency ---
const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- Main Popup Component ---
const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup, onProposalUpdated, token, apiBaseUrl }) => {
    const router = useRouter();
    const actualBillBaseId = useId();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isEnteringBill, setIsEnteringBill] = useState(false);
    const [actualBillItems, setActualBillItems] = useState<ActualBillItemEdit[]>([]);
    const [isSubmittingActualBill, setIsSubmittingActualBill] = useState(false);
    const [actualBillError, setActualBillError] = useState<string | null>(null);
    const [billFormErrors, setBillFormErrors] = useState<Record<string, string | undefined>>({});

    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try { const dateObj = new Date(dateString); if (isValid(dateObj)) return format(dateObj, formatString); } catch (e) { /* ignore */ }
        return 'Invalid Date';
    };
    const calculateDuration = useCallback(() => {
        try { const start = new Date(selectedProposal.eventStartDate); const end = new Date(selectedProposal.eventEndDate); if (isValid(start) && isValid(end) && end >= start) { const days = differenceInCalendarDays(end, start) + 1; return `${days} day${days !== 1 ? 's' : ''}`; } } catch (e) { /* ignore */ } return 'N/A';
    }, [selectedProposal.eventStartDate, selectedProposal.eventEndDate]);
    const eventDuration = calculateDuration();
    const formatRole = (role: string | null | undefined): string => { if (!role) return 'N/A'; return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); };
    const generateLocalId = useCallback(() => `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, []);

    const canEnterBill = useCallback((): boolean => {
        if (selectedProposal.status !== 'approved') return false;
        try { const eventEndDate = new Date(selectedProposal.eventEndDate); return isValid(eventEndDate) && isPast(startOfDay(eventEndDate)); } catch (e) { return false; }
    }, [selectedProposal.status, selectedProposal.eventEndDate]);
    const showBillEntryButton = canEnterBill();

    const startBillEntry = () => {
        const initialBillItems = selectedProposal.detailedBudget.map(item => ({
            localId: generateLocalId(), originalId: item.id, category: item.category, sub_category: item.sub_category,
            type: item.type, quantity: String(item.quantity), cost: String(item.cost), amount: String(item.amount), notes: '',
        }));
        if (initialBillItems.length === 0) {
            setActualBillItems([{ localId: generateLocalId(), originalId: 0, category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '0', notes: '' }]);
        } else { setActualBillItems(initialBillItems); }
        setIsEnteringBill(true); setActualBillError(null); setBillFormErrors({}); setErrorMessage(null);
    };
    const cancelBillEntry = () => { setIsEnteringBill(false); setActualBillItems([]); setActualBillError(null); setBillFormErrors({}); };

    const addActualBillRow = () => { setActualBillItems(prev => [...prev, { localId: generateLocalId(), originalId: 0, category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '0', notes: '' }]); };
    const deleteActualBillRow = (idToDelete: string) => {
        setActualBillItems(prev => prev.filter(row => row.localId !== idToDelete));
        setBillFormErrors(prevErrors => { const newErrors = { ...prevErrors }; const keysToDelete = [`bill_category_${idToDelete}`, `bill_sub_category_${idToDelete}`, `bill_type_${idToDelete}`, `bill_quantity_${idToDelete}`, `bill_cost_${idToDelete}`, `bill_notes_${idToDelete}`]; keysToDelete.forEach(key => delete newErrors[key]); return newErrors; });
    };
    const handleActualBillChange = (idToUpdate: string, field: keyof ActualBillItemEdit, value: string | 'Domestic' | 'International' | null) => {
        setActualBillItems(prevRows => prevRows.map(row => {
            if (row.localId === idToUpdate) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'quantity' || field === 'cost') { const quantity = parseFloat(updatedRow.quantity) || 0; const cost = parseFloat(updatedRow.cost) || 0; updatedRow.amount = (quantity * cost).toFixed(2); }
                if (field === 'type') { updatedRow.type = (value === 'Domestic' || value === 'International') ? value : null; }
                if (field === 'category') { updatedRow.sub_category = ''; }
                const errorKey = `bill_${field}_${idToUpdate}`; if (billFormErrors[errorKey]) { setBillFormErrors(prevErrors => ({ ...prevErrors, [errorKey]: undefined })); }
                return updatedRow;
            } return row;
        }));
    };
    const totalActualBillAmount = actualBillItems.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    const validateActualBillForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (actualBillItems.length === 0) { errors.global = "Please add at least one actual expense item."; }
        else { actualBillItems.forEach((row) => { const id = row.localId; if (!row.category) errors[`bill_category_${id}`] = "Category required."; if (!row.sub_category) errors[`bill_sub_category_${id}`] = "Subcategory required."; if (!row.quantity || parseFloat(row.quantity) <= 0) errors[`bill_quantity_${id}`] = "Valid Qty (>0) required."; if (!row.cost || parseFloat(row.cost) < 0) errors[`bill_cost_${id}`] = "Valid Cost (>=0) required."; }); }
        setBillFormErrors(errors); return Object.keys(errors).length === 0;
    };

    const handleActualBillSubmit = async () => {
        setActualBillError(null);
        if (!validateActualBillForm()) { setActualBillError("Please fix the errors indicated in the form."); /* Optional: Scroll to first error */ return; }
        if (!token) { setActualBillError("Authentication error: Not logged in."); return; }
        if (!selectedProposal?.id) { setActualBillError("Error: Proposal ID is missing."); return; }

        setIsSubmittingActualBill(true);
        const billSubmissionEndpoint = `${apiBaseUrl}/api/faculty/proposals/${selectedProposal.id}`;

        const itemsPayload = actualBillItems
            .filter(item => item.category && item.sub_category && item.quantity && item.cost)
            .map(item => ({
                id: item.originalId, // Send original ID (0 for new items if backend handles insertion)
                category: item.category, sub_category: item.sub_category, type: item.type,
                quantity: Number(item.quantity) || 0, cost: Number(item.cost) || 0, amount: Number(item.amount) || 0,
                status: 'actual', // ASSUMPTION: Mark as actual. Verify with backend!
                // description: item.notes || null, // Optional: Send notes if backend supports it
            }));

        if (itemsPayload.length === 0 && actualBillItems.length > 0) { setActualBillError("No valid bill items to submit. Please ensure all required fields are filled."); setIsSubmittingActualBill(false); return; }
        if (itemsPayload.length === 0 && actualBillItems.length === 0) { setActualBillError("Cannot submit an empty bill. Please add expense items."); setIsSubmittingActualBill(false); return; }

        const requestBody = { items: itemsPayload /*, status: 'completed' // Optional: Update proposal status? Verify! */ };
        console.log("Submitting Actual Bill - Endpoint:", billSubmissionEndpoint);
        console.log("Submitting Actual Bill - Request Body:", JSON.stringify(requestBody, null, 2));

        try {
            const response = await axios.put(billSubmissionEndpoint, requestBody, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' } });
            console.log("Actual Bill Submission Response:", response.data);
            alert('Actual Bill submitted successfully!');
            setIsEnteringBill(false); if (onProposalUpdated) { onProposalUpdated(); }
        } catch (err: any) {
            console.error("Error submitting actual bill:", err);
            let errorMsg = "Failed to submit actual bill. Please try again.";
            if (axios.isAxiosError(err)) {
                const axiosError = err as AxiosError<any>;
                if (axiosError.response) {
                    const status = axiosError.response.status; const data = axiosError.response.data;
                    console.error("Error Status:", status); console.error("Error Data:", data);
                    if (status === 401) errorMsg = "Authentication error. Please log in again.";
                    else if (status === 404) errorMsg = "Proposal not found on the server.";
                    else if (status === 409) errorMsg = `Conflict Error (409): The proposal state may have changed, or the update conflicts with existing data. Please refresh and try again. Details: ${data?.message || 'No specific message.'}`;
                    else if (status === 422 && data?.errors) { const validationErrors = Object.entries(data.errors).map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`).join('; '); errorMsg = `Submission failed due to validation errors: ${validationErrors || 'Please check the form.'}`; }
                    else if (data?.message) errorMsg = `Submission failed: ${data.message}`;
                    else errorMsg = `An unexpected server error occurred (${status}).`;
                } else if (axiosError.request) errorMsg = "Network error: No response from server.";
            } else errorMsg = `Unexpected error: ${err.message}`;
            setActualBillError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingActualBill(false); }
    };

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm  bg-opacity-60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} aria-labelledby="proposal-popup-title" role="dialog" aria-modal="true">
            <motion.div className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] flex flex-col" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 id="proposal-popup-title" className="text-xl font-bold text-blue-900 truncate pr-4">{isEnteringBill ? `Enter Actual Bill: ${selectedProposal.title}` : (selectedProposal.title || 'Proposal Details')}</h2>
                    <button onClick={isEnteringBill ? cancelBillEntry : closePopup} className="text-gray-500 hover:text-red-600 transition-colors flex-shrink-0" aria-label={isEnteringBill ? "Cancel Bill Entry and Close" : "Close Pop-up"}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                    {!isEnteringBill ? (
                        <>
                            {/* Event Information Section */}
                            <section aria-labelledby="event-info-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 id="event-info-heading" className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><Info size={18} /> Event Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                    <DetailItem label="Proposal ID" value={selectedProposal.id} />
                                    <DetailItem label="Category" value={selectedProposal.category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'} />
                                    <DetailItem label="Status" >
                                        <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedProposal.status === 'approved' ? 'bg-green-100 text-green-700' : selectedProposal.status === 'completed' ? 'bg-purple-100 text-purple-700' : selectedProposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selectedProposal.status === 'rejected' ? 'bg-red-100 text-red-700' : selectedProposal.status === 'review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {formatRole(selectedProposal.status)}
                                        </span>
                                    </DetailItem>
                                    <DetailItem label="Awaiting Approval From" value={formatRole(selectedProposal.awaiting) || (['pending', 'review', 'approved'].includes(selectedProposal.status) ? 'N/A' : '-')} />
                                    <DetailItem label="Event Start Date" value={formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} />
                                    <DetailItem label="Event End Date" value={formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} />
                                    <DetailItem label="Duration" value={eventDuration} />
                                    <DetailItem label="Submitted On" value={formatDateSafe(selectedProposal.submissionTimestamp)} />
                                    <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Description" value={selectedProposal.description || 'N/A'} /> </div>
                                    <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Past Relevant Events" value={selectedProposal.pastEvents || 'N/A'} /> </div>
                                    <div className="sm:col-span-2 md:col-span-3"> <DetailItem label="Other Relevant Details" value={selectedProposal.relevantDetails || 'N/A'} /> </div>
                                </div>
                            </section>

                            {/* Organizer & Participants Section */}
                            <section aria-labelledby="organizer-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 id="organizer-heading" className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><Users size={18} /> Organizer & Participants</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                    <DetailItem label="Organizing Dept." value={selectedProposal.organizer} />
                                    <DetailItem label="Convener Name" value={selectedProposal.convenerName} />
                                    <DetailItem label="Convener Email" value={selectedProposal.convenerEmail} />
                                    <DetailItem label="Convener Designation" value={selectedProposal.convenerDesignation || 'N/A'} />
                                    <DetailItem label="Expected Participants" value={selectedProposal.participantExpected ?? 'N/A'} />
                                    <DetailItem label="Participant Categories" className="md:col-span-2">
                                        {selectedProposal.participantCategories && selectedProposal.participantCategories.length > 0 ? (<div className="flex flex-wrap gap-1 mt-1"> {selectedProposal.participantCategories.map((cat, index) => (<span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cat}</span>))} </div>) : <p className="text-sm text-gray-600">N/A</p>}
                                    </DetailItem>
                                </div>
                            </section>

                            {/* Chief Guest Section (Conditional) */}
                            {selectedProposal.chiefGuestName && (
                                <section aria-labelledby="chief-guest-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h3 id="chief-guest-heading" className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><UserCheck size={18} /> Chief Guest</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                                        <DetailItem label="Name" value={selectedProposal.chiefGuestName} /> <DetailItem label="Designation" value={selectedProposal.chiefGuestDesignation} /> <DetailItem label="Phone" value={selectedProposal.chiefGuestPhone} />
                                        <DetailItem label="PAN" value={selectedProposal.chiefGuestPan} /> <DetailItem label="Address" value={selectedProposal.chiefGuestAddress} className="md:col-span-2" /> <DetailItem label="Reason for Inviting" value={selectedProposal.chiefGuestReason || 'N/A'} className="md:col-span-3" />
                                    </div>
                                    {(selectedProposal.hotelName || selectedProposal.travelName) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2">Accommodation & Travel</h4> <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3"> <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><BedDouble size={16} /> Accommodation</p> <DetailItem label="Hotel" value={`${selectedProposal.hotelName || 'N/A'} (${selectedProposal.hotelType || 'N/A'})`} /> <DetailItem label="Hotel Address" value={selectedProposal.hotelAddress || 'N/A'} /> <DetailItem label="Stay Duration" value={selectedProposal.hotelDuration ? `${selectedProposal.hotelDuration} day(s)` : 'N/A'} /> </div> <div> <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><Car size={16} /> Travel</p> <DetailItem label="Mode" value={`${selectedProposal.travelName || 'N/A'} (${selectedProposal.travelType || 'N/A'})`} /> <DetailItem label="From/To" value={selectedProposal.travelAddress || 'N/A'} /> <DetailItem label="Travel Duration/Trips" value={selectedProposal.travelDuration ? `${selectedProposal.travelDuration} day(s)/trip(s)` : 'N/A'} /> </div> </div> </div>)}
                                </section>
                            )}

                            {/* Financial Overview Section (Estimates) */}
                            <section aria-labelledby="financial-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 id="financial-heading" className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Financial Overview (Estimates)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
                                    <DetailItem label="Est. Total Budget" value={formatCurrency(selectedProposal.estimatedBudget)} /> <DetailItem label="University Fund" value={formatCurrency(selectedProposal.fundingDetails?.universityFund)} /> <DetailItem label="Registration Fund" value={formatCurrency(selectedProposal.fundingDetails?.registrationFund)} /> <DetailItem label="Sponsorship Fund" value={formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)} /> <DetailItem label="Other Fund" value={formatCurrency(selectedProposal.fundingDetails?.otherSourcesFund)} />
                                </div>
                                {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) &&
                                 (<div className="mt-4 pt-3 border-t border-gray-200">
                                     <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><FileText size={16} /> Estimated Budget Items</h4>
                                    <div className="overflow-x-auto max-h-60 border rounded-md">
                                        {/* HYDRATION FIX: Ensure no whitespace between table elements */}
                                        <table className="table table-sm w-full text-xs">
                                            <thead className="sticky top-0 bg-gray-100 z-10"><tr>
                                                <th className="p-2">Category</th>
                                                <th className="p-2">Subcategory</th>
                                                <th className="p-2">Type</th>
                                                {selectedProposal.detailedBudget.some(it => it.status) && <th className='p-2 text-center'>Status</th>}
                                                <th className='p-2 text-right'>Qty</th>
                                                <th className='p-2 text-right'>Cost/Unit</th>
                                                <th className='p-2 text-right'>Total</th>
                                            </tr></thead>
                                            <tbody>
                                                {selectedProposal.detailedBudget.map((item, index) => (<tr key={item.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                                                    <td className="p-2">{item.category}</td>
                                                    <td className="p-2">{item.sub_category}</td>
                                                    <td className="p-2">{item.type || '-'}</td>
                                                    {selectedProposal.detailedBudget.some(it => it.status) &&
                                                        <td className='p-2 text-center'>
                                                            <span className={`font-medium px-1.5 py-0.5 rounded-full text-[10px] ${item.status === 'actual' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}> {item.status || 'N/A'} </span>
                                                        </td>
                                                    }
                                                    <td className='p-2 text-right'>{item.quantity}</td>
                                                    <td className='p-2 text-right'>{formatCurrency(item.cost)}</td>
                                                    <td className='p-2 text-right font-medium'>{formatCurrency(item.amount)}</td>
                                                </tr>))}
                                            </tbody>
                                            <tfoot className='sticky bottom-0'><tr className='font-bold bg-gray-100'>
                                                <td colSpan={selectedProposal.detailedBudget.some(it => it.status) ? 5 : 4} className='p-2 text-right'>Total Estimate:</td>
                                                <td className='p-2 text-right'>{formatCurrency(selectedProposal.estimatedBudget)}</td>
                                            </tr></tfoot>
                                        </table>
                                    </div>
                                </div>)}
                                {(selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><Award size={16} /> Sponsorship Details</h4>
                                    <div className="overflow-x-auto max-h-60 border rounded-md">
                                        {/* HYDRATION FIX: Ensure no whitespace between table elements */}
                                        <table className="table table-sm w-full text-xs">
                                            <thead className="sticky top-0 bg-gray-100 z-10"><tr>
                                                <th className='p-2'>Sponsor/Category</th>
                                                <th className='p-2'>Mode</th>
                                                <th className='p-2 text-right'>Amount</th>
                                                <th className='p-2'>Reward</th>
                                                <th className='p-2'>Benefit</th>
                                                <th className='p-2'>About</th>
                                            </tr></thead>
                                            <tbody>
                                                {selectedProposal.sponsorshipDetailsRows.map((sponsor, index) => (<tr key={sponsor.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                                                    <td className='p-2'>{sponsor.category}</td>
                                                    <td className='p-2'>{sponsor.mode}</td>
                                                    <td className='p-2 text-right'>{formatCurrency(sponsor.amount)}</td>
                                                    <td className='p-2'>{sponsor.reward}</td>
                                                    <td className='p-2'>{sponsor.benefit}</td>
                                                    <td className="p-2 max-w-[150px] truncate" title={sponsor.about}>{sponsor.about}</td>
                                                </tr>))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>)}
                            </section>

                            {/* Communication Log Section */}
                            {(selectedProposal.messages && selectedProposal.messages.length > 0) && (
                                <section aria-labelledby="comms-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h3 id="comms-heading" className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Communication Log</h3>
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedProposal.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg) => (<div key={msg.id} className="p-3 border-l-4 border-blue-300 rounded-r-md bg-white shadow-sm"> <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p> <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-1.5"> <span> By: <span className='font-medium text-gray-700'>{msg.user?.name || 'Unknown User'}</span> <span className='italic ml-1'>({formatRole(msg.user?.role)})</span> </span> <span title={formatDateSafe(msg.created_at, 'PPpp')}> {formatDateSafe(msg.created_at, 'dd-MM-yy hh:mm a')} </span> </div> </div>))}
                                    </div>
                                </section>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Actual Bill Entry Form Section */}
                            <section aria-labelledby="actual-bill-heading" className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                                <h3 id="actual-bill-heading" className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><FileText size={18} /> Enter Actual Expenses Incurred</h3>
                                {actualBillError && <div role="alert" className="alert alert-error alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span className="font-medium">Error:</span><span>{actualBillError}</span></div></div>}
                                {billFormErrors.global && <div role="alert" className="alert alert-warning alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{billFormErrors.global}</span></div></div>}

                                {/* Actual Bill Items Table */}
                                <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                                    {/* HYDRATION FIX: Ensure no whitespace between table elements */}
                                    <table className="table table-sm w-full table-auto">
                                        <thead className="bg-gray-100"><tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            <th className="p-2 w-8">#</th>
                                            <th className="p-2 min-w-[240px]">Category / Subcategory <span className="text-red-500">*</span></th>
                                            <th className="p-2 text-center min-w-[100px]">Type</th>
                                            <th className="p-2 text-center w-20">Qty <span className="text-red-500">*</span></th>
                                            <th className="p-2 text-center w-28">Cost/Unit (₹) <span className="text-red-500">*</span></th>
                                            <th className="p-2 text-right w-28">Total (₹)</th>
                                            <th className="p-2 min-w-[150px]">Notes/Ref</th>
                                            <th className="p-2 text-center w-16">Action</th>
                                        </tr></thead>
                                        <tbody>
                                            {actualBillItems.length === 0 && !billFormErrors.global
                                                ? (<tr><td colSpan={8} className="text-center text-gray-500 p-4">Click 'Add Actual Expense Item' below to start, or edit the estimated items loaded.</td></tr>)
                                                : (actualBillItems.map((row, index) => {
                                                    const uniqueDomIdSuffix = row.localId; const catError = billFormErrors[`bill_category_${uniqueDomIdSuffix}`]; const subCatError = billFormErrors[`bill_sub_category_${uniqueDomIdSuffix}`]; const qtyError = billFormErrors[`bill_quantity_${uniqueDomIdSuffix}`]; const costError = billFormErrors[`bill_cost_${uniqueDomIdSuffix}`]; const typeError = billFormErrors[`bill_type_${uniqueDomIdSuffix}`]; const notesError = billFormErrors[`bill_notes_${uniqueDomIdSuffix}`];
                                                    return (
                                                        // HYDRATION FIX: Ensure no whitespace directly inside tr/td
                                                        <tr key={row.localId} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 text-sm align-middle">
                                                            <td className="p-2 font-medium text-gray-500 text-center">{index + 1}</td>
                                                            <td className="p-2 space-y-1 align-top">
                                                                <div><label htmlFor={`${actualBillBaseId}-cat-${uniqueDomIdSuffix}`} className="sr-only">Actual Category {index + 1}</label><select id={`${actualBillBaseId}-cat-${uniqueDomIdSuffix}`} name={`bill_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-800 ${catError ? 'border-red-500' : 'border-gray-300'}`} value={row.category || ""} onChange={(e) => handleActualBillChange(row.localId, 'category', e.target.value)} aria-invalid={!!catError} aria-describedby={catError ? `${actualBillBaseId}-cat-err-${uniqueDomIdSuffix}` : undefined} required><option value="" disabled>Select Category</option>{BUDGET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>{catError && <p id={`${actualBillBaseId}-cat-err-${uniqueDomIdSuffix}`} className="mt-1 text-xs text-red-600">{catError}</p>}</div>
                                                                <div><label htmlFor={`${actualBillBaseId}-subcat-${uniqueDomIdSuffix}`} className="sr-only">Actual Subcategory {index + 1}</label><select id={`${actualBillBaseId}-subcat-${uniqueDomIdSuffix}`} name={`bill_sub_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-700 ${subCatError ? 'border-red-500' : 'border-gray-300'}`} value={row.sub_category || ""} onChange={(e) => handleActualBillChange(row.localId, 'sub_category', e.target.value)} required disabled={!row.category || !SUB_CATEGORIES[row.category]} aria-invalid={!!subCatError} aria-describedby={subCatError ? `${actualBillBaseId}-subcat-err-${uniqueDomIdSuffix}` : undefined}><option value="" disabled>Select Subcategory</option>{(SUB_CATEGORIES[row.category] || []).map(subCat => (<option key={subCat} value={subCat}>{SUB_CATEGORY_DISPLAY_NAMES[subCat] || subCat}</option>))}</select>{subCatError && <p id={`${actualBillBaseId}-subcat-err-${uniqueDomIdSuffix}`} className="mt-1 text-xs text-red-600">{subCatError}</p>}</div>
                                                            </td>
                                                            <td className="p-2 text-center"><div role="group" aria-labelledby={`${actualBillBaseId}-type-label-${uniqueDomIdSuffix}`} className={`flex flex-col justify-center items-center space-y-1 ${typeError ? 'p-1 rounded border border-red-400 bg-red-50' : ''}`}><span id={`${actualBillBaseId}-type-label-${uniqueDomIdSuffix}`} className="sr-only">Location Type</span><label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${actualBillBaseId}-type-${uniqueDomIdSuffix}`} value="Domestic" className="radio radio-xs checked:bg-blue-500 border-gray-400" checked={row.type === "Domestic"} onChange={(e) => handleActualBillChange(row.localId, 'type', e.target.value as 'Domestic')} /> Domestic</label><label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${actualBillBaseId}-type-${uniqueDomIdSuffix}`} value="International" className="radio radio-xs checked:bg-green-500 border-gray-400" checked={row.type === "International"} onChange={(e) => handleActualBillChange(row.localId, 'type', e.target.value as 'International')} /> Intl</label></div>{typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>}</td>
                                                            <td className="p-2 text-center"><label htmlFor={`${actualBillBaseId}-qty-${uniqueDomIdSuffix}`} className="sr-only">Actual Quantity {index + 1}</label><input type="number" id={`${actualBillBaseId}-qty-${uniqueDomIdSuffix}`} name={`bill_quantity_${row.localId}`} min="1" step="1" className={`input input-bordered input-xs w-full text-right bg-white text-gray-700 ${qtyError ? 'border-red-500' : 'border-gray-300'}`} value={row.quantity} onChange={(e) => handleActualBillChange(row.localId, 'quantity', e.target.value)} required aria-invalid={!!qtyError} aria-describedby={qtyError ? `${actualBillBaseId}-qty-err-${uniqueDomIdSuffix}` : undefined} />{qtyError && <p id={`${actualBillBaseId}-qty-err-${uniqueDomIdSuffix}`} className="mt-1 text-xs text-red-600">{qtyError}</p>}</td>
                                                            <td className="p-2 text-center"><label htmlFor={`${actualBillBaseId}-cost-${uniqueDomIdSuffix}`} className="sr-only">Actual Cost per Unit {index + 1}</label><input type="number" id={`${actualBillBaseId}-cost-${uniqueDomIdSuffix}`} name={`bill_cost_${row.localId}`} min="0" step="0.01" className={`input input-bordered input-xs w-full text-right bg-white text-gray-700 ${costError ? 'border-red-500' : 'border-gray-300'}`} value={row.cost} onChange={(e) => handleActualBillChange(row.localId, 'cost', e.target.value)} required aria-invalid={!!costError} aria-describedby={costError ? `${actualBillBaseId}-cost-err-${uniqueDomIdSuffix}` : undefined} />{costError && <p id={`${actualBillBaseId}-cost-err-${uniqueDomIdSuffix}`} className="mt-1 text-xs text-red-600">{costError}</p>}</td>
                                                            <td className="p-2 font-medium text-right text-gray-700">{formatCurrency(row.amount)}</td>
                                                            <td className="p-2"><label htmlFor={`${actualBillBaseId}-notes-${uniqueDomIdSuffix}`} className="sr-only">Notes {index + 1}</label><input type="text" id={`${actualBillBaseId}-notes-${uniqueDomIdSuffix}`} name={`bill_notes_${row.localId}`} placeholder="Invoice #, details..." className={`input input-bordered input-xs w-full bg-white text-gray-700 ${notesError ? 'border-red-500' : 'border-gray-300'}`} value={row.notes || ''} onChange={(e) => handleActualBillChange(row.localId, 'notes', e.target.value)} aria-invalid={!!notesError} aria-describedby={notesError ? `${actualBillBaseId}-notes-err-${uniqueDomIdSuffix}` : undefined} />{notesError && <p id={`${actualBillBaseId}-notes-err-${uniqueDomIdSuffix}`} className="mt-1 text-xs text-red-600">{notesError}</p>}</td>
                                                            <td className="p-2 text-center"><button type="button" onClick={() => deleteActualBillRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete expense row ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td>
                                                        </tr>
                                                    );
                                                }))}
                                        </tbody>
                                        {actualBillItems.length > 0 && (
                                            // HYDRATION FIX: Ensure no whitespace directly inside tfoot/tr/td
                                            <tfoot><tr className="bg-gray-200 font-semibold text-gray-700 text-sm">
                                                <td colSpan={5} className="text-right p-3">Total Actual Bill Amount:</td>
                                                <td className="text-right p-3">{formatCurrency(totalActualBillAmount)}</td>
                                                <td colSpan={2} className="p-3"></td>
                                            </tr></tfoot>
                                        )}
                                    </table>
                                </div>
                                <button type="button" onClick={addActualBillRow} className="btn btn-sm btn-outline btn-primary mt-4 rounded-full flex items-center gap-1 normal-case font-medium hover:bg-primary-focus"><PlusCircle size={16} /> Add New Expense Item</button>
                            </section>
                        </>
                    )}
                </div> {/* End Scrollable Content */}

                {/* Footer / Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {!isEnteringBill && errorMessage && (<div role="alert" className="alert alert-error alert-sm mb-3 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{errorMessage}</span></div></div>)}
                    <div className="flex justify-end items-center gap-3">
                        {!isEnteringBill ? (
                            <>
                                {selectedProposal.awaiting?.toLowerCase() === 'hod' && ['pending', 'review'].includes(selectedProposal.status) && (
                                    <button onClick={() => router.push(`/proposal/edit?proposalId=${selectedProposal.id}`)} className="btn btn-info btn-sm text-white flex items-center gap-1" disabled={isLoading}><Edit size={14} /> Edit Proposal</button>
                                )}
                                {showBillEntryButton && (
                                    <button onClick={startBillEntry} className="btn btn-warning btn-sm text-black flex items-center gap-1" disabled={isLoading}><UploadCloud size={16} /> Enter Actual Bill</button>
                                )}
                            </>
                        ) : (
                            <>
                                <button onClick={cancelBillEntry} className="btn btn-ghost btn-sm" disabled={isSubmittingActualBill}>Cancel</button>
                                <button onClick={handleActualBillSubmit} className="btn btn-success btn-sm text-white flex items-center gap-1" disabled={isSubmittingActualBill || !token || actualBillItems.length === 0}>
                                    {isSubmittingActualBill ? (<span className="loading loading-spinner loading-xs"></span>) : (<CheckCircle size={16} />)} Submit Actual Bill
                                </button>
                            </>
                        )}
                    </div>
                </div> {/* End Footer */}
            </motion.div>
        </motion.div>
    );
};

export default Popup;