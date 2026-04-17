import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, User, Plus, Trash2, Pencil, Folder, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";

type PlatformKey = "meta" | "google" | "tiktok";
const PLATFORM_OPTIONS: { key: PlatformKey; label: string }[] = [
  { key: "meta", label: "Meta Ads" },
  { key: "google", label: "Google Ads" },
  { key: "tiktok", label: "TikTok Ads" },
];

const initialForm = {
  name: "",
  niche: "",
  websiteUrl: "",
  ticketMedio: "",
  verbaMensal: "",
  targetAudience: "",
  objective: "",
  competitors: "",
  platforms: [] as PlatformKey[],
  toneOfVoice: "",
  differentials: "",
  productsServices: "",
  brandValues: "",
  currentSocialPresence: "",
  instagramHandle: "",
  facebookUrl: "",
  linkedinUrl: "",
  gmbUrl: "",
};

function formatBRL(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return "";
  const number = parseInt(onlyDigits, 10) / 100;
  return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseBRL(value: string): number | undefined {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return undefined;
  return parseInt(onlyDigits, 10) / 100;
}

export default function Clients() {
  const { posts, clients, addClient, deleteClient } = usePosts();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientStats = useMemo(() => {
    return clients.map((name) => {
      const clientPosts = posts.filter((p) => p.client === name);
      const analysts = [...new Set(clientPosts.map((p) => p.analyst))].filter((a) => a && a.trim() !== "" && a.trim() !== "-");
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      clientPosts.forEach((p) => byFormat[p.format]++);
      return { name, total: clientPosts.length, analysts, byFormat };
    });
  }, [posts, clients]);

  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    clients.forEach((name) => {
      const storagePath = `${encodeURIComponent(name)}/avatar`;
      const { data } = supabase.storage.from("client-avatars").getPublicUrl(storagePath);
      fetch(data.publicUrl, { method: "HEAD" }).then((res) => {
        if (res.ok) {
          setAvatarUrls((prev) => ({ ...prev, [name]: data.publicUrl + "?t=" + Date.now() }));
        }
      }).catch(() => {});
    });
  }, [clients]);

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };
  const togglePlatform = (key: PlatformKey) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(key) ? prev.platforms.filter((p) => p !== key) : [...prev.platforms, key],
    }));
  };

  const handleCancel = () => {
    setCreating(false);
    setForm(initialForm);
    setAvatarPreview(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("client-avatars").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("client-avatars").getPublicUrl(path);
      setAvatarPreview(urlData.publicUrl);
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar a foto.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteTarget) return;
    try {
      await deleteClient(deleteTarget);
      toast({ title: "Cliente removido", description: `"${deleteTarget}" foi excluído.` });
    } catch {
      toast({ title: "Erro", description: "Não foi possível excluir o cliente.", variant: "destructive" });
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async () => {
    const trimmed = form.name.trim();
    if (!trimmed) {
      toast({ title: "Nome obrigatório", description: "Informe o nome do cliente.", variant: "destructive" });
      return;
    }
    if (clients.includes(trimmed)) {
      toast({ title: "Cliente já existe", description: `"${trimmed}" já está cadastrado.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addClient({
        name: trimmed,
        niche: form.niche.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        ticketMedio: parseBRL(form.ticketMedio),
        verbaMensal: parseBRL(form.verbaMensal),
        targetAudience: form.targetAudience.trim() || undefined,
        objective: form.objective.trim() || undefined,
        competitors: form.competitors.trim() ? form.competitors.split(",").map((c) => c.trim()).filter(Boolean) : undefined,
        platforms: form.platforms.length ? form.platforms : undefined,
        toneOfVoice: form.toneOfVoice.trim() || undefined,
        differentials: form.differentials.trim() || undefined,
        productsServices: form.productsServices.trim() || undefined,
        brandValues: form.brandValues.trim() || undefined,
        currentSocialPresence: form.currentSocialPresence.trim() || undefined,
        instagramHandle: form.instagramHandle.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        gmbUrl: form.gmbUrl.trim() || undefined,
        avatarUrl: avatarPreview || undefined,
      });
      toast({ title: "Briefing salvo", description: `"${trimmed}" foi cadastrado com sucesso.` });
      handleCancel();
    } catch {
      toast({ title: "Erro", description: "Não foi possível salvar o briefing.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Visual tokens for the briefing card (matches reference image)
  const fieldInputClass = "h-12 rounded-full border border-foreground/80 bg-background px-5 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";
  const fieldTextareaClass = "min-h-[110px] rounded-2xl border border-foreground/80 bg-background px-5 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";
  const labelClass = "text-[13px] font-medium text-muted-foreground";

  return (
    <PageContainer>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus clientes e veja a produção de cada um.</p>
          </div>
        </div>
        {!creating && (
          <Button onClick={() => setCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        )}
      </div>

      {/* Existing clients grid */}
      {!creating && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientStats.map((c) => (
            <Card key={c.name} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/clientes/${encodeURIComponent(c.name)}`)}>
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <Avatar className="h-10 w-10">
                  {avatarUrls[c.name] ? <AvatarImage src={avatarUrls[c.name]} alt={c.name} /> : null}
                  <AvatarFallback className="bg-secondary">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{c.total} posts</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(c.name); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(c.byFormat) as [PostFormat, number][]).map(([fmt, count]) =>
                    count > 0 ? (
                      <Badge key={fmt} variant="secondary" className="text-xs">
                        {FORMAT_LABELS[fmt]}: {count}
                      </Badge>
                    ) : null
                  )}
                </div>
                {c.analysts.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                    <span>Analistas:</span>
                    {c.analysts.map((a) => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inline expanded briefing editor (matches reference image) */}
      {creating && (
        <div className="rounded-3xl border-2 border-primary bg-card p-8 shadow-sm">
          {/* Header row */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5 text-foreground" />
              <span className="text-xl font-bold text-foreground">
                {form.name.trim() || "Novo cliente"}
              </span>
              <span className="rounded-full border border-primary px-3 py-0.5 text-xs font-semibold text-primary">
                Briefing
              </span>
            </div>
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()} title="Foto de perfil">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleCancel} title="Descartar">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">
            Briefing do cliente
          </h2>

          {/* Nome */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="client-name" className={labelClass}>Nome do cliente *</Label>
            <Input
              id="client-name"
              className={fieldInputClass}
              placeholder="Ex: iOBEE"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              autoFocus
            />
          </div>

          {/* Segmento + URL */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="niche" className={labelClass}>Segmento / Nicho</Label>
              <Input id="niche" className={fieldInputClass} placeholder="Ex: Agência de marketing digital" value={form.niche} onChange={(e) => updateField("niche", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website" className={labelClass}>URL do site</Label>
              <Input id="website" className={fieldInputClass} placeholder="https://exemplo.com.br" value={form.websiteUrl} onChange={(e) => updateField("websiteUrl", e.target.value)} />
            </div>
          </div>

          {/* Ticket + Verba */}
          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ticket" className={labelClass}>Ticket Médio</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">R$</span>
                <Input
                  id="ticket"
                  className={cn(fieldInputClass, "pl-12")}
                  placeholder="0,00"
                  inputMode="numeric"
                  value={form.ticketMedio}
                  onChange={(e) => updateField("ticketMedio", formatBRL(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verba" className={labelClass}>Verba Mensal</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">R$</span>
                <Input
                  id="verba"
                  className={cn(fieldInputClass, "pl-12")}
                  placeholder="0,00"
                  inputMode="numeric"
                  value={form.verbaMensal}
                  onChange={(e) => updateField("verbaMensal", formatBRL(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Público-alvo */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="audience" className={labelClass}>Público-alvo (idade, gênero, localização, interesses, dores)</Label>
            <Textarea id="audience" className={fieldTextareaClass} placeholder="Descreva o público em detalhes..." value={form.targetAudience} onChange={(e) => updateField("targetAudience", e.target.value)} />
          </div>

          {/* Objetivos */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="objective" className={labelClass}>Objetivos e Metas</Label>
            <Textarea id="objective" className={fieldTextareaClass} placeholder="Ex: Crescer o faturamento pelo digital em 20%" value={form.objective} onChange={(e) => updateField("objective", e.target.value)} />
          </div>

          {/* Concorrentes */}
          <div className="mb-6 space-y-2">
            <Label htmlFor="competitors" className={labelClass}>Concorrentes</Label>
            <Textarea id="competitors" className={cn(fieldTextareaClass, "min-h-[80px]")} placeholder="Ex: Marca X, Marca Y, Empresa Z..." value={form.competitors} onChange={(e) => updateField("competitors", e.target.value)} />
          </div>

          {/* Plataformas */}
          <div className="mb-8 space-y-3">
            <Label className={labelClass}>Plataformas</Label>
            <div className="flex flex-wrap items-center gap-6 pt-1">
              {PLATFORM_OPTIONS.map((opt) => {
                const checked = form.platforms.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => togglePlatform(opt.key)}
                    className="flex items-center gap-2.5 group"
                  >
                    <span className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                      checked ? "border-foreground bg-foreground text-background" : "border-foreground/70 bg-background"
                    )}>
                      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="text-base font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional advanced fields (kept compact, collapsed-look) */}
          <details className="mb-8 rounded-2xl border border-border bg-background/40 px-5 py-4">
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Campos avançados (tom de voz, diferenciais, redes sociais...)
            </summary>
            <div className="mt-5 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tone" className={labelClass}>Tom de voz</Label>
                  <Input id="tone" className={fieldInputClass} value={form.toneOfVoice} onChange={(e) => updateField("toneOfVoice", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandValues" className={labelClass}>Valores da marca</Label>
                  <Input id="brandValues" className={fieldInputClass} value={form.brandValues} onChange={(e) => updateField("brandValues", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="products" className={labelClass}>Produtos / Serviços</Label>
                <Textarea id="products" className={fieldTextareaClass} value={form.productsServices} onChange={(e) => updateField("productsServices", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="differentials" className={labelClass}>Diferenciais</Label>
                <Textarea id="differentials" className={fieldTextareaClass} value={form.differentials} onChange={(e) => updateField("differentials", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="presence" className={labelClass}>Presença atual nas redes</Label>
                <Textarea id="presence" className={fieldTextareaClass} value={form.currentSocialPresence} onChange={(e) => updateField("currentSocialPresence", e.target.value)} />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ig" className={labelClass}>@ do Instagram</Label>
                  <Input id="ig" className={fieldInputClass} value={form.instagramHandle} onChange={(e) => updateField("instagramHandle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fb" className={labelClass}>URL do Facebook</Label>
                  <Input id="fb" className={fieldInputClass} value={form.facebookUrl} onChange={(e) => updateField("facebookUrl", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="li" className={labelClass}>URL do LinkedIn</Label>
                  <Input id="li" className={fieldInputClass} value={form.linkedinUrl} onChange={(e) => updateField("linkedinUrl", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gmb" className={labelClass}>URL do Google Meu Negócio</Label>
                  <Input id="gmb" className={fieldInputClass} value={form.gmbUrl} onChange={(e) => updateField("gmbUrl", e.target.value)} />
                </div>
              </div>
            </div>
          </details>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="h-12 gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Check className="h-5 w-5" strokeWidth={3} />
              {saving ? "Salvando..." : "Salvar Briefing"}
            </Button>
          </div>
          {uploading && <p className="mt-3 text-right text-xs text-muted-foreground">Enviando foto...</p>}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget}"? Esta ação não pode ser desfeita. Os posts associados não serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
