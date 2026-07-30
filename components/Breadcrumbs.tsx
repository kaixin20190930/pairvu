import Link from "next/link";
import { StructuredData } from "@/components/StructuredData";
import { breadcrumbSchema, type BreadcrumbItem } from "@/lib/seo/content-registry";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <StructuredData data={breadcrumbSchema(items)} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {items.map((item, index) => (
            <li key={item.href}>
              {index < items.length - 1 ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
