import type { Post } from "@/data/posts";
import { PostBadge } from "./PostBadge";

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  // Generate a short abbreviation for the client name
  const clientTag = post.client
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);

  return (
    <button
      onClick={() => onClick(post)}
      className="group flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary"
    >
      <PostBadge format={post.format} className="mt-0.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
        {post.title}
      </span>
      <span className="mt-0.5 shrink-0 rounded bg-foreground/10 px-1 py-px text-[9px] font-bold uppercase leading-tight text-muted-foreground">
        {clientTag}
      </span>
    </button>
  );
}
