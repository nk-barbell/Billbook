"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCompanyUser } from "@/lib/session";
import { customersCol, productsCol } from "@/lib/types";
import type { FormState } from "./admin";

const s = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
};
const n = (v: FormDataEntryValue | null) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireCompanyUser();
  const name = s(fd.get("name"));
  if (!name) return { error: "Product name is required" };
  const barcode = s(fd.get("barcode"));
  const id = String(fd.get("id") ?? "");
  const col = productsCol(me.company.id);

  if (barcode) {
    const dup = await col.where("barcode", "==", barcode).limit(2).get();
    if (dup.docs.some((d) => d.id !== id)) return { error: "Another product already uses this barcode" };
  }

  const image = s(fd.get("image"));
  const values = {
    name,
    sku: s(fd.get("sku")),
    barcode,
    hsn: s(fd.get("hsn")),
    unit: s(fd.get("unit")) ?? "pcs",
    price: n(fd.get("price")),
    costPrice: n(fd.get("costPrice")),
    taxRate: n(fd.get("taxRate")),
    stock: n(fd.get("stock")),
    lowStockAt: n(fd.get("lowStockAt")),
    image,
    imgVer: image ? image.length : 0,
  };
  if (id) {
    const ref = col.doc(id);
    if (!(await ref.get()).exists) return { error: "Product not found" };
    await ref.update(values);
  } else {
    await col.add({ ...values, createdAt: Date.now() });
  }
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function deleteProduct(fd: FormData) {
  const me = await requireCompanyUser();
  await productsCol(me.company.id).doc(String(fd.get("id"))).delete();
  revalidatePath("/inventory");
  redirect("/inventory");
}

export async function saveCustomer(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireCompanyUser();
  const name = s(fd.get("name"));
  if (!name) return { error: "Customer name is required" };
  const id = String(fd.get("id") ?? "");
  const values = {
    name,
    gstin: s(fd.get("gstin"))?.toUpperCase() ?? null,
    phone: s(fd.get("phone")),
    email: s(fd.get("email")),
    address: s(fd.get("address")),
    state: s(fd.get("state")),
  };
  const col = customersCol(me.company.id);
  if (id) {
    const ref = col.doc(id);
    if (!(await ref.get()).exists) return { error: "Customer not found" };
    await ref.update(values);
  } else {
    await col.add({ ...values, createdAt: Date.now() });
  }
  revalidatePath("/customers");
  redirect("/customers");
}

export async function deleteCustomer(fd: FormData) {
  const me = await requireCompanyUser();
  await customersCol(me.company.id).doc(String(fd.get("id"))).delete();
  revalidatePath("/customers");
  redirect("/customers");
}
