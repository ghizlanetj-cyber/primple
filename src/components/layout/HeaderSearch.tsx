import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, HelpCircle, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { products } from "@/data/products";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

type SearchResult = {
  id: string;
  label: string;
  description: string;
  to: "/products/$slug" | "/services" | "/help" | "/blog";
  slug?: string;
  kind: "product" | "service" | "faq" | "blog";
  searchText: string;
};

const serviceLabels = [
  "Artwork preflight",
  "Transparent quoting",
  "Production tracking",
  "Tracked delivery",
  "Reorders",
];

const blogLabels = [
  "Guides",
  "Artwork",
  "Finishes",
  "Budgets",
  "Packaging",
  "Retail",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f\u064b-\u0652]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function HeaderSearch({ mobile = false, onRequestClose }: { mobile?: boolean; onRequestClose?: () => void }) {
  const { tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const index = useMemo<SearchResult[]>(() => {
    const productResults = products.map((product) => ({
      id: `product-${product.slug}`,
      label: tr(product.name),
      description: tr(product.benefit),
      to: "/products/$slug" as const,
      slug: product.slug,
      kind: "product" as const,
      searchText: `${product.name} ${product.benefit} ${product.description} ${product.keywords.join(" ")}`,
    }));
    const faqResults = products.flatMap((product) =>
      product.faqs.map((faq, faqIndex) => ({
        id: `faq-${product.slug}-${faqIndex}`,
        label: tr(faq.q),
        description: `${tr("FAQ")} · ${tr(product.name)}`,
        to: "/products/$slug" as const,
        slug: product.slug,
        kind: "faq" as const,
        searchText: `${faq.q} ${faq.a} ${product.name}`,
      })),
    );
    const services = serviceLabels.map((label, itemIndex) => ({
      id: `service-${itemIndex}`,
      label: tr(label),
      description: tr("Services"),
      to: "/services" as const,
      kind: "service" as const,
      searchText: label,
    }));
    const blog = blogLabels.map((label, itemIndex) => ({
      id: `blog-${itemIndex}`,
      label: tr(label),
      description: `${tr("Blog")} · ${tr("Coming soon")}`,
      to: "/blog" as const,
      kind: "blog" as const,
      searchText: label,
    }));
    return [...productResults, ...services, ...faqResults, ...blog];
  }, [tr]);

  const results = useMemo(() => {
    const terms = normalize(query).split(" ").filter(Boolean);
    if (terms.length === 0) return index.slice(0, 6);
    return index
      .filter((item) => {
        const haystack = normalize(`${item.label} ${item.description} ${item.searchText}`);
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 7);
  }, [index, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => setActiveIndex(0), [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className={cn("relative", mobile && "w-full")}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("size-9 text-ink-foreground hover:text-ink-foreground", mobile && "hidden")}
        aria-label={tr("Search Primple")}
        aria-expanded={open}
        aria-controls="header-search-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Search className="size-4" />
      </Button>

      {(open || mobile) && (
        <div
          id="header-search-panel"
          className={cn(
            mobile
              ? "w-full"
              : "primple-glass fixed inset-x-3 top-[4.75rem] z-50 w-auto max-w-[26.25rem] rounded-2xl border p-2 text-ink-foreground sm:absolute sm:inset-x-auto sm:end-0 sm:top-[calc(100%+0.75rem)] sm:w-[min(90vw,25rem)] sm:max-w-none",
          )}
        >
          <div className="relative">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  if (mobile) onRequestClose?.();
                  else close();
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActiveIndex((value) => Math.min(value + 1, results.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveIndex((value) => Math.max(value - 1, 0));
                }
                if (event.key === "Enter") {
                  const selected = results[activeIndex];
                  if (selected) document.getElementById(selected.id)?.click();
                }
              }}
              placeholder={tr("Search products, services and help")}
              aria-label={tr("Search products, services and help")}
              aria-controls="header-search-results"
              aria-activedescendant={results[activeIndex]?.id}
              className={cn(
                "h-10 w-full rounded-full border border-white/20 bg-white/10 ps-9 pe-10 text-sm text-ink-foreground outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:appearance-none",
                mobile && "border-white/20 bg-white/10 text-ink-foreground placeholder:text-ink-muted",
              )}
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute end-1 top-1/2 size-8 -translate-y-1/2"
                onClick={() => setQuery("")}
                aria-label={tr("Clear search")}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          <div id="header-search-results" role="listbox" className="mt-2 max-h-80 overflow-y-auto">
            {results.map((result, indexPosition) => {
              const Icon = result.kind === "product" ? Sparkles : result.kind === "faq" ? HelpCircle : FileText;
              const linkProps = result.slug
                ? { to: result.to as "/products/$slug", params: { slug: result.slug } }
                : { to: result.to as "/services" | "/help" | "/blog" };
              return (
                <Link
                  {...linkProps}
                  id={result.id}
                  key={result.id}
                  role="option"
                  aria-selected={indexPosition === activeIndex}
                  onMouseEnter={() => setActiveIndex(indexPosition)}
                  onClick={close}
                  className={cn(
                    "grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-md px-3 py-2.5 text-start transition-colors",
                    indexPosition === activeIndex && "bg-white/10",
                    mobile && "text-ink-foreground hover:bg-white/10",
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{result.label}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {result.description}
                    </span>
                  </span>
                </Link>
              );
            })}
            {results.length === 0 && (
              <p className="px-3 py-5 text-center text-sm text-ink-muted" role="status">
                {tr("No search results")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}