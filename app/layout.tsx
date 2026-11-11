import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const productionUrl = new URL("https://pairvu.com");

export const metadata: Metadata = {
  metadataBase: productionUrl,
  applicationName: "Pairvu",
  title: {
    default: "Pairvu - AI Model Comparison",
    template: "%s | Pairvu",
  },
  description:
    "Compare AI models by pricing, context, benchmarks, and original sources.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pairvu",
    title: "Pairvu - AI Model Comparison",
    description: "Compare AI models with evidence-linked facts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pairvu - AI Model Comparison",
    description: "Compare AI models with evidence-linked facts.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SiteHeader />
        <div id="main-content">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
