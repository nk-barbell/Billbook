import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/actions/catalog";
import { ConfirmButton } from "@/components/ActionForm";
import { BackLink } from "@/components/BackLink";
import { CustomerForm } from "@/components/CustomerForm";
import { PageHeader } from "@/components/ui";
import { requireCompanyUser } from "@/lib/session";
import { customersCol, withId, type Customer } from "@/lib/types";

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const { company } = await requireCompanyUser();
  const snap = await customersCol(company.id).doc(id).get();
  if (!snap.exists) notFound();
  const customer = withId<Customer>(snap);
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={<BackLink href="/customers" label="Customers" />} title={customer.name} subtitle="Edit customer" />
      <CustomerForm customer={customer} />
      <form action={deleteCustomer} className="mt-8 border-t border-slate-200/70 pt-6">
        <input type="hidden" name="id" value={customer.id} />
        <ConfirmButton message="Delete this customer? Past invoices keep the name.">
          <Trash2 className="h-4 w-4" /> Delete customer
        </ConfirmButton>
      </form>
    </div>
  );
}
