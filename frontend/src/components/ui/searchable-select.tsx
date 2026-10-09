'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Loader2, AlertCircle } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  group?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  loading = false,
  error,
  emptyMessage = 'No matching options found',
  className = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opt.group && opt.group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group options if groups exist
  const groupedOptions = filteredOptions.reduce<Record<string, SelectOption[]>>((acc, opt) => {
    const groupName = opt.group || 'General';
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(opt);
    return acc;
  }, {});

  const hasGroups = options.some((opt) => opt.group);

  const renderOptionContent = (opt: SelectOption) => {
    const isSelected = opt.value === value;
    return (
      <button
        key={opt.value}
        type="button"
        onClick={() => {
          onChange(opt.value);
          setIsOpen(false);
        }}
        className={`w-full px-2.5 py-2 rounded-lg text-left flex items-start justify-between gap-2 transition-colors ${
          isSelected
            ? 'bg-sky-500/10 text-sky-300 font-semibold border border-sky-500/20'
            : 'text-slate-300 hover:bg-[#060913] hover:text-white'
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="truncate font-medium text-xs">{opt.label}</span>
            {opt.badge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                {opt.badge}
              </span>
            )}
          </div>
          {opt.subLabel && (
            <div className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
              {opt.subLabel}
            </div>
          )}
        </div>
        {isSelected && <Check className="size-3.5 text-sky-400 shrink-0 mt-0.5" />}
      </button>
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
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
        <div className="truncate flex-1 min-w-0">
          {loading ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 className="size-3.5 animate-spin text-sky-400 shrink-0" />
              <span>Loading options...</span>
            </span>
          ) : selectedOption ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="truncate font-medium text-white">{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                  {selectedOption.badge}
                </span>
              )}
            </div>
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
                placeholder="Search..."
                className="w-full h-8 pl-8 pr-3 text-xs bg-[#060913] border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="size-4 animate-spin text-sky-400" />
                <span>Loading options...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-slate-500 italic text-[11px]">
                {emptyMessage}
              </div>
            ) : hasGroups ? (
              Object.entries(groupedOptions).map(([groupName, groupOpts]) => (
                <div key={groupName} className="space-y-1">
                  <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                    {groupName}
                  </div>
                  {groupOpts.map(renderOptionContent)}
                </div>
              ))
            ) : (
              filteredOptions.map(renderOptionContent)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
