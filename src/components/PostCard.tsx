import { memo } from "react";
import type { Post, PostFormat } from "@/data/posts";
import { cn } from "@/lib/utils";

const FORMAT_COLORS: Record<PostFormat, string> = {
  static: "bg-format-static/15 text-format-static border-format-static/30",
  carousel: "bg-format-carousel/15 text-format-carousel border-format-carousel/30",
  reels: "bg-format-reels/15 text-format-reels border-format-reels/30",
  stories: "bg-format-stories/15 text-format-stories border-format-stories/30",
};

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

function PostCardImpl({ post, onClick }: PostCardProps) {
  return (
    <button
      onClick={() => onClick(post)}
      className={cn(
        "group flex w-full items-center rounded-md border px-2 py-1 text-left text-xs font-semibold transition-colors truncate",
        FORMAT_COLORS[post.format as PostFormat] || "bg-muted text-foreground border-border"
      )}
    >
      <span className="truncate">
        {post.client} – {post.title}
      </span>
    </button>
  );
}

export const PostCard = memo(PostCardImpl);
