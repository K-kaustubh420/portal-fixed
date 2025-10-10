"use client";
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, EventClickArg } from '@fullcalendar/core';
import { SheetProposal } from './ApprovedSheet'; // Ensure path is correct

// --- Helper Components & Interfaces (Unchanged) ---
const LoadingComponent = () => ( <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg"><div className="text-gray-500 flex flex-col items-center"><span className="loading loading-spinner loading-lg text-blue-500"></span><p className="mt-2 text-sm">Loading Calendar...</p></div></div> );
const NoProposalsComponent = () => ( <div className="flex items-center justify-center min-h-[50vh] bg-gray-50 rounded-lg p-4"><div className="text-gray-500 text-center"><p className="text-lg">No proposals to display on the calendar.</p></div></div> );

export interface CalendarProposal {
    id: string; title: string; eventStartDate: string; eventEndDate: string; status: string;
    organizer: string; date: string; category: string; description: string; convenerName: string;
    submissionTimestamp: string; awaiting?: string | null; fundingDetails: {};
    cost?: number; email?: string; location?: string; convenerEmail?: string; chiefGuestName?: string;
    chiefGuestDesignation?: string; designation?: string;
}

interface CalendarViewProps {
    proposals: CalendarProposal[];
    sheetEvents: SheetProposal[];
    onEventClick: (proposalData: CalendarProposal) => void;
}

// --- Date Parsing Logic (Unchanged) ---
const monthMap: { [key: string]: number } = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

const parseSheetDate = (dateVal: any, monthVal: any): { start: Date | null, end: Date | null } => {
    if (!dateVal || !monthVal) return { start: null, end: null };
    
    const dateStr = String(dateVal).trim();
    const monthStr = String(monthVal).toLowerCase().replace(/['\s]/g, '');

    const monthMatch = monthStr.match(/([a-z]+)/);
    const yearMatch = monthStr.match(/(\d{2})$/);

    if (!monthMatch || !yearMatch) return { start: null, end: null };

    const monthName = Object.keys(monthMap).find(m => monthMatch[1].startsWith(m));
    const year = 2000 + parseInt(yearMatch[1], 10);
    
    if (!monthName || isNaN(year)) return { start: null, end: null };
    const monthIndex = monthMap[monthName];

    const rangeMatch = dateStr.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
    const singleDayMatch = dateStr.match(/^(\d{1,2})$/);

    try {
        if (rangeMatch) {
            const startDay = parseInt(rangeMatch[1], 10);
            const endDay = parseInt(rangeMatch[2], 10);
            const startDate = new Date(year, monthIndex, startDay);
            const endDate = new Date(year, monthIndex, endDay + 1);
            return { start: startDate, end: endDate };
        } else if (singleDayMatch) {
            const day = parseInt(singleDayMatch[1], 10);
            const startDate = new Date(year, monthIndex, day);
            return { start: startDate, end: startDate };
        }
    } catch (e) {
        console.error("Date parsing error:", e);
        return { start: null, end: null };
    }

    return { start: null, end: null };
};

const CalendarView: React.FC<CalendarViewProps> = ({ proposals, sheetEvents, onEventClick }) => {

    // 1. Process API proposals (Unchanged)
    const apiEvents: EventInput[] = (proposals || [])
        .map(proposal => ({
            id: proposal.id,
            title: proposal.title,
            start: proposal.eventStartDate,
            end: proposal.eventEndDate,
            extendedProps: { ...proposal, source: 'api' },
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            textColor: 'white',
            classNames: ['cursor-pointer', 'text-xs', 'p-0.5', 'rounded-sm']
        }));

    // 2. Process Sheet events (FIX APPLIED HERE)
    const parsedSheetEvents: EventInput[] = (sheetEvents || []).reduce<EventInput[]>((accumulator, event) => {
        const { start, end } = parseSheetDate(event.Date, event.Month);
        
        if (start) {
            accumulator.push({
                id: event.id,
                title: event.Activity,
                start: start,
                // --- FIX: Convert null to undefined to satisfy the EventInput type ---
                end: end || undefined, 
                allDay: true,
                extendedProps: { ...event, source: 'sheet' },
                backgroundColor: '#10b981',
                borderColor: '#059669',
                textColor: 'white',
                classNames: ['text-xs', 'p-0.5', 'rounded-sm']
            });
        }
        
        return accumulator;
    }, []);

    // 3. Combine both event sources (Unchanged)
    const allEvents = [...apiEvents, ...parsedSheetEvents];

    // Event click handler (Unchanged)
    const handleEventClickInternal = (clickInfo: EventClickArg) => {
        if (clickInfo.event.extendedProps.source === 'api') {
            onEventClick(clickInfo.event.extendedProps as CalendarProposal);
        }
    };

    if (!proposals || !sheetEvents) return <LoadingComponent />;
    if (allEvents.length === 0) return <NoProposalsComponent />;

    // Returned JSX (Unchanged)
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
                events={allEvents}
                eventClick={handleEventClickInternal}
                height="auto"
                contentHeight="auto"
                themeSystem="standard"
                eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                slotLabelFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short' }}
                dayMaxEvents={true}
                eventDisplay="block"
            />
        </div>
    );
};

export default CalendarView;