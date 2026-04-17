import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Module-level cache so we don't re-fetch the role on every page navigation
// (this hook is mounted once per AppLayout but the in-memory cache survives).
const cache = new Map<string, boolean>();
const inflight = new Map<string, Promise<boolean>>();

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(() =>
    user ? cache.get(user.id) ?? false : false
  );

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Use cached value if available
    if (cache.has(user.id)) {
      setIsAdmin(cache.get(user.id)!);
      return;
    }

    // Deduplicate concurrent fetches
    let req = inflight.get(user.id);
    if (!req) {
      req = supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle()
        .then(({ data }) => {
          const result = !!data;
          cache.set(user!.id, result);
          inflight.delete(user!.id);
          return result;
        });
      inflight.set(user.id, req);
    }
    req.then((result) => setIsAdmin(result));
  }, [user]);

  return isAdmin;
}
