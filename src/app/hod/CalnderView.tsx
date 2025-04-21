// components/dashboard/CalendarView.tsx (Ensure correct filename casing)
"use client";
import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg } from '@fullcalendar/core';

// --- Loading/No Proposals Components (Keep as they are or customize) ---
const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg">
        <div className="text-gray-500 animate-pulse">Loading Calendar...</div>
    </div>
);

const NoProposalsComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg">
        <div className="text-gray-500 text-center p-4">
            <p className="text-lg">No proposals to display in the calendar.</p>
        </div>
    </div>
);

// Simplified Proposal interface for Calendar View props
// It relies on the parent passing necessary fields.
interface ProposalForCalendar {
    id: string;
    title: string;
    start?: string; // Use start/end for FullCalendar events
    end?: string;
    date?: string; // Keep 'date' as a potential primary source from parent mapping
    eventStartDate?: string; // Keep alternatives parent might use
    eventEndDate?: string;
    status: string; // Used for coloring
    // Include any other props you might map to `extendedProps` if needed by `onEventClick` indirectly
    [key: string]: any; // Allow other properties potentially passed
}

interface CalendarViewProps {
    proposals: ProposalForCalendar[];
    onEventClick: (clickInfo: EventClickArg) => void; // Callback for event clicks
}

const CalendarView: React.FC<CalendarViewProps> = ({ proposals, onEventClick }) => {
    const [loading] = useState(false); // Basic loading state (can be enhanced)

    // Memoize calendar events to prevent recalculation on every render unless proposals change
    const calendarEvents = useMemo((): EventInput[] => {
        if (!proposals) return [];

        return proposals.map(proposal => {
            let backgroundColor = '#60a5fa'; // Default blue (Consider for Pending)
            let borderColor = '#60a5fa';

            switch (proposal.status?.toLowerCase()) {
                case 'approved':
                    backgroundColor = '#22c55e'; // Green
                    borderColor = '#16a34a';
                    break;
                case 'review':
                    backgroundColor = '#eab308'; // Yellow
                    borderColor = '#ca8a04';
                    break;
                case 'rejected':
                    backgroundColor = '#ef4444'; // Red
                    borderColor = '#dc2626';
                    break;
                case 'pending':
                    backgroundColor = '#f97316'; // Orange for pending?
                    borderColor = '#ea580c';
                    break;
                default:
                    // Keep default blue for unknown statuses
                    break;
            }

            // Determine start/end dates, preferring specific fields but falling back
            const startDate = proposal.eventStartDate || proposal.start || proposal.date;
            const endDate = proposal.eventEndDate || proposal.end; // End date might be optional

            return {
                id: proposal.id, // Important: Pass the proposal ID
                title: proposal.title || 'Untitled Event',
                start: startDate,
                end: endDate, // FullCalendar handles missing end date
                allDay: true, // Assuming all-day events based on previous code
                extendedProps: proposal, // Pass the original proposal subset as extendedProps
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                textColor: '#ffffff', // White text generally works well
                classNames: ['cursor-pointer', 'hover:opacity-80', 'transition-opacity', 'text-xs', 'p-1', 'rounded-sm'] // Add some default styling classes
            };
        }).filter(event => !!event.start); // Filter out events without a valid start date

    }, [proposals]); // Dependency array

    if (loading) {
        return <LoadingComponent />;
    }

    if (!proposals || proposals.length === 0) {
        return <NoProposalsComponent />;
    }

    return (
        <div className="h-full w-full font-sans text-gray-900">
            {/* Added card styling */}
            <div className="bg-white p-4 rounded-lg shadow-md">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek' // Consider removing timeGridDay if not needed
                    }}
                    events={calendarEvents}
                    eventClick={onEventClick} // Use the prop passed from HODDashboard
                    // eventClassNames="cursor-pointer hover:opacity-80 transition-opacity" // Can apply classes here or within event object
                    height="75vh" // Adjust height as needed
                    themeSystem="standard" // Standard theme is usually fine
                    dayMaxEvents={true} // allow "more" link when too many events
                    weekends={true} // Show weekends
                  
                />
            </div>
        </div>
    );
};

export default CalendarView;