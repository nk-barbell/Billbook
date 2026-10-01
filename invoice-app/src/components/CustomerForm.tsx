import { MapPin, UserRound } from "lucide-react";
import { saveCustomer } from "@/actions/catalog";
import type { Customer } from "@/lib/types";
import { INDIAN_STATES } from "@/lib/format";
import { ActionForm, Field, FormSection } from "./ActionForm";

export function CustomerForm({ customer }: { customer?: Customer }) {
  return (
    <ActionForm action={saveCustomer} submitLabel={customer ? "Save changes" : "Add customer"}>
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <FormSection title="Contact" icon={<UserRound className="h-4 w-4" />}>
        <Field label="Name" name="name" defaultValue={customer?.name} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" name="phone" type="tel" inputMode="tel" defaultValue={customer?.phone} />
          <Field label="Email" name="email" type="email" inputMode="email" defaultValue={customer?.email} />
        </div>
      </FormSection>
      <FormSection title="Billing details" description="Used on GST invoices." icon={<MapPin className="h-4 w-4" />}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="GSTIN" name="gstin" defaultValue={customer?.gstin} hint="Leave empty for unregistered customers" />
          <div>
            <label className="label" htmlFor="state">State (place of supply)</label>
            <select id="state" name="state" defaultValue={customer?.state ?? ""} className="input">
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="address">Address</label>
          <textarea id="address" name="address" rows={2} defaultValue={customer?.address ?? ""} className="input" />
        </div>
      </FormSection>
    </ActionForm>
  );
}
