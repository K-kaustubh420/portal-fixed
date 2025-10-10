"use client";

// MODIFIED: Added useEffect to the import list
import React, { useState, useId, useCallback, useRef, useEffect } from 'react'; 
import axios, { AxiosError } from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; 
import { format, isValid, differenceInCalendarDays, isPast, startOfDay, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

import jsPDF from 'jspdf';
import {
    X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign,
    Info, CalendarDays, AlertCircle, MessageSquare, Edit, UploadCloud,
    PlusCircle, Trash2, CheckCircle, Send, AlertTriangle, RefreshCw, Ban,
    Download, Image as ImageIcon 
} from 'lucide-react';

// --- Interfaces (Your original code, unchanged) ---
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
    originalId: number; 
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

// --- Constants for Dropdowns (Your original code, unchanged) ---
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

// --- Helper Component: DetailItem (Your original code, unchanged) ---
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => {
    const isEmpty = !children && (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value)));
    if (isEmpty) { return null; }
    return (<div className={className}><p className="text-sm font-semibold text-gray-700">{label}:</p>{children ? <div className="text-sm text-gray-600 mt-0.5">{children}</div> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>}</div>);
};

// --- Helper Function: Format Currency (Your original code, unchanged) ---
const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// --- NEW Photo Upload Modal Component ---
const PhotoUploadModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (photos: string[]) => void;
}> = ({ isOpen, onClose, onGenerate }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); };

  useEffect(() => {
    if (!isOpen) { setPhotos([]); }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Attach Photos (Optional)</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-red-600"><X size={24} /></button>
            </div>
            <div className="p-6 flex-grow overflow-y-auto">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              >
                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">Drag & drop images here</p>
                <p className="text-xs text-gray-500">or</p>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-sm btn-outline mt-2">
                  Browse Files
                </button>
                <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
              </div>
              {photos.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-2">Image Previews:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group border rounded-md overflow-hidden">
                        <img src={photo} alt={`preview ${index}`} className="h-28 w-full object-cover" />
                        <button onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
              <button onClick={onClose} className="btn btn-ghost">Cancel</button>
              <button onClick={() => onGenerate([])} className="btn btn-outline">Skip & Generate PDF</button>
              <button onClick={() => onGenerate(photos)} className="btn btn-primary" disabled={photos.length === 0}>
                Generate with {photos.length} Photo{photos.length !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


// --- Main Popup Component ---
const Popup: React.FC<PopupProps> = ({ selectedProposal, closePopup, onProposalUpdated, token, apiBaseUrl }) => {
    console.log(selectedProposal);
    const router = useRouter();
    const actualBillBaseId = useId();

    // --- All your original states and functions are untouched ---
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isEnteringBill, setIsEnteringBill] = useState(false);
    const [actualBillItems, setActualBillItems] = useState<ActualBillItemEdit[]>([]);
    const [isSubmittingActualBill, setIsSubmittingActualBill] = useState(false);
    const [actualBillError, setActualBillError] = useState<string | null>(null);
    const [billFormErrors, setBillFormErrors] = useState<Record<string, string | undefined>>({});
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
    const [cancelApiError, setCancelApiError] = useState<string | null>(null);
    const [showRescheduleForm, setShowRescheduleForm] = useState(false);
    const [rescheduleReason, setRescheduleReason] = useState("");
    const [rescheduleFrom, setRescheduleFrom] = useState("");
    const [rescheduleTo, setRescheduleTo] = useState("");
    const [isSubmittingReschedule, setIsSubmittingReschedule] = useState(false);
    const [rescheduleApiError, setRescheduleApiError] = useState<string | null>(null);
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false); 

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
            resetForms(); 
        } else {
            closePopup(); 
        }
    };

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
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Submission failed: ${err.response.data.message}` : "Failed to submit actual bill. Please try again.";
            setActualBillError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingActualBill(false); }
    };

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
            closePopup(); 
        } catch (err) {
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Cancellation failed: ${err.response.data.message}` : "Failed to cancel proposal. Please try again.";
            setCancelApiError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingCancel(false); }
    };

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
            from: format(fromDate, 'yyyy-MM-dd HH:mm:ss'),
            to: format(toDate, 'yyyy-MM-dd HH:mm:ss'),
        };
        try {
            await axios.put(`${apiBaseUrl}/api/faculty/proposals/${selectedProposal.id}/reschedule`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('Proposal reschedule request submitted successfully!');
            resetForms();
            if (onProposalUpdated) onProposalUpdated();
            closePopup();
        } catch (err) {
            const errorMsg = err instanceof AxiosError && err.response?.data?.message ? `Reschedule failed: ${err.response.data.message}` : "Failed to reschedule proposal. Please try again.";
            setRescheduleApiError(errorMsg); alert(errorMsg);
        } finally { setIsSubmittingReschedule(false); }
    };
    
    // --- MODIFIED PDF FLOW ---
    const handleDownloadPdfClick = () => {
        setIsPhotoModalOpen(true);
    };

    const generatePdfWithPhotos = (photos: string[] = []) => {
        setIsPhotoModalOpen(false);
        const doc = new jsPDF();
        const {
            title, convenerName, convenerDesignation, organizer, eventStartDate, eventEndDate,
            category, description, participantExpected, participantCategories,
            fundingDetails, estimatedBudget,
        } = selectedProposal;

        let yPos = 15;
        const pageHeight = doc.internal.pageSize.getHeight();
        const bottomMargin = 20;

        const addText = (text: string, x: number, options: any = {}) => {
            const splitText = doc.splitTextToSize(text, 180);
            const textHeight = (splitText.length * 5) + 3;
            if (yPos + textHeight > pageHeight - bottomMargin) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(splitText, x, yPos, options);
            yPos += textHeight;
        };
        
        const addSection = (title: string, contentLines: (string | null | undefined)[]) => {
             if (yPos + 20 > pageHeight - bottomMargin) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(12).setFont('helvetica', 'bold');
            addText(title, 14);
            doc.setFontSize(10).setFont('helvetica', 'normal');
            contentLines.forEach(line => {
                if(line) addText(line, 16);
            });
            yPos += 5;
        };

        doc.setFontSize(18).text(`Event Report: ${title}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
        yPos += 15;

        addSection("1. Name and Designation of Conveners and Co-Conveners:", [`${convenerName ?? 'N/A'} (${convenerDesignation ?? 'N/A'})`]);
        addSection("2. Conducting Department:", [organizer]);
        addSection("3. Date and Duration :", [`From: ${formatDateSafe(eventStartDate)}`, `To: ${formatDateSafe(eventEndDate)}`, `Duration: ${eventDuration}`]);
        addSection("4. Type of event (seminar/workshops/FDP/STTP/conference/Training/Alumni talks etc.):", [category]);
        addSection("5. Mode of Conduction(Online/Offline/Blended):", ["(Data not available)"]);
        addSection("6. Association with Professional Bodies/Government agency:", ["(Data not available)"]);
        addSection("7. Total Number of Registered Participants:", [`Expected: ${participantExpected ?? 'N/A'}`]);
        addSection("8. Number of Internal/External participants:", ["Internal: (Data not available), External: (Data not available)"]);
        addSection("9. Number of male/Female participants:", ["Male: (Data not available), Female: (Data not available)"]);
        addSection("10. Number of participants category wise:", [participantCategories?.join(', ') || '(Data not available)']);
        addSection("11. About the Workshop(Theme/Objective):", [description]);
        addSection("12. Targeted Audience:", [participantCategories?.join(', ') || '(Data not available)']);
        addSection("13. Number of Technical Sessions:", ["(Data not available)"]);
        addSection("14. Session Details:", ["Inaugural session Details: (Data not available)", "Session 1: (Data not available)", ". . .", "Valedictory details: (Data not available)"]);
        addSection("15. Event Outcome:", ["(Data not available)"]);
        addSection("16. Feedback collected from participants and Resource persons(Yes/No):", ["(Data not available)"]);
        
        const photoContent = photos.length > 0 ? ["See attached photos on the following page(s)."] : ["(No photographs were attached)"];
        addSection("17. Photographs with captions for each (min 5 for report including key sessions, highlights, with participants in video) (geo tagged photos to be included )", photoContent);

        addSection("18. Financial statement:", [
            `External Sponsoring Agency details with amount: ${formatCurrency(fundingDetails?.sponsorshipFund)}`,
            `Contribution from University: ${formatCurrency(fundingDetails?.universityFund)}`,
            `Income through Registration: ${formatCurrency(fundingDetails?.registrationFund)}`,
            `Total Expenditure incurred: ${formatCurrency(estimatedBudget)} (Estimated)`,
            "Amount returned to University: (Data not available)"
        ]);
        
        addSection("19. Signature of Conveners, Co –conveners:", ["\n\n____________________"]);
        addSection("20. Signature of the department event coordinator:", ["\n\n____________________"]);
        addSection("21. Signature of HOD:", ["\n\n____________________"]);

        if (photos.length > 0) {
            doc.addPage();
            yPos = 20;
            doc.setFontSize(14).text("Attached Photographs", 14, yPos);
            yPos += 15;

            photos.forEach((photoSrc) => {
                const img = new Image();
                img.src = photoSrc;
                
                // MODIFIED: Replaced faulty getImageProperties logic
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageMargin = 28;
                const availableWidth = pageWidth - pageMargin;
                
                const ratio = img.width / img.height;
                const imgHeight = availableWidth / ratio;
                const fileTypeMatch = photoSrc.match(/data:image\/(.*?);/);
                const fileType = fileTypeMatch ? fileTypeMatch[1] : 'jpeg';

                if (yPos + imgHeight > pageHeight - bottomMargin) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.addImage(img.src, fileType.toUpperCase(), 14, yPos, availableWidth, imgHeight);
                yPos += imgHeight + 10;
            });
        }
        
        doc.save(`report_proposal_${selectedProposal.id}.pdf`);
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
        <>
            <PhotoUploadModal
                isOpen={isPhotoModalOpen}
                onClose={() => setIsPhotoModalOpen(false)}
                onGenerate={generatePdfWithPhotos}
            />
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-transparent bg-opacity-60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} aria-labelledby="proposal-popup-title" role="dialog" aria-modal="true">
                <motion.div className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-6xl mx-auto max-h-[90vh] flex flex-col" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}>
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h2 id="proposal-popup-title" className="text-xl font-bold text-blue-900 truncate pr-4">{headerTitle}</h2>
                        <button onClick={handlePopupCloseAction} className="text-gray-500 hover:text-red-600 transition-colors flex-shrink-0" aria-label={closeButtonLabel}>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                        {isEnteringBill ? (
                            <section aria-labelledby="actual-bill-heading" className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">{/*... Your original JSX ...*/}</section>
                        ) : showCancelForm ? (
                            <section aria-labelledby="cancel-proposal-heading" className="border border-red-200 rounded-lg p-4 bg-red-50/50">{/*... Your original JSX ...*/}</section>
                        ) : showRescheduleForm ? (
                            <section aria-labelledby="reschedule-proposal-heading" className="border border-orange-200 rounded-lg p-4 bg-orange-50/50">{/*... Your original JSX ...*/}</section>
                        ) : (
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
                    </div>

                    {/* Footer / Actions */}
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
                                <>
                                    <button
                                        onClick={handleDownloadPdfClick}
                                        className="btn btn-info btn-sm text-white flex items-center gap-1"
                                        disabled={isLoading}
                                    >
                                        <Download size={14} /> Download Report
                                    </button>
                                    
                                    {selectedProposal.awaiting?.toLowerCase() === 'hod' && ['pending', 'review'].includes(selectedProposal.status) && (
                                        <button onClick={() => router.push(`/proposal/edit?proposalId=${selectedProposal.id}`)} className="btn btn-info btn-sm text-white flex items-center gap-1" disabled={isLoading}><Edit size={14} /> Edit Proposal</button>
                                    )}
                                    {showBillEntryButton && (
                                        <button onClick={startBillEntry} className="btn btn-warning btn-sm text-black flex items-center gap-1" disabled={isLoading}><UploadCloud size={16} /> Enter Actual Bill</button>
                                    )}
                                    {canModifyProposal && (
                                        <>
                                        {/* <button onClick={openRescheduleForm} className="btn btn-outline btn-primary btn-sm flex items-center gap-1" disabled={isLoading}><RefreshCw size={14} /> Reschedule</button>
                                        <button onClick={openCancelForm} className="btn btn-outline btn-error btn-sm flex items-center gap-1" disabled={isLoading}><Ban size={14} /> Cancel Proposal</button> */}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
};

export default Popup;