"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const items = [
  { href: "/account", label: "Overview", match: (pathname: string) => pathname === "/account" },
  { href: "/account/products", label: "Products", match: (pathname: string) => pathname.startsWith("/account/products") },
  { href: "/account/batches", label: "Batches", match: (pathname: string, hasBatch: boolean) => pathname === "/account/batches" || (pathname === "/account/batches/new" && hasBatch) },
  { href: "/account/batches/new", label: "New batch", match: (pathname: string, hasBatch: boolean) => pathname === "/account/batches/new" && !hasBatch },
] as const;

export function AccountWorkspaceNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasBatch = Boolean(searchParams.get("batchId"));

  return (
    <nav aria-label="Workspace" className="account-workspace-nav">
      {items.map((item) => {
        const current = item.match(pathname, hasBatch);
        return (
          <Link aria-current={current ? "page" : undefined} href={item.href} key={item.href}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
