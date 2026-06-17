"use client";

import { FormEvent } from "react";
import { ArrowRight } from "lucide-react";

const WHATSAPP_NUMBER = "96875135022";

export default function DemoRequestForm() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    const message = encodeURIComponent(
      `Hello TravelDesk Pro, I want to request a demo.\nName: ${name}\nEmail: ${email}\nPhone: ${phone}`
    );

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-300">Request demo</p>
        <h3 className="mt-2 text-2xl font-black text-white">Get information about TravelDesk Pro</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Share your details and the demo request opens directly in WhatsApp.
        </p>
      </div>

      <div className="space-y-3">
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
          placeholder="Name"
        />
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
          placeholder="Email"
        />
        <input
          name="phone"
          required
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white outline-none placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-400/20"
          placeholder="Phone number"
        />
      </div>

      <button
        type="submit"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
      >
        Send via WhatsApp
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
