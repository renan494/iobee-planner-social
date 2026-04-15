import SlideLayout from "./SlideLayout";
import SlideFooter from "./SlideFooter";
import { TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SlideKpisProps {
  content: string;
  slideNumber: number;
  totalSlides: number;
}

let thColorIdx = 0;

const mdComponents = {
  table: ({ children, ...props }: any) => {
    thColorIdx = 0;
    return (
      <div className="overflow-hidden rounded-2xl border-2 border-[#e8e4dd] shadow-lg">
        <table className="w-full text-[17px] border-collapse" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: ({ children, ...props }: any) => {
    const colors = ["bg-blue-600 text-white", "bg-emerald-600 text-white", "bg-amber-600 text-white", "bg-purple-600 text-white"];
    const cls = colors[thColorIdx % colors.length];
    thColorIdx++;
    return (
      <th className={`px-6 py-4 text-left text-[15px] font-bold uppercase tracking-wider ${cls} border-r border-white/20 last:border-r-0`} {...props}>
        {children}
      </th>
    );
  },
  td: ({ children, ...props }: any) => (
    <td className="px-6 py-5 text-[16px] text-[#555] border-t border-[#e8e4dd] border-r border-[#e8e4dd]/50 last:border-r-0 leading-relaxed align-top" {...props}>
      {children}
    </td>
  ),
  tr: ({ children, ...props }: any) => (
    <tr className="even:bg-[#f5f3ee]/50" {...props}>{children}</tr>
  ),
  p: ({ children, ...props }: any) => (
    <p className="text-[18px] text-[#555] leading-[1.7] my-3" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-[#1a1a1a]" {...props}>{children}</strong>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-[22px] font-black text-[#1a1a1a] mt-6 mb-3" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }: any) => (
    <ul className="my-4 space-y-2 list-none pl-0" {...props}>{children}</ul>
  ),
  li: ({ children, ...props }: any) => (
    <li className="flex items-start gap-3 text-[17px] text-[#555] leading-[1.6]" {...props}>
      <span className="shrink-0 mt-2.5 h-2 w-2 rounded-full bg-emerald-500" />
      <span className="flex-1">{children}</span>
    </li>
  ),
};

function cleanContent(text: string): string {
  return text.replace(/<br\s*\/?>/gi, "\n\n").replace(/\|\s*\|/g, "|\n|");
}

const SlideKpis = ({ content, slideNumber, totalSlides }: SlideKpisProps) => (
  <SlideLayout className="bg-[#f5f3ee]">
    <div className="h-full flex flex-col px-24 py-20 relative">
      <div className="flex items-center gap-5 mb-2">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <span className="text-[14px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1 block">MÉTRICAS</span>
          <h1 className="text-[48px] font-light leading-none tracking-tight">
            KPIs E <span className="font-black">BENCHMARKS</span>
          </h1>
        </div>
      </div>
      <div className="w-20 h-1 bg-emerald-600 rounded-full mb-8" />

      <div className="flex-1 overflow-hidden">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {cleanContent(content.trim())}
        </ReactMarkdown>
      </div>

      <SlideFooter slideNumber={slideNumber} totalSlides={totalSlides} />
    </div>
  </SlideLayout>
);

export default SlideKpis;
