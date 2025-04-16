"use client";

import React, { useState, useCallback } from 'react';
import {
    Star,
    Mail,
    Inbox,
    AlertCircle,
    XCircle,
    MoreVertical,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { motion } from 'framer-motion';


interface Proposal {
    id: string;
    title: string;
    organizer: string;
    date: string;
    endDate: string;
    status: string;
    category: string;
    cost: number;
    email: string;
    description: string;
    location?: string;
    convenerName: string;
    convenerEmail: string;
    transport?: number;
    accommodation?: number;
    hall?: number;
    detailedBudget?: { mainCategory: string; subCategory: string; totalAmount: number }[];
    actualBudget?: { label: string; amount: number }[];
    chiefGuests?: ChiefGuest[]; // Add chiefGuests to the Proposal interface
    read?: boolean;
    starred?: boolean;
    reviewLater?: boolean;
}

interface ChiefGuest {  // Keep the ChiefGuest interface
    name: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
}

const ViewBills: React.FC = () => {
    const [bills, setBills] = useState<Proposal[]>([
        {
            id: '1',
            title: 'Sample Event 1',
            organizer: 'Department A',
            date: '2024-01-01',
            endDate: '2024-01-05',
            status: 'Approved',
            category: 'Conference',
            cost: 5000,
            email: 'user@example.com',
            description: 'A sample event',
            convenerName: 'John Doe',
            convenerEmail: 'john.doe@example.com',
            detailedBudget: [
                { mainCategory: 'Hospitality', subCategory: 'Food for Participants', totalAmount: 1000 },
                { mainCategory: 'Publicity', subCategory: 'Invitation', totalAmount: 500 },
            ],
            actualBudget: [{ label: 'Hospitality', amount: 1200 }, { label: 'Publicity', amount: 400 }],
            chiefGuests: [{ name: 'Dr. Smith', accountNumber: '12345', bankName: 'Bank of America', ifscCode: 'BOFA123' }],
            read: false,
            starred: true,
            reviewLater: false,
        },
        {
            id: '2',
            title: 'Sample Event 2',
            organizer: 'Department B',
            date: '2024-02-15',
            endDate: '2024-02-20',
            status: 'Done',
            category: 'Workshop',
            cost: 3000,
            email: 'user@example.com',
            description: 'Another sample event',
            convenerName: 'Jane Smith',
            convenerEmail: 'jane.smith@example.com',
            detailedBudget: [
                { mainCategory: 'General', subCategory: 'Printing and Stationery', totalAmount: 300 },
                { mainCategory: 'Honorarium', subCategory: 'Keynote Speakers', totalAmount: 800 },
            ],
            actualBudget: [{ label: 'General', amount: 250 }, { label: 'Honorarium', amount: 900 }],
            chiefGuests: [{ name: 'Prof. Johnson', accountNumber: '67890', bankName: 'Chase', ifscCode: 'CHAS678' }],
            read: true,
            starred: false,
            reviewLater: true,
        },
    ]);
    const [selectedBill, setSelectedBill] = useState<Proposal | null>(null);


    const toggleRead = useCallback((id: string) => {
        setBills(prevBills =>
            prevBills.map(bill =>
                bill.id === id ? { ...bill, read: !bill.read } : bill
            )
        );
    }, []);

    const toggleStarred = useCallback((id: string) => {
        setBills(prevBills =>
            prevBills.map(bill =>
                bill.id === id ? { ...bill, starred: !bill.starred } : bill
            )
        );
    }, []);

    const toggleReviewLater = useCallback((id: string) => {
        setBills(prevBills =>
            prevBills.map(bill =>
                bill.id === id ? { ...bill, reviewLater: !bill.reviewLater } : bill
            )
        );
    }, []);

    const handleBillClick = useCallback((bill: Proposal) => {
        setSelectedBill(bill);
    }, []);

    const closePopup = useCallback(() => {
        setSelectedBill(null);
    }, []);


    const calculateTotalProposedBudget = useCallback((detailedBudget: { mainCategory: string; subCategory: string; totalAmount: number }[] | undefined) => {
        if (!detailedBudget) return 0;
        return detailedBudget.reduce((acc, item) => acc + (item.totalAmount || 0), 0);
    }, []);


    const calculateTotalActualBudget = useCallback((actualBudget: { label: string; amount: number }[] | undefined) => {
        if (!actualBudget) return 0;
        return actualBudget.reduce((acc, item) => acc + item.amount, 0);
    }, []);


    return (
        <div className="bg-gray-100 min-h-screen p-4">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-blue-700 mb-4">View Bills</h1>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="border-b border-gray-200">
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Organizer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        End Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {bills.map((bill) => (
                                    <tr
                                        key={bill.id}
                                        className={`hover:bg-gray-50 cursor-pointer ${bill.read ? "bg-gray-100" : "bg-white"
                                            } ${selectedBill?.id === bill.id ? "bg-blue-50" : ""}`}
                                        onClick={() => handleBillClick(bill)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {!bill.read && (
                                                    <div className="flex-shrink-0 h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                                                )}
                                                {bill.starred ? (
                                                    <Star className="h-5 w-5 text-yellow-400" />
                                                ) : (
                                                    <Star className="h-5 w-5 text-gray-400" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {bill.title}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {bill.organizer}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">
                                                {bill.endDate ? new Date(bill.endDate).toLocaleDateString() : "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRead(bill.id);
                                                    }}
                                                    title="Mark as Read/Unread"
                                                    aria-label="Mark as Read/Unread"
                                                >
                                                    {bill.read ? (
                                                        <Inbox className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                                    ) : (
                                                        <Mail className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleStarred(bill.id);
                                                    }}
                                                    title="Star/Unstar"
                                                    aria-label="Star/Unstar"
                                                >
                                                    <Star
                                                        className={`h-5 w-5 ${bill.starred
                                                            ? "text-yellow-400"
                                                            : "text-gray-400"
                                                            } hover:text-yellow-500`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleReviewLater(bill.id);
                                                    }}
                                                    title="Review Later"
                                                    aria-label="Review Later"
                                                >
                                                    <AlertCircle
                                                        className={`h-5 w-5 ${bill.reviewLater
                                                            ? "text-blue-500"
                                                            : "text-gray-400"
                                                            } hover:text-blue-600`}
                                                    />
                                                </button>
                                                <div className="relative inline-block text-left">
                                                    <button
                                                        type="button"
                                                        className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                                        onClick={(e) => { e.stopPropagation(); }}
                                                        aria-label="more options"
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>

                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {bills.length === 0 && (
                            <div className="text-center p-4">No bills found.</div>
                        )}
                    </div>
                </div>
            </div>
            {selectedBill && (
                <motion.div
                    className="fixed inset-0 z-50 shadow-md shadow-blue-200 flex items-center justify-center bg-gray-500 bg-opacity-50"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    exit={{ rotateY: 90, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="bg-blue-50 rounded-lg border-t-4 border-blue-800 shadow-md shadow-blue-950 p-8 max-w-2xl w-full max-h-full overflow-y-auto"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
                    >
                        <div className="flex justify-between rounded-md items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Bill Details - {selectedBill.title}</h2>
                            <button onClick={closePopup} className="text-gray-600 hover:text-gray-800" aria-label="close popup">
                                <XCircle className="h-6 w-6" />
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold mb-2">Proposed Budget</h3>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Main Category</th>
                                        <th>Sub Category</th>
                                        <th>Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.detailedBudget && selectedBill.detailedBudget.length > 0 ? (
                                        selectedBill.detailedBudget.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.mainCategory}</td>
                                                <td>{item.subCategory}</td>
                                                <td>${item.totalAmount?.toLocaleString() || 'N/A'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center italic">No detailed budget provided.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <h3 className="text-lg font-semibold mt-6 mb-2">Actual Budget</h3>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Label</th>
                                        <th>Amount</th>
                                        <th>Comparison</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.actualBudget && selectedBill.actualBudget.length > 0 ? (
                                        selectedBill.actualBudget.map((item, index) => {
                                            const proposedAmount = selectedBill.detailedBudget?.find(
                                                (proposedItem) => proposedItem.mainCategory === item.label
                                            )?.totalAmount || 0;

                                            return (
                                                <tr key={index}>
                                                    <td>{item.label}</td>
                                                    <td>${item.amount.toLocaleString()}</td>
                                                    <td>
                                                        {item.amount > proposedAmount ? (
                                                            <ArrowUp className="text-red-500 h-5 w-5" />
                                                        ) : item.amount < proposedAmount ? (
                                                            <ArrowDown className="text-green-500 h-5 w-5" />
                                                        ) : (
                                                            ""
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={3} className="text-center italic">
                                                No actual budget details provided.
                                            </td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td className="font-bold">Total:</td>
                                        <td className="font-bold">
                                            ${calculateTotalActualBudget(selectedBill.actualBudget).toLocaleString()}
                                        </td>
                                        <td>
                                            {(() => {
                                                const totalProposed = calculateTotalProposedBudget(selectedBill.detailedBudget);
                                                const totalActual = calculateTotalActualBudget(selectedBill.actualBudget);

                                                if (totalActual > totalProposed) {
                                                    return <ArrowUp className="text-red-500 h-5 w-5" />;
                                                } else if (totalActual < totalProposed) {
                                                    return <ArrowDown className="text-green-500 h-5 w-5" />;
                                                }
                                                return null;
                                            })()}
                                        </td>
                                    </tr>

                                </tbody>
                            </table>
                        </div>
                        {/* Chief Guest Details Table */}
                        <h3 className="text-lg font-semibold mt-6 mb-2">Chief Guest Details</h3>
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Account Number</th>
                                        <th>Bank Name</th>
                                        <th>IFSC Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedBill.chiefGuests && selectedBill.chiefGuests.length > 0 ? (
                                        selectedBill.chiefGuests.map((guest, index) => (
                                            <tr key={index}>
                                                <td>{guest.name}</td>
                                                <td>{guest.accountNumber}</td>
                                                <td>{guest.bankName}</td>
                                                <td>{guest.ifscCode}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center italic">No chief guest details provided.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default ViewBills;