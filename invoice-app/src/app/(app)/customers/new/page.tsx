import { BackLink } from "@/components/BackLink";
import { CustomerForm } from "@/components/CustomerForm";
import { PageHeader } from "@/components/ui";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={<BackLink href="/customers" label="Customers" />} title="Add customer" />
      <CustomerForm />
    </div>
  );
}
