import Link from "next/link";
import {
  AlertTriangle, ArrowUpRight, CalendarDays, ChevronRight, FilePlus2, PackagePlus, ReceiptText, ScanBarcode, UserPlus, Wallet,
} from "lucide-react";
import { Avatar, EmptyState, StatusPill } from "@/components/ui";
import { dmy, rupees, todayISO } from "@/lib/format";
import { requireCompanyUser } from "@/lib/session";
import { statusOf } from "@/lib/status";
import { invoicesCol, productsCol, withId, type Invoice } from "@/lib/types";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard() {
  const me = await requireCompanyUser();
  const { company } = me;
  const today = todayISO();
  const monthStart = today.slice(0, 8) + "01";

  const [monthSnap, owedSnap, recentSnap, prodSnap] = await Promise.all([
    invoicesCol(company.id).where("date", ">=", monthStart).select("date", "total", "status").get(),
    invoicesCol(company.id).where("due", ">", 0).select("due").get(),
    invoicesCol(company.id).orderBy("createdAt", "desc").limit(5).select("number", "date", "customerName", "total", "paid", "status").get(),
    productsCol(company.id).select("name", "stock", "lowStockAt", "unit").get(),
  ]);

  const monthInv = monthSnap.docs.map((d) => d.data() as { date: string; total: number; status: string }).filter((x) => x.status === "active");
  const dayInv = monthInv.filter((x) => x.date === today);
  const sum = (a: { total: number }[]) => a.reduce((t, x) => t + (x.total ?? 0), 0);
  const owed = owedSnap.docs.reduce((t, d) => t + (d.data().due ?? 0), 0);
  const recent = recentSnap.docs.map((d) => withId<Invoice>(d));
  const low = prodSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { name: string; stock: number; lowStockAt: number; unit: string }) }))
    .filter((p) => (p.stock ?? 0) <= (p.lowStockAt ?? 0))
    .sort((a, b) => a.stock - b.stock);

  const quick = [
    { href: "/invoices/new", label: "New invoice", icon: FilePlus2, tone: "from-indigo-500 to-violet-600" },
    { href: "/inventory/new", label: "Add product", icon: PackagePlus, tone: "from-fuchsia-500 to-pink-600" },
    { href: "/inventory?scan=1", label: "Scan item", icon: ScanBarcode, tone: "from-sky-500 to-cyan-600" },
    { href: "/customers/new", label: "Add customer", icon: UserPlus, tone: "from-emerald-500 to-teal-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-rise">
        <p className="text-sm font-medium text-slate-500">{greeting()},</p>
        <h1 className="text-2xl font-bold tracking-tight md:text-[28px]">{me.name.split(" ")[0]} 👋</h1>
      </div>

      {/* hero */}
      <section className="relative animate-rise overflow-hidden rounded-[28px] bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-[0_24px_48px_-20px_rgb(124_58_237/0.75)]">
        <div aria-hidden className="absolute -top-16 -right-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div aria-hidden className="absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-white/80"><CalendarDays className="h-4 w-4" /> Today&apos;s sales</p>
            <p className="mt-2 text-4xl font-extrabold tracking-tight md:text-5xl">{rupees(sum(dayInv))}</p>
            <p className="mt-1 text-sm text-white/80">{dayInv.length} invoice{dayInv.length === 1 ? "" : "s"} today</p>
          </div>
          <Link href="/invoices/new" className="hidden items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-semibold ring-1 ring-white/25 backdrop-blur transition hover:bg-white/25 sm:inline-flex">
            New invoice <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/12 p-3.5 ring-1 ring-white/20 backdrop-blur">
            <p className="flex items-center gap-1.5 text-xs text-white/75"><ReceiptText className="h-3.5 w-3.5" /> This month</p>
            <p className="mt-1 text-lg font-bold">{rupees(sum(monthInv))}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-3.5 ring-1 ring-white/20 backdrop-blur">
            <p className="flex items-center gap-1.5 text-xs text-white/75"><Wallet className="h-3.5 w-3.5" /> To collect</p>
            <p className="mt-1 text-lg font-bold">{rupees(owed)}</p>
          </div>
        </div>
      </section>

      {/* quick actions */}
      <section className="grid grid-cols-4 gap-2 sm:gap-3">
        {quick.map(({ href, label, icon: Icon, tone }, i) => (
          <Link
            key={href}
            href={href}
            style={{ animationDelay: `${60 * i}ms` }}
            className="group flex animate-rise flex-col items-center gap-2 rounded-2xl bg-white/80 p-3 text-center ring-1 ring-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 sm:p-4"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br text-white shadow-md ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] leading-tight font-semibold text-slate-700 sm:text-sm">{label}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* recent */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="section-title">Recent invoices</h2>
            <Link href="/invoices" className="flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700">
              See all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={<ReceiptText className="h-6 w-6" />}
              title="No invoices yet"
              text="Add a few products, then create your first bill."
              action={<Link href="/invoices/new" className="btn-primary">Create invoice</Link>}
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((i) => (
                <li key={i.id}>
                  <Link href={`/invoices/${i.id}`} className="list-row">
                    <Avatar name={i.customerName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{i.customerName}</p>
                      <p className="text-xs text-slate-500">{i.number} · {dmy(i.date)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="font-bold tabular-nums">{rupees(i.total)}</p>
                      <StatusPill status={statusOf(i)} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* low stock */}
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="section-title">Low stock</h2>
            {low.length > 0 && <span className="pill bg-amber-100 text-amber-800">{low.length}</span>}
          </div>
          {low.length === 0 ? (
            <div className="card flex items-center gap-3 text-sm text-slate-500">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">✓</span>
              All items are well stocked.
            </div>
          ) : (
            <div className="card !p-2">
              <ul className="divide-y divide-slate-100">
                {low.slice(0, 6).map((p) => (
                  <li key={p.id}>
                    <Link href={`/inventory/${p.id}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertTriangle className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                      <span className={`text-sm font-bold tabular-nums ${p.stock <= 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock} {p.unit}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
