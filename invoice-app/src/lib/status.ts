export type StatusTone = "paid" | "partial" | "unpaid" | "cancelled";

export function statusOf(inv: { status: string; total: number; paid: number }): { label: string; tone: StatusTone } {
  if (inv.status === "cancelled") return { label: "Cancelled", tone: "cancelled" };
  if (inv.total - inv.paid <= 0.004) return { label: "Paid", tone: "paid" };
  if (inv.paid > 0) return { label: "Partial", tone: "partial" };
  return { label: "Unpaid", tone: "unpaid" };
}
