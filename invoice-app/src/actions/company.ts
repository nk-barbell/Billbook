"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import { getMe, requireCompanyUser } from "@/lib/session";
import { companyRef, usersCol } from "@/lib/types";
import type { FormState } from "./admin";

const s = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};

export async function createCompany(_: FormState, fd: FormData): Promise<FormState> {
  const me = await getMe();
  if (!me || me.role !== "owner") redirect("/");
  if (me.company) redirect("/dashboard");
  const name = s(fd.get("name"));
  if (!name) return { error: "Company name is required" };
  const ref = db.collection("companies").doc();
  await ref.set({
    name, email: me.email, defaultTaxType: "auto", defaultTaxRate: 18, taxRates: [0, 5, 12, 18, 28],
    pricesIncludeTax: false, invoicePrefix: "INV-", nextInvoiceNo: 1, createdAt: Date.now(),
  });
  await usersCol().doc(me.email).update({ companyId: ref.id });
  redirect("/company");
}

export async function updateCompany(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireCompanyUser();
  const name = s(fd.get("name"));
  if (!name) return { error: "Company name is required" };
  const gstin = s(fd.get("gstin"))?.toUpperCase() ?? null;
  if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) {
    return { error: "GSTIN format looks wrong (it should be 15 characters)" };
  }
  const rates = String(fd.get("taxRates") ?? "")
    .split(",").map((x) => x.trim()).filter(Boolean).map(Number).filter((x) => Number.isFinite(x) && x >= 0 && x <= 100);
  const uniqueRates = [...new Set(rates)].sort((a, b) => a - b);
  await companyRef(me.company.id).update({
    name,
    legalName: s(fd.get("legalName")),
    gstin,
    pan: s(fd.get("pan"))?.toUpperCase() ?? null,
    address: s(fd.get("address")),
    city: s(fd.get("city")),
    state: s(fd.get("state")),
    pincode: s(fd.get("pincode")),
    phone: s(fd.get("phone")),
    email: s(fd.get("email")),
    logo: s(fd.get("logo")),
    upiId: s(fd.get("upiId")),
    bankDetails: s(fd.get("bankDetails")),
    terms: s(fd.get("terms")),
    defaultTaxType: String(fd.get("defaultTaxType") || "auto"),
    defaultTaxRate: Number(fd.get("defaultTaxRate")) || 0,
    taxRates: uniqueRates.length ? uniqueRates : [0, 5, 12, 18, 28],
    pricesIncludeTax: fd.get("pricesIncludeTax") === "on",
    invoicePrefix: s(fd.get("invoicePrefix")) ?? "INV-",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}
