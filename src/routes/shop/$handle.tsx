import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Button } from "@/components/ui/button";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchShopifyProduct, formatShopifyPrice, type ShopifyProduct } from "@/lib/shopify";
import { useShopifyCart } from "@/store/shopify-cart";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";

const title = "Article de la boutique Primple | Primple";
const description = "Détail d'un article Primple prêt à commander, avec paiement en ligne sécurisé.";

export const Route = createFileRoute("/shop/$handle")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopProductPage,
});

function ShopProductPage() {
  const { tr } = useI18n();
  const { handle } = useParams({ from: "/shop/$handle" });
  useCartSync();

  const [product, setProduct] = useState<ShopifyProduct | null | undefined>(undefined);
  const [variantId, setVariantId] = useState<string | null>(null);
  const addItem = useShopifyCart((s) => s.addItem);
  const isLoading = useShopifyCart((s) => s.isLoading);

  useEffect(() => {
    let active = true;
    fetchShopifyProduct(handle)
      .then((result) => {
        if (!active) return;
        setProduct(result);
        setVariantId(result?.node.variants.edges[0]?.node.id ?? null);
      })
      .catch(() => active && setProduct(null));
    return () => {
      active = false;
    };
  }, [handle]);

  if (product === undefined) {
    return (
      <SiteShell>
        <div className="section-shell flex min-h-[50vh] items-center justify-center" role="status">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </SiteShell>
    );
  }

  if (product === null) {
    return (
      <SiteShell>
        <div className="section-shell py-20">
          <h1 className="font-display text-3xl font-bold">{tr("Product not found")}</h1>
          <Button asChild variant="outline" className="mt-6 rounded-full">
            <Link to="/shop">{tr("Back to shop")}</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const variants = product.node.variants.edges.map((e) => e.node);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const image = product.node.images.edges[0]?.node;

  const handleAddToCart = async () => {
    if (!variant) return;
    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions ?? [],
    });
  };

  return (
    <SiteShell>
      <div className="section-shell py-14">
        <div className="flex items-center justify-between gap-4">
          <Button asChild variant="ghost" className="rounded-full">
            <Link to="/shop">
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {tr("Back to shop")}
            </Link>
          </Button>
          <CartDrawer />
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
            {image && (
              <img
                src={image.url}
                alt={image.altText ?? product.node.title}
                className="aspect-square w-full object-cover"
              />
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{product.node.title}</h1>
            <p className="mt-3 text-2xl font-semibold">
              {variant && formatShopifyPrice(variant.price.amount, variant.price.currencyCode)}
            </p>
            <p className="mt-4 whitespace-pre-line text-muted-foreground">{product.node.description}</p>

            {variants.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    disabled={!v.availableForSale}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      !v.availableForSale && "cursor-not-allowed opacity-45",
                      v.id === variant?.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground/80 hover:border-primary/50",
                    )}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            )}

            <Button
              size="lg"
              className="mt-8 w-full rounded-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={isLoading || !variant?.availableForSale}
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : tr("Add to Cart")}
            </Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
