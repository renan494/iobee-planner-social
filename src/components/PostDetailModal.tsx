import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PostBadge } from "./PostBadge";
import { FUNNEL_LABELS, type Post } from "@/data/posts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, Target, User, UserCheck } from "lucide-react";

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostDetailModal({ post, open, onOpenChange }: PostDetailModalProps) {
  if (!post) return null;

  const dateFormatted = format(new Date(post.date + "T12:00:00"), "dd 'de' MMMM, yyyy", { locale: ptBR });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{post.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-base font-semibold text-foreground">{post.headline}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{post.client}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{FUNNEL_LABELS[post.funnelStage]}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <PostBadge format={post.format} />
            </div>
          </div>

          {post.legend && (
            <div className="rounded-lg bg-secondary p-3">
              <p className="text-sm leading-relaxed text-secondary-foreground">{post.legend}</p>
            </div>
          )}

          {post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Tag className="mr-1 h-4 w-4 text-muted-foreground" />
              {post.hashtags.map((h) => (
                <span key={h} className="text-xs font-medium text-accent">#{h}</span>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
