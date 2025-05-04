// src/components/ProposalPopup.tsx (or relevant path)
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

// --- Interfaces ---
interface BillItem { /* ... same as before ... */
    id: number;
    proposal_id: number;
    category: string;
    sub_category: string;
    type: string;
    quantity: number;
    cost: number;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
}
interface Proposal { /* ... same as before ... */
    id: number;
    event_name: string;
    convener_name: string;
    convener_email: string;
    department_name: string;
    bill_items: BillItem[];
    isSettled?: boolean;
}
interface PopupProps { /* ... same as before ... */
    proposal: Proposal | null;
    onClose: () => void;
    onSettleBill: (id: number) => Promise<void>;
    settlementStatus: 'idle' | 'loading' | 'success' | 'error';
    settlementError: string | null;
}

const ProposalPopup: React.FC<PopupProps> = ({
    proposal,
    onClose,
    onSettleBill,
    settlementStatus,
    settlementError,
}) => {

    if (!proposal) return null;

    // --- Helpers ---
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        // ... (implementation is fine) ...
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isValid(date) ? format(date, formatString) : 'Invalid Date';
        } catch { return 'Invalid Date'; }
    };
    const formatCurrency = (amount: number | null | undefined): string => {
        // ... (implementation is fine) ...
        if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
        return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
    };
    const totalBillAmount = proposal.bill_items.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handleSettleClick = async () => {
        if (settlementStatus === 'loading' || settlementStatus === 'success') return;
        await onSettleBill(proposal.id);
    };

    // --- Render ---
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6" // Slightly darker backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            {/* Modal Content: White background, dark text */}
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-600 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" // Adjusted border color
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 150, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header: White background, dark text */}
                <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">Proposal Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-red-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                        aria-label="Close pop-up"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Scrollable Content Area: White background, dark text */}
                <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        {/* Use dark text (e.g., text-gray-900) */}
                        <div><p className="font-medium text-gray-500">Proposal ID:</p><p className="text-gray-900">{proposal.id}</p></div>
                        <div><p className="font-medium text-gray-500">Event Name:</p><p className="text-gray-900 font-medium">{proposal.event_name}</p></div>
                        <div><p className="font-medium text-gray-500">Department:</p><p className="text-gray-900">{proposal.department_name}</p></div>
                        <div><p className="font-medium text-gray-500">Convener:</p><p className="text-gray-900">{proposal.convener_name}</p></div>
                        <div className="sm:col-span-2"><p className="font-medium text-gray-500">Convener Email:</p><p className="text-gray-900 break-words">{proposal.convener_email}</p></div>
                    </div>

                     {/* Bill Items Section */}
                     <div className="mt-4 border-t border-gray-200 pt-4">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Bill Items</h3>
                        {proposal.bill_items && proposal.bill_items.length > 0 ? (
                            <div className="overflow-x-auto border border-gray-200 rounded-md">
                                <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
                                    {/* Table Head: Light gray background, dark text */}
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Category</th>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Sub-Category</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600 uppercase tracking-wider">Qty</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600 uppercase tracking-wider">Cost</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600 uppercase tracking-wider">Amount</th>
                                            <th scope="col" className="px-4 py-2 text-center font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Added On</th>
                                        </tr>
                                    </thead>
                                    {/* Table Body: White background, dark text */}
                                    <tbody className="bg-white divide-y divide-gray-200 text-gray-800">
                                        {proposal.bill_items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 whitespace-nowrap">{item.category}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{item.sub_category}</td>
                                                <td className="px-4 py-2 text-right">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(item.cost)}</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    {/* Status badge colors adjusted for light theme */}
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'estimated' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatDateSafe(item.created_at, 'dd-MM-yy HH:mm')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Table Footer: Light gray background, dark text */}
                                    <tfoot className="bg-gray-100">
                                        <tr>
                                            <td colSpan={4} className="px-4 py-2 text-right font-bold text-gray-700">Total Estimated Amount:</td>
                                            <td className="px-4 py-2 text-right font-bold text-gray-900">{formatCurrency(totalBillAmount)}</td>
                                            <td colSpan={2}></td>{/* Empty cells for alignment */}
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No bill items found for this proposal.</p>
                        )}
                    </div>
                </div>

                {/* Footer / Action Area: Light gray background */}
                <div className="p-4 md:p-5 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {/* Settlement Status/Error Display */}
                    {settlementStatus === 'error' && settlementError && (
                        <div className="mb-3 p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-md flex items-start gap-2">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <span><strong>Error:</strong> {settlementError}</span>
                        </div>
                    )}
                     {settlementStatus === 'success' && (
                        <div className="mb-3 p-3 bg-green-100 border border-green-300 text-green-800 text-sm rounded-md flex items-center gap-2">
                            <CheckCircle size={18} className="flex-shrink-0"/>
                            <span>Bill successfully marked as settled.</span>
                        </div>
                    )}

                    {/* Action Button: Adjusted for light theme */}
                    <div className="flex justify-end">
                         <button
                            onClick={handleSettleClick}
                            disabled={settlementStatus === 'loading' || settlementStatus === 'success'}
                            className={`btn btn-sm inline-flex items-center gap-2 transition-colors duration-150 ${
                                settlementStatus === 'success'
                                    ? 'bg-green-600 text-white hover:bg-green-700 cursor-not-allowed' // Success state
                                    : settlementStatus === 'loading'
                                    ? 'bg-gray-400 text-gray-800 cursor-wait opacity-70' // Loading state
                                    : 'bg-blue-600 text-white hover:bg-blue-700' // Default/Idle/Error state
                            }`}
                        >
                            {/* Conditional Icons/Text */}
                            {settlementStatus === 'loading' && <Loader2 size={16} className="animate-spin" />}
                            {settlementStatus === 'success' && <CheckCircle size={16} />}
                            {settlementStatus === 'idle' && 'Settle Bill'}
                            {settlementStatus === 'error' && 'Retry Settle Bill'}
                            {settlementStatus === 'loading' && 'Settling...'}
                            {settlementStatus === 'success' && 'Bill Settled'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ProposalPopup;