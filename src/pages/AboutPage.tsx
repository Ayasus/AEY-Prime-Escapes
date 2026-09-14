import React from "react";
import { Logo } from "./common";

type Page = "buy" | "new-developments" | "agents" | "about" | "pdp" | "my-reservations";

export default function AboutPage({ setPage }: { setPage: (p: Page) => void }) {
  const milestones = [
    { year: "2008", label: "Founded in Makati with a team of 3 licensed brokers." },
    { year: "2012", label: "Expanded to Laguna and Cavite, becoming the leading south-corridor broker." },
    { year: "2016", label: "Launched AEY Prime digital listings — first PH real estate firm to go paperless." },
    { year: "2020", label: "Completed ₱2.8B in transactions despite market disruptions." },
    { year: "2024", label: "Opened satellite offices in Cebu and Clark for national coverage." },
    { year: "2025", label: "Introduced AEY Prime Escapes: a curated high-value property platform." },
  ];
  const values = [
    { title: "Trust & Transparency", body: "Every listing is verified. Every fee is disclosed upfront. No hidden charges, no bait-and-switch." },
    { title: "Client-First Mindset", body: "We measure success by your satisfaction — not commission volume. Our agents earn through repeat referrals, not pressure tactics." },
    { title: "Market Expertise", body: "From BGC condos to Tagaytay lots, our agents hold deep, hyperlocal knowledge earned through years of on-the-ground experience." },
    { title: "Speed & Efficiency", body: "Same-day viewing schedules, 24-hour inquiry turnaround, and digital reservation processing from anywhere in the world." },
  ];

  return (
    <div className="min-h-screen bg-offwhite">
      <section className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=700&fit=crop&auto=format" alt="About AEY Prime" className="w-full h-full object-cover opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/80 to-navy" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <Logo size="lg" />
          <h1 className="text-4xl md:text-5xl font-bold text-white mt-8 mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Built on <em>17 Years</em><br />of Philippine Real Estate
          </h1>
          <p className="text-white/60 text-base leading-relaxed">AEY Prime Escapes is a full-service real estate brokerage helping Filipinos and global investors find, reserve, and acquire properties across the Philippines — with integrity, clarity, and care.</p>
        </div>
      </section>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
          {[ ["₱18B+", "In Transactions"], ["1,284", "Active Listings"], ["3,200+", "Families Served"], ["17", "Years in Business"] ].map(([val, label]) => (
            <div key={label} className="text-center px-6 py-2">
              <p className="text-3xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{val}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <section className="py-16 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald">Our Mission</span>
            <h2 className="text-3xl font-bold text-navy mt-3 mb-4 leading-snug" style={{ fontFamily: "var(--font-display)" }}>
              Making Real Estate<br />Accessible & Trustworthy
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">We believe that finding your home — whether it's your first condo, a vacation lot, or a corporate HQ — should never feel overwhelming, opaque, or predatory.</p>
            <p className="text-slate-600 text-sm leading-relaxed">AEY Prime Escapes exists to simplify every step: from discovery and site visits to reservation and title transfer. Our team of licensed brokers handles the complexity so you can focus on the decision that matters most.</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-72 bg-slate-200">
            <img src="https://images.unsplash.com/photo-1722421492323-eaf9c401befe?w=800&h=500&fit=crop&auto=format" alt="Mission" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/40 to-transparent" />
          </div>
        </section>

        <section className="pb-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald">What We Stand For</span>
            <h2 className="text-3xl font-bold text-navy mt-3" style={{ fontFamily: "var(--font-display)" }}>Our Core Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-navy text-base mb-2">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald">Our Story</span>
            <h2 className="text-3xl font-bold text-navy mt-3" style={{ fontFamily: "var(--font-display)" }}>A Decade and a Half of Growth</h2>
          </div>
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-200 hidden sm:block" />
            <div className="space-y-6">
              {milestones.map(({ year, label }) => (
                <div key={year} className="flex gap-6 items-start">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-navy flex items-center justify-center">
                    <span className="font-bold text-sm" style={{ fontFamily: "var(--font-display)", color: "#FCB9B2" }}>{year}</span>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 p-4 flex-1">
                    <p className="text-sm text-slate-700 leading-relaxed">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="bg-navy rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>Ready to Find Your Property?</h2>
            <p className="text-white/60 mb-7 text-sm">Browse 1,284 verified listings or talk to one of our expert agents today.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => setPage("buy")} className="px-8 py-3.5 rounded-xl bg-emerald text-navy font-bold text-sm hover:bg-emerald-600 transition-colors">
                Browse Listings
              </button>
              <button onClick={() => setPage("agents")} className="px-8 py-3.5 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                Talk to an Agent
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
