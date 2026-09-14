import React, { useState } from "react";
import { AGENTS } from "../data";
import { Ic } from "./common";

export default function AgentsPage() {
  const [search, setSearch] = useState("");
  const [selectedSpec, setSelectedSpec] = useState("All");

  const allSpecs = ["All", "Luxury Homes", "Condominiums", "Pre-Selling", "House & Lot", "Commercial", "Land", "BGC", "Makati", "Laguna"];
  const filtered = AGENTS.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchSpec = selectedSpec === "All" || a.specialties.some((s) => s.toLowerCase().includes(selectedSpec.toLowerCase()));
    return matchSearch && matchSpec;
  });

  return (
    <div className="min-h-screen bg-offwhite">
      <section className="bg-navy py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block bg-emerald/20 text-emerald text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald/30 mb-4">Our Team</span>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>Meet Our<br /><em>Expert Agents</em></h1>
          <p className="text-white/60 max-w-md mx-auto text-sm">Licensed brokers and property consultants with deep local market expertise.</p>
        </div>
      </section>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-slate-100">
          {[ ["6", "Expert Agents"], ["389", "Properties Sold"], ["56", "Years Combined Exp."] ].map(([val, label]) => (
            <div key={label} className="text-center px-4">
              <p className="text-2xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ic.Search /></span>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or specialty"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {allSpecs.map((s) => (
              <button key={s} onClick={() => setSelectedSpec(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${selectedSpec === s ? "bg-navy text-white border-navy" : "bg-white text-slate-600 border-slate-200 hover:border-navy"}`}>{s}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
          {filtered.map((agent) => (
            <div key={agent.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-start gap-4 mb-4">
                <img src={agent.avatar} alt={agent.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-200 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-navy text-base">{agent.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{agent.title}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#D4A373" }}>{agent.agency}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[ ["listings", String(agent.listings), "Listings"], ["sold", String(agent.sold), "Sold"], ["yearsExp", String(agent.yearsExp) + "yr", "Exp."] ].map(([k, val, lbl]) => (
                  <div key={k} className="text-center bg-slate-50 rounded-xl py-2">
                    <p className="text-base font-bold text-navy">{val}</p>
                    <p className="text-[10px] text-slate-500">{lbl}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">{agent.bio}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {agent.specialties.map((s) => (
                  <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <a href={`tel:${agent.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-navy text-xs font-semibold hover:bg-slate-50 transition-colors">
                  <Ic.Phone /> Call
                </a>
                <a href={`mailto:${agent.email}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-800 transition-colors">
                  <Ic.Mail /> Email
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
