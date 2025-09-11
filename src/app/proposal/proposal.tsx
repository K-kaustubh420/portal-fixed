"use client";
import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Keep datepicker CSS
import { Trash2, PlusCircle, Info, Users, UserCheck, BedDouble, DollarSign, FileText, Award, CalendarDays, AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { loadAuthData, User } from '@/lib/users'; // Assuming this path is correct

// --- Interfaces ---
interface DetailedBudgetRow {
    localId: string;
    category: string;
    sub_category: string;
    type: 'Domestic' | 'International' | null;
    quantity: string;
    cost: string;
    amount: string;
}

interface SponsorshipRow {
    localId: string;
    category: string;
    amount: string;
    reward: string;
    mode: string;
    about: string;
    benefit: string;
}

// --- Enums / Constants ---
const HOTEL_TYPES: ('srm' | 'others')[] = ['srm', 'others'];
const TRAVEL_TYPES = ['srm', 'others'] as const;
const EVENT_CATEGORIES = [
    "conference_national", "conference_international", "fdp", "workshop",
    "winter_summer_school", "mdp_pdp", "student_programme", "alumni_programme",
    "outreach_programme", "value_added_course", "association_activity",
    "counselling_activity", "commemoration_day", "upskilling_non_teaching",
    "industrial_conclave", "patent_commercialisation", "lecture_series_industry_expert"
] as const;
const participantCategories = [
    "FA's", "Faculties Only", "International Students",
    "International Participants", "Students (Category)",
];
const studentCategories = [
    "Aerospace Engineering", "Automobile Engineering", "Biomedical Engineering",
    "Biotechnology", "Chemical Engineering", "Civil Engineering",
    "Computer Science and Engineering", "Ctech", "Cintel",
    "Electrical and Electronics Engineering", "Electronics and Communication Engineering",
    "Electronics and Instrumentation Engineering", "Food Process Engineering",
    "Genetic Engineering", "Information Technology", "Mechanical Engineering",
    "Mechatronics Engineering", "Software Engineering",
];

// --- Helper Components ---
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; required?: boolean }> = ({ title, icon, required }) => (
    <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="text-xl font-semibold text-gray-800">
            {title} {required && <span className="text-red-500 align-middle text-base">*</span>}
        </h3>
    </div>
);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    error?: string;
    required?: boolean;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, error, required, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            id={id}
            className={`input input-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`}
            {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    id: string;
    error?: string;
    required?: boolean;
}
const TextAreaField: React.FC<TextAreaProps> = ({ label, id, error, required, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            id={id}
            className={`textarea textarea-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`}
            rows={3}
            {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    id: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}
const SelectField: React.FC<SelectFieldProps> = ({ label, id, error, required, children, ...props }) => (
     <div>
         <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
             {label} {required && <span className="text-red-500">*</span>}
         </label>
         <select
             id={id}
             className={`select select-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`}
             {...props}
         >
             {children}
         </select>
         {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
     </div>
);

// --- Helper function to format Date object to 'YYYY-MM-DD' string ---
const formatDateToYyyyMmDd = (date: Date | null): string | null => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- Main Component ---
export default function EventProposalForm() {
    const searchParams = useSearchParams();

    // --- State ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // IDs and Refs
    const budgetBaseId = useId();
    const sponsorBaseId = useId();
    const nextLocalIdSuffix = useRef(1);
    const generateLocalId = () => `row-${nextLocalIdSuffix.current++}`;

    // Form State (Event, Chief Guest, Financial etc.)
    const [proposalId, setProposalId] = useState<string | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [durationEvent, setDurationEvent] = useState('');
    const [category, setCategory] = useState<typeof EVENT_CATEGORIES[number] | ''>('');
    const [pastEvents, setPastEvents] = useState('');
    const [relevantDetails, setRelevantDetails] = useState('');
    const [expectedParticipants, setExpectedParticipants] = useState('');
    const [selectedParticipantCategories, setSelectedParticipantCategories] = useState<string[]>([]);
    const [selectedStudentCategories, setSelectedStudentCategories] = useState<string[]>([]);
    const [fundUniversity, setFundUniversity] = useState('');
    const [fundRegistration, setFundRegistration] = useState('');
    const [fundSponsorship, setFundSponsorship] = useState('');
    const [fundOther, setFundOther] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');

    // Single Chief Guest State
    const [chiefGuestName, setChiefGuestName] = useState('');
    const [chiefGuestDesignation, setChiefGuestDesignation] = useState('');
    const [chiefGuestAddress, setChiefGuestAddress] = useState('');
    const [chiefGuestPhone, setChiefGuestPhone] = useState('');
    const [chiefGuestPan, setChiefGuestPan] = useState('');
    const [chiefGuestReason, setChiefGuestReason] = useState('');
    const [hotelName, setHotelName] = useState('');
    const [hotelAddress, setHotelAddress] = useState('');
    const [hotelDuration, setHotelDuration] = useState('');
    const [hotelType, setHotelType] = useState<typeof HOTEL_TYPES[number]>('srm');
    const [travelName, setTravelName] = useState('');
    const [travelAddress, setTravelAddress] = useState('');
    const [travelDuration, setTravelDuration] = useState('');
    const [travelType, setTravelType] = useState<typeof TRAVEL_TYPES[number]>('srm');

    // Table Rows State
    const [detailedBudgetRows, setDetailedBudgetRows] = useState<DetailedBudgetRow[]>([
        { localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' },
    ]);
    const [sponsorshipRows, setSponsorshipRows] = useState<SponsorshipRow[]>([
        { localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }
    ]);

    // --- Derived State Calculations ---
    const totalDetailedBudget = detailedBudgetRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalSponsorshipAmount = sponsorshipRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    // --- Effects ---
    useEffect(() => {
        const { user: loadedUser, token: loadedToken } = loadAuthData();
        setCurrentUser(loadedUser);
        setAuthToken(loadedToken);
    }, []);

    useEffect(() => { setEstimatedBudget(totalDetailedBudget.toFixed(2)); }, [totalDetailedBudget]);
    useEffect(() => { setFundSponsorship(totalSponsorshipAmount.toFixed(2)); }, [totalSponsorshipAmount]);

    const calculateDuration = useCallback(() => {
        if (!startDate || !endDate) { setDurationEvent(""); return; }
        if (endDate < startDate) { setDurationEvent("End date cannot be before start date"); return; }
        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const diffMs = endDay.getTime() - startDay.getTime();
        if (diffMs < 0) { setDurationEvent("End date cannot be before start date"); return; }
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
        setDurationEvent(`${days} day${days !== 1 ? 's' : ''}`);
    }, [startDate, endDate]);
    useEffect(() => { calculateDuration(); }, [calculateDuration, startDate, endDate]);

    // Edit Mode Handling (Placeholder)
    useEffect(() => {
        const editMode = searchParams.get('edit');
        const id = searchParams.get('proposalId');
        if (editMode === 'true' && id) {
            setProposalId(id);
            console.log("Edit mode detected, Proposal ID:", id);
            // TODO: Fetch data and populate state
            resetFormState(); // Placeholder reset
        } else {
            resetFormState();
        }
    }, [searchParams, authToken]);

    // --- Reset Form State ---
    const resetFormState = () => {
        setProposalId(null);
        setEventTitle(''); setEventDescription(''); setStartDate(null); setEndDate(null);
        setDurationEvent(''); setCategory(''); setPastEvents(''); setRelevantDetails('');
        setExpectedParticipants(''); setSelectedParticipantCategories([]); setSelectedStudentCategories([]);
        setFundUniversity(''); setFundRegistration(''); setFundOther('');
        setChiefGuestName(''); setChiefGuestDesignation(''); setChiefGuestAddress('');
        setChiefGuestPhone(''); setChiefGuestPan(''); setChiefGuestReason('');
        setHotelName(''); setHotelAddress(''); setHotelDuration(''); setHotelType('srm');
        setTravelName(''); setTravelAddress(''); setTravelDuration(''); setTravelType('srm');
        nextLocalIdSuffix.current = 1;
        setDetailedBudgetRows([{ localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
        setSponsorshipRows([{ localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
        setFormErrors({}); setIsLoading(false);
    };

    // --- Handler Functions ---
    const addDetailedBudgetRow = () => setDetailedBudgetRows(prev => [...prev, { localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
    const deleteDetailedBudgetRow = (idToDelete: string) => setDetailedBudgetRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleDetailedBudgetChange = (idToUpdate: string, field: keyof DetailedBudgetRow, value: string | 'Domestic' | 'International' | null) => {
        setDetailedBudgetRows(prevRows => prevRows.map(row => {
            if (row.localId === idToUpdate) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'quantity' || field === 'cost') {
                    const quantity = parseFloat(updatedRow.quantity) || 0;
                    const cost = parseFloat(updatedRow.cost) || 0;
                    updatedRow.amount = (quantity * cost).toFixed(2);
                }
                if (field === 'type') {
                    updatedRow.type = (value === 'Domestic' || value === 'International') ? value : null;
                }
                if (field === 'category') {
                    updatedRow.sub_category = '';
                    updatedRow.type = null;
                }
                return updatedRow;
            }
            return row;
        }));
    };

    const addSponsorshipRow = () => setSponsorshipRows(prev => [...prev, { localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
    const deleteSponsorshipRow = (idToDelete: string) => setSponsorshipRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleSponsorshipChange = (idToUpdate: string, field: keyof SponsorshipRow, value: string) => setSponsorshipRows(prev => prev.map(row => row.localId === idToUpdate ? { ...row, [field]: value } : row));

    const toggleParticipantCategory = (category: string) => setSelectedParticipantCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    const toggleStudentCategory = (category: string) => setSelectedStudentCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);

    // --- Form Validation ---
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        // Event Details
        if (!eventTitle.trim()) errors.eventTitle = "Event Title is required.";
        if (!eventDescription.trim()) errors.eventDescription = "Event Description is required.";
        if (!category) errors.category = "Event Category is required.";
        if (!startDate) errors.startDate = "Start Date is required.";
        if (!endDate) errors.endDate = "End Date is required.";
        if (startDate && endDate && endDate < startDate) errors.endDate = "End date cannot be before start date.";
        // Chief Guest
        if (!chiefGuestName.trim()) errors.chiefGuestName = "Chief Guest Name is required.";
        if (!chiefGuestDesignation.trim()) errors.chiefGuestDesignation = "Chief Guest Designation is required.";
        if (!chiefGuestAddress.trim()) errors.chiefGuestAddress = "Chief Guest Address is required.";
        if (!chiefGuestPhone.trim()) errors.chiefGuestPhone = "Chief Guest Phone is required.";
        if (!chiefGuestPan.trim()) errors.chiefGuestPan = "Chief Guest PAN is required.";
        if (!chiefGuestReason.trim()) errors.chiefGuestReason = "Reason for Inviting is required.";
        // Accommodation & Travel
        if (!hotelName.trim()) errors.hotelName = "Hotel Name is required.";
        if (!hotelAddress.trim()) errors.hotelAddress = "Hotel Address is required.";
        if (!hotelDuration.trim() || parseInt(hotelDuration) <= 0) errors.hotelDuration = "Valid Hotel Duration (> 0 days) is required.";
        if (!travelName.trim()) errors.travelName = "Travel Mode/Name is required.";
        if (!travelAddress.trim()) errors.travelAddress = "Travel To/From Address is required.";
        if (!travelDuration.trim() || parseInt(travelDuration) <= 0) errors.travelDuration = "Valid Travel Duration (> 0 days/trips) is required.";
        // Budget Validation
        const validBudgetRows = detailedBudgetRows.filter(r => r.category || r.sub_category || r.quantity || r.cost);
        if (validBudgetRows.length === 0) {
            errors.detailedBudget = "At least one budget item is required.";
        } else {
            validBudgetRows.forEach((row, index) => { // Validate only rows the user started filling
                const displayIndex = detailedBudgetRows.findIndex(r => r.localId === row.localId) + 1; // Get original index for error message
                if (!row.category.trim()) errors[`budget_category_${row.localId}`] = `Category required for row ${displayIndex}.`;
                if (!row.sub_category.trim()) errors[`budget_sub_category_${row.localId}`] = `Subcategory required for row ${displayIndex}.`;
                if (!row.quantity.trim() || parseFloat(row.quantity) <= 0) errors[`budget_quantity_${row.localId}`] = `Valid quantity (>0) required for row ${displayIndex}.`;
                if (!row.cost.trim() || parseFloat(row.cost) < 0) errors[`budget_cost_${row.localId}`] = `Valid cost (>=0) required for row ${displayIndex}.`;
            });
        }
        // Sponsorship Validation
        const validSponsorRows = sponsorshipRows.filter(r => r.category || r.amount || r.reward || r.mode || r.about || r.benefit);
         if (validSponsorRows.length === 0) {
             errors.sponsorship = "At least one sponsorship item is required.";
         } else {
            validSponsorRows.forEach((row, index) => {
                 const displayIndex = sponsorshipRows.findIndex(r => r.localId === row.localId) + 1;
                 if (!row.category.trim()) errors[`sponsor_category_${row.localId}`] = `Category required for sponsor ${displayIndex}.`;
                 if (!row.amount.trim() || parseFloat(row.amount) < 0) errors[`sponsor_amount_${row.localId}`] = `Valid amount (>=0) required for sponsor ${displayIndex}.`;
                 if (!row.reward.trim()) errors[`sponsor_reward_${row.localId}`] = `Reward required for sponsor ${displayIndex}.`;
                 if (!row.mode.trim()) errors[`sponsor_mode_${row.localId}`] = `Mode required for sponsor ${displayIndex}.`;
                 if (!row.about.trim()) errors[`sponsor_about_${row.localId}`] = `About required for sponsor ${displayIndex}.`;
                 if (!row.benefit.trim()) errors[`sponsor_benefit_${row.localId}`] = `Benefit required for sponsor ${displayIndex}.`;
             });
         }
        setFormErrors(errors);
        console.log("Validation Errors:", errors);
        return Object.keys(errors).length === 0;
    };

    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({});
        if (!validateForm()) {
             // Simplified scroll-to-error logic
             const firstErrorKey = Object.keys(formErrors)[0];
             const firstErrorElement = document.querySelector(`[id*="${firstErrorKey}"], [name*="${firstErrorKey}"], .border-red-500`);
             if (firstErrorElement) {
                 firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
             alert("Please fix the errors indicated on the form.");
             return;
        }
        if (!currentUser || !authToken) {
             alert("Authentication Error: User details or token not found."); return;
        }
        setIsLoading(true);

        // Filter out empty rows before mapping for submission
        const itemsToSubmit = detailedBudgetRows
            .filter(row => row.category && row.sub_category && row.quantity && row.cost)
            .map(({ localId, ...rest }) => ({
                ...rest,
                type: rest.type,
                quantity: parseInt(rest.quantity, 10) || 0,
                cost: parseInt(rest.cost, 10) || 0,
                amount: parseInt(rest.amount, 10) || 0,
            }));

        const sponsorsToSubmit = sponsorshipRows
            .filter(row => row.category && row.amount && row.reward && row.mode && row.about && row.benefit)
            .map(({ localId, ...rest }) => ({
                ...rest,
                amount: parseInt(rest.amount, 10) || 0,
            }));

        // Final check if validation somehow passed with empty arrays
        if (itemsToSubmit.length === 0) {
             alert("Please add at least one valid budget item.");
             setFormErrors(prev => ({ ...prev, detailedBudget: "At least one valid budget item is required." }));
             setIsLoading(false); return;
        }
        if (sponsorsToSubmit.length === 0) {
            alert("Please add at least one valid sponsorship item.");
            setFormErrors(prev => ({ ...prev, sponsorship: "At least one valid sponsorship item is required." }));
            setIsLoading(false); return;
        }

        const proposalData = {
             title: eventTitle.trim(),
             description: eventDescription.trim(),
             start: formatDateToYyyyMmDd(startDate)!,
             end: formatDateToYyyyMmDd(endDate)!,
             category: category,
             past: pastEvents.trim() || null,
             other: relevantDetails.trim() || null,
             participant_expected: expectedParticipants ? parseInt(expectedParticipants, 10) : null,
             participant_categories: selectedParticipantCategories.length > 0 ? selectedParticipantCategories : null,
             fund_uni: fundUniversity ? parseInt(fundUniversity, 10) : 0,
             fund_registration: fundRegistration ? parseInt(fundRegistration, 10) : 0,
             fund_sponsor: totalSponsorshipAmount > 0 ? parseInt(totalSponsorshipAmount.toString(), 10) : 0,
             fund_others: fundOther ? parseInt(fundOther, 10) : 0,
             chiefs: [{
                 name: chiefGuestName.trim(), designation: chiefGuestDesignation.trim(), address: chiefGuestAddress.trim(),
                 phone: chiefGuestPhone.trim(), pan: chiefGuestPan.trim(), reason: chiefGuestReason.trim(),
                 hotel_name: hotelName.trim(), hotel_address: hotelAddress.trim(), hotel_duration: parseInt(hotelDuration, 10) || 0,
                 hotel_type: hotelType, travel_name: travelName.trim(), travel_address: travelAddress.trim(),
                 travel_duration: parseInt(travelDuration, 10) || 0, travel_type: travelType,
             }],
             items: itemsToSubmit,
             sponsors: sponsorsToSubmit,
             student_categories: selectedStudentCategories.length > 0 ? selectedStudentCategories : null,
        };

        console.log("Submitting Proposal Data:", JSON.stringify(proposalData, null, 2));

        const apiEndpoint = proposalId
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faculty/proposals/${proposalId}`
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/faculty/proposals`;
        const apiMethod = proposalId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiEndpoint, {
                method: apiMethod,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' },
                body: JSON.stringify(proposalData),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`HTTP Error: ${response.status} ${response.statusText}`, errorText);
                let alertMessage = `Error ${response.status}: ${response.statusText}. `;
                 try {
                     const errorJson = JSON.parse(errorText);
                     console.error('Parsed Error Body:', errorJson);
                     if (response.status === 422 && errorJson.errors) {
                         alertMessage = "Submission failed due to validation errors. Check fields or console.";
                         const backendErrors: Record<string, string> = {};
                         // Basic mapping for simplicity, can be enhanced as before if needed
                         Object.keys(errorJson.errors).forEach(field => {
                             const frontendKey = field.replace(/\.(\d+)\./g, '_').replace(/\./g, '_'); // Simple conversion
                             backendErrors[frontendKey] = errorJson.errors[field][0];
                         });
                         setFormErrors(prev => ({ ...prev, ...backendErrors }));
                         console.log("Backend validation errors mapped:", backendErrors);
                     } else if (errorJson.message) {
                         alertMessage += errorJson.message;
                     } else {
                          alertMessage += "Check console for details.";
                     }
                 } catch (e) {
                    // Handle non-JSON error responses
                    if (errorText.toLowerCase().includes("sqlstate[22007]")) { alertMessage += "Incorrect date format sent."; }
                    else if (errorText.toLowerCase().includes("route [login] not defined")) { alertMessage += "Authentication failed."; }
                    else if (errorText.length < 300) { alertMessage += `Server Response: ${errorText}`; }
                    else { alertMessage += "Unexpected server error."; }
                 }
                 alert(alertMessage);
                 // Scroll to first error after setting backend errors
                 const firstBackendErrorKey = Object.keys(formErrors)[0];
                 const firstBackendErrorElement = document.querySelector(`[id*="${firstBackendErrorKey}"], [name*="${firstBackendErrorKey}"], .border-red-500`);
                 if (firstBackendErrorElement) {
                    firstBackendErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }

            } else { // Success
                console.log('Success Status:', response.status);
                alert(`Proposal ${proposalId ? 'Updated' : 'Submitted'} Successfully!`);
                resetFormState();
                // Optional: Redirect
            }
        } catch (error) {
            console.error('Fetch API Call Error:', error);
            alert("Network error or client-side issue during submission. Check console.");
        } finally {
            setIsLoading(false);
        }
    };


    // --- JSX ---
    return (
        <>
            <div className="bg-gray-50 min-h-screen w-full">
                <div className="flex justify-center items-start py-12 px-4">
                    <div className="bg-white shadow-lg border border-gray-200 rounded-xl max-w-7xl w-full mx-auto">
                        <div className="card-body p-8 md:p-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-10">
                                {proposalId ? 'Edit Event Proposal' : 'Submit Event Proposal'}
                            </h2>
                            {/* Convener Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-10 p-5 bg-blue-50 rounded-lg border border-blue-100">
                                <div><label className="block text-gray-600 text-sm font-medium mb-1">Convener Name</label><p className="text-gray-900 break-words">{currentUser?.name || '...'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-medium mb-1">Convener Email</label><p className="text-gray-900 break-words">{currentUser?.email || '...'}</p></div>
                                {/* <div><label className="block text-gray-600 text-sm font-medium mb-1">Department</label><p id="organizing-department" className="text-gray-900 break-words">{currentUser?.department || '...'}</p></div> */}
                            </div>

                            <form className="space-y-10" onSubmit={handleSubmit} noValidate>
                                {/* --- Section: Event Details --- */}
                                <section>
                                    <SectionHeader title="Event Details" icon={<Info size={22} />} required />
                                    <div className="space-y-5">
                                        <InputField label="Event Title" id="eventTitle" placeholder="Enter Event Title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} error={formErrors.eventTitle} required maxLength={255}/>
                                        <TextAreaField label="Event Description" id="eventDescription" placeholder="Provide a detailed description..." value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} error={formErrors.eventDescription} required />
                                        <SelectField label="Event Category" id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof EVENT_CATEGORIES[number])} error={formErrors.category} required>
                                            <option value="" disabled>Select Category</option>
                                            {EVENT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>))}
                                        </SelectField>
                                        {/* Event Dates */}
                                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                            <h4 className="text-base font-medium text-gray-800 flex items-center gap-2 mb-3"><CalendarDays className="text-blue-600" size={18} /> Event Dates <span className="text-red-500">*</span></h4>
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="startDate">Start Date</label>
                                                    <DatePicker id="startDate" selected={startDate} onChange={(date: Date | null) => setStartDate(date)} dateFormat="P" className={`input input-bordered w-full bg-white text-gray-900 ${formErrors.startDate ? 'border-red-500' : 'border-gray-300'}`} placeholderText="Select start" wrapperClassName="w-full" required autoComplete='off' selectsStart startDate={startDate} endDate={endDate}/>
                                                    {formErrors.startDate && <p className="mt-1 text-xs text-red-600">{formErrors.startDate}</p>}
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="block text-gray-700 text-sm font-medium mb-1" htmlFor="endDate">End Date</label>
                                                    <DatePicker id="endDate" selected={endDate} onChange={(date: Date | null) => setEndDate(date)} dateFormat="P" className={`input input-bordered w-full bg-white text-gray-900 ${formErrors.endDate ? 'border-red-500' : 'border-gray-300'}`} placeholderText="Select end" wrapperClassName="w-full" required autoComplete='off' selectsEnd startDate={startDate} endDate={endDate} minDate={startDate || undefined}/>
                                                    {formErrors.endDate && <p className="mt-1 text-xs text-red-600">{formErrors.endDate}</p>}
                                                </div>
                                            </div>
                                            {durationEvent && !durationEvent.includes("cannot") && (<p className="mt-3 text-center text-sm text-gray-700 font-medium bg-blue-100 px-3 py-1.5 rounded-md">Duration: {durationEvent}</p>)}
                                            {durationEvent && durationEvent.includes("cannot") && (<p className="mt-3 text-center text-sm text-red-700 font-medium bg-red-100 px-3 py-1.5 rounded-md flex items-center justify-center gap-1"><AlertCircle size={14} /> {durationEvent}</p>)}
                                        </div>
                                        {/* Optional Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <TextAreaField label="Past Relevant Events (Optional)" id="pastEvents" placeholder="e.g., Conference Name (Year)..." value={pastEvents} onChange={(e) => setPastEvents(e.target.value)} error={formErrors.past}/>
                                            <TextAreaField label="Other Relevant Details (Optional)" id="relevantDetails" placeholder="Any other supporting info..." value={relevantDetails} onChange={(e) => setRelevantDetails(e.target.value)} error={formErrors.other}/>
                                        </div>
                                    </div>
                                </section>

                                {/* --- Section: Participants --- */}
                                <section>
                                    <SectionHeader title="Participants" icon={<Users size={22} />} />
                                    <div className="space-y-5">
                                         <InputField label="Total Expected Participants (Optional)" id="expectedParticipants" type="number" min="0" placeholder="e.g., 150" className="input input-bordered w-full md:w-1/2 bg-white text-gray-900" value={expectedParticipants} onChange={(e) => setExpectedParticipants(e.target.value)} error={formErrors.participant_expected} />
                                         {/* Participant Categories */}
                                         <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Category of Participants (Optional)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {participantCategories.map((pCat) => ( <button type="button" key={pCat} className={`btn btn-sm normal-case font-medium rounded-full ${selectedParticipantCategories.includes(pCat) ? 'btn-primary text-white' : 'btn-outline border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'}`} onClick={() => toggleParticipantCategory(pCat)}>{pCat}</button>))}
                                            </div>
                                            {formErrors.participant_categories && <p className="mt-1 text-xs text-red-600">{formErrors.participant_categories}</p>}
                                        </div>
                                         {/* Student Categories (Conditional) */}
                                         {selectedParticipantCategories.includes("Students (Category)") && (
                                            <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Student Departments (Optional)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {studentCategories.map((sCat) => (<button type="button" key={sCat} className={`btn btn-xs normal-case font-medium rounded-full ${selectedStudentCategories.includes(sCat) ? 'bg-blue-500 border-blue-500 text-white' : 'btn-outline border-gray-300 text-gray-600 hover:bg-blue-50'}`} onClick={() => toggleStudentCategory(sCat)}>{sCat}</button>))}
                                                </div>
                                                {formErrors.student_categories && <p className="mt-1 text-xs text-red-600">{formErrors.student_categories}</p>}
                                            </div>
                                        )}
                                     </div>
                                </section>

                                {/* --- Section: Chief Guest Details --- */}
                                <section>
                                    <SectionHeader title="Chief Guest Details" icon={<UserCheck size={22} />} required />
                                    <p className="text-sm text-gray-600 mb-5 -mt-4">Details for the primary Chief Guest.</p>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <InputField label="Name" id="chiefGuestName" placeholder="Full Name" value={chiefGuestName} onChange={(e) => setChiefGuestName(e.target.value)} error={formErrors.chiefGuestName} required maxLength={255}/>
                                            <InputField label="Designation" id="chiefGuestDesignation" placeholder="e.g., CEO, Example Corp" value={chiefGuestDesignation} onChange={(e) => setChiefGuestDesignation(e.target.value)} error={formErrors.chiefGuestDesignation} required maxLength={255}/>
                                        </div>
                                         <InputField label="Address" id="chiefGuestAddress" placeholder="Full Address" value={chiefGuestAddress} onChange={(e) => setChiefGuestAddress(e.target.value)} error={formErrors.chiefGuestAddress} required maxLength={500}/>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            <InputField label="Phone" id="chiefGuestPhone" type="tel" placeholder="Contact Number" value={chiefGuestPhone} onChange={(e) => setChiefGuestPhone(e.target.value)} error={formErrors.chiefGuestPhone} required maxLength={20}/>
                                            <InputField label="PAN" id="chiefGuestPan" placeholder="PAN Number" value={chiefGuestPan} onChange={(e) => setChiefGuestPan(e.target.value)} error={formErrors.chiefGuestPan} required maxLength={10}/>
                                            <InputField label="Reason for Inviting" id="chiefGuestReason" placeholder="Brief reason" value={chiefGuestReason} onChange={(e) => setChiefGuestReason(e.target.value)} error={formErrors.chiefGuestReason} required maxLength={500}/>
                                        </div>
                                    </div>
                                </section>

                                {/* --- Section: Accommodation & Travel (Chief Guest) --- */}
                                <section>
                                    <SectionHeader title="Accommodation & Travel (Chief Guest)" icon={<BedDouble size={22} />} required />
                                     <div className="space-y-6">
                                         {/* Accommodation */}
                                         <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end">
                                                <InputField label="Hotel Name" id="hotelName" value={hotelName} onChange={e => setHotelName(e.target.value)} error={formErrors.hotelName || formErrors.hotel_name} required maxLength={255}/>
                                                <InputField label="Hotel Address" id="hotelAddress" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} error={formErrors.hotelAddress || formErrors.hotel_address} required maxLength={500}/>
                                                <InputField label="Duration (days)" id="hotelDuration" type="number" min="1" placeholder="Days" value={hotelDuration} onChange={e => setHotelDuration(e.target.value)} error={formErrors.hotelDuration || formErrors.hotel_duration} required/>
                                                <SelectField label="Hotel Type" id="hotelType" value={hotelType} onChange={e => setHotelType(e.target.value as typeof HOTEL_TYPES[number])} error={formErrors.hotelType || formErrors.hotel_type} required>
                                                    <option value="srm">SRM Arranged</option> <option value="others">External/Other</option>
                                                </SelectField>
                                          </div>
                                          {/* Travel */}
                                          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end">
                                                <InputField label="Travel Mode/Name" id="travelName" placeholder="e.g., Flight, Car" value={travelName} onChange={e => setTravelName(e.target.value)} error={formErrors.travelName || formErrors.travel_name} required maxLength={255}/>
                                                <InputField label="Travel To/From Address" id="travelAddress" placeholder="Origin/Destination" value={travelAddress} onChange={e => setTravelAddress(e.target.value)} error={formErrors.travelAddress || formErrors.travel_address} required maxLength={500}/>
                                                <InputField label="Travel Duration (days/trips)" id="travelDuration" type="number" min="1" placeholder="Count" value={travelDuration} onChange={e => setTravelDuration(e.target.value)} error={formErrors.travelDuration || formErrors.travel_duration} required/>
                                                <SelectField label="Travel Type" id="travelType" value={travelType} onChange={e => setTravelType(e.target.value as typeof TRAVEL_TYPES[number])} error={formErrors.travelType || formErrors.travel_type} required>
                                                    <option value="srm">SRM Provided</option> <option value="others">External/Other</option>
                                                </SelectField>
                                          </div>
                                     </div>
                                 </section>

                                 {/* --- Section: Financial Details --- */}
                                <section>
                                    <SectionHeader title="Financial Details" icon={<DollarSign size={22} />} required/>
                                    <div className="space-y-8">
                                        {/* Funding Sources */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-3">Funding Sources (₹) <span className="text-xs font-normal text-gray-500">(Estimates)</span></h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                               <InputField label="University Fund" id="fundUniversity" type="number" min="0" placeholder="0" value={fundUniversity} onChange={(e) => setFundUniversity(e.target.value)} error={formErrors.fund_uni} />
                                               <InputField label="Registration Fund" id="fundRegistration" type="number" min="0" placeholder="0" value={fundRegistration} onChange={(e) => setFundRegistration(e.target.value)} error={formErrors.fund_registration}/>
                                               <div>
                                                     <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fundSponsorship">Sponsorship Fund</label>
                                                     <input type="number" id="fundSponsorship" value={fundSponsorship} className="input input-bordered w-full bg-gray-100 text-gray-700" readOnly title="Auto-calculated" />
                                                     {formErrors.fund_sponsor && <p className="mt-1 text-xs text-red-600">{formErrors.fund_sponsor}</p>}
                                                </div>
                                               <InputField label="Other Sources" id="fundOther" type="number" min="0" placeholder="0" value={fundOther} onChange={(e) => setFundOther(e.target.value)} error={formErrors.fund_others}/>
                                            </div>
                                        </div>

                                        {/* === DETAILED BUDGET TABLE (Layout Fixed) === */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2"> <FileText size={18} /> Detailed Budget <span className="text-red-500 text-sm">*</span></h4>
                                            <p className="text-sm text-gray-600 mb-4">Add all anticipated expense items for the event.</p>
                                            {formErrors.detailedBudget && <p className="mb-2 text-sm text-red-600">{formErrors.detailedBudget}</p>}
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                                                <table className="table w-full table-auto">
                                                    <thead className="bg-gray-50">
                                                        <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                            <th className="p-3 w-10">#</th>
                                                            <th className="p-3 min-w-[250px]">Category / Subcategory <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-center">Location Type</th>
                                                            <th className="p-3 text-center">Qty <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-center">Cost/Unit (₹) <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-right">Total (₹)</th>
                                                            <th className="p-3 text-center w-16">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailedBudgetRows.map((row, index) => {
                                                            const uniqueDomIdSuffix = row.localId;
                                                            const catError = formErrors[`budget_category_${row.localId}`];
                                                            const subCatError = formErrors[`budget_sub_category_${row.localId}`];
                                                            const qtyError = formErrors[`budget_quantity_${row.localId}`];
                                                            const costError = formErrors[`budget_cost_${row.localId}`];
                                                            const typeError = formErrors[`budget_type_${row.localId}`];
                                                            return (
                                                                <tr key={row.localId} id={`budget_row_${row.localId}`} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 text-sm">
                                                                    {/* # */}
                                                                    <td className="p-2 font-medium text-gray-500 text-center align-middle">{index + 1}</td>
                                                                    {/* Category / Subcategory */}
                                                                    <td className="p-2 space-y-1 align-top"> {/* Keep align-top for this cell */}
                                                                        <div>
                                                                            <label htmlFor={`${budgetBaseId}-main-category-${uniqueDomIdSuffix}`} className="sr-only">Category {index + 1}</label>
                                                                            <select id={`${budgetBaseId}-main-category-${uniqueDomIdSuffix}`} name={`budget_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-800 ${catError ? 'border-red-500' : 'border-gray-300'}`} value={row.category || ""} onChange={(e) => handleDetailedBudgetChange(row.localId, 'category', e.target.value)} required>
                                                                                <option value="" disabled>Select Category</option>
                                                                                {/* Options... */}
                                                                                <option value="Budgetary Expenditures">Budgetary Expenditures</option>
                                                                                <option value="Publicity">Publicity</option>
                                                                                <option value="General">General</option>
                                                                                <option value="Honorarium">Honorarium</option>
                                                                                <option value="Hospitality">Hospitality</option>
                                                                                <option value="Inaugural and Valedictory">Inaugural & Valedictory</option>
                                                                                <option value="Resource Materials">Resource Materials</option>
                                                                                <option value="Conference Paper Publication">Paper Publication</option>
                                                                                <option value="Miscellaneous">Miscellaneous</option>
                                                                            </select>
                                                                             {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>}
                                                                        </div>
                                                                        <div>
                                                                            <label htmlFor={`${budgetBaseId}-sub-category-${uniqueDomIdSuffix}`} className="sr-only">Subcategory {index + 1}</label>
                                                                            <select id={`${budgetBaseId}-sub-category-${uniqueDomIdSuffix}`} name={`budget_sub_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-700 ${subCatError ? 'border-red-500' : 'border-gray-300'}`} value={row.sub_category || ""} onChange={(e) => handleDetailedBudgetChange(row.localId, 'sub_category', e.target.value)} required disabled={!row.category}>
                                                                                <option value="" disabled>Select Subcategory</option>
                                                                                {/* Conditional Options... */}
                                                                                {row.category === "Budgetary Expenditures" && (<><option value="Number of Sessions Planned">Sessions Planned</option><option value="Number of Keynote Speakers">Keynote Speakers</option><option value="Number of Session Judges">Session Judges</option><option value="Number of Celebrities / Chief Guests">Celebrities/Guests</option></>)}
                                                                                {row.category === "Publicity" && (<><option value="Invitation">Invitation</option><option value="Press Coverage">Press Coverage</option><option value="Brochures/Flyers">Brochures/Flyers</option><option value="Website/Social Media">Website/Social Media</option></>)}
                                                                                {row.category === "General" && (<><option value="Conference Kits">Conference Kits</option><option value="Printing and Stationery">Printing/Stationery</option><option value="Secretarial Expenses">Secretarial Expenses</option><option value="Mementos">Mementos</option><option value="Certificates">Certificates</option></>)}
                                                                                {row.category === "Honorarium" && (<><option value="Keynote Speakers">Keynote Speakers</option><option value="Session Judges">Session Judges</option><option value="Chief Guests">Chief Guests</option><option value="Invited Speakers">Invited Speakers</option></>)}
                                                                                {row.category === "Hospitality" && (<><option value="Train / Flight for Chief Guest / Keynote Speakers">Travel (Guests)</option><option value="Accommodation for Chief Guest / Keynote Speakers">Accommodation (Guests)</option><option value="Food and Beverages for Chief Guest / Keynote Speakers">Food (Guests)</option><option value="Local Travel Expenses">Local Travel</option><option value="Food for Participants">Food (Participants)</option><option value="Food & Snacks for Volunteers / Organizers">Food/Snacks (Team)</option><option value="Hostel Accommodation">Hostel Accommodation</option></>)}
                                                                                {row.category === "Inaugural and Valedictory" && (<><option value="Banners, Pandal etc">Banners/Pandal</option><option value="Lighting and Decoration">Lighting/Decoration</option><option value="Flower Bouquet">Flower Bouquet</option><option value="Cultural Events">Cultural Events</option><option value="Field Visits / Sightseeing">Field Visits</option></>)}
                                                                                {row.category === "Resource Materials" && (<><option value="Preparation, Printing, Binding">Preparation/Printing</option><option value="Software/Licenses">Software/Licenses</option></>)}
                                                                                {row.category === "Conference Paper Publication" && (<><option value="Extended Abstract">Extended Abstract</option><option value="Full Paper">Full Paper</option><option value="Journal Publication Fees">Journal Fees</option><option value="Proceedings">Proceedings</option></>)}
                                                                                {row.category === "Miscellaneous" && (<><option value="Contingency">Contingency</option><option value="Bank Charges">Bank Charges</option><option value="Other Unforeseen">Other Unforeseen</option></>)}
                                                                            </select>
                                                                            {subCatError && <p className="mt-1 text-xs text-red-600">{subCatError}</p>}
                                                                        </div>
                                                                    </td>
                                                                    {/* Location Type */}
                                                                    <td className="p-2 align-middle text-center bg-white text-gray-700  ">
                                                                        <div role="group" className={`flex flex-col justify-center items-center space-y-1 ${typeError ? ' p-1 rounded border border-red-400 bg-red-50' : ''}`}>
                                                                            <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${budgetBaseId}-type-${uniqueDomIdSuffix}`} value="Domestic" className="radio radio-xs checked:bg-blue-500 border-gray-300" checked={row.type === "Domestic"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'Domestic')} /> Domestic </label>
                                                                            <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${budgetBaseId}-type-${uniqueDomIdSuffix}`} value="International" className="radio radio-xs checked:bg-blue-500 border-gray-300" checked={row.type === "International"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'International')} /> International  </label>
                                                                        </div>
                                                                        {typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>}
                                                                    </td>
                                                                    {/* Quantity */}
                                                                    <td className="p-2 text-center align-middle">
                                                                        <label htmlFor={`${budgetBaseId}-quantity-${uniqueDomIdSuffix}`} className="sr-only">Quantity {index + 1}</label>
                                                                        <input type="number" id={`${budgetBaseId}-quantity-${uniqueDomIdSuffix}`} name={`budget_quantity_${row.localId}`} min="1" className={`input input-bordered input-xs w-20 text-right bg-white text-gray-700 ${qtyError ? 'border-red-500' : 'border-gray-300'}`} value={row.quantity} onChange={(e) => handleDetailedBudgetChange(row.localId, 'quantity', e.target.value)} required />
                                                                        {qtyError && <p className="mt-1 text-xs text-red-600">{qtyError}</p>}
                                                                    </td>
                                                                    {/* Cost */}
                                                                    <td className="p-2 text-center align-middle">
                                                                        <label htmlFor={`${budgetBaseId}-cost-${uniqueDomIdSuffix}`} className="sr-only">Cost per Unit {index + 1}</label>
                                                                        <input type="number" id={`${budgetBaseId}-cost-${uniqueDomIdSuffix}`} name={`budget_cost_${row.localId}`} min="0" step="0.01" className={`input input-bordered input-xs w-24 text-right bg-white text-gray-700 ${costError ? 'border-red-500' : 'border-gray-300'}`} value={row.cost} onChange={(e) => handleDetailedBudgetChange(row.localId, 'cost', e.target.value)} required />
                                                                        {costError && <p className="mt-1 text-xs text-red-600">{costError}</p>}
                                                                    </td>
                                                                    {/* Total */}
                                                                    <td className="p-2 font-medium text-right align-middle text-gray-700">{parseFloat(row.amount || '0').toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td>
                                                                    {/* Action */}
                                                                    <td className="p-2 text-center align-middle">
                                                                        {detailedBudgetRows.length > 1 && (<button type="button" onClick={() => deleteDetailedBudgetRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete budget row ${index + 1}`}><Trash2 className="h-4 w-4" /></button>)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-gray-100 font-semibold text-gray-700 text-sm">
                                                            <td colSpan={5} className="text-right p-3">Total Estimated Budget:</td>
                                                            <td className="text-right p-3">{totalDetailedBudget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td>
                                                            <td className="p-3"></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addDetailedBudgetRow} className="btn btn-sm btn-outline btn-primary mt-4 rounded-full flex items-center gap-1 normal-case font-medium">
                                                <PlusCircle size={16} /> Add Budget Item
                                            </button>
                                        </div>


                                        {/* === SPONSORSHIP TABLE (Two-Row Design) === */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2"><Award size={18}/> Sponsorship Details <span className="text-red-500 text-sm">*</span></h4>
                                            <p className="text-sm text-gray-600 mb-4">Provide details for each potential or confirmed sponsor.</p>
                                            {formErrors.sponsorship && <p className="mb-2 text-sm text-red-600">{formErrors.sponsorship}</p>}
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                                                {/* Applied table-compact here */}
                                                <table className="table w-full table-compact">
                                                    <thead className="bg-gray-100">
                                                        <tr className="text-left text-gray-600 uppercase text-xs tracking-wider">
                                                            <th className="p-3 w-10">#</th>
                                                            <th className="p-3">Category <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-right">Amount (₹) <span className="text-red-500">*</span></th>
                                                            <th className="p-3">Reward <span className="text-red-500">*</span></th>
                                                            <th className="p-3">Mode <span className="text-red-500">*</span></th>
                                                            <th className="p-3">Benefit/Output <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-center w-16">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sponsorshipRows.map((row, index) => {
                                                            const uniqueDomIdSuffix = row.localId;
                                                            // Re-declare error variables for this scope
                                                            const catError = formErrors[`sponsor_category_${row.localId}`];
                                                            const amountError = formErrors[`sponsor_amount_${row.localId}`];
                                                            const rewardError = formErrors[`sponsor_reward_${row.localId}`];
                                                            const modeError = formErrors[`sponsor_mode_${row.localId}`];
                                                            const benefitError = formErrors[`sponsor_benefit_${row.localId}`];
                                                            const aboutError = formErrors[`sponsor_about_${row.localId}`];
                                                            return (
                                                                <React.Fragment key={row.localId}>
                                                                    {/* --- First Row --- */}
                                                                    <tr className="border-t border-gray-200 hover:bg-gray-50/50 text-sm">
                                                                        <td className="p-2 font-medium text-gray-500 align-middle text-center">{index + 1}</td>
                                                                        {/* Category */}
                                                                        <td className="p-2 align-middle">
                                                                            <label htmlFor={`${sponsorBaseId}-category-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Category {index + 1}</label>
                                                                            <input type="text" id={`${sponsorBaseId}-category-${uniqueDomIdSuffix}`} name={`sponsor_category_${row.localId}`} placeholder="e.g., Title Sponsor" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${catError ? 'border-red-500' : 'border-gray-300'}`} value={row.category} onChange={(e) => handleSponsorshipChange(row.localId, 'category', e.target.value)} required />
                                                                            {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>}
                                                                        </td>
                                                                        {/* Amount */}
                                                                        <td className="p-2 text-right align-middle">
                                                                            <label htmlFor={`${sponsorBaseId}-amount-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Amount {index + 1}</label>
                                                                            <input type="number" id={`${sponsorBaseId}-amount-${uniqueDomIdSuffix}`} name={`sponsor_amount_${row.localId}`} min="0" placeholder="Amount" className={`input input-bordered input-xs w-24 text-right bg-white text-gray-700 ${amountError ? 'border-red-500' : 'border-gray-300'}`} value={row.amount} onChange={(e) => handleSponsorshipChange(row.localId, 'amount', e.target.value)} required />
                                                                            {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>}
                                                                        </td>
                                                                        {/* Reward */}
                                                                        <td className="p-2 align-middle">
                                                                            <label htmlFor={`${sponsorBaseId}-reward-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Reward {index + 1}</label>
                                                                            <input type="text" id={`${sponsorBaseId}-reward-${uniqueDomIdSuffix}`} name={`sponsor_reward_${row.localId}`} placeholder="Reward/Perk" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${rewardError ? 'border-red-500' : 'border-gray-300'}`} value={row.reward} onChange={(e) => handleSponsorshipChange(row.localId, 'reward', e.target.value)} required />
                                                                            {rewardError && <p className="mt-1 text-xs text-red-600">{rewardError}</p>}
                                                                        </td>
                                                                        {/* Mode */}
                                                                        <td className="p-2 align-middle">
                                                                            <label htmlFor={`${sponsorBaseId}-mode-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Mode {index + 1}</label>
                                                                            <input type="text" id={`${sponsorBaseId}-mode-${uniqueDomIdSuffix}`} name={`sponsor_mode_${row.localId}`} placeholder="e.g., Cash, Kind" className={`input input-bordered input-xs w-full bg-white text-gray-700  ${modeError ? 'border-red-500' : 'border-gray-300'}`} value={row.mode} onChange={(e) => handleSponsorshipChange(row.localId, 'mode', e.target.value)} required />
                                                                            {modeError && <p className="mt-1 text-xs text-red-600">{modeError}</p>}
                                                                        </td>
                                                                        {/* Benefit */}
                                                                        <td className="p-2 align-middle">
                                                                            <label htmlFor={`${sponsorBaseId}-benefit-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Benefit {index + 1}</label>
                                                                            <input type="text" id={`${sponsorBaseId}-benefit-${uniqueDomIdSuffix}`} name={`sponsor_benefit_${row.localId}`} placeholder="Benefit to Event" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${benefitError ? 'border-red-500' : 'border-gray-300'}`} value={row.benefit} onChange={(e) => handleSponsorshipChange(row.localId, 'benefit', e.target.value)} required />
                                                                            {benefitError && <p className="mt-1 text-xs text-red-600">{benefitError}</p>}
                                                                        </td>
                                                                        {/* Action */}
                                                                        <td className="p-2 text-center align-middle">
                                                                            {sponsorshipRows.length > 1 && (<button type="button" onClick={() => deleteSponsorshipRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete sponsor row ${index + 1}`}><Trash2 className="h-4 w-4" /></button>)}
                                                                        </td>
                                                                    </tr>
                                                                    {/* --- Second Row (About Sponsor) --- */}
                                                                    <tr className="border-b border-gray-200 bg-gray-50/30 hover:bg-gray-50/50">
                                                                        <td colSpan={7} className="px-3 py-2"> {/* Colspan matches number of columns in thead */}
                                                                            <label htmlFor={`${sponsorBaseId}-about-${uniqueDomIdSuffix}`} className="block text-gray-600 text-xs font-medium mb-1">About Sponsor {index + 1} <span className="text-red-500">*</span></label>
                                                                            <textarea id={`${sponsorBaseId}-about-${uniqueDomIdSuffix}`} name={`sponsor_about_${row.localId}`} rows={1} className={`textarea textarea-bordered textarea-xs w-full bg-white text-gray-700 text-3xl font-sans p-1.5 ${aboutError ? 'border-red-500' : 'border-gray-300'}`} value={row.about} onChange={(e) => handleSponsorshipChange(row.localId, 'about', e.target.value)} placeholder="Brief details about the sponsor..." required />
                                                                            {aboutError && <p className="mt-1 text-xs text-red-600">{aboutError}</p>}
                                                                        </td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                     <tfoot>
                                                        <tr className="bg-gray-100 font-semibold text-gray-700 text-sm">
                                                            <td colSpan={2} className="text-right p-3">Total Sponsorship Amount:</td>
                                                            {/* Consistent formatting with budget */}
                                                            <td className="text-right p-3">{totalSponsorshipAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td>
                                                            <td colSpan={4} className="p-3"></td>{/* Adjusted colspan */}
                                                         </tr>
                                                      </tfoot>
                                                </table>
                                            </div>
                                            {/* Updated Button Style */}
                                            <button type="button" onClick={addSponsorshipRow} className="btn btn-outline btn-primary btn-sm mt-4 rounded-full flex items-center gap-1 normal-case font-medium">
                                                <PlusCircle size={16} /> Add Sponsor
                                            </button>
                                        </div>
                                    </div>
                                </section>


                                {/* Submit Button Area */}
                                <div className="mt-12 pt-8 border-t border-gray-200 flex justify-center">
                                    <button type="submit" className="btn btn-primary btn-lg rounded-full text-lg font-semibold px-10 py-3 shadow-md hover:shadow-lg disabled:opacity-50" disabled={isLoading || !authToken}>
                                        {isLoading ? (<span className="loading loading-spinner loading-sm"></span>) : (proposalId ? 'Update Proposal' : 'Submit Proposal')}
                                    </button>
                                </div>
                                {!authToken && <p className="text-center text-red-600 text-sm mt-4">Authentication token not found. Please log in.</p>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}