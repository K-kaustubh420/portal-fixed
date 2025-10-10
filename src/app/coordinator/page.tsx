"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { Download, ListChecks, Clock, XCircle, CheckCircle, AlertTriangle, Upload } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '@/context/AuthContext';

// --- Interfaces (No changes) ---
interface Proposal {
    id: number; user_id: number; title: string; description: string; start: string; end: string;
    category: string; status: 'completed' | 'pending' | 'rejected' | 'review';
    awaiting: string | null; created_at: string; faculty: { name: string; };
}
interface SheetProposal {
    'SI. No.': string | number; 'Date': any; 'Month': string; 'Activity': string;
    'Budget (in INR)': string | number; 'University Contribution (in INR)': string | number;
    'Convener': string; 'Remarks': string;
}
interface CalendarEventSource {
    id: string; title: string; start: string; end: string;
    source: 'api' | 'sheet'; status?: Proposal['status'];
}

// Helper function to format date for display
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
};

// Date parser using UTC to prevent timezone shifts (No changes)
const parseSheetDatesFromColumns = (dateCol: any, monthCol: any): { start: string; end: string } | null => {
    if (!dateCol || !monthCol || typeof monthCol !== 'string') { return null; }
    const monthMap: { [key: string]: number } = { 'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11 };
    const monthStr = String(monthCol).trim().toLowerCase();
    const monthRegex = /^([a-z]{3,})'(\d{2})$/;
    const monthMatch = monthStr.match(monthRegex);
    if (!monthMatch) { console.warn("Could not parse month/year from:", monthCol); return null; }
    const [, monthName, yearStr] = monthMatch;
    const month = monthMap[monthName.substring(0, 3)];
    const year = 2000 + parseInt(yearStr, 10);
    if (month === undefined) { console.warn("Invalid month name:", monthName); return null; }
    const dateStr = String(dateCol).trim();
    const dateParts = dateStr.split('-').map(d => parseInt(d.trim(), 10));
    let startDay: number, endDay: number;
    if (dateParts.length === 2 && !isNaN(dateParts[0]) && !isNaN(dateParts[1])) {
        startDay = dateParts[0]; endDay = dateParts[1];
    } else if (dateParts.length === 1 && !isNaN(dateParts[0])) {
        startDay = dateParts[0]; endDay = startDay;
    } else { console.warn("Could not parse day(s) from:", dateCol); return null; }
    const startDate = new Date(Date.UTC(year, month, startDay));
    const endDate = new Date(Date.UTC(year, month, endDay));
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) { console.warn("Created an invalid date for:", { year, month, startDay, endDay }); return null; }
    return { start: startDate.toISOString().split('T')[0], end: endDate.toISOString().split('T')[0] };
};

// Main Coordinator Dashboard Component
const CoordinatorDashboard: React.FC = () => {
    const { user, token, isLoading: isAuthLoading } = useAuth();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [sheetProposals, setSheetProposals] = useState<SheetProposal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [clashingProposalIds, setClashingProposalIds] = useState<Set<string>>(new Set());
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

    const processExcelFile = (fileData: ArrayBuffer) => {
        try {
            const workbook = XLSX.read(fileData, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) { setError("The Excel file has no sheets."); return; }
            const worksheet = workbook.Sheets[firstSheetName];
            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
            const essentialHeaders = ['si. no.', 'activity', 'budget', 'convener'];
            let headerRowIndex = -1;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i]; if (!row) continue;
                const normalizedRow = row.map(cell => String(cell || '').toLowerCase().trim());
                let matchCount = 0;
                essentialHeaders.forEach(header => { if (normalizedRow.some(cell => cell.includes(header))) { matchCount++; } });
                if (matchCount >= 3) { headerRowIndex = i; break; }
            }
            if (headerRowIndex === -1) { setError("Could not automatically detect the header row in the sheet."); return; }
            const headers = rows[headerRowIndex].map(h => {
                const normH = String(h || '').toLowerCase().trim();
                if (normH.includes('si. no.')) return 'SI. No.';
                if (normH.includes('university contribution')) return 'University Contribution (in INR)';
                if (normH.includes('budget')) return 'Budget (in INR)';
                return h;
            });
            const dataRows = rows.slice(headerRowIndex + 1);
            const newWorksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
            const json = XLSX.utils.sheet_to_json<SheetProposal>(newWorksheet, { defval: null });
            const validProposals = json.filter(p => (p['SI. No.'] || p['Activity']) && p['Activity']);
            if (validProposals.length === 0) { setError("Found headers in the sheet, but no valid data rows were detected."); }
            setSheetProposals(validProposals);
        } catch (err) {
            console.error("File processing error:", err);
            setError("A critical error occurred while processing the Excel file.");
        }
    };

    useEffect(() => {
        if (isAuthLoading || !token) { if (!isAuthLoading) setLoading(false); return; }
        if (user?.email !== 'coord@srmist.edu.in') { setLoading(false); return; }

        const fetchAllData = async () => {
            setLoading(true); setError(null);
            const fetchApiProposals = axios.get<{ proposals: Proposal[] }>( `${API_BASE_URL}/api/faculty/allProposals`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } } );
            const fetchDefaultSheet = fetch('/CTECH.xlsx').then(res => {
                if (!res.ok) { console.warn("Default CTECH.xlsx not found in /public folder. Manual upload is available."); return null; }
                return res.arrayBuffer();
            });

            try {
                const [proposalResponse, sheetData] = await Promise.all([fetchApiProposals, fetchDefaultSheet]);
                setProposals(proposalResponse.data.proposals || []);
                if (sheetData) { processExcelFile(sheetData); }
            } catch (err) {
                 if (axios.isAxiosError(err)) { setError(err.response?.status === 401 ? "Authentication failed." : 'Failed to fetch proposals.'); } 
                 else { setError('An unexpected error occurred while fetching initial data.'); }
            } finally { setLoading(false); }
        };

        fetchAllData();
    }, [API_BASE_URL, token, isAuthLoading, user]);

    const combinedEvents = useMemo<CalendarEventSource[]>(() => {
        const apiEvents: CalendarEventSource[] = proposals.map(p => ({
            id: `api-${p.id}`, title: p.title, start: p.start, end: p.end, source: 'api', status: p.status,
        }));
        const sheetEvents: CalendarEventSource[] = sheetProposals.map((p, index) => {
            const dateRange = parseSheetDatesFromColumns(p.Date, p.Month);
            if (!dateRange || !p.Activity) return null;
            return { id: `sheet-${index}`, title: p.Activity, start: dateRange.start, end: dateRange.end, source: 'sheet' };
        }).filter((p): p is CalendarEventSource => p !== null);
        return [...apiEvents, ...sheetEvents];
    }, [proposals, sheetProposals]);

    useEffect(() => {
        if (combinedEvents.length < 2) { setClashingProposalIds(new Set()); return; }
        const dateMap = new Map<string, string[]>();
        combinedEvents.forEach(proposal => {
            if (!proposal.start || !proposal.end) return;
            const startDate = new Date(proposal.start + 'T00:00:00Z');
            const endDate = new Date(proposal.end + 'T00:00:00Z');
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
            const currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateString = currentDate.toISOString().split('T')[0];
                if (!dateMap.has(dateString)) dateMap.set(dateString, []);
                dateMap.get(dateString)!.push(proposal.id);
                currentDate.setUTCDate(currentDate.getUTCDate() + 1);
            }
        });
        const clashes = new Set<string>();
        dateMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => clashes.add(id)); });
        setClashingProposalIds(clashes);
    }, [combinedEvents]);

    const stats = useMemo(() => ({ total: proposals.length, approved: proposals.filter(p => p.status === 'completed').length, rejected: proposals.filter(p => p.status === 'rejected').length, pending: proposals.filter(p => p.status === 'pending').length, review: proposals.filter(p => p.status === 'review').length }), [proposals]);
    const awaitingHOD = useMemo(() => proposals.filter(p => p.awaiting === 'hod'), [proposals]);

    const calendarEvents = useMemo(() => {
        return combinedEvents.map(p => {
            const isClashing = clashingProposalIds.has(p.id);

            let backgroundColor = '#808080';
            let borderColor = '#696969';
            
            if (isClashing) {
              backgroundColor = '#EF4444';
              borderColor = '#DC2626';
            } else if (p.source === 'sheet') {
              backgroundColor = '#22C55E';
              borderColor = '#16A34A';
            } else if (p.source === 'api') {
              backgroundColor = '#3B82F6';
              borderColor = '#2563EB';
            }
            
            const normalizedEnd = p.end?.replace(' ', 'T');
            const endDate = new Date(normalizedEnd + 'Z');
            
            if (isNaN(endDate.getTime())) {
              console.warn('Invalid end date for', p.id, p.end);
              return null;
            }
            
            endDate.setUTCDate(endDate.getUTCDate() + 1);
            const finalEndDate = endDate.toISOString().split('T')[0];
            
            return {
              id: p.id,
              title: p.title,
              start: p.start,
              end: finalEndDate,
              allDay: true,
              backgroundColor,
              borderColor,
              classNames: isClashing ? ['blinking-event'] : [],
            };
            
        })
        // ========================================================================
        // [FIX APPLIED HERE]
        // Filtered out null values from the array to prevent the TypeScript error.
        // FullCalendar's `events` prop requires an array of event objects, not `null`.
        // ========================================================================
        .filter(event => event !== null);
    }, [combinedEvents, clashingProposalIds]);

    // ========================================================================
    // [FINAL & WORKING DOWNLOAD HANDLER]
    // This function now correctly exports the ad-hoc proposal data to an Excel file.
    // ========================================================================
    const handleDownload = () => {
        if (proposals.length === 0) {
            alert("There are no proposals to download.");
            return;
        }

        // 1. Format the data for the sheet
        const dataForSheet = proposals.map(p => ({
            'Proposal ID': p.id,
            'Title': p.title,
            'Faculty Name': p.faculty.name,
            'Category': p.category,
            'Status': p.status,
            'Start Date': formatDate(p.start),
            'End Date': formatDate(p.end),
            'Submitted At': formatDate(p.created_at),
            'Currently Awaiting': p.awaiting || 'N/A'
        }));

        // 2. Create a worksheet and a workbook
        const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Proposals Overview");

        // 3. Generate the file buffer
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

        // 4. Create a Blob and trigger the download
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `Proposals_Overview_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSheetProposals([]); setError(null);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                processExcelFile(e.target.result as ArrayBuffer);
            }
        };
        reader.onerror = (err) => {
            console.error("FileReader error:", err);
            setError("Failed to read the uploaded file.");
        };
        reader.readAsArrayBuffer(file);
    };

    // --- JSX and Child Components (No changes) ---
    if (isAuthLoading || loading) { return <div className="flex justify-center items-center h-screen"><span className="loading loading-spinner loading-lg"></span></div>; }
    if (!user || user.email !== 'coord@srmist.edu.in') { return ( <div className="flex items-center justify-center h-screen bg-gray-100"> <div className="p-8 text-center bg-white rounded-lg shadow-xl"> <AlertTriangle className="w-16 h-16 mx-auto text-red-500" /> <h1 className="mt-4 text-2xl font-bold text-gray-800">Access Denied</h1> <p className="mt-2 text-gray-600">You do not have permission to view this page.</p> </div> </div> ); }
    const apiClashingIds = new Set( Array.from(clashingProposalIds).filter(id => id.startsWith('api-')).map(id => parseInt(id.replace('api-', ''), 10)) );
    
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <style jsx global>{`
                .blinking-event { animation: blinker 1.5s linear infinite; }
                @keyframes blinker { 50% { opacity: 0.5; } }
            `}</style>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Coordinator Dashboard</h1>
                <div className="flex items-center gap-2">
                    <label htmlFor="file-upload" className="btn btn-secondary"> <Upload className="mr-2 h-4 w-4" /> Upload New Sheet </label>
                    <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" />
                    <button onClick={handleDownload} className="btn btn-primary"> <Download className="mr-2 h-4 w-4" /> Download Overview </button>
                </div>
            </div>
            {error && ( <div className="alert alert-warning shadow-lg my-4"> <div> <AlertTriangle /> <span>{error}</span> </div> </div> )}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"> <StatCard title="Total Applied" value={stats.total} icon={<ListChecks />} color="blue" /> <StatCard title="Approved" value={stats.approved} icon={<CheckCircle />} color="green" /> <StatCard title="Rejected" value={stats.rejected} icon={<XCircle />} color="red" /> <StatCard title="Pending" value={stats.pending} icon={<Clock />} color="yellow" /> <StatCard title="Review" value={stats.review} icon={<Clock />} color="cyan" /> </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"> <ProposalTable title="Awaiting HOD Approval(Adhoc)" proposals={awaitingHOD} /> <ProposalTable title="Adhoc Proposals Overview" proposals={proposals} clashingIds={apiClashingIds} /> </div>
            <div className="mb-8"> <SheetProposalTable title="Approved proposals" proposals={sheetProposals} /> </div>
            <div className="bg-white p-6 rounded-lg shadow-md text-black">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Event Calendar</h2>
                {combinedEvents.length > 0 ? ( <FullCalendar plugins={[dayGridPlugin, interactionPlugin, listPlugin]} initialView="dayGridMonth" headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }} events={calendarEvents} height="65vh" /> ) : <p className="text-center text-gray-800 py-10">No proposals to display on the calendar.</p>}
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string; }> = ({ title, value, icon, color }) => ( <div className={`p-4 bg-white rounded-lg shadow-md border-l-4 border-${color}-500`}> <div className="flex justify-between items-center"> <div> <p className="text-sm font-medium text-gray-800 uppercase">{title}</p> <p className="text-3xl font-bold text-gray-800">{value}</p> </div> <div className={`text-4xl text-${color}-500`}>{icon}</div> </div> </div> );
const ProposalTable: React.FC<{ title: string; proposals: Proposal[]; clashingIds?: Set<number>; }> = ({ title, proposals, clashingIds }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <h2 className="text-xl font-semibold text-slate-700 mb-4">{title}</h2> <div className="overflow-x-auto h-96"> {proposals.length > 0 ? ( <table className="table w-full"> <thead className="bg-blue-500"> <tr className='text-black'><th>Title</th><th>Submitted Date</th><th>Status</th>{clashingIds && <th>Notes</th>}</tr> </thead> <tbody> {proposals.map(p => ( <tr key={p.id} className={`hover ${clashingIds?.has(p.id) ? 'bg-red-100' : ''}`}> <td> <div className="font-bold text-gray-800">{p.title}</div> <div className="text-sm text-gray-500">{p.faculty.name}</div> </td> <td className='text-black'>{formatDate(p.created_at)}</td> <td> <span className={`badge capitalize ${ p.status === 'completed' ? 'badge-success text-white' : p.status === 'pending' ? 'badge-warning text-slate-800' : p.status === 'rejected' ? 'badge-error text-white' : p.status === 'review' ? 'badge-info text-slate-800' : 'badge-ghost' }`}>{p.status}</span> </td> {clashingIds && ( <td>{clashingIds.has(p.id) && <div className="tooltip" data-tip="Date clash detected"><AlertTriangle className="text-error h-5 w-5" /></div>}</td> )} </tr> ))} </tbody> </table> ) : <p className="text-center text-gray-500 pt-10">No proposals to display.</p>} </div> </div> );
const SheetProposalTable: React.FC<{ title: string; proposals: SheetProposal[]; }> = ({ title, proposals }) => ( <div className="bg-white p-6 rounded-lg shadow-md"> <h2 className="text-xl font-semibold text-slate-700 mb-4">{title}</h2> <div className="overflow-x-auto max-h-96"> {proposals && proposals.length > 0 ? ( <table className="table w-full"> <thead className="bg-blue-600 sticky top-0 z-10"> <tr className='text-white'> <th>SI. No.</th> <th>Date</th> <th>Month</th> <th>Activity</th> <th>Budget (in INR)</th> <th>University Contribution (in INR)</th> <th>Convener</th> <th>Remarks</th> </tr> </thead> <tbody> {proposals.map((p, index) => ( <tr key={index} className="hover:bg-blue-50"> <td className='text-gray-900 font-medium'>{String(p['SI. No.'] || '')}</td> <td className='text-gray-800'>{p.Date}</td> <td className='text-gray-800'>{p.Month}</td> <td className='text-gray-800'>{p.Activity}</td> <td className='text-gray-800'>{String(p['Budget (in INR)'] || '')}</td> <td className='text-gray-800'>{String(p['University Contribution (in INR)'] || '')}</td> <td className='text-gray-800'>{p.Convener}</td> <td className='text-gray-800'>{p.Remarks}</td> </tr> ))} </tbody> </table> ) : ( <div className="flex items-center justify-center h-60 bg-gray-50 rounded-md"> <p className="text-center text-gray-500"> No sheet data loaded. <br /> Either place CTECH.xlsx in the /public folder or upload a file manually. </p> </div> )} </div> </div> );

export default CoordinatorDashboard;