import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, RotateCcw, Lightbulb, Wand2, Loader2, Link2, ExternalLink, ArrowLeft, FileText, Save, RefreshCw, PenTool } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePosts } from "@/contexts/PostsContext";
import { FRAMEWORKS, FORMATS, type Framework } from "@/lib/copyFrameworks";

export default function CopyFramework() {
  const { framework } = useParams<{ framework: Framework }>();
  const config = framework ? FRAMEWORKS[framework] : undefined;
  const navigate = useNavigate();
  const { clients } = usePosts();

  const [format, setFormat] = useState("");
  const [produto, setProduto] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [referenceContent, setReferenceContent] = useState("");
  const [referenceAnalysis, setReferenceAnalysis] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [manualAdText, setManualAdText] = useState("");
  const [clientName, setClientName] = useState("");
  const [campaignType, setCampaignType] = useState("ongoing");
  const [guideIA, setGuideIA] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [manualCopyEdit, setManualCopyEdit] = useState("");

  if (!config || !framework) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-foreground mb-2">Framework não encontrado</h2>
        <Link to="/copy" className="text-primary underline hover:text-primary/80">Voltar</Link>
      </div>
    );
  }

  const handleSectionChange = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const allFilled = config.sections.every((s) => values[s.key]?.trim());

  const generatedCopy = (() => {
    if (!allFilled) return "";
    const lines: string[] = [];
    if (produto.trim()) lines.push(`📦 Produto/Serviço: ${produto.trim()}`);
    if (publicoAlvo.trim()) lines.push(`🎯 Público: ${publicoAlvo.trim()}`);
    if (format) {
      const f = FORMATS.find((f) => f.value === format);
      if (f) lines.push(`📱 Formato: ${f.label}`);
    }
    lines.push(`📝 Framework: ${config.label}`);
    lines.push("", "---", "");
    config.sections.forEach((s) => {
      lines.push(s.label, values[s.key].trim(), "");
    });
    return lines.join("\n");
  })();

  const finalCopy = manualCopyEdit || generatedCopy;

  const handleCopy = () => {
    if (!finalCopy) return;
    navigator.clipboard.writeText(finalCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFormat(""); setProduto(""); setPublicoAlvo(""); setValues({});
    setReferenceUrl(""); setReferenceContent(""); setManualAdText(""); setManualCopyEdit("");
  };

  const canGenerateAI = produto.trim() !== "" && publicoAlvo.trim() !== "";

  const handleGenerateAI = async () => {
    if (!canGenerateAI) return;
    setIsGenerating(true);
    try {
      const formatLabel = FORMATS.find((f) => f.value === format)?.label || "";
      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          framework: config.label,
          frameworkDescription: config.description,
          sections: config.sections.map((s) => ({ key: s.key, label: s.label, description: s.description })),
          produto: produto.trim(),
          publicoAlvo: publicoAlvo.trim(),
          formato: formatLabel,
          guideIA: guideIA.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.sections) setValues(data.sections);
      toast.success("Copy gerada!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar copy com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const runAnalyze = async (adContent: string) => {
    const { data, error } = await supabase.functions.invoke("analyze-ad", {
      body: {
        adContent,
        framework: config.label,
        frameworkDescription: config.description,
        sections: config.sections.map((s) => ({ key: s.key, label: s.label, description: s.description })),
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (data?.sections) setValues(data.sections);
    if (data?.analysis) setReferenceAnalysis(data.analysis);
  };

  const handleAnalyzeUrl = async () => {
    if (!referenceUrl.trim()) return;
    setIsAnalyzing(true);
    try {
      const { data: scrapeData, error: scrapeErr } = await supabase.functions.invoke("analyze-ad", {
        body: { action: "scrape", url: referenceUrl.trim() },
      });
      if (scrapeErr) throw scrapeErr;
      if (scrapeData?.error) throw new Error(scrapeData.error);
      const content = scrapeData?.content;
      if (!content) throw new Error("Sem conteúdo extraído.");
      setReferenceContent(content.slice(0, 500) + "...");
      await runAnalyze(content);
      toast.success("Anúncio analisado e adaptado!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao analisar anúncio");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeManual = async () => {
    if (!manualAdText.trim()) return;
    setIsAnalyzing(true);
    try {
      setReferenceContent(manualAdText.trim().slice(0, 500) + "...");
      await runAnalyze(manualAdText.trim());
      toast.success("Texto analisado e adaptado!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao analisar texto");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCopy = async () => {
    if (!clientName || !allFilled) return;
    setIsSaving(true);
    try {
      const { data: clientRow } = await supabase.from("clients").select("id").eq("name", clientName).maybeSingle();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("copies").insert({
        user_id: user.id,
        client_id: clientRow?.id || null,
        framework,
        format: format || null,
        produto: produto.trim() || null,
        publico_alvo: publicoAlvo.trim() || null,
        sections: values,
        generated_copy: finalCopy,
        campaign_type: campaignType,
      });
      if (error) throw error;
      setSaved(true);
      toast.success("Copy salva!");
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar copy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransformIntoPost = () => {
    if (!finalCopy) return;
    const params = new URLSearchParams();
    params.set("copy", finalCopy);
    if (clientName) params.set("client", clientName);
    if (produto.trim()) params.set("title", produto.trim());
    navigate(`/criar?${params.toString()}`);
    toast.success("Copy enviada para Produzir Conteúdo!");
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <Link to="/copy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <div className="flex items-center gap-3">
        <Icon className="w-7 h-7 text-primary" />
        <div>
          <h2 className="font-heading text-2xl font-extrabold text-foreground">{config.label}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Insight estratégico</p>
          <p className="text-sm text-foreground">{config.insight}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>Quando usar:</strong> {config.when}
          </p>
        </div>
      </div>

      <Card className="p-6 border-border bg-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">Cliente & contexto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</Label>
            <Select value={clientName} onValueChange={setClientName}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clients.filter((c) => c).map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo de Campanha</Label>
            <Select value={campaignType} onValueChange={setCampaignType}>
              <SelectTrigger className="bg-card border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ongoing">🔄 Ongoing (contínua)</SelectItem>
                <SelectItem value="sazonal">📅 Sazonal (campanha específica)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Produto / Serviço</Label>
            <Input value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Ex: Mentoria de Instagram pra clínicas" className="bg-card border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Público-alvo</Label>
            <Input value={publicoAlvo} onChange={(e) => setPublicoAlvo(e.target.value)} placeholder="Ex: Donas de clínica de estética com até 5k seguidores" className="bg-card border-border" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Formato</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger className="bg-card border-border"><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Orientação para a IA (opcional)</Label>
          <Textarea
            value={guideIA}
            onChange={(e) => setGuideIA(e.target.value)}
            placeholder="Ex: Use tom leve e bem-humorado. Foque em prova social. Mencione o método X."
            className="bg-card border-border min-h-[70px] resize-y"
          />
          <p className="text-xs text-muted-foreground/70">
            Tom, estilo, gatilhos ou informações extras pra IA considerar.
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Link2 className="w-3.5 h-3.5" /> Referência (opcional) — Meta Ad Library, Instagram, etc.
          </h4>

          <div className="flex gap-2 mb-3">
            <Button type="button" variant={!manualMode ? "default" : "outline"} size="sm" onClick={() => setManualMode(false)}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Colar URL
            </Button>
            <Button type="button" variant={manualMode ? "default" : "outline"} size="sm" onClick={() => setManualMode(true)}>
              <FileText className="w-3.5 h-3.5 mr-1" /> Colar texto
            </Button>
          </div>

          {!manualMode ? (
            <>
              <div className="flex gap-2">
                <Input
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="URL da Meta Ad Library ou de um post/reel do Instagram"
                  className="bg-card border-border flex-1"
                />
                <Button onClick={handleAnalyzeUrl} disabled={!referenceUrl.trim() || isAnalyzing} variant="outline" className="shrink-0">
                  {isAnalyzing ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analisando...</>) : (<><ExternalLink className="w-4 h-4 mr-1" /> Analisar</>)}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Textarea
                value={manualAdText}
                onChange={(e) => setManualAdText(e.target.value)}
                placeholder="Cole o texto do anúncio/post de referência..."
                className="bg-card border-border min-h-[120px] resize-y"
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleAnalyzeManual} disabled={!manualAdText.trim() || isAnalyzing} variant="outline" size="sm">
                  {isAnalyzing ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analisando...</>) : (<><Wand2 className="w-4 h-4 mr-1" /> Analisar texto</>)}
                </Button>
              </div>
            </>
          )}

          {referenceContent && (
            <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">📄 Conteúdo extraído (preview):</p>
              <p className="text-xs text-muted-foreground/80 line-clamp-4">{referenceContent}</p>
            </div>
          )}

          {referenceAnalysis && (
            <div className="mt-3 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs font-semibold text-foreground mb-2">🏆 Por que esse criativo funcionou?</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{referenceAnalysis}</p>
            </div>
          )}
        </div>

        <div className="mt-5 pt-5 border-t border-border">
          <Button onClick={handleGenerateAI} disabled={!canGenerateAI || isGenerating} className="w-full font-semibold">
            {isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando copy com IA...</>) : (<><Wand2 className="w-4 h-4 mr-2" /> Gerar copy com IA</>)}
          </Button>
          {!canGenerateAI && (<p className="text-xs text-muted-foreground mt-2 text-center">Preencha produto/serviço e público-alvo</p>)}
        </div>
      </Card>

      <Card className="p-6 border-border bg-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-5">{config.label} — preencha cada etapa</h3>
        <div className="space-y-6">
          {config.sections.filter((s) => s.key !== "texto_anuncio").map((section) => (
            <div key={section.key} className="space-y-1.5">
              <Label className="text-sm font-semibold text-foreground">{section.label}</Label>
              <p className="text-xs text-muted-foreground mb-1">{section.description}</p>
              <Textarea
                value={values[section.key] || ""}
                onChange={(e) => handleSectionChange(section.key, e.target.value)}
                placeholder={section.placeholder}
                className="bg-card border-border min-h-[140px] resize-y"
              />
            </div>
          ))}
        </div>
      </Card>

      {config.sections.filter((s) => s.key === "texto_anuncio").map((section) => (
        <Card key={section.key} className="p-6 border-border bg-card">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">{section.label}</Label>
            <p className="text-xs text-muted-foreground mb-1">{section.description}</p>
            <Textarea
              value={values[section.key] || ""}
              onChange={(e) => handleSectionChange(section.key, e.target.value)}
              placeholder={section.placeholder}
              className="bg-card border-border min-h-[180px] resize-y"
            />
          </div>
        </Card>
      ))}

      <Card className="p-6 border-border bg-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Copy gerada — edite à vontade</h3>
        <Textarea
          value={manualCopyEdit || (allFilled ? generatedCopy : "")}
          onChange={(e) => setManualCopyEdit(e.target.value)}
          placeholder="Preencha todas as etapas para gerar a copy"
          className={`font-mono text-sm min-h-[200px] resize-y ${allFilled || manualCopyEdit ? "bg-primary/10 text-foreground border-primary/30" : "bg-muted text-muted-foreground"}`}
        />

        <div className="mt-4 flex flex-wrap justify-end gap-3">
          {allFilled && (
            <Button onClick={handleGenerateAI} disabled={!canGenerateAI || isGenerating} variant="outline" size="sm" className="mr-auto">
              {isGenerating ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Gerando...</>) : (<><RefreshCw className="w-4 h-4 mr-1" /> Outra versão</>)}
            </Button>
          )}
          <Button variant="outline" onClick={handleReset} size="sm"><RotateCcw className="w-4 h-4 mr-1" /> Limpar</Button>
          <Button onClick={handleCopy} disabled={!allFilled} variant="outline" size="sm">
            {copied ? (<><Check className="w-4 h-4 mr-1" /> Copiado!</>) : (<><Copy className="w-4 h-4 mr-1" /> Copiar</>)}
          </Button>
          <Button onClick={handleTransformIntoPost} disabled={!allFilled} variant="outline" size="sm">
            <PenTool className="w-4 h-4 mr-1" /> Transformar em post
          </Button>
          <Button onClick={handleSaveCopy} disabled={!allFilled || !clientName || isSaving} className="font-semibold" size="sm">
            {saved ? (<><Check className="w-4 h-4 mr-1" /> Salvo!</>) : isSaving ? (<><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Salvando...</>) : (<><Save className="w-4 h-4 mr-1" /> Salvar no cliente</>)}
          </Button>
        </div>
      </Card>
    </div>
  );
}
