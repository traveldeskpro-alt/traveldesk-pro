'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = '',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = search.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setOpen((prev) => !prev);
      setSearch('');
    }
  }, [disabled]);

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      onChange(option.value);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange('');
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span className={selected ? 'text-[#0F172A] truncate' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0 ml-2">
          {value && (
            <span
              role="button"
              aria-label="Clear"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
          </div>
          <div ref={listRef} className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">No results</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    option.value === value
                      ? 'bg-brand/10 text-brand font-medium'
                      : 'text-[#0F172A] hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
