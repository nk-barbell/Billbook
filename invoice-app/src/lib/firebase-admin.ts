import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function app() {
  const existing = getApps()[0];
  if (existing) return existing;
  let raw = (process.env.FIREBASE_SERVICE_ACCOUNT ?? "").trim();
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
  // Hosting dashboards often keep the quotes used in .env files; strip one matching pair.
  if ((raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))) raw = raw.slice(1, -1);
  // Also accept base64-encoded JSON.
  if (!raw.startsWith("{")) raw = Buffer.from(raw, "base64").toString("utf8");
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the service account file contents as-is, without surrounding quotes.");
  }
  sa.private_key = String(sa.private_key).replace(/\\n/g, "\n");
  return initializeApp({ credential: cert(sa) });
}

let _db: Firestore | undefined;
function realDb() {
  if (!_db) {
    _db = getFirestore(app());
    try {
      _db.settings({ ignoreUndefinedProperties: true });
    } catch {
      /* already configured (hot reload) */
    }
  }
  return _db;
}

// Lazy proxies: nothing connects (or needs credentials) until the first real call, so `next build` works without secrets.
function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get(_, prop) {
      const target = get();
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
}

export const db: Firestore = lazy(realDb);
export const adminAuth: Auth = lazy(() => getAuth(app()));
