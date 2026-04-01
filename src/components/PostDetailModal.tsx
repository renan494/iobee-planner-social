import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PostBadge } from "./PostBadge";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post, type PostFormat, type FunnelStage } from "@/data/posts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Tag, Target, User, UserCheck, Pencil, ImageOff, ImagePlus, ChevronLeft, ChevronRight, Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PostDetailModalProps {
  post: Post | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateDate?: (postId: string, newDate: string) => void;
  onUpdateArt?: (postId: string, artUrl: string | null) => Promise<void>;
  onUpdatePost?: (postId: string, fields: Partial<Omit<Post, "id">>) => Promise<void>;
  onDeletePost?: (postId: string) => Promise<void>;
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

export function PostDetailModal({ post, open, onOpenChange, onUpdateDate, onUpdateArt, onUpdatePost }: PostDetailModalProps) {
  const [editingDate, setEditingDate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({ title: "", headline: "", legend: "", format: "" as PostFormat, funnelStage: "" as FunnelStage });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (post && open) {
      setEditFields({
        title: post.title,
        headline: post.headline,
        legend: post.legend || "",
        format: post.format,
        funnelStage: post.funnelStage,
      });
      setEditing(false);
    }
  }, [post, open]);

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
    } catch (err) {
      console.error("Art upload error:", err);
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

  const handleSaveEdit = async () => {
    if (!onUpdatePost) return;
    await onUpdatePost(post.id, {
      title: editFields.title.trim(),
      headline: editFields.headline.trim(),
      legend: editFields.legend.trim() || undefined,
      format: editFields.format,
      funnelStage: editFields.funnelStage,
    });
    setEditing(false);
    toast({ title: "Post atualizado", description: "As alterações foram salvas." });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setEditingDate(false); setEditing(false); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            {editing ? (
              <Input
                value={editFields.title}
                onChange={(e) => setEditFields((f) => ({ ...f, title: e.target.value }))}
                className="text-lg font-bold"
              />
            ) : (
              <DialogTitle className="text-lg font-bold">{post.title}</DialogTitle>
            )}
            {onUpdatePost && !editing && (
              <Button variant="ghost" size="sm" className="gap-1.5 ml-2 flex-shrink-0" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" /> Editar
              </Button>
            )}
          </div>
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
              images={
                post.format === "carousel" && post.artUrls && post.artUrls.length > 0
                  ? post.artUrls
                  : post.artUrl
                    ? [post.artUrl]
                    : []
              }
              title={post.title}
              isCarousel={post.format === "carousel"}
              onEditArt={onUpdateArt ? () => fileInputRef.current?.click() : undefined}
            />
          </div>

          {/* Details on right */}
          <div className="flex-1 space-y-4 min-w-0">
            {editing ? (
              <Input
                value={editFields.headline}
                onChange={(e) => setEditFields((f) => ({ ...f, headline: e.target.value }))}
                placeholder="Headline"
                className="text-sm"
              />
            ) : (
              <p className="text-base font-semibold text-foreground">{post.headline}</p>
            )}

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

              {editing ? (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Select value={editFields.funnelStage} onValueChange={(v) => setEditFields((f) => ({ ...f, funnelStage: v as FunnelStage }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(FUNNEL_LABELS) as [FunnelStage, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Select value={editFields.format} onValueChange={(v) => setEditFields((f) => ({ ...f, format: v as PostFormat }))}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.entries(FORMAT_LABELS) as [PostFormat, string][]).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Badge variant="secondary">{FUNNEL_LABELS[post.funnelStage]}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PostBadge format={post.format} />
                  </div>
                </>
              )}
            </div>

            {/* Channels */}
            {!editing && post.channels && post.channels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.channels.map((ch) => (
                  <span key={ch} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {ch}
                  </span>
                ))}
              </div>
            )}

            {editing ? (
              <Textarea
                value={editFields.legend}
                onChange={(e) => setEditFields((f) => ({ ...f, legend: e.target.value }))}
                placeholder="Legenda / conteúdo do post"
                rows={3}
                className="text-sm"
              />
            ) : (
              post.legend && (
                <div className="rounded-lg bg-secondary p-3">
                  <p className="text-sm leading-relaxed text-secondary-foreground">{post.legend}</p>
                </div>
              )
            )}

            {!editing && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Tag className="mr-1 h-4 w-4 text-muted-foreground" />
                {post.hashtags.map((h) => (
                  <span key={h} className="text-xs font-medium text-accent">#{h}</span>
                ))}
              </div>
            )}

            {editing && (
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveEdit}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
