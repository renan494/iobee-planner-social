import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Hash, ImagePlus, PenTool, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, FUNNEL_LABELS } from "@/data/posts";
import type { Post, PostFormat, FunnelStage } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";

// Analysts are now from context

export default function CreatePost() {
  const { clients, analysts, addPost, addAnalyst } = usePosts();
  const { logActivity } = useActivity();
  const navigate = useNavigate();

  const [client, setClient] = useState("");
  const [newClient, setNewClient] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [newAnalyst, setNewAnalyst] = useState("");
  const [postFormat, setPostFormat] = useState<PostFormat>("static");
  const [funnelStage, setFunnelStage] = useState<FunnelStage>("topo");
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artPreview, setArtPreview] = useState<string | null>(null);

  const effectiveClient = client === "__new__" ? newClient.trim() : client;
  const effectiveAnalyst = analyst === "__new__" ? newAnalyst.trim() : analyst;

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
      setHashtagInput("");
    }
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((h) => h !== tag));
  };

  const handleArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setArtFile(f);
      const url = URL.createObjectURL(f);
      setArtPreview(url);
    }
  };

  const handleSubmit = () => {
    if (!effectiveClient || !effectiveAnalyst || !date || !title.trim()) {
      toast({ title: "Preencha os campos obrigatórios", description: "Cliente, analista, data e título são obrigatórios.", variant: "destructive" });
      return;
    }

    const post: Post = {
      id: `post-${Date.now()}`,
      client: effectiveClient,
      analyst: effectiveAnalyst,
      title: title.trim(),
      headline: title.trim(),
      format: postFormat,
      funnelStage,
      date: format(date, "yyyy-MM-dd"),
      hashtags,
      legend: content.trim() || undefined,
    };

    if (analyst === "__new__" && effectiveAnalyst) {
      addAnalyst(effectiveAnalyst);
    }
    addPost(post);
    toast({ title: "Post criado!", description: `"${post.title}" adicionado ao calendário em ${format(date, "dd/MM/yyyy")}.` });
    navigate("/calendario");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <PenTool className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produzir Conteúdo</h1>
          <p className="text-sm text-muted-foreground">Crie um novo post e vincule ao calendário automaticamente.</p>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        {/* Client & Analyst */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Novo cliente</SelectItem>
              </SelectContent>
            </Select>
            {client === "__new__" && (
              <Input placeholder="Nome do novo cliente" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
            )}
          </div>
          <div className="space-y-2">
            <Label>Analista *</Label>
            <Select value={analyst} onValueChange={setAnalyst}>
              <SelectTrigger><SelectValue placeholder="Selecione o analista" /></SelectTrigger>
              <SelectContent>
                {analysts.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Novo analista</SelectItem>
              </SelectContent>
            </Select>
            {analyst === "__new__" && (
              <Input placeholder="Nome do novo analista" value={newAnalyst} onChange={(e) => setNewAnalyst(e.target.value)} />
            )}
          </div>
        </div>

        {/* Format, Funnel & Date */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Tipo do Post *</Label>
            <Select value={postFormat} onValueChange={(v) => setPostFormat(v as PostFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(FORMAT_LABELS) as [PostFormat, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Etapa do Funil</Label>
            <Select value={funnelStage} onValueChange={(v) => setFunnelStage(v as FunnelStage)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(FUNNEL_LABELS) as [FunnelStage, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Data da Postagem *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label>Título *</Label>
          <Input placeholder="Ex: Dia das Mães — Post institucional" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label>Conteúdo / Legenda</Label>
          <Textarea placeholder="Escreva o conteúdo do post..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} maxLength={2000} />
          <p className="text-xs text-muted-foreground text-right">{content.length}/2000</p>
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label>Hashtags</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Digite e pressione Enter"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHashtag(); } }}
              />
            </div>
            <Button type="button" variant="outline" onClick={addHashtag} size="sm">Adicionar</Button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {hashtags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                  #{tag}
                  <button onClick={() => removeHashtag(tag)} className="ml-0.5 rounded-full hover:bg-accent/20 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Art upload */}
        <div className="space-y-2">
          <Label>Arte</Label>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary/60 hover:bg-primary/10">
            {artPreview ? (
              <img src={artPreview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Clique para importar a arte</span>
                <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleArtUpload} className="hidden" />
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => navigate("/calendario")}>Cancelar</Button>
          <Button onClick={handleSubmit}>Criar Post</Button>
        </div>
      </div>
    </div>
  );
}