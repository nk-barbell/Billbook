import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { Avatar, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { dmy, rupees } from "@/lib/format";
import { requireCompanyUser } from "@/lib/session";
import { statusOf, type StatusTone } from "@/lib/status";
import { invoicesCol, withId, type Invoice } from "@/lib/types";

const FILTERS: { key: string; label: string; match: (t: StatusTone) => boolean }[] = [
  { key: "all", label: "All", match: () => true },
  { key: "unpaid", label: "Unpaid", match: (t) => t === "unpaid" || t === "partial" },
  { key: "paid", label: "Paid", match: (t) => t === "paid" },
  { key: "cancelled", label: "Cancelled", match: (t) => t === "cancelled" },
];

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const sp = await searchParams;
  const active = FILTERS.find((f) => f.key === sp.s) ?? FILTERS[0];
  const me = await requireCompanyUser();
  const snap = await invoicesCol(me.company.id).orderBy("createdAt", "desc").limit(300)
    .select("number", "date", "customerName", "total", "paid", "status").get();
  const all = snap.docs.map((d) => withId<Invoice>(d)).map((i) => ({ ...i, st: statusOf(i) }));
  const rows = all.filter((i) => active.match(i.st.tone));
  const outstanding = all.filter((i) => i.status === "active").reduce((t, i) => t + Math.max(i.total - i.paid, 0), 0);
  const billed = all.filter((i) => i.status === "active").reduce((t, i) => t + i.total, 0);

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${all.length} total`}
        action={<Link href="/invoices/new" className="btn-primary"><Plus className="h-4 w-4" strokeWidth={2.5} /> New</Link>}
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card !p-4">
          <p className="text-xs font-medium text-slate-500">Billed</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{rupees(billed)}</p>
        </div>
        <div className="card !p-4">
          <p className="text-xs font-medium text-slate-500">Outstanding</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-rose-600">{rupees(outstanding)}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const on = f.key === active.key;
          const count = all.filter((i) => f.match(i.st.tone)).length;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/invoices" : `/invoices?s=${f.key}`}
              className={`pill shrink-0 px-3.5 py-1.5 text-[13px] transition ${on ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300"}`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[11px] ${on ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<ReceiptText className="h-6 w-6" />}
          title={all.length ? "Nothing here" : "No invoices yet"}
          text={all.length ? "No invoices match this filter." : "Create your first bill in a few taps."}
          action={!all.length ? <Link href="/invoices/new" className="btn-primary">Create invoice</Link> : undefined}
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((i) => (
            <li key={i.id}>
              <Link href={`/invoices/${i.id}`} className={`list-row ${i.status === "cancelled" ? "opacity-60" : ""}`}>
                <Avatar name={i.customerName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{i.customerName}</p>
                  <p className="text-xs text-slate-500">{i.number} · {dmy(i.date)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className={`font-bold tabular-nums ${i.status === "cancelled" ? "line-through" : ""}`}>{rupees(i.total)}</p>
                  <StatusPill status={i.st} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
