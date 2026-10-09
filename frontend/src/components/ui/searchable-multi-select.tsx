'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X, Loader2, AlertCircle, Users } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  avatar?: string;
  group?: string;
}

interface SearchableMultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

export function SearchableMultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select participants...',
  disabled = false,
  loading = false,
  error,
  emptyMessage = 'No participants found',
  className = '',
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== val));
  };

  const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Selected Pills */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/25 text-xs font-medium animate-fadeIn"
            >
              {opt.avatar && (
                <img
                  src={opt.avatar}
                  alt={opt.label}
                  className="size-4 rounded-full object-cover shrink-0"
                />
              )}
              <span className="truncate max-w-[140px]">{opt.label}</span>
              {opt.badge && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold uppercase">
                  {opt.badge}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => removeValue(opt.value, e)}
                disabled={disabled}
                className="text-sky-400 hover:text-white hover:bg-sky-500/20 rounded p-0.5 transition-colors"
                title={`Remove ${opt.label}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        className={`w-full min-h-9 px-3 py-1.5 text-xs bg-[#060913] border rounded-lg text-left flex items-center justify-between transition-colors gap-2 ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-800 text-slate-500'
            : error
            ? 'border-rose-500/60 text-slate-200'
            : isOpen
            ? 'border-sky-500 text-white ring-1 ring-sky-500/20'
            : 'border-slate-800 text-slate-200 hover:border-slate-700'
        }`}
      >
        <div className="truncate flex-1 flex items-center gap-2">
          <Users className="size-3.5 text-slate-400 shrink-0" />
          {loading ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 className="size-3.5 animate-spin text-sky-400 shrink-0" />
              <span>Loading participants...</span>
            </span>
          ) : selectedValues.length > 0 ? (
            <span className="text-slate-300 font-medium">
              {selectedValues.length} participant{selectedValues.length > 1 ? 's' : ''} selected
            </span>
          ) : (
            <span className="text-slate-500 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`size-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-sky-400' : ''
          }`}
        />
      </button>

      {error && (
        <div className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-[#0b0f19] border border-slate-800 shadow-2xl overflow-hidden animate-fadeIn text-xs">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-800/80 bg-[#060913]/60">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search participants by name, role, email..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="size-4 animate-spin text-sky-400" />
                <span>Loading participants...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 italic text-[11px]">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                        : 'text-slate-300 hover:bg-[#060913] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.avatar ? (
                        <img
                          src={opt.avatar}
                          alt={opt.label}
                          className="size-6 rounded-full object-cover shrink-0 border border-slate-700"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {opt.label.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-xs text-white truncate">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subLabel && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      className={`size-4 rounded border flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? 'bg-sky-500 border-sky-500 text-white'
                          : 'border-slate-700 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="size-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
