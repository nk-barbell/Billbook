import { redirect } from "next/navigation";
import { createCompany } from "@/actions/company";
import { ActionForm, Field } from "@/components/ActionForm";
import { LogoMark } from "@/components/Logo";
import { getMe } from "@/lib/session";

export default async function SetupPage() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role !== "owner") redirect("/");
  if (me.company) redirect("/dashboard");
  const first = me.name.split(" ")[0];
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-fuchsia-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-20 h-80 w-80 rounded-full bg-indigo-400/25 blur-3xl" />
      <div className="relative w-full max-w-md animate-rise">
        <LogoMark />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">Welcome, <span className="gradient-text">{first}</span> 👋</h1>
        <p className="mt-2 mb-6 text-slate-500">Let&apos;s set up your business. You can add GST, logo and bank details next.</p>
        <div className="card !p-6">
          <ActionForm action={createCompany} submitLabel="Create my company" fullWidthSubmit>
            <Field label="Business / shop name" name="name" required placeholder="e.g. Sharma General Store" />
          </ActionForm>
        </div>
      </div>
    </main>
  );
}
