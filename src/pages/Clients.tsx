import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, User, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PageContainer } from "@/components/PageContainer";
import { BriefingForm, emptyBriefing, type BriefingFormValues } from "@/components/BriefingForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clients() {
  const { posts, clients, addClient, deleteClient } = usePosts();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<BriefingFormValues>(emptyBriefing);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const handleCancel = () => {
    setCreating(false);
    setForm(emptyBriefing);
    setAvatarPreview(null);
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
        postingFrequency: form.postingFrequency.trim() || undefined,
        socialNetworks: form.socialNetworks.length ? form.socialNetworks : undefined,
        targetAudience: form.targetAudience.trim() || undefined,
        audiencePains: form.audiencePains.trim() || undefined,
        objective: form.objective.trim() || undefined,
        mainOffer: form.mainOffer.trim() || undefined,
        competitors: form.competitors.trim() ? form.competitors.split(",").map((c) => c.trim()).filter(Boolean) : undefined,
        successReferences: form.successReferences.trim() || undefined,
        toneOfVoice: form.toneOfVoice.trim() || undefined,
        contentPillars: form.contentPillars.trim() || undefined,
        ctaPreferences: form.ctaPreferences.trim() || undefined,
        differentials: form.differentials.trim() || undefined,
        productsServices: form.productsServices.trim() || undefined,
        brandValues: form.brandValues.trim() || undefined,
        currentSocialPresence: form.currentSocialPresence.trim() || undefined,
        bannedTopics: form.bannedTopics.trim() || undefined,
        hashtagsBase: form.hashtagsBase.trim() || undefined,
        instagramHandle: form.instagramHandle.trim() || undefined,
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

      {!creating && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clientStats.map((c) => (
            <Card key={c.name} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/clientes/${encodeURIComponent(c.name)}`)}>
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <Avatar className="h-10 w-10">
                  {avatarUrls[c.name] ? <AvatarImage src={avatarUrls[c.name]} alt={c.name} loading="lazy" decoding="async" /> : null}
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

      {creating && (
        <BriefingForm
          values={form}
          onChange={setForm}
          onCancel={handleCancel}
          onSave={handleSave}
          saving={saving}
          avatarUrl={avatarPreview}
          onAvatarChange={setAvatarPreview}
        />
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
