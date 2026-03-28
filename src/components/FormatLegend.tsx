import { PostBadge } from "./PostBadge";
import type { PostFormat } from "@/data/posts";

const formats: PostFormat[] = ["static", "carousel", "reels", "stories"];

export function FormatLegend() {
  return (
    <div className="flex items-center gap-3">
      {formats.map((f) => (
        <PostBadge key={f} format={f} />
      ))}
    </div>
  );
}
