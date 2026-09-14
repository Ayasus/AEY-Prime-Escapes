import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  formatPrice, formatPriceFull,
  type Property,
} from "./data";
import { supabase } from "./lib/supabase";
import {
  BuyPage,
  PropertyDetailPage,
  NewDevelopmentsPage,
  AgentsPage,
  AboutPage,
} from "./escapes/index";
import { Ic, Logo, StatusBadge } from "./escapes/common";

// ─── Page type ────────────────────────────────────────────────────────────────
type Page = "buy" | "new-developments" | "agents" | "about" | "pdp" | "my-reservations";
type AuthUser = { name: string; email: string; phone: string };

const AUTH_CURRENT_USER_KEY = "aey-prime-current-user";
const RESERVATIONS_KEY_PREFIX = "aey-prime-reservations-";

const normalizeEmail = (email?: string | null) => (email ?? "").trim().toLowerCase();

const getAuthErrorMessage = (error?: { message?: string } | null) => {
  if (error?.message === "Failed to fetch") {
    return "Cannot reach Supabase. Check VITE_SUPABASE_URL and your internet connection.";
  }
  return error?.message || "Authentication failed. Please try again.";
};

const getAuthUserProfile = (user?: { email?: string | null; user_metadata?: { full_name?: string | null; name?: string | null; phone?: string | null } } | null) => {
  if (!user?.email) return null;
  const email = normalizeEmail(user.email);
  const name = user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0];
  const phone = user.user_metadata?.phone?.trim() || "";
  return { name, email, phone };
};

const syncSupabaseUser = async (user: AuthUser) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return;

  try {
    const { error } = await supabase.from("profiles").upsert({
      email: normalizeEmail(user.email),
      name: user.name,
      phone: user.phone,
    }, { onConflict: "email" });

    if (error) throw error;
  } catch {
    // Fallback to localStorage-only mode if the Supabase table is not ready yet.
  }
};

const syncAuthProfile = async (user: { name: string; email: string; phone?: string }) => {
  if (!user.phone) return;
  await syncSupabaseUser({ name: user.name, email: user.email, phone: user.phone });
};

const loadSupabaseReservations = async (email?: string | null): Promise<ReservationRecord[]> => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return getStoredReservations(email);

  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("reservation_json")
      .eq("user_email", normalized)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => row.reservation_json as ReservationRecord).filter(Boolean);
  } catch {
    return getStoredReservations(email);
  }
};

const syncSupabaseReservation = async (reservation: ReservationRecord, email?: string | null) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return;

  const normalized = normalizeEmail(email);
  if (!normalized) return;

  try {
    const { error } = await supabase.from("reservations").upsert({
      id: reservation.id,
      user_email: normalized,
      reservation_json: reservation,
    }, { onConflict: "id" });

    if (error) throw error;
  } catch {
    // Keep localStorage fallback if the table is not present yet.
  }
};

const syncSupabaseReservations = async (reservations: ReservationRecord[], email?: string | null) => {
  if (!reservations.length) return;
  for (const reservation of reservations) {
    await syncSupabaseReservation(reservation, email);
  }
};

const getStoredCurrentUser = (): { name: string; email: string } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as { name: string; email: string }) : null;
  } catch {
    return null;
  }
};

const setStoredCurrentUser = (user: { name: string; email: string } | null) => {
  if (typeof window === "undefined") return;
  if (!user) {
    window.localStorage.removeItem(AUTH_CURRENT_USER_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_CURRENT_USER_KEY, JSON.stringify(user));
};

const getReservationsKeyForUser = (email?: string | null) => {
  const normalized = (email ?? "").trim().toLowerCase();
  return normalized ? `${RESERVATIONS_KEY_PREFIX}${normalized}` : null;
};

const getStoredReservations = (email?: string | null): ReservationRecord[] => {
  if (typeof window === "undefined") return [];
  const key = getReservationsKeyForUser(email);
  if (!key) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as ReservationRecord[]) : [];
  } catch {
    return [];
  }
};

const saveStoredReservations = (reservations: ReservationRecord[], email?: string | null) => {
  if (typeof window === "undefined") return;
  const key = getReservationsKeyForUser(email);
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(reservations));
};

// ─── Auth Modal ───────────────────────────────────────────────────────────────
type AuthMode = "login" | "signup";
interface AuthModalProps {
  property: Property;
  actionLabel: string;
  onClose: () => void;
  onSuccess: (user?: { name: string; email: string }) => void;
}

function AuthModal({ property, actionLabel, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const heading = mode === "login"
    ? `Sign in to ${actionLabel}`
    : `Create an account to ${actionLabel}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const email = form.email.trim().toLowerCase();

    if (mode === "signup") {
      if (!form.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match. Please confirm again.");
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.name.trim(),
            phone: form.phone.trim(),
          },
        },
      });
      setLoading(false);

      if (error) {
        setError(getAuthErrorMessage(error));
        return;
      }

      if (!data.session) {
        setError("Account created. Check your email to confirm your account before signing in.");
        return;
      }

      const profileUser = getAuthUserProfile(data.user);
      if (!profileUser) {
        setError("Your account was created, but the profile could not be loaded.");
        return;
      }

      const localUser: AuthUser = {
        name: profileUser.name,
        email: profileUser.email,
        phone: form.phone.trim(),
      };

      await syncSupabaseUser(localUser);
      setStoredCurrentUser({ name: profileUser.name, email: profileUser.email });
      onSuccess(profileUser);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: form.password,
    });
    setLoading(false);

    if (error) {
      setError(getAuthErrorMessage(error));
      return;
    }

    const profileUser = getAuthUserProfile(data.user);
    if (!profileUser) {
      setError("Login succeeded, but your profile was not found.");
      return;
    }

    setStoredCurrentUser({ name: profileUser.name, email: profileUser.email });
    onSuccess(profileUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[95vh]">

        {/* Property context bar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 border-b border-slate-100">
          <img src={property.images[0]} alt={property.title}
            className="w-12 h-12 rounded-xl object-cover bg-slate-200 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-navy truncate">{property.title}</p>
            <p className="text-xs text-slate-500 truncate">{property.city}</p>
          </div>
          <div className="ml-auto flex-shrink-0 text-right">
            <p className="text-sm font-bold text-emerald">{formatPrice(property.price)}</p>
            <StatusBadge status={property.status} />
          </div>
          <button onClick={onClose} className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors ml-1">
            <Ic.X />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <Logo size="sm" />
            <h2 className="text-xl font-bold text-navy mt-4 leading-snug" style={{ fontFamily: "var(--font-display)" }}>{heading}</h2>
            <p className="text-xs text-slate-500 mt-1.5">Your account keeps your reservation hold and docs secure.</p>
          </div>

          <div className="mb-5 text-center text-xs text-slate-500">
            {mode === "login" ? "Use your email and password to continue." : "Create your account using your email address and phone number."}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Full Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Juan dela Cruz"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-navy block mb-1.5">Email Address</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="juan@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Phone Number</label>
                <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-navy">Password</label>
                {mode === "login" && (
                  <button type="button" className="text-xs text-emerald font-medium hover:underline">Forgot Password?</button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Ic.Eye open={showPw} />
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    <Ic.Eye open={showConfirmPw} />
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-navy text-sm font-bold transition-all mt-2 ${loading ? "bg-emerald/60 cursor-not-allowed" : "bg-emerald hover:bg-emerald-600"}`}
            >
              {loading ? "Verifying…" : mode === "login" ? "Sign In & Continue" : "Create Account & Continue"}
            </button>
          </form>
        </div>

        {/* Tab switcher */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-1 text-sm">
          {mode === "login" ? (
            <>
              <span className="text-slate-500">Don't have an account?</span>
              <button onClick={() => { setMode("signup"); setError(""); }} className="font-semibold hover:underline" style={{ color: "#D4A373" }}>Create one</button>
            </>
          ) : (
            <>
              <span className="text-slate-500">Already have an account?</span>
              <button onClick={() => { setMode("login"); setError(""); }} className="font-semibold hover:underline" style={{ color: "#D4A373" }}>Log in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reservation Record type (shared) ────────────────────────────────────────
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

const MOP_LABELS: Record<string, string> = {
  gcash: "GCash / Maya", bank: "Bank Transfer (InstaPay)",
  card: "Credit / Debit Card", cash: "Cash / Over the Counter",
};

function calcMonthly(price: number, downPct = 20, years = 20) {
  const loan = price * (1 - downPct / 100);
  const r = 0.065 / 12, n = years * 12;
  return Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function printReceipt(rec: ReservationRecord) {
  const price = rec.property.price;
  const balance = price - rec.amtPaid;
  const dp = rec.downPct ?? 20;
  const ly = rec.loanYears ?? 20;
  const monthly = calcMonthly(price, dp, ly);
  const loanAmt = Math.round(price * (1 - dp / 100));
  const totalPaid = monthly * ly * 12 + Math.round(price * dp / 100);
  const totalInterest = totalPaid - price;
  const mopLabel = MOP_LABELS[rec.mop] ?? rec.mop;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reservation Receipt – ${rec.id}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #3D2B1F; background: #fff; margin: 0; padding: 0; }
  .page { max-width: 600px; margin: 0 auto; padding: 40px 32px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #3D2B1F; padding-bottom: 20px; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
  .brand span { color: #D4A373; }
  .receipt-id { font-family: monospace; font-size: 11px; color: #8B6F50; margin-top: 4px; }
  h2 { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #8B6F50; margin-bottom: 10px; border-bottom: 1px solid #E8D0A0; padding-bottom: 4px; }
  .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
  .row .label { color: #8B6F50; }
  .row .value { font-weight: 600; text-align: right; }
  .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; padding-top: 10px; border-top: 1px solid #E8D0A0; margin-top: 6px; }
  .total-row .value { color: #D4A373; }
  .property-block { display: flex; gap: 16px; align-items: flex-start; background: #FAEDCD; border-radius: 12px; padding: 14px; margin-bottom: 8px; }
  .property-block img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; }
  .property-block .info { flex: 1; }
  .property-block .title { font-weight: 700; font-size: 14px; }
  .property-block .sub { font-size: 11px; color: #8B6F50; margin-top: 2px; }
  .property-block .price { font-weight: 800; font-size: 15px; color: #D4A373; margin-top: 6px; }
  .amort { background: #FAEDCD; border-radius: 10px; padding: 14px; margin-top: 10px; }
  .amort .highlight { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; margin-top: 8px; padding-top: 8px; border-top: 1px solid #D9BC84; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E8D0A0; font-size: 10px; color: #B89870; display: flex; justify-content: space-between; }
  .status-badge { display: inline-block; background: #D4F8E8; color: #065F46; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head><body><div class="page">
  <div class="header">
    <div>
      <div class="brand">AEY Prime <span>Escapes</span></div>
      <div class="receipt-id">Official Reservation Receipt</div>
    </div>
    <div style="text-align:right">
      <div class="status-badge">Active</div>
      <div class="receipt-id" style="margin-top:6px">${rec.id}</div>
      <div style="font-size:11px;color:#8B6F50;margin-top:2px">${rec.dateCreated}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Property</div>
    <div class="property-block">
      <img src="${rec.property.images[0]}" alt="${rec.property.title}" />
      <div class="info">
        <div class="title">${rec.property.title}</div>
        <div class="sub">${rec.property.address}, ${rec.property.city}</div>
        <div class="price">₱${price.toLocaleString("en-PH")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Buyer Information</div>
    <div class="row"><span class="label">Full Name</span><span class="value">${rec.buyerName || "—"}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${rec.buyerEmail || "—"}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value">${rec.buyerPhone || "—"}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span class="label">Payment Plan</span><span class="value">${rec.plan === "downpayment" ? "20% Down Payment" : "Reservation Fee Only"}</span></div>
    <div class="row"><span class="label">Mode of Payment</span><span class="value">${mopLabel}</span></div>
    <div class="row"><span class="label">Total Property Price</span><span class="value">₱${price.toLocaleString("en-PH")}</span></div>
    <div class="row"><span class="label">Amount Paid Today</span><span class="value">₱${rec.amtPaid.toLocaleString("en-PH")}</span></div>
    <div class="total-row"><span>Remaining Balance</span><span class="value">₱${balance.toLocaleString("en-PH")}</span></div>
  </div>

  ${rec.plan === "downpayment" ? `<div class="section">
    <div class="section-title">Monthly Amortization Estimate</div>
    <div class="amort">
      <div class="row"><span class="label">Down Payment (${dp}%)</span><span class="value">₱${Math.round(price * dp / 100).toLocaleString("en-PH")}</span></div>
      <div class="row"><span class="label">Loan Amount (${100 - dp}%)</span><span class="value">₱${loanAmt.toLocaleString("en-PH")}</span></div>
      <div class="row"><span class="label">Interest Rate</span><span class="value">6.5% per annum</span></div>
      <div class="row"><span class="label">Loan Term</span><span class="value">${ly} years (${ly * 12} months)</span></div>
      <div class="row"><span class="label">Total Interest</span><span class="value">₱${totalInterest.toLocaleString("en-PH")}</span></div>
      <div class="row"><span class="label">Total Amount Paid</span><span class="value">₱${totalPaid.toLocaleString("en-PH")}</span></div>
      <div class="highlight"><span>Monthly Payment</span><span style="color:#D4A373">₱${monthly.toLocaleString("en-PH")}</span></div>
    </div>
    <p style="font-size:10px;color:#B89870;margin-top:8px">*Estimate only. Final rate subject to bank approval. Rate may vary.</p>
  </div>` : ""}

  <div class="section">
    <div class="section-title">Assigned Agent</div>
    <div class="row"><span class="label">Name</span><span class="value">${rec.property.agent.name}</span></div>
    <div class="row"><span class="label">Agency</span><span class="value">${rec.property.agent.agency}</span></div>
    <div class="row"><span class="label">Contact</span><span class="value">${rec.property.agent.phone}</span></div>
  </div>

  <div class="footer">
    <span>AEY Prime Escapes · Licensed by HLURB · PRC Accredited Brokerage</span>
    <span>Printed ${new Date().toLocaleDateString("en-PH")}</span>
  </div>
</div></body></html>`;

  const win = window.open("", "_blank", "width=700,height=900");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 400);
}

// ─── Reservation Modal ────────────────────────────────────────────────────────
function ReservationModal({ property, onClose, onReserved }: {
  property: Property; onClose: () => void;
  onReserved?: (rec: ReservationRecord) => void;
}) {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<"reservation" | "downpayment" | null>(null);
  const [loanYears, setLoanYears] = useState(20);
  const [downPct, setDownPct] = useState(20);
  const [mop, setMop] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", contact: "Email", idFile: "" });
  const [reservationId] = useState(`AEY-${Date.now().toString(36).toUpperCase()}`);

  const price = property.price;
  const reservationFee = 50000;
  const downPaymentAmt = Math.round(price * downPct / 100);
  const loanAmt = price - downPaymentAmt;
  const r = 0.065 / 12;
  const nMonths = loanYears * 12;
  const monthly = Math.round((loanAmt * r * Math.pow(1 + r, nMonths)) / (Math.pow(1 + r, nMonths) - 1));
  const totalPaid = monthly * nMonths + downPaymentAmt;
  const totalInterest = totalPaid - price;

  const amtDueToday = plan === "downpayment" ? downPaymentAmt : reservationFee;
  const stepLabel = ["Choose a Plan", "Buyer Information", "Mode of Payment", "Payment Receipt"];
  const canProceed = step !== 3 || (!!mop && !!plan);

  const PAYMENT_MODES = [
    { id: "gcash", label: "GCash / Maya", desc: "Scan QR or send to 09708769224" },
    { id: "bank", label: "Bank Transfer (InstaPay)", desc: "BDO · BPI · UnionBank supported" },
    { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, JCB" },
    { id: "cash", label: "Cash / Over the Counter", desc: "Visit our office to pay directly" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <div className="flex gap-1 mb-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i < step ? "bg-emerald" : "bg-slate-200"} ${i === step - 1 ? "w-6" : "w-3"}`} />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Step {step} of 4 — {stepLabel[step - 1]}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Step 1 — Choose Plan */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Reserve This Property</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose how you want to secure this unit today.</p>
              </div>
              {/* Property card */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden flex gap-3 p-3">
                <img src={property.images[0]} alt={property.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-200" />
                <div className="min-w-0">
                  <p className="font-bold text-navy text-sm">{property.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{property.city}</p>
                  <p className="text-base font-bold mt-1" style={{ color: "#D4A373" }}>{formatPriceFull(price)}</p>
                </div>
              </div>

              {/* Plan options */}
              <div className="space-y-3">
                <button onClick={() => setPlan("reservation")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${plan === "reservation" ? "border-navy bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-navy text-sm">Reservation Fee Only</p>
                      <p className="text-xs text-slate-500 mt-0.5">Lock the property for 30 days with a refundable fee</p>
                    </div>
                    {plan === "reservation" && <span className="text-emerald"><Ic.Check /></span>}
                  </div>
                  <p className="text-xl font-bold text-navy mt-2">{formatPriceFull(reservationFee)}</p>
                  <p className="text-[11px] text-slate-400">Due today · Fully refundable within 7 days</p>
                </button>

                <button onClick={() => setPlan("downpayment")}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${plan === "downpayment" ? "border-navy bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-navy text-sm">Down Payment</p>
                      <p className="text-xs text-slate-500 mt-0.5">Secure ownership — balance financed via bank loan</p>
                    </div>
                    {plan === "downpayment" && <span className="text-emerald"><Ic.Check /></span>}
                  </div>
                  <p className="text-xl font-bold text-navy mt-2">{formatPriceFull(downPaymentAmt)}</p>
                  <p className="text-[11px] text-slate-400">Due today ({downPct}% of total) · {formatPrice(monthly)}/mo for {loanYears} yrs</p>
                </button>
              </div>

              {/* Loan calculator — only when downpayment selected */}
              {plan === "downpayment" && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-200">
                  <p className="text-xs font-bold text-navy uppercase tracking-widest">Loan Calculator</p>

                  {/* Down payment % slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-navy">Down Payment</label>
                      <span className="text-sm font-bold text-navy">{downPct}% — {formatPriceFull(downPaymentAmt)}</span>
                    </div>
                    <input type="range" min={10} max={50} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))}
                      className="w-full accent-navy h-1.5 rounded-full" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>10%</span><span>50%</span></div>
                  </div>

                  {/* Loan term selector */}
                  <div>
                    <label className="text-xs font-semibold text-navy block mb-2">Loan Term</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[5, 10, 15, 20, 25].map((y) => (
                        <button key={y} onClick={() => setLoanYears(y)}
                          className={`py-2 rounded-xl text-xs font-bold transition-colors ${loanYears === y ? "bg-navy text-white" : "bg-white border border-slate-200 text-navy hover:border-navy"}`}>
                          {y}yr
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live result */}
                  <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Property Price</span><span className="font-semibold">{formatPriceFull(price)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Down Payment ({downPct}%)</span><span className="font-semibold">{formatPriceFull(downPaymentAmt)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Loan Amount</span><span className="font-semibold">{formatPriceFull(loanAmt)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Interest Rate</span><span className="font-semibold">6.5% p.a.</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Loan Term</span><span className="font-semibold">{loanYears} years ({nMonths} months)</span></div>
                    <div className="border-t border-slate-200 pt-2 space-y-1.5">
                      <div className="flex justify-between font-bold text-base">
                        <span className="text-navy">Monthly Payment</span>
                        <span style={{ color: "#D4A373" }}>{formatPriceFull(monthly)}</span>
                      </div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Total Amount Paid</span><span className="font-semibold">{formatPriceFull(totalPaid)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Total Interest</span><span className="font-semibold text-slate-600">{formatPriceFull(totalInterest)}</span></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Estimate only. Final rate subject to bank approval. Rate may vary.</p>
                </div>
              )}

              {/* Reservation fee breakdown */}
              {plan === "reservation" && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                  <p className="text-xs font-bold text-navy mb-3">Payment Breakdown</p>
                  <div className="flex justify-between"><span className="text-slate-600">Total Property Price</span><span className="font-semibold">{formatPriceFull(price)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Reservation Fee</span><span className="font-semibold">{formatPriceFull(reservationFee)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Balance (after reservation)</span><span className="font-semibold">{formatPriceFull(price - reservationFee)}</span></div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-navy"><span>Due Today</span><span style={{ color: "#D4A373" }}>{formatPriceFull(reservationFee)}</span></div>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
                <strong>Note:</strong> Final financing terms are subject to bank approval. Our agents will assist you through the full loan process.
              </div>
            </div>
          )}

          {/* Step 2 — Buyer Info */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Buyer Information</h2>
              {([["Full Name","name","text","Juan dela Cruz"],["Email Address","email","email","juan@email.com"],["Phone Number","phone","tel","+63 9XX XXX XXXX"]] as const).map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-navy block mb-1.5">{label}</label>
                  <input type={type} value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Preferred Contact</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Email","Phone","Viber","WhatsApp"].map((m) => (
                    <button key={m} onClick={() => setForm({ ...form, contact: m })}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${form.contact === m ? "bg-navy text-white border-navy" : "bg-white text-slate-600 border-slate-200"}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Government ID</label>
                <label className="flex flex-col items-center gap-2 w-full border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-emerald transition-colors text-center">
                  <Ic.Upload />
                  <span className="text-xs text-slate-500">{form.idFile || "Click to upload or drag & drop"}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG or PDF — max 5MB</span>
                  <input type="file" className="hidden" onChange={(e) => setForm({ ...form, idFile: e.target.files?.[0]?.name ?? "" })} />
                </label>
              </div>
            </div>
          )}

          {/* Step 3 — Mode of Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Mode of Payment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select how you will pay <strong className="text-navy">{formatPriceFull(amtDueToday)}</strong> today.</p>
              </div>
              <div className="space-y-2.5">
                {PAYMENT_MODES.map(({ id, label, desc }) => (
                  <button key={id} onClick={() => setMop(id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${mop === id ? "border-navy bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${mop === id ? "border-navy" : "border-slate-300"}`}>
                      {mop === id && <div className="w-2.5 h-2.5 rounded-full bg-navy" />}
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm">{label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              {mop && (
                <div className="bg-blush-50 border border-blush-100 rounded-xl p-3 text-xs text-navy">
                  <p className="font-semibold mb-1">Payment Instructions</p>
                  {mop === "gcash" && <p>Send to GCash number <strong>09708769224</strong> (AEY Prime Escapes). Screenshot your receipt and email to <strong>payments@aeyprime.ph</strong>.</p>}
                  {mop === "bank" && <p>Transfer to <strong>BDO Account #1234-5678-9012</strong>, account name <strong>AEY Prime Escapes Inc.</strong>. Send proof to payments@aeyprime.ph.</p>}
                  {mop === "card" && <p>You will be redirected to a secure payment gateway after submitting. Visa, Mastercard, and JCB accepted.</p>}
                  {mop === "cash" && <p>Visit our office at <strong>Unit 5, 8 Rockwell, Makati</strong>, Mon–Sat 9AM–5PM. Bring a valid ID. Official receipt issued upon payment.</p>}
                </div>
              )}
            </div>
          )}

          {/* Step 4 — Receipt */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Reservation Confirmed!</h2>
                <p className="text-xs text-slate-500 mt-1">You have 30 days to complete the full purchase process.</p>
              </div>

              {/* Receipt */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-navy px-4 py-3 flex justify-between items-center">
                  <p className="text-white text-xs font-bold uppercase tracking-wider">Official Receipt</p>
                  <p className="text-white/60 text-[10px] font-mono">{reservationId}</p>
                </div>
                <div className="p-4 space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Property</span><span className="font-semibold text-navy text-right max-w-[55%] leading-tight">{property.title}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Buyer</span><span className="font-semibold text-navy">{form.name || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-semibold text-navy">{form.phone || form.email || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Payment Plan</span><span className="font-semibold text-navy">{plan === "downpayment" ? "20% Down Payment" : "Reservation Fee"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Mode of Payment</span><span className="font-semibold text-navy capitalize">{PAYMENT_MODES.find(p => p.id === mop)?.label ?? "—"}</span></div>
                  <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Total Property Price</span><span className="font-semibold">{formatPriceFull(price)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Amount Paid Today</span><span className="font-bold" style={{ color: "#D4A373" }}>{formatPriceFull(amtDueToday)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Remaining Balance</span><span className="font-semibold">{formatPriceFull(price - amtDueToday)}</span></div>
                  </div>
                  {plan === "downpayment" && (
                    <div className="border-t border-slate-200 pt-2.5 bg-slate-50 -mx-4 px-4 py-3 space-y-1.5">
                      <p className="text-xs font-bold text-navy mb-2">Monthly Amortization</p>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Down Payment ({downPct}%)</span><span className="font-semibold">{formatPriceFull(downPaymentAmt)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Loan Amount ({100 - downPct}%)</span><span className="font-semibold">{formatPriceFull(loanAmt)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Interest Rate</span><span className="font-semibold">6.5% per annum</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Loan Term</span><span className="font-semibold">{loanYears} years ({nMonths} months)</span></div>
                      <div className="flex justify-between text-xs"><span className="text-slate-500">Total Interest</span><span className="font-semibold">{formatPriceFull(totalInterest)}</span></div>
                      <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-slate-200"><span className="text-navy">Monthly Payment</span><span style={{ color: "#D4A373" }}>{formatPriceFull(monthly)}</span></div>
                      <p className="text-[10px] text-slate-400 mt-1">Estimate only. Final rate subject to bank approval.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent */}
              <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                <img src={property.agent.avatar} alt={property.agent.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy">{property.agent.name}</p>
                  <p className="text-xs text-slate-500">{property.agent.agency}</p>
                </div>
                <a href={`tel:${property.agent.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold">
                  <Ic.Phone /> Call
                </a>
              </div>

              {/* Next steps */}
              <div className="space-y-2">
                {["Await confirmation SMS/email within 1 hour", "Prepare two valid government IDs", "Schedule document signing with your agent", "Review Deed of Reservation before 30-day deadline"].map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-blush text-navy text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>{s}
                  </div>
                ))}
              </div>

              <button
                onClick={() => printReceipt({
                  id: reservationId, property, plan: plan!, mop,
                  buyerName: form.name, buyerEmail: form.email, buyerPhone: form.phone,
                  dateCreated: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
                  status: "Active",
                  amtPaid: plan === "downpayment" ? Math.round(property.price * downPct / 100) : 50000,
                  loanYears, downPct,
                })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50 transition-colors">
                <Ic.Download /> Download / Print Receipt
              </button>
            </div>
          )}
        </div>

        {step < 4 ? (
          <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
                <Ic.ArrowLeft /> Back
              </button>
            )}
            <button
              onClick={() => {
              if (!canProceed) return;
              const next = step + 1;
              setStep(next);
              if (next === 4 && onReserved && plan) {
                onReserved({
                  id: reservationId,
                  property,
                  plan,
                  mop,
                  buyerName: form.name,
                  buyerEmail: form.email,
                  buyerPhone: form.phone,
                  dateCreated: new Date().toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
                  status: "Active",
                  amtPaid: plan === "downpayment" ? Math.round(property.price * downPct / 100) : 50000,
                  loanYears,
                  downPct,
                });
              }
            }}
              disabled={!canProceed || (step === 1 && !plan)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${(!canProceed || (step === 1 && !plan)) ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald text-navy hover:bg-emerald-600"}`}
            >
              {step === 3 ? `Confirm — Pay ${formatPriceFull(amtDueToday)}` : "Continue"}
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-800">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Agent Chat Modal ─────────────────────────────────────────────────────────
type ChatMsg = { from: "user" | "agent"; text: string; time: string };
function AgentChatModal({ agent, property, onClose }: {
  agent: Property["agent"]; property: Property; onClose: () => void;
}) {
  const now = () => new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const greet: ChatMsg = {
    from: "agent",
    text: `Hi! I'm ${agent.name}. I can answer any questions about ${property.title}. How can I help you today?`,
    time: now(),
  };
  const [messages, setMessages] = useState<ChatMsg[]>([greet]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const QUICK = ["What's the best price?", "Is it ready for occupancy?", "Can I visit the property?", "What are the payment terms?"];

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMsg = { from: "user", text: text.trim(), time: now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTimeout(() => {
      const replies: Record<string, string> = {
        "what's the best price?": `The listed price for ${property.title} is ${formatPriceFull(property.price)}. There may be room for negotiation — I'd be happy to discuss further. Please call me at ${agent.phone}.`,
        "is it ready for occupancy?": property.status === "For Sale" ? "Yes! This property is ready for move-in. We can arrange a site visit at your convenience." : `This property is currently ${property.status}. I can give you more details or add you to our waitlist.`,
        "can i visit the property?": "Absolutely! Just let me know your preferred date and time and I'll set it up. You can also call me directly at " + agent.phone + ".",
        "what are the payment terms?": `We offer flexible terms: 20% down payment with the balance financed via bank loan or in-house financing. Reservation fee is ₱50,000 to lock in the unit. Call me at ${agent.phone} for a full proposal.`,
      };
      const key = text.trim().toLowerCase();
      const reply = replies[key] ?? `Thanks for your message! I'll get back to you shortly. For urgent inquiries, please call ${agent.phone} directly.`;
      setMessages((m) => [...m, { from: "agent", text: reply, time: now() }]);
    }, 900);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col" style={{ height: "min(580px, 92vh)" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100">
          <div className="relative">
            <img src={agent.avatar} alt={agent.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-navy text-sm">{agent.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{agent.agency} · {property.title}</p>
          </div>
          <a href={`tel:${agent.phone}`} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-navy hover:bg-slate-200 transition-colors"><Ic.Phone /></a>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} gap-2`}>
              {msg.from === "agent" && (
                <img src={agent.avatar} alt="" className="w-7 h-7 rounded-full object-cover bg-slate-200 flex-shrink-0 mt-1" />
              )}
              <div className={`max-w-[78%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.from === "user" ? "bg-navy text-white rounded-br-sm" : "bg-slate-100 text-navy rounded-bl-sm"}`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 px-1">{msg.time}</span>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
            {QUICK.map((q) => (
              <button key={q} onClick={() => sendMsg(q)}
                className="flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-slate-200 bg-white text-navy hover:border-navy hover:bg-slate-50 transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 items-end">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMsg(input)}
            placeholder="Type a message…"
            className="flex-1 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition"
          />
          <button
            onClick={() => sendMsg(input)}
            disabled={!input.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${input.trim() ? "bg-navy text-white hover:bg-navy-800" : "bg-slate-200 text-slate-400"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inquire Modal ────────────────────────────────────────────────────────────
function InquireModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Inquire About This Property</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Inquiry Sent!</h3>
              <p className="text-sm text-slate-500">Your message has been forwarded to {property.agent.name}. Expect a reply within 24 hours.</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-left">
                <p className="text-xs font-semibold text-navy mb-2">Your Agent</p>
                <div className="flex items-center gap-3">
                  <img src={property.agent.avatar} alt={property.agent.name} className="w-10 h-10 rounded-full object-cover bg-slate-200" />
                  <div>
                    <p className="text-sm font-semibold text-navy">{property.agent.name}</p>
                    <p className="text-xs text-slate-500">{property.agent.agency}</p>
                    <a href={`tel:${property.agent.phone}`} className="text-xs flex items-center gap-1 mt-0.5 font-semibold" style={{ color: "#D4A373" }}>
                      <Ic.Phone /> {property.agent.phone}
                    </a>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400">Or reach us directly at <strong className="text-navy">09708769224</strong></p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Property mini-card */}
              <div className="flex gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <img src={property.images[0]} alt={property.title} className="w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0" />
                <div className="min-w-0">
Senior Property Consultant
                  <p className="text-sm font-bold text-navy truncate">{property.title}</p>
                  <p className="text-xs text-slate-500 truncate">{property.city}</p>
                  <p className="text-sm font-bold mt-1" style={{ color: "#D4A373" }}>{formatPrice(property.price)}</p>
                </div>
              </div>
              {/* Agent strip */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <img src={property.agent.avatar} alt={property.agent.name} className="w-9 h-9 rounded-full object-cover bg-slate-200 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-navy">{property.agent.name}</p>
                  <a href={`tel:${property.agent.phone}`} className="text-xs flex items-center gap-1 font-semibold" style={{ color: "#D4A373" }}>
                    <Ic.Phone /> {property.agent.phone}
                  </a>
                </div>
                <a href={`tel:${property.agent.phone}`}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-800 transition-colors">
                  <Ic.Phone /> Call Now
                </a>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                {[["name","Full Name","text","Juan dela Cruz"],["email","Email Address","email","juan@email.com"],["phone","Phone Number","tel","09XX XXX XXXX"]].map(([k,l,t,ph]) => (
                  <div key={k}>
                    <label className="text-xs font-semibold text-navy block mb-1.5">{l}</label>
                    <input type={t} required value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold text-navy block mb-1.5">Your Message</label>
                  <textarea rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={`Hi, I'm interested in ${property.title}. Could you share more details about...`}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald resize-none" />
                </div>
                <button type="submit" disabled={loading}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors ${loading ? "bg-emerald/60 cursor-not-allowed text-navy" : "bg-emerald text-navy hover:bg-emerald-600"}`}>
                  {loading ? "Sending…" : "Send Inquiry"}
                </button>
              </form>
            </div>
          )}
        </div>
        {sent && (
          <div className="px-6 py-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-800">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Schedule Modal (with Calendar) ──────────────────────────────────────────
function ScheduleModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const TIME_SLOTS = ["9:00 AM","10:00 AM","11:00 AM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const isToday = (d: number) => d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  const isPast = (d: number) => new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isSelected = (d: number) => selectedDate?.getDate() === d && selectedDate?.getMonth() === viewMonth && selectedDate?.getFullYear() === viewYear;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); } else setViewMonth(m => m + 1); };

  const canGoBack = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !form.name || !form.phone) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setConfirmed(true); }, 1200);
  };

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Schedule a Viewing</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {confirmed ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mx-auto">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Viewing Scheduled!</h3>
              <p className="text-sm text-slate-500">Your site visit has been confirmed. {property.agent.name} will reach out to finalize details.</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-3">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Property</span><span className="font-semibold text-navy text-right max-w-[55%]">{property.title}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Date</span><span className="font-semibold text-navy">{formattedDate}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Time</span><span className="font-semibold text-navy">{selectedTime}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Agent</span><span className="font-semibold text-navy">{property.agent.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Contact</span>
                  <a href={`tel:${property.agent.phone}`} className="font-semibold" style={{ color: "#D4A373" }}>09708769224</a>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Property context */}
              <div className="flex gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <img src={property.images[0]} alt={property.title} className="w-14 h-14 rounded-xl object-cover bg-slate-200 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy truncate">{property.title}</p>
                  <p className="text-xs text-slate-500 truncate">{property.city}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "#D4A373" }}>Agent: {property.agent.name}</p>
                </div>
              </div>

              {/* Calendar */}
              <div>
                <p className="text-xs font-semibold text-navy mb-2">Select a Date</p>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  {/* Month nav */}
                  <div className="flex items-center justify-between mb-3">
                    <button onClick={prevMonth} disabled={!canGoBack}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${canGoBack ? "hover:bg-slate-200 text-navy" : "text-slate-300 cursor-not-allowed"}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <p className="text-sm font-bold text-navy">{MONTHS[viewMonth]} {viewYear}</p>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-navy transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </div>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 mb-1">
                    {DAYS.map((d) => <p key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</p>)}
                  </div>
                  {/* Day grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const past = isPast(day);
                      const sel = isSelected(day);
                      const tod = isToday(day);
                      return (
                        <button
                          key={day}
                          onClick={() => !past && setSelectedDate(new Date(viewYear, viewMonth, day))}
                          disabled={past}
                          className={`aspect-square rounded-xl text-xs font-semibold transition-all flex items-center justify-center
                            ${sel ? "bg-navy text-white" : past ? "text-slate-300 cursor-not-allowed" : tod ? "border-2 border-emerald text-navy hover:bg-slate-200" : "text-navy hover:bg-slate-200"}`}
                        >{day}</button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <p className="text-xs font-semibold text-navy mb-2">Select a Time Slot</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((t) => (
                      <button key={t} onClick={() => setSelectedTime(t)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${selectedTime === t ? "bg-navy text-white border-navy" : "bg-white border-slate-200 text-navy hover:border-navy"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact info */}
              {selectedDate && selectedTime && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-navy">Your Contact Details</p>
                  {[["name","Full Name","text","Juan dela Cruz"],["phone","Phone Number","tel","09XX XXX XXXX"]].map(([k,l,t,ph]) => (
                    <div key={k}>
                      <label className="text-xs text-slate-500 block mb-1">{l}</label>
                      <input type={t} required value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100">
          {confirmed ? (
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-800">Done</button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={!selectedDate || !selectedTime || !form.name || !form.phone || loading}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors ${!selectedDate || !selectedTime || !form.name || !form.phone ? "bg-slate-200 text-slate-400 cursor-not-allowed" : loading ? "bg-emerald/60 text-navy cursor-not-allowed" : "bg-emerald text-navy hover:bg-emerald-600"}`}>
              {loading ? "Confirming…" : selectedDate && selectedTime ? `Confirm — ${formattedDate} at ${selectedTime}` : "Select a date and time to continue"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Looking for a Property Modal ─────────────────────────────────────────────
function LookingModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", type: "", budget: "", location: "", notes: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Looking for a Property?</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tell us what you need — we'll find it for you.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sent ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mx-auto">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              <h3 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>We're on it!</h3>
              <p className="text-sm text-slate-500">Our team will reach out within 24 hours with matching properties tailored to your needs.</p>
              <div className="bg-slate-50 rounded-2xl p-4 text-sm text-navy font-semibold">
                <Ic.Phone /> <span className="ml-1">09708769224</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-blush-50 border border-blush-100 rounded-xl p-3 text-xs text-navy-700">
                You can also call us directly: <a href="tel:09708769224" className="font-bold text-navy">09708769224</a>
              </div>
              {[["name","Full Name","text","Juan dela Cruz"],["phone","Phone Number","tel","09XX XXX XXXX"],["email","Email Address","email","juan@email.com"]].map(([k,l,t,ph]) => (
                <div key={k}>
                  <label className="text-xs font-semibold text-navy block mb-1.5">{l}</label>
                  <input type={t} required value={(form as any)[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={ph}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy block mb-1.5">Property Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald bg-white">
                    <option value="">Any</option>
                    {["House","Condo","House & Lot","Lot","Commercial"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy block mb-1.5">Max Budget</label>
                  <select value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald bg-white">
                    <option value="">Flexible</option>
                    {["Under ₱3M","₱3M – ₱6M","₱6M – ₱12M","₱12M – ₱25M","₱25M+"].map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Preferred Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Makati, Laguna, BGC"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Additional Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Number of bedrooms, move-in date, special requirements..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald resize-none" />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl bg-emerald text-navy text-sm font-bold hover:bg-emerald-600 transition-colors">
                Submit Request
              </button>
            </form>
          )}
        </div>
        {sent && (
          <div className="px-6 py-4 border-t border-slate-100">
            <button onClick={onClose} className="w-full py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-800">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Navbar ────────────────────────────────────────────────────────────
function NavLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user?: { name: string; email: string }) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const emailValue = email.trim().toLowerCase();

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (!phone.trim()) {
        setError("Please enter your phone number.");
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match. Please confirm again.");
        return;
      }

      setLoading(true);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: { data: { full_name: name.trim(), phone: phone.trim() } },
      });
      setLoading(false);

      if (signUpError) {
        setError(getAuthErrorMessage(signUpError));
        return;
      }

      if (!data.session) {
        setError("Account created. Check your email to confirm your account before signing in.");
        return;
      }

      const profileUser = getAuthUserProfile(data.user);
      if (!profileUser) {
        setError("Your account was created. Check your email to confirm it before signing in.");
        return;
      }

      await syncSupabaseUser({ name: profileUser.name, email: profileUser.email, phone: phone.trim() });
      setStoredCurrentUser(profileUser);
      onSuccess(profileUser);
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password,
    });
    setLoading(false);

    if (signInError) {
      setError(getAuthErrorMessage(signInError));
      return;
    }

    const profileUser = getAuthUserProfile(data.user);
    if (!profileUser) {
      setError("Login succeeded, but no Supabase user profile was returned.");
      return;
    }

    setStoredCurrentUser(profileUser);
    onSuccess(profileUser);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">AEY Prime Escapes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>
        <div className="px-6 py-5">
          <div className="mb-4 text-center text-xs text-slate-500">
            {mode === "login" ? "Use your email and password to continue." : "Create your account using your email and phone number."}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Full Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan dela Cruz"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-navy block mb-1.5">Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan@email.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Phone Number</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-navy block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showConfirmPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            <button type="submit" disabled={loading}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors ${loading ? "bg-emerald/60 text-navy cursor-not-allowed" : "bg-emerald text-navy hover:bg-emerald-600"}`}>
              {loading ? (mode === "login" ? "Signing in…" : "Creating account…") : (mode === "login" ? "Sign In" : "Create Account")}
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-4">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold hover:underline" style={{ color: "#D4A373" }}>
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Navbar({ page, setPage, isAuthenticated, currentUser, onLoginSuccess, onLogout }: {
  page: Page; setPage: (p: Page) => void; isAuthenticated: boolean; currentUser: { name: string; email: string } | null; onLoginSuccess: (user?: { name: string; email: string }) => void; onLogout: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLooking, setShowLooking] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const navLinks: { label: string; page: Page }[] = [
    { label: "Buy", page: "buy" },
    { label: "New Developments", page: "new-developments" },
    { label: "Agents", page: "agents" },
    { label: "About", page: "about" },
  ];

  const initials = currentUser?.name?.trim()?.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "U";

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button onClick={() => setPage("buy")}><Logo /></button>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, page: p }) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${page === p ? "bg-slate-100 text-navy font-semibold" : "text-slate-500 hover:text-navy hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated && currentUser ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage("my-reservations")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${page === "my-reservations" ? "bg-slate-100" : "hover:bg-slate-50"}`}>
                  <div className="w-8 h-8 rounded-full bg-emerald flex items-center justify-center text-navy text-xs font-bold">{initials}</div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-navy leading-none">{currentUser.name.split(" ")[0]}</p>
                    <p className="text-[10px] text-slate-500 leading-none mt-0.5">My Reservations</p>
                  </div>
                </button>
                <button onClick={onLogout} className="hidden sm:inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-slate-600 hover:text-navy hover:bg-slate-50 rounded-xl transition-colors">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="hidden sm:block text-sm font-semibold text-navy hover:text-emerald transition-colors px-3 py-2">Log in</button>
                <button onClick={() => setShowLooking(true)} className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-navy-800 transition-colors whitespace-nowrap">
                  Looking for a Property?
                </button>
              </>
            )}
            <button className="md:hidden p-2 text-slate-500" onClick={() => setMobileOpen(!mobileOpen)}><Ic.Menu /></button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
            {navLinks.map(({ label, page: p }) => (
              <button key={p} onClick={() => { setPage(p); setMobileOpen(false); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${page === p ? "bg-slate-100 text-navy font-semibold" : "text-slate-600 hover:bg-slate-50"}`}>
                {label}
              </button>
            ))}
            {isAuthenticated && currentUser ? (
              <button onClick={() => { onLogout(); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Logout
              </button>
            ) : (
              <button onClick={() => { setShowLogin(true); setMobileOpen(false); }}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-navy hover:bg-slate-50">
                Log in
              </button>
            )}
          </div>
        )}
      </header>
      {showLooking && <LookingModal onClose={() => setShowLooking(false)} />}
      {showLogin && <NavLoginModal onClose={() => setShowLogin(false)} onSuccess={(user) => { setShowLogin(false); onLoginSuccess(user); }} />}
    </>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-navy text-white/70 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <Logo />
          <p className="text-white/50 text-xs mt-3 leading-relaxed">Full-service real estate brokerage. Verified listings, trusted agents, seamless reservations.</p>
        </div>
        {[
          { title: "Explore", links: [["Buy Property","buy"],["New Developments","new-developments"],["Find an Agent","agents"],["About Us","about"]] },
          { title: "Property Types", links: [["Houses","buy"],["Condominiums","buy"],["House & Lot","buy"],["Commercial","buy"]] },
          { title: "Contact", links: [["info@aeyprime.ph",""],["0970-876-9224",""],["Mon–Sat, 8am–6pm",""]] },
        ].map(({ title, links }) => (
          <div key={title}>
            <p className="text-white font-semibold text-xs uppercase tracking-widest mb-3">{title}</p>
            <ul className="space-y-2">
              {links.map(([label, page]) => (
                <li key={label}>
                  {page ? (
                    <button onClick={() => setPage(page as Page)} className="hover:text-white transition-colors">{label}</button>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[10px] text-white/30">
        © {new Date().getFullYear()} AEY Prime Escapes. All rights reserved. Licensed by HLURB · PRC Accredited Brokerage
      </div>
    </footer>
  );
}

// ─── My Reservations Page ─────────────────────────────────────────────────────

function ReservationDetailDrawer({ rec, onClose, onSelectProperty }: {
  rec: ReservationRecord; onClose: () => void; onSelectProperty: (p: Property) => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const price = rec.property.price;
  const balance = price - rec.amtPaid;
  const dp = rec.downPct ?? 20;
  const ly = rec.loanYears ?? 20;
  const monthly = calcMonthly(price, dp, ly);
  const loanAmtDrawer = Math.round(price * (1 - dp / 100));

  const STATUS_COLOR: Record<string, string> = {
    "Active": "bg-green-100 text-green-700",
    "Pending Payment": "bg-amber-100 text-amber-700",
    "For Review": "bg-blue-100 text-blue-700",
    "Completed": "bg-slate-100 text-slate-600",
  };

  const DOCS = [
    { label: "Reservation Agreement", status: "signed" },
    { label: "Buyer Information Form", status: "submitted" },
    { label: "Valid Government ID", status: rec.buyerName ? "submitted" : "pending" },
    { label: "Deed of Reservation", status: "pending" },
    { label: "Contract to Sell", status: "pending" },
    { label: "Title Transfer Documents", status: "pending" },
  ];

  const TIMELINE = [
    { label: "Reservation Filed", date: rec.dateCreated, done: true },
    { label: "Payment Received", date: rec.dateCreated, done: rec.status !== "Pending Payment" },
    { label: "Document Review", date: "In Progress", done: rec.status === "Active" || rec.status === "Completed" },
    { label: "Contract Signing", date: "Pending", done: rec.status === "Completed" },
    { label: "Title Transfer", date: "Pending", done: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 font-mono">{rec.id}</p>
            <h3 className="font-bold text-navy text-base" style={{ fontFamily: "var(--font-display)" }}>Reservation Record</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"><Ic.X /></button>
        </div>

        <div className="px-6 py-5 space-y-6 pb-12">
          {/* Status badge + property */}
          <div className="flex gap-3 items-start">
            <img src={rec.property.images[0]} alt={rec.property.title}
              className="w-20 h-20 rounded-2xl object-cover bg-slate-200 flex-shrink-0 cursor-pointer hover:brightness-95 transition"
              onClick={() => { onClose(); onSelectProperty(rec.property); }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[rec.status]}`}>{rec.status}</span>
              </div>
              <p className="font-bold text-navy text-sm leading-tight">{rec.property.title}</p>
              <p className="text-xs text-slate-500 truncate mt-0.5">{rec.property.address}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: "#D4A373" }}>{formatPriceFull(price)}</p>
            </div>
          </div>

          {/* Financial Summary */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Financial Summary</h4>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Total Property Price</span><span className="font-semibold">{formatPriceFull(price)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Payment Plan</span><span className="font-semibold">{rec.plan === "downpayment" ? "20% Down Payment" : "Reservation Fee"}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount Paid</span><span className="font-bold" style={{ color: "#D4A373" }}>{formatPriceFull(rec.amtPaid)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Remaining Balance</span><span className="font-semibold text-navy">{formatPriceFull(balance)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Mode of Payment</span><span className="font-semibold">{MOP_LABELS[rec.mop] ?? rec.mop}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Date Filed</span><span className="font-semibold">{rec.dateCreated}</span></div>
              {rec.plan === "downpayment" && (
                <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                  <p className="text-xs font-bold text-navy mb-2">Monthly Amortization</p>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Down Payment ({dp}%)</span><span className="font-semibold">{formatPriceFull(rec.amtPaid)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Loan Amount ({100 - dp}%)</span><span className="font-semibold">{formatPriceFull(loanAmtDrawer)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Interest Rate</span><span className="font-semibold">6.5% per annum</span></div>
                  <div className="flex justify-between text-xs"><span className="text-slate-500">Loan Term</span><span className="font-semibold">{ly} years ({ly * 12} months)</span></div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200">
                    <span className="text-navy">Est. Monthly Payment</span>
                    <span style={{ color: "#D4A373" }}>{formatPriceFull(monthly)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Subject to bank approval. Rate may vary.</p>
                </div>
              )}
            </div>
          </section>

          {/* Buyer Info */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Buyer Information</h4>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Full Name</span><span className="font-semibold">{rec.buyerName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-semibold">{rec.buyerEmail}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Phone</span><span className="font-semibold">{rec.buyerPhone}</span></div>
            </div>
          </section>

          {/* Assigned Agent */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Assigned Agent</h4>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <img src={rec.property.agent.avatar} alt={rec.property.agent.name} className="w-12 h-12 rounded-full object-cover bg-slate-200 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-navy text-sm">{rec.property.agent.name}</p>
                <p className="text-xs text-slate-500">{rec.property.agent.agency}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Ic.Phone />{rec.property.agent.phone}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <a href={`tel:${rec.property.agent.phone}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold">
                  <Ic.Phone /> Call
                </a>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Purchase Timeline</h4>
            <div className="space-y-0">
              {TIMELINE.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${t.done ? "bg-navy border-navy" : "bg-white border-slate-300"}`}>
                      {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    {i < TIMELINE.length - 1 && <div className={`w-0.5 h-7 mt-1 ${t.done ? "bg-navy" : "bg-slate-200"}`} />}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-semibold ${t.done ? "text-navy" : "text-slate-400"}`}>{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Document Checklist */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Document Checklist</h4>
            <div className="space-y-2">
              {DOCS.map((doc) => (
                <div key={doc.label} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${doc.status === "signed" || doc.status === "submitted" ? "bg-navy" : "border-2 border-slate-300"}`}>
                      {(doc.status === "signed" || doc.status === "submitted") && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </div>
                    <span className="text-sm text-navy font-medium">{doc.label}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    doc.status === "signed" ? "bg-green-100 text-green-700" :
                    doc.status === "submitted" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-200 text-slate-500"
                  }`}>{doc.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Important Reminders */}
          <section>
            <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-3">Important Reminders</h4>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
              {[
                "Your 30-day hold period is running. Complete requirements before the deadline to avoid forfeiture.",
                "Prepare two valid government-issued IDs for document signing.",
                "Coordinate with your agent for the Deed of Reservation signing schedule.",
                "All payments must be verified by AEY Prime Escapes before processing.",
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  {r}
                </div>
              ))}
            </div>
          </section>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => printReceipt(rec)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50 transition-colors">
              <Ic.Download /> Download Receipt
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-800 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Chat Agent
            </button>
          </div>
        </div>
      </div>
      {showChat && <AgentChatModal agent={rec.property.agent} property={rec.property} onClose={() => setShowChat(false)} />}
    </div>
  );
}

function ReservationsDashboardPage({ reservations, currentUser, onSelectProperty, onBrowse, onCancel }: {
  reservations: ReservationRecord[];
  currentUser: { name: string; email: string } | null;
  onSelectProperty: (p: Property) => void;
  onBrowse: () => void;
  onCancel: (id: string) => void;
}) {
  const [selectedRec, setSelectedRec] = useState<ReservationRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReservationRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDone, setCancelDone] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  const displayName = currentUser?.name?.trim() || "Guest";
  const initials = currentUser?.name?.trim()?.split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "G";

  const STATUS_COLOR: Record<string, string> = {
    "Active": "bg-green-100 text-green-700",
    "Pending Payment": "bg-amber-100 text-amber-700",
    "For Review": "bg-blue-100 text-blue-700",
    "Completed": "bg-slate-100 text-slate-600",
  };

  const filtered = reservations.filter((r) => {
    if (activeTab === "active") return r.status === "Active" || r.status === "For Review";
    if (activeTab === "completed") return r.status === "Completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-offwhite">
      {/* Hero */}
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

      {/* Summary strip */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 py-4 grid grid-cols-3 divide-x divide-slate-100">
          {[
            ["Total Reserved", String(reservations.length)],
            ["Total Committed", `₱${(reservations.reduce((s, r) => s + r.amtPaid, 0) / 1_000_000).toFixed(1)}M`],
            ["Properties Active", String(reservations.filter(r => r.status === "Active").length)],
          ].map(([label, val]) => (
            <div key={label} className="text-center px-4">
              <p className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{val}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["all","active","completed"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${activeTab === t ? "bg-navy text-white" : "bg-white text-slate-500 border border-slate-200 hover:border-navy hover:text-navy"}`}>
              {t === "all" ? `All (${reservations.length})` : t === "active" ? "Active" : "Completed"}
            </button>
          ))}
        </div>

        {/* Reservation cards */}
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
                    {/* Property image */}
                    <img
                      src={rec.property.images[0]} alt={rec.property.title}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-200 flex-shrink-0 cursor-pointer hover:brightness-95 transition"
                      onClick={() => { onSelectProperty(rec.property); }}
                    />
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-navy text-sm leading-tight">{rec.property.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[rec.status]}`}>{rec.status}</span>
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

                  {/* Payment progress bar */}
                  <div className="px-5 pb-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Payment Progress</span>
                      <span>{Math.round((rec.amtPaid / price) * 100)}% paid</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(rec.amtPaid / price) * 100}%`, backgroundColor: "#D4A373" }} />
                    </div>
                  </div>

                  {/* Action row */}
                  <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <img src={rec.property.agent.avatar} alt={rec.property.agent.name} className="w-6 h-6 rounded-full object-cover bg-slate-200 flex-shrink-0" />
                      <span className="text-xs text-slate-500 truncate">Agent: <span className="font-semibold text-navy">{rec.property.agent.name}</span></span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => setCancelTarget(rec)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => setSelectedRec(rec)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-800 transition-colors">
                        View Record
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Browse CTA */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <p className="font-bold text-navy text-base mb-1" style={{ fontFamily: "var(--font-display)" }}>Looking for more properties?</p>
          <p className="text-xs text-slate-500 mb-4">Browse our full catalog and reserve your next investment today.</p>
          <button onClick={onBrowse} className="px-6 py-2.5 rounded-xl bg-emerald text-navy text-sm font-bold hover:bg-emerald-600 transition-colors">
            Browse Properties
          </button>
        </div>
      </div>

      {selectedRec && (
        <ReservationDetailDrawer
          rec={selectedRec}
          onClose={() => setSelectedRec(null)}
          onSelectProperty={(p) => { setSelectedRec(null); onSelectProperty(p); }}
        />
      )}

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelDone(false); }} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6">
            {cancelDone ? (
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B6F50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Reservation Cancelled</h3>
                <p className="text-xs text-slate-500">Your reservation for <strong>{cancelTarget.property.title}</strong> has been cancelled. A refund will be processed within 7 business days if applicable.</p>
                <button onClick={() => { setCancelTarget(null); setCancelReason(""); setCancelDone(false); }}
                  className="w-full py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-navy-800 transition-colors mt-2">
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base" style={{ fontFamily: "var(--font-display)" }}>Cancel Reservation?</h3>
                    <p className="text-xs text-slate-500 mt-0.5">This will remove your hold on <strong>{cancelTarget.property.title}</strong>. This action cannot be undone.</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 mb-4">
                  Reservation fees are refundable within 7 days of filing. After 7 days the fee may be forfeited.
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-navy block mb-1.5">Reason for cancellation <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="space-y-2 mb-3">
                    {["Found a better property", "Financial constraints", "Change of plans", "Property no longer available", "Other"].map((r) => (
                      <button key={r} onClick={() => setCancelReason(r)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-colors ${cancelReason === r ? "bg-navy text-white border-navy" : "border-slate-200 text-navy hover:border-slate-400"}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => { setCancelTarget(null); setCancelReason(""); }}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Keep Reservation
                  </button>
                  <button onClick={() => { onCancel(cancelTarget.id); setCancelDone(true); }}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                    Yes, Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("buy");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [authContext, setAuthContext] = useState<{ property: Property; action: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>(() => getStoredReservations(getStoredCurrentUser()?.email));

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;

      const sessionUser = getAuthUserProfile(session?.user ?? null);
      if (sessionUser) {
        await syncAuthProfile(sessionUser);
        setCurrentUser(sessionUser);
        setIsAuthenticated(true);
        setReservations(getStoredReservations(sessionUser.email));
        return;
      }

      const currentUserFromStorage = getStoredCurrentUser();
      setCurrentUser(currentUserFromStorage);
      setIsAuthenticated(Boolean(currentUserFromStorage));
      setReservations(getStoredReservations(currentUserFromStorage?.email));
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = getAuthUserProfile(session?.user ?? null);
      void (nextUser && syncAuthProfile(nextUser));
      setCurrentUser(nextUser);
      setIsAuthenticated(Boolean(nextUser));
      setReservations(getStoredReservations(nextUser?.email));
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.email) return;
    saveStoredReservations(reservations, currentUser.email);
    void syncSupabaseReservations(reservations, currentUser.email);
  }, [reservations, currentUser?.email]);

  const handleSelectProperty = useCallback((p: Property) => {
    setSelectedProperty(p);
    setPage("pdp");
  }, []);

  const handleAuthRequired = useCallback((action: string) => {
    if (!selectedProperty) return;
    setAuthContext({ property: selectedProperty, action });
    setPendingAction(action);
  }, [selectedProperty]);

  const handleAuthSuccess = useCallback(async (user?: { name: string; email: string }) => {
    const nextUser = user ?? getStoredCurrentUser();
    setCurrentUser(nextUser);
    setIsAuthenticated(Boolean(nextUser));
    setAuthContext(null);
    const nextReservations = await loadSupabaseReservations(nextUser?.email);
    setReservations(nextReservations.length ? nextReservations : getStoredReservations(nextUser?.email));
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setStoredCurrentUser(null);
    setReservations([]);
  }, []);

  const showPdp = page === "pdp" && selectedProperty;

  return (
    <div className="min-h-screen flex flex-col bg-offwhite">
      <Navbar
        page={page}
        setPage={(p) => { setPage(p); if (p !== "pdp") setSelectedProperty(null); }}
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginSuccess={handleAuthSuccess}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {showPdp ? (
          <PropertyDetailPage
            property={selectedProperty}
            isAuthenticated={isAuthenticated}
            onAuthRequired={handleAuthRequired}
            onBack={() => { setPage("buy"); setSelectedProperty(null); }}
            onReserved={(rec) => setReservations((prev) => {
              const exists = prev.find(r => r.id === rec.id);
              const next = exists ? prev : [rec, ...prev];
              saveStoredReservations(next, currentUser?.email);
              return next;
            })}
            onReservationFinished={() => {
              setPage("my-reservations");
              setSelectedProperty(null);
            }}
          />
        ) : page === "buy" ? (
          <BuyPage onSelectProperty={handleSelectProperty} />
        ) : page === "new-developments" ? (
          <NewDevelopmentsPage onSelectProperty={handleSelectProperty} />
        ) : page === "agents" ? (
          <AgentsPage />
        ) : page === "my-reservations" ? (
          <ReservationsDashboardPage
            reservations={reservations}
            currentUser={currentUser}
            onSelectProperty={handleSelectProperty}
            onBrowse={() => setPage("buy")}
            onCancel={(id) => setReservations((prev) => {
              const next = prev.filter((r) => r.id !== id);
              saveStoredReservations(next, currentUser?.email);
              return next;
            })}
          />
        ) : (
          <AboutPage setPage={setPage} />
        )}
      </main>

      {page !== "pdp" && page !== "my-reservations" && <Footer setPage={setPage} />}

      {authContext && (
        <AuthModal
          property={authContext.property}
          actionLabel={authContext.action}
          onClose={() => setAuthContext(null)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
}
