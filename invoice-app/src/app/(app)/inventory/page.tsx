import Link from "next/link";
import { Plus } from "lucide-react";
import { InventoryList, type InvRow } from "@/components/InventoryList";
import { PageHeader } from "@/components/ui";
import { rupees } from "@/lib/format";
import { requireCompanyUser } from "@/lib/session";
import { productsCol } from "@/lib/types";

export default async function InventoryPage({ searchParams }: PageProps<"/inventory">) {
  const sp = await searchParams;
  const me = await requireCompanyUser();
  // select() skips the (large) image field
  const snap = await productsCol(me.company.id)
    .select("name", "sku", "barcode", "hsn", "price", "stock", "lowStockAt", "unit", "imgVer").get();
  const rows: InvRow[] = snap.docs
    .map((d) => {
      const x = d.data();
      return {
        id: d.id, name: x.name, sku: x.sku ?? null, barcode: x.barcode ?? null, hsn: x.hsn ?? null,
        price: x.price ?? 0, stock: x.stock ?? 0, lowStockAt: x.lowStockAt ?? 0, unit: x.unit ?? "pcs", imgVer: x.imgVer ?? 0,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  const value = rows.reduce((t, r) => t + Math.max(r.stock, 0) * r.price, 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle={`${rows.length} product${rows.length === 1 ? "" : "s"} · stock value ${rupees(value)}`}
        action={<Link href="/inventory/new" className="btn-primary"><Plus className="h-4 w-4" strokeWidth={2.5} /> <span className="hidden sm:inline">Add product</span><span className="sm:hidden">Add</span></Link>}
      />
      <InventoryList rows={rows} startScan={sp.scan === "1"} />
    </div>
  );
}
