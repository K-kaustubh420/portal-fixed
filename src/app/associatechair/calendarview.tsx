"use client";

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput } from '@fullcalendar/core';
import Popup from './popup';
import { UnifiedProposal } from './ViceDashboard';
import { useAuth } from '@/context/AuthContext';

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

interface CalendarViewProps {
    proposals: UnifiedProposal[];
}

const API_BASE_URL = "https://pmspreview-htfbhkdnffcpf5dz.centralindia-01.azurewebsites.net";

const CalendarView: React.FC<CalendarViewProps> = ({ proposals }) => {
    const [eventProposals, setEventProposals] = useState<UnifiedProposal[]>(proposals);
    const [loading] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<UnifiedProposal | null>(null);
    const { token, user } = useAuth();

    useEffect(() => {
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
        setSelectedEvent(clickInfo.event.extendedProps as UnifiedProposal);
    };

    const closePopup = () => {
        setSelectedEvent(null);
    };

    const handleProposalUpdated = () => {
        // Optionally refresh proposals or update state
        closePopup();
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
                    onProposalUpdated={handleProposalUpdated}
                    authToken={token}
                    apiBaseUrl={API_BASE_URL}
                    userRole={user?.role || ''}
                />
            )}
        </div>
    );
};

export default CalendarView;