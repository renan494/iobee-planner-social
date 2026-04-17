import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, ArrowRight } from "lucide-react";
import { FRAMEWORKS, type Framework, type FrameworkConfig } from "@/lib/copyFrameworks";
import { PageContainer } from "@/components/PageContainer";

export default function CopyHub() {
  const navigate = useNavigate();

  return (
    <PageContainer className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold text-foreground">Roteiros</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Crie copies persuasivas com cabeça de social media. Escolha o framework ou faça engenharia reversa de um criativo de referência.
        </p>
      </div>

      <Card className="p-5 border-2 border-primary/30 bg-primary/5">
        <h3 className="font-heading font-bold text-foreground text-base mb-2">
          🔥 O que importa de verdade (nível estratégico)
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Esquece um pouco framework. Copy boa no social = combinação de 3 coisas:
        </p>
        <div className="space-y-2">
          {[
            { n: "1.", t: "Hook que para o scroll", d: "Sem isso, ninguém lê o resto" },
            { n: "2.", t: "Voz da marca certa", d: "Se soar agência genérica, perde conexão" },
            { n: "3.", t: "CTA contextualizado", d: "Cada formato pede um CTA diferente — Reels não é Ads" },
          ].map((it) => (
            <div key={it.n} className="flex items-start gap-3">
              <span className="font-heading font-bold text-primary text-sm shrink-0">{it.n}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{it.t}</p>
                <p className="text-xs text-muted-foreground">{it.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.entries(FRAMEWORKS) as [Framework, FrameworkConfig][]).map(([key, fw]) => {
          const Icon = fw.icon;
          return (
            <button
              key={key}
              onClick={() => navigate(`/copy/${key}`)}
              className="text-left"
            >
              <Card className="p-4 cursor-pointer transition-all border-2 border-border hover:border-primary/40 hover:shadow-md bg-card h-full">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-heading font-bold text-foreground">{fw.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{fw.description}</p>
                <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">{fw.explanation}</p>
                <div className="flex flex-wrap gap-1">
                  {fw.works.map((w) => (
                    <Badge key={w} variant="secondary" className="text-[10px]">{w}</Badge>
                  ))}
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <button onClick={() => navigate("/copy/engenharia-reversa")} className="block w-full text-left">
        <Card className="p-4 cursor-pointer transition-all border-2 border-border hover:border-primary/40 hover:shadow-md bg-card group">
          <div className="flex items-center gap-2 mb-2">
            <Wand2 className="w-5 h-5 text-muted-foreground" />
            <span className="font-heading font-bold text-foreground">Engenharia Reversa de Copy</span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary ml-auto" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Cole a URL de um <strong className="text-foreground">post/reel do Instagram</strong>, anúncio da Meta Ad Library ou vídeo do YouTube. A IA extrai a estrutura e remonta com novo hook, roteiro e CTA — pronto pra postar.
          </p>
          <div className="flex flex-wrap gap-1 mt-3">
            <Badge variant="secondary" className="text-[10px]">Instagram (Post / Reel)</Badge>
            <Badge variant="secondary" className="text-[10px]">Meta Ad Library</Badge>
            <Badge variant="secondary" className="text-[10px]">YouTube</Badge>
            <Badge variant="secondary" className="text-[10px]">Transcrição manual</Badge>
          </div>
        </Card>
      </button>
    </PageContainer>
  );
}
