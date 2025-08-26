// CalendarView.tsx
"use client";
import React, { useState, useEffect } from 'react'; // Keep useEffect if needed elsewhere, but not for mirroring props
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput } from '@fullcalendar/core';
import Popup from './popup'; // Assuming Popup component is correctly imported

// --- Loading and Empty State Components (No Change) ---
const LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg"> {/* Adjusted height and bg */}
        <div className="text-gray-500 flex flex-col items-center">
            <span className="loading loading-spinner loading-lg text-blue-500"></span>
            <p className="mt-2 text-sm">Loading Calendar...</p>
        </div>
    </div>
);

const NoProposalsComponent = () => (
    <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg p-4"> {/* Adjusted height and bg */}
        <div className="text-gray-500 text-center">
            <p className="text-lg">No proposals to display on the calendar.</p>
            {/* Optional: Add an icon or further guidance */}
        </div>
    </div>
);

// --- Interface for Props expected by CalendarView ---
// This should match the structure mapped in ConvenerDashboard
interface CalendarProposal {
    id: string; // Or number if preferred, ensure consistency
    title: string;
    // Use the correct date fields passed from the parent
    eventStartDate: string; // Expecting 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
    eventEndDate: string;   // Expecting 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'
    // Status should match the values passed from parent (likely lowercase)
    status: 'pending' | 'approved' | 'rejected' | 'review' | 'completed' | string; // Use lowercase
    // Include ALL fields needed by the Popup component when an event is clicked
    // These might be redundant with PopupProposal but necessary here for handleEventClick
    organizer: string;
    date: string; // Often redundant if eventStartDate is present, but keep if Popup needs it
    category: string;
    cost?: number; // Optional cost
    email?: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail?: string;
    chiefGuestName?: string;
    chiefGuestDesignation?: string;
    designation?: string; // Possibly redundant with chiefGuestDesignation
    detailedBudget?: any[];
    durationEvent?: string;
    estimatedBudget?: number;
    eventDate?: string; // Alias for eventStartDate
    eventDescription?: string; // Alias for description
    eventTitle?: string; // Alias for title
    fundingDetails?: { /* ... */ };
    organizingDepartment?: string;
    pastEvents?: string | null; // Use string | null based on DetailedProposal
    proposalStatus?: string; // Alias for status
    relevantDetails?: string | null; // Use string | null based on DetailedProposal
    sponsorshipDetails?: string[];
    sponsorshipDetailsRows?: any[];
    submissionTimestamp: string;
    rejectionMessage?: string;
    reviewMessage?: string;
    clarificationMessage?: string;
    awaiting?: string | null; // Include awaiting status
    // Add participant details etc. if Popup needs them
    participant_expected?: number | null;
    participant_categories?: string[] | null;
    items?: any[];
    sponsors?: any[];
    chief?: any; // Or the specific User type if needed by Popup
}

interface CalendarViewProps {
    // Expect an array of objects matching the CalendarProposal interface
    proposals: CalendarProposal[];
}

// --- Calendar Component ---
const CalendarView: React.FC<CalendarViewProps> = ({ proposals }) => {
    // State for the selected proposal to show in the popup
    const [selectedEvent, setSelectedEvent] = useState<CalendarProposal | null>(null);
    // Loading state is now handled by the parent component (ConvenerDashboard)
    // const [loading] = useState(false); // Remove this state

    // Map the incoming proposals prop to the FullCalendar event format
    const calendarEvents: EventInput[] = proposals.map(proposal => {
        let backgroundColor = '#6b7280'; // Default gray
        let borderColor = '#4b5563';     // Darker gray border

        // Color coding based on the lowercase status field
        switch (proposal.status) {
            case 'approved':
            case 'completed': // Treat completed as approved for color
                backgroundColor = '#10b981'; // Emerald 600
                borderColor = '#059669';     // Emerald 700
                break;
            case 'pending':
                backgroundColor = '#f59e0b'; // Amber 500
                borderColor = '#d97706';     // Amber 600
                break;
            case 'rejected':
                backgroundColor = '#ef4444'; // Red 500
                borderColor = '#dc2626';     // Red 600
                break;
            case 'review':
                backgroundColor = '#3b82f6'; // Blue 500
                borderColor = '#2563eb';     // Blue 600
                break;
        }

        return {
            id: String(proposal.id), // Ensure ID is a string for FullCalendar
            title: proposal.title,
            start: proposal.eventStartDate, // Use the correct start date field
            end: proposal.eventEndDate,     // Use the correct end date field
            // allDay is automatically determined by FullCalendar based on start/end format
            extendedProps: proposal, // Store the *full* proposal object here
            backgroundColor: backgroundColor,
            borderColor: borderColor,
            textColor: 'white', // Use white text for better contrast on colored backgrounds
            classNames: ['cursor-pointer', 'text-xs', 'p-0.5'] // Add styling classes
        };
    });

    // Handle clicking on a calendar event
    const handleEventClick = (clickInfo: any) => {
        // Retrieve the full proposal object stored in extendedProps
        const proposalData = clickInfo.event.extendedProps as CalendarProposal;
        console.log("Calendar Event Clicked:", proposalData); // Debugging
        setSelectedEvent(proposalData);
    };

    // Map the selected calendar proposal to the shape expected by Popup
    const mapCalendarToPopupProposal = (p: CalendarProposal) => ({
        id: String(p.id),
        title: p.title,
        description: p.description || '',
        category: p.category || 'Uncategorized',
        status: typeof p.status === 'string' ? p.status : 'pending',
        eventStartDate: p.eventStartDate || p.eventDate || '',
        eventEndDate: p.eventEndDate || p.eventDate || '',
        submissionTimestamp: p.submissionTimestamp || '',
        date: p.date || p.eventDate || '',
        organizer: p.organizingDepartment || p.organizer || '',
        convenerName: p.convenerName || '',
        convenerEmail: p.convenerEmail,
        convenerDesignation: p.designation,
        participantExpected: p.participant_expected ?? null,
        participantCategories: p.participant_categories ?? null,
        chiefGuestName: p.chiefGuestName,
        chiefGuestDesignation: p.chiefGuestDesignation,
        estimatedBudget: p.estimatedBudget,
        fundingDetails: p.fundingDetails || {},
        detailedBudget: Array.isArray(p.detailedBudget) ? p.detailedBudget : [],
        sponsorshipDetailsRows: Array.isArray(p.sponsorshipDetailsRows) ? p.sponsorshipDetailsRows : [],
        pastEvents: p.pastEvents ?? null,
        relevantDetails: p.relevantDetails ?? null,
        awaiting: p.awaiting ?? null,
        messages: [],
    });

    // Close the popup
    const closePopup = () => {
        setSelectedEvent(null);
    };

    // Display loading or empty state handled by parent, but keep check here
    if (!proposals) {
        // This case might indicate an issue in the parent passing props
        return <LoadingComponent />; // Or an error message
    }

    if (proposals.length === 0) {
        return <NoProposalsComponent />; // Show message if no proposals are passed
    }

    // Render the Calendar
    return (
        <div className="h-full w-full font-sans text-gray-800 bg-white p-4 shadow-md rounded-lg"> {/* Added padding/styling */}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth" // Default view
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' // Available views
                }}
                events={calendarEvents} // Pass the mapped events
                eventClick={handleEventClick} // Set the click handler
                height="auto" // Adjust height automatically, or set specific like "70vh"
                contentHeight="auto" // Adjust content height
                themeSystem="standard" // Use standard theme
                // More specific title format if desired
                // titleFormat={{ year: 'numeric', month: 'long' }}
                // Custom styles for events (can also be done via CSS)
                eventTimeFormat={{ // Format time display in timeGrid views
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short' // e.g., 10:30a
                }}
                slotLabelFormat={{ // Format time slots on the side in timeGrid views
                     hour: 'numeric',
                     minute: '2-digit',
                     omitZeroMinute: false,
                     meridiem: 'short'
                }}
                // Consider adding selectable={true} and select={handleDateSelect} for adding events
            />

            {/* Render Popup when an event is selected */}
            {selectedEvent && (
                <Popup
                    // Ensure the Popup component's expected prop name matches 'selectedProposal'
                    // And that the 'selectedEvent' object structure matches Popup's expected interface
                    selectedProposal={mapCalendarToPopupProposal(selectedEvent)}
                    closePopup={closePopup}
                    // Pass a function if Popup needs to trigger a refresh after an update
                    onProposalUpdated={() => {
                        console.log("Proposal update action triggered from CalendarView Popup");
                        // Optionally, trigger a refetch in the parent component here if needed
                        // For now, just closing the popup.
                        closePopup();
                     }}
                    token={null}
                    apiBaseUrl=""
                />
            )}
        </div>
    );
};

export default CalendarView;