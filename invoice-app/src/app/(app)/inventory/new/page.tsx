import { BackLink } from "@/components/BackLink";
import { ProductForm } from "@/components/ProductForm";
import { PageHeader } from "@/components/ui";
import { requireCompanyUser } from "@/lib/session";

export default async function NewProductPage() {
  const { company } = await requireCompanyUser();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={<BackLink href="/inventory" label="Inventory" />} title="Add product" subtitle="Snap a photo, scan the barcode, set the price." />
      <ProductForm taxRates={company.taxRates} defaultTaxRate={company.defaultTaxRate} />
    </div>
  );
}
