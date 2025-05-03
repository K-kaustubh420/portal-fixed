// src/components/Stats.tsx
"use client";

import React from 'react';
import { ListChecks, Clock, DollarSign } from 'lucide-react'; // Using relevant icons

// --- Stats Component ---

interface StatsProps {
    pendingProposalsCount: number; // Total count of proposals needing settlement
    totalPendingValue: number;     // Sum of estimated amounts for all pending proposals
}

// Helper to format currency (can be moved to a shared util if used elsewhere)
const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'N/A';
    // Adjust locale and currency as needed
    return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};


const Stats: React.FC<StatsProps> = ({
    pendingProposalsCount,
    totalPendingValue,
}) => {
    // Use default 0 if counts/values are null/undefined
    const safePendingCount = pendingProposalsCount ?? 0;
    const safePendingValue = totalPendingValue ?? 0;

    return (
        <div className="mb-6"> {/* Adjusted margin */}
            {/* Stat Cards Focused on Pending Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Simplified to 2 main stats */}

                {/* Card for Pending Count */}
                <div className="stat card bg-white shadow rounded-lg border-l-4 border-yellow-500 p-4">
                    <div className="stat-figure text-yellow-500">
                        <Clock size={24} />
                    </div>
                    <div className="stat-title text-gray-500">Pending Settlement</div>
                    <div className="stat-value text-gray-800 text-2xl font-semibold">
                        {safePendingCount.toLocaleString()}
                    </div>
                    <div className="stat-desc text-xs text-gray-400">Proposals awaiting action</div>
                </div>

                {/* Card for Total Pending Value */}
                <div className="stat card bg-white shadow rounded-lg border-l-4 border-blue-500 p-4">
                    <div className="stat-figure text-blue-500">
                         {/* Using DollarSign, adjust icon if needed */}
                        <DollarSign size={24}/>
                    </div>
                    <div className="stat-title text-gray-500">Total Pending Value</div>
                    <div className="stat-value text-gray-800 text-2xl font-semibold">
                        {formatCurrency(safePendingValue)}
                    </div>
                     <div className="stat-desc text-xs text-gray-400">Estimated sum of pending bills</div>
                </div>

            </div>

            {/* Charts are removed as they relied on historical or settled data */}

        </div>
    );
};

export default Stats;