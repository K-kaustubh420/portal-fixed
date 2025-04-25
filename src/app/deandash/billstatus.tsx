"use client";

import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Item } from './deandash';

interface BillStatusProps {
  proposals: { id: string }[];
  authToken: string | null;
  apiBaseUrl: string;
}

interface BillItem extends Item {
  proposal_id: number;
}

const BillStatus: React.FC<BillStatusProps> = ({ proposals, authToken, apiBaseUrl }) => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBillItems = async () => {
      if (!authToken || !apiBaseUrl || !proposals.length) {
        setError('Authentication token, API base URL, or proposals missing.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const billPromises = proposals.map(proposal =>
          axios.get<{ status: string; items: Item[] }>(
            `${apiBaseUrl}/api/dean/proposals/${proposal.id}/bill`,
            {
              headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' }
            }
          )
        );
        const responses = await Promise.allSettled(billPromises);
        const allItems: BillItem[] = responses
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value.data.items.map(item => ({
                ...item,
                proposal_id: parseInt(proposals[index].id, 10)
              }));
            }
            return [];
          })
          .flat();
        setBillItems(allItems);
      } catch (err: any) {
        const axiosError = err as AxiosError;
        const errorMessage =
          (axiosError.response?.data as any)?.message ||
          axiosError.message ||
          'Failed to fetch bill items';
        console.error('BillStatus: Error fetching bill items:', {
          errorMessage,
          status: axiosError.response?.status
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBillItems();
  }, [proposals, authToken, apiBaseUrl]);

  const groupBillItems = (items: BillItem[]) => {
    const grouped: { [key: string]: BillItem[] } = {};
    items.forEach(item => {
      const key = `${item.proposal_id}-${item.category}-${item.sub_category}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const groupedItems = groupBillItems(billItems);

  const calculateTotals = (items: BillItem[]) => {
    let estimatedTotal = 0;
    let actualTotal = 0;
    items.forEach(item => {
      if (item.status === 'estimated') {
        estimatedTotal += item.amount;
      } else if (item.status === 'actual') {
        actualTotal += item.amount;
      }
    });
    return { estimatedTotal, actualTotal, difference: actualTotal - estimatedTotal };
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-4 md:p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Billing Status</h2>
      {loading && (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-md text-blue-600"></span>
        </div>
      )}
      {error && (
        <div className="alert alert-error text-sm p-3 mb-4">
          <span>{error}</span>
        </div>
      )}
      {!loading && !error && billItems.length === 0 && (
        <div className="text-sm text-gray-600">No billing information available.</div>
      )}
      {!loading && !error && billItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-compact w-full text-sm">
            <thead>
              <tr className='bg-blue-200 text-gray-700'>
                <th>Proposal ID</th>
                <th>Category</th>
                <th>Sub-Category</th>
                <th>Estimated</th>
                <th>Actual</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedItems).map(([key, items]) => {
                const { estimatedTotal, actualTotal, difference } = calculateTotals(items);
                const [proposalId, category, subCategory] = key.split('-');
                return (
                  <tr key={key}>
                    <td>{proposalId}</td>
                    <td>{category}</td>
                    <td>{subCategory}</td>
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
      )}
    </div>
  );
};

export default BillStatus;
