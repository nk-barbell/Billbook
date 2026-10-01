import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function app() {
  const existing = getApps()[0];
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var is missing");
  const sa = JSON.parse(raw);
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
