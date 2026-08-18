"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AccountNav } from "@/components/AccountNav";

const navigationGroups = [
  {
    label: "Product",
    links: [
      { href: "/how-pairvu-works", label: "How Pairvu works" },
      { href: "/checks", label: "Product checks" },
      { href: "/account/batches/new", label: "Batch checking" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    label: "Learn",
    links: [
      { href: "/ai-product-photography", label: "AI product photography" },
      { href: "/examples", label: "Comparison examples" },
      { href: "/guides", label: "Guides" },
    ],
  },
  {
    label: "Solutions",
    links: [
      { href: "/categories", label: "Product categories" },
      { href: "/use-cases", label: "Use cases" },
    ],
  },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsidePointer(event: PointerEvent) {
      if (!menuPanelRef.current?.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenGroup(null);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function closeNavigation() {
    setMenuOpen(false);
    setOpenGroup(null);
  }

  function supportsDesktopHover() {
    return window.matchMedia("(min-width: 841px) and (hover: hover)").matches;
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-logo" href="/" aria-label="Pairvu home" onClick={closeNavigation}>
          Pairvu
        </Link>
        <button
          aria-controls="site-menu-panel"
          aria-expanded={menuOpen}
          className="site-menu-toggle"
          onClick={() => {
            setMenuOpen((open) => !open);
            setOpenGroup(null);
          }}
          type="button"
        >
          <span aria-hidden="true" className="site-menu-icon"><i /><i /><i /></span>
          <span>{menuOpen ? "Close" : "Menu"}</span>
        </button>
        <div
          className={`site-menu-panel${menuOpen ? " is-open" : ""}`}
          id="site-menu-panel"
          ref={menuPanelRef}
        >
          <nav className="site-nav" aria-label="Primary navigation" key={pathname}>
            {navigationGroups.map((group) => (
              <div
                className={`site-nav-group${openGroup === group.label ? " is-open" : ""}`}
                key={group.label}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setOpenGroup((current) => current === group.label ? null : current);
                  }
                }}
                onMouseEnter={() => {
                  if (supportsDesktopHover()) {
                    setOpenGroup(group.label);
                  }
                }}
                onMouseLeave={() => {
                  if (supportsDesktopHover()) {
                    setOpenGroup((current) => current === group.label ? null : current);
                  }
                }}
              >
                <button
                  aria-expanded={openGroup === group.label}
                  aria-haspopup="true"
                  className="site-nav-trigger"
                  onClick={() => setOpenGroup((current) => current === group.label ? null : group.label)}
                  type="button"
                >
                  {group.label}
                </button>
                <div className="site-nav-menu" hidden={openGroup !== group.label}>
                  {group.links.map((item) => (
                    <Link
                      aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}
                      key={item.href}
                      href={item.href}
                      onClick={closeNavigation}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="header-actions">
            <AccountNav onNavigate={closeNavigation} />
            <Link className="header-cta" href="/#checker" onClick={closeNavigation}>Check image</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
