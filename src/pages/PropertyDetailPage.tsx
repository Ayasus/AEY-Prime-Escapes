import React, { useEffect, useRef, useState } from "react";
import { formatPriceFull, monthlyMortgage, type Property } from "../data";
import { Ic, Logo, StatusBadge } from "./common";

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

function ReservationModal({ property, onClose, onReserved }: {
  property: Property;
  onClose: () => void;
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
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Reserve This Property</h2>
                <p className="text-xs text-slate-500 mt-0.5">Choose how you want to secure this unit today.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 overflow-hidden flex gap-3 p-3">
                <img src={property.images[0]} alt={property.title} className="w-20 h-20 rounded-xl object-cover flex-shrink-0 bg-slate-200" />
                <div className="min-w-0">
                  <p className="font-bold text-navy text-sm">{property.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{property.city}</p>
                  <p className="text-base font-bold mt-1" style={{ color: "#D4A373" }}>{formatPriceFull(price)}</p>
                </div>
              </div>

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
                  <p className="text-[11px] text-slate-400">Due today ({downPct}% of total) · ₱{monthly.toLocaleString("en-PH")}/mo for {loanYears} yrs</p>
                </button>
              </div>

              {plan === "downpayment" && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-4 border border-slate-200">
                  <p className="text-xs font-bold text-navy uppercase tracking-widest">Loan Calculator</p>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-semibold text-navy">Down Payment</label>
                      <span className="text-sm font-bold text-navy">{downPct}% — {formatPriceFull(downPaymentAmt)}</span>
                    </div>
                    <input type="range" min={10} max={50} step={5} value={downPct} onChange={(e) => setDownPct(Number(e.target.value))}
                      className="w-full accent-navy h-1.5 rounded-full" />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-0.5"><span>10%</span><span>50%</span></div>
                  </div>
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
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Buyer Information</h2>
              {([['Full Name', 'name', 'text', 'Juan dela Cruz'], ['Email Address', 'email', 'email', 'juan@email.com'], ['Phone Number', 'phone', 'tel', '+63 9XX XXX XXXX']] as const).map(([label, key, type, ph]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-navy block mb-1.5">{label}</label>
                  <input type={type} value={form[key as keyof typeof form] as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={ph}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald transition" />
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Mode of Payment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select how you will pay <strong className="text-navy">{formatPriceFull(amtDueToday)}</strong> today.</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { id: "gcash", label: "GCash / Maya", desc: "Scan QR or send to 09708769224" },
                  { id: "bank", label: "Bank Transfer (InstaPay)", desc: "BDO · BPI · UnionBank supported" },
                  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard, JCB" },
                  { id: "cash", label: "Cash / Over the Counter", desc: "Visit our office to pay directly" },
                ].map(({ id, label, desc }) => (
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
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center mx-auto mb-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A373" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Reservation Confirmed!</h2>
              </div>
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
                  <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Total Property Price</span><span className="font-semibold">{formatPriceFull(price)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Amount Paid Today</span><span className="font-bold" style={{ color: "#D4A373" }}>{formatPriceFull(amtDueToday)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep((s) => s - 1)} className="px-4 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50 flex items-center gap-2">
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
      </div>
    </div>
  );
}

type ChatMsg = { from: "user" | "agent"; text: string; time: string };

function AgentChatModal({ agent, property, onClose }: {
  agent: Property["agent"];
  property: Property;
  onClose: () => void;
}) {
  const now = () => new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
  const greet: ChatMsg = { from: "agent", text: `Hi! I'm ${agent.name}. I can answer any questions about ${property.title}. How can I help you today?`, time: now() };
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
      </div>
    </div>
  );
}

export default function PropertyDetailPage({ property, isAuthenticated, onAuthRequired, onBack, onReserved }: {
  property: Property;
  isAuthenticated: boolean;
  onAuthRequired: (action: string) => void;
  onBack: () => void;
  onReserved?: (rec: ReservationRecord) => void;
}) {
  const [activeImg, setActiveImg] = useState(0);
  const [showReservation, setShowReservation] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  const amenityIcons: Record<string, React.ReactElement> = {
    "Garage (3-car)": <Ic.Car />, "Garage (1-car)": <Ic.Car />, "Garage (2-car)": <Ic.Car />, "Swimming Pool": <Ic.Pool />, "Infinity Pool": <Ic.Pool />, "24/7 Security": <Ic.Shield />, "Garden": <Ic.Tree />, "Backup Generator": <Ic.Zap />, "Gym": <Ic.Building />, "Concierge": <Ic.Building />, "Parking": <Ic.Car />, "Parking (2 slots)": <Ic.Car />, "Sky Lounge": <Ic.Building />, "Clean Title": <Ic.FileText />, "Clubhouse Access": <Ic.Building />, "Road Frontage": <Ic.Pin />, "Gated Community": <Ic.Shield />, "Ridge View": <Ic.Tree />, "Bay View": <Ic.Tree />, "Playground": <Ic.Tree />, "PEZA Accredited": <Ic.FileText />, "Fiber Internet Ready": <Ic.Wifi />, "Central A/C": <Ic.Zap />, "Backup Power": <Ic.Zap />, "Rooftop Lounge": <Ic.Building />, "EV Charging": <Ic.Zap />, "Smart Home": <Ic.Zap />, "Retail Podium": <Ic.Building />, "Shuttle Service": <Ic.Car />,
  };

  const monthly = monthlyMortgage(property.price);
  const isUnavailable = property.status === "Reserved" || property.status === "Sold";

  const handleRestricted = (action: string) => {
    if (!isAuthenticated) { onAuthRequired(action); return; }
    if (action === "Reserve This Property") setShowReservation(true);
  };

  return (
    <div className="min-h-screen bg-offwhite">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button onClick={onBack} className="flex items-center gap-2 text-navy font-semibold text-sm hover:text-emerald transition-colors mb-6">
          <Ic.ArrowLeft /> Back to Listings
        </button>

        <div className="grid grid-cols-3 gap-2 h-[380px] rounded-2xl overflow-hidden mb-8 relative">
          <div className="col-span-2 bg-slate-200 cursor-pointer" onClick={() => { setActiveImg(0); setShowAllPhotos(true); }}>
            <img src={property.images[0]} alt="Exterior" className="w-full h-full object-cover hover:brightness-95 transition" />
            <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-navy/70 text-white px-2 py-1 rounded-lg">Exterior</span>
          </div>
          <div className="grid grid-rows-2 gap-2">
            {[1, 2].map((i) => (
              <div key={i} className="relative bg-slate-200 cursor-pointer" onClick={() => { setActiveImg(i); setShowAllPhotos(true); }}>
                <img src={property.images[i]} alt={i === 1 ? "Interior" : "Bathroom"} className="w-full h-full object-cover hover:brightness-95 transition" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider bg-navy/70 text-white px-2 py-0.5 rounded-lg">
                  {i === 1 ? "Interior" : "Bathroom"}
                </span>
              </div>
            ))}
          </div>
          <button onClick={() => setShowAllPhotos(true)}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur text-navy text-xs font-semibold px-3 py-2 rounded-xl shadow hover:bg-white transition">
            <Ic.Photos /> View All 3 Photos
          </button>
        </div>

        {showAllPhotos && (
          <div className="fixed inset-0 z-50 bg-navy/95 flex flex-col">
            <div className="flex items-center justify-between p-4">
              <p className="text-white/60 text-sm">{activeImg + 1} / {property.images.length}</p>
              <button onClick={() => setShowAllPhotos(false)} className="text-white/60 hover:text-white"><Ic.X /></button>
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <img src={property.images[activeImg]} alt="" className="max-h-full max-w-full object-contain rounded-xl" />
            </div>
            <div className="flex gap-2 p-4 justify-center">
              {property.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)} className={`w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${activeImg === i ? "border-emerald" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          <div className="space-y-8">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1"><Ic.Pin />{property.address}, {property.city}</div>
                </div>
                <StatusBadge status={property.status} />
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-navy">{formatPriceFull(property.price)}</p>
                <p className="text-sm text-slate-500 mt-0.5">Est. <strong className="text-emerald">₱{Math.round(monthly).toLocaleString("en-PH")}/mo</strong> · 20% down · 20yr · 6.5% p.a.</p>
              </div>
              <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-100">
                {[
                  { label: "Type", value: property.type },
                  { label: "Lot Area", value: `${property.lotArea} m²` },
                  property.floorArea ? { label: "Floor Area", value: `${property.floorArea} m²` } : null,
                  property.beds !== null ? { label: "Bedrooms", value: String(property.beds) } : null,
                  property.baths !== null ? { label: "Bathrooms", value: String(property.baths) } : null,
                ].filter(Boolean).map((item) => (
                  <div key={(item as any).label} className="text-center bg-slate-50 rounded-xl px-5 py-3">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{(item as any).label}</p>
                    <p className="text-base font-bold text-navy mt-0.5">{(item as any).value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-navy mb-3" style={{ fontFamily: "var(--font-display)" }}>About This Property</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{property.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-navy mb-4" style={{ fontFamily: "var(--font-display)" }}>Amenities & Features</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-xl px-3 py-3">
                    <span className="text-emerald">{amenityIcons[a] ?? <Ic.Check />}</span>
                    <span className="text-sm text-navy font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <img src={property.agent.avatar} alt={property.agent.name} className="w-12 h-12 rounded-full object-cover bg-slate-200 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-navy text-sm">{property.agent.name}</p>
                    <p className="text-xs text-slate-500">{property.agent.agency}</p>
                    <p className="text-xs text-emerald flex items-center gap-1 mt-0.5"><Ic.Phone />{property.agent.phone}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => !isUnavailable && handleRestricted("Reserve This Property")}
                    disabled={isUnavailable}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${isUnavailable ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-emerald text-navy hover:bg-emerald-600"}`}>
                    {isUnavailable ? (property.status === "Reserved" ? "Currently Reserved" : "Sold") : "Reserve This Property"}
                  </button>
                  <button onClick={() => setShowChat(true)}
                    className="w-full py-3 rounded-xl border-2 border-slate-200 text-navy text-sm font-semibold hover:border-navy hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Chat with Agent
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-3 flex gap-2 shadow-xl">
        <button onClick={() => setShowChat(true)}
          className="flex-shrink-0 w-12 h-12 rounded-xl border-2 border-slate-200 text-navy flex items-center justify-center hover:bg-slate-50 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button onClick={() => !isUnavailable && handleRestricted("Reserve This Property")} disabled={isUnavailable}
          className={`flex-1 py-3 rounded-xl text-sm font-bold ${isUnavailable ? "bg-slate-200 text-slate-400" : "bg-emerald text-navy"}`}>
          {isUnavailable ? (property.status === "Reserved" ? "Currently Reserved" : "Sold") : "Reserve This Property"}
        </button>
      </div>

      {showReservation && <ReservationModal property={property} onClose={() => setShowReservation(false)} onReserved={onReserved} />}
      {showChat && <AgentChatModal agent={property.agent} property={property} onClose={() => setShowChat(false)} />}
    </div>
  );
}
