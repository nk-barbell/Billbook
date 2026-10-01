import Link from "next/link";
import { ArrowRight, Building2, LogOut, ShieldCheck, UserPlus } from "lucide-react";
import { addOwner, removeOwner } from "@/actions/admin";
import { signOutAction } from "@/actions/auth";
import { ActionForm, ConfirmButton, Field } from "@/components/ActionForm";
import { LogoMark } from "@/components/Logo";
import { Avatar, EmptyState } from "@/components/ui";
import { db } from "@/lib/firebase-admin";
import { requireSysadmin } from "@/lib/session";
import { usersCol, type UserDoc } from "@/lib/types";

export default async function AdminPage() {
  const me = await requireSysadmin();
  const snap = await usersCol().where("role", "==", "owner").get();
  const owners = snap.docs.map((d) => d.data() as UserDoc).sort((a, b) => a.createdAt - b.createdAt);
  const companyIds = [...new Set(owners.map((o) => o.companyId).filter((x): x is string => !!x))];
  const cSnaps = companyIds.length ? await db.getAll(...companyIds.map((id) => db.collection("companies").doc(id))) : [];
  const names = new Map(cSnaps.map((c) => [c.id, c.data()?.name as string | undefined]));
  const active = owners.filter((o) => o.companyId).length;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11" />
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-violet-600 uppercase">
              <ShieldCheck className="h-3.5 w-3.5" /> System admin
            </p>
            <p className="text-sm text-slate-500">{me.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {me.company && <Link href="/dashboard" className="btn-ghost">My company <ArrowRight className="h-4 w-4" /></Link>}
          <form action={signOutAction}>
            <button className="icon-btn" aria-label="Sign out" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </form>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-600 p-5 text-white shadow-[0_16px_36px_-14px_rgb(124_58_237/0.7)]">
          <div aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/15 blur-2xl" />
          <p className="text-sm text-white/80">Owners</p>
          <p className="mt-1 text-3xl font-bold">{owners.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Active companies</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{active}</p>
        </div>
      </div>

      <section className="card mb-5 animate-rise">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100"><UserPlus className="h-4 w-4" /></span>
          <div>
            <h2 className="section-title">Add a company owner</h2>
            <p className="text-sm text-slate-500">They sign in with this Google email and set up their company. You can add your own email too.</p>
          </div>
        </div>
        <ActionForm action={addOwner} submitLabel="Add owner" resetOnSuccess className="space-y-3">
          <Field label="Owner email" name="email" type="email" inputMode="email" required placeholder="owner@example.com" />
        </ActionForm>
      </section>

      <h2 className="section-title mb-3 px-1">All owners</h2>
      {owners.length === 0 ? (
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No owners yet" text="Add an owner email above to onboard your first business." />
      ) : (
        <ul className="space-y-2">
          {owners.map((o) => {
            const cname = o.companyId ? names.get(o.companyId) : undefined;
            return (
              <li key={o.email} className="list-row">
                <Avatar name={cname ?? o.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{cname ?? <span className="text-slate-400">Company not created yet</span>}</p>
                  <p className="truncate text-sm text-slate-500">{o.email}</p>
                </div>
                <form action={removeOwner}>
                  <input type="hidden" name="email" value={o.email} />
                  <ConfirmButton className="btn-danger h-9 px-3 text-xs" message={`Remove ${o.email}${cname ? " and DELETE company " + cname + " with all its data" : ""}?`}>
                    Remove
                  </ConfirmButton>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
