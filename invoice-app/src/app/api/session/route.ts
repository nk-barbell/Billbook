import { NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { SESSION_COOKIE, isAllowedEmail } from "@/lib/session";

const FIVE_DAYS = 60 * 60 * 24 * 5 * 1000;

// Exchange a Firebase ID token for a server session cookie, only for emails that were added.
export async function POST(req: Request) {
  const { idToken } = await req.json().catch(() => ({}));
  if (!idToken) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = (decoded.email ?? "").toLowerCase();
    if (!email || !decoded.email_verified) return NextResponse.json({ error: "denied" }, { status: 403 });
    if (!(await isAllowedEmail(email))) return NextResponse.json({ error: "denied" }, { status: 403 });

    const userRef = db.collection("users").doc(email);
    if (decoded.name && (await userRef.get()).exists) await userRef.set({ name: decoded.name }, { merge: true });
    const cookie = await adminAuth.createSessionCookie(idToken, { expiresIn: FIVE_DAYS });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, cookie, {
      maxAge: FIVE_DAYS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("[session] sign-in failed:", e);
    const code = (e as { code?: string }).code ?? (e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "server", code }, { status: 401 });
  }
}
