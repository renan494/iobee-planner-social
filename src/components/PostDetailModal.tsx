import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PostBadge } from "./PostBadge";
import { FUNNEL_LABELS, type Post } from "@/data/posts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, Target, User, UserCheck, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateDate?: (postId: string, newDate: string) => void;
}

export function PostDetailModal({ post, open, onOpenChange, onUpdateDate }: PostDetailModalProps) {
  const [editingDate, setEditingDate] = useState(false);

  if (!post) return null;

  const postDate = new Date(post.date + "T12:00:00");
  const dateFormatted = format(postDate, "dd 'de' MMMM, yyyy", { locale: ptBR });

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate || !onUpdateDate) return;
    const formatted = format(newDate, "yyyy-MM-dd");
    onUpdateDate(post.id, formatted);
    setEditingDate(false);
    toast({
      title: "Data atualizada",
      description: `Post reagendado para ${format(newDate, "dd/MM/yyyy")}.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setEditingDate(false); }}>
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
              {onUpdateDate && (
                <Popover open={editingDate} onOpenChange={setEditingDate}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={postDate}
                      onSelect={handleDateChange}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{post.client}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              <span>{post.analyst}</span>
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
