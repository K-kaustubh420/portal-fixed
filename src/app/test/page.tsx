'use client';

import React, { useState } from 'react';
import PdfGeneratorModal, { PdfOptions } from '@/components/PdfGeneratorModal';

export default function TestPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGeneratePdf = (options: PdfOptions) => {
    console.log('PDF Options:', options);
    
    alert(`
✅ PDF Generation Options:

📁 Drive Link: ${options.driveLink || 'Not provided'}
📋 Attendance Proof: ${options.attendanceProof ? 'Yes' : 'No'}
📸 Photos Attached: ${options.photos.length}
🔗 Include Link in PDF: ${options.includeLink ? 'Yes' : 'No'}
    `);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          PDF Generator Test
        </h1>
        <p className="text-gray-600 mb-8">
          Click the button below to test the PDF generator modal
        </p>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all shadow-lg"
        >
          🚀 Open PDF Generator
        </button>

        <PdfGeneratorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGenerate={handleGeneratePdf}
        />
      </div>
    </div>
  );
}