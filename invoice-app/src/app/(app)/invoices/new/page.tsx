import { InvoiceBuilder, type BCustomer, type BProduct } from "@/components/InvoiceBuilder";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/ui";
import { requireCompanyUser } from "@/lib/session";
import { customersCol, productsCol } from "@/lib/types";

export default async function NewInvoicePage() {
  const { company } = await requireCompanyUser();
  const [pSnap, cSnap] = await Promise.all([
    productsCol(company.id).select("name", "barcode", "sku", "hsn", "unit", "price", "taxRate", "stock", "imgVer").get(),
    customersCol(company.id).get(),
  ]);
  const prods: BProduct[] = pSnap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id, name: x.name, barcode: x.barcode ?? null, sku: x.sku ?? null, hsn: x.hsn ?? null,
        unit: x.unit ?? "pcs", price: x.price ?? 0, taxRate: x.taxRate ?? 0, stock: x.stock ?? 0, hasImage: (x.imgVer ?? 0) > 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const custs: BCustomer[] = cSnap.docs
    .map((d) => {
      const x = d.data();
      return { id: d.id, name: x.name, phone: x.phone ?? null, gstin: x.gstin ?? null, address: x.address ?? null, state: x.state ?? null };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <PageHeader back={<BackLink href="/invoices" label="Invoices" />} title="New invoice" subtitle={`Next number ${company.invoicePrefix}${String(company.nextInvoiceNo).padStart(4, "0")}`} />
      <InvoiceBuilder
        products={prods}
        customers={custs}
        company={{
          state: company.state, defaultTaxType: company.defaultTaxType,
          pricesIncludeTax: company.pricesIncludeTax, taxRates: company.taxRates,
        }}
      />
    </div>
  );
}
