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
  const [newPostingFrequency, setNewPostingFrequency] = useState("");
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
        postingFrequency: newPostingFrequency.trim() || undefined,
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
      setNewPostingFrequency("");
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
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-secondary border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </button>
              <div className="text-sm text-muted-foreground">
                {uploading ? "Enviando..." : "Clique para adicionar foto de perfil"}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome *</Label>
              <Input
                id="client-name"
                placeholder="Ex: iOBEE"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram">@ do Instagram</Label>
              <Input
                id="instagram"
                placeholder="@iobee.digital"
                value={newInstagram}
                onChange={(e) => setNewInstagram(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook-url">URL do Facebook</Label>
              <Input
                id="facebook-url"
                placeholder="https://facebook.com/iobee"
                value={newFacebookUrl}
                onChange={(e) => setNewFacebookUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin-url">URL do LinkedIn</Label>
              <Input
                id="linkedin-url"
                placeholder="https://linkedin.com/company/iobee"
                value={newLinkedinUrl}
                onChange={(e) => setNewLinkedinUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmb-url">URL do Google Meu Negócio</Label>
              <Input
                id="gmb-url"
                placeholder="https://g.page/iobee"
                value={newGmbUrl}
                onChange={(e) => setNewGmbUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Textarea
                id="objective"
                placeholder="Descreva o objetivo do cliente..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddClient} disabled={saving || !newClientName.trim()}>
              {saving ? "Salvando..." : "Cadastrar"}
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
    </div>
  );
}