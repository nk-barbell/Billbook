import { Boxes, IndianRupee, Tag } from "lucide-react";
import { saveProduct } from "@/actions/catalog";
import type { Product } from "@/lib/types";
import { UNITS } from "@/lib/format";
import { ActionForm, Field, FormSection } from "./ActionForm";
import { BarcodeField } from "./BarcodeField";
import { ImagePicker } from "./ImagePicker";

export function ProductForm({ product, taxRates, defaultTaxRate }: { product?: Product; taxRates: number[]; defaultTaxRate: number }) {
  const rate = product ? product.taxRate : defaultTaxRate;
  const rates = taxRates.includes(rate) ? taxRates : [...taxRates, rate].sort((a, b) => a - b);
  return (
    <ActionForm action={saveProduct} submitLabel={product ? "Save changes" : "Add product"}>
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormSection title="Product" icon={<Tag className="h-4 w-4" />}>
        <ImagePicker name="image" defaultValue={product?.image} />
        <Field label="Name" name="name" defaultValue={product?.name} required placeholder="e.g. Tata Salt 1kg" />
        <BarcodeField defaultValue={product?.barcode} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU / code" name="sku" defaultValue={product?.sku} />
          <Field label="HSN / SAC" name="hsn" defaultValue={product?.hsn} inputMode="numeric" />
        </div>
      </FormSection>

      <FormSection title="Pricing & tax" icon={<IndianRupee className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Selling price (₹)" name="price" type="number" inputMode="decimal" defaultValue={product?.price} required />
          <Field label="Cost price (₹)" name="costPrice" type="number" inputMode="decimal" defaultValue={product?.costPrice} />
          <div>
            <label className="label" htmlFor="taxRate">GST rate</label>
            <select id="taxRate" name="taxRate" defaultValue={rate} className="input">
              {rates.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="unit">Unit</label>
            <select id="unit" name="unit" defaultValue={product?.unit ?? "pcs"} className="input">
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </div>
        </div>
      </FormSection>

      <FormSection title="Stock" icon={<Boxes className="h-4 w-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="In stock" name="stock" type="number" inputMode="decimal" defaultValue={product?.stock ?? 0} />
          <Field label="Alert me below" name="lowStockAt" type="number" inputMode="decimal" defaultValue={product?.lowStockAt ?? 0} />
        </div>
      </FormSection>
    </ActionForm>
  );
}
