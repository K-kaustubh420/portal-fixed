"use client";
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput } from '@fullcalendar/core';
import Popup from './popup';

const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500 animate-spin">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
        </div>
    </div>
);

const NoProposalsComponent = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-500 text-center">
            <p className="text-lg">No approved proposals to display.</p>
        </div>
    </div>
);

interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    status: string;
    category: string;
    cost: number;
    email: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation: string;
    detailedBudget: { mainCategory: string; subCategory: string; totalAmount?: number }[];
    durationEvent: string;
    estimatedBudget: number;
    eventDate: string;
    eventDescription: string;
    eventEndDate: string;
    eventStartDate: string;
    eventTitle: string;
    fundingDetails?: {
        registrationFund?: number;
        sponsorshipFund?: number;
        universityFund?: number;
        otherSourcesFund?: number;
    };
    organizingDepartment: string;
    pastEvents?: string[];
    proposalStatus: string;
    relevantDetails?: string;
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: { [key: string]: string | number | boolean }[];
    submissionTimestamp: string;
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
    tags?: string[]; // Added tags property
}

const CalendarView: React.FC = () => {
    const [eventProposals] = useState<Proposal[]>([
        {
            id: "1",
            title: "Tech Conference 2025",
            organizer: "Ctech",
            date: "2025-06-15",
            status: "Approved",
            category: "Conference",
            cost: 5000,
            email: "convener@example.com",
            description: "A conference on emerging technologies.",
            location: "Main Campus",
            convenerName: "John Doe",
            convenerEmail: "john.doe@example.com",
            chiefGuestName: "Jane Smith",
            chiefGuestDesignation: "CEO",
            designation: "Professor",
            detailedBudget: [
                { mainCategory: "Venue", subCategory: "Hall Rental", totalAmount: 2000 },
                { mainCategory: "Catering", subCategory: "Food", totalAmount: 1500 },
            ],
            durationEvent: "2 days",
            estimatedBudget: 5000,
            eventDate: "2025-06-15",
            eventDescription: "A conference on emerging technologies.",
            eventEndDate: "2025-06-16",
            eventStartDate: "2025-06-15",
            eventTitle: "Tech Conference 2025",
            fundingDetails: {
                registrationFund: 1000,
                sponsorshipFund: 2000,
                universityFund: 1500,
            },
            organizingDepartment: "Ctech",
            pastEvents: ["Tech Conference 2024"],
            proposalStatus: "Approved",
            relevantDetails: "Focus on AI and ML.",
            sponsorshipDetails: ["Company A", "Company B"],
            sponsorshipDetailsRows: [{ sponsor: "Company A", amount: 1000 }],
            submissionTimestamp: "2025-04-01",
            rejectionMessage: "",
            reviewMessage: "",
            clarificationMessage: "",
            tags: ["Done"],
        },
        {
            id: "2",
            title: "AI Workshop 2025",
            organizer: "Cintel",
            date: "2025-07-10",
            status: "Approved",
            category: "Workshop",
            cost: 3000,
            email: "convener2@example.com",
            description: "A workshop on AI advancements.",
            location: "Tech Lab",
            convenerName: "Alice Brown",
            convenerEmail: "alice.brown@example.com",
            chiefGuestName: "Bob Wilson",
            chiefGuestDesignation: "CTO",
            designation: "Associate Professor",
            detailedBudget: [
                { mainCategory: "Equipment", subCategory: "Projectors", totalAmount: 1000 },
                { mainCategory: "Materials", subCategory: "Handouts", totalAmount: 500 },
            ],
            durationEvent: "1 day",
            estimatedBudget: 3000,
            eventDate: "2025-07-10",
            eventDescription: "A workshop on AI advancements.",
            eventEndDate: "2025-07-10",
            eventStartDate: "2025-07-10",
            eventTitle: "AI Workshop 2025",
            fundingDetails: {
                registrationFund: 500,
                sponsorshipFund: 1500,
                universityFund: 1000,
            },
            organizingDepartment: "Cintel",
            pastEvents: ["AI Workshop 2024"],
            proposalStatus: "Approved",
            relevantDetails: "Focus on deep learning.",
            sponsorshipDetails: ["Company“C"],
            sponsorshipDetailsRows: [{ sponsor: "Company C", amount: 1500 }],
            submissionTimestamp: "2025-03-15",
            rejectionMessage: "",
            reviewMessage: "",
            clarificationMessage: "",
            tags: ["Review"],
        },
    ]);
    const [loading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Proposal | null>(null);

    const calendarEvents: EventInput[] = eventProposals.map(proposal => {
        let backgroundColor = '#3b82f6';
        if (proposal.tags?.includes('Done')) backgroundColor = '#22c55e';
        if (proposal.tags?.includes('Review')) backgroundColor = '#eab308';
        if (proposal.tags?.includes('Rejected')) backgroundColor = '#ef4444';

        return {
            id: proposal.id,
            title: proposal.title,
            start: proposal.date,
            allDay: true,
            extendedProps: proposal,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor,
            textColor: 'white',
        };
    });

    const handleEventClick = (clickInfo: any) => {
        setSelectedEvent(clickInfo.event.extendedProps as Proposal);
    };

    const closePopup = () => {
        setSelectedEvent(null);
    };

    if (loading) {
        return <LoadingComponent />;
    }

    if (eventProposals.length === 0) {
        return <NoProposalsComponent />;
    }

    return (
        <div className="h-full w-full font-sans text-gray-900">
            <div className="">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventClassNames="cursor-pointer"
                    height="80vh"
                    themeSystem="standard"
                    titleFormat={{
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                    }}
                />
            </div>

            {selectedEvent && (
                <Popup
                    selectedProposal={selectedEvent}
                    closePopup={closePopup}
                />
            )}
        </div>
    );
};

export default CalendarView;
