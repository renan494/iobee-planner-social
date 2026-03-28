import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";

interface WeekViewProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export function WeekView({ currentDate, posts, onPostClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { locale: ptBR });
  const weekEnd = endOfWeek(currentDate, { locale: ptBR });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const postsByDate = new Map<string, Post[]>();
  posts.forEach((p) => {
    if (!postsByDate.has(p.date)) postsByDate.set(p.date, []);
    postsByDate.get(p.date)!.push(p);
  });

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(dateKey) || [];
          const today = isToday(day);

          return (
            <div
              key={i}
              className={cn(
                "min-h-[300px] border-r p-2 last:border-r-0",
              )}
            >
              <div className="mb-2 text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {format(day, "EEE", { locale: ptBR })}
                </div>
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    today && "bg-primary text-primary-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayPosts.map((post) => (
                  <PostCard key={post.id} post={post} onClick={onPostClick} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
