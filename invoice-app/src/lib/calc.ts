// Shared by the invoice builder (live preview) and the server action (authoritative).
export type TaxMode = "cgst_sgst" | "igst" | "none";

export type LineInput = {
  qty: number;
  rate: number;
  discountPct: number;
  taxRate: number;
};

export type LineResult = LineInput & {
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  amount: number;
};

export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcLine(l: LineInput, taxMode: TaxMode, inclusive: boolean): LineResult {
  const gross = l.qty * l.rate;
  const discount = gross * (l.discountPct / 100);
  const net = gross - discount;
  const rate = taxMode === "none" ? 0 : l.taxRate;
  let taxable: number, tax: number;
  if (inclusive) {
    taxable = net / (1 + rate / 100);
    tax = net - taxable;
  } else {
    taxable = net;
    tax = net * (rate / 100);
  }
  taxable = r2(taxable);
  tax = r2(tax);
  return { ...l, gross: r2(gross), discount: r2(discount), taxable, tax, amount: r2(taxable + tax) };
}

export function calcInvoice(lines: LineInput[], taxMode: TaxMode, inclusive: boolean) {
  const items = lines.map((l) => calcLine(l, taxMode, inclusive));
  const subtotal = r2(items.reduce((s, i) => s + i.taxable, 0));
  const discountTotal = r2(items.reduce((s, i) => s + i.discount, 0));
  const totalTax = r2(items.reduce((s, i) => s + i.tax, 0));
  let cgst = 0, sgst = 0, igst = 0;
  if (taxMode === "cgst_sgst") {
    cgst = r2(totalTax / 2);
    sgst = r2(totalTax - cgst);
  } else if (taxMode === "igst") {
    igst = totalTax;
  }
  const exact = subtotal + totalTax;
  const total = Math.round(exact);
  const roundOff = r2(total - exact);
  return { items, subtotal, discountTotal, cgst, sgst, igst, roundOff, total };
}

/** Decide tax split from company setting, supplier state and place of supply. */
export function resolveTaxMode(
  defaultType: string,
  companyState: string | null | undefined,
  placeOfSupply: string | null | undefined,
): TaxMode {
  if (defaultType === "none") return "none";
  if (defaultType === "cgst_sgst") return "cgst_sgst";
  if (defaultType === "igst") return "igst";
  if (!companyState || !placeOfSupply) return "cgst_sgst";
  return companyState === placeOfSupply ? "cgst_sgst" : "igst";
}
