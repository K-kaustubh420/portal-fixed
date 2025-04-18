"use client";
import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Trash2 } from 'lucide-react';
import { FaCalendarAlt } from "react-icons/fa";
import { useSearchParams } from 'next/navigation';


interface DetailedBudgetRow {
    id: number;
    description: string;
    quantity: string;
    costPerUnit: string;
    totalAmount: string;
    mainCategory?: string;
    subCategory?: string;
    locationType?: string;
}

interface SponsorshipRow {
    id: number;
    category: string;
    amount: string;
    rewardGiven: string;
    mode: string;
    outputSponsorWant: string;
    aboutSponsor: string;
}

interface ChiefGuestRow {
    id: number;
    name: string;
    designation: string;
    address: string;
    phone: string;
}

const participantCategories = [
    "FA's",
    "Faculties Only",
    "International Students",
    "International Participants",
    "Students (Category)",
];

const studentCategories = [
    "Aerospace Engineering",
    "Automobile Engineering",
    "Biomedical Engineering",
    "Biotechnology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Science and Engineering",
    "Ctech",
    "Cintel",
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Electronics and Instrumentation Engineering",
    "Food Process Engineering",
    "Genetic Engineering",
    "Information Technology",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Software Engineering",
];


export default function EventProposalForm() {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const searchParams = useSearchParams();
    const [organizingDepartment, setOrganizingDepartment] = useState('');
    const [eventTitle, setEventTitle] = useState<string>('');
    const [eventDescription, setEventDescription] = useState('');
    const [durationEvent, setDurationEvent] = useState('');
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [category, setCategory] = useState('');
    const [designation, setDesignation] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');
    const [pastEvents, setPastEvents] = useState('');
    const [relevantDetails, setRelevantDetails] = useState('');
    const [convenerName, setConvenerName] = useState('');
    const [convenerEmail, setConvenerEmail] = useState('');
    const [fundUniversity, setFundUniversity] = useState('');
    const [fundRegistration, setFundRegistration] = useState('');
    const [fundSponsorship, setFundSponsorship] = useState('');
    const [proposalId, setProposalId] = useState<string | null>(null);
    const [fundOther, setFundOther] = useState('');
    const [expectedParticipants, setExpectedParticipants] = useState('');

    const [selectedParticipantCategories, setSelectedParticipantCategories] = useState<string[]>([]);
    const [selectedStudentCategories, setSelectedStudentCategories] = useState<string[]>([]);

    const [detailedBudgetRows, setDetailedBudgetRows] = useState<DetailedBudgetRow[]>([
        { id: 1, description: '', quantity: '', costPerUnit: '', totalAmount: '' },
        { id: 2, description: '', quantity: '', costPerUnit: '', totalAmount: '' },
        { id: 3, description: '', quantity: '', costPerUnit: '', totalAmount: '' },
    ]);

    const totalDetailedBudget: number = detailedBudgetRows.reduce((sum, row) => sum + (parseFloat(row.totalAmount) || 0), 0);

    const [sponsorshipRows, setSponsorshipRows] = useState<SponsorshipRow[]>([
        { id: 1, category: '', amount: '', rewardGiven: '', mode: '', outputSponsorWant: '', aboutSponsor: '' }
    ]);

    const [chiefGuestRows, setChiefGuestRows] = useState<ChiefGuestRow[]>([
      { id: 1, name: '', designation: '', address: '', phone: '' },
    ]);


    const totalSponsorshipAmount: number = sponsorshipRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);


        // Calculate Duration (Improved)
        const calculateDuration = useCallback(() => {
            if (!startDate || !endDate) {
                setDurationEvent("");
                return;
            }
    
            const start = new Date(startDate);
            const end = new Date(endDate);
    
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                setDurationEvent("Invalid date range");
                return;
            }
    
            const diffMs = end.getTime() - start.getTime();
            const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
            setDurationEvent(`${days} days, ${hours} hours, ${minutes} minutes`);
        }, [startDate, endDate]); // Dependencies of calculateDuration
    
        useEffect(() => {
            calculateDuration();
        }, [calculateDuration, startDate, endDate]); // Include calculateDuration in the dependency array

    const addDetailedBudgetRow = () => {
        setDetailedBudgetRows([...detailedBudgetRows, { id: detailedBudgetRows.length + 1, description: '', quantity: '', costPerUnit: '', totalAmount: '' }]);
    };

    const deleteDetailedBudgetRow = (idToDelete: number) => {
        setDetailedBudgetRows(detailedBudgetRows.filter(row => row.id !== idToDelete));
    };

    const handleDetailedBudgetChange = (id: number, field: string, value: string) => {
        const updatedRows = detailedBudgetRows.map(row => {
            if (row.id === id) {
                const updatedRow: DetailedBudgetRow = { ...row, [field]: value };
                const quantity = parseFloat(updatedRow.quantity) || 0;
                const costPerUnit = parseFloat(updatedRow.costPerUnit) || 0;
                updatedRow.totalAmount = String(quantity * costPerUnit);
                return updatedRow;
            }
            return row;
        });
        setDetailedBudgetRows(updatedRows);
    };

    const addSponsorshipRow = () => {
        setSponsorshipRows([...sponsorshipRows, { id: sponsorshipRows.length + 1, category: '', amount: '', rewardGiven: '', mode: '', outputSponsorWant: '', aboutSponsor: '' }]);
    };

    const deleteSponsorshipRow = (idToDelete: number) => {
        setSponsorshipRows(sponsorshipRows.filter(row => row.id !== idToDelete));
    };

    const handleSponsorshipChange = (id: number, field: string, value: string) => {
        const updatedRows = sponsorshipRows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        );
        setSponsorshipRows(updatedRows);
    };


    const addChiefGuestRow = () => {
      setChiefGuestRows([...chiefGuestRows, { id: chiefGuestRows.length + 1, name: '', designation: '', address: '', phone: '' }]);
    };

    const deleteChiefGuestRow = (idToDelete: number) => {
      setChiefGuestRows(chiefGuestRows.filter(row => row.id !== idToDelete));
    };

    const handleChiefGuestChange = (id: number, field: string, value: string) => {
        const updatedRows = chiefGuestRows.map(row =>
          row.id === id ? { ...row, [field]: value } : row
        );
      setChiefGuestRows(updatedRows);
    };


    const toggleParticipantCategory = (category: string) => {
        if (selectedParticipantCategories.includes(category)) {
            setSelectedParticipantCategories(selectedParticipantCategories.filter(c => c !== category));
        } else {
            setSelectedParticipantCategories([...selectedParticipantCategories, category]);
        }
    };

    const toggleStudentCategory = (category: string) => {
        if (selectedStudentCategories.includes(category)) {
            setSelectedStudentCategories(selectedStudentCategories.filter(c => c !== category));
        } else {
            setSelectedStudentCategories([...selectedStudentCategories, category]);
        }
    };

    const [dateConflictError, setDateConflictError] = useState<string | null>(null);


    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        alert("Form Submitted (Frontend Only)");

        // Log all form data to the console
        console.log({
            organizingDepartment,
            eventTitle,
            eventDescription,
            durationEvent,
            startDate,
            endDate,
            category,
            designation,
            estimatedBudget,
            pastEvents,
            relevantDetails,
            convenerName,
            convenerEmail,
            fundUniversity,
            fundRegistration,
            fundSponsorship,
            fundOther,
            selectedParticipantCategories,
            selectedStudentCategories,
            expectedParticipants,
            detailedBudgetRows,
            sponsorshipRows,
            chiefGuestRows,
        });
    };

    useEffect(() => {
        setEstimatedBudget(totalDetailedBudget.toString() || '');
    }, [totalDetailedBudget]);


    useEffect(() => {
        setFundSponsorship(totalSponsorshipAmount.toString());
    }, [totalSponsorshipAmount]);

    useEffect(() => {
        const editMode = searchParams.get('edit');
        if (editMode === 'true') {
            const proposalData = {
                id: searchParams.get('proposalId'),
                title: searchParams.get('title'),
                organizer: searchParams.get('organizer'),
                date: searchParams.get('date'),
                status: searchParams.get('status'),
                category: searchParams.get('category'),
                cost: searchParams.get('cost'),
                email: searchParams.get('email'),
                description: searchParams.get('description'),
                location: searchParams.get('location'),
                convenerName: searchParams.get('convenerName'),
                convenerEmail: searchParams.get('convenerEmail'),
                organizingDepartment: searchParams.get('organizer'),
                eventTitle: searchParams.get('title'),
                eventDescription: searchParams.get('description'),
                startDate: searchParams.get('startDate'),
                endDate: searchParams.get('endDate'),
                duration: searchParams.get('duration'),
                pastEvents: searchParams.get('pastEvents'),
                relevantDetails: searchParams.get('relevantDetails'),
                estimatedBudget: searchParams.get('cost'),
                chiefGuestName: searchParams.get('chiefGuestName'),
                chiefGuestDesignation: searchParams.get('chiefGuestDesignation'),
                chiefGuestAddress: searchParams.get('chiefGuestAddress'),
                chiefGuestPhone: searchParams.get('chiefGuestPhone'),
                participantCategories: searchParams.getAll('participantCategories'),
                studentCategories: searchParams.getAll('studentCategories'),
                expectedParticipants: searchParams.get('expectedParticipants'),

            };

            setProposalId(proposalData.id as string || null);
            setOrganizingDepartment(proposalData.organizingDepartment || '');
            setEventTitle(proposalData.eventTitle || '');
            setEventDescription(proposalData.eventDescription || '');
            setCategory(proposalData.category || '');
            setEstimatedBudget(proposalData.estimatedBudget as string || '');
            setConvenerName(proposalData.convenerName || '');
            setConvenerEmail(proposalData.convenerEmail || '');
            setSelectedParticipantCategories(proposalData.participantCategories || []);
            setSelectedStudentCategories(proposalData.studentCategories || []);
            setExpectedParticipants(proposalData.expectedParticipants || '');


            if (proposalData.date) {
                setStartDate(new Date(proposalData.date));
            }
        }
    }, [searchParams]);

    return (
        <>
            <div style={{
                backgroundImage: "url('/SRMIST-BANNER.jpg')",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
            }}>
                <div className="bg-white bg-opacity-70 shadow-sm min-h-screen flex justify-center items-center py-10">
                    <div className="card bg-white shadow-md border border-blue-400 rounded-2xl max-w-7xl w-full mx-4 md:mx-0">
                        <div className="card-body p-8">
                            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">{proposalId ? 'Edit Event Proposal' : 'Submit Event Proposal'}</h2>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="organizing-department">
                                        Organizing Department
                                    </label>
                                    <select
                                        id="organizing-department"
                                        name="organizing-department"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 bg-inherit text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={organizingDepartment}
                                        onChange={(e) => setOrganizingDepartment(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        <optgroup label="Engineering and Technology">
                                            <option value="Aerospace Engineering">Aerospace Engineering</option>
                                            <option value="Automobile Engineering">Automobile Engineering</option>
                                            <option value="Biomedical Engineering">Biomedical Engineering</option>
                                            <option value="Biotechnology">Biotechnology</option>
                                            <option value="Chemical Engineering">Chemical Engineering</option>
                                            <option value="Civil Engineering">Civil Engineering</option>
                                            <option value="Computer Science and Engineering">Computer Science and Engineering</option>
                                            <option value="Ctech">Ctech</option>
                                            <option value="Cintel">Cintel</option>
                                            <option value="Electrical and Electronics Engineering">Electrical and Electronics Engineering</option>
                                            <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                                            <option value="Electronics and Instrumentation Engineering">Electronics and Instrumentation Engineering</option>
                                            <option value="Food Process Engineering">Food Process Engineering</option>
                                            <option value="Genetic Engineering">Genetic Engineering</option>
                                            <option value="Information Technology">Information Technology</option>
                                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                                            <option value="Mechatronics Engineering">Mechatronics Engineering</option>
                                            <option value="Software Engineering">Software Engineering</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="event-title">
                                        Event Title
                                    </label>
                                    <input
                                        type="text"
                                        id="event-title"
                                        name="event-title"
                                        placeholder="Enter Event Title"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={eventTitle ?? ""}
                                        onChange={(e) => setEventTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-gray-700 bg-white text-sm font-bold mb-2"
                                        htmlFor="event-description"
                                    >
                                        Event Description
                                    </label>
                                    <textarea
                                        id="event-description"
                                        name="event-description"
                                        placeholder="Enter Event Description"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={eventDescription}
                                        onChange={(e) => {
                                            const words = e.target.value.split(/\s+/).filter(word => word !== "").length;
                                            if (words <= 200) {
                                                setEventDescription(e.target.value);
                                            }
                                        }}
                                        required
                                    />
                                    <p className="text-sm text-gray-500 mt-1">
                                        {eventDescription.split(/\s+/).filter(word => word !== "").length} / 200 words
                                    </p>
                                </div>

                                <div className="bg-transparent p-6  w-full max-w-xl mx-auto">
                                    <h2 className="text-base font-bold text-gray-800 flex items-left gap-2">
                                        <FaCalendarAlt className="text-blue-500" /> Event Schedule
                                    </h2>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex-1">
                                            <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="start-date">
                                                Start Date & Time
                                            </label>
                                            <DatePicker
                                              id="start-date"
                                              selected={startDate}
                                               onChange={(date) => {
                                                 setStartDate(date);
      
                                        }}
                                           showTimeSelect
                                           dateFormat="Pp"
                                            className="w-full px-4 py-2 bg-transparent border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div className="w-[2px] h-12 bg-gray-300 mx-4"></div>

                                        <div className="flex-1">
                                            <label className="block text-gray-700 text-sm font-semibold mb-1" htmlFor="end-date">
                                                End Date & Time
                                            </label>
                                            <DatePicker
                                                id="end-date"
                                                selected={endDate}
                                                onChange={(date) => {
                                                    setEndDate(date);
                                                
                                                }}
                                                showTimeSelect
                                                dateFormat="Pp"
                                                className="w-full px-4 bg-transparent py-2 border rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {durationEvent && (
                                        <p className="mt-4 text-center text-gray-800 font-semibold bg-blue-50 px-4 py-2 rounded-lg">
                                            ⏳ Duration: {durationEvent}
                                        </p>
                                    )}
                                    {dateConflictError && (
                                        <p className="mt-4 text-center text-red-500 font-semibold bg-red-100 px-4 py-2 rounded-lg">
                                            ⚠️ {dateConflictError}
                                        </p>
                                    )}
                                </div>


                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="category">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="conference_national">Conference - National</option>
                                        <option value="conference_international">Conference - International</option>
                                        <option value="fdp">FDPs</option>
                                        <option value="workshop">Workshops</option>
                                        <option value="winter_summer_school">Winter / Summer Schools</option>
                                        <option value="mdp_pdp">MDP / PDP</option>
                                        <option value="student_programme">Student Related Programmes</option>
                                        <option value="alumni_programme">Alumni Related Programmes</option>
                                        <option value="outreach_programme">Outreach Programmes</option>
                                        <option value="value_added_course">Value Added Courses</option>
                                        <option value="association_activity">Association Activities</option>
                                        <option value="counselling_activity">Counselling Activities</option>
                                        <option value="commemoration_day">International / National Commemoration Days</option>
                                        <option value="upskilling_non_teaching">Upskilling for Non-Teaching</option>
                                        <option value="industrial_conclave">Industrial Conclave</option>
                                        <option value="patent_commercialisation">Patent Commercialisation</option>
                                        <option value="lecture_series_industry_expert">Lecture Series - Industry Experts</option>

                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="designation">
                                        Designation
                                    </label>
                                    <select
                                        id="designation"
                                        name="designation"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={designation}
                                        onChange={(e) => setDesignation(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select your designation</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="HOD">HOD (Head of Department)</option>
                                        <option value="Dean">Dean</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="past-events">
                                        Past Events (2021-2024)
                                    </label>
                                    <textarea
                                        id="past-events"
                                        name="past-events"
                                        placeholder="List any past relevant events organized by the department (2021-2024)"
                                        rows={3}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={pastEvents}
                                        onChange={(e) => setPastEvents(e.target.value)}
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="relevant-details">
                                        Any Other Relevant Details
                                    </label>
                                    <textarea
                                        id="relevant-details"
                                        name="relevant-details"
                                        placeholder="Include any other details that might be relevant to your proposal"
                                        rows={3}
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={relevantDetails}
                                        onChange={(e) => setRelevantDetails(e.target.value)}
                                    ></textarea>
                                </div>

                                <div>
                                  <h3 className="text-xl font-bold text-gray-800 mb-4">Chief Guest Details</h3>
                                    <div className="overflow-x-auto">
                                      <table className="table-auto w-full shadow-md rounded-md">
                                        <thead className="bg-blue-50">
                                          <tr className="text-left">
                                            <th className="px-4 py-2">S.No</th>
                                            <th className="px-4 py-2">Name</th>
                                            <th className="px-4 py-2">Designation</th>
                                            <th className="px-4 py-2">Address</th>
                                            <th className="px-4 py-2">Phone</th>
                                            <th className="px-4 py-2">Delete</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {chiefGuestRows.map((row, index) => (
                                            <tr key={row.id} className="border-b border-gray-200">
                                              <td className="px-4 py-1">{index + 1}</td>
                                              <td className="px-4 py-2">
                                                <label htmlFor={`chief-guest-name-${row.id}`} className="sr-only">Name for row {row.id}</label>
                                                <input type="text" id={`chief-guest-name-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.name} onChange={(e) => handleChiefGuestChange(row.id, 'name', e.target.value)} />
                                              </td>
                                              <td className="px-4 py-2">
                                              <label htmlFor={`chief-guest-designation-${row.id}`} className="sr-only">Designation for row {row.id}</label>
                                                <input type="text" id={`chief-guest-designation-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.designation} onChange={(e) => handleChiefGuestChange(row.id, 'designation', e.target.value)} />
                                              </td>
                                              <td className="px-4 py-2">
                                              <label htmlFor={`chief-guest-address-${row.id}`} className="sr-only">Address for row {row.id}</label>
                                                <input type="text" id={`chief-guest-address-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.address} onChange={(e) => handleChiefGuestChange(row.id, 'address', e.target.value)} />
                                              </td>
                                              <td className="px-4 py-2">
                                              <label htmlFor={`chief-guest-phone-${row.id}`} className="sr-only">Phone for row {row.id}</label>
                                                <input type="text" id={`chief-guest-phone-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.phone} onChange={(e) => handleChiefGuestChange(row.id, 'phone', e.target.value)} />
                                              </td>
                                              <td className="px-4 py-2">
                                                <button
                                                  type="button"
                                                  onClick={() => deleteChiefGuestRow(row.id)}
                                                  className="btn btn-sm btn-circle btn-error text-white"
                                                  aria-label={`Delete chief guest row ${row.id}`}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <button type="button" onClick={addChiefGuestRow} className="btn btn-outline mt-4 rounded-full">+ Add Row</button>
                                </div>

                                <div>
                                    <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="convener-name">
                                        Convener Name
                                    </label>
                                    <input
                                        type="text"
                                        id="convener-name"
                                        name="convener-name"
                                        placeholder="Enter Your Name"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={convenerName}
                                        onChange={(e) => setConvenerName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-gray-700 bg-white text-sm font-bold mb-2"
                                        htmlFor="convener-email"
                                    >
                                        Convener Email
                                    </label>
                                    <input
                                        type="email"
                                        id="convener-email"
                                        name="convener-email"
                                        value={convenerEmail}
                                        onChange={(e) => setConvenerEmail(e.target.value)}
                                        className="border bg-transparent p-2 text-black rounded w-full"
                                    />
                                </div>

                                  <div>
                                    <label
                                        className="block text-gray-700 bg-white text-sm font-bold mb-2"
                                        htmlFor="expected-participants"
                                    >
                                        Total No of Expected Participants
                                    </label>
                                    <input
                                        type="number"
                                        id="expected-participants"
                                        name="expected-participants"
                                        placeholder="Enter Total Number"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={expectedParticipants}
                                        onChange={(e) => setExpectedParticipants(e.target.value)}
                                        required
                                    />
                                </div>


                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Category of Participants
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {participantCategories.map((category) => (
                                            <span
                                                key={category}
                                                className={`badge badge-outline cursor-pointer ${selectedParticipantCategories.includes(category) ? 'bg-blue-500 text-white' : ''}`}
                                                onClick={() => toggleParticipantCategory(category)}
                                            >
                                                {category}
                                            </span>
                                        ))}
                                    </div>
                                </div>


                                {selectedParticipantCategories.includes("Students (Category)") && (
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">
                                            Student Categories
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {studentCategories.map((category) => (
                                                  <span
                                                  key={category}
                                                  className={`badge badge-outline cursor-pointer ${selectedStudentCategories.includes(category) ? 'bg-blue-500 text-white' : ''}`}
                                                  onClick={() => toggleStudentCategory(category)}
                                              >
                                                  {category}
                                              </span>                                            ))}
                                        </div>
                                    </div>
                                )}



                                <div>
                                    <label
                                        className="block text-gray-700 bg-white text-sm font-bold mb-2"
                                        htmlFor="estimated-budget"
                                    >
                                        Total Estimated Budget (₹)
                                    </label>
                                    <input
                                        type="number"
                                        id="estimated-budget"
                                        name="estimated-budget"
                                        placeholder="Total Budget"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                        value={totalDetailedBudget}
                                        onChange={(e) => setEstimatedBudget(e.target.value)}
                                        readOnly
                                    />
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Funding Details (₹)</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="fund-university">
                                                University Fund
                                            </label>
                                            <input type="number" id="fund-university" name="fund-university" placeholder="0" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                                value={fundUniversity}
                                                onChange={(e) => setFundUniversity(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="fund-registration">
                                                Registration Fund
                                            </label>
                                            <input type="number" id="fund-registration" name="fund-registration" placeholder="0"                                                 className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                                value={fundRegistration}
                                                onChange={(e) => setFundRegistration(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="fund-sponsorship">
                                                Sponsorship Fund
                                            </label>
                                            <input
                                                type="number"
                                                id="fund-sponsorship"
                                                name="fund-sponsorship"
                                                placeholder="0"
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-200 leading-tight focus:outline-none focus:shadow-outline"
                                                value={totalSponsorshipAmount}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-gray-700 bg-white text-sm font-bold mb-2" htmlFor="fund-other">
                                                Other Sources Fund
                                            </label>
                                            <input type="number" id="fund-other" name="fund-other" placeholder="0" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                                value={fundOther}
                                                onChange={(e) => setFundOther(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Budget</h3>
                                    <div className="overflow-x-auto">
                                        <table className="table-auto w-full shadow-md rounded-md">
                                            <thead className="bg-blue-50">
                                                <tr className="text-left">
                                                    <th className="px-4 py-2">S.No</th>
                                                    <th className="px-4 py-2">Catogery <span className='ml-20'>Sub Catogery</span><span className='ml-16'>Location Type</span></th>
                                                   
                                                    <th className="px-4 py-2">Quantity</th>
                                                    <th className="px-4 py-2">Cost/Unit (₹)</th>
                                                    <th className="px-4 py-2">Total Amount (₹)</th>
                                                    <th className="px-4 py-2">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailedBudgetRows.map((row) => (
                                                    <tr key={row.id} className="border-b border-gray-200">
                                                        <td className="px-4 py-1">{row.id}</td>
                                                        <td className="px-3 py-2">
                                                            <div className="flex items-center justify-between p-3 rounded-lg w-full">
                                                                <div className="w-1/3 pr-2">
                                                                    <label htmlFor={`main-category-${row.id}`} className="sr-only">Main Category for row {row.id}</label>
                                                                    <select
                                                                        id={`main-category-${row.id}`}
                                                                        className="select select-bordered w-full text-gray-700 font-medium bg-gray-100 hover:bg-white transition focus:ring-2 focus:ring-blue-500"
                                                                        value={row.mainCategory || ""}
                                                                        onChange={(e) => handleDetailedBudgetChange(row.id, 'mainCategory', e.target.value)}
                                                                    >
                                                                        <option value="" disabled hidden>Main Category</option>
                                                                        <option value="Budgetary Expenditures">Budgetary Expenditures</option>
                                                                        <option value="Publicity">Publicity</option>
                                                                        <option value="General">General</option>
                                                                        <option value="Honorarium">Honorarium</option>
                                                                        <option value="Hospitality">Hospitality</option>
                                                                        <option value="Inaugural and Valedictory">Inaugural and Valedictory</option>
                                                                        <option value="Resource Materials">Resource Materials</option>
                                                                        <option value="Conference Paper Publication">Conference Paper Publication</option>
                                                                    </select>
                                                                </div>

                                                                <div className="w-1/3 px-2">
                                                                    <label htmlFor={`sub-category-${row.id}`} className="sr-only">Subcategory for row {row.id}</label>
                                                                    <select
                                                                        id={`sub-category-${row.id}`}
                                                                        className="select select-bordered w-full text-gray-700 font-medium bg-gray-100 hover:bg-white transition focus:ring-2 focus:ring-blue-500"
                                                                        value={row.subCategory || ""}
                                                                        onChange={(e) => handleDetailedBudgetChange(row.id, 'subCategory', e.target.value)}
                                                                    >
                                                                        <option value="" disabled hidden>Subcategory</option>

                                                                        {row.mainCategory === "Budgetary Expenditures" && (
                                                                            <>
                                                                                <option value="Number of Sessions Planned">Number of Sessions Planned</option>
                                                                                <option value="Number of Keynote Speakers">Number of Keynote Speakers</option>
                                                                                <option value="Number of Session Judges">Number of Session Judges</option>
                                                                                <option value="Number of Celebrities / Chief Guests">Number of Celebrities / Chief Guests</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Publicity" && (
                                                                            <>
                                                                                <option value="Invitation">Invitation</option>
                                                                                <option value="Press Coverage">Press Coverage</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "General" && (
                                                                            <>
                                                                                <option value="Conference Kits">Conference Kits</option>
                                                                                <option value="Printing and Stationery">Printing and Stationery</option>
                                                                                <option value="Secretarial Expenses">Secretarial Expenses</option>
                                                                                <option value="Mementos">Mementos</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Honorarium" && (
                                                                            <>
                                                                                <option value="Keynote Speakers">Keynote Speakers</option>
                                                                                <option value="Session Judges">Session Judges</option>
                                                                                <option value="Chief Guests">Chief Guests</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Hospitality" && (
                                                                            <>
                                                                                <option value="Train / Flight for Chief Guest / Keynote Speakers">Train / Flight for Chief Guest / Keynote Speakers</option>
                                                                                <option value="Accommodation for Chief Guest / Keynote Speakers">Accommodation for Chief Guest / Keynote Speakers</option>
                                                                                <option value="Food and Beverages for Chief Guest / Keynote Speakers">Food and Beverages for Chief Guest / Keynote Speakers</option>
                                                                                <option value="Local Travel Expenses">Local Travel Expenses</option>
                                                                                <option value="Food for Participants">Food for Participants</option>
                                                                                <option value="Food & Snacks for Volunteers / Organizers">Food & Snacks for Volunteers / Organizers</option>
                                                                                <option value="Hostel Accommodation">Hostel Accommodation</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Inaugural and Valedictory" && (
                                                                            <>
                                                                                <option value="Banners, Pandal etc">Banners, Pandal etc</option>
                                                                                <option value="Lighting and Decoration">Lighting and Decoration</option>
                                                                                <option value="Flower Bouquet">Flower Bouquet</option>
                                                                                <option value="Cultural Events">Cultural Events</option>
                                                                                <option value="Field Visits / Sightseeing">Field Visits / Sightseeing</option>
                                                                                <option value="Miscellaneous">Miscellaneous</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Resource Materials" && (
                                                                            <>
                                                                                <option value="Preparation, Printing, Binding">Preparation, Printing, Binding</option>
                                                                            </>
                                                                        )}
                                                                        {row.mainCategory === "Conference Paper Publication" && (
                                                                            <>
                                                                                <option value="Extended Abstract">Extended Abstract</option>
                                                                                <option value="Full Paper">Full Paper</option>
                                                                            </>
                                                                        )}
                                                                    </select>
                                                                </div>

                                                                <div className="w-1/3 pl-2">
                                                                    <div role="group" aria-labelledby={`location-type-label-${row.id}`}>
                                                                        <span id={`location-type-label-${row.id}`} className="block text-gray-700 text-sm font-semibold mb-1"></span>
                                                                        <label className="flex items-center gap-1 cursor-pointer text-gray-700 hover:text-black transition mb-2">
                                                                            <input
                                                                                type="radio"
                                                                                name={`location-${row.id}`}
                                                                                value="Domestic"
                                                                                className="radio radio-primary"
                                                                                checked={row.locationType === "Domestic"}
                                                                                onChange={(e) => handleDetailedBudgetChange(row.id, 'locationType', e.target.value)}
                                                                            />
                                                                            <span className="text-sm">Domestic</span>
                                                                        </label>
                                                                        <label className="flex items-center gap-1 cursor-pointer text-gray-700 hover:text-black transition">
                                                                            <input
                                                                                type="radio"
                                                                                name={`location-${row.id}`}
                                                                                value="International"
                                                                                className="radio radio-primary"
                                                                                checked={row.locationType === "International"}
                                                                                onChange={(e) => handleDetailedBudgetChange(row.id, 'locationType', e.target.value)}
                                                                            />
                                                                            <span className="text-sm">International</span>
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <label htmlFor={`quantity-${row.id}`} className="sr-only">Quantity for row {row.id}</label>
                                                            <input type="number" id={`quantity-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.quantity} onChange={(e) => handleDetailedBudgetChange(row.id, 'quantity', e.target.value)} /></td>
                                                        <td className="px-4 py-2">
                                                            <label htmlFor={`cost-per-unit-${row.id}`} className="sr-only">Cost per unit for row {row.id}</label>
                                                            <input type="number" id={`cost-per-unit-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.costPerUnit} onChange={(e) => handleDetailedBudgetChange(row.id, 'costPerUnit', e.target.value)} /></td>
                                                        <td className="px-4 py-2">
                                                            <label htmlFor={`total-amount-${row.id}`} className="sr-only">Total amount for row {row.id} (Read-only)</label>
                                                            <input type="number" id={`total-amount-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-gray-200 leading-tight focus:outline-none focus:shadow-outline" value={row.totalAmount || 0} readOnly />
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => deleteDetailedBudgetRow(row.id)}
                                                                className="btn btn-sm btn-circle btn-error text-white"
                                                                aria-label={`Delete budget row ${row.id}`}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" onClick={addDetailedBudgetRow} className="btn btn-outline mt-4 rounded-full">+ Add Row</button></div>

                                <div className="mt-8">
                                      <h3 className="text-xl font-bold text-gray-800 mb-4">Sponsorship Details</h3>
                                      <div className="overflow-x-auto">
                                          <table className="table-auto w-full shadow-md rounded-md">
                                              <thead className="bg-blue-50">
                                                  <tr className="text-left">
                                                      <th className="px-4 py-2">S.No</th>
                                                      <th className="px-4 py-2">Category</th>
                                                      <th className="px-4 py-2">Amount (₹)</th>
                                                      <th className="px-4 py-2">Reward Given</th>
                                                      <th className="px-4 py-2">Mode</th>
                                                      <th className="px-4 py-2">Output Sponsor Wants</th>
                                                      <th className="px-4 py-2">Delete</th>
                                                  </tr>
                                              </thead>
                                              <tbody>
                                                  {sponsorshipRows.map((row, index) => (
                                                      <React.Fragment key={row.id}>
                                                          <tr className="border-b border-gray-200">
                                                              <td className="px-4 py-1">{index + 1}</td>
                                                              <td className="px-4 py-2">
                                                                  <label htmlFor={`sponsorship-category-${row.id}`} className="sr-only">Category for row {row.id}</label>
                                                                  <input type="text" id={`sponsorship-category-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.category} onChange={(e) => handleSponsorshipChange(row.id, 'category', e.target.value)} />
                                                              </td>
                                                              <td className="px-4 py-2">
                                                                  <label htmlFor={`sponsorship-amount-${row.id}`} className="sr-only">Amount for row {row.id}</label>
                                                                  <input type="number" id={`sponsorship-amount-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.amount} onChange={(e) => handleSponsorshipChange(row.id, 'amount', e.target.value)} />
                                                              </td>
                                                              <td className="px-4 py-2">
                                                                  <label htmlFor={`reward-given-${row.id}`} className="sr-only">Reward Given for row {row.id}</label>
                                                                  <input type="text" id={`reward-given-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.rewardGiven} onChange={(e) => handleSponsorshipChange(row.id, 'rewardGiven', e.target.value)} />
                                                              </td>
                                                              <td className="px-4 py-2">
                                                                  <label htmlFor={`mode-${row.id}`} className="sr-only">Mode for row {row.id}</label>
                                                                  <input type="text" id={`mode-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.mode} onChange={(e) => handleSponsorshipChange(row.id, 'mode', e.target.value)} />
                                                              </td>
                                                              <td className="px-4 py-2">
                                                                  <label htmlFor={`output-sponsor-want-${row.id}`} className="sr-only">Output Sponsor Wants for row {row.id}</label>
                                                                  <input type="text" id={`output-sponsor-want-${row.id}`} className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500" value={row.outputSponsorWant} onChange={(e) => handleSponsorshipChange(row.id, 'outputSponsorWant', e.target.value)} />
                                                              </td>
                                                              <td className="px-4 py-2">
                                                                  <button
                                                                      type="button"
                                                                      onClick={() => deleteSponsorshipRow(row.id)}
                                                                      className="btn btn-sm btn-circle btn-error text-white"
                                                                      aria-label={`Delete sponsorship row ${row.id}`}
                                                                  >
                                                                      <Trash2 className="h-4 w-4" />
                                                                  </button>
                                                              </td>
                                                          </tr>
                                                          {/* About Sponsor Row */}
                                                          <tr className="border-b border-gray-200">
                                                              <td colSpan={7} className="px-4 py-2">
                                                                  <label htmlFor={`about-sponsor-${row.id}`} className="block text-gray-700 text-sm font-bold mb-2">About Sponsor:</label>
                                                                  <textarea
                                                                      id={`about-sponsor-${row.id}`}
                                                                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-white leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
                                                                      value={row.aboutSponsor}
                                                                      onChange={(e) => {
                                                                          const words = e.target.value.split(/\s+/).filter(word => word !== "").length;
                                                                          if (words <= 200) {
                                                                              handleSponsorshipChange(row.id, 'aboutSponsor', e.target.value);
                                                                            }
                                                                        }}
                                                                      rows={3}
                                                                      placeholder="Enter details about the sponsor (max 200 words)"
                                                                    />
                                                                    <p className="text-sm text-gray-500 mt-1">
                                                                    {row.aboutSponsor.split(/\s+/).filter(word => word !== "").length} / 200 words
                                                                    </p>
                                                              </td>
                                                          </tr>
                                                      </React.Fragment>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                      <button type="button" onClick={addSponsorshipRow} className="btn btn-outline mt-4 rounded-full">+ Add Row</button>
                                  </div>

                                <div className="mt-10">
                                <div className="mt-10">
                         <button
                        type="submit"
                         className="btn btn-primary w-full rounded-full text-lg font-semibold py-3 hover:shadow-xl transition-shadow duration-300"
                           >
                           {proposalId ? 'Update Proposal' : 'Submit Proposal'}
                      </button>
                                </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
                                            