"use client";

import { useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard, X } from "lucide-react";

/** Full-screen camera barcode scanner. Calls onDetect once per scan; caller decides whether to close. */
export function BarcodeScanner({ onDetect, onClose }: { onDetect: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [manual, setManual] = useState("");
  const [flash, setFlash] = useState(false);
  const lastRef = useRef({ code: "", at: 0 });

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (!result) return;
            const code = result.getText();
            const now = Date.now();
            // ignore the same code re-read within 2s
            if (code === lastRef.current.code && now - lastRef.current.at < 2000) return;
            lastRef.current = { code, at: now };
            navigator.vibrate?.(60);
            setFlash(true);
            setTimeout(() => setFlash(false), 250);
            onDetect(code);
          },
        );
        if (cancelled) controls.stop();
        else stop = () => controls.stop();
      } catch {
        setError("Camera not available. Allow camera access (needs HTTPS), or type the code below.");
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-linear-to-b from-black/70 to-transparent p-4 text-white">
        <span className="font-semibold">Scan barcode</span>
        <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-white/80">
            <CameraOff className="h-10 w-10" />
            <p className="text-sm">{error}</p>
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className={`relative h-40 w-[78%] max-w-sm rounded-3xl shadow-[0_0_0_9999px_rgb(2_6_23/0.55)] transition ${flash ? "ring-4 ring-emerald-400" : ""}`}>
              {/* corners */}
              {["top-0 left-0 border-t-4 border-l-4 rounded-tl-3xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-3xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-3xl", "bottom-0 right-0 border-b-4 border-r-4 rounded-br-3xl"].map((c) => (
                <span key={c} className={`absolute h-8 w-8 border-fuchsia-400 ${c}`} />
              ))}
              <span className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 animate-pulse rounded-full bg-linear-to-r from-transparent via-fuchsia-400 to-transparent" />
            </div>
          </div>
        )}
      </div>
      <div className="space-y-2 bg-slate-950 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <p className="flex items-center gap-1.5 text-xs text-white/50"><Keyboard className="h-3.5 w-3.5" /> Or type the code</p>
        <div className="flex gap-2">
          <input
            value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Barcode number"
            className="input flex-1 border-white/10 bg-white/10 font-mono text-white placeholder:text-white/40 focus:bg-white/15" inputMode="numeric"
          />
          <button
            type="button" className="btn-primary"
            onClick={() => { if (manual.trim()) { onDetect(manual.trim()); setManual(""); } }}
          >
            Use
          </button>
        </div>
      </div>
    </div>
  );
}
