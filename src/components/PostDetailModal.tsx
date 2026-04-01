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
import { Calendar, Tag, Target, User, UserCheck, Pencil, ImageOff, ImagePlus, ChevronLeft, ChevronRight } from "lucide-react";
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

function PhoneMockup({
  images,
  title,
  onEditArt,
  isCarousel,
}: {
  images: string[];
  title: string;
  onEditArt?: () => void;
  isCarousel?: boolean;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const total = images.length;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-[200px] rounded-[2rem] border-[6px] border-foreground/80 bg-background shadow-xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-foreground/80 rounded-b-xl z-10" />
        {/* Screen */}
        <div className="aspect-[9/16] bg-muted flex items-center justify-center overflow-hidden relative">
          {total > 0 ? (
            <img src={images[currentSlide]} alt={`${title} - slide ${currentSlide + 1}`} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageOff className="h-8 w-8" />
              <span className="text-xs">Sem arte</span>
            </div>
          )}

          {/* Carousel navigation arrows */}
          {isCarousel && total > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((p) => (p - 1 + total) % total)}
                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 shadow hover:bg-background/90 transition-colors z-10"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-foreground" />
              </button>
              <button
                onClick={() => setCurrentSlide((p) => (p + 1) % total)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 shadow hover:bg-background/90 transition-colors z-10"
              >
                <ChevronRight className="h-3.5 w-3.5 text-foreground" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {isCarousel && total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === currentSlide ? "w-3 bg-background" : "w-1.5 bg-background/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Slide counter */}
          {isCarousel && total > 1 && (
            <div className="absolute top-7 right-2 rounded-full bg-foreground/60 px-2 py-0.5 text-[10px] font-medium text-background z-10">
              {currentSlide + 1}/{total}
            </div>
          )}
        </div>
        {/* Home indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-foreground/40" />
      </div>
      {onEditArt && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onEditArt}>
          <ImagePlus className="h-3.5 w-3.5" />
          {total > 0 ? "Trocar arte" : "Adicionar arte"}
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

  const handleArtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateArt) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${post.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("post-arts").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("post-arts").getPublicUrl(path);
      await onUpdateArt(post.id, urlData.publicUrl);
      toast({ title: "Arte atualizada", description: "A arte do post foi alterada com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar a arte.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleArtUpload}
              disabled={uploading}
            />
            <PhoneMockup
              artUrl={post.artUrl}
              title={post.title}
              onEditArt={onUpdateArt ? () => fileInputRef.current?.click() : undefined}
            />
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
