"use client";
import React from 'react'; // Removed useState if Popup is handled externally
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput } from '@fullcalendar/core';

// Loading and Empty State Components
const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg">
        <div className="text-gray-500 flex flex-col items-center">
            <span className="loading loading-spinner loading-lg text-blue-500"></span>
            <p className="mt-2 text-sm">Loading Calendar...</p>
        </div>
    </div>
);
const NoProposalsComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg p-4">
        <div className="text-gray-500 text-center">
            <p className="text-lg">No proposals to display on the calendar.</p>
        </div>
    </div>
);

// Interface for CalendarProposal
// Ensure this matches the structure mapped in HODDashboard
export interface CalendarProposal {
    id: string;
    title: string;
    eventStartDate: string;
    eventEndDate: string;
    status: string;
    organizer: string;
    date: string;
    category: string;
    description: string;
    convenerName: string;
    submissionTimestamp: string;
    awaiting?: string | null;
    // Include other fields if needed by potential internal logic or tooltips
    cost?: number;
    email?: string;
    location?: string;
    convenerEmail?: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string;
    fundingDetails: {}; // Add specific fields if used
}

interface CalendarViewProps {
    proposals: CalendarProposal[];
    onEventClick: (proposalData: CalendarProposal) => void;
}

// Get event color based on status
const getEventColor = (status: string): { backgroundColor: string; borderColor: string } => {
    const lowerStatus = status?.toLowerCase() || 'unknown';
    switch (lowerStatus) {
        case 'approved': return { backgroundColor: '#10b981', borderColor: '#059669' };
        case 'completed': return { backgroundColor: '#8b5cf6', borderColor: '#7c3aed' };
        case 'pending': return { backgroundColor: '#f59e0b', borderColor: '#d97706' };
        case 'rejected': return { backgroundColor: '#ef4444', borderColor: '#dc2626' };
        case 'review': return { backgroundColor: '#3b82f6', borderColor: '#2563eb' };
        default: return { backgroundColor: '#6b7280', borderColor: '#4b5563' };
    }
};

const CalendarView: React.FC<CalendarViewProps> = ({ proposals, onEventClick }) => {

    const calendarEvents: EventInput[] = proposals.map(proposal => {
        const { backgroundColor, borderColor } = getEventColor(proposal.status);
        return {
            id: proposal.id,
            title: proposal.title,
            start: proposal.eventStartDate,
            end: proposal.eventEndDate,
            extendedProps: proposal, // Attach full data
            backgroundColor,
            borderColor,
            textColor: 'white',
            classNames: ['cursor-pointer', 'text-xs', 'p-0.5', 'rounded-sm']
        };
    });

    // Internal handler to extract data and pass to parent
    const handleEventClickInternal = (clickInfo: any) => {
        const proposalData = clickInfo.event.extendedProps as CalendarProposal;
        onEventClick(proposalData); // Pass the extracted data
    };

    if (!proposals) return <LoadingComponent />;
    if (proposals.length === 0) return <NoProposalsComponent />;

    return (
        <div className="h-full w-full font-sans text-gray-800 bg-white p-4 shadow-md rounded-lg">
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,listWeek'
                }}
                events={calendarEvents}
                eventClick={handleEventClickInternal}
                height="auto"
                contentHeight="auto"
                themeSystem="standard"
                eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                slotLabelFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short' }}
                dayMaxEvents={true}
                eventDisplay="block"
            />
            {/* Removed Popup rendering from here, assuming it's handled solely in HODDashboard */}
        </div>
    );
};

export default CalendarView;