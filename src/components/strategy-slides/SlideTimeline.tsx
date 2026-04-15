import SlideLayout from "./SlideLayout";
import SlideFooter from "./SlideFooter";
import { FileText, Target, TrendingUp, Star, Megaphone, BarChart3, Check } from "lucide-react";
import React from "react";

const phaseIcons = [
  { icon: FileText, color: "#2563eb" },
  { icon: Target, color: "#16a34a" },
  { icon: TrendingUp, color: "#9333ea" },
  { icon: Star, color: "#d97706" },
  { icon: Megaphone, color: "#ec4899" },
  { icon: BarChart3, color: "#6366f1" },
];

interface TimelineStep {
  label: string;
  items: string[];
}

interface SlideTimelineProps {
  steps: TimelineStep[];
  slideNumber: number;
  totalSlides: number;
}

const SlideTimeline = ({ steps, slideNumber, totalSlides }: SlideTimelineProps) => (
  <SlideLayout className="bg-[#f5f3ee]">
    <div className="h-full flex flex-col px-24 py-20 relative">
      <h1 className="text-[48px] font-light leading-none tracking-tight mb-2">
        CRONOGRAMA DE <span className="font-black">IMPLEMENTAÇÃO</span>
      </h1>
      <div className="w-20 h-1 bg-[#0ea5e9] rounded-full mb-6" />

      {/* Timeline */}
      <div className="flex-1 flex items-center relative">
        <div className="absolute top-[52px] left-[6%] right-[6%] h-[2px] bg-[#FDB600]/30" />

        <div className={`grid gap-4 w-full`} style={{ gridTemplateColumns: `repeat(${Math.min(steps.length, 6)}, 1fr)` }}>
          {steps.slice(0, 6).map((step, i) => {
            const phase = phaseIcons[i % phaseIcons.length];
            const Icon = phase.icon;
            const isLast = i === steps.length - 1;
            return (
              <div key={i} className="flex flex-col items-center text-center relative z-10">
                <div className="text-[13px] font-black tracking-widest mb-1" style={{ color: phase.color }}>
                  FASE {String(i + 1).padStart(2, "0")}
                </div>

                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-md"
                  style={{
                    backgroundColor: isLast ? phase.color : "white",
                    border: isLast ? "none" : `2.5px solid ${phase.color}`,
                    color: isLast ? "white" : phase.color,
                  }}
                >
                  <Icon size={22} strokeWidth={1.6} />
                </div>

                <div className="w-2.5 h-2.5 rotate-45 bg-[#FDB600] mb-3 border-2 border-[#f5f3ee]" />

                <h4 className="text-[15px] font-black uppercase tracking-wider leading-tight px-1 mb-3 text-[#333]">
                  {step.label}
                </h4>

                <div className="w-full flex flex-col items-center">
                  <div className="space-y-2">
                    {step.items.slice(0, 4).map((item, j) => (
                      <div key={j} className="flex items-center gap-2 justify-center">
                        <div className="w-4 h-4 rounded-full bg-[#FDB600]/10 flex items-center justify-center shrink-0">
                          <Check size={9} className="text-[#FDB600]" strokeWidth={3} />
                        </div>
                        <span className="text-[13px] text-[#666] leading-tight text-center line-clamp-2">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl bg-white border border-[#e8e4dd] px-8 py-3 mt-3">
        <p className="text-[14px] text-[#888] text-center leading-relaxed italic">
          Método estruturado com acompanhamento contínuo para máxima performance nas redes sociais.
        </p>
      </div>

      <SlideFooter slideNumber={slideNumber} totalSlides={totalSlides} />
    </div>
  </SlideLayout>
);

export default SlideTimeline;
