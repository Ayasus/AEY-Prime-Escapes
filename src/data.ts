export type PropertyStatus = "For Sale" | "Pre-Selling" | "Reserved" | "Sold" | "Under Negotiation";
export type PropertyType = "House" | "Condo" | "House & Lot" | "Lot" | "Commercial";

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  price: number;
  status: PropertyStatus;
  type: PropertyType;
  beds: number | null;
  baths: number | null;
  lotArea: number;
  floorArea: number | null;
  images: string[];     // exactly 3: [exterior, interior, bathroom]
  amenities: string[];
  agent: { name: string; phone: string; agency: string; avatar: string };
  description: string;
  isNewDevelopment?: boolean;
  completionDate?: string;
}

export interface Agent {
  id: string;
  name: string;
  title: string;
  agency: string;
  phone: string;
  email: string;
  avatar: string;
  yearsExp: number;
  bio: string;
}

const PHONE = "09708769224";

export const AGENTS: Agent[] = [
  {
    id: "a1", name: "Maria Santos", title: "Senior Property Consultant",
    agency: "AEY Prime Escapes", phone: PHONE, email: "m.santos@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&auto=format",
    yearsExp: 12,
    bio: "Maria has been matching families with their dream homes across the South since 2012. Specializing in Alabang Hills and Filinvest communities, she brings unmatched local market insight and a client-first philosophy.",
  },
  {
    id: "a2", name: "Carlo Reyes", title: "Investment Property Specialist",
    agency: "AEY Prime Escapes", phone: PHONE, email: "c.reyes@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format",
    yearsExp: 9,
    bio: "Carlo focuses on high-ROI condo investments in the Metro Manila CBD corridor. His deep relationships with Ayala Land and Federal Land give clients early access to pre-selling launches before public release.",
  },
  {
    id: "a3", name: "Grace Lim", title: "Residential Sales Consultant",
    agency: "AEY Prime Escapes", phone: PHONE, email: "g.lim@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format",
    yearsExp: 7,
    bio: "Grace guides first-time buyers through every step of the purchase process — from property search to title transfer. Her patience, clarity, and deep Calabarzon knowledge make her the go-to agent for growing families.",
  },
  {
    id: "a4", name: "Ben Aquino", title: "Land & Commercial Broker",
    agency: "AEY Prime Escapes", phone: PHONE, email: "b.aquino@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format",
    yearsExp: 14,
    bio: "With over a decade brokering raw land and commercial assets, Ben has an encyclopedic knowledge of zoning regulations, title processes, and land valuations from Tagaytay to the Bicol region.",
  },
  {
    id: "a5", name: "Diana Cruz", title: "Corporate & Office Specialist",
    agency: "AEY Prime Escapes", phone: PHONE, email: "d.cruz@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&auto=format",
    yearsExp: 8,
    bio: "Diana works exclusively with corporate clients seeking PEZA-accredited and BPO-ready office spaces in Metro Manila's premier business districts. Former investment banker turned real estate advisor.",
  },
  {
    id: "a6", name: "Marco dela Torre", title: "Property Investment Advisor",
    agency: "AEY Prime Escapes", phone: PHONE, email: "m.delatorre@aeyprime.ph",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
    yearsExp: 6,
    bio: "Marco specializes in the Manila Bay corridor — from Pasay to Parañaque — and is the resident expert on short-term rental investment strategies for condominiums near the airport and entertainment district.",
  },
];

// 3 images per property: [exterior/type, interior living, bathroom]
export const PROPERTIES: Property[] = [
  {
    id: "p1", title: "The Caldwell Residence",
    address: "24 Wisteria Lane, Alabang Hills Village", city: "Muntinlupa, Metro Manila",
    price: 28500000, status: "For Sale", type: "House", beds: 5, baths: 4, lotArea: 420, floorArea: 380,
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Garage (3-car)", "Swimming Pool", "24/7 Security", "Clean Title", "Garden", "Backup Generator"],
    agent: AGENTS[0] as any,
    description: "A commanding five-bedroom residence set within the prestigious Alabang Hills Village. Designed for families who value privacy, security, and space, the Caldwell Residence features a three-car garage, resort-style pool, and fully landscaped garden. Clean title, ready for occupancy.",
  },
  {
    id: "p2", title: "Skyline Tower Unit 38B",
    address: "38/F Skyline Tower, Kalayaan Ave", city: "Makati, Metro Manila",
    price: 9800000, status: "Pre-Selling", type: "Condo", beds: 2, baths: 2, lotArea: 72, floorArea: 72,
    images: [
      "https://images.unsplash.com/photo-1722421492323-eaf9c401befe?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Infinity Pool", "Gym", "24/7 Security", "Concierge", "Sky Lounge", "Parking"],
    agent: AGENTS[1] as any,
    description: "Perched on the 38th floor of Skyline Tower, Unit 38B commands sweeping views of the Makati skyline and Manila Bay. Pre-selling now — lock in at today's price before turnover in Q4 2026.",
    isNewDevelopment: true, completionDate: "Q4 2026",
  },
  {
    id: "p3", title: "Verdana Park House & Lot",
    address: "Block 7 Lot 12, Verdana Park Subdivision", city: "Laguna, Calabarzon",
    price: 6200000, status: "For Sale", type: "House & Lot", beds: 3, baths: 2, lotArea: 180, floorArea: 120,
    images: [
      "https://images.unsplash.com/photo-1670589953882-b94c9cb380f5?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Garage (1-car)", "24/7 Security", "Clean Title", "Clubhouse Access", "Playground"],
    agent: AGENTS[2] as any,
    description: "An ideal starter home tucked inside the master-planned Verdana Park community. Featuring three bedrooms, a covered garage, and direct access to the clubhouse and playground — all within a 24-hour secured subdivision.",
  },
  {
    id: "p4", title: "Tagaytay Ridge Lot 44",
    address: "Lot 44, Tagaytay Ridge Estates", city: "Tagaytay, Cavite",
    price: 4750000, status: "For Sale", type: "Lot", beds: null, baths: null, lotArea: 300, floorArea: null,
    images: [
      "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Clean Title", "Ridge View", "Road Frontage", "Gated Community"],
    agent: AGENTS[3] as any,
    description: "A rare 300 sqm ridge lot with panoramic views of Taal Lake and Volcano. Clean title, road-fronting, and ready for your dream home design. One of only 8 remaining lots in this exclusive gated estate.",
  },
  {
    id: "p5", title: "BGC Commerce Center Unit 5A",
    address: "5/F Commerce Center, 26th St. cor 5th Ave", city: "Bonifacio Global City, Taguig",
    price: 42000000, status: "For Sale", type: "Commercial", beds: null, baths: 2, lotArea: 210, floorArea: 210,
    images: [
      "https://images.unsplash.com/photo-1679364297777-1db77b6199be?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["24/7 Security", "PEZA Accredited", "Fiber Internet Ready", "Central A/C", "Backup Power", "Parking (2 slots)"],
    agent: AGENTS[4] as any,
    description: "A premium 210 sqm office unit in the heart of BGC's financial district. PEZA-accredited with provisions for high-speed fiber, central air conditioning, and two dedicated parking slots. Ideal for corporate headquarters or professional services.",
  },
  {
    id: "p6", title: "Serena Cove Unit 12C",
    address: "12/F Serena Cove Residences, Roxas Blvd", city: "Pasay, Metro Manila",
    price: 7350000, status: "Reserved", type: "Condo", beds: 1, baths: 1, lotArea: 48, floorArea: 48,
    images: [
      "https://images.unsplash.com/photo-1706855203772-c249b75fe016?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Bay View", "Gym", "Swimming Pool", "Concierge", "Parking"],
    agent: AGENTS[5] as any,
    description: "Bay-facing studio-plus unit with unobstructed Manila Bay views. Already reserved — join the waitlist to be first notified if the reservation lapses.",
  },
  {
    id: "p7", title: "Nuvali Green Rise Tower A",
    address: "Tower A, Nuvali Green Rise, Sta. Rosa", city: "Sta. Rosa, Laguna",
    price: 5400000, status: "Pre-Selling", type: "Condo", beds: 1, baths: 1, lotArea: 36, floorArea: 36,
    images: [
      "https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Swimming Pool", "Gym", "24/7 Security", "Shuttle Service", "Retail Podium"],
    agent: AGENTS[2] as any,
    description: "Nuvali Green Rise is a transit-oriented development designed for young professionals seeking a live-work-play lifestyle south of Manila. Tower A units are now open for pre-selling with flexible payment terms.",
    isNewDevelopment: true, completionDate: "Q2 2027",
  },
  {
    id: "p8", title: "Eastwood Grand Lofts Ph. 2",
    address: "Eastwood Grand Lofts, Eastwood City", city: "Quezon City, Metro Manila",
    price: 18900000, status: "Pre-Selling", type: "Condo", beds: 3, baths: 3, lotArea: 145, floorArea: 145,
    images: [
      "https://images.unsplash.com/photo-1670589953882-b94c9cb380f5?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Rooftop Lounge", "Infinity Pool", "24/7 Security", "EV Charging", "Concierge", "Smart Home"],
    agent: AGENTS[1] as any,
    description: "Phase 2 of the award-winning Eastwood Grand Lofts. Double-height living spaces, panoramic city views, and smart-home pre-wiring in every unit. Only 48 loft units available in this final phase.",
    isNewDevelopment: true, completionDate: "Q1 2028",
  },
  // ── Additional listings ──────────────────────────────────────────────────
  {
    id: "p9", title: "Hacienda Verde Farm Estate",
    address: "Km 52, Sta. Cruz, Laguna", city: "Sta. Cruz, Laguna",
    price: 8900000, status: "For Sale", type: "House & Lot", beds: 4, baths: 3, lotArea: 1200, floorArea: 220,
    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Farm Lot", "Clean Title", "Road Frontage", "Fruit Trees", "Water Source", "Backup Generator"],
    agent: AGENTS[3] as any,
    description: "A 1,200 sqm farm estate with a 4-bedroom main house, productive fruit trees, and a natural water source. Ideal as a weekend retreat or agri-tourism investment just off the highway.",
  },
  {
    id: "p10", title: "The Peninsula Residences 7A",
    address: "7/F Peninsula Tower, Bay City", city: "Paranaque, Metro Manila",
    price: 14200000, status: "For Sale", type: "Condo", beds: 2, baths: 2, lotArea: 98, floorArea: 98,
    images: [
      "https://images.unsplash.com/photo-1706855203772-c249b75fe016?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Bay View", "Infinity Pool", "Gym", "Concierge", "Parking", "Smart Home"],
    agent: AGENTS[5] as any,
    description: "A spacious 2-bedroom unit with unobstructed Manila Bay views from the 7th floor. Fully furnished option available. Walking distance to the Entertainment City complex and NAIA terminals.",
  },
  {
    id: "p11", title: "Cavite Beachfront Lot",
    address: "Lot 3, Sunrise Cove Estates, Naic", city: "Naic, Cavite",
    price: 3200000, status: "For Sale", type: "Lot", beds: null, baths: null, lotArea: 240, floorArea: null,
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Beach Front", "Clean Title", "Road Frontage", "Gated Community"],
    agent: AGENTS[3] as any,
    description: "A rare 240 sqm beachfront lot inside a secured subdivision. White sand shoreline, gentle waves, and a two-hour drive from Metro Manila. Ideal for a rest house or boutique resort development.",
  },
  {
    id: "p12", title: "Mandaluyong Flex Office Suite",
    address: "12/F The Edgewater Center, Shaw Blvd", city: "Mandaluyong, Metro Manila",
    price: 19500000, status: "For Sale", type: "Commercial", beds: null, baths: 2, lotArea: 160, floorArea: 160,
    images: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Fiber Internet Ready", "Central A/C", "24/7 Security", "CCTV", "Backup Power", "Parking (2 slots)"],
    agent: AGENTS[4] as any,
    description: "A 160 sqm plug-and-play office suite on the 12th floor of The Edgewater Center. Glass-walled meeting rooms, dedicated server room, and two parking slots included. Perfect for growing tech or professional services firms.",
  },
  {
    id: "p13", title: "Antipolo Hills Townhouse",
    address: "Block 4 Lot 8, Marigold Hills", city: "Antipolo, Rizal",
    price: 4100000, status: "Pre-Selling", type: "House & Lot", beds: 3, baths: 2, lotArea: 80, floorArea: 100,
    images: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Garage (1-car)", "24/7 Security", "Clubhouse Access", "Mountain View", "Playground"],
    agent: AGENTS[2] as any,
    description: "A brand-new 3-bedroom townhouse with mountain views in the cool uplands of Antipolo. Pre-selling at introductory pricing with flexible payment terms — just 20 minutes from Ortigas Center.",
    isNewDevelopment: true, completionDate: "Q3 2026",
  },
  {
    id: "p14", title: "Cebu IT Park Studio Loft",
    address: "14/F Skyrise 4B, Archbishop Reyes Ave", city: "Cebu City, Cebu",
    price: 4850000, status: "For Sale", type: "Condo", beds: 1, baths: 1, lotArea: 38, floorArea: 38,
    images: [
      "https://images.unsplash.com/photo-1721815693498-cc28507c0ba2?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["City View", "Gym", "Swimming Pool", "24/7 Security", "Concierge"],
    agent: AGENTS[1] as any,
    description: "A high-floor studio loft overlooking Cebu IT Park — the island's premier BPO and lifestyle district. Fully fitted with high ceilings, built-in storage, and a modern kitchen. Excellent rental yield potential.",
  },
  {
    id: "p15", title: "Filinvest Alabang Corner House",
    address: "35 Acacia Ave, Filinvest Alabang", city: "Muntinlupa, Metro Manila",
    price: 18000000, status: "For Sale", type: "House", beds: 4, baths: 3, lotArea: 280, floorArea: 260,
    images: [
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Garage (2-car)", "Swimming Pool", "24/7 Security", "Garden", "Clean Title", "Backup Generator"],
    agent: AGENTS[0] as any,
    description: "A well-maintained corner-lot house inside the prestigious Filinvest Alabang enclave. Renovated kitchen and master bath, tree-lined street frontage, and a private pool. Ready for move-in.",
  },
  {
    id: "p16", title: "Pampanga Commercial Lot",
    address: "MacArthur Highway, Dau", city: "Mabalacat, Pampanga",
    price: 11500000, status: "For Sale", type: "Lot", beds: null, baths: null, lotArea: 800, floorArea: null,
    images: [
      "https://images.unsplash.com/photo-1628012209120-d9db7abf7eab?w=1200&h=800&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=800&h=600&fit=crop&auto=format",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&auto=format",
    ],
    amenities: ["Highway Frontage", "Clean Title", "Flood-Free", "Commercial Zone"],
    agent: AGENTS[3] as any,
    description: "An 800 sqm highway-fronting commercial lot along MacArthur Highway in Dau, Pampanga — one of Luzon's fastest-growing commercial corridors. Zoned commercial, no easement issues, clean title.",
  },
];

const AVAILABLE_PROPERTIES = PROPERTIES.filter((property) => property.status !== "Reserved" && property.status !== "Sold");

export const CATEGORY_COUNTS: Record<string, number> = {
  All: AVAILABLE_PROPERTIES.length,
  House: AVAILABLE_PROPERTIES.filter((property) => property.type === "House").length,
  Condo: AVAILABLE_PROPERTIES.filter((property) => property.type === "Condo").length,
  "House & Lot": AVAILABLE_PROPERTIES.filter((property) => property.type === "House & Lot").length,
  Lot: AVAILABLE_PROPERTIES.filter((property) => property.type === "Lot").length,
  Commercial: AVAILABLE_PROPERTIES.filter((property) => property.type === "Commercial").length,
};

export function formatPrice(p: number) {
  if (p >= 1_000_000) return `₱${(p / 1_000_000).toFixed(1)}M`;
  if (p >= 1_000) return `₱${(p / 1_000).toFixed(0)}K`;
  return `₱${p.toLocaleString()}`;
}

export function formatPriceFull(p: number) {
  return `₱${p.toLocaleString("en-PH")}`;
}

export function monthlyMortgage(price: number, downPct = 0.2, years = 20, rate = 0.065) {
  const principal = price * (1 - downPct);
  const r = rate / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
