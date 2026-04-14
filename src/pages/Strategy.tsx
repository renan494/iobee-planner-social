import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, FileText, Clock, Trash2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

  // Check if briefing is filled
  const briefingFields = selectedClient
    ? [selectedClient.niche, selectedClient.target_audience, selectedClient.tone_of_voice, selectedClient.differentials, selectedClient.products_services].filter(Boolean)
    : [];
  const hasBriefing = briefingFields.length >= 3;

  useEffect(() => {
    loadClients();
  }, []);

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
        body: JSON.stringify({ client: selectedClient }),
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

      // Save strategy
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
      toast.success("Estratégia excluída");
    }
  }

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Criador de Estratégia
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere estratégias completas de redes sociais com IA especialista, incluindo análise de mercado, linha editorial e sugestões de conteúdo.
        </p>
      </div>

      {/* Client selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Selecione o cliente</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClient && !hasBriefing && (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-muted p-4">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Briefing incompleto</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Para gerar uma estratégia de qualidade, preencha pelo menos os campos de <strong>nicho</strong>, <strong>público-alvo</strong> e <strong>tom de voz</strong> no cadastro do cliente.
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
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Briefing do cliente</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClient.niche && <Badge variant="secondary">Nicho: {selectedClient.niche}</Badge>}
                  {selectedClient.target_audience && <Badge variant="secondary">Público: {selectedClient.target_audience}</Badge>}
                  {selectedClient.tone_of_voice && <Badge variant="secondary">Tom: {selectedClient.tone_of_voice}</Badge>}
                  {selectedClient.posting_frequency && <Badge variant="secondary">Freq: {selectedClient.posting_frequency}</Badge>}
                  {selectedClient.competitors?.length ? <Badge variant="outline">{selectedClient.competitors.length} concorrente(s)</Badge> : null}
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={!selectedClient || generating}
              className="w-full gap-2"
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
                  Gerar Estratégia com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Streaming content */}
      {(generating || streamContent) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {generating && <Loader2 className="h-4 w-4 animate-spin" />}
              {generating ? "Gerando estratégia..." : "Estratégia gerada"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
              <ReactMarkdown>{streamContent}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved strategies */}
      {selectedClientId && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5" />
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
              {strategies.map((s) => (
                <Card key={s.id} className="overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
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
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
                        <ReactMarkdown>{s.content}</ReactMarkdown>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
