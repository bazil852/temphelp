import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { useContentStore } from '../store/contentStore';

interface BulkCreateModalProps {
  influencerId: string;
  templateId: string;
  onClose: () => void;
}

interface CSVRow {
  Title: string;
  Script: string;
}

export default function BulkCreateModal({ influencerId, templateId, onClose }: BulkCreateModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { generateVideo } = useContentStore();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const data = results.data as CSVRow[];
        
        if (!data.every(row => row.Title && row.Script)) {
          setError('CSV must contain "Title" and "Script" columns');
          setIsUploading(false);
          return;
        }

        try {
          for (const row of data) {
            await generateVideo({
              influencerId,
              templateId,
              title: row.Title,
              script: row.Script
            });
          }
          onClose();
        } catch (err: any) {
          setError(err.message || 'Failed to create videos');
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setError('Failed to parse CSV file: ' + error.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Create Videos
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Upload a CSV file with "Title" and "Script" columns to create multiple videos at once.
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span>Upload CSV</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}