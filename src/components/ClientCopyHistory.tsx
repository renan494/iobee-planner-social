import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, PenTool, Trash2, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FRAMEWORKS, type Framework } from "@/lib/copyFrameworks";

interface CopyRow {
  id: string;
  framework: string;
  format: string | null;
  produto: string | null;
  publico_alvo: string | null;
  generated_copy: string | null;
  campaign_type: string | null;
  created_at: string;
}

interface ReverseRow {
  id: string;
  source: string;
  source_url: string | null;
  title: string | null;
  transcript: string;
  variacao: any;
  created_at: string;
}

interface Props {
  clientName: string;
  mode: "frameworks" | "reverse";
}

export function ClientCopyHistory({ clientName, mode }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [copies, setCopies] = useState<CopyRow[]>([]);
  const [reverses, setReverses] = useState<ReverseRow[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data: client } = await supabase.from("clients").select("id").eq("name", clientName).maybeSingle();
      const clientId = client?.id;
      if (!clientId) {
        setCopies([]);
        setReverses([]);
        return;
      }
      if (mode === "frameworks") {
        const { data } = await supabase
          .from("copies")
          .select("id, framework, format, produto, publico_alvo, generated_copy, campaign_type, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
        setCopies((data as CopyRow[]) || []);
      } else {
        const { data } = await supabase
          .from("reverse_engineered_copies")
          .select("id, source, source_url, title, transcript, variacao, created_at")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false });
        setReverses((data as ReverseRow[]) || []);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientName, mode]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTransform = (text: string, title?: string) => {
    const params = new URLSearchParams();
    params.set("copy", text);
    params.set("client", clientName);
    if (title) params.set("title", title);
    navigate(`/criar?${params.toString()}`);
  };

  const handleDeleteCopy = async (id: string) => {
    if (!window.confirm("Excluir esta copy?")) return;
    const { error } = await supabase.from("copies").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Copy excluída");
    load();
  };

  const handleDeleteReverse = async (id: string) => {
    if (!window.confirm("Excluir esta análise?")) return;
    const { error } = await supabase.from("reverse_engineered_copies").delete().eq("id", id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Análise excluída");
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  if (mode === "frameworks") {
    if (copies.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma copy salva pra este cliente ainda.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/copy")}>
              Criar primeira copy
            </Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="space-y-3">
        {copies.map((c) => {
          const fwLabel = FRAMEWORKS[c.framework as Framework]?.label || c.framework.toUpperCase();
          const isOpen = expandedId === c.id;
          return (
            <Card key={c.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-xs">{fwLabel}</Badge>
                      {c.format && <Badge variant="outline" className="text-xs">{c.format}</Badge>}
                      {c.campaign_type && (
                        <Badge variant="outline" className="text-xs">
                          {c.campaign_type === "ongoing" ? "🔄 Ongoing" : "📅 Sazonal"}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm text-foreground truncate">{c.produto || "Sem produto"}</p>
                    {c.publico_alvo && <p className="text-xs text-muted-foreground truncate">{c.publico_alvo}</p>}
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")} às {new Date(c.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setExpandedId(isOpen ? null : c.id)}>
                      {isOpen ? "Ocultar" : "Ver"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(c.generated_copy || "", c.id)} title="Copiar">
                      {copiedId === c.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleTransform(c.generated_copy || "", c.produto || undefined)} title="Transformar em post">
                      <PenTool className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCopy(c.id)} title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {isOpen && c.generated_copy && (
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-xs bg-muted/40 border border-border rounded-md p-3 text-foreground/90 max-h-80 overflow-y-auto">
                    {c.generated_copy}
                  </pre>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // reverse mode
  if (reverses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma engenharia reversa pra este cliente ainda.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/copy/engenharia-reversa")}>
            Analisar criativo
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reverses.map((r) => {
        const isOpen = expandedId === r.id;
        const variacaoTexto = r.variacao?.copy || r.variacao?.legenda || (typeof r.variacao === "string" ? r.variacao : "");
        return (
          <Card key={r.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <Badge variant="secondary" className="text-xs uppercase">{r.source}</Badge>
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> abrir referência
                      </a>
                    )}
                  </div>
                  <p className="font-medium text-sm text-foreground truncate">{r.title || "Sem título"}</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")} às {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                    {isOpen ? "Ocultar" : "Ver"}
                  </Button>
                  {variacaoTexto && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(variacaoTexto, r.id)} title="Copiar variação">
                        {copiedId === r.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleTransform(variacaoTexto, r.title || undefined)} title="Transformar em post">
                        <PenTool className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteReverse(r.id)} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {isOpen && (
                <div className="mt-3 space-y-3">
                  {r.transcript && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Transcrição original</p>
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-muted/40 border border-border rounded-md p-3 text-foreground/80 max-h-48 overflow-y-auto">
                        {r.transcript}
                      </pre>
                    </div>
                  )}
                  {variacaoTexto && (
                    <div>
                      <p className="text-[11px] font-semibold text-primary uppercase tracking-wider mb-1">Variação adaptada</p>
                      <pre className="whitespace-pre-wrap font-mono text-xs bg-primary/5 border border-primary/20 rounded-md p-3 text-foreground max-h-60 overflow-y-auto">
                        {variacaoTexto}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
