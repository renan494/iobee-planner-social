import type { Post } from "@/data/posts";
import { PostBadge } from "./PostBadge";

interface PostCardProps {
  post: Post;
  onClick: (post: Post) => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  return (
    <button
      onClick={() => onClick(post)}
      className="group flex w-full items-start gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary"
    >
      <PostBadge format={post.format} className="mt-0.5 shrink-0" />
      <span className="truncate text-xs font-medium text-foreground">
        {post.title}
      </span>
    </button>
  );
}
