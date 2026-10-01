"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { AlertCircle, Boxes, Loader2, ReceiptIndianRupee, ScanBarcode } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { getClientAuth } from "@/lib/firebase-client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login() {
    setError("");
    setBusy(true);
    try {
      const cred = await signInWithPopup(getClientAuth(), new GoogleAuthProvider());
      const idToken = await cred.user.getIdToken();
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      await signOut(getClientAuth()); // the server cookie is our session; no need to keep the client one
      if (res.status === 403) {
        setError("This email has not been added yet. Ask your administrator or company owner to add you, then try again.");
      } else if (!res.ok) {
        setError("Sign-in failed. Please try again.");
      } else {
        window.location.href = "/";
        return;
      }
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("Sign-in failed. Please try again.");
      }
    }
    setBusy(false);
  }

  const features = [
    { icon: ReceiptIndianRupee, text: "GST invoices in seconds" },
    { icon: ScanBarcode, text: "Scan barcodes with your camera" },
    { icon: Boxes, text: "Stock that updates itself" },
  ];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      {/* glow blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-400/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-fuchsia-400/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl" />

      <div className="relative w-full max-w-md animate-rise">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="h-16 w-16" />
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight">
            <span className="gradient-text">Billbook</span>
          </h1>
          <p className="mt-2 text-slate-500">Invoicing &amp; inventory for your shop, built for your phone.</p>
        </div>

        <div className="card !p-6 sm:!p-8">
          <ul className="mb-6 space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Icon className="h-4 w-4" /></span>
                {text}
              </li>
            ))}
          </ul>

          {error && (
            <p className="mb-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200/70">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          <button onClick={login} disabled={busy} className="btn-ghost h-12 w-full text-[15px]">
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
              </svg>
            )}
            {busy ? "Signing in…" : "Continue with Google"}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">Access is by invitation. Your admin or owner adds your email.</p>
        </div>
      </div>
    </main>
  );
}
