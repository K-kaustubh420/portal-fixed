
"use client";

import { useState, useEffect } from 'react';

interface UploadedFile {
  id: number;
  category: string;
  filename: string;
  original_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

interface FileUploadProps {
  proposalId: number;
}

const categories = [
  { id: 'photos', label: 'Event Photos', icon: '📷' },
  { id: 'proofs', label: 'Payment Proofs', icon: '💳' },
  { id: 'attendance', label: 'Attendance Records', icon: '📋' },
  { id: 'brochure', label: 'Event Brochure', icon: '📄' },
  { id: 'reports', label: 'Reports', icon: '📊' },
];

export default function ProposalFileUpload({ proposalId }: FileUploadProps) {
  const [files, setFiles] = useState<Record<string, UploadedFile[]>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('faculty');

 useEffect(() => {
    // Get user role from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || 'faculty');
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (userRole) {
      fetchFiles();
    }
  }, [proposalId, userRole]);

  const getApiPath = () => {
    return userRole === 'hod' ? '/api/hod' : '/api/faculty';
  };

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('authToken'); // CORRECT KEY!
      const apiPath = getApiPath();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${apiPath}/proposals/${proposalId}/files`,
        {
          headers: {
            'Authorization': `Bearer ${token}`, // USE BEARER TOKEN!
            'Accept': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const grouped = data.reduce((acc: any, file: UploadedFile) => {
          if (!acc[file.category]) acc[file.category] = [];
          acc[file.category].push(file);
          return acc;
        }, {});
        setFiles(grouped);
      }
    } catch (err) {
      console.error('Failed to fetch files:', err);
    }
  };

  const handleFileUpload = async (category: string, file: File) => {
    setUploading(category);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000';
    const apiPath = getApiPath();
    const token = localStorage.getItem('authToken'); // CORRECT KEY!

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch(
        `${API_BASE_URL}${apiPath}/proposals/${proposalId}/files`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${token}`, // USE BEARER TOKEN!
          },
        }
      );

      if (response.ok) {
        await fetchFiles();
      } else {
        const data = await response.json();
        setError(data.message || 'Upload failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upload Files</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.label}
            </h3>

            <label className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-blue-500 hover:bg-blue-50 ${uploading === category.id ? 'opacity-50 cursor-wait' : ''}`}>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(category.id, file);
                }}
                disabled={uploading === category.id}
              />
              <div className="text-gray-600">
                {uploading === category.id ? (
                  <span className="text-blue-600">Uploading...</span>
                ) : (
                  <>
                    <div className="text-3xl mb-2">⬆️</div>
                    <div>Click to upload</div>
                    <div className="text-sm text-gray-400 mt-1">Max 10MB</div>
                  </>
                )}
              </div>
            </label>

            {files[category.id] && files[category.id].length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                {files[category.id].map((file) => (
                  <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.original_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}