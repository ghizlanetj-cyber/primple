import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FileText, HelpCircle, Search, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { productImages } from "@/data/productImages";
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
  category: string;
  image?: string;
  searchText: string;
};

const popularProductSlugs = [
  "business-cards",
  "packaging",
  "flyers",
  "labels",
  "brochures",
  "books",
  "posters",
  "roll-up-banners",
];

const searchCategories = [
  { label: "All", value: "All" },
  { label: "Products", value: "Products" },
  { label: "Stationery", value: "Stationery" },
  { label: "Packaging", value: "Packaging" },
  { label: "Flyers / Marketing", value: "Marketing" },
  { label: "Publishing", value: "Publishing" },
  { label: "Large Format", value: "Large Format" },
];

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
  const prefersReducedMotion = useReducedMotion();
  const id = useId().replace(/:/g, "");
  const panelId = `header-search-panel-${id}`;
  const resultsId = `header-search-results-${id}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const index = useMemo<SearchResult[]>(() => {
    const productResults = products.map((product) => ({
      id: `product-${product.slug}`,
      label: tr(product.name),
      description: tr(product.benefit),
      to: "/products/$slug" as const,
      slug: product.slug,
      kind: "product" as const,
      category: product.category,
      ...(productImages[product.slug] ? { image: productImages[product.slug] } : {}),
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
        category: product.category,
        searchText: `${faq.q} ${faq.a} ${product.name}`,
      })),
    );
    const services = serviceLabels.map((label, itemIndex) => ({
      id: `service-${itemIndex}`,
      label: tr(label),
      description: tr("Services"),
      to: "/services" as const,
      kind: "service" as const,
      category: "Services",
      searchText: label,
    }));
    const blog = blogLabels.map((label, itemIndex) => ({
      id: `blog-${itemIndex}`,
      label: tr(label),
      description: `${tr("Blog")} · ${tr("Coming soon")}`,
      to: "/blog" as const,
      kind: "blog" as const,
      category: "Blog",
      searchText: label,
    }));
    return [...productResults, ...services, ...faqResults, ...blog];
  }, [tr]);

  const results = useMemo(() => {
    const terms = normalize(query).split(" ").filter(Boolean);
    const inCategory = (item: SearchResult) =>
      category === "All" || (category === "Products" ? item.kind === "product" : item.category === category);
    if (terms.length === 0) {
      return popularProductSlugs
        .map((slug) => index.find((item) => item.kind === "product" && item.slug === slug))
        .filter((item): item is SearchResult => Boolean(item))
        .filter(inCategory)
        .slice(0, 8);
    }
    return index
      .filter((item) => {
        const haystack = normalize(`${item.label} ${item.description} ${item.searchText}`);
        return inCategory(item) && terms.every((term) => haystack.includes(term));
      })
      .slice(0, 8);
  }, [category, index, query]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => setActiveIndex(0), [category, query]);

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    setCategory("All");
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), prefersReducedMotion ? 0 : 180);
  };

  const showPanel = open;

  return (
    <div ref={rootRef} className={cn("relative", mobile && "w-full")}>
      <Button
        ref={triggerRef}
        type="button"
        variant={mobile ? "outline" : "ghost"}
        size={mobile ? "default" : "icon"}
        className={cn(
          "text-ink-foreground hover:text-ink-foreground",
          mobile
            ? "h-11 w-full justify-start gap-2.5 rounded-full border-white/15 bg-white/5 ps-3.5 text-sm font-normal"
            : "size-9",
        )}
        aria-label={tr("Search Primple")}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
      >
        <Search className="size-4 shrink-0" />
        {mobile && <span className="truncate text-ink-muted">{tr("Search products, services and help")}</span>}
      </Button>

      <AnimatePresence>
        {showPanel && (
        <motion.div
          id={panelId}
          role="dialog"
          aria-label={tr("Search Primple")}
          initial={mobile || prefersReducedMotion ? false : { opacity: 0, scale: 0.98, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: -6 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: "easeOut" }}
          className={cn(
            mobile
              ? "mt-3 w-full text-ink-foreground"
              : "search-glass fixed inset-x-3 top-[4.75rem] z-50 w-auto rounded-2xl border p-3 text-ink-foreground lg:absolute lg:inset-x-auto lg:end-0 lg:top-[calc(100%+0.65rem)] lg:w-[min(92vw,46rem)]",
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
              aria-controls={resultsId}
              aria-activedescendant={results[activeIndex]?.id}
              className={cn(
                "h-10 w-full rounded-full border border-white/15 bg-white/10 ps-9 pe-10 text-sm text-ink-foreground outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-primary [&::-webkit-search-cancel-button]:appearance-none",
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

          <div className="mt-3 grid min-h-0 gap-3 md:grid-cols-[8.75rem_minmax(0,1fr)]">
            <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:border-e md:border-white/10 md:pe-3" aria-label={tr("Categories")}>
              {searchCategories.map((item) => (
                <Button
                  key={item.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-pressed={category === item.value}
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "h-8 shrink-0 justify-start rounded-md px-2.5 text-xs text-ink-muted hover:bg-white/10 hover:text-ink-foreground",
                    category === item.value && "bg-white/12 text-ink-foreground",
                  )}
                >
                  {tr(item.label)}
                </Button>
              ))}
            </div>

          <div className="min-w-0">
            <p className="mb-1.5 px-1 text-[11px] font-semibold uppercase text-ink-muted">
              {tr(query ? "Results" : "Top sellers / Popular")}
            </p>
          <div id={resultsId} role="listbox" className="grid max-h-[min(23rem,52vh)] grid-cols-1 gap-1 overflow-y-auto pe-1 sm:grid-cols-2">
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
                  onClick={() => close()}
                  className={cn(
                    "grid min-h-16 grid-cols-[3rem_minmax(0,1fr)] items-center gap-2.5 rounded-lg p-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    indexPosition === activeIndex ? "bg-white/12" : "hover:bg-white/8",
                  )}
                >
                  {result.image ? (
                    <img src={result.image} alt="" className="size-12 rounded-md object-cover" loading="lazy" />
                  ) : (
                    <span className="flex size-12 items-center justify-center rounded-md bg-white/8">
                      <Icon className="size-4 shrink-0 text-primary" />
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{result.label}</span>
                    <span className="block truncate text-[11px] font-medium text-primary">{tr(result.category)}</span>
                    <span className="block truncate text-xs text-ink-muted">{result.description}</span>
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
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}