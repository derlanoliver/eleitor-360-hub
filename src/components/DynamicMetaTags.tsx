import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function DynamicMetaTags() {
  const { data: org } = useQuery({
    queryKey: ["organization-meta"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organization")
        .select("twitter")
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (org?.twitter) {
      const meta = document.querySelector('meta[name="twitter:site"]');
      if (meta) {
        meta.setAttribute("content", org.twitter.startsWith("@") ? org.twitter : `@${org.twitter}`);
      }
    }
  }, [org?.twitter]);

  return null;
}
