import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Swords, Target, BookOpen, BarChart3, Lightbulb,
  Palette, TrendingUp, CalendarClock, FileText
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function cleanContent(text: string): string {
  return text.replace(/<br\s*\/?>/gi, "\n\n").replace(/\|\s*\|/g, "|\n|");
}

const sectionIcons: Record<string, React.ReactNode> = {
  "diagnóstico": <Search className="h-5 w-5 text-primary" />,
  "análise de cenário": <Search className="h-5 w-5 text-primary" />,
  "concorrência": <Swords className="h-5 w-5 text-destructive" />,
  "posicionamento": <Target className="h-5 w-5 text-accent" />,
  "linha editorial": <BookOpen className="h-5 w-5 text-primary" />,
  "plano de conteúdo": <BarChart3 className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />,
  "quantitativo": <BarChart3 className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />,
  "sugestões de posts": <Lightbulb className="h-5 w-5 text-primary" />,
  "diretrizes visuais": <Palette className="h-5 w-5 text-accent" />,
  "kpis": <TrendingUp className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />,
  "métricas": <TrendingUp className="h-5 w-5" style={{ color: "hsl(var(--success))" }} />,
  "cronograma": <CalendarClock className="h-5 w-5 text-primary" />,
  "implementação": <CalendarClock className="h-5 w-5 text-primary" />,
};

function getIconForTitle(title: string): React.ReactNode {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(sectionIcons)) {
    if (lower.includes(key)) return icon;
  }
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

type Section = {
  title: string;
  content: string;
  number?: string;
};

function parseToSections(markdown: string): { intro: string; sections: Section[] } {
  const lines = markdown.split("\n");
  let intro = "";
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = line.match(/^##\s+(?:(\d+)\.\s*)?(.+)/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[2].trim(), content: "", number: match[1] || undefined };
    } else if (current) {
      current.content += line + "\n";
    } else {
      intro += line + "\n";
    }
  }
  if (current) sections.push(current);

  return { intro: intro.trim(), sections };
}

const proseClasses =
  "prose prose-sm max-w-none dark:prose-invert " +
  "prose-headings:text-foreground prose-headings:font-semibold " +
  "prose-h3:text-base prose-h3:mt-5 prose-h3:mb-2 " +
  "prose-h4:text-sm prose-h4:mt-4 prose-h4:mb-1.5 " +
  "prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:my-3 " +
  "prose-strong:text-foreground prose-strong:font-semibold " +
  "prose-li:text-muted-foreground prose-li:my-1 prose-li:leading-relaxed " +
  "prose-ul:my-3 prose-ul:space-y-1 prose-ol:my-3 prose-ol:space-y-1 " +
  "prose-table:text-sm prose-table:w-full prose-table:border-collapse prose-table:rounded-lg prose-table:overflow-hidden " +
  "prose-th:px-4 prose-th:py-2.5 prose-th:bg-muted/60 prose-th:text-foreground prose-th:font-semibold prose-th:text-left prose-th:border prose-th:border-border " +
  "prose-td:px-4 prose-td:py-2.5 prose-td:border prose-td:border-border prose-td:text-muted-foreground " +
  "prose-hr:my-5 prose-hr:border-border " +
  "prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg";

interface StrategyContentProps {
  content: string;
  isStreaming?: boolean;
}

export default function StrategyContent({ content, isStreaming }: StrategyContentProps) {
  const { intro, sections } = useMemo(() => parseToSections(content), [content]);

  if (!content.trim()) return null;

  // While streaming and no sections parsed yet, show raw content
  if (sections.length === 0) {
    return (
      <div className={proseClasses}>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Intro / Summary */}
      {intro && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className={proseClasses}>
            <ReactMarkdown>{intro}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Section Cards */}
      {sections.map((section, i) => (
        <Card
          key={i}
          className="overflow-hidden border-border shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-background border border-border shadow-sm shrink-0">
              {getIconForTitle(section.title)}
            </div>
            <div className="min-w-0">
              {section.number && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Seção {section.number}
                </span>
              )}
              <h3 className="text-sm font-bold text-foreground leading-tight">
                {section.title}
              </h3>
            </div>
          </div>

          {/* Section Body */}
          <CardContent className="p-5">
            <div className={proseClasses}>
              <ReactMarkdown>{section.content.trim()}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Gerando mais conteúdo...
        </div>
      )}
    </div>
  );
}
