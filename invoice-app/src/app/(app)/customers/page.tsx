import Link from "next/link";
import { ChevronRight, Plus, Users } from "lucide-react";
import { Avatar, EmptyState, PageHeader } from "@/components/ui";
import { requireCompanyUser } from "@/lib/session";
import { customersCol, withId, type Customer } from "@/lib/types";

export default async function CustomersPage() {
  const me = await requireCompanyUser();
  const snap = await customersCol(me.company.id).get();
  const rows = snap.docs.map((d) => withId<Customer>(d)).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${rows.length} saved`}
        action={<Link href="/customers/new" className="btn-primary"><Plus className="h-4 w-4" strokeWidth={2.5} /> Add</Link>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="No customers yet"
          text="Save regular customers to bill them faster. Walk-in customers don't need to be saved."
          action={<Link href="/customers/new" className="btn-primary">Add customer</Link>}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/customers/${c.id}`} className="list-row">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-slate-500">{[c.phone, c.state].filter(Boolean).join(" · ") || "No contact details"}</p>
                  {c.gstin && <span className="pill mt-1 bg-indigo-50 font-mono text-[11px] text-indigo-700">{c.gstin}</span>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
