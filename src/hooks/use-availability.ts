import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Items the team switched off. Fails open in the UI; the server and database block orders regardless. */
export function useUnavailable(kind: "product" | "pack", slug: string) {
  const { data } = useQuery({
    queryKey: ["catalog-availability"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalog_availability").select("kind, slug, available, note").eq("available", false);
      if (error) return [];
      return data ?? [];
    },
    staleTime: 60_000,
  });
  return (data ?? []).find((r) => r.kind === kind && r.slug === slug) ?? null;
}
