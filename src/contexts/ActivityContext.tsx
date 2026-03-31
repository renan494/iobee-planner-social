import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityEntry {
  id: string;
  action: string;
  description: string;
  analyst?: string;
  client?: string;
  timestamp: string;
}

interface ActivityContextType {
  activities: ActivityEntry[];
  logActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => Promise<void>;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from("activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setActivities(data.map((row) => ({
        id: row.id,
        action: row.action,
        description: row.description,
        analyst: row.analyst ?? undefined,
        client: row.client ?? undefined,
        timestamp: row.created_at,
      })));
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = useCallback(async (entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    const { error } = await supabase.from("activity_log").insert({
      action: entry.action,
      description: entry.description,
      analyst: entry.analyst || null,
      client: entry.client || null,
    });
    if (!error) await fetchActivities();
  }, [fetchActivities]);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  return (
    <ActivityContext.Provider value={{ activities, logActivity, clearActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
