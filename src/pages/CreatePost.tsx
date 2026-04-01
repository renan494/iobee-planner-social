import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Hash, ImagePlus, PenTool, X, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
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
import type { PostFormat, FunnelStage } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { useActivity } from "@/contexts/ActivityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PostEntry {
  id: string;
  client: string;
  newClient: string;
  analyst: string;
  newAnalyst: string;
  postFormat: PostFormat;
  funnelStage: FunnelStage;
  date: Date | undefined;
  title: string;
  content: string;
  hashtagInput: string;
  hashtags: string[];
  artPreview: string | null;
  artFile: File | null;
  artPreviews: string[];
  artFiles: File[];
  collapsed: boolean;
  draftId?: string;
}

function createEmptyEntry(): PostEntry {
  return {
    id: crypto.randomUUID(),
    client: "",
    newClient: "",
    analyst: "",
    newAnalyst: "",
    postFormat: "static",
    funnelStage: "topo",
    date: undefined,
    title: "",
    content: "",
    hashtagInput: "",
    hashtags: [],
    artPreview: null,
    artFile: null,
    artPreviews: [],
    artFiles: [],
    collapsed: false,
  };
}

export default function CreatePost() {
  const { clients, analysts, addPost, addPosts, addAnalyst } = usePosts();
  const { logActivity } = useActivity();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [entries, setEntries] = useState<PostEntry[]>([createEmptyEntry()]);

  // Load draft if ?draft=id
  useEffect(() => {
    const draftId = searchParams.get("draft");
    if (!draftId) return;

    supabase.from("drafts").select("*").eq("id", draftId).maybeSingle().then(({ data }) => {
      if (!data) return;
      setEntries([{
        id: crypto.randomUUID(),
        client: data.client || "",
        newClient: "",
        analyst: data.analyst || "",
        newAnalyst: "",
        postFormat: (data.format as PostFormat) || "static",
        funnelStage: (data.funnel_stage as FunnelStage) || "topo",
        date: data.date ? new Date(data.date + "T12:00:00") : undefined,
        title: data.title || "",
        content: data.legend || "",
        hashtagInput: "",
        hashtags: data.hashtags || [],
        artPreview: null,
        artFile: null,
        collapsed: false,
        draftId: data.id,
      }]);
    });
  }, [searchParams]);

  const updateEntry = (idx: number, patch: Partial<PostEntry>) => {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, ...patch } : e));
  };

  const addEntry = () => {
    // Copy client/analyst from last entry for convenience
    const last = entries[entries.length - 1];
    const newE = createEmptyEntry();
    newE.client = last.client;
    newE.analyst = last.analyst;
    // Collapse previous entries
    setEntries((prev) => [...prev.map((e) => ({ ...e, collapsed: true })), newE]);
  };

  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const addHashtag = (idx: number) => {
    const entry = entries[idx];
    const tag = entry.hashtagInput.trim().replace(/^#/, "");
    if (tag && !entry.hashtags.includes(tag) && entry.hashtags.length < 5) {
      updateEntry(idx, { hashtags: [...entry.hashtags, tag], hashtagInput: "" });
    }
  };

  const removeHashtag = (idx: number, tag: string) => {
    updateEntry(idx, { hashtags: entries[idx].hashtags.filter((h) => h !== tag) });
  };

  const handleSubmit = async () => {
    const newAnalystsToAdd = new Set<string>();

    for (const entry of entries) {
      const ec = entry.client === "__new__" ? entry.newClient.trim() : entry.client;
      const ea = entry.analyst === "__new__" ? entry.newAnalyst.trim() : entry.analyst;
      if (!ec || !ea || !entry.date || !entry.title.trim()) {
        toast({ title: "Preencha os campos obrigatórios", description: "Cliente, analista, data e título são obrigatórios em todos os posts.", variant: "destructive" });
        return;
      }
      if (entry.analyst === "__new__" && ea) newAnalystsToAdd.add(ea);
    }

    for (const name of newAnalystsToAdd) {
      await addAnalyst(name);
    }

    // Upload arts and build posts
    const posts = [];
    for (const entry of entries) {
      let artUrl: string | undefined;
      if (entry.artFile) {
        const ext = entry.artFile.name.split(".").pop();
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("post-arts").upload(path, entry.artFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from("post-arts").getPublicUrl(path);
          artUrl = urlData.publicUrl;
        }
      }
      posts.push({
        client: entry.client === "__new__" ? entry.newClient.trim() : entry.client,
        analyst: entry.analyst === "__new__" ? entry.newAnalyst.trim() : entry.analyst,
        title: entry.title.trim(),
        headline: entry.title.trim(),
        format: entry.postFormat,
        funnelStage: entry.funnelStage,
        date: format(entry.date!, "yyyy-MM-dd"),
        hashtags: entry.hashtags,
        legend: entry.content.trim() || undefined,
        artUrl,
      });
    }

    if (posts.length === 1) {
      await addPost(posts[0]);
    } else {
      await addPosts(posts);
    }

    // Log each
    for (const p of posts) {
      await logActivity({
        action: "post_created",
        description: `Post "${p.title}" criado para ${p.client}`,
        analyst: p.analyst,
        client: p.client,
      });
    }

    // Delete associated drafts
    for (const entry of entries) {
      if (entry.draftId) {
        await supabase.from("drafts").delete().eq("id", entry.draftId);
      }
    }

    toast({
      title: posts.length === 1 ? "Post criado!" : `${posts.length} posts criados!`,
      description: posts.length === 1
        ? `"${posts[0].title}" adicionado ao calendário.`
        : `Todos os posts foram adicionados ao calendário.`,
    });
    navigate("/calendario");
  };

  const handleSaveDraft = async () => {
    if (!user) return;

    for (const entry of entries) {
      const ec = entry.client === "__new__" ? entry.newClient.trim() : entry.client;
      const ea = entry.analyst === "__new__" ? entry.newAnalyst.trim() : entry.analyst;

      const draftData = {
        user_id: user.id,
        client: ec || null,
        analyst: ea || null,
        title: entry.title.trim() || null,
        headline: entry.title.trim() || null,
        format: entry.postFormat,
        funnel_stage: entry.funnelStage,
        date: entry.date ? format(entry.date, "yyyy-MM-dd") : null,
        hashtags: entry.hashtags,
        legend: entry.content.trim() || null,
      };

      if (entry.draftId) {
        await supabase.from("drafts").update(draftData).eq("id", entry.draftId);
      } else {
        await supabase.from("drafts").insert(draftData);
      }
    }

    toast({ title: "Rascunho salvo!", description: "Você pode continuar depois na página de Rascunhos." });
    navigate("/rascunhos");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <PenTool className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produzir Conteúdo</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length === 1 ? "Crie um novo post e vincule ao calendário." : `${entries.length} posts sendo criados.`}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <PostEntryForm
            key={entry.id}
            entry={entry}
            idx={idx}
            total={entries.length}
            clients={clients}
            analysts={analysts}
            onUpdate={(patch) => updateEntry(idx, patch)}
            onRemove={() => removeEntry(idx)}
            onAddHashtag={() => addHashtag(idx)}
            onRemoveHashtag={(tag) => removeHashtag(idx, tag)}
          />
        ))}
      </div>

      {/* Add more */}
      <Button variant="outline" className="mt-4 w-full border-dashed" onClick={addEntry}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar mais um conteúdo
      </Button>

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/calendario")}>Cancelar</Button>
        <Button variant="secondary" onClick={handleSaveDraft}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Rascunho
        </Button>
        <Button onClick={handleSubmit}>
          {entries.length === 1 ? "Criar Post" : `Criar ${entries.length} Posts`}
        </Button>
      </div>
    </div>
  );
}

function PostEntryForm({
  entry, idx, total, clients, analysts, onUpdate, onRemove, onAddHashtag, onRemoveHashtag,
}: {
  entry: PostEntry;
  idx: number;
  total: number;
  clients: string[];
  analysts: string[];
  onUpdate: (patch: Partial<PostEntry>) => void;
  onRemove: () => void;
  onAddHashtag: () => void;
  onRemoveHashtag: (tag: string) => void;
}) {
  const effectiveClient = entry.client === "__new__" ? entry.newClient.trim() : entry.client;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      {total > 1 && (
        <div className="flex items-center justify-between border-b px-4 py-2">
          <button
            onClick={() => onUpdate({ collapsed: !entry.collapsed })}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {entry.collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {entry.title || `Post ${idx + 1}`}
            {entry.title && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                — {FORMAT_LABELS[entry.postFormat]}
              </span>
            )}
          </button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {!entry.collapsed && (
        <div className="space-y-6 p-6">
          {/* Client & Analyst */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select value={entry.client} onValueChange={(v) => onUpdate({ client: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__new__">+ Novo cliente</SelectItem>
                </SelectContent>
              </Select>
              {entry.client === "__new__" && (
                <Input placeholder="Nome do novo cliente" value={entry.newClient} onChange={(e) => onUpdate({ newClient: e.target.value })} />
              )}
            </div>
            <div className="space-y-2">
              <Label>Analista *</Label>
              <Select value={entry.analyst} onValueChange={(v) => onUpdate({ analyst: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o analista" /></SelectTrigger>
                <SelectContent>
                  {analysts.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  <SelectItem value="__new__">+ Novo analista</SelectItem>
                </SelectContent>
              </Select>
              {entry.analyst === "__new__" && (
                <Input placeholder="Nome do novo analista" value={entry.newAnalyst} onChange={(e) => onUpdate({ newAnalyst: e.target.value })} />
              )}
            </div>
          </div>

          {/* Format, Funnel & Date */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo do Post *</Label>
              <Select value={entry.postFormat} onValueChange={(v) => onUpdate({ postFormat: v as PostFormat })}>
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
              <Select value={entry.funnelStage} onValueChange={(v) => onUpdate({ funnelStage: v as FunnelStage })}>
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
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !entry.date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {entry.date ? format(entry.date, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={entry.date} onSelect={(d) => onUpdate({ date: d })} locale={ptBR} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input placeholder="Ex: Dia das Mães — Post institucional" value={entry.title} onChange={(e) => onUpdate({ title: e.target.value })} maxLength={100} />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>Conteúdo / Legenda</Label>
            <Textarea placeholder="Escreva o conteúdo do post..." value={entry.content} onChange={(e) => onUpdate({ content: e.target.value })} rows={5} maxLength={2000} />
            <p className="text-xs text-muted-foreground text-right">{entry.content.length}/2000</p>
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
                  value={entry.hashtagInput}
                  onChange={(e) => onUpdate({ hashtagInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddHashtag(); } }}
                />
              </div>
              <Button type="button" variant="outline" onClick={onAddHashtag} size="sm">Adicionar</Button>
            </div>
            {entry.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entry.hashtags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">
                    #{tag}
                    <button onClick={() => onRemoveHashtag(tag)} className="ml-0.5 rounded-full hover:bg-accent/20 p-0.5">
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
              {entry.artPreview ? (
                <img src={entry.artPreview} alt="Preview" className="max-h-48 rounded-lg object-contain" />
              ) : (
                <>
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Clique para importar a arte</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WEBP</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpdate({ artPreview: URL.createObjectURL(f), artFile: f });
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
