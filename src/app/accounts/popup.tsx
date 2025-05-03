// src/components/ProposalPopup.tsx
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';

// Use the specific interfaces matching the data passed from AccountsDashboard
interface BillItem {
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

interface Proposal {
    id: number;
    event_name: string;
    convener_name: string;
    convener_email: string;
    department_name: string;
    bill_items: BillItem[];
    // Add a potential flag to track client-side settlement status if needed
    isSettled?: boolean;
}

// Define props for the Popup
interface PopupProps {
    proposal: Proposal | null;
    onClose: () => void;
    onSettleBill: (id: number) => Promise<void>; // Function to call for settlement
    settlementStatus: 'idle' | 'loading' | 'success' | 'error'; // Status of the settlement action
    settlementError: string | null; // Specific error from settlement attempt
}

const ProposalPopup: React.FC<PopupProps> = ({
    proposal,
    onClose,
    onSettleBill,
    settlementStatus,
    settlementError,
}) => {

    // If no proposal, don't render
    if (!proposal) {
        return null;
    }

    // Helper to format dates safely
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isValid(date) ? format(date, formatString) : 'Invalid Date';
        } catch {
            return 'Invalid Date';
        }
    };

    // Helper to format currency
     const formatCurrency = (amount: number | null | undefined): string => {
        if (amount === null || amount === undefined) return 'N/A';
        return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
    };

    // Calculate total amount from bill items
    const totalBillAmount = proposal.bill_items.reduce((sum, item) => sum + (item.amount || 0), 0);

    const handleSettleClick = async () => {
        // Prevent action if already loading or settled (based on status prop)
        if (settlementStatus === 'loading' || settlementStatus === 'success') return;
        await onSettleBill(proposal.id);
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6" // Added padding for smaller screens
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose} // Close popup if clicking outside the modal content
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-indigo-600 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 30, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 150, damping: 20 }}
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 md:p-5 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-lg">
                    <h2 className="text-lg md:text-xl font-semibold text-gray-800">Proposal Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-red-600 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                        aria-label="Close pop-up"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-4 md:p-6 space-y-5 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div><p className="font-medium text-gray-500">Proposal ID:</p><p className="text-gray-900">{proposal.id}</p></div>
                        <div><p className="font-medium text-gray-500">Event Name:</p><p className="text-gray-900 font-medium">{proposal.event_name}</p></div>
                        <div><p className="font-medium text-gray-500">Department:</p><p className="text-gray-900">{proposal.department_name}</p></div>
                        <div><p className="font-medium text-gray-500">Convener:</p><p className="text-gray-900">{proposal.convener_name}</p></div>
                        <div className="sm:col-span-2"><p className="font-medium text-gray-500">Convener Email:</p><p className="text-gray-900 break-words">{proposal.convener_email}</p></div>
                    </div>

                     {/* Bill Items Section */}
                     <div className="mt-4 border-t pt-4">
                        <h3 className="text-md font-semibold text-gray-700 mb-3">Bill Items</h3>
                        {proposal.bill_items && proposal.bill_items.length > 0 ? (
                            <div className="overflow-x-auto border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200 text-xs md:text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Sub-Category</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                                            <th scope="col" className="px-4 py-2 text-right font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            <th scope="col" className="px-4 py-2 text-center font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-4 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Added On</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {proposal.bill_items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-2 whitespace-nowrap">{item.category}</td>
                                                <td className="px-4 py-2 whitespace-nowrap">{item.sub_category}</td>
                                                <td className="px-4 py-2 text-right">{item.quantity}</td>
                                                <td className="px-4 py-2 text-right">{formatCurrency(item.cost)}</td>
                                                <td className="px-4 py-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.status === 'estimated' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-gray-500">{formatDateSafe(item.created_at, 'dd-MM-yy HH:mm')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Corrected tfoot to avoid whitespace hydration error */}
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

                {/* Footer / Action Area */}
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

                    {/* Action Button */}
                    <div className="flex justify-end">
                         <button
                            onClick={handleSettleClick}
                            disabled={settlementStatus === 'loading' || settlementStatus === 'success'}
                            className={`btn btn-sm inline-flex items-center gap-2 ${
                                settlementStatus === 'success'
                                    ? 'btn-success text-white cursor-not-allowed' // Use DaisyUI success style
                                    : settlementStatus === 'loading'
                                    ? 'btn-disabled loading' // Use DaisyUI loading state
                                    : 'btn-primary' // Use DaisyUI primary button style
                            }`}
                        >
                            {/* DaisyUI handles loading spinner via 'loading' class */}
                            {settlementStatus === 'success' && <CheckCircle size={16} />}
                            {/* Text changes based on status */}
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