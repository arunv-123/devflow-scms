'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAvatarUrl } from '@/lib/avatar';

interface ClientImageUploaderProps {
  avatar?: string | null;
  clientSeed?: { id?: string; name?: string; email?: string } | string | null;
  onChange: (newAvatar: string) => void;
  canEdit?: boolean;
  className?: string;
}

export function ClientImageUploader({
  avatar,
  clientSeed,
  onChange,
  canEdit = true,
  className = '',
}: ClientImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasCustomAvatar = Boolean(avatar && avatar.trim() !== '');
  const displayAvatarUrl = getAvatarUrl(avatar, clientSeed);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Format validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setErrorMessage('Please upload a JPG, JPEG, PNG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Size validation (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Client logo size must be under 5MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setUploading(false);
      if (base64) {
        onChange(base64);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setUploading(false);
      setErrorMessage('Failed to read image file.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setErrorMessage(null);
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-slate-400 text-xs font-semibold">Client / Company Logo</label>
      <div className="flex items-center gap-4 p-3 rounded-xl bg-[#060913] border border-slate-800">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
        />

        <div className="relative group shrink-0">
          <img
            src={displayAvatarUrl}
            alt="Client Logo"
            className="size-14 rounded-xl object-cover ring-2 ring-sky-500/30"
          />
          {uploading && (
            <div className="absolute inset-0 rounded-xl bg-black/60 backdrop-blur-xs flex items-center justify-center">
              <Loader2 className="size-5 text-sky-400 animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">Logo Image</span>
            {hasCustomAvatar ? (
              <span className="text-[9px] px-2 py-0.2 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Custom Logo
              </span>
            ) : (
              <span className="text-[9px] px-2 py-0.2 rounded font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Default Placeholder
              </span>
            )}
          </div>

          {canEdit ? (
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-[11px] gap-1"
              >
                <Camera className="size-3 text-sky-400" />
                <span>{hasCustomAvatar ? 'Change Logo' : 'Upload Logo'}</span>
              </Button>

              {hasCustomAvatar && (
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  disabled={uploading}
                  onClick={handleRemove}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-[11px] gap-1"
                >
                  <Trash2 className="size-3" />
                  <span>Remove</span>
                </Button>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-500">Only authorized account managers can modify client logos.</p>
          )}

          {errorMessage && (
            <p className="text-[10px] text-rose-400 font-medium">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
