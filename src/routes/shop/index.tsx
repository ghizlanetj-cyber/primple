import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { SiteShell } from "@/components/layout/SiteShell";
import { CartDrawer } from "@/components/shop/CartDrawer";
import { Button } from "@/components/ui/button";
import { useCartSync } from "@/hooks/useCartSync";
import { fetchShopifyProducts, formatShopifyPrice, type ShopifyProduct } from "@/lib/shopify";
import { useShopifyCart } from "@/store/shopify-cart";
import { useI18n } from "@/i18n";

const title = "Boutique Primple — commander et payer en ligne | Primple";
const description =
  "Achetez les produits Primple prêts à commander et payez en ligne en toute sécurité, avec livraison au Maroc.";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://primple.ma/shop" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://primple.ma/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { tr } = useI18n();
  useCartSync();
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchShopifyProducts(24)
      .then((list) => active && setProducts(list))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <SiteShell>
      <div className="section-shell py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">{tr("Shop")}</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {tr("Order ready-made Primple items and pay securely online.")}
            </p>
          </div>
          <CartDrawer />
        </div>

        <div className="mt-10">
          {error ? (
            <p className="text-muted-foreground">{tr("Products could not be loaded right now.")}</p>
          ) : products === null ? (
            <div className="flex items-center gap-2 text-muted-foreground" role="status">
              <Loader2 className="size-4 animate-spin" />
              {tr("Loading products…")}
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground">{tr("No products found")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ShopCard key={product.node.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}

function ShopCard({ product }: { product: ShopifyProduct }) {
  const { tr } = useI18n();
  const addItem = useShopifyCart((s) => s.addItem);
  const isLoading = useShopifyCart((s) => s.isLoading);
  const variant = product.node.variants.edges[0]?.node;
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
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Link to="/shop/$handle" params={{ handle: product.node.handle }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary/40">
          {image && (
            <img
              src={image.url}
              alt={image.altText ?? product.node.title}
              className="size-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <Link to="/shop/$handle" params={{ handle: product.node.handle }}>
          <h2 className="text-lg font-semibold">{product.node.title}</h2>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.node.description}</p>
        <p className="mt-1 font-semibold">
          {formatShopifyPrice(
            product.node.priceRange.minVariantPrice.amount,
            product.node.priceRange.minVariantPrice.currencyCode,
          )}
        </p>
        <Button
          className="mt-auto w-full rounded-full"
          onClick={handleAddToCart}
          disabled={isLoading || !variant}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : tr("Add to Cart")}
        </Button>
      </div>
    </article>
  );
}
