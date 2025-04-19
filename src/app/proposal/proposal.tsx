"use client";
import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Trash2 } from 'lucide-react';
import { FaCalendarAlt } from "react-icons/fa";
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Interfaces (Frontend State Representation)
interface DetailedBudgetRow {
    id: number;
    category: string;
    sub_category: string;
    type: 'Domestic' | 'International' | null;
    quantity: string;
    cost: string;
    amount: string;
}

interface SponsorshipRow {
    id: number;
    category: string;
    amount: string;
    reward: string;
    mode: string;
    about: string;
    benefit: string;
}

interface ChiefGuestRow {
    id: number;
    name: string;
    designation: string;
    address: string;
    phone: string;
    pan: string;
    reason: string;
}

// Enums / Constants
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

export default function EventProposalForm() {
    const { user } = useAuth();
    const searchParams = useSearchParams();

    // --- State Variables ---
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
    const [hotelName, setHotelName] = useState('SRM Hostel');
    const [hotelAddress, setHotelAddress] = useState('SRM University');
    const [hotelDuration, setHotelDuration] = useState('5');
    const [hotelType, setHotelType] = useState<typeof HOTEL_TYPES[number]>('srm');
    const [travelName, setTravelName] = useState('Car');
    const [travelAddress, setTravelAddress] = useState('Guindy');
    const [travelDuration, setTravelDuration] = useState('1');
    const [travelType, setTravelType] = useState<typeof TRAVEL_TYPES[number]>('srm');
    const [chiefGuestRows, setChiefGuestRows] = useState<ChiefGuestRow[]>([
        { id: Date.now(), name: '', designation: '', address: '', phone: '', pan: '', reason: '' },
    ]);
    const [detailedBudgetRows, setDetailedBudgetRows] = useState<DetailedBudgetRow[]>([
        { id: Date.now() + 1, category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' },
    ]);
    const [sponsorshipRows, setSponsorshipRows] = useState<SponsorshipRow[]>([
        { id: Date.now() + 2, category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }
    ]);
    const [dateConflictError, setDateConflictError] = useState<string | null>(null);

    // --- Derived State Calculations ---
    const totalDetailedBudget = detailedBudgetRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const totalSponsorshipAmount = sponsorshipRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

    // --- Effects ---
    useEffect(() => {
        setEstimatedBudget(totalDetailedBudget.toString());
    }, [totalDetailedBudget]);

    useEffect(() => {
        setFundSponsorship(totalSponsorshipAmount.toString());
    }, [totalSponsorshipAmount]);

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
            // Fetch full proposal data is recommended here.
            setProposalId(searchParams.get('proposalId') || null);
            setEventTitle(searchParams.get('title') || '');
            // ... load other fields ...
        }
    }, [searchParams]);

    // --- Handler Functions ---
    const addDetailedBudgetRow = () => setDetailedBudgetRows(prev => [...prev, { id: Date.now(), category: '', sub_category: '', type: null, quantity: '', cost: '', amount: '' }]);
    const deleteDetailedBudgetRow = (idToDelete: number) => setDetailedBudgetRows(prev => prev.filter(row => row.id !== idToDelete));
    const handleDetailedBudgetChange = (id: number, field: keyof DetailedBudgetRow, value: string | 'Domestic' | 'International' | null) => {
        setDetailedBudgetRows(prevRows => prevRows.map(row => {
            if (row.id === id) {
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

    const addSponsorshipRow = () => setSponsorshipRows(prev => [...prev, { id: Date.now(), category: '', amount: '', reward: '', mode: '', about: '', benefit: '' }]);
    const deleteSponsorshipRow = (idToDelete: number) => setSponsorshipRows(prev => prev.filter(row => row.id !== idToDelete));
    const handleSponsorshipChange = (id: number, field: keyof SponsorshipRow, value: string) => setSponsorshipRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));

    const addChiefGuestRow = () => setChiefGuestRows(prev => [...prev, { id: Date.now(), name: '', designation: '', address: '', phone: '', pan: '', reason: '' }]);
    const deleteChiefGuestRow = (idToDelete: number) => { if (chiefGuestRows.length > 1) { setChiefGuestRows(prev => prev.filter(row => row.id !== idToDelete)); } else { alert("At least one chief guest entry is needed."); } };
    const handleChiefGuestChange = (id: number, field: keyof ChiefGuestRow, value: string) => setChiefGuestRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));

    const toggleParticipantCategory = (category: string) => setSelectedParticipantCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
    const toggleStudentCategory = (category: string) => setSelectedStudentCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);

    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) { alert("You must be logged in."); return; }
        if (!startDate || !endDate) { alert("Please select both start and end dates."); return; }
        if (endDate < startDate) { alert("End date cannot be before start date."); return; }

        const chiefGuestToSend = chiefGuestRows[0];
        if (!chiefGuestToSend || !chiefGuestToSend.name || !chiefGuestToSend.designation || !chiefGuestToSend.address || !chiefGuestToSend.phone || !chiefGuestToSend.pan || !chiefGuestToSend.reason) {
            alert("Please fill in all required details for the Chief Guest."); return;
        }
        if (detailedBudgetRows.length === 0 || detailedBudgetRows.some(r => !r.category || !r.sub_category || !r.quantity || !r.cost)) {
            alert("Please fill in all required fields for at least one Detailed Budget item."); return;
        }
        if (sponsorshipRows.length === 0 || sponsorshipRows.some(r => !r.category || !r.amount || !r.reward || !r.mode || !r.about || !r.benefit)) {
             alert("Please fill in all required fields for at least one Sponsorship item."); return;
        }


        const proposalData = {
            title: eventTitle, description: eventDescription,
            start: startDate.toISOString(), end: endDate.toISOString(), category: category,
            past: pastEvents || null, other: relevantDetails || null,
            participant_expected: parseInt(expectedParticipants, 10) || null,
            participant_categories: selectedParticipantCategories.length > 0 ? selectedParticipantCategories : null,
            fund_uni: parseInt(fundUniversity, 10) || null, fund_registration: parseInt(fundRegistration, 10) || null,
            fund_sponsor: parseInt(fundSponsorship, 10) || null, fund_others: parseInt(fundOther, 10) || null,
            chief: { name: chiefGuestToSend.name, designation: chiefGuestToSend.designation, address: chiefGuestToSend.address, phone: chiefGuestToSend.phone, pan: chiefGuestToSend.pan, reason: chiefGuestToSend.reason },
            hotel_name: hotelName, hotel_address: hotelAddress, hotel_duration: parseInt(hotelDuration, 10) || 0, hotel_type: hotelType,
            travel_name: travelName, travel_address: travelAddress, travel_duration: parseInt(travelDuration, 10) || 0, travel_type: travelType,
            items: detailedBudgetRows.map(row => ({ category: row.category, sub_category: row.sub_category, type: row.type, quantity: parseInt(row.quantity, 10) || 0, cost: parseInt(row.cost, 10) || 0, amount: parseInt(row.amount, 10) || 0 })),
            sponsors: sponsorshipRows.map(row => ({ category: row.category, amount: parseInt(row.amount, 10) || 0, reward: row.reward, mode: row.mode, about: row.about, benefit: row.benefit })),
        };

        console.log("Submitting Proposal Data:", JSON.stringify(proposalData, null, 2));

        try {
            const response = await fetch('https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net/api/faculty/proposals', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${user.token}` }, body: JSON.stringify(proposalData),
            });

            if (!response.ok) {
                const errorText = await response.text(); console.error('HTTP Error:', response.status, response.statusText); console.error('Error Body (raw):', errorText); let errorJson = null; try { errorJson = JSON.parse(errorText); console.error('Error Body (parsed):', errorJson); } catch (parseError) { console.log("Response body was not valid JSON."); }
                let alertMessage = `Error: ${response.status} ${response.statusText}.`; if(errorJson?.detail) { alertMessage += ` ${errorJson.detail}`; } else if (errorJson?.errors) { alertMessage += ` ${JSON.stringify(errorJson.errors)}`; } else if (errorText.length < 200) { alertMessage += ` ${errorText}`; } else { alertMessage += " Check console."; } alert(alertMessage);
            } else {
                try { const data = await response.json(); console.log('Success:', data); alert(`Proposal submitted! Response: ${JSON.stringify(data)}`); } catch (jsonError) { console.error('Error parsing success response:', jsonError); const successText = await response.text(); console.error('Success Body (raw):', successText); alert('Submitted, but response format unexpected. See console.'); }
            }
        } catch (error) { console.error('Fetch API Error:', error); if (error instanceof TypeError) { alert("Network error. Check connection/API."); } else { alert("Unexpected error. See console."); } }
    };

    // --- JSX ---
    return (
        <>
            <div style={{ backgroundImage: "url('/SRMIST-BANNER.jpg')", backgroundSize: "cover", backgroundAttachment: "fixed", backgroundPosition: "center" }}>
                <div className="bg-white bg-opacity-80 shadow-sm min-h-screen flex justify-center items-center py-10">
                    <div className="card bg-white shadow-xl border border-blue-300 rounded-2xl max-w-7xl w-full mx-4 md:mx-0">
                        <div className="card-body p-8">
                            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">{proposalId ? 'Edit Event Proposal' : 'Submit Event Proposal'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Convener Name</label><p className="text-gray-800 font-medium">{user?.name || 'N/A'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Convener Email</label><p className="text-gray-800 font-medium">{user?.email || 'N/A'}</p></div>
                                <div><label className="block text-gray-600 text-sm font-semibold mb-1">Department</label><p id="organizing-department" className="text-gray-800 font-medium">{user?.department || 'N/A'}</p></div>
                            </div>

                            <form className="space-y-8" onSubmit={handleSubmit}>
                                <fieldset className="border border-gray-300 p-6 rounded-md">
                                    <legend className="text-xl font-semibold text-gray-700 px-2">Event Details</legend>
                                    <div className="space-y-4">
                                        <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event-title">Event Title <span className="text-red-500">*</span></label><input type="text" id="event-title" placeholder="Enter Event Title" className="input input-bordered w-full" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required /></div>
                                        <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="event-description">Event Description <span className="text-red-500">*</span></label><textarea id="event-description" rows={4} placeholder="Enter Event Description" className="textarea textarea-bordered w-full" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} required /></div>
                                        <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">Category <span className="text-red-500">*</span></label><select id="category" className="select select-bordered w-full" value={category} onChange={(e) => setCategory(e.target.value as typeof EVENT_CATEGORIES[number])} required><option value="" disabled>Select Category</option>{EVENT_CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>))}</select></div>
                                        <div className="bg-gray-50 p-4 rounded-md border">
                                            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-3"><FaCalendarAlt className="text-blue-600" /> Event Schedule <span className="text-red-500">*</span></h3>
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex-1 w-full"><label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="start-date">Start Date & Time</label><DatePicker id="start-date" selected={startDate} onChange={(date) => setStartDate(date)} showTimeSelect timeIntervals={15} dateFormat="Pp" className="input input-bordered w-full" placeholderText="Select start date & time" required /></div>
                                                <div className="flex-1 w-full"><label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="end-date">End Date & Time</label><DatePicker id="end-date" selected={endDate} onChange={(date) => setEndDate(date)} showTimeSelect timeIntervals={15} dateFormat="Pp" className="input input-bordered w-full" placeholderText="Select end date & time" required minDate={startDate} /></div>
                                            </div>
                                            {durationEvent && !durationEvent.startsWith("End date") && (<p className="mt-3 text-center text-gray-700 font-semibold bg-blue-100 px-4 py-2 rounded-lg text-sm">⏳ Duration: {durationEvent}</p>)}
                                            {durationEvent && durationEvent.startsWith("End date") && (<p className="mt-3 text-center text-red-600 font-semibold bg-red-100 px-4 py-2 rounded-lg text-sm">⚠️ {durationEvent}</p>)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="past-events">Past Relevant Events (Optional)</label><textarea id="past-events" rows={3} placeholder="List any relevant events organized previously" className="textarea textarea-bordered w-full" value={pastEvents} onChange={(e) => setPastEvents(e.target.value)}></textarea></div>
                                            <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="relevant-details">Other Relevant Details (Optional)</label><textarea id="relevant-details" rows={3} placeholder="Include any other supporting information" className="textarea textarea-bordered w-full" value={relevantDetails} onChange={(e) => setRelevantDetails(e.target.value)}></textarea></div>
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="border border-gray-300 p-6 rounded-md">
                                     <legend className="text-xl font-semibold text-gray-700 px-2">Participants</legend>
                                     <div className="space-y-4">
                                        <div><label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expected-participants">Total Expected Participants (Optional)</label><input type="number" id="expected-participants" min="0" placeholder="Enter total number" className="input input-bordered w-full" value={expectedParticipants} onChange={(e) => setExpectedParticipants(e.target.value)} /></div>
                                        <div className="mb-4"><label className="block text-gray-700 text-sm font-bold mb-2">Category of Participants (Optional)</label><div className="flex flex-wrap gap-2">{participantCategories.map((pCat) => (<button type="button" key={pCat} className={`badge badge-lg badge-outline cursor-pointer transition-colors duration-200 ${selectedParticipantCategories.includes(pCat) ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-blue-100 hover:border-blue-400'}`} onClick={() => toggleParticipantCategory(pCat)}>{pCat}</button>))}</div></div>
                                        {selectedParticipantCategories.includes("Students (Category)") && (<div className="mb-4 p-4 bg-gray-50 rounded border"><label className="block text-gray-700 text-sm font-bold mb-2">Student Departments/Categories</label><div className="flex flex-wrap gap-2">{studentCategories.map((sCat) => (<button type="button" key={sCat} className={`badge badge-md badge-outline cursor-pointer transition-colors duration-200 ${selectedStudentCategories.includes(sCat) ? 'bg-green-600 text-white border-green-600' : 'hover:bg-green-100 hover:border-green-400'}`} onClick={() => toggleStudentCategory(sCat)}>{sCat}</button>))}</div></div>)}
                                     </div>
                                </fieldset>

                                <fieldset className="border border-gray-300 p-6 rounded-md">
                                    <legend className="text-xl font-semibold text-gray-700 px-2">Chief Guest Details <span className="text-red-500">*</span></legend>
                                     <p className="text-sm text-gray-600 mb-4">Note: Enter the primary guest's details below.</p>
                                     {chiefGuestRows.slice(0, 1).map((row) => (
                                        <div key={row.id} className="space-y-4">
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                 <div><label htmlFor={`chief-guest-name-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">Name <span className="text-red-500">*</span></label><input type="text" id={`chief-guest-name-${row.id}`} className="input input-bordered w-full" value={row.name} onChange={(e) => handleChiefGuestChange(row.id, 'name', e.target.value)} required /></div>
                                                  <div><label htmlFor={`chief-guest-designation-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">Designation <span className="text-red-500">*</span></label><input type="text" id={`chief-guest-designation-${row.id}`} className="input input-bordered w-full" value={row.designation} onChange={(e) => handleChiefGuestChange(row.id, 'designation', e.target.value)} required /></div>
                                             </div>
                                            <div><label htmlFor={`chief-guest-address-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">Address <span className="text-red-500">*</span></label><input type="text" id={`chief-guest-address-${row.id}`} className="input input-bordered w-full" value={row.address} onChange={(e) => handleChiefGuestChange(row.id, 'address', e.target.value)} required /></div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div><label htmlFor={`chief-guest-phone-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">Phone <span className="text-red-500">*</span></label><input type="tel" id={`chief-guest-phone-${row.id}`} className="input input-bordered w-full" value={row.phone} onChange={(e) => handleChiefGuestChange(row.id, 'phone', e.target.value)} required /></div>
                                                <div><label htmlFor={`chief-guest-pan-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">PAN <span className="text-red-500">*</span></label><input type="text" id={`chief-guest-pan-${row.id}`} className="input input-bordered w-full" value={row.pan} onChange={(e) => handleChiefGuestChange(row.id, 'pan', e.target.value)} required /></div>
                                                <div><label htmlFor={`chief-guest-reason-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">Reason for Inviting <span className="text-red-500">*</span></label><input type="text" id={`chief-guest-reason-${row.id}`} className="input input-bordered w-full" value={row.reason} onChange={(e) => handleChiefGuestChange(row.id, 'reason', e.target.value)} required /></div>
                                            </div>
                                        </div>
                                    ))}
                                </fieldset>

                                <fieldset className="border border-gray-300 p-6 rounded-md">
                                    <legend className="text-xl font-semibold text-gray-700 px-2">Accommodation & Travel <span className="text-red-500">*</span></legend>
                                    <div className="space-y-4">
                                         <div className="bg-gray-50 p-4 rounded border grid grid-cols-1 md:grid-cols-4 gap-4">
                                              <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_name">Hotel Name <span className="text-red-500">*</span></label><input type="text" id="hotel_name" className="input input-bordered w-full" value={hotelName} onChange={e => setHotelName(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_address">Hotel Address <span className="text-red-500">*</span></label><input type="text" id="hotel_address" className="input input-bordered w-full" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_duration">Duration (days) <span className="text-red-500">*</span></label><input type="number" id="hotel_duration" min="0" className="input input-bordered w-full" value={hotelDuration} onChange={e => setHotelDuration(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="hotel_type">Hotel Type <span className="text-red-500">*</span></label><select id="hotel_type" className="select select-bordered w-full" value={hotelType} onChange={e => setHotelType(e.target.value as typeof HOTEL_TYPES[number])} required><option value="srm">SRM</option><option value="others">Others</option></select></div>
                                         </div>
                                         <div className="bg-gray-50 p-4 rounded border grid grid-cols-1 md:grid-cols-4 gap-4">
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_name">Travel Mode/Name <span className="text-red-500">*</span></label><input type="text" id="travel_name" className="input input-bordered w-full" value={travelName} onChange={e => setTravelName(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_address">Travel To/From Address <span className="text-red-500">*</span></label><input type="text" id="travel_address" className="input input-bordered w-full" value={travelAddress} onChange={e => setTravelAddress(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_duration">Travel Duration (days/trips) <span className="text-red-500">*</span></label><input type="number" id="travel_duration" min="0" className="input input-bordered w-full" value={travelDuration} onChange={e => setTravelDuration(e.target.value)} required /></div>
                                             <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="travel_type">Travel Type <span className="text-red-500">*</span></label><select id="travel_type" className="select select-bordered w-full" value={travelType} onChange={e => setTravelType(e.target.value as typeof TRAVEL_TYPES[number])} required><option value="srm">SRM Provided</option><option value="others">Others</option></select></div>
                                         </div>
                                    </div>
                                </fieldset>

                                 <fieldset className="border border-gray-300 p-6 rounded-md">
                                    <legend className="text-xl font-semibold text-gray-700 px-2">Financial Details</legend>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Funding Sources (₹) (Optional)</h3>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-university">University Fund</label><input type="number" id="fund-university" min="0" placeholder="0" className="input input-bordered w-full" value={fundUniversity} onChange={(e) => setFundUniversity(e.target.value)} /></div>
                                                <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-registration">Registration Fund</label><input type="number" id="fund-registration" min="0" placeholder="0" className="input input-bordered w-full" value={fundRegistration} onChange={(e) => setFundRegistration(e.target.value)} /></div>
                                                <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-sponsorship">Sponsorship Fund</label><input type="number" id="fund-sponsorship" min="0" placeholder="0" className="input input-bordered w-full bg-gray-200" value={fundSponsorship} readOnly /></div>
                                                <div><label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="fund-other">Other Sources</label><input type="number" id="fund-other" min="0" placeholder="0" className="input input-bordered w-full" value={fundOther} onChange={(e) => setFundOther(e.target.value)} /></div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detailed Budget <span className="text-red-500">*</span></h3>
                                             <p className="text-sm text-gray-600 mb-3">Add all anticipated expense items.</p>
                                            <div className="overflow-x-auto">
                                                <table className="table w-full table-zebra table-compact shadow-md rounded-md">
                                                    <thead className="bg-gray-100">
                                                        <tr className="text-left text-gray-700">
                                                            <th className="px-4 py-2">#</th><th className="px-4 py-2 w-1/3">Category / Subcategory <span className="text-red-500">*</span></th><th className="px-4 py-2 w-1/6">Type (Dom/Intl)</th><th className="px-4 py-2">Quantity <span className="text-red-500">*</span></th><th className="px-4 py-2">Cost/Unit (₹) <span className="text-red-500">*</span></th><th className="px-4 py-2">Total (₹)</th><th className="px-4 py-2">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailedBudgetRows.map((row, index) => (
                                                            <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                                <td className="px-4 py-1">{index + 1}</td>
                                                                <td className="px-3 py-2 space-y-2">
                                                                    <div><label htmlFor={`main-category-${row.id}`} className="sr-only">Main Category {row.id}</label><select id={`main-category-${row.id}`} className="select select-bordered select-sm w-full" value={row.category || ""} onChange={(e) => handleDetailedBudgetChange(row.id, 'category', e.target.value)} required><option value="" disabled>Category</option><option value="Budgetary Expenditures">Budgetary</option><option value="Publicity">Publicity</option><option value="General">General</option><option value="Honorarium">Honorarium</option><option value="Hospitality">Hospitality</option><option value="Inaugural and Valedictory">Inaugural/Valedictory</option><option value="Resource Materials">Materials</option><option value="Conference Paper Publication">Publication</option></select></div>
                                                                     <div><label htmlFor={`sub-category-${row.id}`} className="sr-only">Subcategory {row.id}</label><select id={`sub-category-${row.id}`} className="select select-bordered select-sm w-full" value={row.sub_category || ""} onChange={(e) => handleDetailedBudgetChange(row.id, 'sub_category', e.target.value)} required><option value="" disabled>Subcategory</option>
                                                                            {row.category === "Hospitality" && (<><option value="Train / Flight for Chief Guest / Keynote Speakers">Train/Flight (Guests)</option><option value="Accommodation for Chief Guest / Keynote Speakers">Accommodation (Guests)</option><option value="Food and Beverages for Chief Guest / Keynote Speakers">Food/Bev (Guests)</option><option value="Local Travel Expenses">Local Travel</option><option value="Food for Participants">Food (Participants)</option><option value="Food & Snacks for Volunteers / Organizers">Food/Snacks (Team)</option><option value="Hostel Accommodation">Hostel</option></>)}
                                                                            {/* Add other options based on category */}
                                                                            </select></div>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <div role="group" className="flex flex-col space-y-1"><label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name={`location-${row.id}`} value="Domestic" className="radio radio-xs" checked={row.type === "Domestic"} onChange={(e) => handleDetailedBudgetChange(row.id, 'type', e.target.value as 'Domestic')} /> Domestic</label><label className="flex items-center gap-1 cursor-pointer text-xs"><input type="radio" name={`location-${row.id}`} value="International" className="radio radio-xs" checked={row.type === "International"} onChange={(e) => handleDetailedBudgetChange(row.id, 'type', e.target.value as 'International')} /> Intl</label></div>
                                                                </td>
                                                                <td className="px-3 py-2"><label htmlFor={`quantity-${row.id}`} className="sr-only">Qty {row.id}</label><input type="number" id={`quantity-${row.id}`} min="0" className="input input-bordered input-sm w-20" value={row.quantity} onChange={(e) => handleDetailedBudgetChange(row.id, 'quantity', e.target.value)} required /></td>
                                                                <td className="px-3 py-2"><label htmlFor={`cost-${row.id}`} className="sr-only">Cost {row.id}</label><input type="number" id={`cost-${row.id}`} min="0" step="0.01" className="input input-bordered input-sm w-24" value={row.cost} onChange={(e) => handleDetailedBudgetChange(row.id, 'cost', e.target.value)} required /></td>
                                                                <td className="px-4 py-2 font-medium text-right">₹{parseFloat(row.amount || '0').toLocaleString('en-IN')}</td>
                                                                <td className="px-4 py-2 text-center"><button type="button" onClick={() => deleteDetailedBudgetRow(row.id)} className="btn btn-ghost btn-xs text-red-500" aria-label={`Delete budget row ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    {/* CLEANED FOOTER */}
                                                    <tfoot>
                                                        <tr className="bg-gray-100 font-bold">
                                                            <td colSpan={5} className="text-right px-4 py-2">Total Estimated Budget:</td>
                                                            <td className="text-right px-4 py-2">₹{totalDetailedBudget.toLocaleString('en-IN')}</td>
                                                            <td></td>{/* Empty cell for alignment */}
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addDetailedBudgetRow} className="btn btn-outline btn-sm mt-4 rounded-full">+ Add Budget Item</button>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Sponsorship Details <span className="text-red-500">*</span></h3>
                                             <p className="text-sm text-gray-600 mb-3">Add details for each sponsor.</p>
                                            <div className="overflow-x-auto">
                                                <table className="table w-full table-compact shadow-md rounded-md">
                                                    <thead className="bg-gray-100">
                                                        <tr className="text-left text-gray-700">
                                                            <th className="px-4 py-2">#</th><th className="px-4 py-2">Category <span className="text-red-500">*</span></th><th className="px-4 py-2">Amount (₹) <span className="text-red-500">*</span></th><th className="px-4 py-2">Reward <span className="text-red-500">*</span></th><th className="px-4 py-2">Mode <span className="text-red-500">*</span></th><th className="px-4 py-2">Benefit/Output <span className="text-red-500">*</span></th><th className="px-4 py-2">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sponsorshipRows.map((row, index) => (
                                                            <React.Fragment key={row.id}>
                                                                <tr className="border-b border-gray-200 hover:bg-gray-50">
                                                                    <td className="px-4 py-1">{index + 1}</td>
                                                                    <td className="px-3 py-2"><label className="sr-only">Sponsor Cat {row.id}</label><input type="text" className="input input-bordered input-sm w-full" value={row.category} onChange={(e) => handleSponsorshipChange(row.id, 'category', e.target.value)} required /></td>
                                                                    <td className="px-3 py-2"><label className="sr-only">Sponsor Amt {row.id}</label><input type="number" min="0" className="input input-bordered input-sm w-24" value={row.amount} onChange={(e) => handleSponsorshipChange(row.id, 'amount', e.target.value)} required /></td>
                                                                    <td className="px-3 py-2"><label className="sr-only">Sponsor Reward {row.id}</label><input type="text" className="input input-bordered input-sm w-full" value={row.reward} onChange={(e) => handleSponsorshipChange(row.id, 'reward', e.target.value)} required /></td>
                                                                    <td className="px-3 py-2"><label className="sr-only">Sponsor Mode {row.id}</label><input type="text" className="input input-bordered input-sm w-full" value={row.mode} onChange={(e) => handleSponsorshipChange(row.id, 'mode', e.target.value)} required /></td>
                                                                    <td className="px-3 py-2"><label className="sr-only">Sponsor Benefit {row.id}</label><input type="text" className="input input-bordered input-sm w-full" value={row.benefit} onChange={(e) => handleSponsorshipChange(row.id, 'benefit', e.target.value)} required /></td>
                                                                    <td className="px-4 py-2 text-center"><button type="button" onClick={() => deleteSponsorshipRow(row.id)} className="btn btn-ghost btn-xs text-red-500" aria-label={`Delete sponsor ${index + 1}`}><Trash2 className="h-4 w-4" /></button></td>
                                                                </tr>
                                                                <tr className="border-b border-gray-200">
                                                                    <td colSpan={7} className="px-4 py-2 bg-gray-50"><label htmlFor={`about-sponsor-${row.id}`} className="block text-gray-700 text-sm font-bold mb-1">About Sponsor {index + 1} <span className="text-red-500">*</span></label><textarea id={`about-sponsor-${row.id}`} rows={2} className="textarea textarea-bordered w-full text-sm" value={row.about} onChange={(e) => handleSponsorshipChange(row.id, 'about', e.target.value)} placeholder="Brief details about the sponsor" required /></td>
                                                                </tr>
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                     {/* CLEANED FOOTER */}
                                                    <tfoot>
                                                        <tr className="bg-gray-100 font-bold">
                                                            <td colSpan={2} className="text-right px-4 py-2">Total Sponsorship Amount:</td>
                                                            <td className="text-left px-4 py-2">₹{totalSponsorshipAmount.toLocaleString('en-IN')}</td>
                                                            <td colSpan={4}></td>{/* Empty cells for alignment */}
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                            <button type="button" onClick={addSponsorshipRow} className="btn btn-outline btn-sm mt-4 rounded-full">+ Add Sponsor</button>
                                        </div>
                                    </div>
                                </fieldset>

                                <div className="mt-10 pt-6 border-t border-gray-300">
                                    <button type="submit" className="btn btn-primary w-full rounded-full text-lg font-semibold py-3">
                                        {proposalId ? 'Update Proposal' : 'Submit Proposal'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}