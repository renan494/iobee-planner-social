import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileEdit, Trash2, Send, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePosts } from "@/contexts/PostsContext";
import { useActivity } from "@/contexts/ActivityContext";
import { toast } from "@/hooks/use-toast";
import { FORMAT_LABELS } from "@/data/posts";
import type { PostFormat, FunnelStage } from "@/data/posts";

interface Draft {
  id: string;
  client: string | null;
  analyst: string | null;
  title: string | null;
  headline: string | null;
  format: string;
  funnel_stage: string;
  date: string | null;
  hashtags: string[];
  legend: string | null;
  created_at: string;
  updated_at: string;
}

export default function Drafts() {
  const { addPost } = usePosts();
  const { logActivity } = useActivity();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = useCallback(async () => {
    const { data, error } = await supabase
      .from("drafts")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) setDrafts(data as Draft[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  const deleteDraft = async (id: string) => {
    await supabase.from("drafts").delete().eq("id", id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Rascunho excluído" });
  };

  const publishDraft = async (draft: Draft) => {
    if (!draft.client || !draft.analyst || !draft.date || !draft.title) {
      toast({ title: "Rascunho incompleto", description: "Preencha cliente, analista, data e título antes de publicar.", variant: "destructive" });
      navigate(`/criar?draft=${draft.id}`);
      return;
    }
    await addPost({
      client: draft.client,
      analyst: draft.analyst,
      title: draft.title,
      headline: draft.headline || draft.title,
      format: draft.format as PostFormat,
      funnelStage: draft.funnel_stage as FunnelStage,
      date: draft.date,
      hashtags: draft.hashtags || [],
      legend: draft.legend || undefined,
    });
    await logActivity({
      action: "post_created",
      description: `Post "${draft.title}" criado a partir de rascunho para ${draft.client}`,
      analyst: draft.analyst,
      client: draft.client,
    });
    await supabase.from("drafts").delete().eq("id", draft.id);
    setDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    toast({ title: "Post publicado!", description: `"${draft.title}" adicionado ao calendário.` });
  };

  const isComplete = (d: Draft) => !!(d.client && d.analyst && d.date && d.title);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <FileEdit className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rascunhos</h1>
          <p className="text-sm text-muted-foreground">Conteúdos salvos que ainda não foram publicados.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : drafts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <FileEdit className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Nenhum rascunho salvo.</p>
            <p className="text-xs text-muted-foreground">Ao criar conteúdo, clique em "Salvar Rascunho" para guardar aqui.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <Card key={draft.id} className="overflow-hidden">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">
                      {draft.title || <span className="italic text-muted-foreground">Sem título</span>}
                    </p>
                    {!isComplete(draft) && (
                      <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Incompleto</span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {draft.client && <span>{draft.client}</span>}
                    {draft.analyst && <span>• {draft.analyst}</span>}
                    <span>• {FORMAT_LABELS[draft.format as PostFormat] || draft.format}</span>
                    {draft.date && <span>• {format(new Date(draft.date + "T12:00:00"), "dd/MM/yyyy")}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/criar?draft=${draft.id}`)}>
                    <FileEdit className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="default" onClick={() => publishDraft(draft)} disabled={!isComplete(draft)}>
                    <Send className="mr-1 h-3.5 w-3.5" /> Publicar
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { if (confirm("Excluir este rascunho?")) deleteDraft(draft.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
