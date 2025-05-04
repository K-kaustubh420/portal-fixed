// src/app/accounts/Stats.tsx
'use client'; // Required for Recharts components

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList // Import LabelList for displaying values on bars
} from 'recharts';
import { DepartmentTotal } from '@/types'; // Assuming types.ts is in src/types.ts
                                         // Adjust import path if your types file is elsewhere

interface StatsProps {
  data: DepartmentTotal[]; // Expects the aggregated data [{ department_name: string, totalAmount: number }, ...]
  title?: string;          // Optional title for the chart card
}

// Helper to format currency for Y-axis, Tooltip, and Labels
const formatCurrency = (value: number) => {
  // Handle potential non-numeric values gracefully (though data should be clean)
  if (typeof value !== 'number' || isNaN(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0, // Show only whole rupees in labels/axis
  }).format(value);
};

const Stats: React.FC<StatsProps> = ({ data, title = "Department-wise Pending Amount" }) => {

  // Handle case where data might be empty or undefined
  if (!data || data.length === 0) {
    return (
      <div className="card bg-white shadow-xl h-80"> {/* Give card a fixed height */}
        <div className="card-body items-center justify-center text-center">
          <h2 className="card-title">{title}</h2>
          <p className="text-gray-500 mt-4">No pending settlement data available to display chart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-white  shadow-xl h-full min-h-[350px]"> {/* Ensure card takes space */}
      <div className="card-body">
        <h2 className="card-title mb-4 text-lg font-semibold">{title}</h2>
        {/* Responsive container makes the chart adapt to the card size */}
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{
              top: 30,    // Increased top margin to accommodate labels
              right: 20,
              left: 30,   // Increased left margin for Y-axis labels
              bottom: 40, // Increased bottom margin for rotated X-axis labels
            }}
            barGap={5} // Add some gap between bars
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="department_name"
              angle={-30}         // Rotate labels for better readability if names are long
              textAnchor="end"   // Anchor rotated text at the end
              height={60}        // Allocate more height for rotated labels
              interval={0}       // Ensure all labels are shown
              tick={{ fontSize: 11, fill: '#6b7280' }} // Style X-axis ticks (gray color)
             />
            <YAxis
              axisLine={false}    // Hide the Y-axis line itself
              tickLine={false}    // Hide the Y-axis tick lines
              tickFormatter={formatCurrency} // Format Y-axis ticks as currency
              tick={{ fontSize: 11, fill: '#6b7280' }} // Style Y-axis ticks
              width={90}         // Ensure enough width for formatted currency labels
            />
            <Tooltip
              cursor={{ fill: 'rgba(200, 200, 200, 0.3)' }} // Lighter hover effect
              formatter={(value: number) => formatCurrency(value)} // Format tooltip value
              labelFormatter={(label: string) => `Dept: ${label}`} // Add context to tooltip label
              contentStyle={{ // Style tooltip box
                 backgroundColor: 'rgba(255, 255, 255, 0.9)',
                 border: '1px solid #ccc',
                 borderRadius: '4px',
                 fontSize: '12px',
                 padding: '5px 10px'
               }}
            />
            {/* <Legend /> */} {/* Usually not needed for a single data series bar chart */}
            <Bar dataKey="totalAmount" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={35}> {/* Add slight radius to top corners */}
              {/* Add labels on top of bars */}
              <LabelList
                dataKey="totalAmount"
                position="top"
                formatter={formatCurrency} // Format labels as currency
                fontSize={10}           // Smaller font size for labels
                fill="#374151"        // Darker label text color for contrast
                offset={5}            // Add a small offset above the bar
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Stats;