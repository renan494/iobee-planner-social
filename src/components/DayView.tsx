import {
  format,
  isToday,
  eachHourOfInterval,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { PostCard } from "./PostCard";
import { cn } from "@/lib/utils";

interface DayViewProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export function DayView({ currentDate, posts, onPostClick }: DayViewProps) {
  const dateKey = format(currentDate, "yyyy-MM-dd");
  const dayPosts = posts.filter((p) => p.date === dateKey);
  const today = isToday(currentDate);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b bg-secondary/50 px-4 py-3">
        <h3 className={cn("text-lg font-bold capitalize", today && "text-primary")}>
          {format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>
      </div>
      <div className="p-4">
        {dayPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum post agendado para este dia.
          </p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {dayPosts.map((post) => (
              <div key={post.id} className="rounded-lg border p-2">
                <PostCard post={post} onClick={onPostClick} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
