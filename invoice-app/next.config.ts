import type { NextConfig } from "next";

const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
// Set by Vercel, e.g. "billbook-omega.vercel.app". Undefined locally.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

const nextConfig: NextConfig = {
  // Google only returns sign-ins to registered addresses, and each Vercel deployment
  // also gets extra *.vercel.app aliases. Send every alias to the one production host.
  async redirects() {
    if (!productionHost) return [];
    return [
      {
        source: "/:path*",
        missing: [{ type: "host", value: productionHost.replace(/\./g, "\\.") }],
        destination: `https://${productionHost}/:path*`,
        permanent: false,
      },
    ];
  },
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
