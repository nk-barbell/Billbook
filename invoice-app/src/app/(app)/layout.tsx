import { BottomBar, MobileHeader, Sidebar, type NavItem } from "@/components/Nav";
import { requireCompanyUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireCompanyUser();
  const extra: NavItem[] = [
    ...(me.role === "owner" ? [{ href: "/team", label: "Team", icon: "team" } as NavItem] : []),
    { href: "/company", label: "Company", icon: "company" },
    ...(me.isSysadmin ? [{ href: "/admin", label: "Admin", icon: "admin" } as NavItem] : []),
  ];
  const items: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/invoices", label: "Invoices", icon: "invoices" },
    { href: "/inventory", label: "Inventory", icon: "stock" },
    { href: "/customers", label: "Customers", icon: "customers" },
    ...extra,
  ];
  const company = { name: me.company.name, logo: me.company.logo };
  const user = { name: me.name, email: me.email, role: me.role };

  return (
    <div className="flex min-h-screen">
      <Sidebar items={items} company={company} user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader company={company} user={user} menu={extra} />
        <main className="flex-1 px-4 pt-5 pb-32 md:px-8 md:pt-8 md:pb-10">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
      <BottomBar />
    </div>
  );
}
