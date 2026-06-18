"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useBookings, useCalendarEvents } from "@/hooks/useDataStore";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Plane, FileCheck, Hotel, Users, Plus, X, Save, Trash2, Bell, Briefcase } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { enUS, arSA } from "date-fns/locale";

const typeStyles = {
  air_ticket: { icon: Plane, color: "bg-blue-50 text-blue-700 border-blue-200" },
  visa: { icon: FileCheck, color: "bg-amber-50 text-amber-700 border-amber-200" },
  hotel: { icon: Hotel, color: "bg-purple-50 text-purple-700 border-purple-200" },
  group_tour: { icon: Users, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  insurance: { icon: CalendarDays, color: "bg-purple-50 text-purple-700 border-purple-200" },
  other_service: { icon: CalendarDays, color: "bg-pink-50 text-pink-700 border-pink-200" },
  meeting: { icon: Briefcase, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  deadline: { icon: Bell, color: "bg-red-50 text-red-700 border-red-200" },
  reminder: { icon: Bell, color: "bg-amber-50 text-amber-700 border-amber-200" },
  travel: { icon: Plane, color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  booking: { icon: CalendarDays, color: "bg-slate-50 text-slate-700 border-slate-200" },
};

type CalendarDisplayEvent = {
  id: string;
  date: Date;
  title: string;
  type: keyof typeof typeStyles;
  customer?: string | null;
  time: string;
  description?: string | null;
  manual: boolean;
};

function safeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CalendarPage() {
  const { t, language } = useLanguage();
  const { bookings, loading } = useBookings();
  const { events: calendarEvents, loading: eventsLoading, create: createEvent, remove: removeEvent } = useCalendarEvents();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: format(today, "yyyy-MM-dd"),
    time: "09:00",
    endTime: "",
    type: "meeting" as "meeting" | "deadline" | "reminder" | "travel",
    customer_name: "",
  });
  const locale = language === "ar" ? arSA : enUS;

  const events = useMemo(() => {
    const bookingEvents: CalendarDisplayEvent[] = bookings.flatMap((booking) => {
      const createdAt = safeDate(booking.created_at);
      const checkIn = safeDate(booking.check_in);
      const checkOut = safeDate(booking.check_out);
      const baseTitle = booking.details || booking.tour_name || booking.hotel_name || booking.type.replace("_", " ");
      const bookingEvents = [];

      if (createdAt) {
        bookingEvents.push({
          id: `booking-created-${booking.id}`,
          date: createdAt,
          title: baseTitle,
          type: booking.type,
          customer: booking.customer_name,
          time: format(createdAt, "HH:mm"),
          manual: false,
        });
      }
      if (checkIn) {
        bookingEvents.push({
          id: `booking-check-in-${booking.id}`,
          date: checkIn,
          title: booking.hotel_name ? `Check-in ${booking.hotel_name}` : "Check-in",
          type: "hotel" as const,
          customer: booking.customer_name,
          time: format(checkIn, "HH:mm"),
          manual: false,
        });
      }
      if (checkOut) {
        bookingEvents.push({
          id: `booking-check-out-${booking.id}`,
          date: checkOut,
          title: booking.hotel_name ? `Check-out ${booking.hotel_name}` : "Check-out",
          type: "hotel" as const,
          customer: booking.customer_name,
          time: format(checkOut, "HH:mm"),
          manual: false,
        });
      }

      return bookingEvents;
    });

    const manualEvents: CalendarDisplayEvent[] = calendarEvents
      .map((event) => {
        const date = safeDate(event.start_at);
        if (!date) return null;
        return {
          id: event.id,
          date,
          title: event.title,
          type: event.type,
          customer: event.customer_name,
          time: format(date, "HH:mm"),
          description: event.description,
          manual: true,
        };
      })
      .filter(Boolean) as CalendarDisplayEvent[];

    return [...manualEvents, ...bookingEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings, calendarEvents]);

  const openCreate = (date = selectedDate || today) => {
    setForm({
      title: "",
      description: "",
      date: format(date, "yyyy-MM-dd"),
      time: "09:00",
      endTime: "",
      type: "meeting",
      customer_name: "",
    });
    setSaveError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (!form.title.trim()) {
      setSaveError("Event title is required.");
      return;
    }
    const start = new Date(`${form.date}T${form.time || "00:00"}:00`);
    if (Number.isNaN(start.getTime())) {
      setSaveError("Event date and time are invalid.");
      return;
    }
    const end = form.endTime ? new Date(`${form.date}T${form.endTime}:00`) : null;
    if (end && end < start) {
      setSaveError("End time cannot be before start time.");
      return;
    }

    setSaving(true);
    try {
      await createEvent({
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_at: start.toISOString(),
        end_at: end ? end.toISOString() : null,
        type: form.type,
        customer_name: form.customer_name.trim() || null,
      });
      setSelectedDate(start);
      setCurrentMonth(start);
      setShowModal(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save calendar event.");
    } finally {
      setSaving(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);

  const selectedEvents = selectedDate
    ? events.filter((e) => isSameDay(e.date, selectedDate))
    : [];

  const weekDays = language === "ar"
    ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("calendar")}</h1>
          <p className="text-slate-500 text-sm mt-1">Schedule and upcoming events</p>
        </div>
        <button onClick={() => openCreate()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-deep-blue">
          <Plus className="h-4 w-4" />
          Create Event
        </button>
      </div>

      {!loading && !eventsLoading && events.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No calendar events yet. Create an event or add bookings to populate this calendar with tenant data.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-brand" />
              {format(currentMonth, "MMMM yyyy", { locale })}
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
                Today
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-lg bg-slate-50/50" />
            ))}
            {days.map((day) => {
              const dayEvents = events.filter((e) => isSameDay(e.date, day));
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  onDoubleClick={() => openCreate(day)}
                  className={`h-24 rounded-lg border p-1.5 text-left transition-all flex flex-col gap-1 ${
                    isSelected
                      ? "border-brand ring-1 ring-brand bg-brand/5"
                      : "border-slate-100 hover:border-slate-200 bg-white"
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isSelected ? "bg-brand text-white" : "text-slate-700"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((e, i) => {
                      const style = typeStyles[e.type as keyof typeof typeStyles] || typeStyles.air_ticket;
                      return (
                        <div key={i} className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium ${style.color}`}>
                          {e.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-navy mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMM d", { locale }) : "Select a date"}
          </h3>
          <div className="space-y-3">
            {selectedEvents.length === 0 && (
              <div className="text-sm text-slate-500 py-8 text-center">
                No events for this date
                <button onClick={() => openCreate(selectedDate || today)} className="mt-3 block w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-brand hover:bg-slate-50">
                  Create event
                </button>
              </div>
            )}
            {selectedEvents.map((e) => {
              const style = typeStyles[e.type as keyof typeof typeStyles] || typeStyles.air_ticket;
              const Icon = style.icon;
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.customer}</p>
                    {e.description && <p className="mt-1 text-xs text-slate-500">{e.description}</p>}
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> {e.time}
                    </div>
                  </div>
                  {e.manual && (
                    <button onClick={() => removeEvent(e.id)} title="Delete event" className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upcoming</h4>
            <div className="space-y-3">
              {events.filter((e) => e.date >= today).slice(0, 4).map((e, i) => {
                const style = typeStyles[e.type as keyof typeof typeStyles] || typeStyles.air_ticket;
                const Icon = style.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{e.title}</p>
                      <p className="text-xs text-slate-500">{format(e.date, "MMM d")} · {e.time}</p>
                    </div>
                  </div>
                );
              })}
              {events.filter((e) => e.date >= today).length === 0 && (
                <div className="text-sm text-slate-500 py-4">No upcoming events.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy">Create Calendar Event</h2>
                <p className="text-xs text-slate-500">Events are saved to this agency calendar.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
                <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Supplier payment follow-up" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Start</label>
                  <input type="time" value={form.time} onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">End</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((prev) => ({ ...prev, endTime: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
                  <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as typeof form.type }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                    <option value="reminder">Reminder</option>
                    <option value="travel">Travel</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
                  <input value={form.customer_name} onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" placeholder="Optional notes" />
              </div>
              {saveError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{saveError}</div>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-deep-blue disabled:cursor-not-allowed disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
