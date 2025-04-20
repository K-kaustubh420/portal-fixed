"use client";
import React, { useState, useEffect, useCallback, useRef, useId } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Trash2, PlusCircle, Info, Users, UserCheck, BedDouble,  DollarSign, FileText, Award, CalendarDays } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { loadAuthData, User } from '@/lib/users';

// Interfaces (Keep these as they are)
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

interface ChiefGuestRow {
    localId: string;
    name: string;
    designation: string;
    address: string;
    phone: string;
    pan: string;
    reason: string;
}

// Enums / Constants (Keep these as they are)
const HOTEL_TYPES = ['srm', 'others'] as const;
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

// --- Helper Component for Section Headers ---
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode; required?: boolean }> = ({ title, icon, required }) => (
    <div className="flex items-center gap-2 mb-5">
        {icon && <span className="text-blue-600">{icon}</span>}
        <h3 className="text-xl font-semibold text-gray-800">
            {title} {required && <span className="text-red-500 align-middle">*</span>}
        </h3>
    </div>
);

// --- Main Component ---
export default function EventProposalForm() {
    // Remove useAuth hook
    // const { user } = useAuth();
    const searchParams = useSearchParams();

    // --- State for User and Token loaded from localStorage ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // --- Stable ID Generation ---
    const chiefGuestBaseId = useId();
    const budgetBaseId = useId();
    const sponsorBaseId = useId();
    const nextLocalIdSuffix = useRef(1);

    const generateLocalId = () => {
        return `row-${nextLocalIdSuffix.current++}`;
    }

    // --- State Variables (No change needed in definitions) ---
    const [proposalId, setProposalId] = useState<string | null>(null);
    const [eventTitle, setEventTitle] = useState('');
    const [eventDescription, setEventDescription] = useState('');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
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
    const [hotelName, setHotelName] = useState('SRM Hostel');
    const [hotelAddress, setHotelAddress] = useState('SRM University');
    const [hotelDuration, setHotelDuration] = useState('5');
    const [hotelType, setHotelType] = useState<typeof HOTEL_TYPES[number]>('srm');
    const [travelName, setTravelName] = useState('Car');
    const [travelAddress, setTravelAddress] = useState('Guindy');
    const [travelDuration, setTravelDuration] = useState('1');
    const [travelType, setTravelType] = useState<typeof TRAVEL_TYPES[number]>('srm');
    const [chiefGuestRows, setChiefGuestRows] = useState<ChiefGuestRow[]>([
        { localId: generateLocalId(), name: '', designation: '', address: '', phone: '', pan: '', reason: '' },
    ]);
    const [detailedBudgetRows, setDetailedBudgetRows] = useState<DetailedBudgetRow[]>([
        { localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' },
    ]);
    const [sponsorshipRows, setSponsorshipRows] = useState<SponsorshipRow[]>([
        { localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }
    ]);
    const [dateConflictError, setDateConflictError] = useState<string | null>(null); // Keep this if needed for other checks

    // --- Derived State Calculations (No change needed) ---
    const totalDetailedBudget = detailedBudgetRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalSponsorshipAmount = sponsorshipRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    // --- Effects ---

    // Load user data and token from localStorage on component mount
    useEffect(() => {
        const { user: loadedUser, token: loadedToken } = loadAuthData();
        setCurrentUser(loadedUser);
        setAuthToken(loadedToken);
        console.log('Form mounted: Loaded auth data - User:', loadedUser, 'Token exists:', !!loadedToken);
    }, []); // Empty dependency array ensures this runs only once on mount


    useEffect(() => { setEstimatedBudget(totalDetailedBudget.toString()); }, [totalDetailedBudget]);
    useEffect(() => { setFundSponsorship(totalSponsorshipAmount.toString()); }, [totalSponsorshipAmount]);

    const calculateDuration = useCallback(() => {
        if (!startDate || !endDate) { setDurationEvent(""); return; }
        if (endDate < startDate) { setDurationEvent("End date cannot be before start date"); return; }
        const diffMs = endDate.getTime() - startDate.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setDurationEvent(`${days} days, ${hours} hours, ${minutes} minutes`);
    }, [startDate, endDate]);
    useEffect(() => { calculateDuration(); }, [calculateDuration, startDate, endDate]);

    useEffect(() => {
        const editMode = searchParams.get('edit');
        if (editMode === 'true') {
            // Logic for fetching and populating data in edit mode would go here
            // For now, just setting the proposal ID if present
            setProposalId(searchParams.get('proposalId') || null);
            // You would typically fetch the proposal details using the ID and token here
            // and populate all the state variables.
            console.log("Edit mode detected, Proposal ID:", searchParams.get('proposalId'));
        } else {
            // Reset IDs and initial rows when not in edit mode or on component mount
            nextLocalIdSuffix.current = 1;
            setChiefGuestRows([{ localId: generateLocalId(), name: '', designation: '', address: '', phone: '', pan: '', reason: '' }]);
            setDetailedBudgetRows([{ localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
            setSponsorshipRows([{ localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
        }
    }, [searchParams]); // Rerun if search params change


    // --- Handler Functions (No change needed in logic) ---
    // These functions don't depend on the auth context directly
    const addDetailedBudgetRow = () => setDetailedBudgetRows(prev => [...prev, { localId: generateLocalId(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
    const deleteDetailedBudgetRow = (idToDelete: string) => setDetailedBudgetRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleDetailedBudgetChange = (idToUpdate: string, field: keyof DetailedBudgetRow, value: string | 'Domestic' | 'International' | null) => {
        setDetailedBudgetRows(prevRows => prevRows.map(row => {
            if (row.localId === idToUpdate) {
                const updatedRow = { ...row, [field]: value };
                if (field === 'quantity' || field === 'cost') {
                    const quantity = parseFloat(updatedRow.quantity) || 0;
                    const cost = parseFloat(updatedRow.cost) || 0;
                    updatedRow.amount = (quantity * cost).toString();
                }
                 if (field === 'type') {
                     updatedRow.type = value as 'Domestic' | 'International' | null;
                 }
                return updatedRow;
            }
            return row;
        }));
    };

    const addSponsorshipRow = () => setSponsorshipRows(prev => [...prev, { localId: generateLocalId(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
    const deleteSponsorshipRow = (idToDelete: string) => setSponsorshipRows(prev => prev.filter(row => row.localId !== idToDelete));
    const handleSponsorshipChange = (idToUpdate: string, field: keyof SponsorshipRow, value: string) => setSponsorshipRows(prev => prev.map(row => row.localId === idToUpdate ? { ...row, [field]: value } : row));

    const addChiefGuestRow = () => setChiefGuestRows(prev => [...prev, { localId: generateLocalId(), name: '', designation: '', address: '', phone: '', pan: '', reason: '' }]);
    const deleteChiefGuestRow = (idToDelete: string) => { if (chiefGuestRows.length > 1) { setChiefGuestRows(prev => prev.filter(row => row.localId !== idToDelete)); } else { alert("At least one chief guest entry is needed."); } };
    const handleChiefGuestChange = (idToUpdate: string, field: keyof ChiefGuestRow, value: string) => setChiefGuestRows(prev => prev.map(row => row.localId === idToUpdate ? { ...row, [field]: value } : row));

    const toggleParticipantCategory = (category: string) => setSelectedParticipantCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    const toggleStudentCategory = (category: string) => setSelectedStudentCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);

    // --- Form Submission (Corrected Structure) ---
     const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
         e.preventDefault();
         // --- Use state variables for user and token ---
         if (!currentUser || !authToken) {
             alert("Authentication Error: User details or token not found. Please log in again.");
             console.error("Submit Error: currentUser or authToken missing.");
             return;
         }
         // --- Keep other validation checks ---
         if (!startDate || !endDate) { alert("Please select the event start and end dates."); return; }
         if (endDate < startDate) { alert("Event end date cannot be before the start date."); return; }
         if (!eventTitle || !eventDescription || !category) { alert("Please fill in the required Event Details (Title, Description, Category)."); return; }
         const chiefGuestToSend = chiefGuestRows[0];
         if (!chiefGuestToSend || !chiefGuestToSend.name || !chiefGuestToSend.designation || !chiefGuestToSend.address || !chiefGuestToSend.phone || !chiefGuestToSend.pan || !chiefGuestToSend.reason) { alert("Please complete all required Chief Guest details."); return; }
         if (!hotelName || !hotelAddress || !hotelDuration || !hotelType || !travelName || !travelAddress || !travelDuration || !travelType) { alert("Please complete all required Accommodation & Travel details for the Chief Guest."); return; }
         if (detailedBudgetRows.length === 0 || detailedBudgetRows.some(r => !r.category || !r.sub_category || !r.quantity || !r.cost)) { alert("Please add at least one Detailed Budget item and fill in its required fields (Category, Subcategory, Quantity, Cost)."); return; }
         if (sponsorshipRows.length === 0 || sponsorshipRows.some(r => !r.category || !r.amount || !r.reward || !r.mode || !r.about || !r.benefit)) { alert("Please add at least one Sponsorship item and fill in all its fields."); return; }
         // --- End validation checks ---

        // ***** CORRECTED STRUCTURE *****
        const proposalData = {
             title: eventTitle, description: eventDescription,
            start: startDate.toISOString(), end: endDate.toISOString(), category: category,
            past: pastEvents || null, other: relevantDetails || null,
            participant_expected: expectedParticipants ? parseInt(expectedParticipants, 10) : null,
            participant_categories: selectedParticipantCategories.length > 0 ? selectedParticipantCategories : null,
            fund_uni: fundUniversity ? parseInt(fundUniversity, 10) : null,
            fund_registration: fundRegistration ? parseInt(fundRegistration, 10) : null,
            fund_sponsor: fundSponsorship ? parseInt(fundSponsorship, 10) : null, // Still calculated locally
            fund_others: fundOther ? parseInt(fundOther, 10) : null,
            chief: {
                // Guest Details
                name: chiefGuestToSend.name,
                designation: chiefGuestToSend.designation,
                address: chiefGuestToSend.address,
                phone: chiefGuestToSend.phone,
                pan: chiefGuestToSend.pan,
                reason: chiefGuestToSend.reason,
                // --- NESTED Hotel Details ---
                hotel_name: hotelName,
                hotel_address: hotelAddress,
                hotel_duration: parseInt(hotelDuration, 10) || 0,
                hotel_type: hotelType,
                // --- NESTED Travel Details ---
                travel_name: travelName,
                travel_address: travelAddress,
                travel_duration: parseInt(travelDuration, 10) || 0,
                travel_type: travelType,
            },
            items: detailedBudgetRows.map(({ localId, ...rest }) => ({ ...rest, type: rest.type, quantity: parseInt(rest.quantity, 10) || 0, cost: parseInt(rest.cost, 10) || 0, amount: parseInt(rest.amount, 10) || 0 })),
            sponsors: sponsorshipRows.map(({ localId, ...rest }) => ({ ...rest, amount: parseInt(rest.amount, 10) || 0 })),
             student_categories: selectedStudentCategories.length > 0 ? selectedStudentCategories : null,
        };
        // ***** END CORRECTED STRUCTURE *****

        console.log("Submitting Proposal Data:", JSON.stringify(proposalData, null, 2)); // Log the corrected structure
        // Determine API endpoint (Create vs Update)
        const apiEndpoint = proposalId
            ? `https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty/proposals/${proposalId}` // Update endpoint
            : 'https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty/proposals'; // Create endpoint
        const apiMethod = proposalId ? 'PUT' : 'POST';

        try {
            const response = await fetch(apiEndpoint, {
                method: apiMethod,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`, // Use authToken from state
                    'Accept': 'application/json'
                },
                body: JSON.stringify(proposalData),
            });
            if (!response.ok) {
                // Keep your detailed error handling
                const errorText = await response.text(); console.error('HTTP Error:', response.status, response.statusText); console.error('Error Body (raw):', errorText); let errorJson = null; let alertMessage = `Error: ${response.status} ${response.statusText}.`; try { errorJson = JSON.parse(errorText); console.error('Error Body (parsed):', errorJson); if(errorJson?.message && errorJson?.errors) { alertMessage += ` ${errorJson.message}. Check fields.`; } else if (errorJson?.message) { alertMessage += ` ${errorJson.message}`; } } catch (parseError) { console.log("Response body not valid JSON."); if (errorText.toLowerCase().includes("route [login] not defined")) { alertMessage += " Authentication failed. Try login again."; } else if (errorText.toLowerCase().includes("<html")) { alertMessage += " Server returned an HTML error page. Check console/network tab."; } else if (errorText.length < 200) { alertMessage += ` Server response: ${errorText}`; } else { alertMessage += " Unexpected server error. Check console."; } } alert(alertMessage);
            } else {
                 try { const data = await response.json(); console.log('Success:', data); alert(`Proposal ${proposalId ? 'Updated' : 'Submitted'} Successfully! Response: ${JSON.stringify(data)}`); /* Consider redirecting or resetting form: resetFormState(); */ } catch (jsonError) { console.error('Error parsing success response:', jsonError); /* Handle cases where success is 200 OK but no JSON body */ if(response.status === 200 || response.status === 201) { alert(`Proposal ${proposalId ? 'Updated' : 'Submitted'} Successfully!`); } else { const successText = await response.text(); console.error('Success Body (raw):', successText); alert('Submitted, but response format unexpected. See console.'); } }
            }
        } catch (error) {
            console.error('Fetch API Call Error:', error); if (error instanceof TypeError) { alert("Network error. Please check your connection or the API server status."); } else { alert("An unexpected client-side error occurred during submission. See console."); }
        }
    };

    // --- JSX ---
    return (
        <>
            {/* Background Container */}
            <div
                style={{ backgroundImage: "url('/SRMIST-BANNER.jpg')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundPosition: "center" }}
                className="min-h-screen w-full"
            >
                {/* Form Container */}
                <div className="bg-gradient-to-br from-white/80 via-white/90 to-blue-50/80 backdrop-blur-sm shadow-sm min-h-screen flex justify-center items-start py-12 px-4">
                    <div className="card bg-white shadow-lg border border-gray-200 rounded-2xl max-w-7xl w-full mx-auto">
                        <div className="card-body p-10 md:p-12">

                            {/* Form Title */}
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-10">
                                {proposalId ? 'Edit Event Proposal' : 'Submit Event Proposal'}
                            </h2>

                            {/* Convener Info Box - Uses currentUser from state */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Convener Name</label><p className="text-gray-800 font-medium break-words">{currentUser?.name || 'N/A'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Convener Email</label><p className="text-gray-800 font-medium break-words">{currentUser?.email || 'N/A'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Department</label><p id="organizing-department" className="text-gray-800 font-medium break-words">{currentUser?.department || 'N/A'}</p></div>
                            </div>

                            {/* Form Start */}
                            <form className="space-y-10" onSubmit={handleSubmit}>

                                {/* --- Section: Event Details --- */}
                                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                    <SectionHeader title="Event Details" icon={<Info size={24} />} required />
                                    <div className="space-y-5">
                                        {/* Event Title */}
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event-title">
                                                Event Title <span className="text-red-500">*</span>
                                            </label>
                                            <input type="text" id="event-title" placeholder="Enter Event Title" className="input input-bordered w-full" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
                                        </div>

                                        {/* Event Description */}
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event-description">
                                                Event Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea id="event-description" rows={4} placeholder="Provide a detailed description of the event" className="textarea textarea-bordered w-full" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} required />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                                                Event Category <span className="text-red-500">*</span>
                                            </label>
                                            <select id="category" className="select select-bordered w-full" value={category} onChange={(e) => setCategory(e.target.value as typeof EVENT_CATEGORIES[number])} required>
                                                <option value="" disabled>Select Category</option>
                                                {EVENT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>))}
                                            </select>
                                        </div>

                                        {/* Event Schedule */}
                                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                            <h4 className="text-md font-bold text-gray-800 flex items-center gap-2 mb-3">
                                                <CalendarDays className="text-blue-600" size={20} /> Event Schedule <span className="text-red-500">*</span>
                                            </h4>
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex-1 w-full">
                                                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="start-date">Start Date & Time</label>
                                                    <DatePicker
                                                        id="start-date"
                                                        selected={startDate}
                                                        onChange={(date) => setStartDate(date || undefined)}
                                                        showTimeSelect
                                                        timeIntervals={15}
                                                        dateFormat="Pp" // Locale-sensitive date and time
                                                        className="input input-bordered w-full"
                                                        placeholderText="Select start date & time"
                                                        wrapperClassName="w-full" // Ensure wrapper takes full width
                                                        required
                                                    />
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="end-date">End Date & Time</label>
                                                    <DatePicker
                                                        id="end-date"
                                                        selected={endDate}
                                                        onChange={(date) => setEndDate(date)}
                                                        showTimeSelect
                                                        timeIntervals={15}
                                                        dateFormat="Pp"
                                                        className="input input-bordered w-full"
                                                        placeholderText="Select end date & time"
                                                        wrapperClassName="w-full"
                                                        required
                                                        minDate={startDate} // Prevent end date before start date
                                                        filterDate={(date) => !startDate || date >= startDate} // Disable past dates relative to start
                                                    />
                                                </div>
                                            </div>
                                            {durationEvent && !durationEvent.startsWith("End date") && (
                                                <p className="mt-3 text-center text-sm text-gray-700 font-medium bg-blue-100 px-4 py-2 rounded-lg">
                                                    ⏳ Duration: {durationEvent}
                                                </p>
                                            )}
                                            {durationEvent && durationEvent.startsWith("End date") && (
                                                <p className="mt-3 text-center text-sm text-red-700 font-semibold bg-red-100 px-4 py-2 rounded-lg">
                                                    ⚠️ {durationEvent}
                                                </p>
                                            )}
                                        </div>

                                        {/* Optional Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="past-events">Past Relevant Events (Optional)</label>
                                                <textarea id="past-events" rows={3} placeholder="e.g., Conference Name (Year), Workshop Title (Year)" className="textarea textarea-bordered w-full" value={pastEvents} onChange={(e) => setPastEvents(e.target.value)}></textarea>
                                            </div>
                                            <div>
                                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="relevant-details">Other Relevant Details (Optional)</label>
                                                <textarea id="relevant-details" rows={3} placeholder="Any other supporting information or context" className="textarea textarea-bordered w-full" value={relevantDetails} onChange={(e) => setRelevantDetails(e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Section: Participants --- */}
                                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                    <SectionHeader title="Participants" icon={<Users size={24} />} />
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expected-participants">
                                                Total Expected Participants (Optional)
                                            </label>
                                            <input type="number" id="expected-participants" min="0" placeholder="Enter total number (e.g., 150)" className="input input-bordered w-full md:w-1/2" value={expectedParticipants} onChange={(e) => setExpectedParticipants(e.target.value)} />
                                        </div>
                                        <div className="mb-4">
                                            <label className="block text-gray-700 text-sm font-bold mb-2">Category of Participants (Optional)</label>
                                            <div className="flex flex-wrap gap-3">
                                                {participantCategories.map((pCat) => (
                                                    <button
                                                        type="button"
                                                        key={pCat}
                                                        className={`badge badge-lg font-medium cursor-pointer transition-all duration-200 ease-in-out px-4 py-3 ${selectedParticipantCategories.includes(pCat) ? 'badge-primary text-white' : 'badge-outline border-gray-300 hover:bg-blue-100 hover:border-blue-400'}`}
                                                        onClick={() => toggleParticipantCategory(pCat)}
                                                    >
                                                        {pCat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {selectedParticipantCategories.includes("Students (Category)") && (
                                            <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
                                                <label className="block text-gray-700 text-sm font-bold mb-2">Select Student Departments/Categories</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {studentCategories.map((sCat) => (
                                                        <button
                                                            type="button"
                                                            key={sCat}
                                                            className={`badge badge-md font-medium cursor-pointer transition-all duration-200 ease-in-out px-3 py-2 ${selectedStudentCategories.includes(sCat) ? 'badge-info text-white' : 'badge-outline border-gray-300 hover:bg-blue-100 hover:border-blue-400'}`}
                                                            onClick={() => toggleStudentCategory(sCat)}
                                                        >
                                                            {sCat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                </div>

                                {/* --- Section: Chief Guest --- */}
                                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                    <SectionHeader title="Chief Guest Details" icon={<UserCheck size={24} />} required />
                                     <p className="text-sm text-gray-600 mb-4 -mt-4">Enter the details for the primary Chief Guest invited for the event.</p>
                                     {chiefGuestRows.slice(0, 1).map((row) => { // Still mapping but only the first element
                                         const uniqueDomIdSuffix = row.localId;
                                         return (
                                             <div key={row.localId} className="space-y-5">
                                                {/* ... Chief Guest input fields remain the same ... */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <div>
                                                        <label htmlFor={`${chiefGuestBaseId}-name-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">Name <span className="text-red-500">*</span></label>
                                                        <input type="text" id={`${chiefGuestBaseId}-name-${uniqueDomIdSuffix}`} placeholder="Full Name" className="input input-bordered w-full" value={row.name} onChange={(e) => handleChiefGuestChange(row.localId, 'name', e.target.value)} required />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`${chiefGuestBaseId}-designation-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">Designation <span className="text-red-500">*</span></label>
                                                        <input type="text" id={`${chiefGuestBaseId}-designation-${uniqueDomIdSuffix}`} placeholder="e.g., CEO, Example Corp" className="input input-bordered w-full" value={row.designation} onChange={(e) => handleChiefGuestChange(row.localId, 'designation', e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label htmlFor={`${chiefGuestBaseId}-address-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">Address <span className="text-red-500">*</span></label>
                                                    <input type="text" id={`${chiefGuestBaseId}-address-${uniqueDomIdSuffix}`} placeholder="Full Address" className="input input-bordered w-full" value={row.address} onChange={(e) => handleChiefGuestChange(row.localId, 'address', e.target.value)} required />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                                    <div>
                                                        <label htmlFor={`${chiefGuestBaseId}-phone-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">Phone <span className="text-red-500">*</span></label>
                                                        <input type="tel" id={`${chiefGuestBaseId}-phone-${uniqueDomIdSuffix}`} placeholder="Contact Number" className="input input-bordered w-full" value={row.phone} onChange={(e) => handleChiefGuestChange(row.localId, 'phone', e.target.value)} required />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`${chiefGuestBaseId}-pan-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">PAN <span className="text-red-500">*</span></label>
                                                        <input type="text" id={`${chiefGuestBaseId}-pan-${uniqueDomIdSuffix}`} placeholder="PAN Number" className="input input-bordered w-full" value={row.pan} onChange={(e) => handleChiefGuestChange(row.localId, 'pan', e.target.value)} required />
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`${chiefGuestBaseId}-reason-${uniqueDomIdSuffix}`} className="block text-gray-700 text-sm font-bold mb-1">Reason for Inviting <span className="text-red-500">*</span></label>
                                                        <input type="text" id={`${chiefGuestBaseId}-reason-${uniqueDomIdSuffix}`} placeholder="Brief reason" className="input input-bordered w-full" value={row.reason} onChange={(e) => handleChiefGuestChange(row.localId, 'reason', e.target.value)} required />
                                                    </div>
                                                </div>
                                            </div>
                                         );
                                    })}
                                </div>

                                {/* --- Section: Accommodation & Travel --- */}
                                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                    <SectionHeader title="Accommodation & Travel for Chief Guest" icon={<BedDouble size={24} />} required />
                                     <div className="space-y-6">
                                         {/* ... Accommodation & Travel input fields remain the same ... */}
                                         <div className="bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end">
                                               <div className="md:col-span-1">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_name">Hotel Name <span className="text-red-500">*</span></label>
                                                    <input type="text" id="hotel_name" className="input input-bordered input-sm w-full" value={hotelName} onChange={e => setHotelName(e.target.value)} required />
                                                </div>
                                              <div className="md:col-span-1">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_address">Hotel Address <span className="text-red-500">*</span></label>
                                                    <input type="text" id="hotel_address" className="input input-bordered input-sm w-full" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} required />
                                                </div>
                                              <div className="md:col-span-1">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_duration">Duration (days) <span className="text-red-500">*</span></label>
                                                    <input type="number" id="hotel_duration" min="0" placeholder="Days" className="input input-bordered input-sm w-full" value={hotelDuration} onChange={e => setHotelDuration(e.target.value)} required />
                                                </div>
                                              <div className="md:col-span-1">
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_type">Hotel Type <span className="text-red-500">*</span></label>
                                                    <select id="hotel_type" className="select select-bordered select-sm w-full" value={hotelType} onChange={e => setHotelType(e.target.value as typeof HOTEL_TYPES[number])} required>
                                                        <option value="srm">SRM Arranged</option>
                                                        <option value="others">External/Other</option>
                                                    </select>
                                                </div>
                                          </div>
                                          <div className="bg-gray-50 p-4 rounded border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-4 items-end">
                                              <div className="md:col-span-1">
                                                  <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_name">Travel Mode/Name <span className="text-red-500">*</span></label>
                                                  <input type="text" id="travel_name" placeholder="e.g., Flight, Car" className="input input-bordered input-sm w-full" value={travelName} onChange={e => setTravelName(e.target.value)} required />
                                              </div>
                                              <div className="md:col-span-1">
                                                  <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_address">Travel To/From Address <span className="text-red-500">*</span></label>
                                                  <input type="text" id="travel_address" placeholder="Origin/Destination" className="input input-bordered input-sm w-full" value={travelAddress} onChange={e => setTravelAddress(e.target.value)} required />
                                              </div>
                                              <div className="md:col-span-1">
                                                  <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_duration">Travel Duration (days/trips) <span className="text-red-500">*</span></label>
                                                  <input type="number" id="travel_duration" min="0" placeholder="Count" className="input input-bordered input-sm w-full" value={travelDuration} onChange={e => setTravelDuration(e.target.value)} required />
                                              </div>
                                              <div className="md:col-span-1">
                                                  <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_type">Travel Type <span className="text-red-500">*</span></label>
                                                  <select id="travel_type" className="select select-bordered select-sm w-full" value={travelType} onChange={e => setTravelType(e.target.value as typeof TRAVEL_TYPES[number])} required>
                                                      <option value="srm">SRM Provided</option>
                                                      <option value="others">External/Other</option>
                                                  </select>
                                              </div>
                                          </div>
                                     </div>
                                 </div>

                                 {/* --- Section: Financial Details --- */}
                                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                                    <SectionHeader title="Financial Details" icon={<DollarSign size={24} />} />
                                    <div className="space-y-8">
                                        {/* Funding Sources */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3">Funding Sources (₹) <span className="text-xs font-normal text-gray-500">(Optional)</span></h4>
                                            {/* ... Funding source input fields remain the same ... */}
                                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-university">University Fund</label>
                                                    <input type="number" id="fund-university" min="0" placeholder="0" className="input input-bordered w-full" value={fundUniversity} onChange={(e) => setFundUniversity(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-registration">Registration Fund</label>
                                                    <input type="number" id="fund-registration" min="0" placeholder="0" className="input input-bordered w-full" value={fundRegistration} onChange={(e) => setFundRegistration(e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-sponsorship">Sponsorship Fund</label>
                                                    <input type="number" id="fund-sponsorship" min="0" placeholder="0" className="input input-bordered w-full bg-gray-100 cursor-not-allowed" value={fundSponsorship} readOnly title="Automatically calculated from Sponsorship section"/>
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-other">Other Sources</label>
                                                    <input type="number" id="fund-other" min="0" placeholder="0" className="input input-bordered w-full" value={fundOther} onChange={(e) => setFundOther(e.target.value)} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed Budget */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                               <FileText size={20} /> Detailed Budget <span className="text-red-500">*</span>
                                            </h4>
                                             <p className="text-sm text-gray-600 mb-4">Add all anticipated expense items for the event.</p>
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                                                {/* ... Detailed Budget Table remains the same ... */}
                                                 <table className="table w-full table-zebra table-compact">
                                                    <thead className="bg-gray-100">
                                                        <tr className="text-left text-gray-600 uppercase text-xs tracking-wider">
                                                            <th className="p-3">#</th>
                                                            <th className="p-3 w-1/3">Category / Subcategory <span className="text-red-500">*</span></th>
                                                            <th className="p-3 w-1/6 text-center">Type</th>
                                                            <th className="p-3 text-right">Qty <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-right">Cost/Unit (₹) <span className="text-red-500">*</span></th>
                                                            <th className="p-3 text-right">Total (₹)</th>
                                                            <th className="p-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailedBudgetRows.map((row, index) => {
                                                            const uniqueDomIdSuffix = row.localId;
                                                            return (
                                                                <tr key={row.localId} className="border-b border-gray-200 hover:bg-gray-50/50 text-sm">
                                                                    <td className="p-2 font-medium text-gray-500">{index + 1}</td>
                                                                    <td className="p-2 space-y-1.5">
                                                                        <div>
                                                                            <label htmlFor={`${budgetBaseId}-main-category-${uniqueDomIdSuffix}`} className="sr-only">Category {index + 1}</label>
                                                                            <select id={`${budgetBaseId}-main-category-${uniqueDomIdSuffix}`} className="select select-bordered select-xs w-full" value={row.category || ""} onChange={(e) => { handleDetailedBudgetChange(row.localId, 'category', e.target.value); handleDetailedBudgetChange(row.localId, 'sub_category', ''); }} required >
                                                                                <option value="" disabled>Select Category</option>
                                                                                <option value="Budgetary Expenditures">Budgetary Expenditures</option> <option value="Publicity">Publicity</option> <option value="General">General</option> <option value="Honorarium">Honorarium</option> <option value="Hospitality">Hospitality</option> <option value="Inaugural and Valedictory">Inaugural & Valedictory</option> <option value="Resource Materials">Resource Materials</option> <option value="Conference Paper Publication">Conference Paper Publication</option>
                                                                            </select>
                                                                        </div>
                                                                        <div>
                                                                            <label htmlFor={`${budgetBaseId}-sub-category-${uniqueDomIdSuffix}`} className="sr-only">Subcategory {index + 1}</label>
                                                                            <select id={`${budgetBaseId}-sub-category-${uniqueDomIdSuffix}`} className="select select-bordered select-xs w-full" value={row.sub_category || ""} onChange={(e) => handleDetailedBudgetChange(row.localId, 'sub_category', e.target.value)} required disabled={!row.category} >
                                                                                <option value="" disabled>Select Subcategory</option>
                                                                                {row.category === "Budgetary Expenditures" && (<><option value="Number of Sessions Planned">Sessions Planned</option><option value="Number of Keynote Speakers">Keynote Speakers</option><option value="Number of Session Judges">Session Judges</option><option value="Number of Celebrities / Chief Guests">Celebrities/Guests</option></>)} {row.category === "Publicity" && (<><option value="Invitation">Invitation</option><option value="Press Coverage">Press Coverage</option></>)} {row.category === "General" && (<><option value="Conference Kits">Conference Kits</option><option value="Printing and Stationery">Printing/Stationery</option><option value="Secretarial Expenses">Secretarial Expenses</option><option value="Mementos">Mementos</option></>)} {row.category === "Honorarium" && (<><option value="Keynote Speakers">Keynote Speakers</option><option value="Session Judges">Session Judges</option><option value="Chief Guests">Chief Guests</option></>)} {row.category === "Hospitality" && (<><option value="Train / Flight for Chief Guest / Keynote Speakers">Travel (Guests)</option><option value="Accommodation for Chief Guest / Keynote Speakers">Accommodation (Guests)</option><option value="Food and Beverages for Chief Guest / Keynote Speakers">Food (Guests)</option><option value="Local Travel Expenses">Local Travel</option><option value="Food for Participants">Food (Participants)</option><option value="Food & Snacks for Volunteers / Organizers">Food/Snacks (Team)</option><option value="Hostel Accommodation">Hostel Accommodation</option></>)} {row.category === "Inaugural and Valedictory" && (<><option value="Banners, Pandal etc">Banners/Pandal</option><option value="Lighting and Decoration">Lighting/Decoration</option><option value="Flower Bouquet">Flower Bouquet</option><option value="Cultural Events">Cultural Events</option><option value="Field Visits / Sightseeing">Field Visits</option><option value="Miscellaneous">Miscellaneous</option></>)} {row.category === "Resource Materials" && (<><option value="Preparation, Printing, Binding">Preparation/Printing</option></>)} {row.category === "Conference Paper Publication" && (<><option value="Extended Abstract">Extended Abstract</option><option value="Full Paper">Full Paper</option></>)}
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 align-middle text-center">
                                                                        <div role="group" className="flex flex-col justify-center items-center space-y-1">
                                                                            <label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name={`${budgetBaseId}-type-${uniqueDomIdSuffix}`} value="Domestic" className="radio radio-xs checked:bg-blue-500" checked={row.type === "Domestic"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'Domestic')} /> Dom </label>
                                                                            <label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name={`${budgetBaseId}-type-${uniqueDomIdSuffix}`} value="International" className="radio radio-xs checked:bg-info" checked={row.type === "International"} onChange={(e) => handleDetailedBudgetChange(row.localId, 'type', e.target.value as 'International')} /> Intl</label>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-2 text-right align-middle"><label htmlFor={`${budgetBaseId}-quantity-${uniqueDomIdSuffix}`} className="sr-only">Quantity {index + 1}</label><input type="number" id={`${budgetBaseId}-quantity-${uniqueDomIdSuffix}`} min="0" className="input input-bordered input-xs w-16 text-right" value={row.quantity} onChange={(e) => handleDetailedBudgetChange(row.localId, 'quantity', e.target.value)} required /></td>
                                                                    <td className="p-2 text-right align-middle"><label htmlFor={`${budgetBaseId}-cost-${uniqueDomIdSuffix}`} className="sr-only">Cost per Unit {index + 1}</label><input type="number" id={`${budgetBaseId}-cost-${uniqueDomIdSuffix}`} min="0" step="any" className="input input-bordered input-xs w-20 text-right" value={row.cost} onChange={(e) => handleDetailedBudgetChange(row.localId, 'cost', e.target.value)} required /></td>
                                                                    <td className="p-2 font-medium text-right align-middle">{parseFloat(row.amount || '0').toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</td>
                                                                    <td className="p-2 text-center align-middle"><button type="button" onClick={() => deleteDetailedBudgetRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete budget row ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                    <tfoot><tr className="bg-gray-100 font-semibold text-gray-700"><td colSpan={5} className="text-right p-3">Total Estimated Budget:</td><td className="text-right p-3">{totalDetailedBudget.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</td><td className="p-3"></td></tr></tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addDetailedBudgetRow} className="btn btn-outline btn-primary btn-sm mt-4 rounded-full flex items-center gap-1">
                                                <PlusCircle size={16} /> Add Budget Item
                                            </button>
                                        </div>

                                        {/* Sponsorship */}
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                                <Award size={20}/> Sponsorship Details <span className="text-red-500">*</span>
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-4">Provide details for each potential or confirmed sponsor.</p>
                                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                                                {/* ... Sponsorship Table remains the same ... */}
                                                <table className="table w-full table-compact">
                                                    <thead className="bg-gray-100">
                                                        <tr className="text-left text-gray-600 uppercase text-xs tracking-wider">
                                                            <th className="p-3">#</th><th className="p-3">Category <span className="text-red-500">*</span></th><th className="p-3 text-right">Amount (₹) <span className="text-red-500">*</span></th><th className="p-3">Reward <span className="text-red-500">*</span></th><th className="p-3">Mode <span className="text-red-500">*</span></th><th className="p-3">Benefit/Output <span className="text-red-500">*</span></th><th className="p-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sponsorshipRows.map((row, index) => {
                                                            const uniqueDomIdSuffix = row.localId;
                                                            return (
                                                                <React.Fragment key={row.localId}>
                                                                    <tr className="border-b border-gray-200 hover:bg-gray-50/50 text-sm">
                                                                        <td className="p-2 font-medium text-gray-500 align-middle">{index + 1}</td>
                                                                        <td className="p-2 align-middle"><label htmlFor={`${sponsorBaseId}-category-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Category {index + 1}</label><input type="text" id={`${sponsorBaseId}-category-${uniqueDomIdSuffix}`} placeholder="e.g., Title Sponsor" className="input input-bordered input-xs w-full" value={row.category} onChange={(e) => handleSponsorshipChange(row.localId, 'category', e.target.value)} required /></td>
                                                                        <td className="p-2 text-right align-middle"><label htmlFor={`${sponsorBaseId}-amount-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Amount {index + 1}</label><input type="number" id={`${sponsorBaseId}-amount-${uniqueDomIdSuffix}`} min="0" placeholder="Amount" className="input input-bordered input-xs w-20 text-right" value={row.amount} onChange={(e) => handleSponsorshipChange(row.localId, 'amount', e.target.value)} required /></td>
                                                                        <td className="p-2 align-middle"><label htmlFor={`${sponsorBaseId}-reward-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Reward {index + 1}</label><input type="text" id={`${sponsorBaseId}-reward-${uniqueDomIdSuffix}`} placeholder="Reward/Perk" className="input input-bordered input-xs w-full" value={row.reward} onChange={(e) => handleSponsorshipChange(row.localId, 'reward', e.target.value)} required /></td>
                                                                        <td className="p-2 align-middle"><label htmlFor={`${sponsorBaseId}-mode-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Mode {index + 1}</label><input type="text" id={`${sponsorBaseId}-mode-${uniqueDomIdSuffix}`} placeholder="e.g., Cash, Kind" className="input input-bordered input-xs w-full" value={row.mode} onChange={(e) => handleSponsorshipChange(row.localId, 'mode', e.target.value)} required /></td>
                                                                        <td className="p-2 align-middle"><label htmlFor={`${sponsorBaseId}-benefit-${uniqueDomIdSuffix}`} className="sr-only">Sponsor Benefit {index + 1}</label><input type="text" id={`${sponsorBaseId}-benefit-${uniqueDomIdSuffix}`} placeholder="Benefit to Event" className="input input-bordered input-xs w-full" value={row.benefit} onChange={(e) => handleSponsorshipChange(row.localId, 'benefit', e.target.value)} required /></td>
                                                                        <td className="p-2 text-center align-middle"><button type="button" onClick={() => deleteSponsorshipRow(row.localId)} className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 p-1" aria-label={`Delete sponsor row ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td>
                                                                    </tr>
                                                                    <tr className="border-b border-gray-200 bg-gray-50/30">
                                                                        <td colSpan={7} className="px-3 py-2"><label htmlFor={`${sponsorBaseId}-about-${uniqueDomIdSuffix}`} className="block text-gray-600 text-xs font-semibold mb-1">About Sponsor {index + 1} <span className="text-red-500">*</span></label><textarea id={`${sponsorBaseId}-about-${uniqueDomIdSuffix}`} rows={1} className="textarea textarea-bordered w-full text-sm p-1.5" value={row.about} onChange={(e) => handleSponsorshipChange(row.localId, 'about', e.target.value)} placeholder="Brief details about the sponsor (e.g., company info, contact person)" required /></td>
                                                                    </tr>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tbody>
                                                     <tfoot><tr className="bg-gray-100 font-semibold text-gray-700"><td colSpan={2} className="text-right p-3">Total Sponsorship Amount:</td><td className="text-right p-3">{totalSponsorshipAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 })}</td><td colSpan={4} className="p-3"></td></tr></tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addSponsorshipRow} className="btn btn-outline btn-primary btn-sm mt-4 rounded-full flex items-center gap-1">
                                                <PlusCircle size={16} /> Add Sponsor
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button Area */}
                                <div className="mt-12 pt-8 border-t border-gray-300 flex justify-center">
                                    <button type="submit" className="btn btn-primary btn-lg rounded-full text-lg font-semibold px-10 py-3 shadow-md hover:shadow-lg transition-shadow duration-300" disabled={!authToken}> {/* Optionally disable if no token */}
                                        {proposalId ? 'Update Proposal' : 'Submit Proposal'}
                                    </button>
                                </div>

                            </form> {/* End Form */}
                        </div> {/* End Card Body */}
                    </div> {/* End Card */}
                </div> {/* End Form Container */}
            </div> {/* End Background Container */}
        </>
    );
}