"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Building2, FileText, House, KeyRound, LogOut, Package, Plus, ShieldCheck, Users,
  type LucideIcon,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Avatar } from "./ui";

const ICONS: Record<string, LucideIcon> = {
  home: House, invoices: FileText, stock: Package, customers: Users, team: KeyRound, company: Building2, admin: ShieldCheck,
};

export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/");
}

export function Sidebar({ items, company, user }: { items: NavItem[]; company: { name: string; logo: string | null }; user: { name: string; email: string; role: string } }) {
  const active = useActive();
  return (
    <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200/60 bg-white/60 p-4 backdrop-blur-xl md:flex">
      <Link href="/dashboard" className="mb-6 flex items-center gap-3 px-2 pt-1">
        <Avatar name={company.name} src={company.logo} />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold tracking-tight">{company.name}</p>
          <p className="text-xs text-slate-500">Billbook</p>
        </div>
      </Link>

      <Link href="/invoices/new" className="btn-primary mb-5 w-full">
        <Plus className="h-4 w-4" strokeWidth={2.5} /> New invoice
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((i) => {
          const Icon = ICONS[i.icon];
          const on = active(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                on ? "bg-linear-to-r from-violet-50 to-fuchsia-50/60 text-violet-700" : "text-slate-600 hover:bg-slate-100/70 hover:text-slate-900"
              }`}
            >
              {on && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-linear-to-b from-indigo-500 to-fuchsia-500" />}
              <Icon className={`h-[18px] w-[18px] ${on ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600"}`} strokeWidth={2} />
              {i.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3">
        <Avatar name={user.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs capitalize text-slate-500">{user.role}</p>
        </div>
        <form action={signOutAction}>
          <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileHeader({ company, user, menu }: { company: { name: string; logo: string | null }; user: { name: string; email: string }; menu: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
        <Avatar name={company.name} src={company.logo} size="sm" />
        <span className="truncate font-bold tracking-tight">{company.name}</span>
      </Link>
      <div ref={ref} className="relative">
        <button onClick={() => setOpen((o) => !o)} className="rounded-full ring-2 ring-white" aria-label="Menu">
          <Avatar name={user.name} size="sm" />
        </button>
        {open && (
          <div className="animate-rise absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-1.5 shadow-xl shadow-slate-900/10">
            <div className="px-3 py-2">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-slate-100" />
            {menu.map((i) => {
              const Icon = ICONS[i.icon];
              return (
                <Link key={i.href} href={i.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                  <Icon className="h-4 w-4 text-slate-400" /> {i.label}
                </Link>
              );
            })}
            <form action={signOutAction}>
              <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}

export function BottomBar() {
  const active = useActive();
  const tab = (href: string, label: string, Icon: LucideIcon) => {
    const on = active(href);
    return (
      <Link href={href} className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold transition ${on ? "text-violet-700" : "text-slate-400"}`}>
        <span className={`flex h-8 w-12 items-center justify-center rounded-full transition ${on ? "bg-violet-100/80" : ""}`}>
          <Icon className="h-5 w-5" strokeWidth={on ? 2.4 : 2} />
        </span>
        {label}
      </Link>
    );
  };
  return (
    <nav className="no-print fixed inset-x-3 bottom-3 z-30 md:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center rounded-3xl border border-white/70 bg-white/85 px-1 shadow-[0_12px_32px_-12px_rgb(30_27_75/0.35)] ring-1 ring-slate-900/5 backdrop-blur-xl">
        {tab("/dashboard", "Home", House)}
        {tab("/invoices", "Invoices", FileText)}
        <div className="flex flex-1 justify-center">
          <Link
            href="/invoices/new"
            aria-label="New invoice"
            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_10px_24px_-6px_rgb(124_58_237/0.7)] ring-4 ring-white transition active:scale-95"
          >
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </Link>
        </div>
        {tab("/inventory", "Stock", Package)}
        {tab("/customers", "Customers", Users)}
      </div>
    </nav>
  );
}
