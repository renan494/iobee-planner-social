import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, FileText, Clock, Trash2, ChevronDown, ChevronUp, AlertCircle, Save, Star } from "lucide-react";
import StrategyContent from "@/components/StrategyContent";
import StrategyDebateChat from "@/components/StrategyDebateChat";
import StrategySlideViewer from "@/components/strategy-slides/StrategySlideViewer";
import { PageContainer } from "@/components/PageContainer";

type ClientData = {
  id: string;
  name: string;
  niche?: string | null;
  target_audience?: string | null;
  tone_of_voice?: string | null;
  competitors?: string[] | null;
  differentials?: string | null;
  products_services?: string | null;
  posting_frequency?: string | null;
  brand_values?: string | null;
  current_social_presence?: string | null;
  objective?: string | null;
  instagram_handle?: string | null;
  active_strategy_id?: string | null;
};

type Strategy = {
  id: string;
  client_id: string;
  title: string;
  content: string;
  created_at: string;
};

export default function Strategy() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const briefingFields = selectedClient
    ? [selectedClient.niche, selectedClient.target_audience, selectedClient.tone_of_voice, selectedClient.differentials, selectedClient.products_services].filter(Boolean)
    : [];
  const hasBriefing = briefingFields.length >= 3;

  useEffect(() => { loadClients(); }, []);

  useEffect(() => {
    const clientParam = searchParams.get("client");
    if (clientParam && clients.length > 0) {
      const found = clients.find((c) => c.name === decodeURIComponent(clientParam));
      if (found) setSelectedClientId(found.id);
    }
  }, [searchParams, clients]);

  useEffect(() => {
    if (selectedClientId) loadStrategies(selectedClientId);
  }, [selectedClientId]);

  async function loadClients() {
    const { data } = await supabase.from("clients").select("*").order("name");
    if (data) setClients(data as unknown as ClientData[]);
  }

  async function loadStrategies(clientId: string) {
    setLoadingStrategies(true);
    const { data } = await supabase
      .from("strategies")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setStrategies(data as unknown as Strategy[]);
    setLoadingStrategies(false);
  }

  async function handleGenerate() {
    if (!selectedClient || !user) return;
    setGenerating(true);
    setStreamContent("");

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-strategy`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ client: selectedClient, model: (await import("@/lib/aiModels")).getAIModel("strategy") }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error("Sem resposta do servidor");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullContent += content;
              setStreamContent(fullContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (fullContent.trim()) {
        const title = `Estratégia - ${selectedClient.name} - ${new Date().toLocaleDateString("pt-BR")}`;
        const { error } = await supabase.from("strategies").insert({
          client_id: selectedClient.id,
          user_id: user.id,
          title,
          content: fullContent,
        } as any);
        if (error) {
          console.error("Error saving strategy:", error);
          toast.error("Estratégia gerada mas não foi possível salvar.");
        } else {
          toast.success("Estratégia gerada e salva com sucesso!");
          loadStrategies(selectedClient.id);
        }
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Erro ao gerar estratégia");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta estratégia?")) return;
    const { error } = await supabase.from("strategies").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir estratégia");
    } else {
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      if (expandedId === id) setExpandedId(null);
      if (selectedClient?.active_strategy_id === id) {
        setClients((prev) => prev.map((c) => c.id === selectedClient.id ? { ...c, active_strategy_id: null } : c));
      }
      toast.success("Estratégia excluída");
    }
  }

  async function handleSetActive(strategyId: string) {
    if (!selectedClient) return;
    const isAlreadyActive = selectedClient.active_strategy_id === strategyId;
    const newValue = isAlreadyActive ? null : strategyId;
    const { error } = await (supabase.from("clients") as any)
      .update({ active_strategy_id: newValue })
      .eq("id", selectedClient.id);
    if (error) {
      toast.error("Não foi possível definir como ativa");
      return;
    }
    setClients((prev) => prev.map((c) => c.id === selectedClient.id ? { ...c, active_strategy_id: newValue } : c));
    toast.success(isAlreadyActive ? "Estratégia desativada" : "Estratégia ativa definida — será usada ao gerar posts");
  }

  return (
    <PageContainer maxWidth="1000">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Estratégia de Mídia
        </h1>
        <p className="text-muted-foreground mt-1">
          IA especialista em social media gera estratégias completas com referências de mercado.
        </p>
      </div>

      {/* Client + Briefing Card */}
      <Card className="mb-6 border-border">
        <CardContent className="pt-6 space-y-4">
          {/* Client Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Escolha um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Briefing Preview */}
          {selectedClient && !hasBriefing && (
            <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Briefing incompleto</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Preencha pelo menos <strong>nicho</strong>, <strong>público-alvo</strong> e <strong>tom de voz</strong> no cadastro do cliente.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate(`/clientes/${encodeURIComponent(selectedClient.name)}`)}
                >
                  Completar briefing
                </Button>
              </div>
            </div>
          )}

          {selectedClient && hasBriefing && (
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Briefing</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
                {selectedClient.niche && (
                  <p><span className="mr-1.5">💼</span>{selectedClient.niche}</p>
                )}
                {selectedClient.products_services && (
                  <p><span className="mr-1.5">🏷️</span>Ticket: {selectedClient.products_services}</p>
                )}
                {selectedClient.target_audience && (
                  <p><span className="mr-1.5">👥</span>{selectedClient.target_audience}</p>
                )}
                {selectedClient.posting_frequency && (
                  <p><span className="mr-1.5">📅</span>{selectedClient.posting_frequency}</p>
                )}
                {selectedClient.differentials && (
                  <p><span className="mr-1.5">✨</span>{selectedClient.differentials}</p>
                )}
                {selectedClient.objective && (
                  <p><span className="mr-1.5">🎯</span>{selectedClient.objective}</p>
                )}
                {selectedClient.tone_of_voice && (
                  <p><span className="mr-1.5">🗣️</span>{selectedClient.tone_of_voice}</p>
                )}
                {selectedClient.brand_values && (
                  <p><span className="mr-1.5">💎</span>{selectedClient.brand_values}</p>
                )}
                {selectedClient.current_social_presence && (
                  <p><span className="mr-1.5">📱</span>{selectedClient.current_social_presence}</p>
                )}
                {selectedClient.competitors?.length ? (
                  <p><span className="mr-1.5">⚔️</span>{selectedClient.competitors.join(", ")}</p>
                ) : null}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!selectedClient || generating}
            className="gap-2"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Gerando estratégia...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Estratégia
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Streaming Content */}
      {generating && streamContent && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-semibold text-foreground">Gerando estratégia...</span>
          </div>
          <StrategyContent content={streamContent} isStreaming={generating} />
        </div>
      )}

      {/* Generated Content — Slide Viewer */}
      {!generating && streamContent && selectedClient && (
        <div className="mb-6">
          <StrategySlideViewer
            content={streamContent}
            clientName={selectedClient.name}
            onClose={() => setStreamContent("")}
          />
          <StrategyDebateChat strategyContent={streamContent} clientName={selectedClient.name} />
        </div>
      )}

      {/* Saved Strategies */}
      {selectedClientId && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Estratégias salvas
          </h2>
          {loadingStrategies ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : strategies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma estratégia salva para este cliente.</p>
          ) : (
            <div className="space-y-3">
              {strategies.map((s) => {
                const isActive = selectedClient?.active_strategy_id === s.id;
                return (
                <Card key={s.id} className={`overflow-hidden ${isActive ? "border-primary ring-1 ring-primary/40" : "border-border"}`}>
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          {isActive && (
                            <Badge variant="default" className="gap-1 shrink-0">
                              <Star className="h-3 w-3 fill-current" />
                              Ativa
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => { e.stopPropagation(); handleSetActive(s.id); }}
                        title={isActive ? "Desativar" : "Definir como estratégia ativa (usada ao gerar posts)"}
                      >
                        <Star className={`h-3.5 w-3.5 ${isActive ? "fill-current" : ""}`} />
                        {isActive ? "Ativa" : "Definir ativa"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedId === s.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedId === s.id && (
                    <CardContent className="border-t pt-4">
                      <StrategySlideViewer
                        content={s.content}
                        clientName={selectedClient?.name || ""}
                        date={new Date(s.created_at).toLocaleDateString("pt-BR")}
                      />
                      <StrategyDebateChat strategyContent={s.content} clientName={selectedClient?.name || ""} />
                    </CardContent>
                  )}
                </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
