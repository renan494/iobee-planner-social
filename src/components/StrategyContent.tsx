import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Swords, Target, BookOpen, BarChart3, Lightbulb,
  Palette, TrendingUp, CalendarClock, FileText, CheckCircle2,
  Quote, AlertTriangle, Zap, Shield, Eye, Star,
  Megaphone, Users, ArrowRight, ChevronRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsMobile } from "@/hooks/use-mobile";

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function cleanContent(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/\|\s*\|/g, "|\n|");
}

/* ═══════════════════════════════════════════════════════
   SECTION ICON + ACCENT MAPPING
   ═══════════════════════════════════════════════════════ */

type SectionStyle = {
  icon: React.ReactNode;
  accent: string;        // tailwind text color
  accentBg: string;      // card header bg
  borderAccent: string;  // left border color
};

const sectionStyles: Record<string, SectionStyle> = {
  "diagnóstico":        { icon: <Search className="h-5 w-5" />,        accent: "text-blue-600",    accentBg: "bg-blue-50",    borderAccent: "border-l-blue-500" },
  "análise":            { icon: <Search className="h-5 w-5" />,        accent: "text-blue-600",    accentBg: "bg-blue-50",    borderAccent: "border-l-blue-500" },
  "cenário":            { icon: <Eye className="h-5 w-5" />,           accent: "text-blue-600",    accentBg: "bg-blue-50",    borderAccent: "border-l-blue-500" },
  "concorrência":       { icon: <Swords className="h-5 w-5" />,        accent: "text-red-600",     accentBg: "bg-red-50",     borderAccent: "border-l-red-500" },
  "competitiv":         { icon: <Swords className="h-5 w-5" />,        accent: "text-red-600",     accentBg: "bg-red-50",     borderAccent: "border-l-red-500" },
  "swot":               { icon: <Shield className="h-5 w-5" />,        accent: "text-purple-600",  accentBg: "bg-purple-50",  borderAccent: "border-l-purple-500" },
  "posicionamento":     { icon: <Target className="h-5 w-5" />,        accent: "text-primary",     accentBg: "bg-primary/10", borderAccent: "border-l-primary" },
  "linha editorial":    { icon: <BookOpen className="h-5 w-5" />,      accent: "text-indigo-600",  accentBg: "bg-indigo-50",  borderAccent: "border-l-indigo-500" },
  "editorial":          { icon: <BookOpen className="h-5 w-5" />,      accent: "text-indigo-600",  accentBg: "bg-indigo-50",  borderAccent: "border-l-indigo-500" },
  "plano de conteúdo":  { icon: <BarChart3 className="h-5 w-5" />,     accent: "text-emerald-600", accentBg: "bg-emerald-50", borderAccent: "border-l-emerald-500" },
  "conteúdo":           { icon: <BarChart3 className="h-5 w-5" />,     accent: "text-emerald-600", accentBg: "bg-emerald-50", borderAccent: "border-l-emerald-500" },
  "quantitativo":       { icon: <BarChart3 className="h-5 w-5" />,     accent: "text-emerald-600", accentBg: "bg-emerald-50", borderAccent: "border-l-emerald-500" },
  "sugestões":          { icon: <Lightbulb className="h-5 w-5" />,     accent: "text-amber-600",   accentBg: "bg-amber-50",   borderAccent: "border-l-amber-500" },
  "post":               { icon: <Lightbulb className="h-5 w-5" />,     accent: "text-amber-600",   accentBg: "bg-amber-50",   borderAccent: "border-l-amber-500" },
  "diretrizes visuais": { icon: <Palette className="h-5 w-5" />,       accent: "text-pink-600",    accentBg: "bg-pink-50",    borderAccent: "border-l-pink-500" },
  "visual":             { icon: <Palette className="h-5 w-5" />,       accent: "text-pink-600",    accentBg: "bg-pink-50",    borderAccent: "border-l-pink-500" },
  "kpi":                { icon: <TrendingUp className="h-5 w-5" />,    accent: "text-emerald-600", accentBg: "bg-emerald-50", borderAccent: "border-l-emerald-500" },
  "métrica":            { icon: <TrendingUp className="h-5 w-5" />,    accent: "text-emerald-600", accentBg: "bg-emerald-50", borderAccent: "border-l-emerald-500" },
  "cronograma":         { icon: <CalendarClock className="h-5 w-5" />, accent: "text-sky-600",     accentBg: "bg-sky-50",     borderAccent: "border-l-sky-500" },
  "implementação":      { icon: <CalendarClock className="h-5 w-5" />, accent: "text-sky-600",     accentBg: "bg-sky-50",     borderAccent: "border-l-sky-500" },
  "funil":              { icon: <ArrowRight className="h-5 w-5" />,    accent: "text-violet-600",  accentBg: "bg-violet-50",  borderAccent: "border-l-violet-500" },
  "jornada":            { icon: <Users className="h-5 w-5" />,         accent: "text-violet-600",  accentBg: "bg-violet-50",  borderAccent: "border-l-violet-500" },
  "campanha":           { icon: <Megaphone className="h-5 w-5" />,     accent: "text-orange-600",  accentBg: "bg-orange-50",  borderAccent: "border-l-orange-500" },
  "bio":                { icon: <Star className="h-5 w-5" />,          accent: "text-primary",     accentBg: "bg-primary/10", borderAccent: "border-l-primary" },
  "instagram":          { icon: <Star className="h-5 w-5" />,          accent: "text-pink-600",    accentBg: "bg-pink-50",    borderAccent: "border-l-pink-500" },
};

function getStyle(title: string): SectionStyle {
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(sectionStyles)) {
    if (lower.includes(key)) return val;
  }
  return { icon: <FileText className="h-5 w-5" />, accent: "text-muted-foreground", accentBg: "bg-muted/40", borderAccent: "border-l-border" };
}

/* ═══════════════════════════════════════════════════════
   SECTION PARSER
   ═══════════════════════════════════════════════════════ */

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
      current = { title: match[2].trim(), content: "", number: match[1] || String(sections.length + 1) };
    } else if (current) {
      current.content += line + "\n";
    } else {
      intro += line + "\n";
    }
  }
  if (current) sections.push(current);
  return { intro: intro.trim(), sections };
}

/* ═══════════════════════════════════════════════════════
   SWOT DETECTOR & RENDERER
   ═══════════════════════════════════════════════════════ */

function detectSwot(content: string): { isSwot: boolean; quadrants: { label: string; items: string[] }[] } {
  const lower = content.toLowerCase();
  const hasAll = ["forças", "fraquezas", "oportunidades", "ameaças"].every(k => lower.includes(k)) ||
                 ["strengths", "weaknesses", "opportunities", "threats"].every(k => lower.includes(k));
  if (!hasAll) return { isSwot: false, quadrants: [] };

  const labels = [
    { key: /(?:forças|strengths)/i, label: "Forças" },
    { key: /(?:fraquezas|weaknesses)/i, label: "Fraquezas" },
    { key: /(?:oportunidades|opportunities)/i, label: "Oportunidades" },
    { key: /(?:ameaças|threats)/i, label: "Ameaças" },
  ];

  const lines = content.split("\n");
  const quadrants: { label: string; items: string[] }[] = [];
  let currentQ: { label: string; items: string[] } | null = null;

  for (const line of lines) {
    let matched = false;
    for (const { key, label } of labels) {
      if (key.test(line)) {
        if (currentQ) quadrants.push(currentQ);
        currentQ = { label, items: [] };
        matched = true;
        break;
      }
    }
    if (!matched && currentQ) {
      const item = line.replace(/^[\s\-*•]+/, "").trim();
      if (item) currentQ.items.push(item);
    }
  }
  if (currentQ) quadrants.push(currentQ);

  return { isSwot: quadrants.length >= 2, quadrants };
}

const swotConfig: Record<string, { bg: string; border: string; iconColor: string; icon: React.ReactNode }> = {
  "Forças":         { bg: "bg-emerald-50",  border: "border-emerald-300", iconColor: "text-emerald-600", icon: <CheckCircle2 className="h-5 w-5" /> },
  "Fraquezas":      { bg: "bg-red-50",      border: "border-red-300",     iconColor: "text-red-600",     icon: <AlertTriangle className="h-5 w-5" /> },
  "Oportunidades":  { bg: "bg-blue-50",     border: "border-blue-300",    iconColor: "text-blue-600",    icon: <Lightbulb className="h-5 w-5" /> },
  "Ameaças":        { bg: "bg-amber-50",    border: "border-amber-300",   iconColor: "text-amber-600",   icon: <AlertTriangle className="h-5 w-5" /> },
};

function SwotGrid({ quadrants, isMobile }: { quadrants: { label: string; items: string[] }[]; isMobile: boolean }) {
  return (
    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
      {quadrants.map((q) => {
        const cfg = swotConfig[q.label] || swotConfig["Forças"];
        return (
          <div key={q.label} className={`rounded-xl border-2 ${cfg.border} ${cfg.bg} p-5`}>
            <div className={`flex items-center gap-2 mb-3 ${cfg.iconColor}`}>
              {cfg.icon}
              <h4 className="font-bold text-base">{q.label}</h4>
            </div>
            <ul className="space-y-2">
              {q.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80 leading-relaxed">
                  <ChevronRight className={`h-4 w-4 shrink-0 mt-0.5 ${cfg.iconColor}`} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KPI DETECTOR & STAT CARDS
   ═══════════════════════════════════════════════════════ */

function detectKpis(content: string): { isKpi: boolean; kpis: { label: string; value: string }[] } {
  const lower = content.toLowerCase();
  if (!lower.includes("kpi") && !lower.includes("métrica") && !lower.includes("indicador") && !lower.includes("meta")) {
    return { isKpi: false, kpis: [] };
  }

  const kpis: { label: string; value: string }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    // Match patterns like "- **Engajamento**: 5%" or "- Taxa de cliques: >3%"
    const match = line.match(/^[\s\-*•]+\**([^*:]+)\**\s*[:–-]\s*(.+)/);
    if (match) {
      const label = match[1].trim();
      const value = match[2].replace(/\*+/g, "").trim();
      if (label.length > 2 && label.length < 60) {
        kpis.push({ label, value });
      }
    }
  }

  return { isKpi: kpis.length >= 2, kpis };
}

function KpiCards({ kpis, isMobile }: { kpis: { label: string; value: string }[]; isMobile: boolean }) {
  return (
    <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : kpis.length <= 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-3"}`}>
      {kpis.map((kpi, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1 hover:shadow-md transition-shadow duration-200">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</span>
          <span className="text-2xl font-bold text-foreground">{kpi.value}</span>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Meta</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FUNNEL DETECTOR & RENDERER
   ═══════════════════════════════════════════════════════ */

function detectFunnel(content: string): { isFunnel: boolean; stages: { label: string; detail: string }[] } {
  const lower = content.toLowerCase();
  const funnelKeywords = ["topo de funil", "meio de funil", "fundo de funil", "tofu", "mofu", "bofu", "atração", "consideração", "conversão", "descoberta", "reconhecimento"];
  const matchCount = funnelKeywords.filter(k => lower.includes(k)).length;
  if (matchCount < 2) return { isFunnel: false, stages: [] };

  const stages: { label: string; detail: string }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^[\s\-*•]+\**([^*:]+)\**\s*[:–-]\s*(.+)/);
    if (match) {
      stages.push({ label: match[1].replace(/\*+/g, "").trim(), detail: match[2].replace(/\*+/g, "").trim() });
    }
  }

  return { isFunnel: stages.length >= 2, stages };
}

const funnelColors = [
  "bg-violet-100 border-violet-400 text-violet-700",
  "bg-violet-200 border-violet-500 text-violet-800",
  "bg-violet-300 border-violet-600 text-violet-900",
  "bg-violet-400 border-violet-700 text-white",
  "bg-violet-500 border-violet-800 text-white",
];

function FunnelVisual({ stages }: { stages: { label: string; detail: string }[] }) {
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => {
        const widthPct = 100 - (i * (60 / Math.max(stages.length - 1, 1)));
        const color = funnelColors[Math.min(i, funnelColors.length - 1)];
        return (
          <div
            key={i}
            className="mx-auto animate-fade-in"
            style={{ width: `${widthPct}%`, animationDelay: `${i * 100}ms` }}
          >
            <div className={`rounded-lg border-l-4 px-4 py-3 ${color} flex items-center justify-between gap-3`}>
              <span className="font-semibold text-sm">{stage.label}</span>
              <span className="text-xs opacity-80 text-right flex-1 truncate">{stage.detail}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CALLOUT EXTRACTION
   ═══════════════════════════════════════════════════════ */

function extractCallouts(content: string): { callouts: string[]; rest: string } {
  const callouts: string[] = [];
  const restLines: string[] = [];

  for (const line of content.split("\n")) {
    const boldMatch = line.match(/^\s*\*\*(.{20,})\*\*\s*$/);
    if (boldMatch && callouts.length < 2) {
      callouts.push(boldMatch[1]);
    } else {
      restLines.push(line);
    }
  }

  return { callouts, rest: restLines.join("\n") };
}

function CalloutBox({ text, index }: { text: string; index: number }) {
  const styles = [
    { bg: "bg-blue-50", border: "border-l-blue-500", icon: <Lightbulb className="h-5 w-5 text-blue-600" /> },
    { bg: "bg-amber-50", border: "border-l-amber-500", icon: <Zap className="h-5 w-5 text-amber-600" /> },
  ];
  const s = styles[index % styles.length];

  return (
    <div className={`flex items-start gap-3 rounded-xl border-l-4 ${s.border} ${s.bg} px-5 py-4`}>
      <div className="shrink-0 mt-0.5">{s.icon}</div>
      <p className="text-sm font-medium text-foreground/90 leading-relaxed italic">{text}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MARKDOWN CUSTOM COMPONENTS
   ═══════════════════════════════════════════════════════ */

const proseClasses =
  "prose prose-sm max-w-[720px] dark:prose-invert " +
  "prose-headings:text-foreground prose-headings:font-semibold " +
  "prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-4 prose-h3:pb-2 prose-h3:border-b prose-h3:border-border/40 " +
  "prose-h4:text-base prose-h4:mt-6 prose-h4:mb-3 " +
  "prose-p:text-foreground/75 prose-p:leading-[1.7] prose-p:my-4 prose-p:text-[15px] " +
  "prose-strong:text-foreground prose-strong:font-semibold " +
  "prose-li:text-foreground/75 prose-li:my-2 prose-li:leading-[1.7] " +
  "prose-ul:my-5 prose-ul:space-y-1 prose-ol:my-5 prose-ol:space-y-1 " +
  "prose-hr:my-8 prose-hr:border-border " +
  "prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:my-6 prose-blockquote:not-italic " +
  "prose-a:text-accent prose-a:underline-offset-2";

const markdownComponents = {
  table: ({ children, ...props }: any) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-muted" {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-3.5 text-sm text-foreground/75 border-t border-border/40 leading-relaxed" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-muted/40 transition-colors duration-150" {...props}>{children}</tr>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-5 space-y-2.5 list-none pl-0" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-3 text-foreground/75 leading-[1.7] py-1 border-b border-border/20 last:border-0" {...props}>
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-1" />
      <span className="flex-1 text-[15px]">{children}</span>
    </li>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="my-6 flex items-start gap-3 rounded-xl border-l-4 border-l-primary bg-primary/5 px-5 py-4 not-italic" {...props}>
      <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 text-sm font-medium text-foreground/80">{children}</div>
    </blockquote>
  ),
};

/* ═══════════════════════════════════════════════════════
   SKELETON LOADING STATE
   ═══════════════════════════════════════════════════════ */

function StrategySkeleton() {
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-border p-8">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-2xl border border-border overflow-hidden">
          <div className="p-5 bg-muted/40 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div>
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
          </div>
          <div className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

interface StrategyContentProps {
  content: string;
  isStreaming?: boolean;
}

export default function StrategyContent({ content, isStreaming }: StrategyContentProps) {
  const { intro, sections } = useMemo(() => parseToSections(content), [content]);
  const isMobile = useIsMobile();

  if (!content.trim()) return null;

  // Streaming but no sections yet → show skeleton + raw content
  if (isStreaming && sections.length === 0) {
    return (
      <div className="space-y-8">
        <div className={`${proseClasses} animate-fade-in`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {cleanContent(content)}
          </ReactMarkdown>
        </div>
        <StrategySkeleton />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className={`${proseClasses} animate-fade-in`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {cleanContent(content)}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Executive Summary ── */}
      {intro && (
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.03] to-transparent p-6 sm:p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/15">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Visão Geral</p>
              <h2 className="text-xl font-bold text-foreground">Resumo Executivo</h2>
            </div>
          </div>
          <div className={proseClasses}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {cleanContent(intro)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── Section Cards ── */}
      {sections.map((section, i) => {
        const style = getStyle(section.title);
        const { callouts, rest } = extractCallouts(section.content);
        const swot = detectSwot(section.content);
        const kpis = detectKpis(section.content);
        const funnel = detectFunnel(section.content);

        // First 3 sections get full-size layout; 4+ get compact
        const isCompact = i >= 3;

        return (
          <Card
            key={i}
            className={`overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 ${style.borderAccent} animate-fade-in ${isCompact ? "rounded-xl" : "rounded-2xl"}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Section Header */}
            <div className={`flex items-center gap-3 ${style.accentBg} ${isCompact ? "px-4 py-3" : "px-6 py-5 gap-4"}`}>
              <div className={`flex items-center justify-center shrink-0 bg-background border border-border shadow-sm ${style.accent} ${isCompact ? "h-8 w-8 rounded-lg" : "h-11 w-11 rounded-xl"}`}>
                {React.cloneElement(style.icon as React.ReactElement, {
                  className: isCompact ? "h-4 w-4" : "h-5 w-5",
                })}
              </div>
              <div className="min-w-0 flex-1">
                {!isCompact && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70 block mb-0.5">
                    Seção {section.number || i + 1}
                  </span>
                )}
                <h3 className={`font-bold text-foreground leading-tight ${isCompact ? "text-sm" : "text-lg"}`}>
                  {isCompact && <span className="text-muted-foreground/60 mr-1.5">{section.number || i + 1}.</span>}
                  {section.title}
                </h3>
              </div>
            </div>

            <CardContent className={isCompact ? (isMobile ? "px-4 py-3" : "px-5 py-4") : (isMobile ? "px-4 py-5" : "px-8 py-7")}>
              {/* Callouts */}
              {callouts.length > 0 && (
                <div className={`space-y-2 ${isCompact ? "mb-3" : "mb-6"}`}>
                  {callouts.map((c, idx) => (
                    <CalloutBox key={idx} text={c} index={idx} />
                  ))}
                </div>
              )}

              {/* Special renderers */}
              {swot.isSwot && (
                <div className={isCompact ? "mb-3" : "mb-6"}>
                  <SwotGrid quadrants={swot.quadrants} isMobile={isMobile} />
                </div>
              )}

              {kpis.isKpi && (
                <div className={isCompact ? "mb-3" : "mb-6"}>
                  <KpiCards kpis={kpis.kpis} isMobile={isMobile} />
                </div>
              )}

              {funnel.isFunnel && (
                <div className={isCompact ? "mb-3" : "mb-6"}>
                  <FunnelVisual stages={funnel.stages} />
                </div>
              )}

              {/* Body content */}
              <div className={isCompact ? compactProseClasses : proseClasses}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanContent(rest.trim())}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Streaming indicator ── */}
      {isStreaming && (
        <div className="flex items-center justify-center gap-3 py-8">
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
