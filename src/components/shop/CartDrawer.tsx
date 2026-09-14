import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CreditCard, Loader2, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatShopifyPrice } from "@/lib/shopify";
import { useShopifyCart } from "@/store/shopify-cart";
import { useI18n } from "@/i18n";

export function CartDrawer() {
  const { tr } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { items, isLoading, isSyncing, updateQuantity, removeItem, syncCart } = useShopifyCart();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0);
  const currency = items[0]?.price.currencyCode ?? "MAD";

  useEffect(() => {
    if (isOpen) syncCart();
  }, [isOpen, syncCart]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    setIsOpen(false);
    navigate({ to: "/shop/checkout" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full">
          <ShoppingCart className="size-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -end-2 flex size-5 items-center justify-center rounded-full p-0 text-xs">
              {totalItems}
            </Badge>
          )}
          <span className="sr-only">{tr("Shopping Cart")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-lg">
        <SheetHeader className="shrink-0">
          <SheetTitle>{tr("Shopping Cart")}</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? tr("Your cart is empty") : `${totalItems} × ${tr("items in your cart")}`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col pt-6">
          {items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="mx-auto mb-4 size-12 text-muted-foreground" />
                <p className="text-muted-foreground">{tr("Your cart is empty")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto pe-2">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-2">
                      <div className="size-16 shrink-0 overflow-hidden rounded-md bg-secondary/40">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.images.edges[0].node.altText ?? item.product.node.title}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium">{item.product.node.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map((option) => option.value).join(" • ")}
                        </p>
                        <p className="font-semibold">
                          {formatShopifyPrice(item.price.amount, item.price.currencyCode)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="size-3" />
                          <span className="sr-only">{tr("Remove")}</span>
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="shrink-0 space-y-4 border-t border-border bg-background pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{tr("Total")}</span>
                  <span className="text-xl font-bold">{formatShopifyPrice(String(totalPrice), currency)}</span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full rounded-full"
                  size="lg"
                  disabled={items.length === 0 || isLoading || isSyncing}
                >
                  {isLoading || isSyncing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      {tr("Pay by card")}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
