import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Sparkles, Zap, DollarSign, Award } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  AI_MODELS,
  AI_TASKS,
  AITaskKey,
  getAllAIModelChoices,
  resetAIModels,
  setAIModel,
} from "@/lib/aiModels";
import { toast } from "@/hooks/use-toast";

function Bar({ value, label, icon: Icon }: { value: number; label: string; icon: any }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <Icon className="h-3 w-3" />
      <span className="w-12">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function AIModelSettings() {
  const [choices, setChoices] = useState<Record<AITaskKey, string>>(() =>
    getAllAIModelChoices(),
  );

  useEffect(() => {
    const handler = () => setChoices(getAllAIModelChoices());
    window.addEventListener("ai-models-changed", handler);
    return () => window.removeEventListener("ai-models-changed", handler);
  }, []);

  function handleSelect(task: AITaskKey, modelId: string) {
    setAIModel(task, modelId);
    setChoices(getAllAIModelChoices());
    toast({ title: "Modelo atualizado", description: `${task}: ${modelId}` });
  }

  function handleReset() {
    resetAIModels();
    setChoices(getAllAIModelChoices());
    toast({ title: "Configurações resetadas para padrão (GPT-5.2)" });
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            to="/perfil"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Modelos de IA por tarefa
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha qual modelo usar em cada funcionalidade. Padrão: <strong>GPT-5.2</strong>.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Resetar tudo
        </Button>
      </div>

      <div className="space-y-6">
        {AI_TASKS.map((task) => {
          const current = choices[task.key];
          return (
            <div
              key={task.key}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  {task.label}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {task.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {AI_MODELS.map((m) => {
                  const selected = current === m.id;
                  const recommended = task.recommended === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(task.key, m.id)}
                      className={`text-left rounded-lg border p-3 transition-all ${
                        selected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {m.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {m.provider}
                          </div>
                        </div>
                        {recommended && (
                          <span className="text-[9px] uppercase tracking-wide font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            Sugerido
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug mb-2.5 line-clamp-2">
                        {m.description}
                      </p>
                      <div className="space-y-1">
                        <Bar value={m.quality} label="Qual." icon={Award} />
                        <Bar value={m.speed} label="Veloc." icon={Zap} />
                        <Bar value={6 - m.cost} label="Econ." icon={DollarSign} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground">
        💡 As escolhas ficam salvas neste navegador. Cada usuário/dispositivo tem suas próprias preferências.
      </div>
    </PageContainer>
  );
}
