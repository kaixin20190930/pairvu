import Link from "next/link";

const footerGroups = [
  {
    title: "Product",
    links: [
      { href: "/", label: "AI Product Image Checker" },
      { href: "/#checker", label: "Check Image" },
      { href: "/#how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Learn",
    links: [
      { href: "/ai-product-photography", label: "AI Product Photography" },
      { href: "/examples", label: "Examples" },
      { href: "/guides", label: "Guides" },
      { href: "/guides/ai-product-photography-checklist", label: "Checklist" },
    ],
  },
  {
    title: "Use Cases",
    links: [
      { href: "/use-cases/ecommerce-product-image-qa", label: "Ecommerce" },
      { href: "/use-cases/amazon-product-image-qa", label: "Amazon Sellers" },
      { href: "/use-cases/shopify-product-image-qa", label: "Shopify Stores" },
      { href: "/use-cases#brands", label: "Brands" },
      { href: "/use-cases#agencies", label: "Creative Agencies" },
    ],
  },
  {
    title: "Legal",
    links: [{ href: "/privacy", label: "Privacy" }],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="footer-brand">
          <Link className="site-logo" href="/">
            Pairvu
          </Link>
          <p>Quality control for AI product photography.</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title} className="footer-group">
            <h2>{group.title}</h2>
            {group.links.map((link) => (
              <Link key={`${group.title}:${link.href}`} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getUTCFullYear()} Pairvu</span>
        <span>Visible product QA, not marketplace certification.</span>
      </div>
    </footer>
  );
}
