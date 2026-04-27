'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { apiClient } from '@/lib/axios';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  previewClass?: string;
  folder?: string;
}

export function ImageUpload({ value, onChange, label, hint, previewClass = 'h-32 w-32 rounded-xl', folder = 'crackncode' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxhezbur2';

    // Try signed upload first (admin), fallback to unsigned
    let signedParams: { mode: string; signature?: string; timestamp?: number; apiKey?: string } | null = null;
    try {
      const { data } = await apiClient.post('/upload', { folder });
      if (data.mode === 'signed') signedParams = data;
    } catch {
      // Not admin or no secret configured — use unsigned
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    if (signedParams?.signature) {
      formData.append('signature', signedParams.signature);
      formData.append('timestamp', String(signedParams.timestamp));
      formData.append('api_key', signedParams.apiKey || '');
    } else {
      formData.append('upload_preset', 'crackncode_unsigned');
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          onChange(data.secure_url);
        } catch {
          setError('Failed to parse upload response.');
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          setError(err?.error?.message || `Upload failed (${xhr.status})`);
        } catch {
          setError(`Upload failed (${xhr.status})`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error. Check your connection.');
    };

    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleUpload(file);
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}

      {value ? (
        <div className="relative inline-block group">
          <img src={value} alt="Preview" className={`${previewClass} object-cover border border-gray-200`} />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 shadow-md"
              title="Replace"
            >
              <Upload className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-white rounded-full text-red-500 hover:bg-red-50 shadow-md"
              title="Remove"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
            uploading ? 'border-primary/40 bg-primary/5' : 'border-gray-200 cursor-pointer hover:border-primary/40 hover:bg-primary/5'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-gray-600">Uploading... {progress}%</p>
              <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">Click or drag image to upload</p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
