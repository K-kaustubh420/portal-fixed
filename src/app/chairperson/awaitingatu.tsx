"use client";

import React from 'react';
import { UnifiedProposal } from './ChairDashboard';
import { format, isValid } from 'date-fns';

interface AwaitingAtUProps {
  proposals: UnifiedProposal[];
  userRole: string;
}

const AwaitingAtU: React.FC<AwaitingAtUProps> = ({ proposals, userRole }) => {
  const awaitingProposals = proposals.filter(
    proposal => proposal.awaiting?.toLowerCase() === userRole.toLowerCase()
  );

  const formatDateSafe = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const dateObj = new Date(dateString);
      if (isValid(dateObj)) return format(dateObj, 'dd-MM-yyyy');
    } catch (e) {
      /* ignore */
    }
    return 'Invalid Date';
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">
        Proposals Awaiting at Your Level
      </h2>
      {awaitingProposals.length === 0 ? (
        <div className="text-sm text-gray-600">No proposals awaiting at your level.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-compact w-full text-sm">
            <thead>
              <tr className='bg-blue-200 text-gray-700'>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {awaitingProposals.map(proposal => (
                <tr key={proposal.id}>
                  <td>{proposal.id}</td>
                  <td>{proposal.title}</td>
                  <td
                    className={`${
                      proposal.status === 'Approved'
                        ? 'text-green-600'
                        : proposal.status === 'Pending'
                        ? 'text-yellow-600'
                        : proposal.status === 'Rejected'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}
                  >
                    {proposal.status}
                  </td>
                  <td>{formatDateSafe(proposal.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AwaitingAtU;
