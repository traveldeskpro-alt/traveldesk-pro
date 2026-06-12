"use client";

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Plane, FileCheck, Hotel, Users } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from "date-fns";
import { enUS, arSA } from "date-fns/locale";

const events = [
  { date: new Date(2024, 5, 10), title: "Flight to London", type: "air_ticket", customer: "Ahmed Hassan", time: "14:00" },
  { date: new Date(2024, 5, 12), title: "Visa Appointment", type: "visa", customer: "Fatima Al-Balushi", time: "09:30" },
  { date: new Date(2024, 5, 15), title: "Check-in Grand Hyatt", type: "hotel", customer: "Khalid Al-Busaidi", time: "15:00" },
  { date: new Date(2024, 5, 20), title: "Europe Tour Departure", type: "group_tour", customer: "Mariam Al-Riyami", time: "08:00" },
  { date: new Date(2024, 5, 22), title: "Flight to Dubai", type: "air_ticket", customer: "Said Al-Maamari", time: "16:45" },
  { date: new Date(2024, 5, 25), title: "Schengen Interview", type: "visa", customer: "Nawal Al-Harthy", time: "11:00" },
];

const typeStyles = {
  air_ticket: { icon: Plane, color: "bg-blue-50 text-blue-700 border-blue-200" },
  visa: { icon: FileCheck, color: "bg-amber-50 text-amber-700 border-amber-200" },
  hotel: { icon: Hotel, color: "bg-purple-50 text-purple-700 border-purple-200" },
  group_tour: { icon: Users, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export default function CalendarPage() {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 5, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const locale = language === "ar" ? arSA : enUS;

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
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand hover:bg-deep-blue text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Event
          </button>
        </div>
      </div>

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
              <button onClick={() => setCurrentMonth(new Date(2024, 5, 1))} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">
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
              </div>
            )}
            {selectedEvents.map((e, i) => {
              const style = typeStyles[e.type as keyof typeof typeStyles] || typeStyles.air_ticket;
              const Icon = style.icon;
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.customer}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> {e.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Upcoming</h4>
            <div className="space-y-3">
              {events.filter((e) => e.date >= new Date(2024, 5, 10)).slice(0, 4).map((e, i) => {
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
