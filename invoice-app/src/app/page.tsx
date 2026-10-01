import { redirect } from "next/navigation";
import { getMe } from "@/lib/session";

export default async function Home() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role === "sysadmin") redirect("/admin");
  if (!me.company) redirect("/setup");
  redirect("/dashboard");
}
