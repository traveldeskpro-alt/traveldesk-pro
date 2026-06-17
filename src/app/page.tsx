import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Check,
  FileText,
  Globe2,
  Plane,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Customer CRM",
    description: "Keep passport details, contact history, preferences, and travel documents organized in one secure profile.",
  },
  {
    icon: Ticket,
    title: "Booking operations",
    description: "Track flights, hotels, visas, tours, costs, sale price, and booking status without scattered spreadsheets.",
  },
  {
    icon: FileText,
    title: "Professional invoices",
    description: "Create branded invoices, monitor pending payments, and share clean customer-ready documents.",
  },
  {
    icon: BarChart3,
    title: "Reports and profit visibility",
    description: "Understand revenue, cost, profit, pending payments, and agency performance from a command center.",
  },
  {
    icon: CalendarCheck,
    title: "Calendar workflow",
    description: "Stay ahead of departures, due dates, follow-ups, visa timelines, and important agency tasks.",
  },
  {
    icon: Globe2,
    title: "Arabic and English",
    description: "Serve local teams with bilingual support designed for travel agencies in Oman.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "30 OMR",
    description: "For small agencies getting organized.",
    features: ["Core CRM", "Bookings", "Invoices", "Basic reports"],
  },
  {
    name: "Professional",
    price: "40 OMR",
    description: "For growing agencies that need control.",
    featured: true,
    features: ["Everything in Starter", "Agents and commissions", "Advanced reports", "Arabic + English workspace"],
  },
  {
    name: "Enterprise",
    price: "150 OMR",
    description: "For larger teams with advanced needs.",
    features: ["Multi-branch setup", "Priority support", "Custom onboarding", "Admin controls"],
  },
];

const faqs = [
  {
    question: "Is TravelDesk Pro built for Oman?",
    answer: "Yes. The product is positioned for Omani travel agencies with OMR pricing, Arabic support, and agency workflows.",
  },
  {
    question: "Can I try it before signing up?",
    answer: "Yes. The interactive demo lets you explore the workspace without touching production data.",
  },
  {
    question: "Does it replace spreadsheets?",
    answer: "Yes. Customers, bookings, invoices, agents, and reports can live in one cloud workspace instead of separate files.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F8FAFC] text-slate-950">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(249,115,22,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f8fafc_70%)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="TravelDesk Pro home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <img src="/images/icon traveldesk.png" alt="" className="h-7 w-7 object-contain" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-950">
              TravelDesk<span className="text-[#F97316]">Pro</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#pricing" className="hover:text-slate-950">Pricing</a>
            <a href="#faq" className="hover:text-slate-950">FAQ</a>
            <Link href="/login" className="hover:text-slate-950">Login</Link>
          </nav>

          <Link
            href="/demo"
            className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 sm:inline-flex"
          >
            Try Interactive Demo
          </Link>
        </header>

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              The modern operating system for travel agencies in Oman
            </div>
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl lg:text-7xl">
              The all-in-one platform for modern travel agencies
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Manage customers, bookings, invoices, agents, and reports from one secure cloud workspace built for travel agencies in Oman.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2563EB] px-6 py-4 text-base font-bold text-white shadow-2xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
              >
                Try Interactive Demo
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-slate-500">
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> No credit card required</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Interactive demo</span>
              <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Built for Oman</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-orange-500/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/80 bg-white/90 p-3 shadow-2xl shadow-slate-900/12 backdrop-blur">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-4 text-white">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">Command Center</p>
                    <p className="mt-1 text-lg font-bold">Muscat Travel Agency</p>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">Live</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Revenue", "12,480 OMR"],
                    ["Bookings", "186"],
                    ["Pending", "2,140 OMR"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-2 text-lg font-extrabold">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold">Today&apos;s workflow</p>
                    <Plane className="h-4 w-4 text-blue-300" />
                  </div>
                  {[
                    ["Visa follow-up", "Al Khuwair family", "Due today"],
                    ["Invoice sent", "Salalah group tour", "Pending"],
                    ["Flight booking", "Dubai business trip", "Confirmed"],
                  ].map(([title, customer, status]) => (
                    <div key={title} className="flex items-center justify-between border-t border-white/10 py-3 first:border-t-0 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-slate-400">{customer}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-200">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2563EB]">Features</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Everything your agency needs to operate with confidence.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            TravelDesk Pro brings daily operations, accounting visibility, and team workflows into one modern SaaS workspace.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-950">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.85fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-orange-300">Why agencies choose it</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Built for real travel agency workflows.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["One workspace", "Replace disconnected files with a shared cloud system."],
              ["Secure operations", "Keep agency data protected behind authenticated workspaces."],
              ["Faster invoicing", "Create, track, and share customer-ready invoices quickly."],
              ["Better decisions", "See profit, pending payments, and team performance clearly."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
                <ShieldCheck className="mb-4 h-5 w-5 text-blue-300" />
                <h3 className="font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#2563EB]">Pricing</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Simple plans for growing agencies.</h2>
          <p className="mt-4 text-lg text-slate-600">Start small, then upgrade as your team and booking volume grow.</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pricing.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-[2rem] border p-7 shadow-sm ${
                plan.featured
                  ? "border-[#2563EB] bg-slate-950 text-white shadow-2xl shadow-blue-600/20"
                  : "border-slate-200 bg-white text-slate-950"
              }`}
            >
              {plan.featured && (
                <div className="absolute right-6 top-6 rounded-full bg-[#F97316] px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                  Recommended
                </div>
              )}
              <h3 className="text-xl font-extrabold">{plan.name}</h3>
              <p className={`mt-2 text-sm ${plan.featured ? "text-slate-300" : "text-slate-600"}`}>{plan.description}</p>
              <p className="mt-6 text-4xl font-black">
                {plan.price}
                <span className={`text-sm font-semibold ${plan.featured ? "text-slate-400" : "text-slate-500"}`}> / month</span>
              </p>
              <ul className="mt-7 space-y-3">
                {plan.features.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={`mt-0.5 h-4 w-4 ${plan.featured ? "text-emerald-300" : "text-emerald-500"}`} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
                  plan.featured
                    ? "bg-white text-slate-950 hover:bg-slate-100"
                    : "bg-[#2563EB] text-white hover:bg-blue-700"
                }`}
              >
                Start Free Trial
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-5 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-950">FAQ</h2>
          <div className="mt-6 divide-y divide-slate-200">
            {faqs.map((faq) => (
              <div key={faq.question} className="py-5">
                <h3 className="font-extrabold text-slate-950">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#2563EB] px-6 py-10 text-center text-white shadow-2xl shadow-blue-600/20">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Ready to modernize your travel agency?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-blue-100">Launch a secure cloud workspace for bookings, customers, invoices, agents, and reports.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-blue-50">
              Start Free Trial
            </Link>
            <Link href="/demo" className="rounded-2xl border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
              Try Interactive Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
