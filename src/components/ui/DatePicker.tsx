'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string;
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

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

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
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-left focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <CalendarDays className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
        <span className={selected ? 'text-slate-900 dark:text-white flex-1' : 'text-slate-400 dark:text-slate-500 flex-1'}>
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-[200] mt-1 left-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl">
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
            captionLayout="dropdown"
            startMonth={new Date(2015, 0)}
            endMonth={new Date(2040, 11)}
            classNames={{
              root: 'p-3 select-none',
              months: 'flex flex-col gap-4',
              month: '',
              month_caption: 'flex items-center justify-between mb-3 gap-2',
              caption_label: 'hidden',
              dropdowns: 'flex items-center gap-1.5',
              dropdown_root: 'relative inline-flex',
              dropdown: 'text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer appearance-none pr-1',
              months_dropdown: 'text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer appearance-none',
              years_dropdown: 'text-sm font-semibold text-slate-900 dark:text-white bg-transparent border-none focus:outline-none cursor-pointer appearance-none',
              nav: 'flex items-center gap-0.5',
              button_previous: 'p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors focus:outline-none',
              button_next: 'p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors focus:outline-none',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex mb-1',
              weekday: 'w-9 h-7 flex items-center justify-center text-[11px] font-semibold text-slate-400 dark:text-slate-600 uppercase',
              weeks: 'flex flex-col gap-0.5',
              week: 'flex',
              day: 'p-0',
              day_button: [
                'w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors',
                'text-slate-700 dark:text-slate-300',
                'hover:bg-slate-100 dark:hover:bg-slate-800',
                'focus:outline-none focus:ring-2 focus:ring-brand/30',
              ].join(' '),
              selected: '[&>button]:!bg-brand [&>button]:!text-white [&>button]:font-semibold [&>button]:hover:!bg-brand/90',
              today: '[&>button]:font-bold [&>button]:ring-1 [&>button]:ring-brand [&>button]:text-brand dark:[&>button]:text-brand',
              outside: '[&>button]:!text-slate-300 dark:[&>button]:!text-slate-700',
              disabled: '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:pointer-events-none',
              hidden: 'invisible',
              chevron: 'fill-current',
            }}
            components={{
              Chevron: ({ orientation }: { orientation?: string }) =>
                orientation === 'left'
                  ? <ChevronLeft className="w-4 h-4" />
                  : <ChevronRight className="w-4 h-4" />,
            }}
          />
        </div>
      )}
    </div>
  );
}
