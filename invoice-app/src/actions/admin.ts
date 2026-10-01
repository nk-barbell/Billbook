"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/firebase-admin";
import { requireOwner, requireSysadmin } from "@/lib/session";
import { companyRef, usersCol } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean } | undefined;

const normEmail = (v: FormDataEntryValue | null) => String(v ?? "").trim().toLowerCase();
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

async function addUser(email: string, role: "owner" | "staff", companyId: string | null): Promise<FormState> {
  if (!validEmail(email)) return { error: "Enter a valid email address" };
  const ref = usersCol().doc(email);
  if ((await ref.get()).exists) return { error: "This email is already added" };
  await ref.set({ email, role, companyId, name: null, createdAt: Date.now() });
  return { ok: true };
}

export async function addOwner(_: FormState, fd: FormData): Promise<FormState> {
  await requireSysadmin();
  const res = await addUser(normEmail(fd.get("email")), "owner", null);
  revalidatePath("/admin");
  return res;
}

export async function removeOwner(fd: FormData) {
  await requireSysadmin();
  const email = normEmail(fd.get("email"));
  const snap = await usersCol().doc(email).get();
  if (!snap.exists || snap.data()?.role !== "owner") return;
  const companyId = snap.data()?.companyId as string | null;
  if (companyId) {
    // Delete the company with all its data and every user that belongs to it.
    const members = await usersCol().where("companyId", "==", companyId).get();
    await Promise.all(members.docs.map((d) => d.ref.delete()));
    await db.recursiveDelete(companyRef(companyId));
  } else {
    await snap.ref.delete();
  }
  revalidatePath("/admin");
}

export async function addStaff(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireOwner();
  const res = await addUser(normEmail(fd.get("email")), "staff", me.company.id);
  revalidatePath("/team");
  return res;
}

export async function removeStaff(fd: FormData) {
  const me = await requireOwner();
  const ref = usersCol().doc(normEmail(fd.get("email")));
  const snap = await ref.get();
  const d = snap.data();
  if (snap.exists && d?.role === "staff" && d?.companyId === me.company.id) await ref.delete();
  revalidatePath("/team");
}
