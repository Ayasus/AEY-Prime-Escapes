import React from "react";
import { PROPERTIES, formatPrice, type Property } from "../data";
import { Ic } from "./common";

export default function NewDevelopmentsPage({ onSelectProperty }: { onSelectProperty: (p: Property) => void }) {
  const devs = PROPERTIES.filter((p) => p.isNewDevelopment);
  const phases = [
    { label: "Launching Soon", tag: "Q4 2026", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Under Construction", tag: "Q2 2027", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "Ready for Occupancy", tag: "2025", color: "bg-blush-50 text-navy-700 border-blush-100" },
  ];

  return (
    <div className="min-h-screen bg-offwhite">
      <section className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=1600&h=600&fit=crop&auto=format" alt="New developments" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-navy/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <span className="inline-block bg-emerald/20 text-emerald text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald/30 mb-4">New Developments</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Pre-Selling &<br /><em>New Projects</em>
          </h1>
          <p className="text-white/60 max-w-xl text-base">Lock in at pre-selling prices before public launch. Exclusive early-bird payment terms available on select projects.</p>
        </div>
      </section>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-slate-100">
          {[ ["3", "Active Projects"], ["₱5.4M", "Starting Price"], ["2026–2028", "Completion Range"] ].map(([val, label]) => (
            <div key={label} className="text-center px-6">
              <p className="text-2xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {phases.map(({ label, color }) => (
            <span key={label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>{label}</span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-navy mb-6" style={{ fontFamily: "var(--font-display)" }}>Available New Projects</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-16">
          {devs.map((p) => (
            <div key={p.id} onClick={() => onSelectProperty(p)} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
              <div className="relative bg-slate-200 aspect-video">
                <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blush text-navy">Pre-Selling · {p.completionDate}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-navy text-base leading-snug">{p.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Ic.Pin />{p.city}</p>
                <p className="text-xl font-bold text-navy mt-3">{formatPrice(p.price)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Starting price · {p.type}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-slate-500 text-xs">
                  {p.beds && <span className="flex items-center gap-1"><Ic.Bed />{p.beds} Beds</span>}
                  {p.baths && <span className="flex items-center gap-1"><Ic.Bath />{p.baths} Baths</span>}
                  <span className="flex items-center gap-1"><Ic.Area />{p.lotArea} m²</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1">Completion</p>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald rounded-full" style={{ width: p.completionDate === "Q4 2026" ? "65%" : p.completionDate === "Q2 2027" ? "35%" : "20%" }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Est. {p.completionDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-navy rounded-3xl p-8 md:p-12 text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>Be the First to Know</h2>
          <p className="text-white/60 text-sm mb-6">Get early access to new project launches before they go public. No spam — just deals.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com" className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
            <button className="px-6 py-3 bg-emerald text-navy text-sm font-bold rounded-xl hover:bg-emerald-600 transition-colors">Notify Me</button>
          </div>
        </div>
      </div>
    </div>
  );
}
