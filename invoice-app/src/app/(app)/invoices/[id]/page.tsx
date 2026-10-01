import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Ban, CircleCheck, MessageCircle, Wallet } from "lucide-react";
import { addPayment, cancelInvoice } from "@/actions/invoices";
import { ConfirmButton } from "@/components/ActionForm";
import { BackLink } from "@/components/BackLink";
import { PrintButton } from "@/components/PrintButton";
import { StatusPill } from "@/components/ui";
import { amountInWords, dmy, money, qtyFmt, rupees } from "@/lib/format";
import { requireCompanyUser } from "@/lib/session";
import { statusOf } from "@/lib/status";
import { invoicesCol, withId, type Invoice } from "@/lib/types";

const MODE_LABEL: Record<string, string> = { cash: "Cash", upi: "UPI", card: "Card", bank: "Bank" };

export default async function InvoicePage({ params }: PageProps<"/invoices/[id]">) {
  const { id } = await params;
  const { company: c } = await requireCompanyUser();
  const snap = await invoicesCol(c.id).doc(id).get();
  if (!snap.exists) notFound();
  const inv = withId<Invoice>(snap);
  const items = inv.items;
  const pays = inv.payments ?? [];

  const total = inv.total;
  const due = Math.max(total - inv.paid, 0);
  const st = statusOf(inv);
  const showTax = inv.taxMode !== "none";
  const cancelled = inv.status === "cancelled";

  const upiQr = c.upiId && due > 0 && !cancelled
    ? await QRCode.toDataURL(
        `upi://pay?pa=${encodeURIComponent(c.upiId)}&pn=${encodeURIComponent(c.name)}&am=${due.toFixed(2)}&cu=INR&tn=${encodeURIComponent(inv.number)}`,
        { margin: 1, width: 180 },
      )
    : null;

  // Tax summary grouped by rate
  const byRate = new Map<number, { taxable: number; tax: number }>();
  items.forEach((it) => {
    const cur = byRate.get(it.taxRate) ?? { taxable: 0, tax: 0 };
    byRate.set(it.taxRate, { taxable: cur.taxable + it.taxable, tax: cur.tax + it.taxAmount });
  });

  const phone = (inv.customerPhone ?? "").replace(/\D/g, "");
  const waText = encodeURIComponent(
    `Hi ${inv.customerName}, here is your invoice ${inv.number} from ${c.name} dated ${dmy(inv.date)} for ${rupees(total)}.` +
      (due > 0 ? ` Balance due: ${rupees(due)}.` : " Paid in full. Thank you!") +
      (c.upiId && due > 0 ? ` Pay via UPI: ${c.upiId}` : ""),
  );
  const waHref = `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${waText}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="no-print mb-5 animate-rise">
        <BackLink href="/invoices" label="Invoices" />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{inv.number}</h1>
              <StatusPill status={st} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{inv.customerName} · {dmy(inv.date)}</p>
          </div>
          <div className="flex gap-2">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              <MessageCircle className="h-4 w-4 text-emerald-600" /> <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* the bill */}
        <article className="print-area relative overflow-hidden rounded-3xl bg-white text-[13px] leading-snug text-slate-800 shadow-[0_1px_2px_rgb(15_23_42/0.04),0_20px_48px_-24px_rgb(30_27_75/0.3)] ring-1 ring-slate-900/5">
          <div className="h-2 bg-linear-to-r from-indigo-500 via-violet-600 to-fuchsia-600" />
          {cancelled && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl font-black tracking-widest text-rose-500/15 uppercase -rotate-12">Cancelled</div>
          )}
          <div className="space-y-6 p-5 sm:p-8">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3">
                {c.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.logo} alt="" className="h-16 w-16 rounded-xl object-contain" />}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{c.name}</h2>
                  {c.legalName && <p>{c.legalName}</p>}
                  <p className="whitespace-pre-line text-slate-500">{[c.address, [c.city, c.state, c.pincode].filter(Boolean).join(", ")].filter(Boolean).join("\n")}</p>
                  <p className="text-slate-500">{[c.phone && `Ph: ${c.phone}`, c.email].filter(Boolean).join(" · ")}</p>
                  {c.gstin && <p className="mt-1 font-semibold">GSTIN: <span className="font-mono">{c.gstin}</span></p>}
                  {c.pan && <p>PAN: {c.pan}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold tracking-wide text-violet-700 uppercase">{showTax ? "Tax Invoice" : "Invoice"}</p>
                <p className="mt-2 text-slate-500">Invoice no.</p>
                <p className="font-bold text-slate-900">{inv.number}</p>
                <p className="mt-1 text-slate-500">Date <span className="font-semibold text-slate-900">{dmy(inv.date)}</span></p>
              </div>
            </header>

            <section className="grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Bill to</p>
                <p className="mt-1 text-[15px] font-bold text-slate-900">{inv.customerName}</p>
                {inv.customerAddress && <p className="whitespace-pre-line text-slate-600">{inv.customerAddress}</p>}
                {inv.customerPhone && <p className="text-slate-600">Ph: {inv.customerPhone}</p>}
                {inv.customerGstin && <p className="font-semibold">GSTIN: <span className="font-mono">{inv.customerGstin}</span></p>}
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Place of supply</p>
                <p className="mt-1 font-semibold text-slate-900">{inv.placeOfSupply || c.state || "-"}</p>
              </div>
            </section>

            <div className="-mx-5 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="th">#</th><th className="th">Item</th><th className="th">HSN</th>
                    <th className="th text-right">Qty</th><th className="th text-right">Rate</th>
                    <th className="th text-right">Disc</th><th className="th text-right">Taxable</th>
                    {showTax && <th className="th text-right">GST</th>}
                    <th className="th text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="td text-slate-400">{i + 1}</td>
                      <td className="td font-semibold text-slate-900">{it.name}</td>
                      <td className="td font-mono text-xs">{it.hsn ?? ""}</td>
                      <td className="td text-right tabular-nums">{qtyFmt(it.qty)} {it.unit}</td>
                      <td className="td text-right tabular-nums">{money(it.rate)}</td>
                      <td className="td text-right tabular-nums">{it.discountPct ? `${it.discountPct}%` : "-"}</td>
                      <td className="td text-right tabular-nums">{money(it.taxable)}</td>
                      {showTax && <td className="td text-right tabular-nums">{it.taxRate}%</td>}
                      <td className="td text-right font-semibold tabular-nums">{money(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="grid gap-6 sm:grid-cols-[1fr_260px]">
              <div className="space-y-3">
                {showTax && (
                  <table className="w-full border-collapse overflow-hidden rounded-xl text-xs ring-1 ring-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-2.5 py-1.5 text-left font-semibold">GST %</th><th className="px-2.5 py-1.5 text-right font-semibold">Taxable</th>
                        {inv.taxMode === "cgst_sgst"
                          ? <><th className="px-2.5 py-1.5 text-right font-semibold">CGST</th><th className="px-2.5 py-1.5 text-right font-semibold">SGST</th></>
                          : <th className="px-2.5 py-1.5 text-right font-semibold">IGST</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => (
                        <tr key={rate} className="border-t border-slate-100">
                          <td className="px-2.5 py-1.5">{rate}%</td>
                          <td className="px-2.5 py-1.5 text-right tabular-nums">{money(v.taxable)}</td>
                          {inv.taxMode === "cgst_sgst"
                            ? <><td className="px-2.5 py-1.5 text-right tabular-nums">{money(v.tax / 2)}</td><td className="px-2.5 py-1.5 text-right tabular-nums">{money(v.tax / 2)}</td></>
                            : <td className="px-2.5 py-1.5 text-right tabular-nums">{money(v.tax)}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Amount in words</p>
                  <p className="font-semibold text-slate-900">{amountInWords(total)}</p>
                </div>
                {inv.notes && <p><span className="text-slate-500">Notes:</span> {inv.notes}</p>}
              </div>
              <div className="space-y-1.5">
                <T k="Taxable value" v={money(inv.subtotal)} />
                {inv.discountTotal > 0 && <T k="Discount" v={money(inv.discountTotal)} />}
                {inv.taxMode === "cgst_sgst" && <><T k="CGST" v={money(inv.cgst)} /><T k="SGST" v={money(inv.sgst)} /></>}
                {inv.taxMode === "igst" && <T k="IGST" v={money(inv.igst)} />}
                {inv.roundOff !== 0 && <T k="Round off" v={money(inv.roundOff)} />}
                <div className="!mt-3 flex items-center justify-between rounded-xl bg-linear-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-3.5 py-2.5 text-white">
                  <span className="font-semibold">Total</span><span className="text-lg font-extrabold tabular-nums">{rupees(total)}</span>
                </div>
                {inv.paid > 0 && <T k="Paid" v={money(inv.paid)} />}
                {due > 0 && !cancelled && (
                  <div className="flex justify-between font-bold text-rose-600"><span>Balance due</span><span className="tabular-nums">{rupees(due)}</span></div>
                )}
              </div>
            </section>

            <footer className="grid gap-6 border-t border-dashed border-slate-200 pt-5 sm:grid-cols-3">
              <div className="space-y-3 sm:col-span-2">
                {c.bankDetails && <div><p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Bank details</p><p className="whitespace-pre-line">{c.bankDetails}</p></div>}
                {c.terms && <div><p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Terms &amp; conditions</p><p className="whitespace-pre-line text-slate-600">{c.terms}</p></div>}
              </div>
              <div className="flex flex-col items-center gap-1 sm:items-end">
                {upiQr && (
                  <div className="flex flex-col items-center rounded-2xl p-2 ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={upiQr} alt="UPI QR" className="h-28 w-28" />
                    <p className="text-[11px] font-semibold">Scan to pay {rupees(due)}</p>
                    <p className="text-[10px] text-slate-500">{c.upiId}</p>
                  </div>
                )}
                <div className="mt-6 w-full text-center text-xs text-slate-500 sm:w-48">
                  <div className="mb-1 h-10 border-b border-slate-300" />
                  Authorised signatory
                </div>
              </div>
            </footer>
            <p className="text-center text-[11px] text-slate-400">This is a computer generated invoice.</p>
          </div>
        </article>

        {/* side panel */}
        <aside className="no-print space-y-4 lg:sticky lg:top-8 lg:self-start">
          {!cancelled && (
            <section className="card space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-violet-600" />
                <h2 className="section-title">Payments</h2>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600" style={{ width: `${Math.min(100, (inv.paid / (total || 1)) * 100)}%` }} />
              </div>
              <p className="text-sm text-slate-500"><b className="text-slate-900">{rupees(inv.paid)}</b> of {rupees(total)} received</p>
              {pays.length > 0 && (
                <ul className="space-y-1.5 text-sm">
                  {pays.map((p, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span className="text-slate-600">{dmy(p.paidOn)} · {MODE_LABEL[p.mode] ?? p.mode}</span>
                      <span className="font-semibold tabular-nums">{rupees(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {due > 0 ? (
                <form action={addPayment} className="space-y-2">
                  <input type="hidden" name="id" value={inv.id} />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">₹</span>
                      <input name="amount" type="number" step="any" inputMode="decimal" defaultValue={due.toFixed(2)} className="input pl-7 tabular-nums" />
                    </div>
                    <select name="mode" className="input w-24"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option></select>
                  </div>
                  <button className="btn-primary w-full">Record payment</button>
                </form>
              ) : (
                <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                  <CircleCheck className="h-4 w-4" /> Fully paid
                </p>
              )}
            </section>
          )}
          {!cancelled && (
            <form action={cancelInvoice}>
              <input type="hidden" name="id" value={inv.id} />
              <ConfirmButton className="btn-danger w-full" message="Cancel this invoice? Stock will be restored.">
                <Ban className="h-4 w-4" /> Cancel invoice
              </ConfirmButton>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

function T({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-slate-500">{k}</span><span className="tabular-nums">{v}</span></div>;
}
