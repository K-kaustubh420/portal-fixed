import React, { useState } from 'react';

interface BookingFormData {
  accommodationType: string;
  checkInDate: string;
  checkOutDate: string;
  accommodationCost: number;
  travelMode: string;
  travelDetails: string;
  travelCost: number;
  otherExpenses: string;
  otherCost: number;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<BookingFormData>({
    accommodationType: '',
    checkInDate: '',
    checkOutDate: '',
    accommodationCost: 0,
    travelMode: '',
    travelDetails: '',
    travelCost: 0,
    otherExpenses: '',
    otherCost: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Cost') ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="card shadow-md rounded-lg bg-white">
      <div className="card-body">
        <h2 className="card-title text-lg font-bold text-gray-700 mb-4">Accommodation & Travel Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="accommodationType" className="block text-sm font-medium text-gray-700">Accommodation Type</label>
              <select
                id="accommodationType"
                name="accommodationType"
                value={formData.accommodationType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Select type</option>
                <option value="Hotel">Hotel</option>
                <option value="Guest House">Guest House</option>
                <option value="Campus Lodging">Campus Lodging</option>
              </select>
            </div>
            <div>
              <label htmlFor="accommodationCost" className="block text-sm font-medium text-gray-700">Accommodation Cost ($)</label>
              <input
                type="number"
                id="accommodationCost"
                name="accommodationCost"
                value={formData.accommodationCost}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter cost"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">Check-In Date</label>
              <input
                type="date"
                id="checkInDate"
                name="checkInDate"
                value={formData.checkInDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">Check-Out Date</label>
              <input
                type="date"
                id="checkOutDate"
                name="checkOutDate"
                value={formData.checkOutDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="travelMode" className="block text-sm font-medium text-gray-700">Travel Mode</label>
              <select
                id="travelMode"
                name="travelMode"
                value={formData.travelMode}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Select mode</option>
                <option value="Flight">Flight</option>
                <option value="Train">Train</option>
                <option value="Car">Car</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="travelCost" className="block text-sm font-medium text-gray-700">Travel Cost ($)</label>
              <input
                type="number"
                id="travelCost"
                name="travelCost"
                value={formData.travelCost}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter cost"
                min="0"
              />
            </div>
          </div>
          <div>
            <label htmlFor="travelDetails" className="block text-sm font-medium text-gray-700">Travel Details</label>
            <textarea
              id="travelDetails"
              name="travelDetails"
              value={formData.travelDetails}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter flight number, train details, etc."
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="otherExpenses" className="block text-sm font-medium text-gray-700">Other Expenses</label>
            <textarea
              id="otherExpenses"
              name="otherExpenses"
              value={formData.otherExpenses}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Describe any additional expenses"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="otherCost" className="block text-sm font-medium text-gray-700">Other Cost ($)</label>
            <input
              type="number"
              id="otherCost"
              name="otherCost"
              value={formData.otherCost}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter cost"
              min="0"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300"
            >
              Save Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;