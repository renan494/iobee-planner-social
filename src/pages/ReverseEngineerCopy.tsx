import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2, Link2, FileText, Sparkles, Copy, Check, Wand2, AlertCircle,
  Save, History, Trash2, ChevronDown, ChevronUp, Eye, FlaskConical, ArrowUp, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePosts } from "@/contexts/PostsContext";

interface AnalysisResult {
  analise: { promessa: string; publico: string; hook_original: string; estrutura: string; cta_original: string; tom: string; };
  variacao: { novo_hook: string; roteiro: string; novo_cta: string; duracao_estimada: string; observacoes: string; };
  hooks_alternativos?: Array<{ hook: string; angulo: string }>;
}

interface HistoryRow {
  id: string;
  client_id: string | null;
  source: string;
  source_url: string | null;
  transcript: string;
  contexto_extra: string | null;
  analise: AnalysisResult["analise"];
  variacao: AnalysisResult["variacao"];
  hooks_alternativos?: AnalysisResult["hooks_alternativos"];
  title: string | null;
  created_at: string;
}

export default function ReverseEngineerCopy() {
  const { clients } = usePosts();
  const [tab, setTab] = useState<"url" | "manual">("url");
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState("");
  const [contextoExtra, setContextoExtra] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const [clientName, setClientName] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [source, setSource] = useState<"manual" | "youtube" | "meta_ad_library" | "instagram">("manual");
  const [sourceUrl, setSourceUrl] = useState<string>("");

  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolve client name -> id
  useEffect(() => {
    if (!clientName) { setClientId(""); return; }
    supabase.from("clients").select("id").eq("name", clientName).maybeSingle().then(({ data }) => {
      setClientId(data?.id || "");
    });
  }, [clientName]);

  useEffect(() => {
    if (!clientId) { setHistory([]); return; }
    void loadHistory(clientId);
  }, [clientId]);

  const loadHistory = async (cid: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("reverse_engineered_copies")
      .select("*")
      .eq("client_id", cid)
      .order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar histórico"); }
    else { setHistory((data as unknown as HistoryRow[]) || []); }
    setLoadingHistory(false);
  };

  const handleExtract = async () => {
    if (!url.trim()) { toast.error("Cole a URL"); return; }
    setExtracting(true); setResult(null); setSavedId(null);
    try {
      const { data, error } = await supabase.functions.invoke("reverse-engineer-copy", {
        body: { action: "extract", url: url.trim() },
      });
      const payload: any = data ?? {};
      const errMsg = payload?.error || error?.message;
      const errCode = payload?.code;
      if (errMsg) {
        if (["UNSUPPORTED_PLATFORM", "NO_CAPTIONS", "META_SCRAPE_FAILED", "INSTAGRAM_SCRAPE_FAILED"].includes(errCode)) {
          toast.warning(errMsg, { description: "Cole a transcrição manualmente abaixo.", duration: 5000 });
          setTab("manual");
        } else { toast.error(errMsg); }
        return;
      }
      if (payload?.transcript) {
        setTranscript(payload.transcript);
        setSource(payload.source || "manual");
        setSourceUrl(url.trim());
        toast.success("Conteúdo extraído!");
        setTab("manual");
      }
    } catch (e: any) {
      toast.error(e?.message || "Erro ao extrair");
    } finally { setExtracting(false); }
  };

  const handleGenerate = async () => {
    if (!transcript.trim() || transcript.trim().length < 30) {
      toast.error("Texto muito curto. Cole o roteiro completo.");
      return;
    }
    setGenerating(true); setResult(null); setSavedId(null);
    try {
      const { data, error } = await supabase.functions.invoke("reverse-engineer-copy", {
        body: { action: "generate", transcript: transcript.trim(), contexto_extra: contextoExtra.trim() },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResult(data.result);
      toast.success("Variação gerada!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao gerar variação");
    } finally { setGenerating(false); }
  };

  const handleSave = async () => {
    if (!clientId) { toast.error("Selecione um cliente"); return; }
    if (!result) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const title = result.variacao.novo_hook?.slice(0, 80) || transcript.slice(0, 60) || "Variação sem título";
      const { data, error } = await supabase
        .from("reverse_engineered_copies")
        .insert({
          user_id: user.id,
          client_id: clientId,
          source,
          source_url: sourceUrl || null,
          transcript: transcript.trim(),
          contexto_extra: contextoExtra.trim() || null,
          analise: result.analise as any,
          variacao: result.variacao as any,
          hooks_alternativos: (result.hooks_alternativos || null) as any,
          title,
        })
        .select("id")
        .single();
      if (error) throw error;
      setSavedId(data.id);
      toast.success("Variação salva no histórico!");
      void loadHistory(clientId);
    } catch (e: any) {
      toast.error("Erro ao salvar: " + (e?.message || ""));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir essa variação?")) return;
    const { error } = await supabase.from("reverse_engineered_copies").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Variação removida");
    setHistory((h) => h.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleLoadFromHistory = (row: HistoryRow) => {
    setTranscript(row.transcript);
    setContextoExtra(row.contexto_extra || "");
    setSource(row.source as any);
    setSourceUrl(row.source_url || "");
    setResult({ analise: row.analise, variacao: row.variacao, hooks_alternativos: row.hooks_alternativos });
    setSavedId(row.id);
    setTab("manual");
    toast.success("Variação carregada");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const sourceLabel = (s: string) =>
    s === "meta_ad_library" ? "Meta Ad Library" :
    s === "youtube" ? "YouTube" :
    s === "instagram" ? "Instagram" : "Manual";

  return (
    <div className="space-y-6">
      <Link to="/copy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar pra Copy
      </Link>

      <div>
        <h2 className="font-heading text-2xl font-extrabold text-foreground">Engenharia Reversa de Copy</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Cole a URL de um post/reel do Instagram, anúncio da Meta Ad Library ou vídeo do YouTube. A IA analisa a estrutura e gera uma variação criativa pronta pra postar.
        </p>
      </div>

      <Card className="p-5">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente (para salvar no histórico)</Label>
        <Select value={clientName} onValueChange={setClientName}>
          <SelectTrigger className="mt-1.5 bg-card border-border"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
          <SelectContent>
            {clients.filter((c) => c).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground mt-2">
          Selecione um cliente para salvar e visualizar o histórico de variações.
        </p>
      </Card>

      <Card className="p-5 border-2 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Como funciona</p>
            <p className="text-xs text-muted-foreground">
              <strong>Instagram:</strong> cole a URL do post (instagram.com/p/...) ou do reel (instagram.com/reel/...).<br />
              <strong>Meta Ad Library:</strong> cole a URL completa do anúncio (facebook.com/ads/library/?id=...).<br />
              <strong>YouTube:</strong> extração automática da legenda quando disponível.<br />
              <strong>TikTok / outros:</strong> use ferramentas de transcrição (CapCut, Whisper) e cole na aba "Transcrição manual".
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "url" | "manual")}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="url" className="gap-2"><Link2 className="w-4 h-4" /> URL</TabsTrigger>
            <TabsTrigger value="manual" className="gap-2"><FileText className="w-4 h-4" /> Transcrição manual</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wider">URL do post, reel, anúncio ou vídeo</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  placeholder="https://instagram.com/reel/... · https://facebook.com/ads/library/... · https://youtube.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={extracting}
                />
                <Button onClick={handleExtract} disabled={extracting || !url.trim()}>
                  {extracting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Extraindo...</>) : (<>Extrair</>)}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                ✅ Instagram (Post / Reel) · ✅ Meta Ad Library · ✅ YouTube / Shorts · TikTok use a aba "Transcrição manual".
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <div>
              <Label className="text-xs font-medium uppercase tracking-wider">Transcrição / Texto do criativo</Label>
              <Textarea
                placeholder="Cole aqui a transcrição completa do vídeo ou texto do post de referência..."
                value={transcript}
                onChange={(e) => { setTranscript(e.target.value); if (!sourceUrl) setSource("manual"); }}
                rows={8}
                className="mt-1.5 font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">{transcript.length} caracteres • mínimo 30</p>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {transcript.trim().length >= 30 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Configurar variação</h3>
          </div>

          <p className="text-xs text-muted-foreground">
            A IA vai analisar o criativo original e gerar um <strong className="text-foreground">novo roteiro do zero</strong> — mantendo a essência, mas com novo hook, nova narrativa e novo CTA.
          </p>

          <div>
            <Label className="text-xs font-medium uppercase tracking-wider">Contexto adicional (opcional)</Label>
            <Textarea
              placeholder="Ex: Adapte para uma clínica de estética em SP, tom mais consultivo..."
              value={contextoExtra}
              onChange={(e) => setContextoExtra(e.target.value)}
              rows={2}
              className="mt-1.5"
            />
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
            {generating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando e gerando variação...</>) : (<><Sparkles className="w-4 h-4 mr-2" /> Gerar variação</>)}
          </Button>
        </Card>
      )}

      {result && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-heading font-bold text-foreground mb-3">🔍 Análise do criativo original</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><Badge variant="secondary" className="mb-1">Promessa</Badge><p className="text-muted-foreground">{result.analise.promessa}</p></div>
              <div><Badge variant="secondary" className="mb-1">Público</Badge><p className="text-muted-foreground">{result.analise.publico}</p></div>
              <div><Badge variant="secondary" className="mb-1">Hook original</Badge><p className="text-muted-foreground">{result.analise.hook_original}</p></div>
              <div><Badge variant="secondary" className="mb-1">Estrutura</Badge><p className="text-muted-foreground">{result.analise.estrutura}</p></div>
              <div><Badge variant="secondary" className="mb-1">CTA original</Badge><p className="text-muted-foreground">{result.analise.cta_original}</p></div>
              <div><Badge variant="secondary" className="mb-1">Tom</Badge><p className="text-muted-foreground">{result.analise.tom}</p></div>
            </div>
          </Card>

          <Card className="p-6 border-2 border-primary/40 bg-primary/5">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h3 className="font-heading font-bold text-foreground">✨ Sua nova variação</h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{result.variacao.duracao_estimada}</Badge>
                <Button size="sm" onClick={handleSave} disabled={saving || !clientId || !!savedId} variant={savedId ? "secondary" : "default"}>
                  {saving ? (<><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Salvando...</>) : savedId ? (<><Check className="w-3.5 h-3.5 mr-1.5" /> Salvo</>) : (<><Save className="w-3.5 h-3.5 mr-1.5" /> Salvar</>)}
                </Button>
              </div>
            </div>

            {!clientId && (
              <p className="text-[11px] text-muted-foreground mb-3 -mt-2">
                💡 Selecione um cliente acima para habilitar Salvar.
              </p>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider">🪝 Novo Hook</Label>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(result.variacao.novo_hook, "hook")}>
                    {copied === "hook" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-sm bg-background p-3 rounded-md border">{result.variacao.novo_hook}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider">📜 Roteiro completo</Label>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(result.variacao.roteiro, "roteiro")}>
                    {copied === "roteiro" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-sm bg-background p-3 rounded-md border whitespace-pre-wrap leading-relaxed">{result.variacao.roteiro}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wider">🚀 Novo CTA</Label>
                  <Button size="sm" variant="ghost" onClick={() => handleCopy(result.variacao.novo_cta, "cta")}>
                    {copied === "cta" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <p className="text-sm bg-background p-3 rounded-md border">{result.variacao.novo_cta}</p>
              </div>

              {result.variacao.observacoes && (
                <div>
                  <Label className="text-xs font-medium uppercase tracking-wider">💡 Observações de produção</Label>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md mt-1.5">{result.variacao.observacoes}</p>
                </div>
              )}
            </div>
          </Card>

          {result.hooks_alternativos && result.hooks_alternativos.length > 0 && (
            <Card className="p-6 border-dashed border-2 border-border">
              <div className="flex items-center gap-2 mb-1">
                <FlaskConical className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-foreground">3 Hooks alternativos para teste A/B</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Cada hook usa um ângulo psicológico diferente. Use "Aplicar" para substituir o hook principal.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {result.hooks_alternativos.map((alt, idx) => (
                  <div key={idx} className="flex flex-col bg-background border border-border rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px]">Variação {idx + 1}</Badge>
                      <span className="text-[10px] text-muted-foreground italic truncate max-w-[60%]" title={alt.angulo}>{alt.angulo}</span>
                    </div>
                    <p className="text-sm text-foreground flex-1 leading-relaxed">{alt.hook}</p>
                    <div className="flex items-center gap-1 pt-1 border-t border-border">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 text-xs h-7"
                        onClick={() => {
                          setResult({ ...result, variacao: { ...result.variacao, novo_hook: alt.hook } });
                          setSavedId(null);
                          toast.success("Hook principal substituído!");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        <ArrowUp className="w-3 h-3 mr-1" /> Aplicar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleCopy(alt.hook, `alt-${idx}`)}>
                        {copied === `alt-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {clientId && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Histórico ({history.length})</h3>
          </div>

          {loadingHistory ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma variação salva ainda.</p>
          ) : (
            <div className="space-y-2">
              {history.map((row) => {
                const isOpen = expandedId === row.id;
                return (
                  <div key={row.id} className="border border-border rounded-md bg-card">
                    <div className="flex items-center gap-3 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px]">{sourceLabel(row.source)}</Badge>
                          <span className="text-[11px] text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {row.title || row.variacao?.novo_hook || "Sem título"}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleLoadFromHistory(row)} title="Carregar"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => setExpandedId(isOpen ? null : row.id)}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(row.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-border p-3 space-y-3 bg-muted/20">
                        <div><Label className="text-[10px] uppercase tracking-wider">Novo Hook</Label><p className="text-xs mt-1">{row.variacao?.novo_hook}</p></div>
                        <div><Label className="text-[10px] uppercase tracking-wider">Roteiro</Label><p className="text-xs mt-1 whitespace-pre-wrap leading-relaxed">{row.variacao?.roteiro}</p></div>
                        <div><Label className="text-[10px] uppercase tracking-wider">Novo CTA</Label><p className="text-xs mt-1">{row.variacao?.novo_cta}</p></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
