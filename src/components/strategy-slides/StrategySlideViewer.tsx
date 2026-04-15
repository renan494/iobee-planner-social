import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ArrowLeft, ArrowRight, Maximize, Minimize, ChevronLeft, Presentation, X,
  Search, Swords, Target, BookOpen, BarChart3, Lightbulb, TrendingUp, CalendarClock,
  FileText, Shield, Star, Megaphone, Users, Eye, Palette
} from "lucide-react";

import SlideCover from "./SlideCover";
import SlideSection from "./SlideSection";
import SlideSwot from "./SlideSwot";
import SlideTimeline from "./SlideTimeline";
import SlideKpis from "./SlideKpis";

/* ═══════════════════════════════════════════════════════
   SECTION PARSER (reused from StrategyContent)
   ═══════════════════════════════════════════════════════ */

type Section = { title: string; content: string; number?: string };

function parseToSections(markdown: string): { intro: string; sections: Section[] } {
  const lines = markdown.split("\n");
  let intro = "";
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(?:#{2}\s+)?(?:(\d+)\.\s*)?(.+)/);
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
   SWOT DETECTOR
   ═══════════════════════════════════════════════════════ */

function detectSwot(content: string): { isSwot: boolean; quadrants: { label: string; items: string[] }[] } {
  const lower = content.toLowerCase();
  const hasAll = ["forças", "fraquezas", "oportunidades", "ameaças"].every(k => lower.includes(k));
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

/* ═══════════════════════════════════════════════════════
   TIMELINE DETECTOR
   ═══════════════════════════════════════════════════════ */

function detectTimeline(title: string, content: string): { isTimeline: boolean; steps: { label: string; items: string[] }[] } {
  const lower = title.toLowerCase();
  const isTimelineSection = ["cronograma", "implementação", "roadmap", "timeline", "fases"].some(k => lower.includes(k));
  if (!isTimelineSection) return { isTimeline: false, steps: [] };

  const steps: { label: string; items: string[] }[] = [];
  let current: { label: string; items: string[] } | null = null;

  for (const line of content.split("\n")) {
    const h3Match = line.match(/^###\s+(.+)/);
    const boldMatch = line.match(/^\s*\*\*(.{5,})\*\*\s*$/);
    const topBulletBold = line.match(/^[\-*•]\s+\*\*(.{5,}?)\*\*:?\s*(.*)/);
    const inlineBoldMatch = !topBulletBold && line.match(/^\s*\*\*(.{5,}?)\*\*:?\s*(.*)/);

    if (h3Match || boldMatch || topBulletBold || inlineBoldMatch) {
      if (current) steps.push(current);
      const raw = h3Match?.[1] || boldMatch?.[1] || topBulletBold?.[1] || inlineBoldMatch?.[1] || "";
      const label = raw.replace(/\*+/g, "").replace(/:$/, "").trim();
      current = { label, items: [] };
      const trailing = (topBulletBold?.[2] || inlineBoldMatch?.[2] || "").trim();
      if (trailing) current.items.push(trailing);
    } else if (current) {
      const item = line.replace(/^[\s\-*•]+/, "").trim();
      if (item && !item.startsWith("|") && !item.startsWith("---")) {
        current.items.push(item);
      }
    }
  }
  if (current) steps.push(current);
  return { isTimeline: steps.length >= 2, steps };
}

/* ═══════════════════════════════════════════════════════
   SECTION STYLING
   ═══════════════════════════════════════════════════════ */

type SectionMeta = { icon: React.ReactNode; accentColor: string; label: string };

const sectionMap: Record<string, SectionMeta> = {
  "diagnóstico":       { icon: <Search />, accentColor: "#2563eb", label: "Diagnóstico" },
  "análise":           { icon: <Search />, accentColor: "#2563eb", label: "Análise" },
  "cenário":           { icon: <Eye />, accentColor: "#2563eb", label: "Cenário" },
  "concorrência":      { icon: <Swords />, accentColor: "#dc2626", label: "Concorrência" },
  "competitiv":        { icon: <Swords />, accentColor: "#dc2626", label: "Competitivo" },
  "swot":              { icon: <Shield />, accentColor: "#9333ea", label: "SWOT" },
  "posicionamento":    { icon: <Target />, accentColor: "#FDB600", label: "Posicionamento" },
  "linha editorial":   { icon: <BookOpen />, accentColor: "#4f46e5", label: "Editorial" },
  "editorial":         { icon: <BookOpen />, accentColor: "#4f46e5", label: "Editorial" },
  "plano de conteúdo": { icon: <BarChart3 />, accentColor: "#16a34a", label: "Conteúdo" },
  "conteúdo":          { icon: <BarChart3 />, accentColor: "#16a34a", label: "Conteúdo" },
  "quantitativo":      { icon: <BarChart3 />, accentColor: "#16a34a", label: "Quantitativo" },
  "sugestões":         { icon: <Lightbulb />, accentColor: "#d97706", label: "Sugestões" },
  "post":              { icon: <Lightbulb />, accentColor: "#d97706", label: "Posts" },
  "kpi":               { icon: <TrendingUp />, accentColor: "#16a34a", label: "KPIs" },
  "métrica":           { icon: <TrendingUp />, accentColor: "#16a34a", label: "Métricas" },
  "cronograma":        { icon: <CalendarClock />, accentColor: "#0ea5e9", label: "Cronograma" },
  "implementação":     { icon: <CalendarClock />, accentColor: "#0ea5e9", label: "Implementação" },
  "funil":             { icon: <ArrowRight />, accentColor: "#7c3aed", label: "Funil" },
  "jornada":           { icon: <Users />, accentColor: "#7c3aed", label: "Jornada" },
  "campanha":          { icon: <Megaphone />, accentColor: "#ea580c", label: "Campanhas" },
  "bio":               { icon: <Star />, accentColor: "#FDB600", label: "Bio" },
  "instagram":         { icon: <Star />, accentColor: "#ec4899", label: "Instagram" },
  "visual":            { icon: <Palette />, accentColor: "#ec4899", label: "Visual" },
};

function getMeta(title: string): SectionMeta {
  const lower = title.toLowerCase();
  for (const [key, val] of Object.entries(sectionMap)) {
    if (lower.includes(key)) return val;
  }
  return { icon: <FileText />, accentColor: "#6b7280", label: "Seção" };
}

/* ═══════════════════════════════════════════════════════
   SLIDE VIEWER
   ═══════════════════════════════════════════════════════ */

interface StrategySlideViewerProps {
  content: string;
  clientName: string;
  date?: string;
  onClose?: () => void;
}

type SlideItem = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

export default function StrategySlideViewer({ content, clientName, date, onClose }: StrategySlideViewerProps) {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const slides = useMemo<SlideItem[]>(() => {
    const { intro, sections } = parseToSections(content);
    const totalSlides = sections.length + 1; // +1 for cover
    const result: SlideItem[] = [];

    // Cover slide
    result.push({
      id: "cover",
      label: "Capa",
      render: () => <SlideCover clientName={clientName} date={date || new Date().toLocaleDateString("pt-BR")} />,
    });

    // Section slides
    sections.forEach((section, i) => {
      const meta = getMeta(section.title);
      const slideNum = i + 2;

      // SWOT?
      const swot = detectSwot(section.content);
      if (swot.isSwot) {
        result.push({
          id: `section-${i}`,
          label: meta.label,
          render: () => <SlideSwot quadrants={swot.quadrants} slideNumber={slideNum} totalSlides={totalSlides} />,
        });
        return;
      }

      // Timeline?
      const timeline = detectTimeline(section.title, section.content);
      if (timeline.isTimeline) {
        result.push({
          id: `section-${i}`,
          label: meta.label,
          render: () => <SlideTimeline steps={timeline.steps} slideNumber={slideNum} totalSlides={totalSlides} />,
        });
        return;
      }

      // KPI section?
      const lower = section.title.toLowerCase();
      if (lower.includes("kpi") || lower.includes("métrica") || lower.includes("benchmark")) {
        result.push({
          id: `section-${i}`,
          label: meta.label,
          render: () => <SlideKpis content={section.content} slideNumber={slideNum} totalSlides={totalSlides} />,
        });
        return;
      }

      // Generic section
      result.push({
        id: `section-${i}`,
        label: meta.label,
        render: () => (
          <SlideSection
            number={section.number || String(i + 1)}
            title={section.title}
            content={section.content}
            accentColor={meta.accentColor}
            icon={meta.icon}
            slideNumber={slideNum}
            totalSlides={totalSlides}
          />
        ),
      });
    });

    return result;
  }, [content, clientName, date]);

  const goNext = useCallback(() => setCurrent(c => Math.min(c + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") {
        if (isFullscreen) document.exitFullscreen?.();
        else onClose?.();
      }
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, isFullscreen, onClose]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!isFullscreen) { setShowControls(true); return; }
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowControls(false), 2500);
    };
    resetTimer();
    window.addEventListener("mousemove", resetTimer);
    return () => {
      window.removeEventListener("mousemove", resetTimer);
      clearTimeout(hideTimer.current);
    };
  }, [isFullscreen, current]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  useEffect(() => {
    const calc = () => {
      if (!wrapperRef.current) return;
      const { clientWidth, clientHeight } = wrapperRef.current;
      setScale(Math.min(clientWidth / 1920, clientHeight / 1080));
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [isFullscreen]);

  return (
    <div ref={containerRef} className={`flex flex-col bg-[#1a1a1a] ${isFullscreen ? "fixed inset-0 z-[9999]" : "h-[80vh] min-h-[500px] max-h-[900px] rounded-2xl overflow-hidden border border-border shadow-2xl"}`}>
      {/* Top bar */}
      <div className={`flex items-center justify-between px-4 h-12 bg-[#222] border-b border-white/10 shrink-0 transition-opacity duration-300 ${isFullscreen && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Presentation size={14} className="text-[#FDB600]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Estratégia</span>
          </div>
          <span className="text-[11px] text-white/30 ml-2 tabular-nums">{current + 1} / {slides.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleFullscreen} className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition" title={isFullscreen ? "Sair (F)" : "Fullscreen (F)"}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          {onClose && !isFullscreen && (
            <button onClick={onClose} className="text-white/50 hover:text-white p-2 rounded-lg hover:bg-white/10 transition">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">
        {/* Thumbnail sidebar */}
        {!isFullscreen && (
          <div className="w-48 bg-[#222] border-r border-white/10 overflow-y-auto shrink-0 py-3 px-2 space-y-1">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setCurrent(i)}
                className={`w-full rounded-lg overflow-hidden border-2 transition-all ${
                  i === current
                    ? "border-[#FDB600] shadow-md shadow-[#FDB600]/10"
                    : "border-transparent hover:border-white/20"
                }`}
              >
                <div className={`aspect-video flex items-center justify-center px-2 ${
                  i === current ? "bg-[#FDB600]/10" : "bg-white/5"
                }`}>
                  <span className={`text-[10px] font-semibold leading-tight text-center ${
                    i === current ? "text-[#FDB600]" : "text-white/40"
                  }`}>
                    {slide.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Slide canvas */}
        <div ref={wrapperRef} className="flex-1 relative overflow-hidden bg-[#111]">
          {slides.length > 0 && (
            <div
              style={{
                width: 1920,
                height: 1080,
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -960,
                marginTop: -540,
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
              className="rounded-xl overflow-hidden shadow-2xl"
            >
              {slides[current]?.render()}
            </div>
          )}

          {/* Nav arrows */}
          <div className={`absolute inset-0 flex items-center justify-between px-4 pointer-events-none transition-opacity duration-300 ${isFullscreen && !showControls ? "opacity-0" : "opacity-100"}`}>
            <button
              onClick={goPrev}
              disabled={current === 0}
              className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 disabled:opacity-20 disabled:pointer-events-none transition"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              onClick={goNext}
              disabled={current === slides.length - 1}
              className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 border border-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 disabled:opacity-20 disabled:pointer-events-none transition"
            >
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Progress dots */}
          <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-3 py-2 transition-opacity duration-300 ${isFullscreen && !showControls ? "opacity-0" : "opacity-100"}`}>
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${
                  i === current ? "w-7 h-2 bg-[#FDB600]" : "w-2 h-2 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
