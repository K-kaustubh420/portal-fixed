"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import { X } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { UnifiedProposal, Item, Sponsor, Message } from './deandash';

interface PopupProps {
    selectedProposal: UnifiedProposal;
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
    fetchError
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

    // Validate selectedProposal to ensure required fields
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
        pastEvents: selectedProposal.pastEvents || '',
        proposalStatus: selectedProposal.proposalStatus || '',
        relevantDetails: selectedProposal.relevantDetails || '',
        sponsorshipDetails: selectedProposal.sponsorshipDetails || [],
        rejectionMessage: selectedProposal.rejectionMessage || '',
        tags: selectedProposal.tags || [],
        messages: selectedProposal.messages || [],
        chief: selectedProposal.chief || null,
        user: selectedProposal.user || null,
        awaiting: selectedProposal.awaiting || null
    };

    // Check if API actions are possible
    const canPerformApiActions = !!authToken && !!apiBaseUrl;

    // Fetch Bill Report
    const fetchBillReport = async () => {
        if (!canPerformApiActions) {
            setBillError(authToken ? 'API base URL is missing.' : 'Authentication token missing.');
            return;
        }
        setIsBillLoading(true);
        setBillError(null);
        const billEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/bill`;
        try {
            const response = await axios.get<{ status: string; items: Item[] }>(billEndpoint, {
                headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' }
            });
            setBillItems(response.data.items || []);
            setShowBill(true);
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch bill report';
            console.error('Popup: Error fetching bill report:', { errorMessage, status: axiosError.response?.status, proposalId: safeProposal.id });
            setBillError(errorMessage);
        } finally {
            setIsBillLoading(false);
        }
    };

    const handleRejectClick = () => {
        setIsRejecting(true);
        setIsClarifying(false);
        setIsApproving(false);
        setClarificationInput('');
    };

    const handleClarificationClick = () => {
        setIsClarifying(true);
        setIsRejecting(false);
        setIsApproving(false);
        setClarificationInput('');
    };

    const handleApproveClick = () => {
        setIsApproving(true);
        setIsClarifying(false);
        setIsRejecting(false);
        setClarificationInput('');
    };

    const cancelActions = () => {
        setIsRejecting(false);
        setIsClarifying(false);
        setIsApproving(false);
        setClarificationInput('');
        setErrorMessage(null);
    };

    // Approve Proposal
    const handleApprove = async () => {
        if (!canPerformApiActions) {
            setErrorMessage(authToken ? 'API base URL is missing.' : 'Authentication token missing.');
            return;
        }
        if (!window.confirm('Are you sure you want to approve this proposal?')) return;
        const approveEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/approve`;
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
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to approve proposal';
            console.error('Popup: Error approving proposal:', { errorMessage, status: axiosError.response?.status, proposalId: safeProposal.id });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Request Clarification
    const handleRequestClarification = async () => {
        if (!canPerformApiActions) {
            setErrorMessage(authToken ? 'API base URL is missing.' : 'Authentication token missing.');
            return;
        }
        if (!clarificationInput.trim()) {
            setErrorMessage('Please enter comments for clarification.');
            return;
        }
        const clarifyEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/clarify`;
        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.post(
                clarifyEndpoint,
                { message: clarificationInput },
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
            );
            onProposalUpdated();
            closePopup();
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to request clarification';
            console.error('Popup: Error requesting clarification:', { errorMessage, status: axiosError.response?.status, proposalId: safeProposal.id });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Reject Proposal
    const handleReject = async () => {
        if (!canPerformApiActions) {
            setErrorMessage(authToken ? 'API base URL is missing.' : 'Authentication token missing.');
            return;
        }
        if (!window.confirm('Are you sure you want to reject this proposal? This action might be irreversible.')) return;
        const rejectEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/reject`;
        try {
            setIsLoading(true);
            setErrorMessage(null);
            await axios.post(
                rejectEndpoint,
                { message: clarificationInput || 'Rejected by Dean' },
                { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } }
            );
            onProposalUpdated();
            closePopup();
        } catch (error: any) {
            const axiosError = error as AxiosError;
            const errorMessage = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to reject proposal';
            console.error('Popup: Error rejecting proposal:', { errorMessage, status: axiosError.response?.status, proposalId: safeProposal.id });
            setErrorMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Format Date Safely
    const formatDateSafe = (dateString: string | null | undefined, formatString: string = 'dd-MM-yyyy hh:mm a'): string => {
        if (!dateString) return 'N/A';
        try {
            const dateObj = new Date(dateString);
            if (isValid(dateObj)) return format(dateObj, formatString);
        } catch (e) {
            /* ignore */
        }
        return 'Invalid Date';
    };

    // Capitalize Awaiting Role
    const formatAwaiting = (awaiting: string | null): string => {
        if (!awaiting) return 'None';
        return awaiting.charAt(0).toUpperCase() + awaiting.slice(1).toLowerCase();
    };

    // Group Bill Items by Category and Sub-Category
    const groupBillItems = (items: Item[]) => {
        const grouped: { [key: string]: { estimated: Item[], actual: Item[] } } = {};
        items.forEach(item => {
            const key = `${item.category} - ${item.sub_category}`;
            if (!grouped[key]) {
                grouped[key] = { estimated: [], actual: [] };
            }
            if (item.status === 'estimated') {
                grouped[key].estimated.push(item);
            } else if (item.status === 'actual') {
                grouped[key].actual.push(item);
            }
        });
        return grouped;
    };

    const groupedBillItems = groupBillItems(billItems);

    return (
        <motion.div
            className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-white/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className="bg-white rounded-lg border-t-4 border-blue-800 shadow-lg w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
            >
                <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-blue-900">Proposal Details</h2>
                    <button onClick={closePopup} className="text-gray-500 hover:text-red-600" aria-label="Close pop-up">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-grow">
                    {fetchError && (
                        <div className="alert alert-warning text-sm p-3 mb-4">
                            <div><span>{fetchError}</span></div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">ID:</p>
                            <p className="text-sm text-gray-900">{safeProposal.id}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Title:</p>
                            <p className="text-sm text-gray-900">{safeProposal.title}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Department:</p>
                            <p className="text-sm text-gray-900">{safeProposal.department_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Category:</p>
                            <p className="text-sm text-gray-900">{safeProposal.category}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Convener:</p>
                            <p className="text-sm text-gray-900">{safeProposal.convenerName}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Convener Email:</p>
                            <p className="text-sm text-gray-900">{safeProposal.convenerEmail}</p>
                        </div>
                        {safeProposal.designation && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Convener Designation:</p>
                                <p className="text-sm text-gray-900">{safeProposal.designation}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status:</p>
                            <p
                                className={`text-sm font-medium ${
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
                            <p className="text-sm font-medium text-gray-500">Awaiting Action By:</p>
                            <p className="text-sm text-gray-900">{formatAwaiting(safeProposal.awaiting)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Event Start Date:</p>
                            <p className="text-sm text-gray-900">{formatDateSafe(safeProposal.eventStartDate, 'PPP p')}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Event End Date:</p>
                            <p className="text-sm text-gray-900">{formatDateSafe(safeProposal.eventEndDate, 'PPP p')}</p>
                        </div>
                        {safeProposal.durationEvent && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Duration:</p>
                                <p className="text-sm text-gray-900">{safeProposal.durationEvent}</p>
                            </div>
                        )}
                        {safeProposal.location && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Location:</p>
                                <p className="text-sm text-gray-900">{safeProposal.location}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-500">Estimated Budget:</p>
                            <p className="text-sm text-gray-900">
                                {safeProposal.cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </p>
                        </div>
                        {safeProposal.chiefGuestName && (
                            <div>
                                <p className="text-sm font-medium text-gray-500">Chief Guest:</p>
                                <p className="text-sm text-gray-900">
                                    {safeProposal.chiefGuestName} ({safeProposal.chiefGuestDesignation || 'N/A'})
                                </p>
                            </div>
                        )}
                        <div className="sm:col-span-2">
                            <p className="text-sm font-medium text-gray-500">Description:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{safeProposal.description}</p>
                        </div>
                        {safeProposal.rejectionMessage && safeProposal.status === 'Rejected' && (
                            <div className="sm:col-span-2">
                                <p className="text-sm font-medium text-gray-500">Rejection Reason:</p>
                                <p className="text-sm text-red-600">{safeProposal.rejectionMessage}</p>
                            </div>
                        )}
                    </div>

                    {safeProposal.detailedBudget.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">Budget Items:</p>
                            <ul className="list-disc list-inside text-gray-600 pl-2 text-xs space-y-1 mt-1">
                                {safeProposal.detailedBudget.map((item: Item) => (
                                    <li key={item.id}>
                                        {item.category} - {item.sub_category}: {item.quantity} x{' '}
                                        {item.cost.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} ={' '}
                                        {item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {safeProposal.sponsorshipDetails.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">Sponsors:</p>
                            <ul className="list-disc list-inside text-gray-600 pl-2 text-xs space-y-1 mt-1">
                                {safeProposal.sponsorshipDetails.map((sponsor: Sponsor) => (
                                    <li key={sponsor.id}>
                                        {sponsor.category} ({sponsor.mode}):{' '}
                                        {sponsor.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} | Reward:{' '}
                                        {sponsor.reward || 'N/A'} | About: {sponsor.about || 'N/A'}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {safeProposal.messages.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">Communication Log:</p>
                            <ul className="space-y-2 text-xs text-gray-600 mt-2">
                                {safeProposal.messages.slice().reverse().map((msg: Message) => (
                                    <li key={msg.id} className="border-b border-gray-100 pb-1">
                                        <span className="font-medium text-gray-700">User {msg.user_id}</span> (
                                        {formatDateSafe(msg.created_at)}):<br />
                                        <span className="pl-2">{msg.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {userRole === 'dean' && (
                        <div className="mt-4">
                            <button
                                onClick={fetchBillReport}
                                className="btn btn-sm btn-info"
                                disabled={isBillLoading || !canPerformApiActions}
                            >
                                {isBillLoading ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                ) : (
                                    'View Bill Report'
                                )}
                            </button>
                            {billError && (
                                <div className="alert alert-error text-xs p-2 mt-2">
                                    <div><span>{billError}</span></div>
                                </div>
                            )}
                            {showBill && billItems.length > 0 && (
                                <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                                    <p className="text-sm font-semibold text-green-800">Bill Report (Estimated vs Actual):</p>
                                    <div className="overflow-x-auto mt-2">
                                        <table className="table table-compact w-full text-xs">
                                            <thead>
                                                <tr>
                                                    <th>Category - Sub-Category</th>
                                                    <th>Estimated Amount</th>
                                                    <th>Actual Amount</th>
                                                    <th>Difference</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.entries(groupedBillItems).map(([key, { estimated, actual }]) => {
                                                    const estimatedTotal = estimated.reduce((sum, item) => sum + item.amount, 0);
                                                    const actualTotal = actual.reduce((sum, item) => sum + item.amount, 0);
                                                    const difference = actualTotal - estimatedTotal;
                                                    return (
                                                        <tr key={key}>
                                                            <td>{key}</td>
                                                            <td>{estimatedTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                            <td>{actualTotal.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                                            <td className={difference > 0 ? 'text-red-600' : difference < 0 ? 'text-green-600' : ''}>
                                                                {difference.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {showBill && billItems.length === 0 && (
                                <div className="mt-2 text-sm text-gray-600">No bill items available.</div>
                            )}
                        </div>
                    )}

                    <div className="mt-4 text-xs text-gray-500 text-right">
                        Submitted On: {formatDateSafe(safeProposal.submissionTimestamp)}
                    </div>
                </div>

                <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    {errorMessage && (
                        <div className="alert alert-error text-xs p-2 mb-3">
                            <div><span>{errorMessage}</span></div>
                        </div>
                    )}

                    {safeProposal.status === 'Pending' && safeProposal.awaiting === 'dean' && !isRejecting && !isClarifying && !isApproving && userRole === 'dean' && (
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
                        <div className="mt-4 space-y-3 text-center">
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
                        <div className="mt-4 space-y-3 text-center">
                            <p className="text-lg font-semibold text-red-700">Confirm Rejection</p>
                            <p className="text-sm text-gray-600">Are you sure you want to reject this proposal?</p>
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
                        <div className="mt-4 space-y-3">
                            <label htmlFor="clarificationMessage" className="block text-sm font-semibold text-gray-700">
                                Comments for Clarification Request:
                            </label>
                            <textarea
                                id="clarificationMessage"
                                rows={3}
                                className="textarea textarea-bordered w-full text-sm"
                                placeholder="Enter clarification questions here..."
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

export default Popup;
