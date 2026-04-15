import SlideLayout from "./SlideLayout";
import SlideFooter from "./SlideFooter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";
import symbolPink from "@/assets/symbol-pink.svg";
import { CheckCircle2, Sparkles, ArrowRight, Star, Zap, Target, Lightbulb, TrendingUp, Heart, MessageCircle } from "lucide-react";

interface SlideSectionProps {
  number: string;
  title: string;
  content: string;
  accentColor: string;
  icon: React.ReactNode;
  slideNumber: number;
  totalSlides: number;
}

/* ═══════════════════════════════════════════
   CONTENT PARSER — converts markdown into
   structured blocks for card-based rendering
   ═══════════════════════════════════════════ */

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string; level: number }
  | { type: "bullets"; heading?: string; items: string[] }
  | { type: "table"; raw: string }
  | { type: "blockquote"; text: string };

function parseBlocks(content: string): Block[] {
  const lines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) { i++; continue; }

    // Table detection
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      let tableRaw = "";
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableRaw += lines[i] + "\n";
        i++;
      }
      blocks.push({ type: "table", raw: tableRaw.trim() });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      blocks.push({ type: "blockquote", text: trimmed.replace(/^>\s*/, "") });
      i++; continue;
    }

    // Heading (### or ####)
    const headingMatch = trimmed.match(/^(#{3,4})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].replace(/\*\*/g, "").trim();
      blocks.push({ type: "heading", text, level });
      i++; continue;
    }

    // Bullet list — collect consecutive bullet lines under optional heading
    if (/^[-*•]\s+/.test(trimmed)) {
      // Check if previous block is a heading — attach to it
      let heading: string | undefined;
      if (blocks.length > 0 && blocks[blocks.length - 1].type === "heading") {
        heading = (blocks.pop() as { type: "heading"; text: string }).text;
      }
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*•]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "bullets", heading, items });
      continue;
    }

    // Bold-line as standalone (e.g. **Topic:** description)
    if (/^\*\*[^*]+\*\*/.test(trimmed) && !trimmed.startsWith("|")) {
      // Check if next lines are bullets — if so, treat as heading+bullets
      if (i + 1 < lines.length && /^\s*[-*•]\s+/.test(lines[i + 1])) {
        const heading = trimmed.replace(/\*\*/g, "").replace(/:$/, "").trim();
        i++;
        const items: string[] = [];
        while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*•]\s+/, "").trim());
          i++;
        }
        blocks.push({ type: "bullets", heading, items });
        continue;
      }
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: trimmed });
    i++;
  }

  return blocks;
}

/* ═══════════════════════════════════════════
   CARD ICONS — rotate through for visual variety
   ═══════════════════════════════════════════ */

const cardIcons = [CheckCircle2, Star, Zap, Target, Lightbulb, TrendingUp, Heart, Sparkles, MessageCircle, ArrowRight];
const cardColors = ["#E81F76", "#FDB600", "#16a34a", "#2563eb", "#9333ea", "#ea580c"];

/* ═══════════════════════════════════════════
   TABLE MARKDOWN COMPONENTS
   ═══════════════════════════════════════════ */

let thColorIdx = 0;
const tableMdComponents = {
  table: ({ children, ...props }: any) => {
    thColorIdx = 0;
    return (
      <div className="overflow-hidden rounded-2xl border border-[#e0ddd6]">
        <table className="w-full text-[16px] border-collapse" {...props}>{children}</table>
      </div>
    );
  },
  th: ({ children, ...props }: any) => {
    const colors = ["bg-[#E81F76] text-white", "bg-[#FDB600] text-white", "bg-[#333] text-white", "bg-[#E81F76]/80 text-white"];
    const cls = colors[thColorIdx % colors.length];
    thColorIdx++;
    return <th className={`px-5 py-3 text-left text-[14px] font-bold uppercase tracking-wider ${cls} border-r border-white/20 last:border-r-0`} {...props}>{children}</th>;
  },
  td: ({ children, ...props }: any) => <td className="px-5 py-4 text-[15px] text-[#555] border-t border-[#e8e4dd] border-r border-[#e8e4dd]/50 last:border-r-0 leading-relaxed align-top" {...props}>{children}</td>,
  tr: ({ children, ...props }: any) => <tr className="even:bg-[#faf8f5]" {...props}>{children}</tr>,
  strong: ({ children, ...props }: any) => <strong className="font-bold text-[#1a1a1a]" {...props}>{children}</strong>,
};

/* ═══════════════════════════════════════════
   INLINE MARKDOWN FOR PARAGRAPHS
   ═══════════════════════════════════════════ */

function InlineMarkdown({ text }: { text: string }) {
  // Simple bold/italic handling
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="font-bold text-[#1a1a1a]">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/* ═══════════════════════════════════════════
   BLOCK RENDERERS
   ═══════════════════════════════════════════ */

function renderBlocks(blocks: Block[], accentColor: string) {
  let iconIdx = 0;
  let colorIdx = 0;

  return blocks.map((block, i) => {
    switch (block.type) {
      case "heading":
        return (
          <h3 key={i} className="text-[24px] font-black text-[#1a1a1a] mt-6 mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
              {React.createElement(cardIcons[(iconIdx++) % cardIcons.length], { size: 16, color: accentColor, strokeWidth: 2.5 })}
            </div>
            <InlineMarkdown text={block.text} />
          </h3>
        );

      case "paragraph":
        return (
          <p key={i} className="text-[17px] text-[#555] leading-[1.7] my-2">
            <InlineMarkdown text={block.text} />
          </p>
        );

      case "blockquote":
        return (
          <div key={i} className="my-4 border-l-4 border-[#E81F76] bg-[#E81F76]/5 px-6 py-4 rounded-r-xl">
            <p className="text-[17px] font-medium text-[#444] italic">
              <InlineMarkdown text={block.text} />
            </p>
          </div>
        );

      case "table":
        return (
          <div key={i} className="my-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={tableMdComponents}>
              {block.raw}
            </ReactMarkdown>
          </div>
        );

      case "bullets": {
        const hasHeading = !!block.heading;
        const itemCount = block.items.length;

        // If 2-4 items → render as card grid
        if (itemCount >= 2 && itemCount <= 4) {
          const cols = itemCount <= 2 ? 2 : itemCount === 3 ? 3 : 2;
          return (
            <div key={i} className="my-4">
              {hasHeading && (
                <h4 className="text-[20px] font-black text-[#1a1a1a] mb-3 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                    {React.createElement(cardIcons[(iconIdx++) % cardIcons.length], { size: 14, color: accentColor, strokeWidth: 2.5 })}
                  </div>
                  <InlineMarkdown text={block.heading!} />
                </h4>
              )}
              <div className={`grid grid-cols-${cols} gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {block.items.map((item, j) => {
                  const color = cardColors[(colorIdx + j) % cardColors.length];
                  const Icon = cardIcons[(iconIdx + j) % cardIcons.length];
                  return (
                    <div key={j} className="rounded-2xl border border-[#e8e4dd] bg-[#faf8f5] p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}12` }}>
                        <Icon size={18} color={color} strokeWidth={2} />
                      </div>
                      <p className="text-[16px] text-[#444] leading-relaxed flex-1">
                        <InlineMarkdown text={item} />
                      </p>
                    </div>
                  );
                })}
              </div>
              {(() => { colorIdx += itemCount; iconIdx += itemCount; return null; })()}
            </div>
          );
        }

        // 5+ items → render as compact list with icons
        return (
          <div key={i} className="my-4">
            {hasHeading && (
              <h4 className="text-[20px] font-black text-[#1a1a1a] mb-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                  {React.createElement(cardIcons[(iconIdx++) % cardIcons.length], { size: 14, color: accentColor, strokeWidth: 2.5 })}
                </div>
                <InlineMarkdown text={block.heading!} />
              </h4>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {block.items.map((item, j) => (
                <div key={j} className="flex items-start gap-3 py-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${accentColor}12` }}>
                    <CheckCircle2 size={12} color={accentColor} strokeWidth={2.5} />
                  </div>
                  <span className="text-[16px] text-[#555] leading-relaxed">
                    <InlineMarkdown text={item} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  });
}

/* ═══════════════════════════════════════════
   SLIDE SECTION COMPONENT
   ═══════════════════════════════════════════ */

const SlideSection = ({ number, title, content, accentColor, icon, slideNumber, totalSlides }: SlideSectionProps) => {
  const blocks = parseBlocks(content);

  return (
    <SlideLayout className="bg-white">
      <div className="h-full flex flex-col px-24 py-20 relative">
        {/* Decorative ring */}
        <img
          src={symbolPink}
          alt=""
          className="absolute -right-[200px] -bottom-[200px] w-[500px] h-[500px] opacity-[0.04]"
        />

        {/* Header */}
        <div className="flex items-center gap-5 mb-2">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}12` }}>
            <div style={{ color: accentColor }}>
              {React.cloneElement(icon as React.ReactElement, { className: "h-7 w-7" })}
            </div>
          </div>
          <div>
            <span className="text-[14px] font-black uppercase tracking-[0.2em] mb-1 block" style={{ color: accentColor }}>
              SEÇÃO {number}
            </span>
            <h1 className="text-[48px] font-light leading-none tracking-tight text-[#1a1a1a]">
              {title.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-black">{title.split(" ").slice(-1)[0]}</span>
            </h1>
          </div>
        </div>
        <div className="w-20 h-1 rounded-full mb-6" style={{ backgroundColor: accentColor }} />

        {/* Content — card-based */}
        <div className="flex-1 overflow-hidden">
          {renderBlocks(blocks, accentColor)}
        </div>

        <SlideFooter slideNumber={slideNumber} totalSlides={totalSlides} />
      </div>
    </SlideLayout>
  );
};

export default SlideSection;
