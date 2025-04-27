"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { UnifiedProposal, Item, Sponsor, Message } from './ViceDashboard';

interface PopupProps {
    selectedProposal: UnifiedProposal | null;
    closePopup: () => void;
    onProposalUpdated: () => void;
    authToken: string | null;
    apiBaseUrl: string;
    userRole: string;
    fetchError?: string | null;
}

const Popup: React.FC<PopupProps> = ({
    selectedProposal,
    closePopup,
    onProposalUpdated,
    authToken,
    apiBaseUrl,
    userRole,
    fetchError,
}) => {
    const [clarificationInput, setClarificationInput] = useState('');
    const [isClarifying, setIsClarifying] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [billItems, setBillItems] = useState<Item[]>([]);
    const [isBillLoading, setIsBillLoading] = useState(false);
    const [billError, setBillError] = useState<string | null>(null);
    const [showBill, setShowBill] = useState(false);

    // Specific error message for not found or not awaiting
    const notFoundMessage = "Proposal not found or is not awaiting at your level.";

    // Handle fetchError case
    if (fetchError) {
        return (
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <motion.div
                    className="bg-white rounded-lg border-t-4 border-red-600 shadow-xl w-full max-w-md mx-4 p-6"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-red-900">Error</h2>
                        <button onClick={closePopup} className="text-gray-500 hover:text-red-600" aria-label="Close pop-up">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-sm text-gray-700 mb-4">
                        {fetchError.includes("not found") || fetchError.includes("awaiting") ? notFoundMessage : fetchError}
                    </p>
                    <div className="flex justify-end">
                        <button onClick={closePopup} className="btn btn-sm btn-ghost">
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    // If no selectedProposal and no fetchError, don't render
    if (!selectedProposal) {
        return null;
    }

    // Safe proposal with defaults
    const safeProposal: UnifiedProposal = {
        id: selectedProposal.id || 'N/A',
        title: selectedProposal.title || 'Untitled Proposal',
        status: selectedProposal.status || 'Pending',
        date: selectedProposal.date || '',
        organizer: selectedProposal.organizer || 'Unknown',
        convenerName: selectedProposal.convenerName || 'Unknown',
        convenerEmail: selectedProposal.convenerEmail || 'N/A',
        submissionTimestamp: selectedProposal.submissionTimestamp || '',
        description: selectedProposal.description || 'N/A',
        category: selectedProposal.category || 'Uncategorized',
        eventStartDate: selectedProposal.eventStartDate || '',
        eventEndDate: selectedProposal.eventEndDate || '',
        eventDate: selectedProposal.eventDate || '',
        eventDescription: selectedProposal.eventDescription || 'N/A',
        eventTitle: selectedProposal.eventTitle || 'Untitled Proposal',
        cost: selectedProposal.cost || 0,
        detailedBudget: selectedProposal.detailedBudget || [],
        estimatedBudget: selectedProposal.estimatedBudget || 0,
        email: selectedProposal.email || 'N/A',
        location: selectedProposal.location || '',
        chiefGuestName: selectedProposal.chiefGuestName || '',
        chiefGuestDesignation: selectedProposal.chiefGuestDesignation || '',
        designation: selectedProposal.designation || '',
        durationEvent: selectedProposal.durationEvent || '',
        fundingDetails: selectedProposal.fundingDetails || {},
        organizingDepartment: selectedProposal.organizingDepartment || '',
        department_name: selectedProposal.department_name || '',
        pastEvents: selectedProposal.pastEvents || '',
        proposalStatus: selectedProposal.proposalStatus || '',
        relevantDetails: selectedProposal.relevantDetails || '',
        sponsorshipDetails: selectedProposal.sponsorshipDetails || [],
        rejectionMessage: selectedProposal.rejectionMessage || '',
        tags: selectedProposal.tags || [],
        messages: selectedProposal.messages || [],
        chief: selectedProposal.chief || null,
        user: selectedProposal.user || null,
        awaiting: selectedProposal.awaiting || null,
    };

    const canPerformApiActions = !!authToken && !!apiBaseUrl && !!userRole;

    const getActionEndpoint = () => {
        if (!userRole) {
            console.error("Popup: userRole is missing for action endpoint.");
            return null;
        }
        const proposalId = String(safeProposal.id).trim();
        if (!proposalId || proposalId === 'N/A') {
            console.error("Popup: Invalid proposal ID for action endpoint.");
            return null;
        }
        return `${apiBaseUrl}/api/${userRole}/proposals/${proposalId}`;
    };

    const fetchBillReport = async () => {
        if (userRole !== 'dean') {
            setBillError('Bill report is only available for Deans.');
            return;
        }
        if (!canPerformApiActions) {
            setBillError('Authentication or configuration missing.');
            return;
        }
        setIsBillLoading(true);
        setBillError(null);
        const billEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/bill`;
        try {
            const response = await axios.get<{ status: string; items: Item[] }>(billEndpoint, {
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
            });
            setBillItems(response.data.items || []);
            setShowBill(true);
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage =
                (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch bill report';
            console.error('Popup (Dean Bill): Error fetching bill report:', {
                errorMessage,
                status: axiosError.response?.status,
                proposalId: safeProposal.id,
            });
            setBillError(errorMessage);
        } finally {
            setIsBillLoading(false);
        }
    };

    const handleRejectClick = () => setIsRejecting(true);
    const handleClarificationClick = () => setIsClarifying(true);
    const handleApproveClick = () => setIsApproving(true);
    const cancelActions = () => {
        setIsRejecting(false);
        setIsClarifying(false);
        setIsApproving(false);
        setClarificationInput('');
        setErrorMessage(null);
    };

    const handleApprove = async () => {
        const approveEndpoint = getActionEndpoint();
        if (!canPerformApiActions || !approveEndpoint) {
            setErrorMessage(
                canPerformApiActions ? 'Invalid Proposal ID or Role' : authToken ? 'API base URL missing.' : 'Auth token missing.'
            );
            return;
        }
        if (!window.confirm('Are you sure you want to approve this proposal?')) return;
        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.post(
                approveEndpoint,
                {},
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
            );
            onProposalUpdated();
            closePopup();
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage =
                (axiosError.response?.data as any)?.message || axiosError.message || `Failed to approve proposal as ${userRole}`;
            console.error(`Popup (${userRole}): Error approving proposal:`, {
                errorMessage,
                status: axiosError.response?.status,
                proposalId: safeProposal.id,
            });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestClarification = async () => {
        const clarifyEndpoint = getActionEndpoint();
        if (!canPerformApiActions || !clarifyEndpoint) {
            setErrorMessage(
                canPerformApiActions ? 'Invalid Proposal ID or Role' : authToken ? 'API base URL missing.' : 'Auth token missing.'
            );
            return;
        }
        if (!clarificationInput.trim()) {
            setErrorMessage('Please enter comments for clarification.');
            return;
        }
        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.put(
                clarifyEndpoint,
                { message: clarificationInput },
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
            );
            onProposalUpdated();
            closePopup();
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage =
                (axiosError.response?.data as any)?.message || axiosError.message || `Failed to request clarification as ${userRole}`;
            console.error(`Popup (${userRole}): Error requesting clarification:`, {
                errorMessage,
                status: axiosError.response?.status,
                proposalId: safeProposal.id,
            });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        const rejectEndpoint = getActionEndpoint();
        if (!canPerformApiActions || !rejectEndpoint) {
            setErrorMessage(
                canPerformApiActions ? 'Invalid Proposal ID or Role' : authToken ? 'API base URL missing.' : 'Auth token missing.'
            );
            return;
        }
        if (!window.confirm('Are you sure you want to reject this proposal? This action might be irreversible.')) return;
        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.delete(rejectEndpoint, {
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
                data: { message: clarificationInput || `Rejected by ${userRole}` },
            });
            onProposalUpdated();
            closePopup();
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage =
                (axiosError.response?.data as any)?.message || axiosError.message || `Failed to reject proposal as ${userRole}`;
            console.error(`Popup (${userRole}): Error rejecting proposal:`, {
                errorMessage,
                status: axiosError.response?.status,
                proposalId: safeProposal.id,
            });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (!isValid(date)) return 'Invalid Date';
            return format(date, formatString);
        } catch {
            return 'Invalid Date';
        }
    };

    const formatAwaiting = (awaiting: string | null): string => {
        if (!awaiting) return 'None';
        return awaiting
            .split(/[\s_]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const groupBillItems = (items: Item[]) => {
        const grouped: { [category: string]: { [subCategory: string]: Item[] } } = {};
        items.forEach(item => {
            const cat = item.category || 'Uncategorized';
            const subCat = item.sub_category || 'General';
            if (!grouped[cat]) grouped[cat] = {};
            if (!grouped[cat][subCat]) grouped[cat][subCat] = [];
            grouped[cat][subCat].push(item);
        });
        return grouped;
    };

    const groupedBillItems = groupBillItems(billItems);
    const isAwaitingCurrentUser = !!userRole && safeProposal.awaiting?.toLowerCase() === userRole.toLowerCase();

    return (
        <motion.div
            className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-800 shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-blue-900">Proposal Details</h2>
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Close pop-up">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-grow">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div><p className="font-medium text-gray-500">ID:</p><p className="text-gray-900">{safeProposal.id}</p></div>
                        <div><p className="font-medium text-gray-500">Title:</p><p className="text-gray-900">{safeProposal.title}</p></div>
                        <div>
                            <p className="font-medium text-gray-500">Department:</p>
                            <p className="text-gray-900">{safeProposal.department_name || safeProposal.organizingDepartment || 'N/A'}</p>
                        </div>
                        <div><p className="font-medium text-gray-500">Category:</p><p className="text-gray-900">{safeProposal.category}</p></div>
                        <div><p className="font-medium text-gray-500">Convener:</p><p className="text-gray-900">{safeProposal.convenerName}</p></div>
                        <div><p className="font-medium text-gray-500">Convener Email:</p><p className="text-gray-900 break-words">{safeProposal.convenerEmail}</p></div>
                        {safeProposal.designation && (
                            <div><p className="font-medium text-gray-500">Convener Designation:</p><p className="text-gray-900">{safeProposal.designation}</p></div>
                        )}
                        <div>
                            <p className="font-medium text-gray-500">Status:</p>
                            <p
                                className={`font-semibold ${
                                    safeProposal.status === 'Approved'
                                        ? 'text-green-600'
                                        : safeProposal.status === 'Pending'
                                        ? 'text-yellow-600'
                                        : safeProposal.status === 'Rejected'
                                        ? 'text-red-600'
                                        : 'text-blue-600'
                                }`}
                            >
                                {safeProposal.status}
                            </p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Awaiting Action By:</p>
                            <p className="text-gray-900">{formatAwaiting(safeProposal.awaiting)}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Event Start:</p>
                            <p className="text-gray-900">{formatDateSafe(safeProposal.eventStartDate, 'PPP p')}</p>
                        </div>
                        <div>
                            <p className="font-medium text-gray-500">Event End:</p>
                            <p className="text-gray-900">{formatDateSafe(safeProposal.eventEndDate, 'PPP p')}</p>
                        </div>
                        {safeProposal.durationEvent && (
                            <div><p className="font-medium text-gray-500">Duration:</p><p className="text-gray-900">{safeProposal.durationEvent}</p></div>
                        )}
                        {safeProposal.location && (
                            <div><p className="font-medium text-gray-500">Location:</p><p className="text-gray-900">{safeProposal.location}</p></div>
                        )}
                        <div>
                            <p className="font-medium text-gray-500">Estimated Budget:</p>
                            <p className="text-gray-900 font-semibold">
                                {safeProposal.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) ?? 'N/A'}
                            </p>
                        </div>
                        {safeProposal.chiefGuestName && (
                            <div>
                                <p className="font-medium text-gray-500">Chief Guest:</p>
                                <p className="text-gray-900">{safeProposal.chiefGuestName} ({safeProposal.chiefGuestDesignation || 'N/A'})</p>
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <p className="font-medium text-gray-500">Description:</p>
                            <p className="text-gray-900 whitespace-pre-wrap mt-1">{safeProposal.description}</p>
                        </div>
                        {safeProposal.rejectionMessage && safeProposal.status === 'Rejected' && (
                            <div className="sm:col-span-2">
                                <p className="font-medium text-gray-500">Rejection Reason:</p>
                                <p className="text-red-600 mt-1">{safeProposal.rejectionMessage}</p>
                            </div>
                        )}
                    </div>

                    {safeProposal.detailedBudget && safeProposal.detailedBudget.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Budget Details</h3>
                            <table className="table table-xs w-full">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Sub-Category</th>
                                        <th>Quantity</th>
                                        <th>Cost</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeProposal.detailedBudget.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.category}</td>
                                            <td>{item.sub_category}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                            <td>{item.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {safeProposal.sponsorshipDetails && safeProposal.sponsorshipDetails.length > 0 && (
                        <div className="mt-4 p-3 bg-purple-50 rounded-md border border-purple-100">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Sponsorship Details</h3>
                            <table className="table table-xs w-full">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Amount</th>
                                        <th>Reward</th>
                                        <th>Mode</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {safeProposal.sponsorshipDetails.map((sponsor, idx) => (
                                        <tr key={idx}>
                                            <td>{sponsor.category}</td>
                                            <td>{sponsor.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                            <td>{sponsor.reward}</td>
                                            <td>{sponsor.mode}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {safeProposal.messages && safeProposal.messages.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Communication Log</h3>
                            <div className="space-y-2">
                                {safeProposal.messages.map((msg, idx) => (
                                    <div key={idx} className="text-sm border-b pb-2">
                                        <p><strong>Message:</strong> {msg.message}</p>
                                        <p><strong>Date:</strong> {formatDateSafe(msg.created_at)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {userRole === 'dean' && (
                        <div className="mt-4 border-t pt-4">
                            <h3 className="text-md font-semibold text-gray-700 mb-2">Billing Information</h3>
                            <button
                                onClick={fetchBillReport}
                                className="btn btn-sm btn-outline btn-info"
                                disabled={isBillLoading || !canPerformApiActions}
                            >
                                {isBillLoading ? <span className="loading loading-spinner loading-xs"></span> : 'View Bill Report'}
                            </button>
                            {billError && (
                                <div className="alert alert-error text-xs p-2 mt-2 shadow-sm">
                                    <div><span>{billError}</span></div>
                                </div>
                            )}
                            {showBill && billItems.length > 0 && (
                                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Bill Report</h4>
                                    <table className="table table-xs w-full">
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th>Sub-Category</th>
                                                <th>Quantity</th>
                                                <th>Cost</th>
                                                <th>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(groupedBillItems).map(([category, subCategories]) =>
                                                Object.entries(subCategories).map(([subCategory, items], idx) =>
                                                    items.map((item, itemIdx) => (
                                                        <tr key={`${category}-${subCategory}-${itemIdx}`}>
                                                            <td>{category}</td>
                                                            <td>{subCategory}</td>
                                                            <td>{item.quantity}</td>
                                                            <td>{item.cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                            <td>{item.amount?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                        </tr>
                                                    ))
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {showBill && billItems.length === 0 && !billError && (
                                <div className="mt-2 text-sm text-gray-600">No billing items found for this proposal.</div>
                            )}
                        </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 text-right border-t pt-3">
                        Submitted On: {formatDateSafe(safeProposal.submissionTimestamp)}
                    </div>
                </div>

                <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
                    {errorMessage && (
                        <div className="alert alert-error text-xs p-2 mb-3 shadow-md">
                            <div>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="stroke-current shrink-0 h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                        </div>
                    )}

                    {safeProposal.status === 'Pending' && isAwaitingCurrentUser && !isRejecting && !isClarifying && !isApproving && (
                        <div className="flex flex-wrap gap-3 justify-end">
                            <button
                                onClick={handleApproveClick}
                                className="btn btn-sm btn-success"
                                disabled={isLoading || !canPerformApiActions}
                            >
                                Approve
                            </button>
                            <button
                                onClick={handleClarificationClick}
                                className="btn btn-sm btn-warning"
                                disabled={isLoading || !canPerformApiActions}
                            >
                                Request Clarification
                            </button>
                            <button
                                onClick={handleRejectClick}
                                className="btn btn-sm btn-error"
                                disabled={isLoading || !canPerformApiActions}
                            >
                                Reject
                            </button>
                        </div>
                    )}

                    {isApproving && (
                        <div className="mt-4 space-y-3 text-center p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-lg font-semibold text-green-700">Confirm Approval</p>
                            <p className="text-sm text-gray-600">Are you sure you want to approve this proposal?</p>
                            <div className="flex gap-3 justify-center pt-2">
                                <button onClick={cancelActions} className="btn btn-sm btn-ghost" disabled={isLoading}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="btn btn-sm btn-success"
                                    disabled={isLoading || !canPerformApiActions}
                                >
                                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Confirm Approve'}
                                </button>
                            </div>
                        </div>
                    )}

                    {isRejecting && (
                        <div className="mt-4 space-y-3 p-4 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-lg font-semibold text-red-700 text-center">Confirm Rejection</p>
                            <label htmlFor="rejectionMessage" className="block text-sm font-medium text-gray-700 mt-2">
                                Rejection Reason (Optional):
                            </label>
                            <textarea
                                id="rejectionMessage"
                                rows={2}
                                className="textarea textarea-bordered w-full text-sm"
                                placeholder="Enter rejection reason..."
                                value={clarificationInput}
                                onChange={(e) => setClarificationInput(e.target.value)}
                                disabled={isLoading}
                            />
                            <p className="text-sm text-gray-600 text-center mt-2">Are you sure you want to reject this proposal?</p>
                            <div className="flex gap-3 justify-center pt-2">
                                <button onClick={cancelActions} className="btn btn-sm btn-ghost" disabled={isLoading}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="btn btn-sm btn-error"
                                    disabled={isLoading || !canPerformApiActions}
                                >
                                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Confirm Reject'}
                                </button>
                            </div>
                        </div>
                    )}

                    {isClarifying && (
                        <div className="mt-4 space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <label htmlFor="clarificationMessage" className="block text-sm font-semibold text-gray-700">
                                Comments for Clarification Request:
                            </label>
                            <textarea
                                id="clarificationMessage"
                                rows={3}
                                className="textarea textarea-bordered w-full text-sm"
                                placeholder="Enter clarification questions or points here..."
                                value={clarificationInput}
                                onChange={(e) => setClarificationInput(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                            <div className="flex gap-3 justify-end">
                                <button onClick={cancelActions} className="btn btn-sm btn-ghost" disabled={isLoading}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRequestClarification}
                                    className="btn btn-sm btn-warning"
                                    disabled={isLoading || !clarificationInput.trim() || !canPerformApiActions}
                                >
                                    {isLoading ? <span className="loading loading-spinner loading-xs"></span> : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default React.memo(Popup);