import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Camera, FileText, Pencil, Eye, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePosts } from "@/contexts/PostsContext";
import { supabase } from "@/integrations/supabase/client";
import { FORMAT_LABELS, FUNNEL_LABELS, type PostFormat, type FunnelStage, type Post } from "@/data/posts";
import { toast } from "sonner";
import { ClientReportPreview } from "@/components/ClientReportPreview";
import { PostDetailModal } from "@/components/PostDetailModal";

export default function ClientDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { posts, updatePostDate, updatePostArt, updatePost } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editFacebookUrl, setEditFacebookUrl] = useState("");
  const [editObjective, setEditObjective] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const clientName = decodeURIComponent(name || "");
  const clientPosts = useMemo(() => posts.filter((p) => p.client === clientName), [posts, clientName]);

  const analysts = useMemo(() => [...new Set(clientPosts.map((p) => p.analyst))], [clientPosts]);
  const byFormat = useMemo(() => {
    const acc: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
    clientPosts.forEach((p) => acc[p.format]++);
    return acc;
  }, [clientPosts]);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const storagePath = `${encodeURIComponent(clientName)}/avatar`;

  useEffect(() => {
    const { data } = supabase.storage.from("client-avatars").getPublicUrl(storagePath);
    // Check if the file actually exists by appending a cache-bust
    fetch(data.publicUrl, { method: "HEAD" }).then((res) => {
      if (res.ok) setAvatarUrl(data.publicUrl + "?t=" + Date.now());
    }).catch(() => {});
  }, [storagePath]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { error } = await supabase.storage.from("client-avatars").upload(storagePath, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("client-avatars").getPublicUrl(storagePath);
      setAvatarUrl(data.publicUrl + "?t=" + Date.now());
      toast.success("Foto do cliente atualizada!");
    } catch {
      toast.error("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  };

  const openEditDialog = async () => {
    // Load client data from DB
    const { data } = await supabase.from("clients").select("*").eq("name", clientName).maybeSingle();
    setEditName(clientName);
    setEditInstagram((data as any)?.instagram_handle || "");
    setEditFacebookUrl((data as any)?.facebook_url || "");
    setEditObjective((data as any)?.objective || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      const { error } = await supabase.from("clients").update({
        instagram_handle: editInstagram.trim() || null,
        facebook_url: editFacebookUrl.trim() || null,
        objective: editObjective.trim() || null,
      } as any).eq("name", clientName);
      if (error) throw error;
      toast.success("Dados do cliente atualizados!");
      setEditOpen(false);
    } catch {
      toast.error("Erro ao salvar dados do cliente.");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => showReport ? setShowReport(false) : navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4" /> {showReport ? "Voltar" : "Voltar"}
        </Button>
        {!showReport && clientPosts.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowReport(true)}>
            <Eye className="h-4 w-4" /> Ver Posts
          </Button>
        )}
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar className="h-12 w-12">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={clientName} />
            ) : null}
            <AvatarFallback className="bg-secondary">
              <User className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-4 w-4 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploading}
          />
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
          <button onClick={openEditDialog} className="rounded-full p-1.5 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
          <p className="text-sm text-muted-foreground">{clientPosts.length} posts · {analysts.length} analista(s)</p>
      </div>

      {showReport ? (
        <ClientReportPreview
          clientName={clientName}
          posts={clientPosts}
          analysts={analysts}
          byFormat={byFormat}
          avatarUrl={avatarUrl}
          onPostClick={(post) => setSelectedPost(post)}
        />
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 flex flex-wrap gap-2">
            {(Object.entries(byFormat) as [PostFormat, number][]).map(([fmt, count]) =>
              count > 0 ? (
                <Badge key={fmt} variant="secondary">{FORMAT_LABELS[fmt]}: {count}</Badge>
              ) : null
            )}
            <span className="mx-2 text-muted-foreground">|</span>
            {analysts.map((a) => (
              <Badge key={a} variant="outline">{a}</Badge>
            ))}
          </div>

          {/* Posts table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Headline</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Funil</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Analista</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientPosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        Nenhum post encontrado para este cliente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientPosts.map((post) => (
                      <TableRow key={post.id} className="group cursor-pointer hover:bg-[hsl(var(--primary)/0.08)] transition-colors" onClick={() => setSelectedPost(post)}>
                        <TableCell className="whitespace-nowrap">{new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">{post.title}</TableCell>
                        <TableCell className="text-muted-foreground">{post.headline}</TableCell>
                        <TableCell><Badge variant="secondary">{FORMAT_LABELS[post.format]}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{FUNNEL_LABELS[post.funnelStage]}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(post.channels || []).length > 0 ? (
                              (post.channels || []).map((ch) => (
                                <span key={ch} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{ch}</span>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{post.analyst}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                            title="Editar post"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <PostDetailModal
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(o) => { if (!o) setSelectedPost(null); }}
        onUpdateDate={(id, date) => { updatePostDate(id, date); setSelectedPost((p) => p ? { ...p, date } : null); }}
        onUpdateArt={async (id, url) => { await updatePostArt(id, url); setSelectedPost((p) => p ? { ...p, artUrl: url ?? undefined } : null); }}
        onUpdatePost={async (id, fields) => { await updatePost(id, fields); setSelectedPost((p) => p ? { ...p, ...fields } : null); }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} disabled className="opacity-60" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-instagram">@ do Instagram</Label>
              <Input id="edit-instagram" placeholder="@iobee.digital" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-facebook">URL do Facebook</Label>
              <Input id="edit-facebook" placeholder="https://facebook.com/iobee" value={editFacebookUrl} onChange={(e) => setEditFacebookUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-objective">Objetivo</Label>
              <Textarea id="edit-objective" placeholder="Descreva o objetivo..." value={editObjective} onChange={(e) => setEditObjective(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={editSaving}>
              {editSaving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
