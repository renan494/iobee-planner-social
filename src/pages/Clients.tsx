import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Users, User, Plus, PenTool } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Clients() {
  const { posts, clients, addClient } = usePosts();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newFacebookUrl, setNewFacebookUrl] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clientStats = useMemo(() => {
    return clients.map((name) => {
      const clientPosts = posts.filter((p) => p.client === name);
      const analysts = [...new Set(clientPosts.map((p) => p.analyst))];
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      clientPosts.forEach((p) => byFormat[p.format]++);
      return { name, total: clientPosts.length, analysts, byFormat };
    });
  }, [posts, clients]);

  const [saving, setSaving] = useState(false);

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
        objective: newObjective.trim() || undefined,
        avatarUrl: avatarPreview || undefined,
      });
      toast({ title: "Cliente cadastrado", description: `"${trimmed}" foi adicionado com sucesso.` });
      setNewClientName("");
      setNewInstagram("");
      setNewFacebookUrl("");
      setNewObjective("");
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/criar")} className="gap-2">
            <PenTool className="h-4 w-4" />
            Produzir Conteúdo
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Cadastrar Cliente
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientStats.map((c) => (
          <Card key={c.name} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/clientes/${encodeURIComponent(c.name)}`)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{c.total} posts</p>
              </div>
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
    </div>
  );
}