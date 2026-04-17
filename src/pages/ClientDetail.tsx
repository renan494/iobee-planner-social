import React, { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Camera, FileText, Pencil, Eye, PenTool, X, FileCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { usePosts } from "@/contexts/PostsContext";
import { supabase } from "@/integrations/supabase/client";
import { FORMAT_LABELS, FUNNEL_LABELS, type PostFormat, type Post } from "@/data/posts";
import { PostBadge } from "@/components/PostBadge";
import { toast } from "sonner";
import { ClientReportPreview } from "@/components/ClientReportPreview";
import { PostDetailModal } from "@/components/PostDetailModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientCopyHistory } from "@/components/ClientCopyHistory";
import { PageContainer } from "@/components/PageContainer";
import { BriefingForm, emptyBriefing, parseBRL, numberToBRL, type BriefingFormValues, type PlatformKey } from "@/components/BriefingForm";

export default function ClientDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { posts, updatePostDate, updatePostArt, updatePost, deletePost, analysts: allAnalysts } = usePosts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingForm, setBriefingForm] = useState<BriefingFormValues>(emptyBriefing);
  const [briefingSaving, setBriefingSaving] = useState(false);

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

  const openBriefingEditor = async () => {
    const { data } = await supabase.from("clients").select("*").eq("name", clientName).maybeSingle();
    const row = (data as any) || {};
    setBriefingForm({
      name: clientName,
      niche: row.niche || "",
      websiteUrl: row.website_url || "",
      ticketMedio: numberToBRL(row.ticket_medio),
      verbaMensal: numberToBRL(row.verba_mensal),
      targetAudience: row.target_audience || "",
      objective: row.objective || "",
      competitors: (row.competitors || []).join(", "),
      platforms: ((row.platforms || []) as PlatformKey[]).filter((p) => ["meta", "google", "tiktok"].includes(p)),
      toneOfVoice: row.tone_of_voice || "",
      differentials: row.differentials || "",
      productsServices: row.products_services || "",
      brandValues: row.brand_values || "",
      currentSocialPresence: row.current_social_presence || "",
      instagramHandle: row.instagram_handle || "",
      facebookUrl: row.facebook_url || "",
      linkedinUrl: row.linkedin_url || "",
      gmbUrl: row.gmb_url || "",
    });
    setEditingBriefing(true);
  };

  const handleSaveBriefing = async () => {
    setBriefingSaving(true);
    try {
      const { error } = await supabase.from("clients").update({
        niche: briefingForm.niche.trim() || null,
        website_url: briefingForm.websiteUrl.trim() || null,
        ticket_medio: parseBRL(briefingForm.ticketMedio) ?? null,
        verba_mensal: parseBRL(briefingForm.verbaMensal) ?? null,
        target_audience: briefingForm.targetAudience.trim() || null,
        objective: briefingForm.objective.trim() || null,
        competitors: briefingForm.competitors.trim()
          ? briefingForm.competitors.split(",").map((c) => c.trim()).filter(Boolean)
          : null,
        platforms: briefingForm.platforms.length ? briefingForm.platforms : null,
        tone_of_voice: briefingForm.toneOfVoice.trim() || null,
        differentials: briefingForm.differentials.trim() || null,
        products_services: briefingForm.productsServices.trim() || null,
        brand_values: briefingForm.brandValues.trim() || null,
        current_social_presence: briefingForm.currentSocialPresence.trim() || null,
        instagram_handle: briefingForm.instagramHandle.trim() || null,
        facebook_url: briefingForm.facebookUrl.trim() || null,
        linkedin_url: briefingForm.linkedinUrl.trim() || null,
        gmb_url: briefingForm.gmbUrl.trim() || null,
      } as any).eq("name", clientName);
      if (error) throw error;
      toast.success("Briefing atualizado!");
      setEditingBriefing(false);
    } catch {
      toast.error("Erro ao salvar briefing.");
    } finally {
      setBriefingSaving(false);
    }
  };

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => showReport ? setShowReport(false) : navigate("/clientes")}>
          <ArrowLeft className="h-4 w-4" /> {showReport ? "Voltar" : "Voltar"}
        </Button>
        <div className="flex gap-2">
          {!showReport && !editingBriefing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={openBriefingEditor}>
              <FileCog className="h-4 w-4" /> Editar Briefing
            </Button>
          )}
          {!showReport && !editingBriefing && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/criar?client=${encodeURIComponent(clientName)}`)}>
              <PenTool className="h-4 w-4" /> Produzir Conteúdo
            </Button>
          )}
          {!showReport && !editingBriefing && clientPosts.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowReport(true)}>
              <Eye className="h-4 w-4" /> Ver Posts
            </Button>
          )}
        </div>
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
        </div>
          <p className="text-sm text-muted-foreground">{clientPosts.length} posts · {analysts.length} analista(s)</p>
      </div>

      {editingBriefing ? (
        <BriefingForm
          values={briefingForm}
          onChange={setBriefingForm}
          onCancel={() => setEditingBriefing(false)}
          onSave={handleSaveBriefing}
          saving={briefingSaving}
          lockName
          avatarUrl={avatarUrl}
          saveLabel="Salvar Briefing"
        />
      ) : null}

      {showReport ? (
        <ClientReportPreview
          clientName={clientName}
          posts={clientPosts}
          analysts={analysts}
          byFormat={byFormat}
          avatarUrl={avatarUrl}
          onPostClick={(post) => setSelectedPost(post)}
          onEditPost={(post) => setSelectedPost(post)}
          onDeletePost={async (id) => { await deletePost(id); }}
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

          {/* Tabs: Posts / Copies / Engenharia Reversa */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="posts">Posts ({clientPosts.length})</TabsTrigger>
              <TabsTrigger value="copies">Copies por framework</TabsTrigger>
              <TabsTrigger value="reverse">Engenharia reversa</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
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
                        <TableHead className="w-20"></TableHead>
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
                          <React.Fragment key={post.id}>
                          <TableRow className="group cursor-pointer hover:bg-[hsl(var(--primary)/0.08)] transition-colors" onClick={() => setSelectedPost(post)}>
                            <TableCell className="whitespace-nowrap">{new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell className="text-muted-foreground">{post.headline}</TableCell>
                            <TableCell><PostBadge format={post.format} /></TableCell>
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
                              <div className="flex gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); setPreviewPost(previewPost?.id === post.id ? null : post); }}
                                  title="Visualizar post"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                                  onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                                  title="Editar post"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {previewPost?.id === post.id && (
                            <TableRow>
                              <TableCell colSpan={8} className="p-0 border-t-0">
                                <div className="bg-muted/30 border-t border-b border-border p-6 animate-in slide-in-from-top-2 duration-200">
                                  <div className="flex gap-6">
                                    {/* Phone mockup */}
                                    <div className="shrink-0">
                                      <div className="relative w-[160px] rounded-[1.5rem] border-[5px] border-foreground/80 bg-background shadow-xl overflow-hidden">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-foreground/80 rounded-b-lg z-10" />
                                        <div className="aspect-[9/16] bg-muted flex items-center justify-center overflow-hidden">
                                          {(post.format === "carousel" && post.artUrls && post.artUrls.length > 0) ? (
                                            <img src={post.artUrls[0]} alt={post.title} className="w-full h-full object-cover" />
                                          ) : post.artUrl ? (
                                            <img src={post.artUrl} alt={post.title} className="w-full h-full object-cover" />
                                          ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                              <FileText className="h-6 w-6" />
                                              <span className="text-[10px]">Sem arte</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="h-4 flex items-center justify-center">
                                          <div className="w-10 h-1 rounded-full bg-foreground/30" />
                                        </div>
                                      </div>
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 min-w-0 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-foreground">{post.title}</h3>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewPost(null)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{post.headline}</p>
                                      <div className="flex flex-wrap gap-2 text-sm">
                                        <Badge variant="secondary">{FORMAT_LABELS[post.format]}</Badge>
                                        <Badge variant="outline">{FUNNEL_LABELS[post.funnelStage]}</Badge>
                                        {(post.channels || []).map((ch) => (
                                          <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="font-medium text-foreground">Data:</span> <span className="text-muted-foreground">{new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR")}</span></div>
                                        <div><span className="font-medium text-foreground">Analista:</span> <span className="text-muted-foreground">{post.analyst}</span></div>
                                      </div>
                                      {post.legend && (
                                        <div className="border-l-2 border-primary/40 pl-3">
                                          <p className="text-xs font-semibold text-foreground mb-1">Legenda</p>
                                          <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">{post.legend}</p>
                                        </div>
                                      )}
                                      {post.hashtags.length > 0 && (
                                        <p className="text-xs text-muted-foreground">{post.hashtags.map((h) => `#${h}`).join(" ")}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="copies">
              <ClientCopyHistory clientName={clientName} mode="frameworks" />
            </TabsContent>

            <TabsContent value="reverse">
              <ClientCopyHistory clientName={clientName} mode="reverse" />
            </TabsContent>
          </Tabs>
        </>
      )}

      <PostDetailModal
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(o) => { if (!o) setSelectedPost(null); }}
        onUpdateDate={(id, date) => { updatePostDate(id, date); setSelectedPost((p) => p ? { ...p, date } : null); }}
        onUpdateArt={async (id, url) => { await updatePostArt(id, url); setSelectedPost((p) => p ? { ...p, artUrl: url ?? undefined } : null); }}
        onUpdatePost={async (id, fields) => { await updatePost(id, fields); setSelectedPost((p) => p ? { ...p, ...fields } : null); }}
        onDeletePost={async (id) => { await deletePost(id); setSelectedPost(null); }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editName} disabled className="opacity-60" />
            </div>

            {/* Briefing Section */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                Briefing para IA Estrategista
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-niche">Nicho / Segmento</Label>
                  <Input id="edit-niche" placeholder="Ex: Gastronomia, Moda feminina, SaaS B2B..." value={editNiche} onChange={(e) => setEditNiche(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-target">Público-alvo</Label>
                  <Textarea id="edit-target" placeholder="Descreva o público ideal: idade, gênero, interesses, dores..." value={editTargetAudience} onChange={(e) => setEditTargetAudience(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-tone">Tom de voz</Label>
                  <Input id="edit-tone" placeholder="Ex: Profissional e acolhedor, Jovem e descontraído..." value={editToneOfVoice} onChange={(e) => setEditToneOfVoice(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-products">Produtos / Serviços principais</Label>
                  <Textarea id="edit-products" placeholder="Descreva os principais produtos ou serviços..." value={editProductsServices} onChange={(e) => setEditProductsServices(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-differentials">Diferenciais</Label>
                  <Textarea id="edit-differentials" placeholder="O que diferencia este cliente dos concorrentes?" value={editDifferentials} onChange={(e) => setEditDifferentials(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-competitors">Concorrentes (separados por vírgula)</Label>
                  <Input id="edit-competitors" placeholder="Ex: @marca1, @marca2, empresa X" value={editCompetitors} onChange={(e) => setEditCompetitors(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-brand-values">Valores da marca</Label>
                  <Input id="edit-brand-values" placeholder="Ex: Inovação, sustentabilidade, qualidade..." value={editBrandValues} onChange={(e) => setEditBrandValues(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-social-presence">Presença atual nas redes</Label>
                  <Textarea id="edit-social-presence" placeholder="Descreva a situação atual: plataformas ativas, nº de seguidores, frequência..." value={editCurrentSocialPresence} onChange={(e) => setEditCurrentSocialPresence(e.target.value)} rows={2} />
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-foreground mb-3">Redes sociais</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-instagram">@ do Instagram</Label>
                  <Input id="edit-instagram" placeholder="@iobee.digital" value={editInstagram} onChange={(e) => setEditInstagram(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-facebook">URL do Facebook</Label>
                  <Input id="edit-facebook" placeholder="https://facebook.com/iobee" value={editFacebookUrl} onChange={(e) => setEditFacebookUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-linkedin">URL do LinkedIn</Label>
                  <Input id="edit-linkedin" placeholder="https://linkedin.com/company/iobee" value={editLinkedinUrl} onChange={(e) => setEditLinkedinUrl(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-gmb">URL do Google Meu Negócio</Label>
                  <Input id="edit-gmb" placeholder="https://g.page/iobee" value={editGmbUrl} onChange={(e) => setEditGmbUrl(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Objective */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-objective">Objetivo</Label>
              <Textarea id="edit-objective" placeholder="Descreva o objetivo..." value={editObjective} onChange={(e) => setEditObjective(e.target.value)} rows={3} />
            </div>

            {/* Analysts */}
            <div className="space-y-2">
              <Label>Analistas</Label>
              <div className="flex flex-wrap gap-1.5">
                {analysts.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                    {a}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remover "${a}" dos posts deste cliente? Isso não exclui os posts, apenas desvincula o analista.`)) {
                          const analystPosts = clientPosts.filter((p) => p.analyst === a);
                          analystPosts.forEach((p) => updatePost(p.id, { analyst: "" }));
                        }
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {analysts.length === 0 && (
                  <span className="text-xs text-muted-foreground">Nenhum analista vinculado</span>
                )}
              </div>
              {allAnalysts.filter((a) => !analysts.includes(a)).length > 0 && (
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value=""
                  onChange={(e) => {
                    const analyst = e.target.value;
                    if (!analyst) return;
                    navigate(`/criar?client=${encodeURIComponent(clientName)}`);
                    setEditOpen(false);
                  }}
                >
                  <option value="">+ Adicionar analista...</option>
                  {allAnalysts.filter((a) => !analysts.includes(a)).map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              )}
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
    </PageContainer>
  );
}
