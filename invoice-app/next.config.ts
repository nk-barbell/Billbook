import type { NextConfig } from "next";

const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;

const nextConfig: NextConfig = {
  // Serve Firebase's sign-in helper from our own domain. Browsers that partition
  // third-party storage (Chrome, Safari, Firefox) otherwise lose the Google sign-in
  // result when the helper lives on *.firebaseapp.com.
  async rewrites() {
    if (!firebaseAuthDomain) return [];
    return [
      { source: "/__/auth/:path*", destination: `https://${firebaseAuthDomain}/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `https://${firebaseAuthDomain}/__/firebase/:path*` },
    ];
  },
};

export default nextConfig;
