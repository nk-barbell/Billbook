"use client";

import { useState } from "react";
import { ScanBarcode } from "lucide-react";
import { BarcodeScanner } from "./BarcodeScanner";

export function BarcodeField({ defaultValue }: { defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label className="label" htmlFor="barcode">Barcode</label>
      <div className="flex gap-2">
        <input id="barcode" name="barcode" value={value} onChange={(e) => setValue(e.target.value)} className="input font-mono tracking-wide" inputMode="numeric" placeholder="Scan or type" />
        <button type="button" className="btn-soft shrink-0" onClick={() => setOpen(true)}>
          <ScanBarcode className="h-4 w-4" /> Scan
        </button>
      </div>
      {open && (
        <BarcodeScanner
          onDetect={(c) => { setValue(c); setOpen(false); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
