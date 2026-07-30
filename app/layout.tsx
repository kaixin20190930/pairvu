import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { StructuredData } from "@/components/StructuredData";
import { organizationSchema } from "@/lib/seo/content-registry";
import "./globals.css";

const productionUrl = new URL("https://pairvu.com");

export const metadata: Metadata = {
  metadataBase: productionUrl,
  applicationName: "Pairvu",
  title: {
    default: "Pairvu - AI Product Image Checker",
    template: "%s | Pairvu",
  },
  description:
    "Compare an AI-generated or edited product image with the original and catch visible product changes before publishing.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Pairvu",
    title: "Pairvu - AI Product Image Checker",
    description: "Compare an AI product image with the approved original before publishing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pairvu - AI Product Image Checker",
    description: "Compare an AI product image with the approved original before publishing.",
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
        <StructuredData data={organizationSchema()} />
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
