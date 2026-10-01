"use client";

import { useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { compressImage } from "@/lib/format";

/** Camera capture or file upload; stores a compressed JPEG data URL in a hidden input. */
export function ImagePicker({ name, defaultValue, max = 640, label = "Photo" }: {
  name: string; defaultValue?: string | null; max?: number; label?: string;
}) {
  const [img, setImg] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      setImg(await compressImage(f, max));
    } catch {
      alert("Could not read that image");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={img} />
      <div className="flex items-center gap-4">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-violet-200 bg-linear-to-br from-violet-50/60 to-fuchsia-50/60 text-violet-300">
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          ) : img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-7 w-7" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn-soft h-10 cursor-pointer">
            <Camera className="h-4 w-4" /> Camera
            <input type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          </label>
          <label className="btn-ghost h-10 cursor-pointer">
            <Upload className="h-4 w-4" /> Upload
            <input type="file" accept="image/*" hidden onChange={onFile} />
          </label>
          {img && (
            <button type="button" className="btn-ghost h-10 px-3 text-rose-600" onClick={() => setImg("")} aria-label="Remove image">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
