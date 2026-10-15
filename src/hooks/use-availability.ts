import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isUnavailable } from "@/lib/catalog-availability";
export function useCatalogAvailability() {
  const { data } = useQuery({
    queryKey: ["catalog-availability"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_availability")
        .select("kind, slug, available")
        .eq("available", false);
      if (error) return []; // Payment and the insert trigger enforce availability if the UI is offline.
      return data ?? [];
    },
    staleTime: 60_000,
  });
  return data ?? [];
}
export function useUnavailable(kind: "product" | "pack", slug: string) {
  return isUnavailable(useCatalogAvailability(), kind, slug);
}
