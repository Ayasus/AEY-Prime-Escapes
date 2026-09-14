import React, { useState } from "react";
import { formatPrice, formatPriceFull, type Property } from "../data";
import { StatusBadge } from "./common";

type ReservationRecord = {
  id: string;
  property: Property;
  plan: "reservation" | "downpayment";
  mop: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  dateCreated: string;
  status: "Active" | "Pending Payment" | "For Review" | "Completed";
  amtPaid: number;
  loanYears?: number;
  downPct?: number;
};

export default function MyReservationsPage({ reservations, currentUser, onSelectProperty, onBrowse, onCancel }: {
  reservations: ReservationRecord[];
  currentUser: { name: string; email: string } | null;
  onSelectProperty: (p: Property) => void;
  onBrowse: () => void;
  onCancel: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");
  const displayName = currentUser?.name?.trim() || "Guest";
  const initials = currentUser?.name?.trim()?.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "G";

  const filtered = reservations.filter((r) => {
    if (activeTab === "active") return r.status === "Active" || r.status === "For Review";
    if (activeTab === "completed") return r.status === "Completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-offwhite">
      <section className="bg-navy py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald flex items-center justify-center text-navy font-bold text-sm flex-shrink-0">{initials}</div>
            <div>
              <p className="text-white/60 text-xs">Logged in as</p>
              <p className="text-white font-bold text-sm">{displayName}</p>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4" style={{ fontFamily: "var(--font-display)" }}>My Reservations</h1>
          <p className="text-white/60 text-sm mt-1">Track every detail of your reserved properties in one place.</p>
        </div>
      </section>

      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-slate-100">
          {[
            ["Total Reserved", String(reservations.length)],
            ["Total Committed", `₱${(reservations.reduce((s, r) => s + r.amtPaid, 0) / 1_000_000).toFixed(1)}M`],
            ["Properties Active", String(reservations.filter((r) => r.status === "Active").length)],
          ].map(([label, val]) => (
            <div key={label} className="text-center px-4">
              <p className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          {(["all", "active", "completed"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${activeTab === t ? "bg-navy text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-navy hover:text-navy"}`}>
              {t === "all" ? `All (${reservations.length})` : t === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B89870" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/></svg>
            </div>
            <p className="text-slate-500 font-semibold text-base">
              {reservations.length === 0 ? "You haven't reserved a property yet." : "No reservations in this category."}
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {reservations.length === 0 ? "Browse our listings and click \"Reserve This Property\" to get started." : "Switch tabs to see all your reservations."}
            </p>
            {reservations.length === 0 && (
              <button onClick={onBrowse} className="mt-2 px-6 py-2.5 rounded-xl bg-emerald text-navy text-sm font-bold hover:bg-emerald-600 transition-colors">Browse Properties</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((rec) => {
              const price = rec.property.price;
              const balance = price - rec.amtPaid;
              return (
                <div key={rec.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex gap-4 p-5">
                    <img src={rec.property.images[0]} alt={rec.property.title} className="w-24 h-24 rounded-xl object-cover bg-slate-200 flex-shrink-0 cursor-pointer hover:brightness-95 transition" onClick={() => onSelectProperty(rec.property)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-navy text-sm leading-tight">{rec.property.title}</p>
                        <StatusBadge status={rec.status} />
                      </div>
                      <p className="text-xs text-slate-500 truncate">{rec.property.city}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{rec.id}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                        <span className="text-slate-500">Plan: <span className="text-navy font-semibold">{rec.plan === "downpayment" ? "20% Down" : "Reservation"}</span></span>
                        <span className="text-slate-500">Paid: <span className="font-semibold" style={{ color: "#D4A373" }}>{formatPrice(rec.amtPaid)}</span></span>
                        <span className="text-slate-500">Balance: <span className="text-navy font-semibold">{formatPrice(balance)}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{Math.min(100, Math.round((rec.amtPaid / price) * 100))}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald rounded-full" style={{ width: `${Math.min(100, Math.round((rec.amtPaid / price) * 100))}%` }} />
                    </div>
                    <div className="mt-3 flex justify-between items-center gap-2">
                      <span className="text-xs text-slate-500">Total paid: <span className="font-semibold text-navy">{formatPriceFull(rec.amtPaid)}</span></span>
                      <button onClick={() => onCancel(rec.id)} className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
