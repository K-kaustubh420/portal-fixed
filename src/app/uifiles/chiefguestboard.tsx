"use client";
import React, { useState } from 'react';
import ChiefGuestForm from './ChiefGuestForm';
import BookingForm from './BookingForm';

interface ChiefGuest {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  panCard: string;
  accountNumber: string;
  designation: string;
  purpose: string;
  accommodation?: {
    type: string;
    checkInDate: string;
    checkOutDate: string;
    cost: number;
  };
  travel?: {
    mode: string;
    details: string;
    cost: number;
  };
  other?: {
    expenses: string;
    cost: number;
  };
}

const ChiefGuestBoard: React.FC = () => {
  const [chiefGuests, setChiefGuests] = useState<ChiefGuest[]>([
    {
      id: '1',
      name: 'Jane Smith',
      address: '123 Main St, City',
      email: 'jane.smith@example.com',
      phoneNumber: '123-456-7890',
      panCard: 'ABCDE1234F',
      accountNumber: '123456789012',
      designation: 'CEO',
      purpose: 'Keynote speaker for Tech Conference 2025',
      accommodation: {
        type: 'Hotel',
        checkInDate: '2025-06-14',
        checkOutDate: '2025-06-17',
        cost: 1500,
      },
      travel: {
        mode: 'Flight',
        details: 'Flight AA123 from NYC to Campus',
        cost: 800,
      },
      other: {
        expenses: 'Local transport and meals',
        cost: 200,
      },
    },
  ]);

  const handleChiefGuestSubmit = (data: Omit<ChiefGuest, 'id' | 'accommodation' | 'travel' | 'other'>) => {
    const newGuest: ChiefGuest = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
    };
    setChiefGuests(prev => [...prev, newGuest]);
  };

  const handleBookingSubmit = (data: Omit<ChiefGuest['accommodation'] & ChiefGuest['travel'] & ChiefGuest['other'], 'type' | 'mode' | 'expenses'> & { accommodationType: string; travelMode: string; otherExpenses: string }) => {
    // For demo, apply booking to the latest guest
    setChiefGuests(prev => {
      const updated = [...prev];
      const latestGuest = updated[updated.length - 1];
      latestGuest.accommodation = {
        type: data.accommodationType,
        checkInDate: data.checkInDate,
        checkOutDate: data.checkOutDate,
        cost: data.cost,
      };
      latestGuest.travel = {
        mode: data.travelMode,
        details: data.details,
        cost: data.cost,
      };
      latestGuest.other = {
        expenses: data.otherExpenses,
        cost: data.cost,
      };
      return updated;
    });
  };

  return (
    <div
      className=""
      style={{
        backgroundImage: "url('/SRMIST-BANNER.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <div className="bg-gray-100 bg-opacity-90 min-h-screen font-sans text-gray-900">
        <div className="p-6 max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-blue-700">Chief Guest Management</h1>
              <p className="text-gray-500 text-sm">Manage chief guest details and bookings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <ChiefGuestForm onSubmit={handleChiefGuestSubmit} />
              <BookingForm onSubmit={handleBookingSubmit} />
            </div>
            <div className="lg:col-span-1 space-y-8">
              <div className="card shadow-md rounded-lg bg-white">
                <div className="card-body">
                  <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Registered Chief Guests</h2>
                  {chiefGuests.length > 0 ? (
                    <div className="space-y-4">
                      {chiefGuests.map(guest => (
                        <div key={guest.id} className="p-4 bg-gray-50 rounded-md">
                          <h3 className="font-semibold text-gray-700">{guest.name}</h3>
                          <p className="text-sm text-gray-600"><strong>Designation:</strong> {guest.designation}</p>
                          <p className="text-sm text-gray-600"><strong>Email:</strong> {guest.email}</p>
                          <p className="text-sm text-gray-600"><strong>Phone:</strong> {guest.phoneNumber}</p>
                          <p className="text-sm text-gray-600"><strong>Purpose:</strong> {guest.purpose}</p>
                          {guest.accommodation && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600"><strong>Accommodation:</strong> {guest.accommodation.type} (${guest.accommodation.cost})</p>
                              <p className="text-sm text-gray-600"><strong>Check-In:</strong> {guest.accommodation.checkInDate}</p>
                              <p className="text-sm text-gray-600"><strong>Check-Out:</strong> {guest.accommodation.checkOutDate}</p>
                            </div>
                          )}
                          {guest.travel && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600"><strong>Travel:</strong> {guest.travel.mode} (${guest.travel.cost})</p>
                              <p className="text-sm text-gray-600"><strong>Details:</strong> {guest.travel.details}</p>
                            </div>
                          )}
                          {guest.other && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600"><strong>Other Expenses:</strong> {guest.other.expenses} (${guest.other.cost})</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No chief guests registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiefGuestBoard;
