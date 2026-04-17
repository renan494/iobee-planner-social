import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, User, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";

export default function Clients() {
  const { posts, clients, addClient, deleteClient } = usePosts();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newFacebookUrl, setNewFacebookUrl] = useState("");
  const [newLinkedinUrl, setNewLinkedinUrl] = useState("");
  const [newGmbUrl, setNewGmbUrl] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newNiche, setNewNiche] = useState("");
  const [newTargetAudience, setNewTargetAudience] = useState("");
  const [newToneOfVoice, setNewToneOfVoice] = useState("");
  const [newDifferentials, setNewDifferentials] = useState("");
  const [newProductsServices, setNewProductsServices] = useState("");
  
  const [newBrandValues, setNewBrandValues] = useState("");
  const [newCurrentSocialPresence, setNewCurrentSocialPresence] = useState("");
  const [newCompetitors, setNewCompetitors] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  // Fetch avatar URLs for each client from storage
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

  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleAddClient = async () => {
    const trimmed = newClientName.trim();
    if (!trimmed) return;
    if (clients.includes(trimmed)) {
      toast({ title: "Cliente já existe", description: `"${trimmed}" já está cadastrado.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addClient({
        name: trimmed,
        instagramHandle: newInstagram.trim() || undefined,
        facebookUrl: newFacebookUrl.trim() || undefined,
        linkedinUrl: newLinkedinUrl.trim() || undefined,
        gmbUrl: newGmbUrl.trim() || undefined,
        objective: newObjective.trim() || undefined,
        avatarUrl: avatarPreview || undefined,
        niche: newNiche.trim() || undefined,
        targetAudience: newTargetAudience.trim() || undefined,
        toneOfVoice: newToneOfVoice.trim() || undefined,
        differentials: newDifferentials.trim() || undefined,
        productsServices: newProductsServices.trim() || undefined,
        
        brandValues: newBrandValues.trim() || undefined,
        currentSocialPresence: newCurrentSocialPresence.trim() || undefined,
        competitors: newCompetitors.trim() ? newCompetitors.split(",").map(c => c.trim()).filter(Boolean) : undefined,
      });
      toast({ title: "Cliente cadastrado", description: `"${trimmed}" foi adicionado com sucesso.` });
      setNewClientName("");
      setNewInstagram("");
      setNewFacebookUrl("");
      setNewLinkedinUrl("");
      setNewGmbUrl("");
      setNewObjective("");
      setNewNiche("");
      setNewTargetAudience("");
      setNewToneOfVoice("");
      setNewDifferentials("");
      setNewProductsServices("");
      
      setNewBrandValues("");
      setNewCurrentSocialPresence("");
      setNewCompetitors("");
      setAvatarPreview(null);
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível cadastrar o cliente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

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
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Cliente
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientStats.map((c) => (
          <Card key={c.name} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/clientes/${encodeURIComponent(c.name)}`)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <Avatar className="h-10 w-10">
                {avatarUrls[c.name] ? (
                  <AvatarImage src={avatarUrls[c.name]} alt={c.name} />
                ) : null}
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
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-8 pt-8 pb-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">Cadastrar novo cliente</DialogTitle>
            <p className="text-sm text-muted-foreground">Preencha o briefing para alimentar estratégias e geração de conteúdo com IA.</p>
          </DialogHeader>
          <div className="space-y-6 px-8 pb-6 pt-4">
            {/* Avatar */}
            <div className="flex items-center gap-5 rounded-2xl border bg-card p-5">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-secondary border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground" />
                )}
              </button>
              <div>
                <p className="text-base font-semibold text-foreground">Foto de perfil</p>
                <p className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Clique no círculo para enviar uma imagem (PNG/JPG)."}</p>
              </div>
            </div>

            {/* Dados Básicos */}
            <section className="rounded-2xl border bg-card p-6 space-y-5">
              <header>
                <h3 className="text-base font-bold text-foreground">Dados básicos</h3>
                <p className="text-xs text-muted-foreground">Identificação e visão geral do negócio.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="client-name" className="text-sm">Nome *</Label>
                <Input id="client-name" className="h-11 text-base" placeholder="Ex: iOBEE" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} autoFocus />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="niche" className="text-sm">Nicho / Segmento</Label>
                  <Input id="niche" className="h-11 text-base" placeholder="Ex: Marketing Digital, Gastronomia..." value={newNiche} onChange={(e) => setNewNiche(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone-of-voice" className="text-sm">Tom de voz</Label>
                  <Input id="tone-of-voice" className="h-11 text-base" placeholder="Ex: Profissional e acolhedor" value={newToneOfVoice} onChange={(e) => setNewToneOfVoice(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="objective" className="text-sm">Objetivo</Label>
                <Textarea id="objective" className="text-base" placeholder="Ex: Aumentar awareness e gerar leads qualificados..." value={newObjective} onChange={(e) => setNewObjective(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="products-services" className="text-sm">Produtos / Serviços</Label>
                <Textarea id="products-services" className="text-base" placeholder="Descreva os principais produtos ou serviços do cliente..." value={newProductsServices} onChange={(e) => setNewProductsServices(e.target.value)} rows={3} />
              </div>
            </section>

            {/* Público e Posicionamento */}
            <section className="rounded-2xl border bg-card p-6 space-y-5">
              <header>
                <h3 className="text-base font-bold text-foreground">Público e posicionamento</h3>
                <p className="text-xs text-muted-foreground">Para quem falamos e como nos diferenciamos.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="target-audience" className="text-sm">Público-alvo</Label>
                <Textarea id="target-audience" className="text-base" placeholder="Ex: Mulheres 25-45, classe B, interessadas em bem-estar..." value={newTargetAudience} onChange={(e) => setNewTargetAudience(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-values" className="text-sm">Valores da marca</Label>
                <Input id="brand-values" className="h-11 text-base" placeholder="Ex: Inovação, Transparência, Sustentabilidade..." value={newBrandValues} onChange={(e) => setNewBrandValues(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="differentials" className="text-sm">Diferenciais</Label>
                <Textarea id="differentials" className="text-base" placeholder="O que diferencia este cliente dos concorrentes..." value={newDifferentials} onChange={(e) => setNewDifferentials(e.target.value)} rows={3} />
              </div>
            </section>

            {/* Presença Digital */}
            <section className="rounded-2xl border bg-card p-6 space-y-5">
              <header>
                <h3 className="text-base font-bold text-foreground">Presença digital</h3>
                <p className="text-xs text-muted-foreground">Cenário atual e referências de mercado.</p>
              </header>
              <div className="space-y-2">
                <Label htmlFor="current-social-presence" className="text-sm">Presença atual nas redes</Label>
                <Textarea id="current-social-presence" className="text-base" placeholder="Canais atuais, seguidores, frequência..." value={newCurrentSocialPresence} onChange={(e) => setNewCurrentSocialPresence(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitors" className="text-sm">Concorrentes (separados por vírgula)</Label>
                <Input id="competitors" className="h-11 text-base" placeholder="Ex: @concorrente1, @concorrente2, @concorrente3" value={newCompetitors} onChange={(e) => setNewCompetitors(e.target.value)} />
              </div>
            </section>

            {/* Links das Redes */}
            <section className="rounded-2xl border bg-card p-6 space-y-5">
              <header>
                <h3 className="text-base font-bold text-foreground">Links das redes</h3>
                <p className="text-xs text-muted-foreground">URLs públicas para análise e referência.</p>
              </header>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm">@ do Instagram</Label>
                  <Input id="instagram" className="h-11 text-base" placeholder="@iobee.digital" value={newInstagram} onChange={(e) => setNewInstagram(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facebook-url" className="text-sm">URL do Facebook</Label>
                  <Input id="facebook-url" className="h-11 text-base" placeholder="https://facebook.com/iobee" value={newFacebookUrl} onChange={(e) => setNewFacebookUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin-url" className="text-sm">URL do LinkedIn</Label>
                  <Input id="linkedin-url" className="h-11 text-base" placeholder="https://linkedin.com/company/iobee" value={newLinkedinUrl} onChange={(e) => setNewLinkedinUrl(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gmb-url" className="text-sm">URL do Google Meu Negócio</Label>
                  <Input id="gmb-url" className="h-11 text-base" placeholder="https://g.page/iobee" value={newGmbUrl} onChange={(e) => setNewGmbUrl(e.target.value)} />
                </div>
              </div>
            </section>
          </div>
          <DialogFooter className="px-8 pb-8 pt-2 gap-2">
            <Button variant="outline" size="lg" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="lg" onClick={handleAddClient} disabled={saving || !newClientName.trim()}>
              {saving ? "Salvando..." : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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