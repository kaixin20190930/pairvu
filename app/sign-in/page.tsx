import type { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/app/sign-in/SignInForm";
import { getAuthMethodAvailability } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Pairvu workspace.",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  const methods = getAuthMethodAvailability();

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="sign-in-title">
        <p className="eyebrow">Pairvu account</p>
        <h1 id="sign-in-title">Keep your checks and unlock batch workflows</h1>
        <p className="auth-intro">
          Sign in with Google or a secure email link. No password is required.
        </p>
        <SignInForm googleEnabled={methods.google} magicLinkEnabled={methods.magicLink} />
        <div className="auth-entitlement-note">
          <strong>Free account</strong>
          <span>10 product checks each calendar month</span>
          <span>Uploaded originals and analysis derivatives retained for 7 days</span>
        </div>
        <p className="auth-public-note">
          Just trying Pairvu? <Link href="/#checker">Use the public checker without signing in.</Link>
        </p>
      </section>
    </main>
  );
}
