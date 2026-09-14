import { useEffect } from "react";

import { useShopifyCart } from "@/store/shopify-cart";

/** Clears the local Shopify cart once the hosted checkout has been completed. */
export function useCartSync() {
  const syncCart = useShopifyCart((state) => state.syncCart);

  useEffect(() => {
    syncCart();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") syncCart();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [syncCart]);
}
