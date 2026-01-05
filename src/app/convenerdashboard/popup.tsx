import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isValid, differenceInCalendarDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import ProposalFileUpload from '@/components/ProposalFileUpload';
import * as XLSX from 'xlsx';
import {
  X, User, Users, UserCheck, BedDouble, Car, FileText, Award, DollarSign, Info,
  CalendarDays, AlertCircle, MessageSquare, Edit, Loader2, ThumbsUp, ThumbsDown,
  MessageCircle, Send, FileDown, UploadCloud, Image as ImageIcon, Trash2
} from 'lucide-react';

// --- Interfaces ---
interface BudgetItem {
  id: number;
  proposal_id: number;
  category: string;
  sub_category: string;
  type: 'Domestic' | 'International' | null;
  quantity: number;
  cost: number;
  amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SponsorItem {
  id: number;
  proposal_id: number;
  category: string;
  amount: number;
  reward: string;
  mode: string;
  about: string;
  benefit: string;
  created_at: string;
  updated_at: string;
}

interface MessageUser {
  id: number;
  name: string;
  email: string;
  role: string;
  designation?: string;
}

interface Message {
  id: number;
  proposal_id: number;
  user_id: number;
  message: string;
  created_at: string;
  updated_at: string;
  user: MessageUser;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  eventStartDate: string;
  eventEndDate: string;
  submissionTimestamp: string;
  date: string;
  organizer: string;
  convenerName: string;
  convenerEmail?: string;
  convenerDesignation?: string;
  participantExpected?: number | null;
  participantCategories?: string[] | null;
  chiefGuestName?: string;
  chiefGuestDesignation?: string;
  chiefGuestAddress?: string;
  chiefGuestPhone?: string;
  chiefGuestPan?: string;
  chiefGuestReason?: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelDuration?: number;
  hotelType?: 'srm' | 'others' | null;
  travelName?: string;
  travelAddress?: string;
  travelDuration?: number;
  travelType?: 'srm' | 'others' | null;
  estimatedBudget?: number;
  fundingDetails: { universityFund?: number; registrationFund?: number; sponsorshipFund?: number; otherSourcesFund?: number; };
  detailedBudget: BudgetItem[];
  sponsorshipDetailsRows: SponsorItem[];
  pastEvents?: string | null;
  relevantDetails?: string | null;
  awaiting?: string | null;
  messages: Message[];
}

interface PopupProps {
  selectedProposal: Proposal | null;
  closePopup: () => void;
  onProposalUpdated?: () => void;
  currentUserRole?: 'faculty' | 'hod' | 'dean' | 'chair' | 'vice_chair' | 'convener' | string;
}

// --- Helper Components ---
const DetailItem: React.FC<{ label: string; value?: string | number | null; children?: React.ReactNode; className?: string }> = ({ label, value, children, className = '' }) => {
  if (!children && (value === null || value === undefined || value === '')) return null;
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-gray-700">{label}:</p>
      {children ? <div className="text-sm text-gray-600 mt-0.5">{children}</div> : <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>}
    </div>
  );
};

const PopupSkeleton: React.FC = () => (
    <div className="bg-white rounded-lg border-t-4 border-blue-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col animate-pulse">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            <div className="h-6 w-6 bg-gray-300 rounded-full"></div>
        </div>
        <div className="p-6 flex-grow">
            <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-1/3 mt-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="h-8 bg-gray-300 rounded w-1/4 float-right"></div>
        </div>
    </div>
);

// --- PDF Options Modal Component ---
const PdfOptionsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    photos: File[],
    proofs: File[],
    attendance: File[],
    brochure: File[]
  ) => void;
  proposalId: string;
  userToken: string | null;
}> = ({ isOpen, onClose, onGenerate, proposalId, userToken }) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [proofs, setProofs] = useState<File[]>([]);
  const [attendance, setAttendance] = useState<File[]>([]);
  const [brochure, setBrochure] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const photosInputRef = useRef<HTMLInputElement>(null);
  const proofsInputRef = useRef<HTMLInputElement>(null);
  const attendanceInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null, category: 'photos' | 'proofs' | 'attendance' | 'brochure') => {
    if (!files) return;
    const fileArray = Array.from(files);
    
    switch(category) {
      case 'photos':
        setPhotos(prev => [...prev, ...fileArray]);
        break;
      case 'proofs':
        setProofs(prev => [...prev, ...fileArray]);
        break;
      case 'attendance':
        setAttendance(prev => [...prev, ...fileArray]);
        break;
      case 'brochure':
        setBrochure(prev => [...prev, ...fileArray]);
        break;
    }
  };

  const removeFile = (category: 'photos' | 'proofs' | 'attendance' | 'brochure', index: number) => {
    switch(category) {
      case 'photos':
        setPhotos(prev => prev.filter((_, i) => i !== index));
        break;
      case 'proofs':
        setProofs(prev => prev.filter((_, i) => i !== index));
        break;
      case 'attendance':
        setAttendance(prev => prev.filter((_, i) => i !== index));
        break;
      case 'brochure':
        setBrochure(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files, 'photos');
  };

  const uploadFilesToServer = async () => {
    setUploading(true);
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost/events/public';

    if (!userToken) {
      alert('You are not authenticated. Please login again.');
      setUploading(false);
      return;
    }

    try {
      const uploadFile = async (file: File, category: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        
        console.log(`📤 Uploading ${file.name} to category: ${category}`);
        
        // ✅ FIXED: Use /api/faculty endpoint (works for conveners via middleware)
        const uploadUrl = `${API_BASE_URL}/api/faculty/proposals/${proposalId}/files`;
        console.log('Upload URL:', uploadUrl);
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Accept': 'application/json',
          },
        });

        console.log(`Response for ${file.name}:`, response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ 
            message: `Upload failed with status ${response.status}` 
          }));
          throw new Error(errorData.message || `Failed to upload ${file.name}`);
        }

        return await response.json();
      };

      const uploadPromises = [
        ...photos.map(file => uploadFile(file, 'photos')),
        ...proofs.map(file => uploadFile(file, 'proofs')),
        ...attendance.map(file => uploadFile(file, 'attendance')),
        ...brochure.map(file => uploadFile(file, 'brochure')),
      ];

      await Promise.all(uploadPromises);
      
      console.log('✅ All files uploaded successfully!');
      
      onGenerate(photos, proofs, attendance, brochure);
      onClose();
    } catch (error) {
      console.error('❌ Upload failed:', error);
      alert(`Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPhotos([]);
      setProofs([]);
      setAttendance([]);
      setBrochure([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const FileUploadSection = ({ 
    title, 
    files, 
    category, 
    inputRef 
  }: { 
    title: string; 
    files: File[]; 
    category: 'photos' | 'proofs' | 'attendance' | 'brochure';
    inputRef: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <div className="border-2 border-dashed rounded-lg p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-blue-50 transition-colors">
        <button 
          onClick={() => inputRef.current?.click()} 
          className="btn btn-sm btn-outline btn-primary"
          type="button"
          disabled={uploading}
        >
          <UploadCloud size={16} className="mr-1" />
          Choose Files
        </button>
        <input
          type="file"
          ref={inputRef}
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files, category)}
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-2">Images or PDFs (Max 10MB each)</p>
      </div>
      
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText size={14} className="text-indigo-600 flex-shrink-0" />
                <span className="truncate text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                onClick={() => removeFile(category, index)}
                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded ml-2 transition-colors"
                type="button"
                disabled={uploading}
                title="Remove file"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center backdrop-blur-sm bg-black bg-opacity-40 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UploadCloud className="text-indigo-600" size={20} />
            Upload Documents & Generate Report
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors" 
            disabled={uploading}
            title="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto space-y-4 custom-scrollbar">
          <FileUploadSection 
            title="📄 Proofs Attached" 
            files={proofs} 
            category="proofs" 
            inputRef={proofsInputRef}
          />
          
          <FileUploadSection 
            title="📋 Attendance and Members Details" 
            files={attendance} 
            category="attendance" 
            inputRef={attendanceInputRef}
          />
          
          <FileUploadSection 
            title="📑 Event Brochure" 
            files={brochure} 
            category="brochure" 
            inputRef={brochureInputRef}
          />
          
          {/* Photo Upload with Drag & Drop */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">📷 Event Photos (Optional)</h4>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50 scale-105' 
                  : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-indigo-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-600">Drag & drop images here</p>
              <p className="text-xs text-gray-500 mt-1">or</p>
              <button 
                onClick={() => photosInputRef.current?.click()} 
                className="btn btn-sm btn-outline btn-primary mt-3" 
                type="button" 
                disabled={uploading}
              >
                <ImageIcon size={14} className="mr-1" />
                Browse Files
              </button>
              <input
                type="file"
                ref={photosInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files, 'photos')}
                disabled={uploading}
              />
              <p className="text-xs text-gray-400 mt-2">PNG, JPG, JPEG (Max 10MB each)</p>
            </div>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-3 text-gray-700 flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-600" />
                Photo Previews ({photos.length}):
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <img 
                      src={URL.createObjectURL(photo)} 
                      alt={`preview ${index}`} 
                      className="h-28 w-full object-cover" 
                    />
                    <button
                      onClick={() => removeFile('photos', index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700"
                      type="button"
                      disabled={uploading}
                      title="Remove photo"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {photo.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {photos.length + proofs.length + attendance.length + brochure.length > 0 && (
              <span className="font-semibold text-indigo-600">
                {photos.length + proofs.length + attendance.length + brochure.length} file(s) ready
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-ghost btn-sm" disabled={uploading}>
              Cancel
            </button>
            <button 
              onClick={uploadFilesToServer} 
              className="btn btn-primary btn-sm"
              disabled={uploading || (photos.length === 0 && proofs.length === 0 && attendance.length === 0 && brochure.length === 0)}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Uploading...
                </>
              ) : (
                <>
                  <FileDown className="mr-2" size={16} />
                  Upload & Generate PDF
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main Popup Component ---
const Popup: React.FC<PopupProps> = ({
  selectedProposal,
  closePopup,
  onProposalUpdated,
  currentUserRole
}) => {
  const [isClient, setIsClient] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);

  // ✅ Get token from localStorage (consistent with ProposalFileUpload)
  const token = localStorage.getItem('authToken');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDateSafe = (dateString: string | null | undefined, formatString = 'dd-MM-yyyy hh:mm a'): string => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      return isValid(d) ? format(d, formatString) : 'Invalid Date';
    } catch {
      return 'Invalid Date';
    }
  };

  const calculateDuration = (): string => {
    if (!selectedProposal) return 'N/A';
    try {
      const start = new Date(selectedProposal.eventStartDate);
      const end = new Date(selectedProposal.eventEndDate);
      if (isValid(start) && isValid(end) && end >= start) {
        const days = differenceInCalendarDays(end, start) + 1;
        return `${days} day${days !== 1 ? 's' : ''}`;
      }
    } catch {
      return 'N/A';
    }
    return 'N/A';
  };
  
  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return 'N/A';
    return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };
  
  const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'N/A';
    return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const eventDuration = calculateDuration();

  const handleDownloadPdf = () => {
    if (!selectedProposal) return;
    setIsPdfOptionsModalOpen(true);
  };

  const generatePdfWithOptions = async (
    photos: File[],
    proofs: File[],
    attendance: File[],
    brochure: File[]
  ) => {
    if (!selectedProposal) return;
    setIsDownloading(true);
    setIsPdfOptionsModalOpen(false);

    // Convert File objects to base64 for images
    const photosBase64: string[] = [];
    for (const photo of photos) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(photo);
      });
      photosBase64.push(base64);
    }

    const photosHtml = photosBase64.length > 0
      ? `<h2>Photographs</h2><div style="margin-top: 15px;">${photosBase64.map(src => `<img src="${src}" style="width: 100%; max-width: 700px; height: auto; margin-bottom: 15px; page-break-inside: avoid;" />`).join('')}</div>`
      : '<p><strong>17. Photographs:</strong> No photographs were attached.</p>';
      
    const attachmentsChecklistHtml = `
  <div class="section">
    <h2>Attachments Checklist</h2>
    <p><strong>- Proofs Attached:</strong> ${proofs.length > 0 ? 'Yes (' + proofs.length + ' file(s))' : 'No'}</p>
    <p><strong>- Attendance and Members Details:</strong> ${attendance.length > 0 ? 'Yes (' + attendance.length + ' file(s))' : 'No'}</p>
    <p><strong>- Brochure:</strong> ${brochure.length > 0 ? 'Yes (' + brochure.length + ' file(s))' : 'No'}</p>
  </div>
`;

    const reportHtml = `
      <html>
        <head>
          <title>Event Report: ${selectedProposal.title}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #333; }
            h1 { font-size: 20px; color: #1a237e; text-align: center; margin-bottom: 20px; }
            h2 { font-size: 16px; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 25px; }
            h3 { font-size: 14px; margin-top: 20px; }
            p { margin: 5px 0; }
            strong { font-weight: bold; }
            .content { max-width: 800px; margin: auto; }
            .section { margin-bottom: 15px; page-break-inside: avoid; }
            .financial-item { padding-left: 20px; }
            .signature { margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="content">
            <h1>Event Report: ${selectedProposal.title}</h1>
            <div class="section">
              <h2>POST EVENT REPORT</h2>
              <p><strong>1. Name and Designation of Conveners:</strong> ${selectedProposal.convenerName} (${selectedProposal.convenerDesignation || 'N/A'})</p>
              <p><strong>2. Conducting Department:</strong> ${selectedProposal.organizer}</p>
              <p><strong>3. Date and Duration:</strong> ${formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} to ${formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} (${eventDuration})</p>
              <p><strong>4. Type of event:</strong> ${formatRole(selectedProposal.category)}</p>
              <p><strong>5. Mode of Conduction:</strong> N/A</p>
              <p><strong>6. Association:</strong> N/A</p>
              <p><strong>7. Total Registered Participants:</strong> ${selectedProposal.participantExpected ?? 'N/A'}</p>
              <p><strong>8. Internal/External participants:</strong> Internal- N/A, External- N/A</p>
              <p><strong>9. Male/Female participants:</strong> Male- N/A, Female- N/A</p>
              <p><strong>10. Participant Categories:</strong> ${selectedProposal.participantCategories?.join(', ') || 'N/A'}</p>
              <p><strong>11. About the Workshop (Theme/Objective):</strong> ${selectedProposal.description || 'N/A'}</p>
              <p><strong>12. Targeted Audience:</strong> ${selectedProposal.participantCategories?.join(', ') || 'N/A'}</p>
              <p><strong>13. Number of Technical Sessions:</strong> N/A</p>
              <p><strong>14. Session Details:</strong> N/A</p>
              <p><strong>15. Event Outcome:</strong> ${selectedProposal.relevantDetails || 'N/A'}</p>
              <p><strong>16. Feedback Collected:</strong> N/A</p>
            </div>
            <div class="section">
              <h3>18. Financial statement:</h3>
              <p class="financial-item"><strong>External Sponsoring Agency:</strong> ${formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)}</p>
              <p class="financial-item"><strong>Contribution from University:</strong> ${formatCurrency(selectedProposal.fundingDetails?.universityFund)}</p>
              <p class="financial-item"><strong>Income through Registration:</strong> ${formatCurrency(selectedProposal.fundingDetails?.registrationFund)}</p>
              <p class="financial-item"><strong>Total Expenditure incurred:</strong> ${formatCurrency(selectedProposal.estimatedBudget)}</p>
              <p class="financial-item"><strong>Amount returned to University:</strong> N/A</p>
            </div>
            ${attachmentsChecklistHtml}
            <div class="section">
              ${photosHtml}
            </div>
            <p class="signature"><strong>19. Signature of Conveners:</strong></p>
            <p class="signature"><strong>20. Signature of Dept. Event Coordinator:</strong></p>
            <p class="signature"><strong>21. Signature of HOD:</strong></p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
        setIsDownloading(false);
      }, 250);
    } else {
      alert("Could not open a new window. Please disable your pop-up blocker.");
      setIsDownloading(false);
    }
  };
  
  const handleDownloadExcel = () => {
    if (!selectedProposal) return;
    setIsDownloading(true);

    const formatCurrencyForExcel = (value: number | null | undefined): number | string => {
        if (value == null) return 'N/A';
        return value;
    };

    const reportDataObject = {
        "1. Name of Conveners": `${selectedProposal.convenerName} (${selectedProposal.convenerDesignation || 'N/A'})`,
        "2. Conducting Department": selectedProposal.organizer,
        "3. Date and Duration": `${formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} to ${formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} (${eventDuration})`,
        "4. Type of event": formatRole(selectedProposal.category),
        "5. Mode of Conduction": "N/A",
        "6. Association": "N/A",
        "7. Total Participants": selectedProposal.participantExpected ?? 'N/A',
        "8. Internal/External participants": "Internal- N/A, External- N/A",
        "9. Male/Female participants": "Male- N/A, Female- N/A",
        "10. Participant Categories": selectedProposal.participantCategories?.join(', ') || 'N/A',
        "11. About the Workshop": selectedProposal.description || 'N/A',
        "12. Targeted Audience": selectedProposal.participantCategories?.join(', ') || 'N/A',
        "13. Number of Technical Sessions": "N/A",
        "14. Session Details": "Details to be added manually.",
        "15. Event Outcome": selectedProposal.relevantDetails || "N/A",
        "16. Feedback Collected": "N/A",
        "17. Photographs": "To be included in the final report."
    };
    
    const report_ws = XLSX.utils.json_to_sheet([reportDataObject]);

    const columnWidths = Object.keys(reportDataObject).map(key => ({
        wch: key.length > 35 ? key.length : 35
    }));
    report_ws['!cols'] = columnWidths;

    const additionalData = [
        [], 
        [{ v: "18. Financial Statement", s: { font: { bold: true, sz: 12 } } }],
        ["External Sponsoring Agency:", formatCurrencyForExcel(selectedProposal.fundingDetails?.sponsorshipFund)],
        ["Contribution from University:", formatCurrencyForExcel(selectedProposal.fundingDetails?.universityFund)],
        ["Income through Registration:", formatCurrencyForExcel(selectedProposal.fundingDetails?.registrationFund)],
        ["Total Expenditure Incurred:", formatCurrencyForExcel(selectedProposal.estimatedBudget)],
        ["Amount returned to University:", "N/A"],
        [], 
        ["19. Signature of Conveners:", ""],
        ["20. Signature of Dept. Event Coordinator:", ""],
        ["21. Signature of HOD:", ""]
    ];

    XLSX.utils.sheet_add_aoa(report_ws, additionalData, { origin: "A4" });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, report_ws, "Event Report");

    if (selectedProposal.detailedBudget?.length > 0) {
        const budgetData: Array<any> = selectedProposal.detailedBudget.map(item => ({
            "Category": item.category, "Sub-Category": item.sub_category, "Type": item.type || '-', "Status": item.status, "Quantity": item.quantity, "Cost per Unit": item.cost, "Total Amount": item.amount
        }));
        const totalBudget = selectedProposal.detailedBudget.reduce((sum, item) => sum + (item.amount || 0), 0);
        budgetData.push({ "Category": "TOTAL", "Sub-Category": "", "Type": "", "Status": "", "Quantity": null, "Cost per Unit": null, "Total Amount": totalBudget });
        const budget_ws = XLSX.utils.json_to_sheet(budgetData);
        budget_ws['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, budget_ws, "Detailed Budget");
    }
    if (selectedProposal.sponsorshipDetailsRows?.length > 0) {
        const sponsorData = selectedProposal.sponsorshipDetailsRows.map(sponsor => ({
            "Sponsor/Category": sponsor.category, "Mode": sponsor.mode, "Amount": sponsor.amount, "Reward": sponsor.reward, "Benefit": sponsor.benefit, "About": sponsor.about
        }));
        const totalSponsorship = selectedProposal.sponsorshipDetailsRows.reduce((sum, item) => sum + (item.amount || 0), 0);
        sponsorData.push({ "Sponsor/Category": "TOTAL", "Mode": "", "Amount": totalSponsorship, "Reward": "", "Benefit": "", "About": "" });
        const sponsors_ws = XLSX.utils.json_to_sheet(sponsorData);
        sponsors_ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, sponsors_ws, "Sponsorship Details");
    }

    XLSX.writeFile(workbook, `Proposal_Report_${selectedProposal.id}.xlsx`);
    setIsDownloading(false);
  };

  if (!selectedProposal) return null;

  return (
    <>
      <PdfOptionsModal
        isOpen={isPdfOptionsModalOpen}
        onClose={() => setIsPdfOptionsModalOpen(false)}
        onGenerate={generatePdfWithOptions}
        proposalId={selectedProposal.id}
        userToken={token}
      />
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-opacity-50 p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
        <motion.div className="bg-white rounded-lg border-t-4 border-indigo-700 shadow-xl w-full max-w-5xl mx-auto max-h-[90vh] flex flex-col"
          initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 120 }}>
          
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-bold text-indigo-900">{selectedProposal.title || 'Proposal Details'}</h2>
            <button onClick={closePopup} className="text-gray-500 hover:text-red-600 transition-colors" aria-label="Close pop-up">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-5 md:p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
            <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><Info size={18} /> Event Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                <DetailItem label="Proposal ID" value={selectedProposal.id} />
                <DetailItem label="Category" value={formatRole(selectedProposal.category)} />
                <DetailItem label="Status">
                  <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedProposal.status === 'approved' ? 'bg-green-100 text-green-700' : selectedProposal.status === 'completed' ? 'bg-purple-100 text-purple-700' : selectedProposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : selectedProposal.status === 'rejected' ? 'bg-red-100 text-red-700' : selectedProposal.status === 'review' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {formatRole(selectedProposal.status)}
                  </span>
                </DetailItem>
                <DetailItem label="Awaiting Approval From" value={formatRole(selectedProposal.awaiting) || (selectedProposal.status !== 'pending' && selectedProposal.status !== 'review' ? '-' : 'N/A')} />
                <DetailItem label="Event Start Date" value={formatDateSafe(selectedProposal.eventStartDate, 'dd-MM-yyyy')} />
                <DetailItem label="Event End Date" value={formatDateSafe(selectedProposal.eventEndDate, 'dd-MM-yyyy')} />
                <DetailItem label="Duration" value={eventDuration} />
                <DetailItem label="Submitted On" value={formatDateSafe(selectedProposal.submissionTimestamp)} />
                <div className="sm:col-span-2 md:col-span-3"><DetailItem label="Description" value={selectedProposal.description || 'N/A'} /></div>
                <div className="sm:col-span-2 md:col-span-3"><DetailItem label="Past Relevant Events" value={selectedProposal.pastEvents || 'N/A'} /></div>
                <div className="sm:col-span-2 md:col-span-3"><DetailItem label="Other Relevant Details" value={selectedProposal.relevantDetails || 'N/A'} /></div>
              </div>
            </section>

            <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><Users size={18} /> Organizer & Participants</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                <DetailItem label="Organizing Dept." value={selectedProposal.organizer} />
                <DetailItem label="Convener Name" value={selectedProposal.convenerName} />
                <DetailItem label="Convener Email" value={selectedProposal.convenerEmail} />
                <DetailItem label="Convener Designation" value={selectedProposal.convenerDesignation || 'N/A'} />
                <DetailItem label="Expected Participants" value={selectedProposal.participantExpected ?? 'N/A'} />
                <DetailItem label="Participant Categories" className="md:col-span-2">
                  {selectedProposal.participantCategories && selectedProposal.participantCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProposal.participantCategories.map((cat, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{cat}</span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-600">N/A</p>}
                </DetailItem>
              </div>
            </section>

            {selectedProposal.chiefGuestName && (
              <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
                <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><UserCheck size={18} /> Chief Guest</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                  <DetailItem label="Name" value={selectedProposal.chiefGuestName} />
                  <DetailItem label="Designation" value={selectedProposal.chiefGuestDesignation} />
                  <DetailItem label="Phone" value={selectedProposal.chiefGuestPhone} />
                  <DetailItem label="PAN" value={selectedProposal.chiefGuestPan} />
                  <DetailItem label="Address" value={selectedProposal.chiefGuestAddress} className="md:col-span-2" />
                  <DetailItem label="Reason for Inviting" value={selectedProposal.chiefGuestReason || 'N/A'} className="md:col-span-3" />
                </div>
                {(selectedProposal.hotelName || selectedProposal.travelName) && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Accommodation & Travel</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><BedDouble size={16} /> Accommodation</p>
                        <DetailItem label="Hotel" value={`${selectedProposal.hotelName || 'N/A'} (${selectedProposal.hotelType || 'N/A'})`} />
                        <DetailItem label="Hotel Address" value={selectedProposal.hotelAddress || 'N/A'} />
                        <DetailItem label="Stay Duration" value={selectedProposal.hotelDuration ? `${selectedProposal.hotelDuration} day(s)` : 'N/A'} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1 mb-1"><Car size={16} /> Travel</p>
                        <DetailItem label="Mode" value={`${selectedProposal.travelName || 'N/A'} (${selectedProposal.travelType || 'N/A'})`} />
                        <DetailItem label="From/To" value={selectedProposal.travelAddress || 'N/A'} />
                        <DetailItem label="Travel Duration/Trips" value={selectedProposal.travelDuration ? `${selectedProposal.travelDuration} day(s)/trip(s)` : 'N/A'} />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
              <h3 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center gap-2"><DollarSign size={18} /> Financial Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mb-4">
                <DetailItem label="Est. Total Budget" value={formatCurrency(selectedProposal.estimatedBudget)} />
                <DetailItem label="University Fund" value={formatCurrency(selectedProposal.fundingDetails?.universityFund)} />
                <DetailItem label="Registration Fund" value={formatCurrency(selectedProposal.fundingDetails?.registrationFund)} />
                <DetailItem label="Sponsorship Fund" value={formatCurrency(selectedProposal.fundingDetails?.sponsorshipFund)} />
                <DetailItem label="Other Fund" value={formatCurrency(selectedProposal.fundingDetails?.otherSourcesFund)} />
              </div>
              {selectedProposal.detailedBudget && selectedProposal.detailedBudget.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><FileText size={16} /> Detailed Budget Items</h4>
                  {isClient && (
                    <div className="overflow-x-auto max-h-60 border rounded-md">
                      <table className={`table table-sm w-full text-xs ${isClient ? 'sticky-table' : ''}`}>
                        <thead className="bg-gray-100 z-10"><tr className='text-blue-500'><th className="p-2">Category</th><th className="p-2">Subcategory</th><th className="p-2">Type</th><th className="p-2 text-center">Status</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Cost/Unit</th><th className="p-2 text-right">Total</th></tr></thead>
                        <tbody>
                          {selectedProposal.detailedBudget.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                              <td className="p-2">{item.category}</td><td className="p-2">{item.sub_category}</td><td className="p-2">{item.type || '-'}</td>
                              <td className="p-2 text-center">
                                <span className={`font-medium px-1.5 py-0.5 rounded-full text-[10px] ${item.status === 'actual' ? 'bg-cyan-100 text-cyan-700' : 'bg-orange-100 text-orange-700'}`}>{item.status || 'N/A'}</span>
                              </td>
                              <td className="p-2 text-right">{item.quantity}</td><td className="p-2 text-right">{formatCurrency(item.cost)}</td><td className="p-2 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100"><tr><td colSpan={6} className="p-2 text-right">Total:</td><td className="p-2 text-right">{formatCurrency(selectedProposal.estimatedBudget)}</td></tr></tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
              {selectedProposal.sponsorshipDetailsRows && selectedProposal.sponsorshipDetailsRows.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center gap-1"><Award size={16} /> Sponsorship Details</h4>
                  {isClient && (
                    <div className="overflow-x-auto max-h-60 border rounded-md">
                      <table className={`table table-sm w-full text-xs ${isClient ? 'sticky-table' : ''}`}>
                        <thead className="bg-gray-100 z-10"><tr className='text-blue-500'><th className="p-2">Sponsor/Category</th><th className="p-2">Mode</th><th className="p-2 text-right">Amount</th><th className="p-2">Reward</th><th className="p-2">Benefit</th><th className="p-2">About</th></tr></thead>
                        <tbody>
                          {selectedProposal.sponsorshipDetailsRows.map((sponsor, index) => (
                            <tr key={sponsor.id || index} className="hover:bg-gray-50 border-b last:border-b-0 border-gray-200">
                              <td className="p-2">{sponsor.category}</td><td className="p-2">{sponsor.mode}</td><td className="p-2 text-right">{formatCurrency(sponsor.amount)}</td>
                              <td className="p-2">{sponsor.reward}</td><td className="p-2">{sponsor.benefit}</td><td className="p-2 max-w-[150px] truncate" title={sponsor.about}>{sponsor.about}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </section>

            {selectedProposal.messages && selectedProposal.messages.length > 0 && (
              <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
                <h3 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center gap-2"><MessageSquare size={18} /> Communication Log</h3>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedProposal.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((msg) => (
                    <div key={msg.id} className="p-3 border-l-4 border-indigo-300 rounded-r-md bg-white shadow-sm">
                      <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-1.5 mt-1.5">
                        <span>By: <span className="font-medium text-gray-700">{msg.user?.name || 'Unknown User'}</span> <span className="italic ml-1">({formatRole(msg.user?.role)})</span></span>
                        <span title={formatDateSafe(msg.created_at, 'PPpp')}>{formatDateSafe(msg.created_at, 'dd-MM-yy hh:mm a')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* File Upload Section - For convener */}
            {selectedProposal && currentUserRole === 'convener' && (
              <section className="border border-gray-200 rounded-lg p-4 bg-gray-50/80">
                <ProposalFileUpload proposalId={Number(selectedProposal.id)} />
              </section>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg sticky bottom-0 z-10">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap gap-2">
                  <button onClick={handleDownloadPdf} className="btn btn-ghost btn-sm text-red-600" disabled={isDownloading}>
                      {isDownloading ? <Loader2 className="animate-spin mr-1" size={16} /> : <FileDown size={16} className="mr-1" />} PDF
                  </button>
                  <button onClick={handleDownloadExcel} className="btn btn-ghost btn-sm text-green-600" disabled={isDownloading}>
                      {isDownloading ? <Loader2 className="animate-spin mr-1" size={16} /> : <FileDown size={16} className="mr-1" />} Excel
                  </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

const styles = `
  .sticky-table thead { position: sticky; top: 0; background: #f7fafc; z-index: 10; }
  .sticky-table tfoot { position: sticky; bottom: 0; background: #f7fafc; }
  .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
`;

if (typeof window !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Popup;