"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, isValid } from 'date-fns';
import {
    X, FileText, Info, DollarSign, MessageSquare, AlertCircle, CheckCircle, AlertTriangle, Send, Users, User as UserIcon, CalendarDays // Renamed User to UserIcon to avoid conflict if User type is imported
} from 'lucide-react';
import axios, { AxiosError } from 'axios';
// Assuming your deandash.ts exports these types
import { UnifiedProposal, Item as DeanItem, Message as DeanMessage } from './deandash'; 

// Helper Component: DetailItem
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string; icon?: React.ElementType }> = ({ label, value, children, className = '', icon: Icon }) => {
    const isEmpty = !children && (value === null || value === undefined || value === '' || (typeof value === 'number' && isNaN(value)));
    if (isEmpty) { return null; }
    return (
        <div className={className}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5 flex items-center">
                {Icon && <Icon size={14} className="mr-1.5 text-gray-400" />}
                {label}
            </p>
            {children ? <div className="text-sm text-gray-700">{children}</div> : <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>}
        </div>
    );
};

// Helper Function: Format Currency
const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Props for the Popup component
interface PopupProps {
  selectedProposal: UnifiedProposal | null;
  closePopup: () => void;
  onProposalUpdated: () => void;
  authToken: string | null;
  apiBaseUrl: string;
  fetchError?: string | null; // Error from initial fetch of proposal details by parent
}

const Popup: React.FC<PopupProps> = ({
  selectedProposal,
  closePopup,
  onProposalUpdated,
  authToken,
  apiBaseUrl,
  fetchError,
}) => {
  const [clarificationInput, setClarificationInput] = useState('');
  const [isClarifying, setIsClarifying] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For primary actions in footer
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null); // Specific to footer actions

  const [billItems, setBillItems] = useState<DeanItem[]>([]);
  const [isBillLoading, setIsBillLoading] = useState(false);
  const [billError, setBillError] = useState<string | null>(null);
  const [showBill, setShowBill] = useState(false);

  const userRole = 'dean'; // Hardcoded for this Dean-specific component
  const notFoundMessage = "Proposal not found or is not awaiting at your level.";

  // Handle fetchError from parent (e.g., if initial detail fetch failed)
  if (fetchError) {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-60 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="bg-white rounded-lg border-t-4 border-red-700 shadow-xl w-full max-w-md mx-auto p-6"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-red-800 flex items-center"><AlertCircle size={22} className="mr-2"/> Error</h2>
            <button onClick={closePopup} className="text-gray-500 hover:text-red-600" aria-label="Close pop-up">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            {fetchError.includes("not found") || fetchError.includes("awaiting") ? notFoundMessage : fetchError}
          </p>
          <div className="flex justify-end">
            <button onClick={closePopup} className="btn btn-sm btn-ghost">Close</button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!selectedProposal) return null; // Should not happen if fetchError is handled, but good guard

  // Create a safe version of the proposal with defaults
  const safeProposal: UnifiedProposal = {
    id: selectedProposal.id || 'N/A',
    title: selectedProposal.title || 'Untitled Proposal',
    description: selectedProposal.description || 'N/A',
    category: selectedProposal.category || 'Uncategorized',
    status: selectedProposal.status || 'Pending',
    eventStartDate: selectedProposal.eventStartDate || '',
    eventEndDate: selectedProposal.eventEndDate || '',
    submissionTimestamp: selectedProposal.submissionTimestamp || '',
    cost: selectedProposal.cost || 0,
    detailedBudget: selectedProposal.detailedBudget || [],
    sponsorshipDetails: selectedProposal.sponsorshipDetails || [],
    messages: selectedProposal.messages || [],
    awaiting: selectedProposal.awaiting || null,
    department_name: selectedProposal.department_name || selectedProposal.organizingDepartment || 'N/A',
    convenerName: selectedProposal.convenerName || 'Unknown',
    convenerEmail: selectedProposal.convenerEmail || 'N/A',
    rejectionMessage: selectedProposal.rejectionMessage || '',
    estimatedBudget: selectedProposal.estimatedBudget || selectedProposal.cost || 0,
    date: selectedProposal.date || '',
    organizer: selectedProposal.organizer || 'Unknown',
    eventDate: selectedProposal.eventDate || '',
    eventDescription: selectedProposal.eventDescription || 'N/A',
    eventTitle: selectedProposal.eventTitle || selectedProposal.title || 'Untitled Event',
    email: selectedProposal.email || 'N/A',
    location: selectedProposal.location || '',
    chiefGuestName: selectedProposal.chiefGuestName || '',
    chiefGuestDesignation: selectedProposal.chiefGuestDesignation || '',
    designation: selectedProposal.designation || '',
    durationEvent: selectedProposal.durationEvent || '',
    fundingDetails: selectedProposal.fundingDetails || {},
    organizingDepartment: selectedProposal.organizingDepartment || '',
    pastEvents: selectedProposal.pastEvents || '',
    proposalStatus: selectedProposal.proposalStatus || selectedProposal.status || '',
    relevantDetails: selectedProposal.relevantDetails || '',
    tags: selectedProposal.tags || [],
    chief: selectedProposal.chief || null,
    user: selectedProposal.user || null,
  };

  const canPerformApiActions = !!authToken && !!apiBaseUrl;
  const getActionEndpoint = () => `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}`;

  const fetchBillReport = async () => {
    if (!canPerformApiActions) {
      setBillError('Authentication or configuration missing.');
      setShowBill(true); // Show the bill section to display the error
      return;
    }
    setIsBillLoading(true);
    setBillError(null);
    setBillItems([]); 
    const billEndpoint = `${apiBaseUrl}/api/dean/proposals/${safeProposal.id}/bill`;
    try {
      const response = await axios.get<{ status: string; items: DeanItem[] }>(billEndpoint, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });
      setBillItems(response.data.items || []);
    } catch (error: any) {
      const axiosError = error as AxiosError;
      const errMsg = (axiosError.response?.data as any)?.message || axiosError.message || 'Failed to fetch bill report';
      setBillError(errMsg);
    } finally {
      setIsBillLoading(false);
      setShowBill(true); // Ensure bill section is shown to display content or error
    }
  };
  
  const handleAction = async (actionType: 'approve' | 'clarify' | 'reject') => {
    const endpoint = getActionEndpoint();
    if (!canPerformApiActions || !endpoint) {
      setActionErrorMessage(authToken ? 'API base URL or Proposal ID missing.' : 'Auth token missing.');
      return;
    }
    let confirmMessage = '';
    let requestData: any = {};
    let method: 'post' | 'put' | 'delete' = 'post';

    switch (actionType) {
      case 'approve':
        confirmMessage = 'Are you sure you want to approve this proposal?';
        method = 'post';
        setIsApproving(false); 
        break;
      case 'clarify':
        if (!clarificationInput.trim()) {
          setActionErrorMessage('Please enter comments for clarification.');
          return; // Don't proceed if input is empty
        }
        requestData = { message: clarificationInput };
        method = 'put';
        setIsClarifying(false); 
        break;
      case 'reject':
        confirmMessage = 'Are you sure you want to reject this proposal? This action might be irreversible.';
        // Send clarificationInput even if empty for rejection, backend might expect `message` field
        requestData = { message: clarificationInput || `Rejected by ${userRole}` };
        method = 'delete';
        setIsRejecting(false); 
        break;
    }

    // Confirmation step only for approve and reject, not for clarify
    if ((actionType === 'approve' || actionType === 'reject') && confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    setActionErrorMessage(null);
    try {
      if (method === 'post') {
        await axios.post(endpoint, requestData, { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
      } else if (method === 'put') {
        await axios.put(endpoint, requestData, { headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' } });
      } else if (method === 'delete') {
        await axios.delete(endpoint, { 
            headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json', 'Content-Type': 'application/json' }, 
            data: requestData // Message for rejection goes in data payload for DELETE
        });
      }
      
      onProposalUpdated(); // Callback to parent to refresh list
      closePopup(); // Close main popup on success
    } catch (error: any) {
      const axiosError = error as AxiosError;
      const apiErrorMessage = (axiosError.response?.data as any)?.message || axiosError.message || `Failed to ${actionType} proposal.`;
      setActionErrorMessage(apiErrorMessage);
      // Re-open the specific action form on error so user can see message / retry
      if (actionType === 'approve') setIsApproving(true);
      else if (actionType === 'clarify') setIsClarifying(true);
      else if (actionType === 'reject') setIsRejecting(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClick = () => { setIsApproving(true); setIsClarifying(false); setIsRejecting(false); setActionErrorMessage(null); setClarificationInput(''); };
  const handleClarificationClick = () => { setIsClarifying(true); setIsApproving(false); setIsRejecting(false); setActionErrorMessage(null); /* Keep clarificationInput */ };
  const handleRejectClick = () => { setIsRejecting(true); setIsApproving(false); setIsClarifying(false); setActionErrorMessage(null); /* Keep clarificationInput for potential reason */};
  
  const cancelActionForm = () => {
    setIsApproving(false);
    setIsClarifying(false);
    setIsRejecting(false);
    setClarificationInput(''); // Clear input on cancel
    setActionErrorMessage(null);
  };

  const formatDateSafe = (dateString: string | null | undefined, formatStr: string = 'dd-MM-yyyy hh:mm a'): string => {
    if (!dateString) return 'N/A';
    try { const date = new Date(dateString); return isValid(date) ? format(date, formatStr) : 'Invalid Date'; } catch { return 'Invalid Date'; }
  };

  const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'N/A';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isAwaitingCurrentUser = safeProposal.awaiting?.toLowerCase() === userRole.toLowerCase();
  const showActionButtons = safeProposal.status === 'Pending' && isAwaitingCurrentUser && !isApproving && !isClarifying && !isRejecting;
  
  let headerTitle = `Details: ${safeProposal.title}`;
  if (isApproving) headerTitle = `Confirm Approval: ${safeProposal.title}`;
  if (isClarifying) headerTitle = `Request Clarification: ${safeProposal.title}`;
  if (isRejecting) headerTitle = `Confirm Rejection: ${safeProposal.title}`;

  const groupBillItems = (items: DeanItem[]) => {
    const grouped: { [category: string]: { [subCategory: string]: DeanItem[] } } = {};
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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-transparent bg-opacity-60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-labelledby="proposal-popup-title"
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 120 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 id="proposal-popup-title" className="text-xl font-bold text-blue-900 truncate pr-4">{headerTitle}</h2>
          <button 
            onClick={isApproving || isClarifying || isRejecting ? cancelActionForm : closePopup} 
            className="text-gray-500 hover:text-red-600 transition-colors flex-shrink-0" 
            aria-label={isApproving || isClarifying || isRejecting ? "Cancel Action" : "Close Pop-up"}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
          {actionErrorMessage && (isApproving || isClarifying || isRejecting) && ( // Show error within action form
            <div role="alert" className="alert alert-error alert-sm mb-4 shadow-md">
              <AlertCircle size={18} />
              <span>{actionErrorMessage}</span>
            </div>
          )}

          {isApproving ? (
            <section aria-labelledby="approve-heading" className="border border-green-200 rounded-lg p-4 bg-green-50/50">
              <h3 id="approve-heading" className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2"><CheckCircle size={18} /> Confirm Approval</h3>
              <p className="text-sm text-gray-700">Are you sure you want to approve this proposal titled "{safeProposal.title}"?</p>
            </section>
          ) : isClarifying ? (
            <section aria-labelledby="clarify-heading" className="border border-yellow-300 rounded-lg p-4 bg-yellow-50/50">
              <h3 id="clarify-heading" className="text-lg font-semibold text-yellow-800 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Request Clarification</h3>
              <div className="form-control w-full">
                <label htmlFor="clarificationMessage" className="label"><span className="label-text text-gray-700">Comments/Questions for Clarification <span className="text-red-500">*</span></span></label>
                <textarea id="clarificationMessage" value={clarificationInput} onChange={(e) => setClarificationInput(e.target.value)}
                  className="textarea textarea-bordered h-24 bg-white w-full focus:border-yellow-500 focus:ring-yellow-500" placeholder="e.g., Please provide more details on the keynote speaker's travel arrangements." required></textarea>
              </div>
            </section>
          ) : isRejecting ? (
            <section aria-labelledby="reject-heading" className="border border-red-200 rounded-lg p-4 bg-red-50/50">
              <h3 id="reject-heading" className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Confirm Rejection</h3>
              <div className="form-control w-full">
                <label htmlFor="rejectionMessage" className="label"><span className="label-text text-gray-700">Reason for Rejection (Optional, but recommended)</span></label>
                <textarea id="rejectionMessage" value={clarificationInput} onChange={(e) => setClarificationInput(e.target.value)}
                  className="textarea textarea-bordered h-24 bg-white w-full focus:border-red-500 focus:ring-red-500" placeholder="Provide a clear reason for rejection..."></textarea>
              </div>
              <p className="text-sm text-gray-700 mt-3">Are you sure you want to reject this proposal titled "{safeProposal.title}"? This action may be irreversible.</p>
            </section>
          ) : (
            <>
              {/* Proposal Details Section */}
              <section aria-labelledby="proposal-info-heading" className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
                <h3 id="proposal-info-heading" className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2"><Info size={18} /> General Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <DetailItem label="ID" value={safeProposal.id} />
                  <DetailItem label="Title" value={safeProposal.title} className="md:col-span-2" />
                  <DetailItem label="Department" value={safeProposal.department_name} icon={Users} />
                  <DetailItem label="Category" value={safeProposal.category} />
                  <DetailItem label="Convener" value={safeProposal.convenerName} icon={UserIcon}/>
                  <DetailItem label="Convener Email" value={safeProposal.convenerEmail} />
                  {safeProposal.designation && <DetailItem label="Convener Designation" value={safeProposal.designation} />}
                   <DetailItem label="Status">
                        <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                            safeProposal.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            safeProposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            safeProposal.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            (safeProposal.status as string) === 'Clarification' ? 'bg-orange-100 text-orange-700' : 
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {formatRole(safeProposal.status)}
                        </span>
                    </DetailItem>
                  <DetailItem label="Awaiting Action By" value={formatRole(safeProposal.awaiting)} />
                  <DetailItem label="Event Start" value={formatDateSafe(safeProposal.eventStartDate, 'PPP p')} icon={CalendarDays}/>
                  <DetailItem label="Event End" value={formatDateSafe(safeProposal.eventEndDate, 'PPP p')} icon={CalendarDays}/>
                  {safeProposal.durationEvent && <DetailItem label="Duration" value={safeProposal.durationEvent} />}
                  {safeProposal.location && <DetailItem label="Location" value={safeProposal.location} />}
                   <DetailItem label="Estimated Budget" value={formatCurrency(safeProposal.estimatedBudget)} icon={DollarSign}/>
                  {safeProposal.chiefGuestName && (
                    <DetailItem label="Chief Guest" value={`${safeProposal.chiefGuestName} (${safeProposal.chiefGuestDesignation || 'N/A'})`} className="md:col-span-2" />
                  )}
                  <div className="sm:col-span-2 md:col-span-3">
                    <DetailItem label="Description" value={safeProposal.description} />
                  </div>
                  {safeProposal.rejectionMessage && safeProposal.status === 'Rejected' && (
                    <div className="sm:col-span-2 md:col-span-3 p-2 bg-red-50 border border-red-200 rounded">
                      <DetailItem label="Rejection Reason" value={safeProposal.rejectionMessage} />
                    </div>
                  )}
                </div>
              </section>

              {/* Estimated Budget Details */}
              {safeProposal.detailedBudget && safeProposal.detailedBudget.length > 0 && (
                <section aria-labelledby="estimated-budget-heading" className="mt-4 pt-3 border-t border-gray-200">
                  <h3 id="estimated-budget-heading" className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><FileText size={16} /> Estimated Budget Items</h3>
                  <div className="overflow-x-auto max-h-72 border rounded-md shadow-sm bg-white">
                    <table className="table table-sm w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 z-[1]"><tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="p-2">Category</th><th className="p-2">Sub-Category</th>
                        <th className="p-2 text-right">Qty</th><th className="p-2 text-right">Cost/Unit</th><th className="p-2 text-right">Amount</th>
                      </tr></thead>
                      <tbody>
                        {safeProposal.detailedBudget.map((item, idx) => (
                          <tr key={item.id || `est-${idx}`} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                            <td className="p-2">{item.category}</td><td className="p-2">{item.sub_category}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">{formatCurrency(item.cost)}</td>
                            <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                       {safeProposal.estimatedBudget > 0 && (
                        <tfoot className="sticky bottom-0 bg-gray-200"><tr className="font-bold">
                            <td colSpan={4} className="p-2 text-right text-sm">Total Estimated Budget:</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(safeProposal.estimatedBudget)}</td>
                        </tr></tfoot>
                       )}
                    </table>
                  </div>
                </section>
              )}

              {/* Sponsorship Details */}
              {safeProposal.sponsorshipDetails && safeProposal.sponsorshipDetails.length > 0 && (
                <section aria-labelledby="sponsorship-heading" className="mt-4 pt-3 border-t border-gray-200">
                  <h3 id="sponsorship-heading" className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><DollarSign size={16} /> Sponsorship Details</h3>
                  <div className="overflow-x-auto max-h-60 border rounded-md shadow-sm bg-white">
                    <table className="table table-sm w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 z-[1]"><tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="p-2">Category</th><th className="p-2 text-right">Amount</th>
                        <th className="p-2">Reward</th><th className="p-2">Mode</th>
                      </tr></thead>
                      <tbody>
                        {safeProposal.sponsorshipDetails.map((sponsor, idx) => (
                          <tr key={sponsor.id || `sponsor-${idx}`} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                            <td className="p-2">{sponsor.category}</td>
                            <td className="p-2 text-right">{formatCurrency(sponsor.amount)}</td>
                            <td className="p-2">{sponsor.reward}</td><td className="p-2">{sponsor.mode}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
              
              {/* Communication Log */}
              {safeProposal.messages && safeProposal.messages.length > 0 && (
                <section aria-labelledby="communication-log-heading" className="mt-4 pt-3 border-t border-gray-200">
                  <h3 id="communication-log-heading" className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><MessageSquare size={16} /> Communication Log</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3 bg-white shadow-sm">
                    {safeProposal.messages.map((msg, idx) => { 
                      // msg is typed as DeanMessage which should have optional user
                      const senderName = msg.user_name || msg.user?.name || (msg as any).sender_name || 'Unknown User';
                      const senderRole = msg.user_role || msg.user?.role || (msg as any).sender_role || 'User';
                      
                      return (
                        <div key={msg.id || `msg-${idx}`} className="text-xs border-b border-gray-100 pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                          <p className="text-gray-500 font-medium">
                            {formatRole(senderRole)} ({senderName}) - {formatDateSafe(msg.created_at)}:
                          </p>
                          <p className="pl-2 text-gray-700">{msg.message}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Bill Report Section */}
              <section aria-labelledby="bill-report-heading" className="mt-4 pt-3 border-t border-gray-200">
                <h3 id="bill-report-heading" className="text-md font-semibold text-gray-700 mb-2 flex items-center gap-2"><FileText size={16} /> Actual Bill Report</h3>
                <button
                  onClick={fetchBillReport}
                  className="btn btn-sm btn-outline btn-info mb-3 flex items-center gap-1"
                  disabled={isBillLoading || !canPerformApiActions}
                >
                  {isBillLoading ? <span className="loading loading-spinner loading-xs"></span> : <FileText size={14} />}
                  {showBill && billItems.length > 0 ? 'Refresh Bill Report' : 'View Bill Report'}
                </button>
                
                {showBill && isBillLoading && (
                    <div className="text-center p-4"><span className="loading loading-dots loading-md text-info"></span><p className="text-sm text-gray-500 mt-1">Loading bill items...</p></div>
                )}
                {showBill && !isBillLoading && billError && (
                  <div role="alert" className="alert alert-error alert-sm mt-2 shadow-sm"><AlertCircle size={18} /><span>Error fetching bill: {billError}</span></div>
                )}
                {showBill && !isBillLoading && !billError && billItems.length > 0 && (
                  <div className="overflow-x-auto max-h-96 border rounded-md shadow-sm bg-white">
                    <table className="table table-sm w-full text-xs">
                      <thead className="sticky top-0 bg-gray-100 z-[1]"><tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <th className="p-2">Category</th><th className="p-2">Sub-Category</th>
                        <th className="p-2 text-right">Qty</th><th className="p-2 text-right">Cost/Unit</th>
                        <th className="p-2 text-right">Amount</th><th className="p-2 text-center">Status</th>
                      </tr></thead>
                      <tbody>
                        {Object.entries(groupedBillItems).flatMap(([category, subCategories]) =>
                            Object.entries(subCategories).flatMap(([subCategory, items]) =>
                                items.map((item) => ( 
                                <tr key={item.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50">
                                    <td className="p-2">{category}</td><td className="p-2">{subCategory}</td>
                                    <td className="p-2 text-right">{item.quantity}</td>
                                    <td className="p-2 text-right">{formatCurrency(item.cost)}</td>
                                    <td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                                    <td className="p-2 text-center">
                                    <span className={`badge ${
                                        item.status === 'actual' ? 'badge-success' :
                                        item.status === 'estimated' ? 'badge-warning' : 'badge-ghost'
                                    } badge-sm capitalize`}>
                                        {item.status || 'N/A'}
                                    </span>
                                    </td>
                                </tr>
                                ))
                            )
                        )}
                      </tbody>
                       {billItems.length > 0 && (
                        <tfoot><tr className="font-bold bg-gray-200 sticky bottom-0">
                           <td colSpan={4} className="p-2 text-right text-sm">Total Actual Amount:</td>
                           <td className="p-2 text-right text-sm">{formatCurrency(billItems.reduce((sum, item) => sum + (item.amount || 0), 0))}</td>
                           <td className="p-2"></td>
                       </tr></tfoot>
                       )}
                    </table>
                  </div>
                )}
                {showBill && !isBillLoading && !billError && billItems.length === 0 && (
                  <div className="mt-2 text-sm text-gray-500 p-3 border rounded-md bg-gray-50">No actual billing items found for this proposal yet.</div>
                )}
              </section>
              <div className="mt-6 text-xs text-gray-400 text-right border-t pt-3">
                Proposal Submitted: {formatDateSafe(safeProposal.submissionTimestamp)}
              </div>
            </>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
          {actionErrorMessage && !(isApproving || isClarifying || isRejecting) && ( 
            <div role="alert" className="alert alert-error alert-sm mb-3 shadow-md">
              <AlertCircle size={18} /><span>{actionErrorMessage}</span>
            </div>
          )}
          <div className="flex justify-end items-center gap-3">
            {isApproving ? (
                <>
                    <button onClick={cancelActionForm} className="btn btn-ghost btn-sm" disabled={isLoading}>Cancel</button>
                    <button onClick={() => handleAction('approve')} className="btn btn-success btn-sm text-white flex items-center gap-1" disabled={isLoading || !canPerformApiActions}>
                        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <CheckCircle size={16} />} Confirm Approve
                    </button>
                </>
            ) : isClarifying ? (
                <>
                    <button onClick={cancelActionForm} className="btn btn-ghost btn-sm" disabled={isLoading}>Cancel</button>
                    <button onClick={() => handleAction('clarify')} className="btn btn-warning btn-sm text-black flex items-center gap-1" disabled={isLoading || !clarificationInput.trim() || !canPerformApiActions}>
                        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <Send size={16} />} Submit Request
                    </button>
                </>
            ) : isRejecting ? (
                <>
                    <button onClick={cancelActionForm} className="btn btn-ghost btn-sm" disabled={isLoading}>Cancel</button>
                    <button onClick={() => handleAction('reject')} className="btn btn-error btn-sm text-white flex items-center gap-1" disabled={isLoading || !canPerformApiActions}>
                        {isLoading ? <span className="loading loading-spinner loading-xs"></span> : <AlertTriangle size={16} />} Confirm Reject
                    </button>
                </>
            ) : showActionButtons ? (
              <>
                <button onClick={handleApproveClick} className="btn btn-sm btn-success text-white flex items-center gap-1" disabled={isLoading || !canPerformApiActions}><CheckCircle size={16} />Approve</button>
                <button onClick={handleClarificationClick} className="btn btn-sm btn-warning text-black flex items-center gap-1" disabled={isLoading || !canPerformApiActions}><MessageSquare size={16}/>Request Clarification</button>
                <button onClick={handleRejectClick} className="btn btn-sm btn-error text-white flex items-center gap-1" disabled={isLoading || !canPerformApiActions}><X size={16}/>Reject</button>
              </>
            ) : (
                // Fallback: Show a close button if no actions are applicable or forms are open
                <button onClick={closePopup} className="btn btn-sm btn-outline">Close Details</button> 
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(Popup);