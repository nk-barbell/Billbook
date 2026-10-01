export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];

export const UNITS = ["pcs", "kg", "g", "ltr", "ml", "box", "pack", "dozen", "mtr", "set", "hrs", "nos"];

const inr = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const money = (n: number | string) => inr.format(Number(n));
export const rupees = (n: number | string) => "₹" + inr.format(Number(n));
export const qtyFmt = (n: number | string) => String(Number(n));

export function todayISO() {
  const d = new Date();
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function dmy(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
  "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  let s = "";
  if (n >= 100) { s += ones[Math.floor(n / 100)] + " Hundred "; n %= 100; }
  if (n >= 20) { s += tens[Math.floor(n / 10)] + " "; n %= 10; }
  if (n > 0) s += ones[n] + " ";
  return s;
}

/** 123456.5 -> "Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six and Fifty Paise Only" */
export function amountInWords(amount: number): string {
  const rupeesPart = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupeesPart) * 100);
  let n = rupeesPart;
  let words = "";
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) words += below1000(crore) + "Crore ";
  if (lakh) words += below1000(lakh) + "Lakh ";
  if (thousand) words += below1000(thousand) + "Thousand ";
  if (n) words += below1000(n);
  words = words.trim() || "Zero";
  let out = "Rupees " + words;
  if (paise) out += " and " + below1000(paise).trim() + " Paise";
  return out + " Only";
}

export async function compressImage(file: File, max = 640, quality = 0.7): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}
