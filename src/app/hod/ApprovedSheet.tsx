"use client";

import React from 'react';

// The interface is exported so the HODDashboard parent component can use it for typing the state.
export interface SheetProposal {
    id: string; // Added for React's key prop
    'SI. No.': string | number;
    'Date': any;
    'Month': string;
    'Activity': string;
    'Budget (in INR)': string | number;
    'University Contribution (in INR)': string | number;
    'Convener': string;
    'Remarks': string;
}

// The component now receives its data and status via props.
interface ApprovedSheetProps {
    events: SheetProposal[];
    loading: boolean;
    error: string | null;
}

// A simple, safe formatter for displaying currency values
const formatCurrency = (value: any): string => {
    const num = Number(String(value).replace(/,/g, ''));
    if (!isNaN(num)) {
        return num.toLocaleString('en-IN');
    }
    return String(value || '');
};

const ApprovedSheet: React.FC<ApprovedSheetProps> = ({ events, loading, error }) => {
    // All internal useState and useEffect hooks have been removed.
    // The component now relies entirely on the props passed from HODDashboard.

    if (loading) {
        return <div className="text-center p-4">Loading Budget Events...</div>;
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-lg">
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span><strong>Error:</strong> {error}</span>
                </div>
            </div>
        );
    }

    if (!events || events.length === 0) {
        return (
             <div className="card shadow-md rounded-lg bg-white">
                <div className="card-body">
                    <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Budget 2025 - 2026: Proposed Events</h2>
                    <p className="text-center italic py-4 text-gray-500">No valid event data found in the Excel sheet.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="card shadow-md rounded-lg bg-white">
            <div className="card-body">
                <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Budget 2025 - 2026: Proposed Events</h2>
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full">
                        {/* The table structure remains identical to your original code. */}
                        <thead>
                            <tr className='bg-blue-200 text-gray-700 text-xs uppercase tracking-wider'>
                                <th className="p-3">Sl. No.</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Month</th>
                                <th className="p-3">Activity</th>
                                <th className="p-3 text-right">Budget (INR)</th>
                                <th className="p-3 text-right">Univ. Contribution (INR)</th>
                                <th className="p-3">Convener</th>
                                <th className="p-3">Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-100 text-sm">
                                    <td className="p-2 text-gray-700 font-medium">{event['SI. No.']}</td>
                                    <td className="p-2 text-gray-700">{event.Date}</td>
                                    <td className="p-2 text-gray-700">{event.Month}</td>
                                    <td className="p-2 font-medium text-gray-800">{event.Activity}</td>
                                    <td className="p-2 text-gray-600 text-right">{formatCurrency(event['Budget (in INR)'])}</td>
                                    <td className="p-2 text-gray-600 text-right">{formatCurrency(event['University Contribution (in INR)'])}</td>
                                    <td className="p-2 text-gray-600">{event.Convener}</td>
                                    <td className="p-2 text-gray-600">{event.Remarks || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApprovedSheet;