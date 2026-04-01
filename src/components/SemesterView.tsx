import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { PostBadge } from "./PostBadge";
import { cn } from "@/lib/utils";

interface SemesterViewProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

function getSemesterStart(date: Date): Date {
  const month = date.getMonth();
  return new Date(date.getFullYear(), month < 6 ? 0 : 6, 1);
}

export function SemesterView({ currentDate, posts, onPostClick }: SemesterViewProps) {
  const semStart = getSemesterStart(currentDate);
  const semEnd = endOfMonth(addMonths(semStart, 5));
  const months = eachMonthOfInterval({ start: semStart, end: semEnd });

  const postsByDate = new Map<string, Post[]>();
  posts.forEach((p) => {
    if (!postsByDate.has(p.date)) postsByDate.set(p.date, []);
    postsByDate.get(p.date)!.push(p);
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((month) => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);
        const days = eachDayOfInterval({ start: mStart, end: mEnd });

        return (
          <div key={month.toISOString()} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="border-b bg-secondary/50 px-3 py-2">
              <h3 className="text-sm font-bold capitalize">
                {format(month, "MMMM yyyy", { locale: ptBR })}
              </h3>
            </div>
            <div className="p-2">
              <div className="mb-1 grid grid-cols-7 text-center">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span key={i} className="text-[9px] font-bold text-muted-foreground">{d}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: mStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const dayPosts = postsByDate.get(dateKey) || [];
                  const today = isToday(day);

                  return (
                    <div key={dateKey} className="flex flex-col items-center py-0.5">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
                          today && "bg-primary text-primary-foreground",
                          dayPosts.length > 0 && !today && "font-bold"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {dayPosts.length > 0 && (
                        <div className="mt-0.5 flex gap-0.5">
                          {dayPosts.slice(0, 3).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => onPostClick(p)}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  p.format === "static" ? "hsl(var(--format-static))" :
                                  p.format === "carousel" ? "hsl(var(--format-carousel))" :
                                  p.format === "reels" ? "hsl(var(--format-reels))" :
                                  "hsl(var(--format-stories))",
                              }}
                              title={p.title}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 space-y-1 border-t pt-2">
                {posts
                  .filter((p) => isSameMonth(new Date(p.date + "T12:00:00"), month))
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onPostClick(p)}
                      className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-secondary"
                    >
                      <span className="w-5 text-[10px] font-medium text-muted-foreground">
                        {format(new Date(p.date + "T12:00:00"), "dd")}
                      </span>
                      <PostBadge format={p.format} />
                      <span className="truncate text-xs font-medium">{p.title}</span>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
