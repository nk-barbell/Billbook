import { Building2, FileText, Landmark, MapPin, Percent } from "lucide-react";
import { updateCompany } from "@/actions/company";
import { ActionForm, Field, FormSection } from "@/components/ActionForm";
import { ImagePicker } from "@/components/ImagePicker";
import { PageHeader } from "@/components/ui";
import { INDIAN_STATES } from "@/lib/format";
import { requireCompanyUser } from "@/lib/session";

export default async function CompanyPage() {
  const { company: c } = await requireCompanyUser();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Company" subtitle="These details appear on every invoice." />
      <ActionForm action={updateCompany} submitLabel="Save company">
        <FormSection title="Business" icon={<Building2 className="h-4 w-4" />}>
          <ImagePicker name="logo" defaultValue={c.logo} max={300} label="Logo" />
          <Field label="Business name (shown on bill)" name="name" defaultValue={c.name} required />
          <Field label="Legal name" name="legalName" defaultValue={c.legalName} hint="Optional, if different from the business name" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="GSTIN" name="gstin" defaultValue={c.gstin} placeholder="22AAAAA0000A1Z5" />
            <Field label="PAN" name="pan" defaultValue={c.pan} />
            <Field label="Phone" name="phone" defaultValue={c.phone} type="tel" inputMode="tel" />
            <Field label="Email" name="email" defaultValue={c.email} type="email" inputMode="email" />
          </div>
        </FormSection>

        <FormSection title="Address" icon={<MapPin className="h-4 w-4" />}>
          <div>
            <label className="label" htmlFor="address">Street address</label>
            <textarea id="address" name="address" defaultValue={c.address ?? ""} rows={2} className="input" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="City" name="city" defaultValue={c.city} />
            <div>
              <label className="label" htmlFor="state">State</label>
              <select id="state" name="state" defaultValue={c.state ?? ""} className="input">
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <Field label="Pincode" name="pincode" defaultValue={c.pincode} inputMode="numeric" />
          </div>
        </FormSection>

        <FormSection title="Tax" description="Your state decides whether bills use CGST + SGST or IGST." icon={<Percent className="h-4 w-4" />}>
          <div>
            <label className="label" htmlFor="defaultTaxType">Default tax type</label>
            <select id="defaultTaxType" name="defaultTaxType" defaultValue={c.defaultTaxType} className="input">
              <option value="auto">Auto: CGST + SGST in-state, IGST outside</option>
              <option value="cgst_sgst">Always CGST + SGST</option>
              <option value="igst">Always IGST</option>
              <option value="none">No tax (unregistered / composition)</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default GST % for new products" name="defaultTaxRate" type="number" inputMode="decimal" defaultValue={c.defaultTaxRate} />
            <Field label="GST slabs offered" name="taxRates" defaultValue={c.taxRates.join(", ")} hint="Comma separated, e.g. 0, 5, 12, 18, 28" />
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200/70">
            <span>
              <span className="block text-sm font-semibold">Prices include tax</span>
              <span className="block text-xs text-slate-500">Turn on if your selling prices already include GST.</span>
            </span>
            <span className="relative inline-flex shrink-0">
              <input type="checkbox" name="pricesIncludeTax" defaultChecked={c.pricesIncludeTax} className="peer sr-only" />
              <span className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-linear-to-r peer-checked:from-indigo-500 peer-checked:to-fuchsia-500" />
              <span className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </span>
          </label>
        </FormSection>

        <FormSection title="Invoice" icon={<FileText className="h-4 w-4" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Invoice number prefix" name="invoicePrefix" defaultValue={c.invoicePrefix} hint={`Next: ${c.invoicePrefix}${String(c.nextInvoiceNo).padStart(4, "0")}`} />
            <Field label="UPI ID" name="upiId" defaultValue={c.upiId} placeholder="name@bank" hint="Adds a scan-to-pay QR on unpaid bills" />
          </div>
          <div>
            <label className="label" htmlFor="terms">Terms &amp; conditions</label>
            <textarea id="terms" name="terms" defaultValue={c.terms ?? ""} rows={3} className="input" placeholder="Goods once sold will not be taken back." />
          </div>
        </FormSection>

        <FormSection title="Bank details" description="Printed on invoices for bank transfers." icon={<Landmark className="h-4 w-4" />}>
          <textarea id="bankDetails" name="bankDetails" defaultValue={c.bankDetails ?? ""} rows={3} className="input" placeholder={"Bank name\nA/c no.\nIFSC"} />
        </FormSection>
      </ActionForm>
    </div>
  );
}
