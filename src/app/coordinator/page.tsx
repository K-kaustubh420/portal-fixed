"use client";

import React, { useState, useEffect, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { Download, ListChecks, Clock, XCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import * as XLSX from 'xlsx';

// ========================================================================
// 1. THIS IS THE CORRECT IMPORT FOR THE DOWNLOAD FUNCTIONALITY
// ========================================================================
import { saveAs } from 'file-saver';

import { useAuth } from '@/context/AuthContext';

// Interface for a single proposal
interface Proposal {
    id: number;
    user_id: number;
    title: string;
    description: string;
    start: string;
    end: string;
    category: string;
    status: 'completed' | 'pending' | 'rejected' | 'review';
    awaiting: string | null;
    created_at: string;
    faculty: {
        name: string;
    };
}

// Helper function to format date
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
};

// Main Coordinator Dashboard Component
const CoordinatorDashboard: React.FC = () => {
    const { user, token, isLoading: isAuthLoading } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [clashingProposalIds, setClashingProposalIds] = useState<Set<number>>(new Set());
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    // Data Fetching Effect
    useEffect(() => {
        if (isAuthLoading || !token) {
            if (!isAuthLoading) setLoading(false);
            return;
        }
        if (user?.email !== 'coord@srmist.edu.in') {
            setLoading(false);
            return;
        }

        const fetchProposals = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get<{ proposals: Proposal[] }>(
                    `${API_BASE_URL}/api/faculty/allProposals`, {
                        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    }
                );
                setProposals(response.data.proposals || []);
            } catch (err) {
                const axiosError = err as AxiosError;
                setError(axiosError.response?.status === 401 ? "Authentication failed." : 'Failed to fetch proposals.');
                console.error("API Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProposals();
    }, [API_BASE_URL, token, isAuthLoading, user]);

    // Date Clash Detection Effect
    useEffect(() => {
        if (proposals.length < 2) return;
        const dateMap = new Map<string, number[]>();
        proposals.forEach(proposal => {
            const currentDate = new Date(proposal.start);
            const endDate = new Date(proposal.end);
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                if (!dateMap.has(dateString)) dateMap.set(dateString, []);
                dateMap.get(dateString)!.push(proposal.id);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        });
        const clashes = new Set<number>();
        dateMap.forEach(ids => {
            if (ids.length > 1) ids.forEach(id => clashes.add(id));
        });
        setClashingProposalIds(clashes);
    }, [proposals]);

    const stats = useMemo(() => ({
        total: proposals.length,
        approved: proposals.filter(p => p.status === 'completed').length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
        pending: proposals.filter(p => p.status === 'pending').length,
        review: proposals.filter(p => p.status === 'review').length,
    }), [proposals]);

    const awaitingHOD = useMemo(() => proposals.filter(p => p.awaiting === 'hod'), [proposals]);

    const calendarEvents = useMemo(() => proposals.map(p => ({
        id: p.id.toString(),
        title: p.title,
        start: p.start,
        end: new Date(new Date(p.end).setDate(new Date(p.end).getDate() + 1)).toISOString().split('T')[0],
        allDay: true,
        backgroundColor: clashingProposalIds.has(p.id) ? '#EF4444' : '#3B82F6',
        borderColor: clashingProposalIds.has(p.id) ? '#DC2626' : '#2563EB',
        classNames: clashingProposalIds.has(p.id) ? ['blinking-event'] : [],
    })), [proposals, clashingProposalIds]);

    // --- Correct Excel Download Handler ---
    const handleDownload = () => {
        const worksheet = XLSX.utils.json_to_sheet(proposals.map(p => ({
            'Proposal ID': p.id, 'Title': p.title, 'Status': p.status, 'Currently Awaiting': p.awaiting || 'N/A',
            'Start Date': formatDate(p.start), 'End Date': formatDate(p.end), 'Category': p.category,
            'Submitted By': p.faculty.name, 'Submission Date': new Date(p.created_at).toLocaleString(),
        })));
        const workbook = { Sheets: { 'Proposals': worksheet }, SheetNames: ['Proposals'] };
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        
        // This will now call the function from the 'file-saver' library
        saveAs(data, 'Proposals_Overview.xlsx');
    };

    if (isAuthLoading || loading) {
        return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    if (!user || user.email !== 'coord@srmist.edu.in') {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="p-8 text-center bg-white rounded-lg shadow-xl">
                    <AlertTriangle className="w-16 h-16 mx-auto text-red-500" />
                    <h1 className="mt-4 text-2xl font-bold text-gray-800">Access Denied</h1>
                    <p className="mt-2 text-gray-600">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="flex items-center justify-center h-screen"><div className="alert alert-error shadow-lg"><div><XCircle /><span>Error: {error}</span></div></div></div>;
    }

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <style jsx global>{`
                .blinking-event { animation: blinker 1.5s linear infinite; }
                @keyframes blinker { 50% { opacity: 0.5; } }
            `}</style>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Coordinator Dashboard</h1>
                <button onClick={handleDownload} className="btn btn-primary">
                    <Download className="mr-2 h-4 w-4" /> Download Overview
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <StatCard title="Total Applied" value={stats.total} icon={<ListChecks />} color="blue" />
                <StatCard title="Approved" value={stats.approved} icon={<CheckCircle />} color="green" />
                <StatCard title="Rejected" value={stats.rejected} icon={<XCircle />} color="red" />
                <StatCard title="Pending" value={stats.pending} icon={<Clock />} color="yellow" />
                <StatCard title="Review" value={stats.review} icon={<Clock />} color="cyan" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <ProposalTable title="Awaiting HOD Approval" proposals={awaitingHOD} />
                <ProposalTable title="All Proposals Overview" proposals={proposals} clashingIds={clashingProposalIds} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Event Calendar</h2>
                {proposals.length > 0 ? (
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin, listPlugin]} initialView="dayGridMonth"
                        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
                        events={calendarEvents} height="65vh"
                    />
                ) : <p className="text-center text-gray-800 py-10">No proposals to display on the calendar.</p>}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => (
    <div className={`p-4 bg-white rounded-lg shadow-md border-l-4 border-${color}-500`}>
        <div className="flex justify-between items-center">
            <div>
                <p className="text-sm font-medium text-gray-800 uppercase">{title}</p>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
            </div>
            <div className={`text-4xl text-${color}-500`}>{icon}</div>
        </div>
    </div>
);

const ProposalTable: React.FC<{ title: string; proposals: Proposal[]; clashingIds?: Set<number>; }> = ({ title, proposals, clashingIds }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">{title}</h2>
        <div className="overflow-x-auto h-96">
            {proposals.length > 0 ? (
                <table className="table w-full">
                    <thead className="bg-blue-500">
                        <tr className='text-black'><th>Title</th><th>Submitted Date</th><th>Status</th>{clashingIds && <th>Notes</th>}</tr>
                    </thead>
                    <tbody>
                        {proposals.map(p => (
                            <tr key={p.id} className={`hover ${clashingIds?.has(p.id) ? 'bg-red-100' : ''}`}>
                                <td>
                                    <div className="font-bold text-gray-800">{p.title}</div>
                                    <div className="text-sm text-gray-500">{p.faculty.name}</div>
                                </td>
                                <td className='text-black'>{formatDate(p.created_at)}</td>
                                <td>
                                    <span className={`badge capitalize ${ p.status === 'completed' ? 'badge-success text-white' : p.status === 'pending' ? 'badge-warning text-slate-800' : p.status === 'rejected' ? 'badge-error text-white' : p.status === 'review' ? 'badge-info text-slate-800' : 'badge-ghost' }`}>{p.status}</span>
                                </td>
                                {clashingIds && (
                                    <td>{clashingIds.has(p.id) && <div className="tooltip" data-tip="Date clash detected"><AlertTriangle className="text-error h-5 w-5" /></div>}</td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="text-center text-gray-500 pt-10">No proposals to display.</p>}
        </div>
    </div>
);

export default CoordinatorDashboard;

// ========================================================================
// 2. THE BAD PLACEHOLDER FUNCTION HAS BEEN COMPLETELY REMOVED FROM THE END
// ========================================================================