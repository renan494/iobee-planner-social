import { useMemo } from "react";
import type { Post, PostFormat } from "@/data/posts";
import { PostBadge } from "./PostBadge";
import { cn } from "@/lib/utils";

const FORMAT_BG: Record<PostFormat, string> = {
  static: "border-l-format-static",
  carousel: "border-l-format-carousel",
  reels: "border-l-format-reels",
  stories: "border-l-format-stories",
};

// Deterministic color based on client name
const CLIENT_COLORS = [
  "bg-orange-100 text-orange-700 border-orange-300",
  "bg-sky-100 text-sky-700 border-sky-300",
  "bg-violet-100 text-violet-700 border-violet-300",
  "bg-emerald-100 text-emerald-700 border-emerald-300",
  "bg-rose-100 text-rose-700 border-rose-300",
  "bg-amber-100 text-amber-700 border-amber-300",
  "bg-teal-100 text-teal-700 border-teal-300",
  "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300",
];

function getClientColor(client: string) {
  let hash = 0;
  for (let i = 0; i < client.length; i++) {
    hash = client.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const colorClass = useMemo(() => getClientColor(post.client), [post.client]);

  return (
    <button
      onClick={() => onClick(post)}
      className={cn(
        "group flex w-full items-center gap-1.5 rounded-md border-l-[3px] px-1.5 py-1 text-left transition-colors hover:bg-secondary",
        FORMAT_BG[post.format as PostFormat] || "border-l-transparent"
      )}
    >
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {post.title}
      </span>
      <span
        className={cn(
          "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
          colorClass
        )}
      >
        {post.client}
      </span>
    </button>
  );
}
