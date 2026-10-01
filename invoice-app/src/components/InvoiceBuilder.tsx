"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CalendarDays, CheckCircle2, Loader2, MapPin, Minus, Package, Plus, ScanBarcode, Search, Trash2, UserRound,
} from "lucide-react";
import { createInvoice } from "@/actions/invoices";
import { calcInvoice, resolveTaxMode, type TaxMode } from "@/lib/calc";
import { INDIAN_STATES, money, rupees, todayISO } from "@/lib/format";
import { BarcodeScanner } from "./BarcodeScanner";

export type BProduct = {
  id: string; name: string; barcode: string | null; sku: string | null; hsn: string | null; unit: string;
  price: number; taxRate: number; stock: number; hasImage: boolean;
};
export type BCustomer = { id: string; name: string; phone: string | null; gstin: string | null; address: string | null; state: string | null };
type Company = { state: string | null; defaultTaxType: string; pricesIncludeTax: boolean; taxRates: number[] };

type Line = {
  key: number; productId: string | null; name: string; hsn: string; unit: string;
  qty: number; rate: number; discountPct: number; taxRate: number;
};

let keySeq = 1;

const PAY_MODES = [
  { v: "cash", label: "Cash" },
  { v: "upi", label: "UPI" },
  { v: "card", label: "Card" },
  { v: "bank", label: "Bank" },
];

export function InvoiceBuilder({ products, customers, company }: { products: BProduct[]; customers: BCustomer[]; company: Company }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [scan, setScan] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);

  const [date, setDate] = useState(todayISO());
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [walk, setWalk] = useState({ name: "", phone: "", gstin: "", address: "" });
  const [pos, setPos] = useState(company.state ?? "");
  const [taxChoice, setTaxChoice] = useState<TaxMode | "default">("default");
  const [notes, setNotes] = useState("");
  const [paidNow, setPaidNow] = useState("");
  const [payMode, setPayMode] = useState("cash");

  const taxMode: TaxMode = taxChoice === "default"
    ? resolveTaxMode(company.defaultTaxType, company.state, pos)
    : taxChoice;
  const calc = useMemo(
    () => calcInvoice(lines, taxMode, company.pricesIncludeTax),
    [lines, taxMode, company.pricesIncludeTax],
  );
  const paid = Math.min(Number(paidNow) || 0, calc.total);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return products.filter((p) => [p.name, p.sku, p.barcode].some((f) => f?.toLowerCase().includes(t))).slice(0, 8);
  }, [q, products]);

  function addProduct(p: BProduct) {
    setLines((ls) => {
      const i = ls.findIndex((l) => l.productId === p.id);
      if (i >= 0) return ls.map((l, j) => (j === i ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, {
        key: keySeq++, productId: p.id, name: p.name, hsn: p.hsn ?? "", unit: p.unit,
        qty: 1, rate: p.price, discountPct: 0, taxRate: p.taxRate,
      }];
    });
    setQ("");
  }

  function addCustom() {
    setLines((ls) => [...ls, {
      key: keySeq++, productId: null, name: q.trim() || "Item", hsn: "", unit: "pcs",
      qty: 1, rate: 0, discountPct: 0, taxRate: company.taxRates.includes(18) ? 18 : company.taxRates[0] ?? 0,
    }]);
    setQ("");
  }

  function onScan(code: string) {
    const p = products.find((x) => x.barcode === code);
    if (p) { addProduct(p); setToast({ ok: true, text: `Added ${p.name}` }); }
    else setToast({ ok: false, text: `No product with barcode ${code}` });
    setTimeout(() => setToast(null), 2500);
  }

  function patch(key: number, change: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...change } : l)));
  }

  function pickCustomer(id: string) {
    const c = customers.find((x) => x.id === id) ?? null;
    setCustomerId(c?.id ?? null);
    if (c?.state) setPos(c.state);
    else if (!c) setPos(company.state ?? "");
  }

  function submit() {
    setError("");
    start(async () => {
      const res = await createInvoice({
        date, customerId, customerName: walk.name, customerPhone: walk.phone, customerGstin: walk.gstin,
        customerAddress: walk.address, placeOfSupply: pos, taxMode: taxChoice, notes, paidNow: paid, payMode,
        lines: lines.map((l) => ({ productId: l.productId, name: l.name, hsn: l.hsn, unit: l.unit, qty: l.qty, rate: l.rate, discountPct: l.discountPct, taxRate: l.taxRate })),
      });
      if (res.error) setError(res.error);
      else router.push(`/invoices/${res.id}`);
    });
  }

  const productById = new Map(products.map((p) => [p.id, p]));
  const num = (v: string) => (v === "" ? 0 : Number(v));
  const itemCount = lines.reduce((t, l) => t + (l.qty || 0), 0);
  const taxLabel = taxMode === "cgst_sgst" ? "CGST + SGST" : taxMode === "igst" ? "IGST" : "No tax";

  return (
    <div className="grid gap-5 pb-36 lg:grid-cols-[minmax(0,1fr)_340px] lg:pb-0">
      <div className="min-w-0 space-y-5">
        {/* customer */}
        <section className="card animate-rise space-y-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-violet-600" />
            <h2 className="section-title">Bill to</h2>
          </div>
          <select className="input" value={customerId ?? ""} onChange={(e) => pickCustomer(e.target.value)}>
            <option value="">Walk-in / one-time customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
          </select>
          {!customerId && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Name (optional)" value={walk.name} onChange={(e) => setWalk({ ...walk, name: e.target.value })} />
              <input className="input" placeholder="Phone" inputMode="tel" value={walk.phone} onChange={(e) => setWalk({ ...walk, phone: e.target.value })} />
              <input className="input uppercase placeholder:normal-case" placeholder="GSTIN (optional)" value={walk.gstin} onChange={(e) => setWalk({ ...walk, gstin: e.target.value.toUpperCase() })} />
              <input className="input" placeholder="Address" value={walk.address} onChange={(e) => setWalk({ ...walk, address: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Date</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> Place of supply</label>
              <select className="input" value={pos} onChange={(e) => setPos(e.target.value)}>
                <option value="">-</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* items */}
        <section className="card animate-rise space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-violet-600" />
              <h2 className="section-title">Items</h2>
              {lines.length > 0 && <span className="pill bg-violet-100 text-violet-700">{lines.length}</span>}
            </div>
          </div>

          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input className="input pl-10" placeholder="Search products or type a custom item" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <button type="button" className="btn-soft shrink-0 px-3.5" onClick={() => setScan(true)} aria-label="Scan barcode">
                <ScanBarcode className="h-5 w-5" /><span className="hidden sm:inline">Scan</span>
              </button>
            </div>
            {q.trim() && (
              <ul className="animate-rise absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-2xl shadow-slate-900/15">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addProduct(p)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-violet-50">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-300">
                        {p.hasImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/product-image/${p.id}`} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className={`block text-xs ${p.stock <= 0 ? "text-rose-600" : "text-slate-500"}`}>{p.stock <= 0 ? "Out of stock" : `${p.stock} ${p.unit} in stock`}</span>
                      </span>
                      <span className="text-sm font-bold tabular-nums">{rupees(p.price)}</span>
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" onClick={addCustom} className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-sm font-semibold text-violet-700 hover:bg-violet-50">
                    <Plus className="h-4 w-4" /> Add &quot;{q.trim()}&quot; as custom item
                  </button>
                </li>
              </ul>
            )}
          </div>

          {lines.length === 0 ? (
            <button type="button" onClick={() => setScan(true)} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 py-8 text-center transition hover:border-violet-300 hover:bg-violet-50">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                <ScanBarcode className="h-6 w-6" />
              </span>
              <span className="font-semibold text-slate-800">Scan or search to add items</span>
              <span className="text-xs text-slate-500">Tap here to open the camera</span>
            </button>
          ) : (
            <ul className="space-y-3">
              {lines.map((l, idx) => {
                const r = calc.items[idx];
                const p = l.productId ? productById.get(l.productId) : undefined;
                const over = p && l.qty > p.stock;
                return (
                  <li key={l.key} className="animate-rise rounded-2xl bg-slate-50/80 p-3.5 ring-1 ring-slate-200/70">
                    <div className="flex items-start gap-2">
                      <input className="min-w-0 flex-1 border-0 bg-transparent p-0 font-semibold text-slate-900 outline-none" value={l.name} onChange={(e) => patch(l.key, { name: e.target.value })} />
                      <span className="font-bold tabular-nums">{rupees(r?.amount ?? 0)}</span>
                      <button type="button" className="-mt-1 -mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <div>
                        <span className="label">Qty{l.unit && ` (${l.unit})`}</span>
                        <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white">
                          <button type="button" className="flex h-full w-10 items-center justify-center text-slate-500 hover:text-violet-700" onClick={() => patch(l.key, { qty: Math.max(0, l.qty - 1) })} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
                          <input className="h-full w-14 border-x border-slate-100 bg-transparent text-center font-semibold tabular-nums outline-none" type="number" inputMode="decimal" step="any" value={l.qty || ""} onChange={(e) => patch(l.key, { qty: num(e.target.value) })} />
                          <button type="button" className="flex h-full w-10 items-center justify-center text-slate-500 hover:text-violet-700" onClick={() => patch(l.key, { qty: l.qty + 1 })} aria-label="Increase"><Plus className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="min-w-24 flex-1">
                        <span className="label">Rate ₹{company.pricesIncludeTax && " (incl.)"}</span>
                        <input className="input tabular-nums" type="number" inputMode="decimal" step="any" value={l.rate || ""} onChange={(e) => patch(l.key, { rate: num(e.target.value) })} />
                      </div>
                      <div className="w-20">
                        <span className="label">Disc %</span>
                        <input className="input tabular-nums" type="number" inputMode="decimal" step="any" value={l.discountPct || ""} placeholder="0" onChange={(e) => patch(l.key, { discountPct: num(e.target.value) })} />
                      </div>
                      <div className="w-24">
                        <span className="label">GST</span>
                        <select className="input" value={l.taxRate} onChange={(e) => patch(l.key, { taxRate: Number(e.target.value) })}>
                          {(company.taxRates.includes(l.taxRate) ? company.taxRates : [...company.taxRates, l.taxRate].sort((a, b) => a - b)).map((t) => <option key={t} value={t}>{t}%</option>)}
                        </select>
                      </div>
                    </div>
                    {over && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5" /> Only {p!.stock} {p!.unit} in stock
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card animate-rise lg:hidden">
          <PaymentFields {...{ paidNow, setPaidNow, payMode, setPayMode, total: calc.total, notes, setNotes }} />
        </section>
      </div>

      {/* summary */}
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-8 lg:self-start">
        <section className="relative overflow-hidden rounded-[28px] bg-slate-900 p-5 text-white shadow-[0_24px_48px_-20px_rgb(15_23_42/0.7)]">
          <div aria-hidden className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-fuchsia-500/30 blur-3xl" />
          <div aria-hidden className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="relative space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Tax</span>
              <select className="rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-xs font-semibold text-white outline-none" value={taxChoice} onChange={(e) => setTaxChoice(e.target.value as TaxMode | "default")}>
                <option className="text-slate-900" value="default">Auto · {taxLabel}</option>
                <option className="text-slate-900" value="cgst_sgst">CGST + SGST</option>
                <option className="text-slate-900" value="igst">IGST</option>
                <option className="text-slate-900" value="none">No tax</option>
              </select>
            </div>
            <Row k={`Taxable value (${itemCount} item${itemCount === 1 ? "" : "s"})`} v={money(calc.subtotal)} />
            {calc.discountTotal > 0 && <Row k="Discount" v={`- ${money(calc.discountTotal)}`} />}
            {taxMode === "cgst_sgst" && <><Row k="CGST" v={money(calc.cgst)} /><Row k="SGST" v={money(calc.sgst)} /></>}
            {taxMode === "igst" && <Row k="IGST" v={money(calc.igst)} />}
            {calc.roundOff !== 0 && <Row k="Round off" v={money(calc.roundOff)} />}
            <div className="!mt-4 border-t border-white/10 pt-4">
              <p className="text-white/60">Total</p>
              <p className="text-4xl font-extrabold tracking-tight tabular-nums">{rupees(calc.total)}</p>
              {paid > 0 && <p className="mt-1 text-sm text-white/70">Balance due {rupees(calc.total - paid)}</p>}
            </div>
          </div>
        </section>

        <section className="card hidden lg:block">
          <PaymentFields {...{ paidNow, setPaidNow, payMode, setPayMode, total: calc.total, notes, setNotes }} />
        </section>

        {error && (
          <p className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200/70">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </p>
        )}

        <button className="btn-primary hidden h-12 w-full text-base lg:inline-flex" disabled={pending || lines.length === 0} onClick={submit}>
          {pending ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving…</> : "Create invoice"}
        </button>
      </aside>

      {/* mobile sticky action bar */}
      <div className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-20 lg:hidden">
        <div className="flex items-center justify-between gap-3 rounded-3xl bg-slate-900 p-2.5 pl-5 text-white shadow-[0_16px_32px_-12px_rgb(15_23_42/0.6)]">
          <div>
            <p className="text-[11px] text-white/60">{itemCount} item{itemCount === 1 ? "" : "s"} · total</p>
            <p className="text-xl font-extrabold tabular-nums">{rupees(calc.total)}</p>
          </div>
          <button className="btn-primary h-12 px-6" disabled={pending || lines.length === 0} onClick={submit}>
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create invoice"}
          </button>
        </div>
      </div>

      {toast && (
        <div className={`animate-rise fixed top-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${toast.ok ? "bg-emerald-600" : "bg-slate-900"}`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {toast.text}
        </div>
      )}
      {scan && <BarcodeScanner onDetect={onScan} onClose={() => setScan(false)} />}
    </div>
  );
}

function PaymentFields({ paidNow, setPaidNow, payMode, setPayMode, total, notes, setNotes }: {
  paidNow: string; setPaidNow: (v: string) => void; payMode: string; setPayMode: (v: string) => void;
  total: number; notes: string; setNotes: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Payment received</h2>
        <button type="button" className="text-sm font-semibold text-violet-600 hover:text-violet-700" onClick={() => setPaidNow(String(total))}>
          Fully paid
        </button>
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-slate-400">₹</span>
        <input className="input pl-8 text-lg font-semibold tabular-nums" type="number" inputMode="decimal" step="any" placeholder="0" value={paidNow} onChange={(e) => setPaidNow(e.target.value)} />
      </div>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
        {PAY_MODES.map((m) => (
          <button
            key={m.v} type="button" onClick={() => setPayMode(m.v)}
            className={`rounded-lg py-2 text-xs font-semibold transition ${payMode === m.v ? "bg-white text-violet-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <textarea className="input" rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-white/60">{k}</span><span className="font-medium tabular-nums">{v}</span></div>;
}
