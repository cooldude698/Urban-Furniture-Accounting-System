import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Scale, 
  Layers, 
  ReceiptText, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { ChairIcon } from '../components/ui/BrandLogo';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleEnterPortal = () => {
    navigate('/login');
  };

  return (
    <div className="landing-root min-h-screen bg-[#F9F2E4] text-[#4A3A34] font-sans selection:bg-[#D0AE92] selection:text-[#4A3A34] relative overflow-x-hidden">
      {/* ── Top Navigation Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full bg-[#F9F2E4]/90 backdrop-blur-md border-b border-[#D0AE92]/40 px-6 sm:px-10 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4A3A34] text-[#F9F2E4] flex items-center justify-center shadow-sm">
              <ChairIcon size={24} color="#F9F2E4" />
            </div>
            <div>
              <span className="font-display font-bold tracking-tight text-lg text-[#4A3A34] block leading-none">
                URBAN FURNITURE
              </span>
              <span className="text-[10px] font-mono tracking-wider text-[#77574A] uppercase block mt-1">
                Accounting & Management ERP
              </span>
            </div>
          </div>

          <button
            onClick={handleEnterPortal}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4A3A34] text-[#F9F2E4] font-medium text-sm hover:bg-[#5E453A] active:scale-[0.98] transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#77574A] focus:ring-offset-2 focus:ring-offset-[#F9F2E4]"
            aria-label="Enter to the Portal"
          >
            <span>ENTER TO THE PORTAL</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* ── Main Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 sm:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Hero Left: Copy & Primary CTA */}
          <div className="lg:col-span-6 z-10 flex flex-col justify-between hero-text-reveal">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-[#4A3A34] leading-[1.15] mb-4">
                Run Your Furniture Business.{' '}
                <span className="text-[#77574A] block mt-1">
                  Keep Every Transaction in Balance.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#5E453A] leading-relaxed mb-6 max-w-lg">
                An all-in-one system that brings your orders, inventory, customer billing, and accounting together in one simple, unified place.
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                <button
                  onClick={handleEnterPortal}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#4A3A34] text-[#F9F2E4] font-semibold text-sm sm:text-base hover:bg-[#5E453A] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#77574A] focus:ring-offset-2 focus:ring-offset-[#F9F2E4]"
                >
                  <span>ENTER TO THE PORTAL</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <p className="text-xs font-mono text-[#77574A] mt-2.5 tracking-wide flex items-center gap-1.5">
                <span>✦</span> Internal ERP & Customer Portal Access
              </p>
            </div>

            {/* Invariant highlight pill */}
            <div className="mt-8 pt-5 border-t border-[#D0AE92]/50 w-full grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-mono text-[#77574A] block uppercase">Ledger Rule</span>
                <span className="text-sm font-semibold text-[#4A3A34]">Debit ≡ Credit</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[#77574A] block uppercase">Recognition</span>
                <span className="text-sm font-semibold text-[#4A3A34]">Invoice Posting</span>
              </div>
              <div>
                <span className="text-xs font-mono text-[#77574A] block uppercase">Valuation</span>
                <span className="text-sm font-semibold text-[#4A3A34]">Real-time Costing</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Crafted Furniture Showroom Composition (Scalable SVG) */}
          <div className="lg:col-span-6 relative flex hero-furniture-reveal">
            <div className="w-full h-full min-h-[380px] lg:min-h-[420px] relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-b from-[#FAF5EE] to-[#F2E8DA] border border-[#D0AE92]/60 p-4 sm:p-6 flex items-center justify-center">
              
              {/* Showroom Ambient Glow */}
              <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-[#EBD7BE]/40 blur-3xl pointer-events-none" />
              
              {/* Authentic Furniture Showroom Vector Artwork */}
              <svg
                viewBox="0 0 600 480"
                className="w-full h-full object-contain furniture-scene-svg"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Urban Furniture Showroom Display: Solid Walnut Table, Mid-Century Chair, Credenza and Lamp"
              >
                <defs>
                  {/* Wood Grain & Gradient Shading */}
                  <linearGradient id="walnutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#5E453A" />
                    <stop offset="50%" stopColor="#4A3A34" />
                    <stop offset="100%" stopColor="#3B2D27" />
                  </linearGradient>

                  <linearGradient id="walnutLightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#77574A" />
                    <stop offset="100%" stopColor="#5E453A" />
                  </linearGradient>

                  <linearGradient id="fabricCushionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F5ECE0" />
                    <stop offset="100%" stopColor="#E2CEB7" />
                  </linearGradient>

                  <linearGradient id="wallSlatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#E3CCA9" />
                    <stop offset="50%" stopColor="#D4BA92" />
                    <stop offset="100%" stopColor="#C5A87B" />
                  </linearGradient>

                  <linearGradient id="lampConeGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                    <stop offset="0%" stopColor="#FFF9EB" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#FAF5EE" stopOpacity="0.0" />
                  </linearGradient>

                  <radialGradient id="floorShadow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4A3A34" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#4A3A34" stopOpacity="0.0" />
                  </radialGradient>
                </defs>

                {/* ── Background Architectural Elements ── */}
                {/* Fluted timber wall slats (left background accent) */}
                <g opacity="0.85">
                  {[...Array(14)].map((_, i) => (
                    <rect
                      key={i}
                      x={30 + i * 14}
                      y={40}
                      width={8}
                      height={280}
                      rx={2}
                      fill="url(#wallSlatGrad)"
                    />
                  ))}
                  {/* Subtle top trim */}
                  <rect x={26} y={36} width={204} height={6} rx={2} fill="#77574A" opacity="0.7" />
                </g>

                {/* Showroom Wall Molding line */}
                <line x1="20" y1="360" x2="580" y2="360" stroke="#D0AE92" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />
                
                {/* Floor Shadow Base */}
                <ellipse cx="300" cy="425" rx="260" ry="30" fill="url(#floorShadow)" />
                <ellipse cx="440" cy="420" rx="110" ry="18" fill="url(#floorShadow)" />
                <ellipse cx="160" cy="420" rx="100" ry="16" fill="url(#floorShadow)" />

                {/* ── Element 1: Sculptural Credenza / Sideboard (Back Left) ── */}
                <g id="credenza" className="furniture-item-credenza">
                  {/* Shadow */}
                  <ellipse cx="140" cy="385" rx="90" ry="12" fill="url(#floorShadow)" />
                  {/* Credenza Body */}
                  <rect x={60} y={260} width={160} height={100} rx={6} fill="url(#walnutLightGrad)" />
                  {/* Tambour Fluted lines on cabinet door */}
                  {[...Array(10)].map((_, i) => (
                    <line
                      key={i}
                      x1={72 + i * 7}
                      y1={266}
                      x2={72 + i * 7}
                      y2={354}
                      stroke="#4A3A34"
                      strokeWidth="1.5"
                      opacity="0.4"
                    />
                  ))}
                  {/* Right smooth door */}
                  <rect x={148} y={266} width={66} height={88} rx={3} fill="#5E453A" />
                  {/* Brass pill handles */}
                  <rect x={138} y={302} width={3} height={16} rx={1.5} fill="#D0AE92" />
                  <rect x={154} y={302} width={3} height={16} rx={1.5} fill="#D0AE92" />
                  {/* Tapered Legs */}
                  <polygon points="76,360 84,360 81,385 73,385" fill="#4A3A34" />
                  <polygon points="204,360 212,360 215,385 207,385" fill="#4A3A34" />
                  
                  {/* Ceramic decorative vase on credenza */}
                  <path d="M 175 260 Q 170 240 180 220 Q 186 210 188 210 Q 190 210 196 220 Q 206 240 201 260 Z" fill="#F9F2E4" stroke="#D0AE92" strokeWidth="1" />
                  {/* Minimalist dried branch */}
                  <path d="M 188 210 Q 192 180 205 160 M 195 185 Q 212 178 220 182" stroke="#77574A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                </g>

                {/* ── Element 2: Solid Walnut Dining Table (Centerpiece) ── */}
                <g id="dining-table" className="furniture-item-table">
                  {/* Table Shadow */}
                  <ellipse cx="330" cy="415" rx="160" ry="20" fill="url(#floorShadow)" />
                  
                  {/* Rear Legs */}
                  <polygon points="210,310 220,310 214,405 204,405" fill="#3B2D27" opacity="0.9" />
                  <polygon points="440,310 450,310 444,405 434,405" fill="#3B2D27" opacity="0.9" />

                  {/* Table Apron Structure */}
                  <rect x={206} y={306} width={248} height={14} fill="#4A3A34" />

                  {/* Front Angled Tapered Legs */}
                  <polygon points="228,312 240,312 232,416 220,416" fill="url(#walnutGrad)" />
                  <polygon points="420,312 432,312 440,416 428,416" fill="url(#walnutGrad)" />

                  {/* Solid Walnut Tabletop (Subtle Beveled Edge) */}
                  <path
                    d="M 170 306 Q 166 304 175 300 L 475 300 Q 484 304 480 306 L 470 312 Q 465 314 455 314 L 195 314 Q 185 314 180 312 Z"
                    fill="url(#walnutGrad)"
                    stroke="#77574A"
                    strokeWidth="0.75"
                  />
                  {/* Top Surface Light Reflection / Grain Sheen */}
                  <polygon points="178,301 472,301 465,308 185,308" fill="#77574A" opacity="0.3" />
                </g>

                {/* ── Element 3: Sculptural Mid-Century Lounge Chair (Right Foreground) ── */}
                <g id="lounge-chair" className="furniture-item-chair">
                  {/* Chair Shadow */}
                  <ellipse cx="440" cy="425" rx="65" ry="15" fill="url(#floorShadow)" />

                  {/* Rear Wood Legs */}
                  <polygon points="465,360 472,360 482,422 475,422" fill="#3B2D27" />
                  
                  {/* Front Wood Leg */}
                  <polygon points="398,360 405,360 395,422 388,422" fill="#5E453A" />
                  
                  {/* Deep Comfort Seat Cushion */}
                  <path
                    d="M 390 352 C 390 340, 480 340, 480 352 C 480 368, 390 368, 390 352 Z"
                    fill="url(#fabricCushionGrad)"
                    stroke="#D0AE92"
                    strokeWidth="1.5"
                  />

                  {/* Curved Ergonomic Backrest */}
                  <path
                    d="M 450 280 C 490 280, 488 348, 470 354 C 455 354, 442 320, 440 290 C 440 282, 444 280, 450 280 Z"
                    fill="url(#fabricCushionGrad)"
                    stroke="#D0AE92"
                    strokeWidth="1.5"
                  />

                  {/* Sculptural Bentwood Armrest */}
                  <path
                    d="M 405 344 C 400 326, 420 315, 455 312 L 460 318 C 430 320, 412 330, 415 346 Z"
                    fill="url(#walnutGrad)"
                  />
                </g>

                {/* ── Element 4: Arched Brass Floor Lamp (Left Accent) ── */}
                <g id="floor-lamp" className="furniture-item-lamp">
                  {/* Cone of Warm Light */}
                  <polygon points="110,135 40,380 180,380" fill="url(#lampConeGrad)" />

                  {/* Heavy Marble / Cast Base */}
                  <ellipse cx="110" cy="405" rx="22" ry="7" fill="#4A3A34" />
                  
                  {/* Graceful Arch Stem */}
                  <path
                    d="M 110 405 C 110 240, 110 120, 155 90 C 170 80, 185 85, 185 105 L 180 125"
                    fill="none"
                    stroke="#77574A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Conical Lamp Shade */}
                  <polygon points="172,124 188,124 198,142 162,142" fill="#FAF5EE" stroke="#D0AE92" strokeWidth="1.5" />
                  {/* Warm Glowing Bulb inside */}
                  <circle cx="180" cy="140" r="5" fill="#FFF1D0" />
                </g>
              </svg>

              {/* Showroom Floating Tag */}
              <div className="absolute bottom-4 left-6 bg-[#FAF5EE]/95 backdrop-blur-sm border border-[#D0AE92]/80 px-3 py-1.5 rounded-md shadow-sm">
                <span className="text-[11px] font-mono text-[#4A3A34] font-medium tracking-wide flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5F7052]"></span>
                  Walnut Series • Solid Wood ERP
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Below-the-fold: Connected ERP Data Flow ─────────────────────── */}
      <section className="bg-[#FAF5EE] border-t border-[#D0AE92]/50 py-20 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBD7BE]/80 text-xs font-mono font-medium text-[#77574A] mb-3">
              END-TO-END BUSINESS INTEGRATION
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#4A3A34]">
              EVERY BUSINESS TRANSACTION, CONNECTED.
            </h2>
            <p className="text-base text-[#5E453A] mt-3 leading-relaxed">
              From raw timber procurement to double-entry general ledger balance, every operational event generates verified financial entries with zero delta.
            </p>
          </div>

          {/* Operational & Financial Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Step 1: Procurement */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                01
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Procurement & Purchasing</span>
                <Layers size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Issue Purchase Orders to timber and fabric suppliers. Confirming PO reserves budget without posting false ledger entries until the Vendor Bill arrives.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                PO ➔ 3-Way Match ➔ Vendor Bill
              </div>
            </div>

            {/* Step 2: Inventory Valuation */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                02
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Inventory & Costing</span>
                <ShieldCheck size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Automatic moving-average valuation across raw materials and finished furniture. Bill approval debits Stock Valuation and credits Accounts Payable.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                Dr. Stock Valuation / Cr. AP
              </div>
            </div>

            {/* Step 3: Sales & Invoicing */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                03
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Sales Orders & Invoicing</span>
                <ReceiptText size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Customer Sales Orders lock product specifications and pricing. Revenue is recognised at Customer Invoice posting, strictly never at initial order or payment.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                SO ➔ Invoice (Dr. AR / Cr. Revenue)
              </div>
            </div>

            {/* Step 4: Payments & Settlements */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                04
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Receipts & Payments</span>
                <CheckCircle2 size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Register customer payments and vendor disbursements directly against open invoices. Payment entries balance cash accounts against AR/AP without touching income.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                Dr. Bank / Cr. Accounts Receivable
              </div>
            </div>

            {/* Step 5: Double-Entry General Ledger */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                05
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Double-Entry General Ledger</span>
                <Scale size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Automated posting service guarantees mathematical balance on every transaction. Debit must equal credit. Immutable ledger prevents silent tampering.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                Σ Debit ≡ Σ Credit (Delta = 0.00)
              </div>
            </div>

            {/* Step 6: Statutory Financial Reports */}
            <div className="p-6 rounded-xl bg-[#FFFFFF] border border-[#D0AE92]/60 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-[#EBD7BE] text-[#4A3A34] flex items-center justify-center font-mono font-bold text-sm mb-4">
                06
              </div>
              <h3 className="font-display font-semibold text-lg text-[#4A3A34] mb-2 flex items-center justify-between">
                <span>Statutory Financial Reports</span>
                <ChevronRight size={18} className="text-[#77574A]" />
              </h3>
              <p className="text-sm text-[#5E453A] leading-relaxed mb-4">
                Generate real-time Profit & Loss, Balance Sheet, Trial Balance, and Analytic Project Budgets directly derived from verified journal lines.
              </p>
              <div className="text-xs font-mono text-[#77574A] bg-[#F9F2E4] p-2.5 rounded border border-[#D0AE92]/40">
                P&L • Balance Sheet • Budgets
              </div>
            </div>

          </div>

          {/* Bottom Callout */}
          <div className="mt-14 p-8 rounded-2xl bg-[#4A3A34] text-[#F9F2E4] flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
            <div>
              <h4 className="font-display font-bold text-2xl tracking-tight text-[#F9F2E4]">
                Ready to enter Urban Furniture ERP?
              </h4>
              <p className="text-sm text-[#EBD7BE] mt-1">
                Access internal administrative modules or customer account statements.
              </p>
            </div>
            <button
              onClick={handleEnterPortal}
              className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-[#F9F2E4] text-[#4A3A34] font-semibold text-sm hover:bg-[#FAF5EE] active:scale-[0.98] transition-all duration-150 shadow flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <span>ENTER TO THE PORTAL</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Minimalist Showroom Footer ─────────────────────────────────── */}
      <footer className="border-t border-[#D0AE92]/50 py-8 px-6 sm:px-10 bg-[#F9F2E4] text-[#77574A] text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ChairIcon size={16} color="#77574A" />
            <span className="font-semibold text-[#4A3A34]">URBAN FURNITURE</span>
            <span>— Accounting & Management ERP</span>
          </div>
          <div>
            <span>100% Offline & Self-Contained System</span>
          </div>
        </div>
      </footer>

      {/* ── Embedded CSS for Entrance Animation & prefers-reduced-motion ── */}
      <style>{`
        @keyframes fadeInSlow {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-text-reveal {
          animation: fadeInSlow 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .hero-furniture-reveal {
          animation: fadeInSlow 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }

        /* Ambient calm showroom animation on furniture elements */
        .furniture-item-credenza {
          transition: transform 0.6s ease;
        }
        .furniture-item-table {
          transition: transform 0.6s ease;
        }
        .furniture-item-chair {
          transition: transform 0.6s ease;
        }

        /* Reduced motion: strict override to keep static without any transitions */
        @media (prefers-reduced-motion: reduce) {
          .hero-text-reveal,
          .hero-furniture-reveal,
          .furniture-item-credenza,
          .furniture-item-table,
          .furniture-item-chair {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
