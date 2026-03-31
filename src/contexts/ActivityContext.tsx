import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface ActivityEntry {
  id: string;
  action: string; // e.g. "post_created", "calendar_imported", "post_deleted"
  description: string;
  analyst?: string;
  client?: string;
  timestamp: string; // ISO string
}

interface ActivityContextType {
  activities: ActivityEntry[];
  logActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  clearActivities: () => void;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<ActivityEntry[]>(() => {
    const saved = localStorage.getItem("iobee-activity-log");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("iobee-activity-log", JSON.stringify(activities));
  }, [activities]);

  const logActivity = useCallback((entry: Omit<ActivityEntry, "id" | "timestamp">) => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setActivities((prev) => [newEntry, ...prev].slice(0, 200));
  }, []);

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
