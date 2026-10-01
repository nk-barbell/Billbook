import type { ReactNode } from "react";

const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
  "from-cyan-500 to-blue-600",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, size = "md", src }: { name: string; size?: "sm" | "md" | "lg"; src?: string | null }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs rounded-lg" : size === "lg" ? "h-14 w-14 text-lg rounded-2xl" : "h-11 w-11 text-sm rounded-xl";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className={`${dim} shrink-0 bg-white object-cover ring-1 ring-slate-900/5`} />;
  }
  return (
    <span className={`${dim} inline-flex shrink-0 items-center justify-center bg-linear-to-br font-bold text-white shadow-sm ${GRADIENTS[hash(name) % GRADIENTS.length]}`}>
      {initials(name)}
    </span>
  );
}

export function PageHeader({ title, subtitle, action, back }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-5 animate-rise">
      {back}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 md:text-[28px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-50 to-fuchsia-50 text-violet-600 ring-1 ring-violet-100">
        {icon}
      </div>
      <p className="font-semibold text-slate-900">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ status }: { status: { label: string; tone: "paid" | "partial" | "unpaid" | "cancelled" } }) {
  const tones = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    partial: "bg-amber-50 text-amber-700 ring-amber-200/70",
    unpaid: "bg-rose-50 text-rose-700 ring-rose-200/70",
    cancelled: "bg-slate-100 text-slate-500 ring-slate-200",
  };
  const dots = { paid: "bg-emerald-500", partial: "bg-amber-500", unpaid: "bg-rose-500", cancelled: "bg-slate-400" };
  return (
    <span className={`pill ring-1 ${tones[status.tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status.tone]}`} />
      {status.label}
    </span>
  );
}
