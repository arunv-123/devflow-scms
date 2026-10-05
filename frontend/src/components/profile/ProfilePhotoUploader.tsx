'use client';

import React, { useRef, useState } from 'react';
import { Camera, Trash2, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { usersApi } from '@/services/usersApi';
import { getAvatarUrl } from '@/lib/avatar';

interface ProfilePhotoUploaderProps {
  onPhotoUpdated?: (newAvatar: string) => void;
}

export function ProfilePhotoUploader({ onPhotoUpdated }: ProfilePhotoUploaderProps) {
  const { user, refreshUser } = useAuth();
  const { addToast } = useNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Check if user currently has a custom uploaded avatar (not empty/null)
  const hasCustomAvatar = Boolean(user?.avatar && user.avatar.trim() !== '');
  const displayAvatarUrl = getAvatarUrl(user?.avatar, user);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Format validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '');

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      addToast({
        type: 'error',
        title: 'Invalid Image Format',
        message: 'Please upload a JPG, JPEG, PNG, or WebP image file.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 2. File size validation (5MB max)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Profile photo size must be less than 5MB.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    try {
      // Read file as Base64 Data URL
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        if (!base64Url || !user?.id) {
          setUploading(false);
          return;
        }

        try {
          // Persist via backend API
          await usersApi.updateUser(user.id, { avatar: base64Url });
          
          // Save client fallback in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`devflow_user_avatar_${user.id}`, base64Url);
          }

          // Refresh context state
          await refreshUser();

          if (onPhotoUpdated) onPhotoUpdated(base64Url);

          addToast({
            type: 'success',
            title: 'Profile Photo Updated',
            message: 'Your new profile photo is active across DevFlow.',
          });
        } catch (error: any) {
          console.error('Failed to update profile photo:', error);
          addToast({
            type: 'error',
            title: 'Upload Failed',
            message: error.response?.data?.error || 'Failed to save profile photo. Please try again.',
          });
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };

      reader.onerror = () => {
        setUploading(false);
        addToast({
          type: 'error',
          title: 'Read Error',
          message: 'Could not process the selected image file.',
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      console.error('File reading error:', err);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    setUploading(true);

    try {
      // Set avatar to empty string in DB
      await usersApi.updateUser(user.id, { avatar: '' });

      // Clear local storage fallback
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`devflow_user_avatar_${user.id}`);
      }

      await refreshUser();

      if (onPhotoUpdated) onPhotoUpdated('');

      addToast({
        type: 'info',
        title: 'Profile Photo Removed',
        message: 'Returned to default placeholder avatar.',
      });
    } catch (error: any) {
      console.error('Failed to remove profile photo:', error);
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: error.response?.data?.error || 'Failed to remove profile photo.',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl bg-[#060913] border border-slate-800">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
      />

      {/* Avatar Display */}
      <div className="relative group">
        <img
          src={displayAvatarUrl}
          alt={user?.name || 'Profile Avatar'}
          className="size-20 rounded-2xl object-cover ring-2 ring-sky-500/40 shadow-lg transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {uploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <Loader2 className="size-6 text-sky-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Controls & Description */}
      <div className="space-y-2 flex-1">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white">Profile Photo</h4>
            {hasCustomAvatar ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Custom Upload
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                Placeholder Avatar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload a high-resolution JPG, PNG, or WebP image under 5MB.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="bg-sky-600 hover:bg-sky-500 text-white text-xs gap-1.5 shadow-sm shadow-sky-600/20"
          >
            {uploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Camera className="size-3.5" />
                <span>{hasCustomAvatar ? 'Change Photo' : 'Upload Photo'}</span>
              </>
            )}
          </Button>

          {hasCustomAvatar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={handleRemovePhoto}
              className="border-slate-700 hover:bg-slate-800/80 text-rose-400 hover:text-rose-300 text-xs gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Remove Photo</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
