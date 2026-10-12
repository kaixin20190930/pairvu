"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
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
  const [releasesVisible,setReleasesVisible]=useState(false);
  const [metricsVisible,setMetricsVisible]=useState(false);
  useEffect(()=>{const controller=new AbortController();fetch("/api/value-metrics/status",{cache:"no-store",signal:controller.signal}).then(async response=>{const data=response.ok?await response.json():null;if(!controller.signal.aborted)setMetricsVisible(data?.enabled===true);}).catch(()=>{if(!controller.signal.aborted)setMetricsVisible(false);});return()=>controller.abort();},[pathname]);
  useEffect(()=>{const controller=new AbortController();fetch("/api/releases/status",{cache:"no-store",signal:controller.signal}).then(async response=>{const data=response.ok?await response.json():null;if(!controller.signal.aborted)setReleasesVisible(data?.enabled===true);}).catch(()=>{if(!controller.signal.aborted)setReleasesVisible(false);});return ()=>controller.abort();},[pathname]);
  const hasBatch = Boolean(searchParams.get("batchId"));

  return (
    <nav aria-label="Workspace" className="account-workspace-nav">
      {releasesVisible?<Link href="/account/releases" aria-current={pathname.startsWith("/account/releases")?"page":undefined}>Releases</Link>:null}
      {metricsVisible?<Link href="/account/value-metrics" aria-current={pathname.startsWith("/account/value-metrics")?"page":undefined}>Value metrics</Link>:null}
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
