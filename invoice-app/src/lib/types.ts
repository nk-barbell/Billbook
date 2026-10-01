import type { DocumentSnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "./firebase-admin";

export type Company = {
  id: string;
  name: string;
  legalName: string | null;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  upiId: string | null;
  bankDetails: string | null;
  terms: string | null;
  defaultTaxType: string; // 'auto' | 'cgst_sgst' | 'igst' | 'none'
  defaultTaxRate: number;
  taxRates: number[];
  pricesIncludeTax: boolean;
  invoicePrefix: string;
  nextInvoiceNo: number;
};

export type UserDoc = { email: string; name: string | null; role: "owner" | "staff"; companyId: string | null; createdAt: number };

export type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  hsn: string | null;
  unit: string;
  price: number;
  costPrice: number;
  taxRate: number;
  stock: number;
  lowStockAt: number;
  image: string | null; // compressed data URL
  imgVer: number; // length of image, 0 if none (lets lists skip loading the image)
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  state: string | null;
};

export type InvoiceItem = {
  productId: string | null;
  name: string;
  hsn: string | null;
  unit: string | null;
  qty: number;
  rate: number;
  discountPct: number;
  taxRate: number;
  taxable: number;
  taxAmount: number;
  amount: number;
};

export type Payment = { amount: number; mode: string; paidOn: string };

export type Invoice = {
  id: string;
  number: string;
  date: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerGstin: string | null;
  customerAddress: string | null;
  placeOfSupply: string | null;
  taxMode: "cgst_sgst" | "igst" | "none";
  pricesIncludeTax: boolean;
  subtotal: number;
  discountTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  paid: number;
  due: number; // 0 for cancelled invoices
  status: "active" | "cancelled";
  notes: string | null;
  createdBy: string;
  createdAt: number;
  items: InvoiceItem[];
  payments: Payment[];
};

export const companyRef = (companyId: string) => db.collection("companies").doc(companyId);
export const productsCol = (companyId: string) => companyRef(companyId).collection("products");
export const customersCol = (companyId: string) => companyRef(companyId).collection("customers");
export const invoicesCol = (companyId: string) => companyRef(companyId).collection("invoices");
export const usersCol = () => db.collection("users");

export function withId<T>(snap: DocumentSnapshot | QueryDocumentSnapshot): T {
  return { id: snap.id, ...snap.data() } as T;
}

/** Fill defaults so older/partial docs never produce undefined in the UI. */
export function toCompany(snap: DocumentSnapshot): Company {
  const d = snap.data() ?? {};
  return {
    id: snap.id,
    name: d.name ?? "",
    legalName: d.legalName ?? null,
    gstin: d.gstin ?? null,
    pan: d.pan ?? null,
    address: d.address ?? null,
    city: d.city ?? null,
    state: d.state ?? null,
    pincode: d.pincode ?? null,
    phone: d.phone ?? null,
    email: d.email ?? null,
    logo: d.logo ?? null,
    upiId: d.upiId ?? null,
    bankDetails: d.bankDetails ?? null,
    terms: d.terms ?? null,
    defaultTaxType: d.defaultTaxType ?? "auto",
    defaultTaxRate: d.defaultTaxRate ?? 18,
    taxRates: d.taxRates ?? [0, 5, 12, 18, 28],
    pricesIncludeTax: d.pricesIncludeTax ?? false,
    invoicePrefix: d.invoicePrefix ?? "INV-",
    nextInvoiceNo: d.nextInvoiceNo ?? 1,
  };
}
