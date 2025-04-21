// stats.tsx
import React from 'react';
import dynamic from 'next/dynamic';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { ListChecks, Clock, XCircle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { ChartOptions } from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const LineChart = dynamic(() => Promise.resolve(Line), {
    ssr: false,
    loading: () => <p>Loading chart...</p>
});

const PieChart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Pie), {
    ssr: false,
    loading: () => <p>Loading chart...</p>
});

const lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#ffffff',
            bodyColor: '#2D3748',
            titleColor: '#2D3748',
            borderColor: '#CBD5E0',
            borderWidth: 1,
            intersect: false,
            mode: 'index',
            bodyFont: { size: 14 },
            titleFont: { size: 16, weight: 700 },
            padding: 10,
            callbacks: {
                label: (context: { label: string; formattedValue: string }) => `${context.label}: ${context.formattedValue} Proposals`,
            },
        },
    },
    scales: {
        y: {
            type: 'linear',
            beginAtZero: true,
            ticks: { color: '#4b5563', font: { size: 12 } }
        },
        x: {
            grid: { display: false },
            ticks: { color: '#4b5563', font: { size: 12 } }
        }
    },
    elements: { line: { tension: 0.4 } }
};

const lineData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [{
        label: 'Monthly Submissions',
        data: [10, 15, 8, 12, 20, 18, 25, 22, 30, 28, 35, 40],
        borderColor: '#3b82f6',
        borderWidth: 3,
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        tension: 0.4,
        pointRadius: 2,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 1,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3b82f6',
        segment: { borderColor: '#3b82f6', borderWidth: 3 },
    }],
};

const pieDataOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' as const, labels: { color: '#4b5563' } },
        tooltip: {
            backgroundColor: '#ffffff',
            bodyColor: '#2D3748',
            titleColor: '#2D3748',
            borderColor: '#CBD5E0',
            borderWidth: 1,
            callbacks: {
                label: (context: { label: string; formattedValue: string }) => `${context.label}: ${context.formattedValue} Proposals`,
            },
        },
    },
    chartArea: { backgroundColor: '#f9fafb' }
};

interface StatsProps {
    totalProposalsCount: number;
    approvedProposalsCount: number;
    pendingProposalsCount: number;
    rejectedProposalsCount: number;
    reviewProposalsCount: number;
}

const Stats: React.FC<StatsProps> = ({
    totalProposalsCount,
    approvedProposalsCount,
    pendingProposalsCount,
    rejectedProposalsCount,
    reviewProposalsCount,
}) => {
    const pieData = {
        labels: ['Approved', 'Pending', 'Rejected', 'Review'],
        datasets: [{
            label: 'Proposal Status',
            data: [approvedProposalsCount, pendingProposalsCount, rejectedProposalsCount, reviewProposalsCount],
            backgroundColor: ['#A78BFA', '#F9A8D4', '#EF4444', '#3AB7BF'],
            borderWidth: 0,
            hoverOffset: 5
        }],
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card stat shadow-md rounded-lg border-t-4 border-blue-500 bg-white">
                    <div className="stat-figure text-blue-500"><ListChecks className="h-6 w-6" /></div>
                    <div className="stat-value">{totalProposalsCount.toLocaleString()}</div>
                    <div className="stat-title text-gray-500 ">Total Applied</div>
                </div>

                <div className="card stat shadow-md rounded-lg border-t-4 border-green-500 bg-white">
                    <div className="stat-figure text-green-500"><CheckCircle className="h-6 w-6" /></div>
                    <div className="stat-value">{approvedProposalsCount.toLocaleString()}</div>
                    <div className="stat-title text-gray-500">Approved</div>
                </div>

                <div className="card stat shadow-md rounded-lg border-t-4 border-red-500 bg-white">
                    <div className="stat-figure text-red-500"><XCircle className="h-6 w-6" /></div>
                    <div className="stat-value">{rejectedProposalsCount.toLocaleString()}</div>
                    <div className="stat-title text-gray-500">Rejected</div>
                </div>

                <div className="card stat shadow-md rounded-lg border-t-4 border-yellow-500 bg-white">
                    <div className="stat-figure text-yellow-500"><Clock className="h-6 w-6" /></div>
                    <div className="stat-value">{pendingProposalsCount.toLocaleString()}</div>
                    <div className="stat-title text-gray-500">Pending</div>
                </div>
                <div className="card stat shadow-md rounded-lg border-t-4 border-info bg-white">
                    <div className="stat-figure text-info"><Clock className="h-6 w-6" /></div>
                    <div className="stat-value">{reviewProposalsCount.toLocaleString()}</div>
                    <div className="stat-title text-gray-500">Review</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="card shadow-md rounded-lg p-5 md:p-7 bg-white">
                        <div className="flex justify-between mb-4">
                            <div>
                                <h5 className="text-3xl font-bold text-gray-700 pb-2">{totalProposalsCount.toLocaleString()}</h5>
                                <p className="text-base font-normal text-gray-700">Proposals this year</p>
                            </div>
                            <div className="flex items-center px-2.5 py-0.5 text-base font-semibold text-green-800 bg-green-100 rounded-full">
                                +{(totalProposalsCount > 0 ? (approvedProposalsCount / totalProposalsCount * 100).toFixed(1) : 0)}%
                                <ArrowUpRight className="w-3 h-3 ms-1" aria-hidden="true" color="currentColor" />
                            </div>
                        </div>
                        <div className="h-72 relative">
                            <LineChart data={lineData} options={lineOptions} />
                        </div>
                        <div className="flex justify-between items-center border-t pt-5 mt-6">
                            <button className="text-sm font-medium text-gray-500 text-center inline-flex items-center" type="button">
                                Last Year
                            </button>
                            <a href="#" className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-500 hover:text-blue-700 bg-gray-50 hover:bg-gray-100 px-3 py-2">
                                Submission Report
                                <ArrowUpRight className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" color="currentColor" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-8">
                    <div className="card shadow-md rounded-lg p-4 md:p-6 bg-white">
                        <div className="flex justify-between mb-3">
                            <div className="flex justify-center items-center">
                                <h5 className="text-xl font-bold leading-none text-gray-700 pe-1">Proposal Status</h5>
                                <div id="data-tooltip-pie" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-gray-900 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 tooltip dark:bg-slate-200">
                                    Status of event proposals
                                    <div className="tooltip-arrow bg-white" data-popper-arrow></div>
                                </div>
                            </div>
                        </div>
                        <div className="h-64 relative text-slate-800">
                            <PieChart data={pieData} options={pieDataOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Stats;