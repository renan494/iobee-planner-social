import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MAX_VISIBLE = 3;

interface CalendarGridProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export function CalendarGrid({ currentDate, posts, onPostClick }: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const postsByDate = new Map<string, Post[]>();
  posts.forEach((p) => {
    const key = p.date;
    if (!postsByDate.has(key)) postsByDate.set(key, []);
    postsByDate.get(key)!.push(p);
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-secondary/50">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(dateKey) || [];
          const sameMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const extra = dayPosts.length - MAX_VISIBLE;

          return (
            <div
              key={i}
              className={cn(
                "min-h-[120px] border-b border-r p-1.5 transition-colors",
                !sameMonth && "bg-muted/30",
                i % 7 === 6 && "border-r-0"
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    today && "bg-primary text-primary-foreground",
                    !sameMonth && "text-muted-foreground/50"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayPosts.slice(0, MAX_VISIBLE).map((post) => (
                  <PostCard key={post.id} post={post} onClick={onPostClick} />
                ))}
                {extra > 0 && (
                  <span className="block px-1.5 text-[11px] font-semibold text-muted-foreground">
                    +{extra} mais
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
