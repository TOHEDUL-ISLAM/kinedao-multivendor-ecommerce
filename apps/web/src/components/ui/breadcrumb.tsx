"use client";

import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

export interface BreadcrumbItem {
  label: string;
  labelBn?: string | null;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const { language } = useTranslation();

  const getLabel = (item: BreadcrumbItem) => {
    if (language === "bn" && item.labelBn) {
      return item.labelBn;
    }
    return item.label;
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center text-sm", className)}
    >
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.label,
              item: item.href ? `${typeof window !== "undefined" ? window.location.origin : ""}${item.href}` : undefined,
            })),
          }),
        }}
      />

      <ol className="flex items-center flex-wrap gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = getLabel(item);

          return (
            <li key={index} className="flex items-center">
              {index === 0 && (
                <Home className="h-4 w-4 mr-1 text-muted-foreground flex-shrink-0" />
              )}

              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-[200px]"
                  title={label}
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate max-w-[150px] sm:max-w-[250px]",
                    isLast ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                  title={label}
                  aria-current={isLast ? "page" : undefined}
                >
                  {label}
                </span>
              )}

              {!isLast && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50 flex-shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
