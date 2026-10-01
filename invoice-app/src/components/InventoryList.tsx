"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Package, ScanBarcode, Search, X } from "lucide-react";
import { rupees } from "@/lib/format";
import { BarcodeScanner } from "./BarcodeScanner";

export type InvRow = {
  id: string; name: string; sku: string | null; barcode: string | null; hsn: string | null;
  price: number; stock: number; lowStockAt: number; unit: string; imgVer: number;
};

type Filter = "all" | "low" | "out";

export function InventoryList({ rows, startScan = false }: { rows: InvRow[]; startScan?: boolean }) {
  const [q, setQ] = useState("");
  const [scan, setScan] = useState(startScan);
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => ({
    all: rows.length,
    low: rows.filter((r) => r.stock > 0 && r.stock <= r.lowStockAt).length,
    out: rows.filter((r) => r.stock <= 0).length,
  }), [rows]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "low" && !(r.stock > 0 && r.stock <= r.lowStockAt)) return false;
      if (filter === "out" && r.stock > 0) return false;
      return !t || [r.name, r.sku, r.barcode, r.hsn].some((f) => f?.toLowerCase().includes(t));
    });
  }, [rows, q, filter]);

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "low", label: "Low stock" },
    { key: "out", label: "Out of stock" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, SKU or barcode" className="input pl-10" />
          {q && (
            <button onClick={() => setQ("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button className="icon-btn" onClick={() => setScan(true)} aria-label="Scan barcode" title="Scan barcode">
          <ScanBarcode className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`pill shrink-0 px-3.5 py-1.5 text-[13px] transition ${
              filter === c.key ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"
            }`}
          >
            {c.label}
            <span className={`rounded-full px-1.5 text-[11px] ${filter === c.key ? "bg-white/20" : "bg-slate-100"}`}>{counts[c.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="card flex flex-col items-center py-10 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 to-fuchsia-50 text-violet-600 ring-1 ring-violet-100">
            <Package className="h-6 w-6" />
          </span>
          <p className="font-semibold">{rows.length ? "No matching products" : "No products yet"}</p>
          <p className="mt-1 text-sm text-slate-500">{rows.length ? "Try a different search or filter." : "Add your first product to start billing."}</p>
          {!rows.length && <Link href="/inventory/new" className="btn-primary mt-4">Add product</Link>}
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {shown.map((r) => {
            const out = r.stock <= 0;
            const low = !out && r.stock <= r.lowStockAt;
            return (
              <li key={r.id}>
                <Link href={`/inventory/${r.id}`} className="list-row">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-slate-50 to-slate-100 text-slate-300 ring-1 ring-slate-900/5">
                    {r.imgVer
                      ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/product-image/${r.id}?v=${r.imgVer}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                      : <Package className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="truncate text-xs text-slate-500">{[r.sku, r.barcode].filter(Boolean).join(" · ") || "No code"}</p>
                    <p className="mt-1">
                      <span className={`pill ${out ? "bg-rose-50 text-rose-700" : low ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {out ? "Out of stock" : `${r.stock} ${r.unit}`}
                      </span>
                    </p>
                  </div>
                  <p className="self-start font-bold tabular-nums">{rupees(r.price)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {scan && (
        <BarcodeScanner
          onDetect={(c) => { setQ(c); setFilter("all"); setScan(false); }}
          onClose={() => setScan(false)}
        />
      )}
    </div>
  );
}
