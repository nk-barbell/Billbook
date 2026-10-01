# Billbook: GST invoicing & inventory

Next.js 16 · Tailwind · Firebase Auth (Google sign-in) · Firestore. Hosted on Vercel's free tier. Mobile-first.

## Roles
- **Sys admin**: the emails in `SYSADMIN_EMAILS` (comma-separated). Opens `/admin` and adds owner emails.
- **Owner**: signs in with Google, creates the company, fills in company details, and adds staff emails in **Team**.
- **Staff**: can do everything (inventory, invoices, customers, company details) except add or remove users.

Only emails that have been added can sign in.

## Firebase setup (free Spark plan, no card needed)
1. https://console.firebase.google.com → **Add project**.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Build → Firestore Database → Create database** (production mode, any region).
   Then open the **Rules** tab and paste the contents of `firestore.rules`, then Publish. This blocks direct browser access to your data.
4. **Project settings → General → Your apps → Web (`</>`)**: register an app and copy `apiKey`, `authDomain`, `projectId`, `appId`.
5. **Project settings → Service accounts → Generate new private key**: this downloads a JSON file.
6. **Authentication → Settings → Authorized domains**: `localhost` is there by default. Add your Vercel domain after deploying.

## Local setup
```bash
cp .env.example .env.local   # fill in the values from the steps above
npm install
npm run dev
```
Open http://localhost:3000 and sign in with a `SYSADMIN_EMAILS` account.

Camera and barcode scanning need HTTPS. They work on `localhost` and on Vercel. To test on your phone, use the deployed URL.

## Deploy to Vercel
Push to GitHub, import the repo in Vercel, and add the same env vars from `.env.local`. Then add the Vercel domain under Firebase Authorized domains.

## Notes
- Product photos and the logo are compressed in the browser and stored inside Firestore documents (no Storage plan needed).
- Invoices print to A4 via the browser's Print / Save as PDF.
- Cancelling an invoice restores stock.
- Removing an owner in `/admin` deletes their company and all its data.
