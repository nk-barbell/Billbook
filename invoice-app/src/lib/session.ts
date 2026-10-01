import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, db } from "./firebase-admin";
import { toCompany, usersCol, type Company, type UserDoc } from "./types";

export const SESSION_COOKIE = "session";
export type Role = "sysadmin" | "owner" | "staff";
export type Me = { email: string; name: string; role: Role; isSysadmin: boolean; company: Company | null };

const sysadminList = () => (process.env.SYSADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const isSysadmin = (email: string) => sysadminList().includes(email);

/** Is this email allowed to sign in? */
export async function isAllowedEmail(email: string) {
  if (isSysadmin(email)) return true;
  return (await usersCol().doc(email).get()).exists;
}

/** Current user, resolved fresh from Firestore so role/company changes apply immediately. */
export const getMe = cache(async (): Promise<Me | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  let email: string, name: string;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie);
    email = (decoded.email ?? "").toLowerCase();
    name = decoded.name ?? email;
  } catch {
    return null;
  }
  if (!email) return null;
  const admin = isSysadmin(email);
  const snap = await usersCol().doc(email).get();
  // An admin with no owner/staff record is admin-only; with one, they also get that company.
  if (!snap.exists) return admin ? { email, name, role: "sysadmin", isSysadmin: true, company: null } : null;
  const u = snap.data() as UserDoc;
  let company: Company | null = null;
  if (u.companyId) {
    const c = await db.collection("companies").doc(u.companyId).get();
    if (c.exists) company = toCompany(c);
  }
  return { email, name: u.name ?? name, role: u.role, isSysadmin: admin, company };
});

export async function requireCompanyUser() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (me.role === "sysadmin") redirect("/admin");
  if (!me.company) redirect("/setup");
  return { ...me, company: me.company };
}

export async function requireOwner() {
  const me = await requireCompanyUser();
  if (me.role !== "owner") redirect("/dashboard");
  return me;
}

export async function requireSysadmin() {
  const me = await getMe();
  if (!me) redirect("/login");
  if (!me.isSysadmin) redirect("/");
  return me;
}
