import SlideLayout from "./SlideLayout";
import SlideFooter from "./SlideFooter";
import { CheckCircle2, AlertTriangle, Lightbulb, Shield } from "lucide-react";
import React from "react";

interface SwotQuadrant {
  label: string;
  items: string[];
}

interface SlideSwotProps {
  quadrants: SwotQuadrant[];
  slideNumber: number;
  totalSlides: number;
}

const config: Record<string, { bg: string; headerBg: string; icon: React.ReactNode }> = {
  "Forças":        { bg: "#e6f7ee", headerBg: "#16a34a", icon: <CheckCircle2 className="h-6 w-6" /> },
  "Fraquezas":     { bg: "#fde8e8", headerBg: "#dc2626", icon: <AlertTriangle className="h-6 w-6" /> },
  "Oportunidades": { bg: "#e8f0fe", headerBg: "#2563eb", icon: <Lightbulb className="h-6 w-6" /> },
  "Ameaças":       { bg: "#fef3c7", headerBg: "#d97706", icon: <AlertTriangle className="h-6 w-6" /> },
};

const orderedLabels = ["Forças", "Fraquezas", "Oportunidades", "Ameaças"];

const SlideSwot = ({ quadrants, slideNumber, totalSlides }: SlideSwotProps) => {
  const ordered = orderedLabels.map(label => {
    const found = quadrants.find(q => q.label === label);
    return found || { label, items: [] };
  });

  return (
    <SlideLayout className="bg-[#f5f3ee]">
      <div className="h-full flex flex-col px-24 py-20 relative">
        <div className="flex items-center gap-5 mb-2">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Shield className="h-7 w-7 text-purple-600" />
          </div>
          <div>
            <span className="text-[14px] font-black text-purple-600 uppercase tracking-[0.2em] mb-1 block">ANÁLISE</span>
            <h1 className="text-[48px] font-light leading-none tracking-tight">
              MATRIZ <span className="font-black">SWOT</span>
            </h1>
          </div>
        </div>
        <div className="w-20 h-1 bg-purple-600 rounded-full mb-8" />

        {/* 2x2 Grid */}
        <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-5">
          {ordered.map((q) => {
            const cfg = config[q.label] || config["Forças"];
            return (
              <div key={q.label} className="rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: cfg.bg }}>
                <div className="flex items-center gap-3 px-8 py-4" style={{ backgroundColor: cfg.headerBg }}>
                  <div className="text-white">{cfg.icon}</div>
                  <span className="text-[20px] font-black text-white uppercase tracking-wider">{q.label}</span>
                </div>
                <div className="px-8 py-5 flex-1">
                  <ul className="space-y-3">
                    {q.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-[17px] text-[#444] leading-relaxed">
                        <span className="shrink-0 mt-2 h-2 w-2 rounded-full" style={{ backgroundColor: cfg.headerBg }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <SlideFooter slideNumber={slideNumber} totalSlides={totalSlides} />
      </div>
    </SlideLayout>
  );
};

export default SlideSwot;
