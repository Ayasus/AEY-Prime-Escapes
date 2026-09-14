import React, { useState } from "react";
import { PROPERTIES, CATEGORY_COUNTS, formatPrice, formatPriceFull, type Property } from "../data";
import { Ic, StatusBadge } from "./common";

interface FilterState {
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  beds: string;
  baths: string;
}

const defaultFilters: FilterState = { minPrice: 0, maxPrice: 100_000_000, minArea: 0, maxArea: 2000, beds: "Any", baths: "Any" };

function PropertyCard({ property, onClick }: { property: Property; onClick: () => void }) {
  const [saved, setSaved] = useState(false);
  const isReserved = property.status === "Reserved" || property.status === "Sold";

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="relative overflow-hidden bg-slate-200 aspect-[4/3]">
        <img
          src={property.images[0]}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isReserved ? "grayscale-[30%]" : ""}`}
        />
        {isReserved && <div className="absolute inset-0 bg-navy/20" />}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          <StatusBadge status={property.status} />
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy/80 text-white">{property.type}</span>
        </div>
        {property.isNewDevelopment && (
          <div className="absolute bottom-3 left-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blush text-navy">New Dev · {property.completionDate}</span>
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setSaved(!saved); }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${saved ? "bg-emerald text-navy" : "bg-white/90 text-slate-600 hover:bg-white"}`}
        >
          <Ic.Bookmark filled={saved} />
        </button>
      </div>
      <div className="p-4">
        <p className="text-xl font-bold text-navy leading-tight">{formatPrice(property.price)}</p>
        <p className="text-sm font-semibold text-navy mt-0.5 line-clamp-1">{property.title}</p>
        <div className="flex items-center gap-1 text-slate-500 text-xs mt-1">
          <Ic.Pin /><span className="line-clamp-1">{property.city}</span>
        </div>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-slate-500 text-xs">
          {property.beds !== null && <span className="flex items-center gap-1"><Ic.Bed />{property.beds} Beds</span>}
          {property.baths !== null && <span className="flex items-center gap-1"><Ic.Bath />{property.baths} Baths</span>}
          <span className="flex items-center gap-1"><Ic.Area />{property.lotArea} m²</span>
        </div>
      </div>
    </div>
  );
}

function FilterDrawer({ open, onClose, filters, setFilters }: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}) {
  const [local, setLocal] = useState<FilterState>(filters);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Filters</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><Ic.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          <div>
            <label className="text-sm font-semibold text-navy block mb-3">Price Range</label>
            <div className="flex gap-3">
              {(["minPrice", "maxPrice"] as const).map((k) => (
                <div key={k} className="flex-1">
                  <span className="text-xs text-slate-500 block mb-1">{k === "minPrice" ? "Min" : "Max"}</span>
                  <input type="number" value={local[k]} onChange={(e) => setLocal({ ...local, [k]: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-navy block mb-3">Lot Area (m²)</label>
            <div className="flex gap-3">
              {(["minArea", "maxArea"] as const).map((k) => (
                <div key={k} className="flex-1">
                  <span className="text-xs text-slate-500 block mb-1">{k === "minArea" ? "Min" : "Max"}</span>
                  <input type="number" value={local[k]} onChange={(e) => setLocal({ ...local, [k]: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
                </div>
              ))}
            </div>
          </div>
          {[{ label: "Bedrooms", key: "beds", opts: ["Any", "1", "2", "3", "4", "5+"] }, { label: "Bathrooms", key: "baths", opts: ["Any", "1", "2", "3", "4+"] }].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="text-sm font-semibold text-navy block mb-3">{label}</label>
              <div className="flex gap-2">
                {opts.map((v) => (
                  <button key={v} onClick={() => setLocal({ ...local, [key]: v })}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${(local as any)[key] === v ? "bg-navy text-white border-navy" : "bg-white text-slate-600 border-slate-200 hover:border-navy"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={() => setLocal(defaultFilters)} className="flex-1 py-3 rounded-xl border border-slate-200 text-navy text-sm font-semibold hover:bg-slate-50">Reset</button>
          <button onClick={() => { setFilters(local); onClose(); }} className="flex-1 py-3 rounded-xl bg-emerald text-navy text-sm font-semibold hover:bg-emerald-600">Apply</button>
        </div>
      </div>
    </div>
  );
}

export default function BuyPage({ onSelectProperty }: { onSelectProperty: (p: Property) => void }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchLocation, setSearchLocation] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const categories = ["All", "House", "Condo", "House & Lot", "Lot", "Commercial"];
  const categoryImages: Record<string, string> = {
    House: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=280&fit=crop&auto=format",
    Condo: "https://images.unsplash.com/photo-1722421492323-eaf9c401befe?w=400&h=280&fit=crop&auto=format",
    "House & Lot": "https://images.unsplash.com/photo-1670589953882-b94c9cb380f5?w=400&h=280&fit=crop&auto=format",
    Lot: "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?w=400&h=280&fit=crop&auto=format",
    Commercial: "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=400&h=280&fit=crop&auto=format",
  };

  const filtered = PROPERTIES.filter((p) => {
    if (activeCategory !== "All" && p.type !== activeCategory) return false;
    if (p.price < filters.minPrice || p.price > filters.maxPrice) return false;
    if (p.lotArea < filters.minArea || p.lotArea > filters.maxArea) return false;
    if (filters.beds !== "Any" && p.beds !== null) {
      if (filters.beds === "5+" ? p.beds < 5 : p.beds !== Number(filters.beds)) return false;
    }
    if (searchLocation && !p.city.toLowerCase().includes(searchLocation.toLowerCase()) && !p.address.toLowerCase().includes(searchLocation.toLowerCase())) return false;
    return true;
  });

  const activeFiltersCount = [filters.minPrice > 0 || filters.maxPrice < 100_000_000, filters.minArea > 0 || filters.maxArea < 2000, filters.beds !== "Any", filters.baths !== "Any"].filter(Boolean).length;

  return (
    <>
      <section className="relative bg-navy overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1748063578185-3d68121b11ff?w=1600&h=700&fit=crop&auto=format" alt="Hero" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/80 to-navy" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
          <p className="text-emerald text-sm font-semibold uppercase tracking-widest mb-3">{CATEGORY_COUNTS.All.toLocaleString()} Properties Available</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Find Your Next<br /><em>Dream Property</em>
          </h1>
          <p className="text-white/60 text-base mb-8">Search across Metro Manila, Cavite, Laguna, and beyond.</p>
          <div className="bg-white rounded-2xl shadow-2xl p-3">
            <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat ? "bg-navy text-white" : "text-slate-500 hover:bg-slate-50 hover:text-navy"}`}>
                  {cat} <span className={`ml-1 text-xs ${activeCategory === cat ? "text-white/60" : "text-slate-400"}`}>{CATEGORY_COUNTS[cat]}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Ic.Pin /></span>
                <input type="text" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="City, subdivision, or address"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald" />
              </div>
              <button onClick={() => setFilterOpen(true)} className="relative flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:border-navy transition-colors">
                <Ic.Filter /> Filters
                {activeFiltersCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald text-navy text-[9px] font-bold flex items-center justify-center">{activeFiltersCount}</span>}
              </button>
              <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald text-navy text-sm font-bold hover:bg-emerald-600">
                <Ic.Search /> Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-14 pb-4">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>Browse by Type</h2>
          <span className="text-sm font-semibold flex items-center gap-1" style={{ color: "#D4A373" }}>All categories <Ic.ChevronRight /></span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(categoryImages).map(([cat, img]) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`group relative rounded-2xl overflow-hidden aspect-[4/3] border-2 transition-all ${activeCategory === cat ? "border-emerald" : "border-transparent"}`}>
              <img src={img} alt={cat} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className="text-white font-bold text-sm">{cat}</p>
                <p className="text-white/70 text-xs">{CATEGORY_COUNTS[cat]} listings</p>
              </div>
              {activeCategory === cat && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald flex items-center justify-center"><Ic.Check /></div>}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy" style={{ fontFamily: "var(--font-display)" }}>
              {activeCategory === "All" ? "Featured Listings" : `${activeCategory} Properties`}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} properties found</p>
          </div>
          <select className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald bg-white">
            <option>Newest First</option><option>Price: Low to High</option><option>Price: High to Low</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Ic.Building />
            <p className="font-semibold text-lg text-slate-600">No properties match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => <PropertyCard key={p.id} property={p} onClick={() => onSelectProperty(p)} />)}
          </div>
        )}
      </section>

      <FilterDrawer open={filterOpen} onClose={() => setFilterOpen(false)} filters={filters} setFilters={setFilters} />
    </>
  );
}
