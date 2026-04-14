import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, Swords, Target, BookOpen, BarChart3, Lightbulb,
  Palette, TrendingUp, CalendarClock, FileText, CheckCircle2,
  Quote, AlertTriangle, Zap, Shield, Eye, Star,
  Megaphone, Users, ArrowRight, ChevronRight, ChevronDown,
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

const swotConfig: Record<string, { bg: string; headerBg: string; headerText: string; icon: React.ReactNode }> = {
  "Forças":         { bg: "bg-emerald-50/50",  headerBg: "bg-emerald-600", headerText: "text-white", icon: <CheckCircle2 className="h-4 w-4" /> },
  "Fraquezas":      { bg: "bg-red-50/50",      headerBg: "bg-red-600",     headerText: "text-white", icon: <AlertTriangle className="h-4 w-4" /> },
  "Oportunidades":  { bg: "bg-blue-50/50",     headerBg: "bg-blue-600",    headerText: "text-white", icon: <Lightbulb className="h-4 w-4" /> },
  "Ameaças":        { bg: "bg-amber-50/50",    headerBg: "bg-amber-600",   headerText: "text-white", icon: <AlertTriangle className="h-4 w-4" /> },
};

function SwotGrid({ quadrants, isMobile }: { quadrants: { label: string; items: string[] }[]; isMobile: boolean }) {
  // Ensure we always have 4 quadrants in correct order
  const orderedLabels = ["Forças", "Fraquezas", "Oportunidades", "Ameaças"];
  const ordered = orderedLabels.map(label => {
    const found = quadrants.find(q => q.label === label);
    return found || { label, items: [] };
  });

  if (isMobile) {
    return (
      <div className="space-y-0 border border-border rounded-xl overflow-hidden">
        {ordered.map((q) => {
          const cfg = swotConfig[q.label] || swotConfig["Forças"];
          return (
            <div key={q.label} className={`${cfg.bg} border-b border-border last:border-b-0`}>
              <div className={`flex items-center gap-2 px-4 py-2.5 ${cfg.headerBg} ${cfg.headerText}`}>
                {cfg.icon}
                <span className="font-bold text-sm">{q.label}</span>
              </div>
              <ul className="px-4 py-3 space-y-1.5">
                {q.items.map((item, i) => (
                  <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                    <span className="text-muted-foreground/50 mt-px">•</span>
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

  // Desktop: proper 2x2 matrix table
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-[140px_1fr_1fr] border-b border-border">
        <div className="bg-muted/60 border-r border-border" />
        <div className="bg-emerald-600 text-white px-4 py-2.5 text-center font-bold text-xs uppercase tracking-wider border-r border-emerald-700">
          Fatores Positivos
        </div>
        <div className="bg-red-600 text-white px-4 py-2.5 text-center font-bold text-xs uppercase tracking-wider">
          Fatores Negativos
        </div>
      </div>

      {/* Internal row */}
      <div className="grid grid-cols-[140px_1fr_1fr] border-b border-border">
        <div className="bg-blue-600 text-white px-3 py-3 flex items-center justify-center">
          <span className="font-bold text-xs uppercase tracking-wider text-center leading-tight">Ambiente<br/>Interno</span>
        </div>
        {/* Forças */}
        <div className={`${swotConfig["Forças"].bg} border-r border-border px-4 py-3`}>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span className="font-bold text-xs text-emerald-700 uppercase">Forças</span>
          </div>
          <ul className="space-y-1">
            {ordered[0].items.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                <span className="text-emerald-400 mt-px">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Fraquezas */}
        <div className={`${swotConfig["Fraquezas"].bg} px-4 py-3`}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
            <span className="font-bold text-xs text-red-700 uppercase">Fraquezas</span>
          </div>
          <ul className="space-y-1">
            {ordered[1].items.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                <span className="text-red-400 mt-px">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* External row */}
      <div className="grid grid-cols-[140px_1fr_1fr]">
        <div className="bg-purple-600 text-white px-3 py-3 flex items-center justify-center">
          <span className="font-bold text-xs uppercase tracking-wider text-center leading-tight">Ambiente<br/>Externo</span>
        </div>
        {/* Oportunidades */}
        <div className={`${swotConfig["Oportunidades"].bg} border-r border-border px-4 py-3`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-bold text-xs text-blue-700 uppercase">Oportunidades</span>
          </div>
          <ul className="space-y-1">
            {ordered[2].items.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                <span className="text-blue-400 mt-px">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Ameaças */}
        <div className={`${swotConfig["Ameaças"].bg} px-4 py-3`}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span className="font-bold text-xs text-amber-700 uppercase">Ameaças</span>
          </div>
          <ul className="space-y-1">
            {ordered[3].items.map((item, i) => (
              <li key={i} className="text-xs text-foreground/80 leading-relaxed flex items-start gap-1.5">
                <span className="text-amber-400 mt-px">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   KPI DETECTOR & STAT CARDS
   ═══════════════════════════════════════════════════════ */

function detectKpis(_content: string): { isKpi: boolean; kpis: { label: string; value: string }[] } {
  // Disabled — too aggressive on real AI content, causes oversized card rendering
  return { isKpi: false, kpis: [] };
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

function detectFunnel(_content: string): { isFunnel: boolean; stages: { label: string; detail: string }[] } {
  // Disabled — too aggressive on real AI content
  return { isFunnel: false, stages: [] };
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

const compactProseClasses =
  "prose prose-sm max-w-[720px] dark:prose-invert " +
  "prose-headings:text-foreground prose-headings:font-semibold " +
  "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-h3:pb-1.5 prose-h3:border-b prose-h3:border-border/30 " +
  "prose-h4:text-sm prose-h4:mt-3 prose-h4:mb-1.5 " +
  "prose-p:text-foreground/75 prose-p:leading-[1.6] prose-p:my-2 prose-p:text-sm " +
  "prose-strong:text-foreground prose-strong:font-semibold " +
  "prose-li:text-foreground/75 prose-li:my-1 prose-li:leading-[1.6] prose-li:text-sm " +
  "prose-ul:my-3 prose-ul:space-y-0.5 prose-ol:my-3 prose-ol:space-y-0.5 " +
  "prose-hr:my-4 prose-hr:border-border " +
  "prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:my-3 prose-blockquote:not-italic " +
  "prose-a:text-accent prose-a:underline-offset-2";

// Counter to color each th header differently
let thColorIndex = 0;

const markdownComponents = {
  table: ({ children, ...props }: any) => {
    thColorIndex = 0;
    return (
      <div className="my-6 overflow-x-auto rounded-xl border border-border shadow-sm [&_strong]:font-semibold [&_strong]:text-foreground [&_td_strong]:text-xs [&_td_strong]:font-semibold">
        <table className="w-full text-xs border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead: ({ children, ...props }: any) => (
    <thead {...props}>{children}</thead>
  ),
  th: ({ children, ...props }: any) => {
    const colors = [
      "bg-blue-600 text-white",
      "bg-emerald-600 text-white",
      "bg-amber-600 text-white",
      "bg-purple-600 text-white",
    ];
    const cls = colors[thColorIndex % colors.length];
    thColorIndex++;
    return (
      <th className={`px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider ${cls} border-r border-white/20 last:border-r-0`} {...props}>
        {children}
      </th>
    );
  },
  td: ({ children, ...props }: any) => (
    <td className="px-3 py-2.5 text-xs text-foreground/80 border-t border-border/30 border-r border-border/20 last:border-r-0 leading-relaxed align-top" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="hover:bg-muted/40 transition-colors duration-100 even:bg-muted/15" {...props}>{children}</tr>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-1.5 list-none pl-0" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-2 text-foreground/75 leading-[1.65] py-0.5 text-sm" {...props}>
      <span className="text-emerald-500 shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <span className="flex-1">{children}</span>
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
   COLLAPSIBLE SECTION COMPONENT
   ═══════════════════════════════════════════════════════ */

type ParsedSection = { number?: string; title: string; content: string };

function CollapsibleSection({
  section, index, style, isCollapsible, isMobile, animationDelay,
}: {
  section: ParsedSection;
  index: number;
  style: SectionStyle;
  isCollapsible: boolean;
  isMobile: boolean;
  animationDelay: number;
}) {
  const [open, setOpen] = useState(!isCollapsible);
  const { callouts, rest } = extractCallouts(section.content);
  const swot = detectSwot(section.content);
  const kpis = detectKpis(section.content);
  const funnel = detectFunnel(section.content);

  const preview = useMemo(() => {
    if (!isCollapsible) return "";
    const plain = rest.replace(/[#*_\->`|]/g, "").replace(/\n+/g, " ").trim();
    return plain.length > 100 ? plain.slice(0, 100) + "…" : plain;
  }, [rest, isCollapsible]);

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${animationDelay}ms` }}>
      {index > 0 && <div className="border-t border-border/60 my-1" />}

      <button
        type="button"
        onClick={() => isCollapsible && setOpen(!open)}
        className={`flex items-center gap-2.5 pt-5 pb-3 w-full text-left ${isCollapsible ? "cursor-pointer hover:opacity-80 transition-opacity" : "cursor-default"}`}
      >
        <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${style.accentBg} ${style.accent}`}>
          {React.cloneElement(style.icon as React.ReactElement, { className: "h-3.5 w-3.5" })}
        </div>
        <h3 className="text-sm font-bold text-foreground leading-tight flex-1">
          <span className="text-muted-foreground/50 mr-1">{section.number || index + 1}.</span>
          {section.title}
        </h3>
        {isCollapsible && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {isCollapsible && !open && preview && (
        <p className="text-xs text-muted-foreground/70 pb-3 pl-[38px] line-clamp-1">{preview}</p>
      )}

      {open && (
        <div>
          {callouts.length > 0 && (
            <div className="space-y-1.5 mb-3">
              {callouts.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 rounded-lg border-l-3 border-l-primary/40 bg-primary/5 px-3 py-2">
                  <Lightbulb className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-foreground/80 leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          )}

          {swot.isSwot && (
            <div className="mb-4">
              <SwotGrid quadrants={swot.quadrants} isMobile={isMobile} />
            </div>
          )}

          {kpis.isKpi && (
            <div className="mb-4">
              <KpiCards kpis={kpis.kpis} isMobile={isMobile} />
            </div>
          )}

          {funnel.isFunnel && (
            <div className="mb-4">
              <FunnelVisual stages={funnel.stages} />
            </div>
          )}

          <div className={`${compactProseClasses} pb-4`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {cleanContent(rest.trim())}
            </ReactMarkdown>
          </div>
        </div>
      )}
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
    <div className="space-y-0">
      {/* ── Executive Summary ── */}
      {intro && (
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-5 sm:p-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-2.5 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Resumo Executivo</h2>
          </div>
          <div className={compactProseClasses}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {cleanContent(intro)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* ── Sections ── */}
      {sections.map((section, i) => {
        const style = getStyle(section.title);
        const isCollapsible = i >= 3; // Sections 4+ are collapsible

        return (
          <CollapsibleSection
            key={i}
            section={section}
            index={i}
            style={style}
            isCollapsible={isCollapsible}
            isMobile={isMobile}
            animationDelay={i * 60}
          />
        );
      })}

      {/* ── Streaming indicator ── */}
      {isStreaming && (
        <div className="flex items-center justify-center gap-3 py-6 border-t border-border/40">
          <div className="flex gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Gerando mais conteúdo...</span>
        </div>
      )}
    </div>
  );
}
