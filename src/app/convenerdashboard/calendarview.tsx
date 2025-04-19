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

interface CalendarViewProps {
    proposals: Proposal[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ proposals }) => {
    const [eventProposals, setEventProposals] = useState<Proposal[]>(proposals);
    const [loading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Proposal | null>(null);

    useState(() => {
        setEventProposals(proposals);
    }, [proposals]);

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