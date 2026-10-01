"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { requireCompanyUser } from "@/lib/session";
import { calcInvoice, resolveTaxMode, type TaxMode } from "@/lib/calc";
import { companyRef, customersCol, invoicesCol, productsCol, type Invoice } from "@/lib/types";

export type InvoicePayload = {
  date: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  customerGstin: string;
  customerAddress: string;
  placeOfSupply: string;
  taxMode: TaxMode | "default";
  notes: string;
  paidNow: number;
  payMode: string;
  lines: {
    productId: string | null;
    name: string;
    hsn: string;
    unit: string;
    qty: number;
    rate: number;
    discountPct: number;
    taxRate: number;
  }[];
};

export async function createInvoice(p: InvoicePayload): Promise<{ id?: string; error?: string }> {
  const me = await requireCompanyUser();
  const cid = me.company.id;

  const lines = p.lines.filter((l) => l.name.trim() && l.qty > 0);
  if (!lines.length) return { error: "Add at least one item" };
  if (lines.some((l) => l.rate < 0 || l.discountPct < 0 || l.discountPct > 100 || l.taxRate < 0)) {
    return { error: "Check rates, discounts and tax values" };
  }

  let cust = { name: p.customerName.trim(), phone: p.customerPhone, gstin: p.customerGstin, address: p.customerAddress };
  if (p.customerId) {
    const c = await customersCol(cid).doc(p.customerId).get();
    if (!c.exists) return { error: "Customer not found" };
    const d = c.data()!;
    cust = { name: d.name, phone: d.phone ?? "", gstin: d.gstin ?? "", address: d.address ?? "" };
  }
  if (!cust.name) cust.name = "Walk-in Customer";

  try {
    const id = await db.runTransaction(async (tx) => {
      // ---- reads first ----
      const cSnap = await tx.get(companyRef(cid));
      const company = cSnap.data()!;
      const prodIds = [...new Set(lines.map((l) => l.productId).filter((x): x is string => !!x))];
      const prodSnaps = prodIds.length ? await tx.getAll(...prodIds.map((i) => productsCol(cid).doc(i))) : [];
      const stock = new Map(prodSnaps.filter((s) => s.exists).map((s) => [s.id, Number(s.data()!.stock) || 0]));

      const defaultType: string = company.defaultTaxType ?? "auto";
      const inclusive: boolean = company.pricesIncludeTax ?? false;
      const taxMode: TaxMode =
        p.taxMode === "default" ? resolveTaxMode(defaultType, company.state, p.placeOfSupply || company.state) : p.taxMode;
      const calc = calcInvoice(lines, taxMode, inclusive);

      const seq: number = company.nextInvoiceNo ?? 1;
      const number = `${company.invoicePrefix ?? "INV-"}${String(seq).padStart(4, "0")}`;
      const paid = Math.min(Math.max(p.paidNow || 0, 0), calc.total);

      const invRef = invoicesCol(cid).doc();
      const inv: Omit<Invoice, "id"> = {
        number,
        date: p.date,
        customerId: p.customerId,
        customerName: cust.name,
        customerPhone: cust.phone || null,
        customerGstin: cust.gstin || null,
        customerAddress: cust.address || null,
        placeOfSupply: p.placeOfSupply || null,
        taxMode,
        pricesIncludeTax: inclusive,
        subtotal: calc.subtotal,
        discountTotal: calc.discountTotal,
        cgst: calc.cgst,
        sgst: calc.sgst,
        igst: calc.igst,
        roundOff: calc.roundOff,
        total: calc.total,
        paid,
        due: Math.round((calc.total - paid) * 100) / 100,
        status: "active",
        notes: p.notes || null,
        createdBy: me.email,
        createdAt: Date.now(),
        items: calc.items.map((it, i) => ({
          productId: lines[i].productId && stock.has(lines[i].productId!) ? lines[i].productId : null,
          name: lines[i].name.trim(),
          hsn: lines[i].hsn || null,
          unit: lines[i].unit || null,
          qty: it.qty,
          rate: it.rate,
          discountPct: it.discountPct,
          taxRate: taxMode === "none" ? 0 : it.taxRate,
          taxable: it.taxable,
          taxAmount: it.tax,
          amount: it.amount,
        })),
        payments: paid > 0 ? [{ amount: paid, mode: p.payMode || "cash", paidOn: p.date }] : [],
      };

      // ---- writes ----
      tx.update(companyRef(cid), { nextInvoiceNo: seq + 1 });
      tx.set(invRef, inv);
      const perProduct = new Map<string, number>();
      lines.forEach((l) => {
        if (l.productId && stock.has(l.productId)) perProduct.set(l.productId, (perProduct.get(l.productId) ?? 0) + l.qty);
      });
      for (const [pid, qty] of perProduct) {
        tx.update(productsCol(cid).doc(pid), { stock: (stock.get(pid) ?? 0) - qty });
      }
      return invRef.id;
    });
    revalidatePath("/invoices");
    revalidatePath("/inventory");
    revalidatePath("/dashboard");
    return { id };
  } catch (e) {
    console.error(e);
    return { error: "Could not save the invoice. Please try again." };
  }
}

export async function addPayment(fd: FormData) {
  const me = await requireCompanyUser();
  const id = String(fd.get("id"));
  const amount = Number(fd.get("amount"));
  if (!(amount > 0)) return;
  const ref = invoicesCol(me.company.id).doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const inv = snap.data() as Invoice;
    if (inv.status !== "active") return;
    const pay = Math.min(amount, inv.total - inv.paid);
    if (pay <= 0) return;
    const paid = Math.round((inv.paid + pay) * 100) / 100;
    tx.update(ref, {
      paid,
      due: Math.max(Math.round((inv.total - paid) * 100) / 100, 0),
      payments: [...(inv.payments ?? []), { amount: pay, mode: String(fd.get("mode") || "cash"), paidOn: new Date().toISOString().slice(0, 10) }],
    });
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function cancelInvoice(fd: FormData) {
  const me = await requireCompanyUser();
  const cid = me.company.id;
  const id = String(fd.get("id"));
  const ref = invoicesCol(cid).doc(id);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const inv = snap.data() as Invoice;
    if (inv.status === "cancelled") return;
    const back = new Map<string, number>();
    inv.items.forEach((it) => it.productId && back.set(it.productId, (back.get(it.productId) ?? 0) + it.qty));
    const prodSnaps = back.size ? await tx.getAll(...[...back.keys()].map((i) => productsCol(cid).doc(i))) : [];
    prodSnaps.forEach((ps) => {
      if (ps.exists) tx.update(ps.ref, { stock: (Number(ps.data()!.stock) || 0) + (back.get(ps.id) ?? 0) });
    });
    tx.update(ref, { status: "cancelled", due: 0 });
  });
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}
