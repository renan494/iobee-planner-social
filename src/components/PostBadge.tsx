import { type PostFormat, FORMAT_LABELS } from "@/data/posts";
import { cn } from "@/lib/utils";

const formatStyles: Record<PostFormat, string> = {
  static: "bg-format-static text-primary-foreground",
  carousel: "bg-format-carousel text-accent-foreground",
  reels: "bg-format-reels text-destructive-foreground",
  stories: "bg-format-stories text-success-foreground",
};

interface PostBadgeProps {
  format: PostFormat;
  className?: string;
}

export function PostBadge({ format, className }: PostBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        formatStyles[format],
        className
      )}
    >
      {FORMAT_LABELS[format]}
    </span>
  );
}
