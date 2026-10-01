"use client";

import { useActionState, useRef, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import type { FormState } from "@/actions/admin";

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  resetOnSuccess = false,
  className = "space-y-4",
  fullWidthSubmit = false,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  submitLabel?: string;
  resetOnSuccess?: boolean;
  className?: string;
  fullWidthSubmit?: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await action(prev, fd);
    if (res?.ok && resetOnSuccess) ref.current?.reset();
    return res;
  }, undefined);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state?.error && (
        <p className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200/70">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-700 ring-1 ring-emerald-200/70">
          <CheckCircle2 className="h-4 w-4" /> Saved
        </p>
      )}
      <button className={`btn-primary ${fullWidthSubmit ? "w-full" : "w-full sm:w-auto sm:min-w-40"}`} disabled={pending}>
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : submitLabel}
      </button>
    </form>
  );
}

export function Field({
  label, name, defaultValue, type = "text", placeholder, required, inputMode, className = "", hint,
}: {
  label: string; name: string; defaultValue?: string | number | null; type?: string; placeholder?: string;
  required?: boolean; inputMode?: "numeric" | "decimal" | "text" | "tel" | "email"; className?: string; hint?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        {label}{required && <span className="text-fuchsia-600"> *</span>}
      </label>
      <input
        id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder}
        required={required} inputMode={inputMode} step={type === "number" ? "any" : undefined} className="input"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function ConfirmButton({ children, message, className = "btn-danger" }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

export function FormSection({ title, description, icon, children }: { title: string; description?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="card animate-rise space-y-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-50 to-fuchsia-50 text-violet-600 ring-1 ring-violet-100">
            {icon}
          </span>
        )}
        <div>
          <h2 className="section-title">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
