import type { VisualQACloudflareEnv } from "@/lib/cloudflare/bindings";

export async function sendPairvuMagicLink(
  env: VisualQACloudflareEnv,
  input: { email: string; url: string },
): Promise<void> {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    throw new Error("Email sign-in is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM,
      to: [input.email],
      subject: "Sign in to Pairvu",
      html: magicLinkEmailHtml(input.url),
      text: `Sign in to Pairvu: ${input.url}\n\nThis link expires in 10 minutes and can be used once.`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("auth_magic_link_email_failed", response.status, detail.slice(0, 500));
    throw new Error("We could not send the sign-in email. Please try again.");
  }
}

function magicLinkEmailHtml(url: string): string {
  const safeUrl = escapeHtml(url);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f6f7fb;color:#111827;font-family:Arial,sans-serif">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px">
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:32px">
        <p style="margin:0 0 20px;font-size:22px;font-weight:700">Sign in to Pairvu</p>
        <p style="margin:0 0 24px;line-height:1.6;color:#4b5563">Use this secure link to open your Pairvu account. The link expires in 10 minutes and can be used once.</p>
        <a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#2457e6;color:#ffffff;text-decoration:none;font-weight:700">Sign in</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b7280">If you did not request this email, you can ignore it.</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
