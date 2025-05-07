"use client";

import React, { useState, useId, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { motion } from 'framer-motion';
import { format, isValid, differenceInCalendarDays, isPast, startOfDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
    X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign,
    Info, CalendarDays, AlertCircle, MessageSquare, Edit, UploadCloud,
    PlusCircle, Trash2, CheckCircle, Send, AlertTriangle, RefreshCw, Ban
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
    "Preparation, Printing, Binding": "Preparation/Printing"
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

    // Bill Entry States
    const [isEnteringBill, setIsEnteringBill] = useState(false);
    const [actualBillItems, setActualBillItems] = useState<ActualBillItemEdit[]>([]);
    const [isSubmittingActualBill, setIsSubmittingActualBill] = useState(false);
    const [actualBillError, setActualBillError] = useState<string | null>(null);
    const [billFormErrors, setBillFormErrors] = useState<Record<string, string | undefined>>({});

    // Cancel Proposal States
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [cancelApiError, setCancelApiError] = useState<string | null>(null);

    // Reschedule Proposal States
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [rescheduleReason, setRescheduleReason] = useState("");
    const [rescheduleFrom, setRescheduleFrom] = useState("");
    const [rescheduleTo, setRescheduleTo] = useState("");
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
    const [rescheduleApiError, setRescheduleApiError] = useState<string | null>(null);

    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try { const dateObj = new Date(dateString); if (isValid(dateObj)) return format(dateObj, formatString); } catch (e) { /* ignore */ }
        return 'Invalid Date';
    };
    const toDatetimeLocalInputString = (dateString: string | null | undefined): string => {
        if (!dateString) return "";
        try { const date = new Date(dateString); if (isValid(date)) return format(date, "yyyy-MM-dd'T'HH:mm"); } catch (e) {/* ignore */ }
        return "";
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
    const canModifyProposal = selectedProposal && ['pending', 'review', 'approved'].includes(selectedProposal.status) && selectedProposal.status !== 'completed';


    const resetForms = () => {
        setIsEnteringBill(false); setActualBillItems([]); setActualBillError(null); setBillFormErrors({});
        setShowCancelForm(false); setCancelReason(""); setCancelApiError(null);
        setShowRescheduleForm(false); setRescheduleReason(""); setRescheduleFrom(""); setRescheduleTo(""); setRescheduleApiError(null);
        setErrorMessage(null);
    };

    const startBillEntry = () => {
        resetForms();
        const initialBillItems = selectedProposal.detailedBudget.map(item => ({
            localId: generateLocalId(), originalId: item.id, category: item.category, sub_category: item.sub_category,
            type: item.type, quantity: String(item.quantity), cost: String(item.cost), amount: String(item.amount), notes: '',
        }));
        if (initialBillItems.length === 0) {
            setActualBillItems([{ localId: generateLocalId(), originalId: 0, category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '0', notes: '' }]);
        } else { setActualBillItems(initialBillItems); }
        setIsEnteringBill(true);
    };

    const openCancelForm = () => {
        resetForms();
        setShowCancelForm(true);
    };

    const openRescheduleForm = () => {
        resetForms();
        setRescheduleFrom(toDatetimeLocalInputString(selectedProposal.eventStartDate));
        setRescheduleTo(toDatetimeLocalInputString(selectedProposal.eventEndDate));
        setShowRescheduleForm(true);
    };

    const handlePopupCloseAction = () => {
        if (isEnteringBill || showCancelForm || showRescheduleForm) {
            resetForms(); // Go back to detail view
        } else {
            closePopup(); // Close the main popup
        }
    };


    // --- Actual Bill Logic (mostly from original, slightly condensed for focus) ---
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
                if (field === 'category') { updatedRow.sub_category = ''; } // Reset subcategory when category changes
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
        if (!validateActualBillForm()) { setActualBillError("Please fix the errors indicated in the form."); return; }
        if (!token) { setActualBillError("Authentication error: Not logged in."); return; }

        setIsSubmittingActualBill(true);
        const itemsPayload = actualBillItems.filter(item => item.category && item.sub_category && item.quantity && item.cost)
            .map(item => ({
                id: item.originalId, category: item.category, sub_category: item.sub_category, type: item.type,
                quantity: Number(item.quantity) || 0, cost: Number(item.cost) || 0, amount: Number(item.amount) || 0, status: 'actual',
            }));

        if (itemsPayload.length === 0 && actualBillItems.length > 0) { setActualBillError("No valid bill items to submit. Ensure required fields are filled."); setIsSubmittingActualBill(false); return; }
        if (itemsPayload.length === 0 && actualBillItems.length === 0) { setActualBillError("Cannot submit an empty bill."); setIsSubmittingActualBill(false); return; }
        
        const requestBody = { items: itemsPayload };
        try {
            await axios.put(`${apiBaseUrl}/api/faculty/proposals/${selectedProposal.id}`, requestBody, { headers: { Authorization: `Bearer ${token}` } });
            alert('Actual Bill submitted successfully!');
            resetForms(); if (onProposalUpdated) onProposalUpdated();
        } catch (err) {
            console.error("Error submitting actual bill:", err);
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Submission failed: ${err.response.data.message}` : "Failed to submit actual bill. Please try again.";
            setActualBillError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingActualBill(false); }
    };

    // --- Cancel Proposal Logic ---
    const handleCancelProposalSubmit = async () => {
        if (!cancelReason.trim()) { setCancelApiError("Reason for cancellation is required."); return; }
        if (!token) { setCancelApiError("Authentication error: Not logged in."); return; }
        setIsSubmittingCancel(true); setCancelApiError(null);
        try {
            await axios.put(`${apiBaseUrl}/api/faculty/proposals/${selectedProposal.id}/cancel`,
                { message: cancelReason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Proposal cancelled successfully!');
            resetForms();
            if (onProposalUpdated) onProposalUpdated();
            closePopup(); // Close the main popup as the proposal state has drastically changed
        } catch (err) {
            console.error("Error cancelling proposal:", err);
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Cancellation failed: ${err.response.data.message}` : "Failed to cancel proposal. Please try again.";
            setCancelApiError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingCancel(false); }
    };

    // --- Reschedule Proposal Logic ---
    const handleRescheduleProposalSubmit = async () => {
        setRescheduleApiError(null);
        if (!rescheduleReason.trim()) { setRescheduleApiError("Reason for rescheduling is required."); return; }
        if (!rescheduleFrom || !rescheduleTo) { setRescheduleApiError("Both new start and end dates are required."); return; }

        let fromDate, toDate;
        try {
            fromDate = parseISO(rescheduleFrom);
            toDate = parseISO(rescheduleTo);
            if (!isValid(fromDate) || !isValid(toDate)) throw new Error("Invalid date format.");
            if (toDate < fromDate) { setRescheduleApiError("New end date must be after or same as new start date."); return; }
            // Allow rescheduling to today, but not past days.
            if (isPast(fromDate) && differenceInCalendarDays(startOfDay(fromDate), startOfDay(new Date())) < 0) {
                 setRescheduleApiError("New start date cannot be in the past."); return;
            }
        } catch (e) {
            setRescheduleApiError("Invalid date format provided. Please check your input."); return;
        }

        if (!token) { setRescheduleApiError("Authentication error: Not logged in."); return; }
        setIsSubmittingReschedule(true);

        const payload = {
            message: rescheduleReason,
            from: format(fromDate, 'yyyy-MM-dd HH:mm:ss'), // Format for backend
            to: format(toDate, 'yyyy-MM-dd HH:mm:ss'),     // Format for backend
        };
        try {
            await axios.put(`${apiBaseUrl}/api/faculty/proposals/${selectedProposal.id}/reschedule`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Proposal reschedule request submitted successfully!');
            resetForms();
            if (onProposalUpdated) onProposalUpdated();
            closePopup(); // Close the main popup
        } catch (err) {
            console.error("Error rescheduling proposal:", err);
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Reschedule failed: ${err.response.data.message}` : "Failed to reschedule proposal. Please try again.";
            setRescheduleApiError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingReschedule(false); }
    };

    let headerTitle = selectedProposal.title || 'Proposal Details';
    let closeButtonLabel = "Close Pop-up";
    if (isEnteringBill) {
        headerTitle = `Enter Actual Bill: ${selectedProposal.title}`;
        closeButtonLabel = "Cancel Bill Entry";
    } else if (showCancelForm) {
        headerTitle = `Cancel Proposal: ${selectedProposal.title}`;
        closeButtonLabel = "Back to Details";
    } else if (showRescheduleForm) {
        headerTitle = `Reschedule Proposal: ${selectedProposal.title}`;
        closeButtonLabel = "Back to Details";
    }


    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-transparent bg-opacity-60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} aria-labelledby="proposal-popup-title" role="dialog" aria-modal="true">
            <motion.div className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] flex flex-col" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 id="proposal-popup-title" className="text-xl font-bold text-blue-900 truncate pr-4">{headerTitle}</h2>
                    <button onClick={handlePopupCloseAction} className="text-gray-500 hover:text-red-600 transition-colors flex-shrink-0" aria-label={closeButtonLabel}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Scrollable Content Area - Restored original structure */}
                <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                    {isEnteringBill ? (
                        // Actual Bill Entry Form Section (using original structure)
                        <section aria-labelledby="actual-bill-heading" className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
                            <h3 id="actual-bill-heading" className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><FileText size={18} /> Enter Actual Expenses Incurred</h3>
                            {actualBillError && <div role="alert" className="alert alert-error alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span className="font-medium">Error:</span><span>{actualBillError}</span></div></div>}
                            {billFormErrors.global && <div role="alert" className="alert alert-warning alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{billFormErrors.global}</span></div></div>}
                            <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white shadow-sm">
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
                    ) : showCancelForm ? (
                        // Cancel Proposal Form
                        <section aria-labelledby="cancel-proposal-heading" className="border border-red-200 rounded-lg p-4 bg-red-50/50">
                            <h3 id="cancel-proposal-heading" className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2"><Ban size={18} /> Cancel Proposal</h3>
                            {cancelApiError && <div role="alert" className="alert alert-error alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{cancelApiError}</span></div></div>}
                            <div className="form-control w-full">
                                <label htmlFor="cancelReason" className="label"><span className="label-text text-gray-700 font-medium">Reason for Cancellation <span className="text-red-500">*</span></span></label>
                                <textarea id="cancelReason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                    className="textarea textarea-bordered h-24 bg-white w-full text-sm" placeholder="Please provide a clear reason for cancelling this proposal..." required></textarea>
                                <p className="text-xs text-gray-500 mt-1">This action is irreversible and will notify relevant parties.</p>
                            </div>
                        </section>
                    ) : showRescheduleForm ? (
                        // Reschedule Proposal Form
                        <section aria-labelledby="reschedule-proposal-heading" className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">
                            <h3 id="reschedule-proposal-heading" className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2"><CalendarDays size={18} /> Reschedule Proposal</h3>
                            {rescheduleApiError && <div role="alert" className="alert alert-error alert-sm mb-4 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{rescheduleApiError}</span></div></div>}
                            <div className="space-y-4">
                                <div className="form-control w-full">
                                    <label htmlFor="rescheduleReason" className="label"><span className="label-text text-gray-700 font-medium">Reason for Rescheduling <span className="text-red-500">*</span></span></label>
                                    <textarea id="rescheduleReason" value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)}
                                        className="textarea textarea-bordered h-24 bg-white w-full text-sm" placeholder="e.g., Unexpected government holiday, speaker unavailability" required></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control w-full">
                                        <label htmlFor="rescheduleFrom" className="label"><span className="label-text text-gray-700 font-medium">New Event Start Date & Time <span className="text-red-500">*</span></span></label>
                                        <input type="datetime-local" id="rescheduleFrom" value={rescheduleFrom} onChange={(e) => setRescheduleFrom(e.target.value)}
                                            className="input input-bordered bg-white w-full input-sm text-sm" required />
                                    </div>
                                    <div className="form-control w-full">
                                        <label htmlFor="rescheduleTo" className="label"><span className="label-text text-gray-700 font-medium">New Event End Date & Time <span className="text-red-500">*</span></span></label>
                                        <input type="datetime-local" id="rescheduleTo" value={rescheduleTo} onChange={(e) => setRescheduleTo(e.target.value)}
                                            className="input input-bordered bg-white w-full input-sm text-sm" required />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Ensure the new dates are valid and do not conflict with other events if possible.</p>
                            </div>
                        </section>
                    ) : (
                        // Default: Proposal Details (original structure)
                        <>
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
                            <section aria-labelledby="financial-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <h3 id="financial-heading" className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Financial Overview (Estimates)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
                                    <DetailItem label="Est. Total Budget" value={formatCurrency(selectedProposal.estimatedBudget)} /> <DetailItem label="University Fund" value={formatCurrency(selectedProposal.fundingDetails?.universityFund)} /> <DetailItem label="Registration Fund" value={formatCurrency(selectedProposal.fundingDetails?.registrationFund)} /> <DetailItem label="Sponsorship Fund" value={formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)} /> <DetailItem label="Other Fund" value={formatCurrency(selectedProposal.fundingDetails?.otherSourcesFund)} />
                                </div>
                                {(selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0) &&
                                 (<div className="mt-4 pt-3 border-t border-gray-200">
                                     <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><FileText size={16} /> Estimated Budget Items</h4>
                                    <div className="overflow-x-auto max-h-60 border rounded-md">
                                        <table className="table table-sm w-full text-xs">
                                            <thead className="sticky top-0 bg-gray-100 z-10"><tr>
                                                <th className="p-2">Category</th><th className="p-2">Subcategory</th><th className="p-2">Type</th>
                                                {selectedProposal.detailedBudget.some(it => it.status) && <th className='p-2 text-center'>Status</th>}
                                                <th className='p-2 text-right'>Qty</th><th className='p-2 text-right'>Cost/Unit</th><th className='p-2 text-right'>Total</th>
                                            </tr></thead>
                                            <tbody>
                                                {selectedProposal.detailedBudget.map((item, index) => (<tr key={item.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                                                    <td className="p-2">{item.category}</td><td className="p-2">{item.sub_category}</td><td className="p-2">{item.type || '-'}</td>
                                                    {selectedProposal.detailedBudget.some(it => it.status) && <td className='p-2 text-center'><span className={`font-medium px-1.5 py-0.5 rounded-full text-[10px] ${item.status === 'actual' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}> {item.status || 'N/A'} </span></td>}
                                                    <td className='p-2 text-right'>{item.quantity}</td><td className='p-2 text-right'>{formatCurrency(item.cost)}</td><td className='p-2 text-right font-medium'>{formatCurrency(item.amount)}</td>
                                                </tr>))}
                                            </tbody>
                                            <tfoot className='sticky bottom-0'><tr className='font-bold bg-gray-100'><td colSpan={selectedProposal.detailedBudget.some(it => it.status) ? 5 : 4} className='p-2 text-right'>Total Estimate:</td><td className='p-2 text-right'>{formatCurrency(selectedProposal.estimatedBudget)}</td></tr></tfoot>
                                        </table>
                                    </div>
                                </div>)}
                                {(selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0) && (<div className="mt-4 pt-3 border-t border-gray-200"> <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><Award size={16} /> Sponsorship Details</h4>
                                    <div className="overflow-x-auto max-h-60 border rounded-md">
                                        <table className="table table-sm w-full text-xs">
                                            <thead className="sticky top-0 bg-gray-100 z-10"><tr><th className='p-2'>Sponsor/Category</th><th className='p-2'>Mode</th><th className='p-2 text-right'>Amount</th><th className='p-2'>Reward</th><th className='p-2'>Benefit</th><th className='p-2'>About</th></tr></thead>
                                            <tbody>{selectedProposal.sponsorshipDetailsRows.map((sponsor, index) => (<tr key={sponsor.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200"><td className='p-2'>{sponsor.category}</td><td className='p-2'>{sponsor.mode}</td><td className='p-2 text-right'>{formatCurrency(sponsor.amount)}</td><td className='p-2'>{sponsor.reward}</td><td className='p-2'>{sponsor.benefit}</td><td className="p-2 max-w-[150px] truncate" title={sponsor.about}>{sponsor.about}</td></tr>))}</tbody>
                                        </table>
                                    </div>
                                </div>)}
                            </section>
                            {(selectedProposal.messages && selectedProposal.messages.length > 0) && (
                                <section aria-labelledby="comms-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <h3 id="comms-heading" className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Communication Log</h3>
                                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedProposal.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg) => (<div key={msg.id} className="p-3 border-l-4 border-blue-300 rounded-r-md bg-white shadow-sm"> <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p> <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-1.5"> <span> By: <span className='font-medium text-gray-700'>{msg.user?.name || 'Unknown User'}</span> <span className='italic ml-1'>({formatRole(msg.user?.role)})</span> </span> <span title={formatDateSafe(msg.created_at, 'PPpp')}> {formatDateSafe(msg.created_at, 'dd-MM-yy hh:mm a')} </span> </div> </div>))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div> {/* End Scrollable Content */}

                {/* Footer / Actions - Restored original structure */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {!isEnteringBill && !showCancelForm && !showRescheduleForm && errorMessage && (
                        <div role="alert" className="alert alert-error alert-sm mb-3 shadow-md"><div className="flex items-center gap-2"><AlertCircle size={18} /><span>{errorMessage}</span></div></div>
                    )}
                    <div className="flex flex-wrap justify-end items-center gap-3">
                        {isEnteringBill ? (
                            <>
                                <button onClick={handlePopupCloseAction} className="btn btn-ghost btn-sm" disabled={isSubmittingActualBill}>Cancel</button>
                                <button onClick={handleActualBillSubmit} className="btn btn-success btn-sm text-white flex items-center gap-1" disabled={isSubmittingActualBill || !token || actualBillItems.length === 0}>
                                    {isSubmittingActualBill ? (<span className="loading loading-spinner loading-xs"></span>) : (<CheckCircle size={16} />)} Submit Actual Bill
                                </button>
                            </>
                        ) : showCancelForm ? (
                            <>
                                <button onClick={handlePopupCloseAction} className="btn btn-ghost btn-sm" disabled={isSubmittingCancel}>Back to Details</button>
                                <button onClick={handleCancelProposalSubmit} className="btn btn-error btn-sm text-white flex items-center gap-1" disabled={isSubmittingCancel || !token}>
                                    {isSubmittingCancel ? <span className="loading loading-spinner loading-xs"></span> : <Ban size={16} />} Confirm Cancellation
                                </button>
                            </>
                        ) : showRescheduleForm ? (
                             <>
                                <button onClick={handlePopupCloseAction} className="btn btn-ghost btn-sm" disabled={isSubmittingReschedule}>Back to Details</button>
                                <button onClick={handleRescheduleProposalSubmit} className="btn btn-warning btn-sm text-black flex items-center gap-1" disabled={isSubmittingReschedule || !token}>
                                    {isSubmittingReschedule ? <span className="loading loading-spinner loading-xs"></span> : <Send size={16} />} Submit Reschedule
                                </button>
                            </>
                        ) : (
                            // Default action buttons (Details View)
                            <>
                                {selectedProposal.awaiting?.toLowerCase() === 'hod' && ['pending', 'review'].includes(selectedProposal.status) && (
                                    <button onClick={() => router.push(`/proposal/edit?proposalId=${selectedProposal.id}`)} className="btn btn-info btn-sm text-white flex items-center gap-1" disabled={isLoading}><Edit size={14} /> Edit Proposal</button>
                                )}
                                {showBillEntryButton && (
                                    <button onClick={startBillEntry} className="btn btn-warning btn-sm text-black flex items-center gap-1" disabled={isLoading}><UploadCloud size={16} /> Enter Actual Bill</button>
                                )}
                                {canModifyProposal && (
                                    <>
                                    <button onClick={openRescheduleForm} className="btn btn-outline btn-primary btn-sm flex items-center gap-1" disabled={isLoading}><RefreshCw size={14} /> Reschedule</button>
                                    <button onClick={openCancelForm} className="btn btn-outline btn-error btn-sm flex items-center gap-1" disabled={isLoading}><Ban size={14} /> Cancel Proposal</button>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div> {/* End Footer */}
            </motion.div>
        </motion.div>
    );
};

export default Popup;