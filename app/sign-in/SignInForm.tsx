"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth/client";

interface SignInFormProps {
  callbackURL: string;
  googleEnabled: boolean;
  magicLinkEnabled: boolean;
}

export function SignInForm({ callbackURL, googleEnabled, magicLinkEnabled }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: "/sign-in?error=oauth",
    });
    if (result.error) setError(result.error.message || "Google sign-in could not start.");
  }

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("sending");
    const result = await authClient.signIn.magicLink({
      email,
      callbackURL,
      errorCallbackURL: "/sign-in?error=magic-link",
    });

    if (result.error) {
      setStatus("idle");
      setError(result.error.message || "The sign-in email could not be sent.");
      return;
    }
    setStatus("sent");
  }

  const noMethodsConfigured = !googleEnabled && !magicLinkEnabled;

  return (
    <div className="auth-panel">
      {googleEnabled ? (
        <button className="auth-provider-button" type="button" onClick={signInWithGoogle}>
          Continue with Google
        </button>
      ) : null}

      {googleEnabled && magicLinkEnabled ? <div className="auth-divider"><span>or</span></div> : null}

      {magicLinkEnabled ? (
        <form className="auth-email-form" onSubmit={requestMagicLink}>
          <label htmlFor="sign-in-email">Email address</label>
          <input
            id="sign-in-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            disabled={status === "sending" || status === "sent"}
          />
          <button className="primary-link-button auth-submit" type="submit" disabled={status !== "idle"}>
            {status === "sending" ? "Sending secure link..." : status === "sent" ? "Check your inbox" : "Email me a sign-in link"}
          </button>
        </form>
      ) : null}

      {status === "sent" ? (
        <p className="auth-success" role="status">
          A one-time sign-in link is on its way. It expires in 10 minutes.
        </p>
      ) : null}
      {error ? <p className="auth-error" role="alert">{error}</p> : null}
      {noMethodsConfigured ? (
        <p className="auth-error" role="alert">
          Account sign-in is being configured. The public image checker remains available without an account.
        </p>
      ) : null}
    </div>
  );
}
