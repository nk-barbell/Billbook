export function LogoMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white shadow-[0_12px_28px_-8px_rgb(124_58_237/0.6)] ${className}`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 4h12M6 9h12M6 4c5 0 7 2 7 5s-2 5-7 5l8 6" />
      </svg>
    </span>
  );
}
