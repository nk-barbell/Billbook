import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

/**
 * On deployed sites the sign-in helper is proxied through this app's own domain
 * (see rewrites in next.config.ts), so we use the current host as authDomain.
 * On localhost we keep Firebase's default domain, which needs no extra setup.
 */
function authDomain() {
  if (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)) {
    return window.location.host;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
}

// Created on demand (in the browser) so the page can be prerendered without env vars.
export function getClientAuth() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: authDomain(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
  return getAuth(app);
}
