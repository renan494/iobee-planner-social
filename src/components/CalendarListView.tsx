import { useMemo, useRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { FixedSizeList as List } from "react-window";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post, type PostFormat } from "@/data/posts";
import { PostBadge } from "@/components/PostBadge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarListViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

const ROW_HEIGHT = 56;
const HEADER_COLS = "grid grid-cols-[110px_140px_1fr_1.2fr_110px_110px_1fr_120px_48px] gap-3 items-center px-4";

export function CalendarListView({ posts, onPostClick }: CalendarListViewProps) {
  const sorted = useMemo(() => [...posts].sort((a, b) => a.date.localeCompare(b.date)), [posts]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const top = el.getBoundingClientRect().top;
      setHeight(Math.max(320, window.innerHeight - top - 120));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const post = sorted[index];
    return (
      <div
        style={style}
        className={`${HEADER_COLS} group cursor-pointer border-b border-border hover:bg-[hsl(var(--primary)/0.08)] transition-colors text-sm`}
        onClick={() => onPostClick(post)}
      >
        <span className="whitespace-nowrap">{format(new Date(post.date + "T12:00:00"), "dd/MM/yyyy")}</span>
        <span className="font-medium truncate">{post.client}</span>
        <span className="font-medium truncate">{post.title}</span>
        <span className="text-muted-foreground truncate">{post.headline}</span>
        <span><PostBadge format={post.format as PostFormat} /></span>
        <span><Badge variant="outline">{FUNNEL_LABELS[post.funnelStage]}</Badge></span>
        <div className="flex flex-wrap gap-1 overflow-hidden">
          {(post.channels || []).length > 0 ? (
            (post.channels || []).slice(0, 3).map((ch) => (
              <span key={ch} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{ch}</span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground/50">—</span>
          )}
        </div>
        <span className="truncate">{post.analyst}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
          title="Visualizar post"
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className={`${HEADER_COLS} h-10 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground`}>
          <span>Data</span>
          <span>Cliente</span>
          <span>Título</span>
          <span>Headline</span>
          <span>Formato</span>
          <span>Funil</span>
          <span>Canais</span>
          <span>Analista</span>
          <span></span>
        </div>
        <div ref={containerRef}>
          {sorted.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">Nenhum post encontrado.</div>
          ) : (
            <List
              height={height}
              itemCount={sorted.length}
              itemSize={ROW_HEIGHT}
              width="100%"
              overscanCount={6}
            >
              {Row}
            </List>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
