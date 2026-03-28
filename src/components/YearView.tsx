import {
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { cn } from "@/lib/utils";

interface YearViewProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
  onNavigateToMonth: (date: Date) => void;
}

export function YearView({ currentDate, posts, onPostClick, onNavigateToMonth }: YearViewProps) {
  const yStart = startOfYear(currentDate);
  const yEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yStart, end: yEnd });

  const postsByDate = new Map<string, Post[]>();
  posts.forEach((p) => {
    if (!postsByDate.has(p.date)) postsByDate.set(p.date, []);
    postsByDate.get(p.date)!.push(p);
  });

  // Count posts per month
  const postsPerMonth = new Map<string, number>();
  posts.forEach((p) => {
    const monthKey = p.date.substring(0, 7);
    postsPerMonth.set(monthKey, (postsPerMonth.get(monthKey) || 0) + 1);
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-3 gap-6 lg:grid-cols-4">
        {months.map((month) => {
          const mStart = startOfMonth(month);
          const mEnd = endOfMonth(month);
          const days = eachDayOfInterval({ start: mStart, end: mEnd });
          const monthKey = format(month, "yyyy-MM");
          const count = postsPerMonth.get(monthKey) || 0;

          return (
            <button
              key={month.toISOString()}
              onClick={() => onNavigateToMonth(month)}
              className="rounded-lg p-2 text-left transition-colors hover:bg-secondary"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-bold capitalize">
                  {format(month, "MMMM", { locale: ptBR })}
                </span>
                {count > 0 && (
                  <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </div>
              {/* Mini calendar */}
              <div className="grid grid-cols-7 gap-y-0.5 text-center">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[8px] font-bold text-muted-foreground">{d}</span>
                ))}
                {Array.from({ length: mStart.getDay() }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const hasPosts = postsByDate.has(dateKey);
                  const today = isToday(day);

                  return (
                    <div key={dateKey} className="flex flex-col items-center">
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full text-[8px]",
                          today && "bg-primary text-primary-foreground",
                          hasPosts && !today && "bg-primary/20 font-bold"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
