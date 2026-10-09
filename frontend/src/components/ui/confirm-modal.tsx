'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 border border-rose-500/30';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/20 border border-amber-500/30';
      case 'primary':
      default:
        return 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 border border-sky-500/30';
    }
  };

  const getIconStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30',
          icon: 'text-rose-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          icon: 'text-amber-400',
        };
      case 'primary':
      default:
        return {
          bg: 'bg-sky-500/10 border-sky-500/30',
          icon: 'text-sky-400',
        };
    }
  };

  const iconStyle = getIconStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3.5 sm:p-4 overflow-y-auto devflow-backdrop-enter">
      <div className="relative w-full max-w-md max-h-[88dvh] sm:max-h-[90vh] flex flex-col rounded-2xl bg-[#0b0f19] border border-slate-800 p-4 sm:p-6 text-white shadow-2xl z-10 devflow-modal-enter">
        {/* Close Button */}
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header with Icon */}
        <div className="overflow-y-auto pr-1 my-3">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl border ${iconStyle.bg} shrink-0`}>
              <AlertTriangle className={`size-5 ${iconStyle.icon}`} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white leading-tight">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-800/80 shrink-0 mt-3">
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800/60"
          >
            {cancelText}
          </Button>

          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`text-xs px-4 font-semibold gap-1.5 transition-all ${getVariantStyles()}`}
          >
            {loading && <Loader2 className="size-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
