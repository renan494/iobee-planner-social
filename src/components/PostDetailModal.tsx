import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PostBadge } from "./PostBadge";
import { FUNNEL_LABELS, type Post } from "@/data/posts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, Target, User, UserCheck, Pencil, ImageOff, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateDate?: (postId: string, newDate: string) => void;
  onUpdateArt?: (postId: string, artUrl: string | null) => Promise<void>;
}

function PhoneMockup({ artUrl, title, onEditArt }: { artUrl?: string; title: string; onEditArt?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[200px] rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/80 rounded-b-xl z-10" />
        {/* Screen */}
        <div className="aspect-[9/16] bg-muted flex items-center justify-center overflow-hidden">
          {artUrl ? (
            <img src={artUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <span className="text-xs">Sem arte</span>
            </div>
          )}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-foreground/40" />
      </div>
      {onEditArt && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEditArt}>
          <ImagePlus className="h-3.5 w-3.5" />
          {artUrl ? "Trocar arte" : "Adicionar arte"}
        </Button>
      )}
    </div>
  );
}

export function PostDetailModal({ post, open, onOpenChange, onUpdateDate, onUpdateArt }: PostDetailModalProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{post.title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Phone mockup on left */}
          <div className="hidden sm:flex flex-shrink-0">
            <PhoneMockup artUrl={post.artUrl} title={post.title} />
          </div>

          {/* Details on right */}
          <div className="flex-1 space-y-4 min-w-0">
            <p className="text-base font-semibold text-foreground">{post.headline}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
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
                <User className="h-4 w-4 flex-shrink-0" />
                <span>{post.client}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span>{post.analyst}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
