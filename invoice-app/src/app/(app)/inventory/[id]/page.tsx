import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/actions/catalog";
import { ConfirmButton } from "@/components/ActionForm";
import { BackLink } from "@/components/BackLink";
import { ProductForm } from "@/components/ProductForm";
import { PageHeader } from "@/components/ui";
import { requireCompanyUser } from "@/lib/session";
import { productsCol, withId, type Product } from "@/lib/types";

export default async function EditProductPage({ params }: PageProps<"/inventory/[id]">) {
  const { id } = await params;
  const { company } = await requireCompanyUser();
  const snap = await productsCol(company.id).doc(id).get();
  if (!snap.exists) notFound();
  const product = withId<Product>(snap);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={<BackLink href="/inventory" label="Inventory" />} title={product.name} subtitle="Edit product" />
      <ProductForm product={product} taxRates={company.taxRates} defaultTaxRate={company.defaultTaxRate} />
      <form action={deleteProduct} className="mt-8 border-t border-slate-200/70 pt-6">
        <input type="hidden" name="id" value={product.id} />
        <ConfirmButton message="Delete this product? Past invoices keep their lines.">
          <Trash2 className="h-4 w-4" /> Delete product
        </ConfirmButton>
      </form>
    </div>
  );
}
