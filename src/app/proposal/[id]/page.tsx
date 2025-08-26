

"use client";

import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Trash2, PlusCircle, Info, Users, UserCheck, BedDouble, DollarSign, FileText, Award, CalendarDays, AlertCircle, Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation'; // Import useRouter
import { loadAuthData, User } from '@/lib/users'; // Adjust path if needed
import axios from 'axios'; // Using axios for simplicity

// --- Interfaces ---
// (Keep DetailedBudgetRow, SponsorshipRow, HOTEL_TYPES, etc. from your form component)
interface DetailedBudgetRow {
    localId: string; // UI identifier
    id?: number; // Actual ID from backend (if existing)
    category: string;
    sub_category: string;
    type: 'Domestic' | 'International' | null;
    quantity: string;
    cost: string;
    amount: string;
}

interface SponsorshipRow {
    localId: string; // UI identifier
    id?: number; // Actual ID from backend (if existing)
    category: string;
    amount: string;
    reward: string;
    mode: string;
    about: string;
    benefit: string;
}

// Interface for the data structure received from the GET request
interface FetchedProposalData {
    id: number;
    user_id: number;
    title: string;
    description: string;
    start: string; // "YYYY-MM-DD HH:MM:SS"
    end: string;   // "YYYY-MM-DD HH:MM:SS"
    category: typeof EVENT_CATEGORIES[number] | '';
    past: string | null;
    other: string | null;
    status: string;
    participant_expected: number | null;
    participant_categories: string | null; // JSON string like "[\"students\"]"
    fund_uni: number | null;
    fund_registration: number | null;
    fund_sponsor: number | null;
    fund_others: number | null;
    awaiting: string | null;
    chiefs: Array<{
        id: number;
        name: string;
        designation: string;
        address: string;
        phone: string;
        pan: string;
        pivot: {
            reason: string | null;
            hotel_name: string | null;
            hotel_address: string | null;
            hotel_duration: number | null;
            hotel_type: 'srm' | 'others' | null;
            travel_name: string | null;
            travel_address: string | null;
            travel_duration: number | null;
            travel_type: 'srm' | 'others' | null;
        };
    }> | null;
    items: Array<{
        id: number; // Existing item ID
        category: string;
        sub_category: string;
        type: 'Domestic' | 'International' | null;
        quantity: number;
        cost: number;
        amount: number;
        status: string; // 'estimated' or 'actual' - Note: PUT doesn't seem to use this
    }>;
    sponsors: Array<{
        id: number; // Existing sponsor ID
        category: string;
        amount: number;
        reward: string;
        mode: string;
        about: string;
        benefit: string;
    }>;
    // Include user and messages if needed for display, though not directly editable here
    user?: { id: number; name: string; email: string; department?: string; };
    messages?: any[]; // Define message structure if needed
}


// --- Constants (Keep EVENT_CATEGORIES, participantCategories, etc.) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const HOTEL_TYPES = ['srm', 'others'] as const;
const TRAVEL_TYPES = ['srm', 'others'] as const;
const EVENT_CATEGORIES = [ "conference_national", "conference_international", "fdp", "workshop", "winter_summer_school", "mdp_pdp", "student_programme", "alumni_programme", "outreach_programme", "value_added_course", "association_activity", "counselling_activity", "commemoration_day", "upskilling_non_teaching", "industrial_conclave", "patent_commercialisation", "lecture_series_industry_expert" ] as const;
const participantCategories = [ "FA's", "Faculties Only", "International Students", "International Participants", "Students (Category)", ];
const studentCategories = [ "Aerospace Engineering", "Automobile Engineering", "Biomedical Engineering", "Biotechnology", "Chemical Engineering", "Civil Engineering", "Computer Science and Engineering", "Ctech", "Cintel", "Electrical and Electronics Engineering", "Electronics and Communication Engineering", "Electronics and Instrumentation Engineering", "Food Process Engineering", "Genetic Engineering", "Information Technology", "Mechanical Engineering", "Mechatronics Engineering", "Software Engineering", ];


// --- Helper Components (SectionHeader, InputField, TextAreaField, SelectField) ---
// (Assume these are defined or imported as in your form component)
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; required?: boolean }> = ({ title, icon, required }) => ( <div className="flex items-center gap-3 mb-6 pb-2 border-b border-gray-200"> {icon && <span className="text-blue-600">{icon}</span>} <h3 className="text-xl font-semibold text-gray-800"> {title} {required && <span className="text-red-500 align-middle text-base">*</span>} </h3> </div> );
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; error?: string; required?: boolean; }> = ({ label, id, error, required, ...props }) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1"> {label} {required && <span className="text-red-500">*</span>} </label> <input id={id} className={`input input-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`} {...props} /> {error && <p className="mt-1 text-xs text-red-600">{error}</p>} </div> );
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; id: string; error?: string; required?: boolean; }> = ({ label, id, error, required, ...props }) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1"> {label} {required && <span className="text-red-500">*</span>} </label> <textarea id={id} className={`textarea textarea-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`} rows={3} {...props} /> {error && <p className="mt-1 text-xs text-red-600">{error}</p>} </div> );
const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; id: string; error?: string; required?: boolean; children: React.ReactNode; }> = ({ label, id, error, required, children, ...props }) => ( <div> <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1"> {label} {required && <span className="text-red-500">*</span>} </label> <select id={id} className={`select select-bordered w-full bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 ${error ? 'border-red-500' : ''}`} {...props}> {children} </select> {error && <p className="mt-1 text-xs text-red-600">{error}</p>} </div> );

// --- Helper function to format Date object to 'YYYY-MM-DD' string ---
const formatDateToYyyyMmDd = (date: Date | null): string | null => {
    if (!date) return null;
    try {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Error formatting date:", e);
        return null;
    }
};

// --- Main Edit Page Component ---
export default function EditProposalPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const proposalId = searchParams.get('proposalId'); // Get ID from query param

    // --- State ---
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    // Loading and Error State
    const [isFetching, setIsFetching] = useState(true); // Start fetching initially
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    // Form State (mirrors EventProposalForm)
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
    const [selectedStudentCategories, setSelectedStudentCategories] = useState<string[]>([]); // Assuming student categories are part of proposal data if needed
    const [fundUniversity, setFundUniversity] = useState('');
    const [fundRegistration, setFundRegistration] = useState('');
    const [fundSponsorship, setFundSponsorship] = useState('');
    const [fundOther, setFundOther] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState(''); // Auto-calculated
    // Chief Guest State
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
    const [detailedBudgetRows, setDetailedBudgetRows] = useState<DetailedBudgetRow[]>([]);
    const [sponsorshipRows, setSponsorshipRows] = useState<SponsorshipRow[]>([]);

    // IDs and Refs
    const budgetBaseId = useId();
    const sponsorBaseId = useId();
    const nextLocalIdSuffix = useRef(1);
    const generateLocalId = () => `edit-${nextLocalIdSuffix.current++}`; // Prefix to avoid clashes if needed

    // --- Auth Loading ---
    useEffect(() => {
        const { user: loadedUser, token: loadedToken } = loadAuthData();
        setCurrentUser(loadedUser);
        setAuthToken(loadedToken);
        if (!loadedToken) {
            // Redirect to login if no token
            router.push('/login'); // Adjust login path if needed
        }
    }, [router]);

    // --- Data Fetching ---
    const fetchProposalData = useCallback(async () => {
        if (!proposalId || !authToken) {
            // Don't fetch if ID or token is missing
            setIsFetching(false); // Stop loading indicator
            if (!proposalId) setFetchError("Proposal ID not found in URL.");
            // Auth error handled by auth useEffect
            return;
        }

        console.log(`Fetching data for proposal ID: ${proposalId}`);
        setIsFetching(true);
        setFetchError(null);
        const endpoint = `${API_BASE_URL}/api/faculty/proposals/${proposalId}`;

        try {
            const response = await axios.get<{ proposal: FetchedProposalData }>(endpoint, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                    Accept: 'application/json',
                },
            });

            console.log("Fetched proposal data:", response.data.proposal);
            populateForm(response.data.proposal); // Populate form with fetched data

        } catch (err: any) {
            console.error("Error fetching proposal data:", err);
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 404) {
                    setFetchError(`Proposal with ID ${proposalId} not found.`);
                } else if (err.response?.status === 401) {
                    setFetchError("Authentication error. Please log in again.");
                    // Optionally logout or redirect
                    // logout(); router.push('/login');
                } else {
                    setFetchError(`Failed to fetch data: ${err.response?.data?.message || err.message}`);
                }
            } else {
                setFetchError("An unknown error occurred while fetching data.");
            }
        } finally {
            setIsFetching(false);
        }
    }, [proposalId, authToken]); // Add other dependencies if needed inside populateForm

    // Fetch data when component mounts or proposalId/authToken changes
    useEffect(() => {
        fetchProposalData();
    }, [fetchProposalData]); // Now fetchProposalData includes dependencies

    // --- Form Population ---
    const populateForm = (data: FetchedProposalData) => {
        setEventTitle(data.title || '');
        setEventDescription(data.description || '');
        setStartDate(data.start ? new Date(data.start) : null);
        setEndDate(data.end ? new Date(data.end) : null);
        setCategory(data.category || '');
        setPastEvents(data.past || '');
        setRelevantDetails(data.other || '');
        setExpectedParticipants(data.participant_expected?.toString() || '');

        // Safely parse participant categories
        let participantCats: string[] = [];
        if (data.participant_categories) {
            try {
                const parsed = JSON.parse(data.participant_categories);
                if (Array.isArray(parsed)) {
                    participantCats = parsed.map(String);
                }
            } catch (e) { console.error("Failed to parse participant categories", e); }
        }
        setSelectedParticipantCategories(participantCats);
        // TODO: Populate selectedStudentCategories if applicable and data exists

        setFundUniversity(data.fund_uni?.toString() || '0');
        setFundRegistration(data.fund_registration?.toString() || '0');
        // fundSponsorship is auto-calculated from rows
        setFundOther(data.fund_others?.toString() || '0');

        // Populate Chief Guest (assuming only one)
        const chief = data.chiefs?.[0];
        if (chief) {
            setChiefGuestName(chief.name || '');
            setChiefGuestDesignation(chief.designation || '');
            setChiefGuestAddress(chief.address || '');
            setChiefGuestPhone(chief.phone || '');
            setChiefGuestPan(chief.pan || '');
            setChiefGuestReason(chief.pivot?.reason || '');
            setHotelName(chief.pivot?.hotel_name || '');
            setHotelAddress(chief.pivot?.hotel_address || '');
            setHotelDuration(chief.pivot?.hotel_duration?.toString() || '');
            setHotelType(chief.pivot?.hotel_type || 'srm');
            setTravelName(chief.pivot?.travel_name || '');
            setTravelAddress(chief.pivot?.travel_address || '');
            setTravelDuration(chief.pivot?.travel_duration?.toString() || '');
            setTravelType(chief.pivot?.travel_type || 'srm');
        }

        // Populate Budget Items
        setDetailedBudgetRows(data.items?.map(item => ({
            localId: generateLocalId(), // Generate unique UI ID
            id: item.id, // Keep original ID
            category: item.category || '',
            sub_category: item.sub_category || '',
            type: item.type,
            quantity: item.quantity?.toString() || '',
            cost: item.cost?.toString() || '',
            amount: item.amount?.toString() || '', // This will be recalculated anyway
        })) || []);

        // Populate Sponsors
        setSponsorshipRows(data.sponsors?.map(sponsor => ({
            localId: generateLocalId(), // Generate unique UI ID
            id: sponsor.id, // Keep original ID
            category: sponsor.category || '',
            amount: sponsor.amount?.toString() || '',
            reward: sponsor.reward || '',
            mode: sponsor.mode || '',
            about: sponsor.about || '',
            benefit: sponsor.benefit || '',
        })) || []);

        // Trigger initial calculations
        calculateDuration(); // Recalculate duration based on populated dates
    };


    // --- Derived State Calculations (Recalculated on row changes) ---
    const totalDetailedBudget = detailedBudgetRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalSponsorshipAmount = sponsorshipRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    // Update estimated budget and sponsorship fund when rows change
    useEffect(() => { setEstimatedBudget(totalDetailedBudget.toFixed(2)); }, [totalDetailedBudget]);
    useEffect(() => { setFundSponsorship(totalSponsorshipAmount.toFixed(2)); }, [totalSponsorshipAmount]);

    // Recalculate event duration when dates change
    const calculateDuration = useCallback(() => {
        if (!startDate || !endDate) { setDurationEvent(""); return; }
        if (endDate < startDate) { setDurationEvent("End date cannot be before start date"); return; }
        try {
            const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            const diffMs = endDay.getTime() - startDay.getTime();
            if (diffMs < 0) { setDurationEvent("End date cannot be before start date"); return; }
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
            setDurationEvent(`${days} day${days !== 1 ? 's' : ''}`);
        } catch (e) {
            console.error("Error calculating duration:", e);
            setDurationEvent("Error calculating duration");
        }
    }, [startDate, endDate]);
    useEffect(() => { calculateDuration(); }, [calculateDuration]); // Call whenever dates change

    // --- Handler Functions (add/delete/change rows, toggle categories) ---
    // (These functions can be copied directly from your EventProposalForm component)
    const addDetailedBudgetRow = () => setDetailedBudgetRows(prev => [...prev, { localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
    const deleteDetailedBudgetRow = (idToDelete: string) => setDetailedBudgetRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleDetailedBudgetChange = (idToUpdate: string, field: keyof Omit<DetailedBudgetRow, 'id'>, value: string | 'Domestic' | 'International' | null) => {
        setDetailedBudgetRows(prevRows => prevRows.map(row => {
            if (row.localId === idToUpdate) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'quantity' || field === 'cost') {
                    const quantity = parseFloat(updatedRow.quantity) || 0;
                    const cost = parseFloat(updatedRow.cost) || 0;
                    updatedRow.amount = (quantity * cost).toFixed(2);
                }
                if (field === 'type') { updatedRow.type = (value === 'Domestic' || value === 'International') ? value : null; }
                if (field === 'category') { updatedRow.sub_category = ''; updatedRow.type = null; } // Reset subcat/type on main cat change
                return updatedRow;
            } return row;
        }));
    };
    const addSponsorshipRow = () => setSponsorshipRows(prev => [...prev, { localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
    const deleteSponsorshipRow = (idToDelete: string) => setSponsorshipRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleSponsorshipChange = (idToUpdate: string, field: keyof Omit<SponsorshipRow, 'id'>, value: string) => setSponsorshipRows(prev => prev.map(row => row.localId === idToUpdate ? { ...row, [field]: value } : row));
    const toggleParticipantCategory = (category: string) => setSelectedParticipantCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    const toggleStudentCategory = (category: string) => setSelectedStudentCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);

    // --- Form Validation (Reuse from EventProposalForm) ---
    const validateForm = (): boolean => {
        // Copy the exact validation logic from your EventProposalForm
        // Ensure it uses the state variables from *this* component
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
        if (validBudgetRows.length === 0) { errors.detailedBudget = "At least one budget item is required."; }
        else { validBudgetRows.forEach((row) => { const displayIndex = detailedBudgetRows.findIndex(r => r.localId === row.localId) + 1; if (!row.category.trim()) errors[`budget_category_${row.localId}`] = `Category required for row ${displayIndex}.`; if (!row.sub_category.trim()) errors[`budget_sub_category_${row.localId}`] = `Subcategory required for row ${displayIndex}.`; if (!row.quantity.trim() || parseFloat(row.quantity) <= 0) errors[`budget_quantity_${row.localId}`] = `Valid quantity (>0) required for row ${displayIndex}.`; if (!row.cost.trim() || parseFloat(row.cost) < 0) errors[`budget_cost_${row.localId}`] = `Valid cost (>=0) required for row ${displayIndex}.`; }); }
        // Sponsorship Validation
        const validSponsorRows = sponsorshipRows.filter(r => r.category || r.amount || r.reward || r.mode || r.about || r.benefit);
         if (validSponsorRows.length === 0) { errors.sponsorship = "At least one sponsorship item is required."; }
         else { validSponsorRows.forEach((row) => { const displayIndex = sponsorshipRows.findIndex(r => r.localId === row.localId) + 1; if (!row.category.trim()) errors[`sponsor_category_${row.localId}`] = `Category required for sponsor ${displayIndex}.`; if (!row.amount.trim() || parseFloat(row.amount) < 0) errors[`sponsor_amount_${row.localId}`] = `Valid amount (>=0) required for sponsor ${displayIndex}.`; if (!row.reward.trim()) errors[`sponsor_reward_${row.localId}`] = `Reward required for sponsor ${displayIndex}.`; if (!row.mode.trim()) errors[`sponsor_mode_${row.localId}`] = `Mode required for sponsor ${displayIndex}.`; if (!row.about.trim()) errors[`sponsor_about_${row.localId}`] = `About required for sponsor ${displayIndex}.`; if (!row.benefit.trim()) errors[`sponsor_benefit_${row.localId}`] = `Benefit required for sponsor ${displayIndex}.`; }); }

        setFormErrors(errors);
        console.log("Validation Errors:", errors);
        return Object.keys(errors).length === 0;
    };

    // --- Form Submission (PUT Request) ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormErrors({}); // Clear previous errors
        setSubmitError(null); // Clear previous submit error

        if (!validateForm()) {
             const firstErrorKey = Object.keys(formErrors)[0];
             const firstErrorElement = document.getElementById(firstErrorKey) || document.querySelector(`[name*="${firstErrorKey}"], .border-red-500`); // Try finding by ID first
             if (firstErrorElement) { firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
             alert("Please fix the errors indicated on the form.");
             return;
        }

        if (!currentUser || !authToken || !proposalId) {
             alert("Authentication Error or missing Proposal ID."); return;
        }

        setIsSubmitting(true);

        // --- Prepare Data for PUT request (match API structure) ---
        const itemsToSubmit = detailedBudgetRows
            .filter(row => row.category && row.sub_category && row.quantity && row.cost) // Filter only valid rows
            .map(({ localId, amount, ...rest }) => ({ // Exclude localId and calculated amount
                ...rest,
                id: rest.id, // Include original ID if it exists
                type: rest.type,
                quantity: parseInt(rest.quantity, 10) || 0,
                cost: parseFloat(rest.cost) || 0, // Use parseFloat for cost if needed
                // Recalculate amount just before sending
                amount: (parseInt(rest.quantity, 10) || 0) * (parseFloat(rest.cost) || 0)
            }));

        const sponsorsToSubmit = sponsorshipRows
             .filter(row => row.category && row.amount && row.reward && row.mode && row.about && row.benefit) // Filter valid rows
             .map(({ localId, ...rest }) => ({ // Exclude localId
                 ...rest,
                 id: rest.id, // Include original ID if it exists
                 amount: parseFloat(rest.amount) || 0, // Use parseFloat
             }));

         // Ensure at least one item/sponsor if validation passed (redundant check, good practice)
         if (itemsToSubmit.length === 0) { alert("Please add at least one valid budget item."); setIsSubmitting(false); return; }
         if (sponsorsToSubmit.length === 0) { alert("Please add at least one valid sponsorship item."); setIsSubmitting(false); return; }


        const proposalUpdateData = {
             title: eventTitle.trim(),
             description: eventDescription.trim(),
             start: formatDateToYyyyMmDd(startDate)!, // Format as YYYY-MM-DD
             end: formatDateToYyyyMmDd(endDate)!,   // Format as YYYY-MM-DD
             category: category,
             past: pastEvents.trim() || null, // Send null if empty
             other: relevantDetails.trim() || null, // Send null if empty
             participant_expected: expectedParticipants ? parseInt(expectedParticipants, 10) : null,
             participant_categories: selectedParticipantCategories.length > 0 ? selectedParticipantCategories : null, // Send as array
             fund_uni: fundUniversity ? parseFloat(fundUniversity) : 0,
             fund_registration: fundRegistration ? parseFloat(fundRegistration) : 0,
             fund_sponsor: totalSponsorshipAmount > 0 ? totalSponsorshipAmount : 0, // Use calculated total
             fund_others: fundOther ? parseFloat(fundOther) : 0,
             chiefs: [{ // Array structure as per PUT docs
                 name: chiefGuestName.trim(),
                 designation: chiefGuestDesignation.trim(),
                 address: chiefGuestAddress.trim(),
                 phone: chiefGuestPhone.trim(),
                 pan: chiefGuestPan.trim(),
                 reason: chiefGuestReason.trim(),
                 hotel_name: hotelName.trim(),
                 hotel_address: hotelAddress.trim(),
                 hotel_duration: parseInt(hotelDuration, 10) || 0,
                 hotel_type: hotelType,
                 travel_name: travelName.trim(),
                 travel_address: travelAddress.trim(),
                 travel_duration: parseInt(travelDuration, 10) || 0,
                 travel_type: travelType,
             }],
             items: itemsToSubmit, // Use the prepared items array
             sponsors: sponsorsToSubmit, // Use the prepared sponsors array
             // student_categories: selectedStudentCategories.length > 0 ? selectedStudentCategories : null, // Include if needed by PUT
        };

        console.log("Submitting Updated Proposal Data:", JSON.stringify(proposalUpdateData, null, 2));

        const apiEndpoint = `${API_BASE_URL}/api/faculty/proposals/${proposalId}`;

        try {
            const response = await axios.put(apiEndpoint, proposalUpdateData, {
                 headers: {
                     'Content-Type': 'application/json',
                     'Authorization': `Bearer ${authToken}`,
                     'Accept': 'application/json'
                 },
             });

            console.log('Update Success:', response.data);
            alert(`Proposal Updated Successfully!`);
            // Redirect back to dashboard or proposal list after successful update
            router.push('/dashboard'); // Adjust redirect path as needed

        } catch (error: any) {
            console.error('Update Proposal Error:', error);
            let errorMessage = "Failed to update proposal.";
            if (axios.isAxiosError(error)) {
                const responseData = error.response?.data;
                errorMessage = responseData?.message || error.message;
                if (error.response?.status === 422 && responseData?.errors) {
                    errorMessage = "Submission failed due to validation errors.";
                     const backendErrors: Record<string, string> = {};
                     Object.keys(responseData.errors).forEach(field => {
                         // Attempt basic mapping (may need refinement based on API error structure)
                         const frontendKey = field.replace(/\.(\d+)\./g, '_$1_').replace(/\./g, '_'); // Map items.0.category to items_0_category
                         backendErrors[frontendKey] = responseData.errors[field][0];
                     });
                     setFormErrors(prev => ({ ...prev, ...backendErrors }));
                     console.log("Backend validation errors mapped:", backendErrors);
                 } else if (error.response?.status === 401) {
                     errorMessage = "Authentication error. Please log in again.";
                     // Optional: logout(); router.push('/login');
                 }
             } else {
                 errorMessage = error.message || errorMessage;
             }
            setSubmitError(errorMessage); // Set submit error state
            alert(`Error: ${errorMessage}`); // Show alert as well
        } finally {
            setIsSubmitting(false);
        }
    };


    // --- Render Logic ---
    if (isFetching) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                <span className="ml-3 text-lg text-gray-700">Loading Proposal Data...</span>
            </div>
        );
    }

    if (fetchError) {
         return (
             <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4">
                 <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                 <p className="text-red-700 text-lg font-semibold mb-2">Error Loading Proposal</p>
                 <p className="text-gray-600 mb-4 text-center">{fetchError}</p>
                 <button
                    onClick={() => router.back()} // Go back to previous page
                    className="btn btn-primary"
                 >
                     Go Back
                 </button>
             </div>
         );
     }

    if (!currentUser) {
        // Should be handled by auth useEffect redirect, but added as fallback
        return <div className="flex justify-center items-center min-h-screen">Authenticating...</div>;
    }

    // --- Main Form JSX ---
    // This structure should be identical to your EventProposalForm component's return JSX
    // Just ensure all `value` and `onChange` props use the state variables defined *in this component*
    return (
        <>
            <div className="bg-gray-50 min-h-screen w-full">
                <div className="flex justify-center items-start py-12 px-4">
                    <div className="bg-white shadow-lg border border-gray-200 rounded-xl max-w-7xl w-full mx-auto">
                        <div className="card-body p-8 md:p-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-10">
                                Edit Event Proposal (ID: {proposalId})
                            </h2>
                            {/* Convener Info Display */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-10 p-5 bg-blue-50 rounded-lg border border-blue-100">
                                <div><label className="block text-gray-600 text-sm font-medium mb-1">Convener Name</label><p className="text-gray-900 break-words">{currentUser?.name || '...'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-medium mb-1">Convener Email</label><p className="text-gray-900 break-words">{currentUser?.email || '...'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-medium mb-1">Department</label><p id="organizing-department" className="text-gray-900 break-words">{currentUser?.department || '...'}</p></div>
                            </div>

                             {/* Display Submit Error */}
                             {submitError && (
                                <div className="alert alert-error shadow-md mb-6">
                                    <div>
                                        <AlertCircle className="stroke-current shrink-0 h-6 w-6" />
                                        <span>Error updating proposal: {submitError}</span>
                                    </div>
                                </div>
                             )}

                            <form className="space-y-10" onSubmit={handleSubmit} noValidate>
                                {/* --- Section: Event Details --- */}
                                <section>
                                    <SectionHeader title="Event Details" icon={<Info size={22} />} required />
                                    <div className="space-y-5">
                                        <InputField label="Event Title" id="eventTitle" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} error={formErrors.eventTitle} required maxLength={255}/>
                                        <TextAreaField label="Event Description" id="eventDescription" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} error={formErrors.eventDescription} required />
                                        <SelectField label="Event Category" id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof EVENT_CATEGORIES[number])} error={formErrors.category} required>
                                            <option value="" disabled>Select Category</option>
                                            {EVENT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>))}
                                        </SelectField>
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
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <TextAreaField label="Past Relevant Events (Optional)" id="pastEvents" value={pastEvents} onChange={(e) => setPastEvents(e.target.value)} error={formErrors.past}/>
                                            <TextAreaField label="Other Relevant Details (Optional)" id="relevantDetails" value={relevantDetails} onChange={(e) => setRelevantDetails(e.target.value)} error={formErrors.other}/>
                                        </div>
                                    </div>
                                </section>

                                {/* --- Section: Participants --- */}
                                <section>
                                    <SectionHeader title="Participants" icon={<Users size={22} />} />
                                    <div className="space-y-5">
                                         <InputField label="Total Expected Participants (Optional)" id="expectedParticipants" type="number" min="0" placeholder="e.g., 150" className="input input-bordered w-full md:w-1/2 bg-white text-gray-900" value={expectedParticipants} onChange={(e) => setExpectedParticipants(e.target.value)} error={formErrors.participant_expected} />
                                         <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Category of Participants (Optional)</label>
                                            <div className="flex flex-wrap gap-2"> {participantCategories.map((pCat) => ( <button type="button" key={pCat} className={`btn btn-sm normal-case font-medium rounded-full ${selectedParticipantCategories.includes(pCat) ? 'btn-primary text-white' : 'btn-outline border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400'}`} onClick={() => toggleParticipantCategory(pCat)}>{pCat}</button>))} </div>
                                            {formErrors.participant_categories && <p className="mt-1 text-xs text-red-600">{formErrors.participant_categories}</p>}
                                        </div>
                                         {selectedParticipantCategories.includes("Students (Category)") && (
                                            <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200"> <label className="block text-sm font-medium text-gray-700 mb-2">Select Student Departments (Optional)</label> <div className="flex flex-wrap gap-2"> {studentCategories.map((sCat) => (<button type="button" key={sCat} className={`btn btn-xs normal-case font-medium rounded-full ${selectedStudentCategories.includes(sCat) ? 'bg-blue-500 border-blue-500 text-white' : 'btn-outline border-gray-300 text-gray-600 hover:bg-blue-50'}`} onClick={() => toggleStudentCategory(sCat)}>{sCat}</button>))} </div> {formErrors.student_categories && <p className="mt-1 text-xs text-red-600">{formErrors.student_categories}</p>} </div>
                                        )}
                                     </div>
                                </section>

                                {/* --- Section: Chief Guest Details --- */}
                                <section>
                                    <SectionHeader title="Chief Guest Details" icon={<UserCheck size={22} />} required />
                                    <p className="text-sm text-gray-600 mb-5 -mt-4">Details for the primary Chief Guest.</p>
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5"> <InputField label="Name" id="chiefGuestName" value={chiefGuestName} onChange={(e) => setChiefGuestName(e.target.value)} error={formErrors.chiefGuestName} required maxLength={255}/> <InputField label="Designation" id="chiefGuestDesignation" value={chiefGuestDesignation} onChange={(e) => setChiefGuestDesignation(e.target.value)} error={formErrors.chiefGuestDesignation} required maxLength={255}/> </div>
                                         <InputField label="Address" id="chiefGuestAddress" value={chiefGuestAddress} onChange={(e) => setChiefGuestAddress(e.target.value)} error={formErrors.chiefGuestAddress} required maxLength={500}/>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-5"> <InputField label="Phone" id="chiefGuestPhone" type="tel" value={chiefGuestPhone} onChange={(e) => setChiefGuestPhone(e.target.value)} error={formErrors.chiefGuestPhone} required maxLength={20}/> <InputField label="PAN" id="chiefGuestPan" value={chiefGuestPan} onChange={(e) => setChiefGuestPan(e.target.value)} error={formErrors.chiefGuestPan} required maxLength={10}/> <InputField label="Reason for Inviting" id="chiefGuestReason" value={chiefGuestReason} onChange={(e) => setChiefGuestReason(e.target.value)} error={formErrors.chiefGuestReason} required maxLength={500}/> </div>
                                    </div>
                                </section>

                                {/* --- Section: Accommodation & Travel (Chief Guest) --- */}
                                <section>
                                    <SectionHeader title="Accommodation & Travel (Chief Guest)" icon={<BedDouble size={22} />} required />
                                     <div className="space-y-6">
                                         <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end"> <InputField label="Hotel Name" id="hotelName" value={hotelName} onChange={e => setHotelName(e.target.value)} error={formErrors.hotelName || formErrors.hotel_name} required maxLength={255}/> <InputField label="Hotel Address" id="hotelAddress" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} error={formErrors.hotelAddress || formErrors.hotel_address} required maxLength={500}/> <InputField label="Duration (days)" id="hotelDuration" type="number" min="1" value={hotelDuration} onChange={e => setHotelDuration(e.target.value)} error={formErrors.hotelDuration || formErrors.hotel_duration} required/> <SelectField label="Hotel Type" id="hotelType" value={hotelType} onChange={e => setHotelType(e.target.value as typeof HOTEL_TYPES[number])} error={formErrors.hotelType || formErrors.hotel_type} required> <option value="srm">SRM Arranged</option> <option value="others">External/Other</option> </SelectField> </div>
                                          <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end"> <InputField label="Travel Mode/Name" id="travelName" value={travelName} onChange={e => setTravelName(e.target.value)} error={formErrors.travelName || formErrors.travel_name} required maxLength={255}/> <InputField label="Travel To/From Address" id="travelAddress" value={travelAddress} onChange={e => setTravelAddress(e.target.value)} error={formErrors.travelAddress || formErrors.travel_address} required maxLength={500}/> <InputField label="Travel Duration (days/trips)" id="travelDuration" type="number" min="1" value={travelDuration} onChange={e => setTravelDuration(e.target.value)} error={formErrors.travelDuration || formErrors.travel_duration} required/> <SelectField label="Travel Type" id="travelType" value={travelType} onChange={e => setTravelType(e.target.value as typeof TRAVEL_TYPES[number])} error={formErrors.travelType || formErrors.travel_type} required> <option value="srm">SRM Provided</option> <option value="others">External/Other</option> </SelectField> </div>
                                     </div>
                                 </section>

                                 {/* --- Section: Financial Details --- */}
                                <section>
                                    <SectionHeader title="Financial Details" icon={<DollarSign size={22} />} required/>
                                    <div className="space-y-8">
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-3">Funding Sources (₹) <span className="text-xs font-normal text-gray-500">(Estimates)</span></h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> <InputField label="University Fund" id="fundUniversity" type="number" min="0" value={fundUniversity} onChange={(e) => setFundUniversity(e.target.value)} error={formErrors.fund_uni} /> <InputField label="Registration Fund" id="fundRegistration" type="number" min="0" value={fundRegistration} onChange={(e) => setFundRegistration(e.target.value)} error={formErrors.fund_registration}/> <div> <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fundSponsorship">Sponsorship Fund</label> <input type="number" id="fundSponsorship" value={fundSponsorship} className="input input-bordered w-full bg-gray-100 text-gray-700" readOnly title="Auto-calculated from sponsors table" /> {formErrors.fund_sponsor && <p className="mt-1 text-xs text-red-600">{formErrors.fund_sponsor}</p>} </div> <InputField label="Other Sources" id="fundOther" type="number" min="0" value={fundOther} onChange={(e) => setFundOther(e.target.value)} error={formErrors.fund_others}/> </div>
                                        </div>

                                        {/* === DETAILED BUDGET TABLE === */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2"> <FileText size={18} /> Detailed Budget <span className="text-red-500 text-sm">*</span></h4>
                                            <p className="text-sm text-gray-600 mb-4">Update or add expense items.</p>
                                            {formErrors.detailedBudget && <p className="mb-2 text-sm text-red-600">{formErrors.detailedBudget}</p>}
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                                                <table className="table w-full table-auto">
                                                     {/* Table Head */}
                                                    <thead className="bg-gray-50"> <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"> <th className="p-3 w-10">#</th> <th className="p-3 min-w-[250px]">Category / Subcategory <span className="text-red-500">*</span></th> <th className="p-3 text-center">Location Type</th> <th className="p-3 text-center">Qty <span className="text-red-500">*</span></th> <th className="p-3 text-center">Cost/Unit (₹) <span className="text-red-500">*</span></th> <th className="p-3 text-right">Total (₹)</th> <th className="p-3 text-center w-16">Action</th> </tr> </thead>
                                                    <tbody>
                                                        {detailedBudgetRows.map((row, index) => {
                                                            // Variables for errors specific to this row
                                                            const catError = formErrors[`budget_category_${row.localId}`]; const subCatError = formErrors[`budget_sub_category_${row.localId}`]; const qtyError = formErrors[`budget_quantity_${row.localId}`]; const costError = formErrors[`budget_cost_${row.localId}`]; const typeError = formErrors[`budget_type_${row.localId}`];
                                                            return (
                                                                <tr key={row.localId} id={`budget_row_${row.localId}`} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 text-sm">
                                                                    <td className="p-2 font-medium text-gray-500 text-center align-middle">{index + 1}</td>
                                                                    <td className="p-2 space-y-1 align-top">
                                                                        {/* Category Select */}
                                                                        <div> <label htmlFor={`${budgetBaseId}-main-category-${row.localId}`} className="sr-only">Category {index + 1}</label> <select id={`${budgetBaseId}-main-category-${row.localId}`} name={`budget_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-800 ${catError ? 'border-red-500' : 'border-gray-300'}`} value={row.category || ""} onChange={(e) => handleDetailedBudgetChange(row.localId, 'category', e.target.value)} required> <option value="" disabled>Select Category</option> <option value="Budgetary Expenditures">Budgetary Expenditures</option> <option value="Publicity">Publicity</option> <option value="General">General</option> <option value="Honorarium">Honorarium</option> <option value="Hospitality">Hospitality</option> <option value="Inaugural and Valedictory">Inaugural & Valedictory</option> <option value="Resource Materials">Resource Materials</option> <option value="Conference Paper Publication">Paper Publication</option> <option value="Miscellaneous">Miscellaneous</option> </select> {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>} </div>
                                                                        {/* Subcategory Select */}
                                                                        <div> <label htmlFor={`${budgetBaseId}-sub-category-${row.localId}`} className="sr-only">Subcategory {index + 1}</label> <select id={`${budgetBaseId}-sub-category-${row.localId}`} name={`budget_sub_category_${row.localId}`} className={`select select-bordered select-xs w-full bg-white text-gray-700 ${subCatError ? 'border-red-500' : 'border-gray-300'}`} value={row.sub_category || ""} onChange={(e) => handleDetailedBudgetChange(row.localId, 'sub_category', e.target.value)} required disabled={!row.category}> <option value="" disabled>Select Subcategory</option> {/* Conditional Options */} {row.category === "Budgetary Expenditures" && (<><option value="Number of Sessions Planned">Sessions Planned</option><option value="Number of Keynote Speakers">Keynote Speakers</option><option value="Number of Session Judges">Session Judges</option><option value="Number of Celebrities / Chief Guests">Celebrities/Guests</option></>)} {row.category === "Publicity" && (<><option value="Invitation">Invitation</option><option value="Press Coverage">Press Coverage</option><option value="Brochures/Flyers">Brochures/Flyers</option><option value="Website/Social Media">Website/Social Media</option></>)} {row.category === "General" && (<><option value="Conference Kits">Conference Kits</option><option value="Printing and Stationery">Printing/Stationery</option><option value="Secretarial Expenses">Secretarial Expenses</option><option value="Mementos">Mementos</option><option value="Certificates">Certificates</option></>)} {row.category === "Honorarium" && (<><option value="Keynote Speakers">Keynote Speakers</option><option value="Session Judges">Session Judges</option><option value="Chief Guests">Chief Guests</option><option value="Invited Speakers">Invited Speakers</option></>)} {row.category === "Hospitality" && (<><option value="Train / Flight for Chief Guest / Keynote Speakers">Travel (Guests)</option><option value="Accommodation for Chief Guest / Keynote Speakers">Accommodation (Guests)</option><option value="Food and Beverages for Chief Guest / Keynote Speakers">Food (Guests)</option><option value="Local Travel Expenses">Local Travel</option><option value="Food for Participants">Food (Participants)</option><option value="Food & Snacks for Volunteers / Organizers">Food/Snacks (Team)</option><option value="Hostel Accommodation">Hostel Accommodation</option></>)} {row.category === "Inaugural and Valedictory" && (<><option value="Banners, Pandal etc">Banners/Pandal</option><option value="Lighting and Decoration">Lighting/Decoration</option><option value="Flower Bouquet">Flower Bouquet</option><option value="Cultural Events">Cultural Events</option><option value="Field Visits / Sightseeing">Field Visits</option></>)} {row.category === "Resource Materials" && (<><option value="Preparation, Printing, Binding">Preparation/Printing</option><option value="Software/Licenses">Software/Licenses</option></>)} {row.category === "Conference Paper Publication" && (<><option value="Extended Abstract">Extended Abstract</option><option value="Full Paper">Full Paper</option><option value="Journal Publication Fees">Journal Fees</option><option value="Proceedings">Proceedings</option></>)} {row.category === "Miscellaneous" && (<><option value="Contingency">Contingency</option><option value="Bank Charges">Bank Charges</option><option value="Other Unforeseen">Other Unforeseen</option></>)} </select> {subCatError && <p className="mt-1 text-xs text-red-600">{subCatError}</p>} </div>
                                                                    </td>
                                                                    {/* Location Type Radios */}
                                                                    <td className="p-2 align-middle text-center"> <div role="group" className={`flex flex-col justify-center items-center space-y-1 ${typeError ? ' p-1 rounded border border-red-400 bg-red-50' : ''}`}> <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${budgetBaseId}-type-${row.localId}`} value="Domestic" className="radio radio-xs checked:bg-blue-500 border-gray-300" checked={row.type === "Domestic"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'Domestic')} /> Domestic </label> <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-700"><input type="radio" name={`${budgetBaseId}-type-${row.localId}`} value="International" className="radio radio-xs checked:bg-blue-500 border-gray-300" checked={row.type === "International"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'International')} /> International </label> </div> {typeError && <p className="mt-1 text-xs text-red-600">{typeError}</p>} </td>
                                                                    {/* Quantity Input */}
                                                                    <td className="p-2 text-center align-middle"> <label htmlFor={`${budgetBaseId}-quantity-${row.localId}`} className="sr-only">Quantity {index + 1}</label> <input type="number" id={`${budgetBaseId}-quantity-${row.localId}`} name={`budget_quantity_${row.localId}`} min="1" className={`input input-bordered input-xs w-20 text-right bg-white text-gray-700 ${qtyError ? 'border-red-500' : 'border-gray-300'}`} value={row.quantity} onChange={(e) => handleDetailedBudgetChange(row.localId, 'quantity', e.target.value)} required /> {qtyError && <p className="mt-1 text-xs text-red-600">{qtyError}</p>} </td>
                                                                    {/* Cost Input */}
                                                                    <td className="p-2 text-center align-middle"> <label htmlFor={`${budgetBaseId}-cost-${row.localId}`} className="sr-only">Cost per Unit {index + 1}</label> <input type="number" id={`${budgetBaseId}-cost-${row.localId}`} name={`budget_cost_${row.localId}`} min="0" step="0.01" className={`input input-bordered input-xs w-24 text-right bg-white text-gray-700 ${costError ? 'border-red-500' : 'border-gray-300'}`} value={row.cost} onChange={(e) => handleDetailedBudgetChange(row.localId, 'cost', e.target.value)} required /> {costError && <p className="mt-1 text-xs text-red-600">{costError}</p>} </td>
                                                                    {/* Total Display */}
                                                                    <td className="p-2 font-medium text-right align-middle text-gray-700">{parseFloat(row.amount || '0').toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td>
                                                                    {/* Delete Button */}
                                                                    <td className="p-2 text-center align-middle"> <button type="button" onClick={() => deleteDetailedBudgetRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete budget row ${index + 1}`}><Trash2 className="h-4 w-4" /></button> </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                     {/* Table Foot */}
                                                    <tfoot> <tr className="bg-gray-100 font-semibold text-gray-700 text-sm"> <td colSpan={5} className="text-right p-3">Total Estimated Budget:</td> <td className="text-right p-3">{totalDetailedBudget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td> <td className="p-3"></td> </tr> </tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addDetailedBudgetRow} className="btn btn-sm btn-outline btn-primary mt-4 rounded-full flex items-center gap-1 normal-case font-medium"> <PlusCircle size={16} /> Add Budget Item </button>
                                        </div>

                                        {/* === SPONSORSHIP TABLE === */}
                                        <div>
                                            <h4 className="text-lg font-medium text-gray-800 mb-2 flex items-center gap-2"><Award size={18}/> Sponsorship Details <span className="text-red-500 text-sm">*</span></h4>
                                            <p className="text-sm text-gray-600 mb-4">Update or add sponsor details.</p>
                                            {formErrors.sponsorship && <p className="mb-2 text-sm text-red-600">{formErrors.sponsorship}</p>}
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                                                <table className="table w-full table-compact">
                                                     {/* Table Head */}
                                                    <thead className="bg-gray-100"> <tr className="text-left text-gray-600 uppercase text-xs tracking-wider"> <th className="p-3 w-10">#</th> <th className="p-3">Category <span className="text-red-500">*</span></th> <th className="p-3 text-right">Amount (₹) <span className="text-red-500">*</span></th> <th className="p-3">Reward <span className="text-red-500">*</span></th> <th className="p-3">Mode <span className="text-red-500">*</span></th> <th className="p-3">Benefit/Output <span className="text-red-500">*</span></th> <th className="p-3 text-center w-16">Action</th> </tr> </thead>
                                                    <tbody>
                                                        {sponsorshipRows.map((row, index) => {
                                                            // Error variables specific to this row
                                                             const catError = formErrors[`sponsor_category_${row.localId}`]; const amountError = formErrors[`sponsor_amount_${row.localId}`]; const rewardError = formErrors[`sponsor_reward_${row.localId}`]; const modeError = formErrors[`sponsor_mode_${row.localId}`]; const benefitError = formErrors[`sponsor_benefit_${row.localId}`]; const aboutError = formErrors[`sponsor_about_${row.localId}`];
                                                            return (
                                                                <React.Fragment key={row.localId}>
                                                                    {/* First Row Inputs */}
                                                                    <tr className="border-t border-gray-200 hover:bg-gray-50/50 text-sm">
                                                                        <td className="p-2 font-medium text-gray-500 align-middle text-center">{index + 1}</td>
                                                                        <td className="p-2 align-middle"> <label htmlFor={`${sponsorBaseId}-category-${row.localId}`} className="sr-only">Sponsor Category {index + 1}</label> <input type="text" id={`${sponsorBaseId}-category-${row.localId}`} name={`sponsor_category_${row.localId}`} placeholder="e.g., Title Sponsor" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${catError ? 'border-red-500' : 'border-gray-300'}`} value={row.category} onChange={(e) => handleSponsorshipChange(row.localId, 'category', e.target.value)} required /> {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>} </td>
                                                                        <td className="p-2 text-right align-middle"> <label htmlFor={`${sponsorBaseId}-amount-${row.localId}`} className="sr-only">Sponsor Amount {index + 1}</label> <input type="number" id={`${sponsorBaseId}-amount-${row.localId}`} name={`sponsor_amount_${row.localId}`} min="0" placeholder="Amount" className={`input input-bordered input-xs w-24 text-right bg-white text-gray-700 ${amountError ? 'border-red-500' : 'border-gray-300'}`} value={row.amount} onChange={(e) => handleSponsorshipChange(row.localId, 'amount', e.target.value)} required /> {amountError && <p className="mt-1 text-xs text-red-600">{amountError}</p>} </td>
                                                                        <td className="p-2 align-middle"> <label htmlFor={`${sponsorBaseId}-reward-${row.localId}`} className="sr-only">Sponsor Reward {index + 1}</label> <input type="text" id={`${sponsorBaseId}-reward-${row.localId}`} name={`sponsor_reward_${row.localId}`} placeholder="Reward/Perk" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${rewardError ? 'border-red-500' : 'border-gray-300'}`} value={row.reward} onChange={(e) => handleSponsorshipChange(row.localId, 'reward', e.target.value)} required /> {rewardError && <p className="mt-1 text-xs text-red-600">{rewardError}</p>} </td>
                                                                        <td className="p-2 align-middle"> <label htmlFor={`${sponsorBaseId}-mode-${row.localId}`} className="sr-only">Sponsor Mode {index + 1}</label> <input type="text" id={`${sponsorBaseId}-mode-${row.localId}`} name={`sponsor_mode_${row.localId}`} placeholder="e.g., Cash, Kind" className={`input input-bordered input-xs w-full bg-white text-gray-700  ${modeError ? 'border-red-500' : 'border-gray-300'}`} value={row.mode} onChange={(e) => handleSponsorshipChange(row.localId, 'mode', e.target.value)} required /> {modeError && <p className="mt-1 text-xs text-red-600">{modeError}</p>} </td>
                                                                        <td className="p-2 align-middle"> <label htmlFor={`${sponsorBaseId}-benefit-${row.localId}`} className="sr-only">Sponsor Benefit {index + 1}</label> <input type="text" id={`${sponsorBaseId}-benefit-${row.localId}`} name={`sponsor_benefit_${row.localId}`} placeholder="Benefit to Event" className={`input input-bordered input-xs w-full bg-white text-gray-700 ${benefitError ? 'border-red-500' : 'border-gray-300'}`} value={row.benefit} onChange={(e) => handleSponsorshipChange(row.localId, 'benefit', e.target.value)} required /> {benefitError && <p className="mt-1 text-xs text-red-600">{benefitError}</p>} </td>
                                                                        <td className="p-2 text-center align-middle"> <button type="button" onClick={() => deleteSponsorshipRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete sponsor row ${index + 1}`}><Trash2 className="h-4 w-4" /></button> </td>
                                                                    </tr>
                                                                    {/* Second Row About */}
                                                                    <tr className="border-b border-gray-200 bg-gray-50/30 hover:bg-gray-50/50"> <td colSpan={7} className="px-3 py-2"> <label htmlFor={`${sponsorBaseId}-about-${row.localId}`} className="block text-gray-600 text-xs font-medium mb-1">About Sponsor {index + 1} <span className="text-red-500">*</span></label> <textarea id={`${sponsorBaseId}-about-${row.localId}`} name={`sponsor_about_${row.localId}`} rows={1} className={`textarea textarea-bordered textarea-xs w-full bg-white text-gray-700 p-1.5 ${aboutError ? 'border-red-500' : 'border-gray-300'}`} value={row.about} onChange={(e) => handleSponsorshipChange(row.localId, 'about', e.target.value)} placeholder="Brief details about the sponsor..." required /> {aboutError && <p className="mt-1 text-xs text-red-600">{aboutError}</p>} </td> </tr>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                      {/* Table Foot */}
                                                     <tfoot> <tr className="bg-gray-100 font-semibold text-gray-700 text-sm"> <td colSpan={2} className="text-right p-3">Total Sponsorship Amount:</td> <td className="text-right p-3">{totalSponsorshipAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}</td> <td colSpan={4} className="p-3"></td> </tr> </tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addSponsorshipRow} className="btn btn-outline btn-primary btn-sm mt-4 rounded-full flex items-center gap-1 normal-case font-medium"> <PlusCircle size={16} /> Add Sponsor </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Submit Button Area */}
                                <div className="mt-12 pt-8 border-t border-gray-200 flex justify-center">
                                    <button type="submit" className="btn btn-primary btn-lg rounded-full text-lg font-semibold px-10 py-3 shadow-md hover:shadow-lg disabled:opacity-50" disabled={isSubmitting || isFetching || !authToken}>
                                        {isSubmitting ? (<span className="loading loading-spinner loading-sm"></span>) : ('Update Proposal')}
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