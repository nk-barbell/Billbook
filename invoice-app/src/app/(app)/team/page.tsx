import { UserPlus } from "lucide-react";
import { addStaff, removeStaff } from "@/actions/admin";
import { ActionForm, ConfirmButton, Field, FormSection } from "@/components/ActionForm";
import { Avatar, PageHeader } from "@/components/ui";
import { requireOwner } from "@/lib/session";
import { usersCol, type UserDoc } from "@/lib/types";

export default async function TeamPage() {
  const me = await requireOwner();
  const snap = await usersCol().where("companyId", "==", me.company.id).get();
  const team = snap.docs.map((d) => d.data() as UserDoc)
    .sort((a, b) => (a.role === b.role ? a.createdAt - b.createdAt : a.role === "owner" ? -1 : 1));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Team" subtitle={`${team.length} member${team.length === 1 ? "" : "s"}`} />

      <FormSection
        title="Invite staff"
        description="They sign in with Google using this email and go straight to your company. Staff can do everything except manage the team."
        icon={<UserPlus className="h-4 w-4" />}
      >
        <ActionForm action={addStaff} submitLabel="Add staff" resetOnSuccess className="space-y-3">
          <Field label="Staff email" name="email" type="email" inputMode="email" required placeholder="staff@example.com" />
        </ActionForm>
      </FormSection>

      <ul className="space-y-2">
        {team.map((u) => (
          <li key={u.email} className="list-row">
            <Avatar name={u.name ?? u.email} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.name ?? u.email.split("@")[0]}</p>
              <p className="truncate text-xs text-slate-500">{u.email}</p>
            </div>
            <span className={`pill ${u.role === "owner" ? "bg-linear-to-r from-indigo-500 to-fuchsia-500 text-white" : "bg-slate-100 text-slate-600"}`}>
              {u.role === "owner" ? "Owner" : "Staff"}
            </span>
            {u.role === "staff" && (
              <form action={removeStaff}>
                <input type="hidden" name="email" value={u.email} />
                <ConfirmButton className="btn-danger h-9 px-3 text-xs" message={`Remove ${u.email}?`}>Remove</ConfirmButton>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
