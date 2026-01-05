import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Trash2, LinkIcon } from 'lucide-react';

interface PdfGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: PdfOptions) => void;
}

export interface PdfOptions {
  driveLink: string;
  attendanceProof: boolean;
  photos: string[];
  includeLink: boolean;
}

const PdfGeneratorModal: React.FC<PdfGeneratorModalProps> = ({
  isOpen,
  onClose,
  onGenerate
}) => {
  // State management
  const [driveLink, setDriveLink] = useState('');
  const [attendanceProof, setAttendanceProof] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [includeLink, setIncludeLink] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDriveLink('');
      setAttendanceProof(false);
      setPhotos([]);
      setIncludeLink(false);
    }
  }, [isOpen]);

  // Handle file upload
  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and drop handlers
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
    handleFileChange(e.dataTransfer.files);
  };

  // Generate PDF
  const handleGenerate = () => {
    onGenerate({
      driveLink,
      attendanceProof,
      photos,
      includeLink
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Generate PDF Report
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          
          {/* Drive Link Input */}
          <div>
            <label 
              htmlFor="driveLink" 
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Google Drive Link
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="url"
                id="driveLink"
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Include in PDF:
            </h4>
            <div className="space-y-3 rounded-md border border-gray-200 p-4 bg-gray-50">
              
              {/* Attendance Proof */}
              <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={attendanceProof}
                  onChange={(e) => setAttendanceProof(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 font-medium">
                  Attendance Proof
                </span>
              </label>

              {/* Photos Checkbox */}
              <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={photos.length > 0}
                  disabled
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-sm text-gray-700 font-medium">
                  Photos ({photos.length} attached)
                </span>
              </label>

              {/* Include Link */}
              <label className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                <input
                  type="checkbox"
                  checked={includeLink}
                  onChange={(e) => setIncludeLink(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 font-medium">
                  Include Drive Link in PDF
                </span>
              </label>

            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Attach Photos (Optional)
            </h4>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Drag & drop images here
              </p>
              <p className="text-xs text-gray-500 mt-1">or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Browse Files
              </button>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files)}
              />
            </div>
          </div>

          {/* Photo Previews */}
          {photos.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3">
                Attached Photos ({photos.length}):
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo, index) => (
                  <div 
                    key={index} 
                    className="relative group border rounded-md overflow-hidden"
                  >
                    <img
                      src={photo}
                      alt={`preview ${index + 1}`}
                      className="h-28 w-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfGeneratorModal;