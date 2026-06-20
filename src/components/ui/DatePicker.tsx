'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DayPicker, useDayPicker } from 'react-day-picker';
import type { CalendarMonth } from 'react-day-picker';
import { format, parse, isValid, addMonths, subMonths, addYears, subYears } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string;           // ISO yyyy-MM-dd
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

const ISO_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'MMM d, yyyy';

function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  const d = parse(value, ISO_FORMAT, new Date());
  return isValid(d) ? d : undefined;
}

// ─── Custom caption component — replaces native <select> dropdowns ─────────────
// Uses useDayPicker() hook (must be rendered inside DayPicker tree).
// Provides «‹ Month YYYY ›» navigation with no OS-controlled elements.

function CustomCaption({ calendarMonth }: { calendarMonth: CalendarMonth }) {
  const { goToMonth } = useDayPicker();
  const current = calendarMonth.date;

  const navBtn =
    'p-1.5 rounded-lg transition-colors text-slate-500 dark:text-slate-400 ' +
    'hover:bg-slate-100 dark:hover:bg-slate-800 ' +
    'disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

  return (
    <div className="flex items-center justify-between gap-1 mb-3 px-1">
      {/* Year-back + Month-back */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Previous year"
          className={navBtn}
          onClick={() => goToMonth(subYears(current, 1))}
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title="Previous month"
          className={navBtn}
          onClick={() => goToMonth(subMonths(current, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Month + Year label */}
      <span className="flex-1 text-center text-sm font-semibold text-slate-900 dark:text-white select-none">
        {format(current, 'MMMM yyyy')}
      </span>

      {/* Month-forward + Year-forward */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          title="Next month"
          className={navBtn}
          onClick={() => goToMonth(addMonths(current, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="Next year"
          className={navBtn}
          onClick={() => goToMonth(addYears(current, 1))}
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── DatePicker ────────────────────────────────────────────────────────────────

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  id,
  className = '',
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(() => parseIso(value) ?? new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = parseIso(value);

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  // Sync calendar to selected value
  useEffect(() => {
    const d = parseIso(value);
    if (d) setMonth(d);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className={[
          'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand',
          'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <CalendarDays className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <span className={selected
          ? 'text-slate-900 dark:text-white flex-1 truncate'
          : 'text-slate-400 dark:text-slate-500 flex-1'
        }>
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
        </span>
      </button>

      {/* Calendar popup — fully Tailwind-styled, zero native OS widgets */}
      {open && (
        <div
          className={[
            'absolute z-[300] mt-1 left-0',
            'bg-white dark:bg-slate-900',
            'border border-slate-200 dark:border-slate-700',
            'rounded-xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-900/60',
            'min-w-[280px]',
          ].join(' ')}
        >
          <DayPicker
            mode="single"
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, ISO_FORMAT));
                setOpen(false);
              }
            }}
            // No captionLayout="dropdown" — custom caption handles navigation
            classNames={{
              root: 'p-3 select-none',
              months: 'flex flex-col',
              month: '',
              // caption is rendered by custom MonthCaption component below
              month_caption: '',
              caption_label: 'hidden',
              nav: 'hidden', // custom caption handles all nav
              month_grid: 'w-full border-collapse mt-1',
              weekdays: 'flex',
              weekday: [
                'w-9 h-8 flex items-center justify-center',
                'text-[11px] font-semibold uppercase tracking-wide',
                'text-slate-400 dark:text-slate-600',
              ].join(' '),
              weeks: 'flex flex-col gap-0.5',
              week: 'flex',
              day: 'p-0',
              day_button: [
                'w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors',
                'text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
              ].join(' '),
              selected: [
                '[&>button]:!bg-brand [&>button]:!text-white',
                '[&>button]:font-semibold [&>button]:hover:!bg-brand/90',
              ].join(' '),
              today: [
                '[&>button]:font-bold',
                '[&>button]:ring-1 [&>button]:ring-brand',
                '[&>button]:text-brand dark:[&>button]:text-brand',
              ].join(' '),
              outside: '[&>button]:!text-slate-300 dark:[&>button]:!text-slate-700',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:pointer-events-none',
              hidden: 'invisible',
              chevron: 'fill-current',
            }}
            components={{
              // Replace the default caption with our fully custom, dark-mode-aware one
              MonthCaption: CustomCaption,
            }}
          />
        </div>
      )}
    </div>
  );
}
