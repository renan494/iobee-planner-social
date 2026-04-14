import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search, Swords, Target, BookOpen, BarChart3, Lightbulb,
  Palette, TrendingUp, CalendarClock, FileText, CheckCircle2,
  ArrowRight, Quote, AlertTriangle, ThumbsUp, ThumbsDown, Zap,
  Instagram, Hash, Users, Megaphone
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── helpers ─── */

function cleanContent(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/\|\s*\|/g, "|\n|");
}

/* ─── section icon mapping ─── */

const sectionIcons: Record<string, { icon: React.ReactNode; accent: string }> = {
  "diagnóstico":        { icon: <Search className="h-5 w-5" />,        accent: "text-accent" },
  "análise de cenário": { icon: <Search className="h-5 w-5" />,        accent: "text-accent" },
  "concorrência":       { icon: <Swords className="h-5 w-5" />,        accent: "text-destructive" },
  "posicionamento":     { icon: <Target className="h-5 w-5" />,        accent: "text-primary" },
  "linha editorial":    { icon: <BookOpen className="h-5 w-5" />,      accent: "text-accent" },
  "plano de conteúdo":  { icon: <BarChart3 className="h-5 w-5" />,     accent: "text-emerald-600" },
  "quantitativo":       { icon: <BarChart3 className="h-5 w-5" />,     accent: "text-emerald-600" },
  "sugestões de posts": { icon: <Lightbulb className="h-5 w-5" />,     accent: "text-amber-500" },
  "diretrizes visuais": { icon: <Palette className="h-5 w-5" />,       accent: "text-purple-500" },
  "kpis":               { icon: <TrendingUp className="h-5 w-5" />,    accent: "text-emerald-600" },
  "métricas":           { icon: <TrendingUp className="h-5 w-5" />,    accent: "text-emerald-600" },
  "cronograma":         { icon: <CalendarClock className="h-5 w-5" />, accent: "text-accent" },
  "implementação":      { icon: <CalendarClock className="h-5 w-5" />, accent: "text-accent" },
};

const accentBgs: Record<string, string> = {
  "text-accent": "bg-accent/10 border-accent/20",
  "text-destructive": "bg-destructive/10 border-destructive/20",
  "text-primary": "bg-primary/10 border-primary/20",
  "text-emerald-600": "bg-emerald-50 border-emerald-200",
  "text-amber-500": "bg-amber-50 border-amber-200",
  "text-purple-500": "bg-purple-50 border-purple-200",
  "text-muted-foreground": "bg-muted/40 border-border",
};

function getIconForTitle(title: string): { icon: React.ReactNode; accent: string } {
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(sectionIcons)) {
    if (lower.includes(key)) return val;
  }
  return { icon: <FileText className="h-5 w-5" />, accent: "text-muted-foreground" };
}

/* ─── section parser ─── */

type Section = { title: string; content: string; number?: string };

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

/* ─── extract highlights from content ─── */

function extractHighlights(content: string): { highlights: string[]; rest: string } {
  const highlights: string[] = [];
  const restLines: string[] = [];

  for (const line of content.split("\n")) {
    // Match bold standalone statements that look like insights/callouts
    const boldMatch = line.match(/^\s*\*\*(.{15,})\*\*\s*$/);
    if (boldMatch && highlights.length < 3) {
      highlights.push(boldMatch[1]);
    } else {
      restLines.push(line);
    }
  }

  return { highlights, rest: restLines.join("\n") };
}

/* ─── prose classes ─── */

const proseClasses =
  "prose prose-sm max-w-none dark:prose-invert " +
  "prose-headings:text-foreground prose-headings:font-semibold " +
  "prose-h3:text-[15px] prose-h3:mt-6 prose-h3:mb-3 prose-h3:pb-2 prose-h3:border-b prose-h3:border-border/50 " +
  "prose-h4:text-sm prose-h4:mt-5 prose-h4:mb-2 " +
  "prose-p:text-muted-foreground prose-p:leading-[1.8] prose-p:my-3 " +
  "prose-strong:text-foreground prose-strong:font-semibold " +
  "prose-li:text-muted-foreground prose-li:my-1.5 prose-li:leading-[1.75] " +
  "prose-ul:my-4 prose-ul:space-y-1 prose-ol:my-4 prose-ol:space-y-1 " +
  "prose-hr:my-6 prose-hr:border-border " +
  "prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:my-5 prose-blockquote:not-italic " +
  "prose-a:text-accent prose-a:underline-offset-2";

/* ─── custom table component ─── */

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="my-5 overflow-x-auto rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted/60" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground border-b border-border" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3 text-sm text-muted-foreground border-b border-border/50 leading-relaxed" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-2 list-none pl-0" {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return child;
      })}
    </ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-2.5 text-muted-foreground leading-[1.75] pl-1" {...props}>
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="my-5 flex items-start gap-3 rounded-xl border-l-4 border-l-primary bg-primary/5 px-5 py-4 not-italic" {...props}>
      <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 text-sm text-foreground/80">{children}</div>
    </blockquote>
  ),
};

/* ─── highlight card ─── */

function HighlightCallout({ text, index }: { text: string; index: number }) {
  const icons = [
    <Zap className="h-4 w-4" />,
    <ArrowRight className="h-4 w-4" />,
    <Megaphone className="h-4 w-4" />,
  ];
  const colors = [
    "bg-primary/10 border-primary/30 text-primary",
    "bg-accent/10 border-accent/30 text-accent",
    "bg-emerald-50 border-emerald-300 text-emerald-700",
  ];

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${colors[index % 3]}`}>
      <div className="mt-0.5 shrink-0">{icons[index % 3]}</div>
      <p className="text-sm font-medium leading-relaxed">{text}</p>
    </div>
  );
}

/* ─── main component ─── */

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
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {cleanContent(content)}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intro / Executive Summary */}
      {intro && (
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/20">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-bold text-foreground">Resumo Executivo</h2>
          </div>
          <div className={proseClasses}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {cleanContent(intro)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Section Cards */}
      {sections.map((section, i) => {
        const { icon, accent } = getIconForTitle(section.title);
        const bgClass = accentBgs[accent] || accentBgs["text-muted-foreground"];
        const { highlights, rest } = extractHighlights(section.content);

        return (
          <Card
            key={i}
            className="overflow-hidden border-border/60 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl"
          >
            {/* Section Header */}
            <div className={`flex items-center gap-4 px-6 py-5 border-b border-border/40 ${bgClass}`}>
              <div className={`flex items-center justify-center h-11 w-11 rounded-xl bg-background border border-border shadow-sm shrink-0 ${accent}`}>
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                {section.number && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 block mb-0.5">
                    Seção {section.number}
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground leading-tight">
                  {section.title}
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <span className={`inline-block h-2 w-2 rounded-full ${accent.replace('text-', 'bg-')}`} />
              </div>
            </div>

            {/* Highlighted Insights */}
            {highlights.length > 0 && (
              <div className="px-6 pt-5 space-y-2.5">
                {highlights.map((h, idx) => (
                  <HighlightCallout key={idx} text={h} index={idx} />
                ))}
              </div>
            )}

            {/* Section Body */}
            <CardContent className="px-6 py-6 sm:px-8">
              <div className={proseClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanContent(rest.trim())}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="flex gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Gerando mais conteúdo...</span>
        </div>
      )}
    </div>
  );
}
