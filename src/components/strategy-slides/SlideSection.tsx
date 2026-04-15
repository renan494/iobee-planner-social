import SlideLayout from "./SlideLayout";
import SlideFooter from "./SlideFooter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import React from "react";
import symbolPink from "@/assets/symbol-pink.svg";

interface SlideSectionProps {
  number: string;
  title: string;
  content: string;
  accentColor: string;
  icon: React.ReactNode;
  slideNumber: number;
  totalSlides: number;
}

function cleanContent(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/\|\s*\|/g, "|\n|");
}

let thColorIdx = 0;

const mdComponents = {
  table: ({ children, ...props }: any) => {
    thColorIdx = 0;
    return (
      <div className="my-6 overflow-hidden rounded-2xl border border-[#e0ddd6]">
        <table className="w-full text-[16px] border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: ({ children, ...props }: any) => {
    const colors = ["bg-[#E81F76] text-white", "bg-[#FDB600] text-white", "bg-[#333] text-white", "bg-[#E81F76]/80 text-white"];
    const cls = colors[thColorIdx % colors.length];
    thColorIdx++;
    return (
      <th className={`px-5 py-3 text-left text-[14px] font-bold uppercase tracking-wider ${cls} border-r border-white/20 last:border-r-0`} {...props}>
        {children}
      </th>
    );
  },
  td: ({ children, ...props }: any) => (
    <td className="px-5 py-4 text-[15px] text-[#555] border-t border-[#e8e4dd] border-r border-[#e8e4dd]/50 last:border-r-0 leading-relaxed align-top" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="even:bg-[#faf8f5]" {...props}>{children}</tr>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-[24px] font-black text-[#1a1a1a] mt-8 mb-4" {...props}>{children}</h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-[20px] font-bold text-[#333] mt-6 mb-3" {...props}>{children}</h4>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-[18px] text-[#555] leading-[1.7] my-3" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-2.5 list-none pl-0" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-3 text-[17px] text-[#555] leading-[1.6]" {...props}>
      <span className="shrink-0 mt-2.5 h-2 w-2 rounded-full bg-[#E81F76]" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-[#1a1a1a]" {...props}>{children}</strong>
  ),
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="my-6 border-l-4 border-[#E81F76] bg-[#E81F76]/5 px-6 py-4 rounded-r-xl" {...props}>
      <div className="text-[17px] font-medium text-[#444] italic">{children}</div>
    </blockquote>
  ),
};

const SlideSection = ({ number, title, content, accentColor, icon, slideNumber, totalSlides }: SlideSectionProps) => (
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
      <div className="w-20 h-1 rounded-full mb-8" style={{ backgroundColor: accentColor }} />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {cleanContent(content.trim())}
        </ReactMarkdown>
      </div>

      <SlideFooter slideNumber={slideNumber} totalSlides={totalSlides} />
    </div>
  </SlideLayout>
);

export default SlideSection;
