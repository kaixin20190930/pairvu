import Link from "next/link";
import { PairvuLogo } from "@/components/PairvuLogo";

const navigation = [
  { href: "/ai-product-photography", label: "AI Product Photography" },
  { href: "/examples", label: "Examples" },
  { href: "/guides", label: "Guides" },
  { href: "/use-cases", label: "Use Cases" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-logo" href="/" aria-label="Pairvu home">
          <PairvuLogo className="site-logo-art" />
        </Link>
        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="header-cta" href="/#checker">
          Check image
        </Link>
      </div>
    </header>
  );
}
