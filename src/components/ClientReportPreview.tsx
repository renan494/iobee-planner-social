import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Trash2, PenTool, Eye, Calendar as CalendarIcon, Filter } from "lucide-react";
import logoSvg from "@/assets/logo-iobee.svg";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { PostBadge } from "./PostBadge";
import { FUNNEL_LABELS, FORMAT_LABELS, type Post, type PostFormat } from "@/data/posts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { exportClientReportPdf } from "@/lib/exportClientReport";
import { toast } from "sonner";

interface ClientReportPreviewProps {
  clientName: string;
  posts: Post[];
  analysts: string[];
  byFormat: Record<PostFormat, number>;
  avatarUrl: string | null;
  onPostClick?: (post: Post) => void;
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => Promise<void>;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

export function ClientReportPreview({ clientName, posts, analysts, byFormat, avatarUrl, onPostClick, onEditPost, onDeletePost }: ClientReportPreviewProps) {
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isExporting, setIsExporting] = useState(false);

  const allSorted = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const sortedPosts = allSorted.filter((p) => {
    if (dateFrom && p.date < format(dateFrom, "yyyy-MM-dd")) return false;
    if (dateTo && p.date > format(dateTo, "yyyy-MM-dd")) return false;
    return true;
  });
  const hasFilters = dateFrom || dateTo;

  const handleDownloadPDF = async () => {
    try {
      setIsExporting(true);
      await exportClientReportPdf({
        clientName,
        posts: sortedPosts,
        filtersApplied: Boolean(hasFilters),
      });
    } catch {
      toast.error("Não foi possível gerar o PDF estável.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Preview do Relatório</h2>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <CalendarIcon className="h-4 w-4" />
                {dateFrom || dateTo
                  ? `${dateFrom ? format(dateFrom, "dd/MM/yy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yy") : "..."}`
                  : "Filtrar por data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4 space-y-3" align="end">
              <p className="text-xs font-medium text-muted-foreground">De</p>
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} className={cn("p-0 pointer-events-auto")} />
              <p className="text-xs font-medium text-muted-foreground">Até</p>
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} className={cn("p-0 pointer-events-auto")} />
              {hasFilters && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  Limpar filtros
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={() => navigate(`/criar?client=${encodeURIComponent(clientName)}`)} className="gap-2">
            <PenTool className="h-4 w-4" />
            Produzir Conteúdo
          </Button>
          <Button onClick={handleDownloadPDF} className="gap-2" disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? "Gerando PDF..." : "Baixar PDF estável"}
          </Button>
        </div>
      </div>

      {/* Preview document */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="mx-auto max-w-[800px] p-8 sm:p-12 space-y-8">
          {/* Header */}
          <div className="border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {posts.length} posts · {analysts.length} analista(s) ·{" "}
              Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.entries(byFormat) as [PostFormat, number][]).map(([fmt, count]) =>
                count > 0 ? (
                  <span key={fmt} className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
                    {FORMAT_LABELS[fmt]}: {count}
                  </span>
                ) : null
              )}
            </div>
          </div>

          {/* Summary table */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Resumo de Posts</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Data</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Título</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Formato</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Funil</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Analista</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPosts.map((post, i) => (
                    <tr key={post.id} className={`${i % 2 === 0 ? "bg-white" : "bg-muted/20"} ${onPostClick ? "cursor-pointer hover:bg-muted/40" : ""}`} onClick={() => onPostClick?.(post)}>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(post.date)}</td>
                      <td className="px-3 py-2 font-medium">{post.title}</td>
                      <td className="px-3 py-2"><PostBadge format={post.format} /></td>
                      <td className="px-3 py-2">
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs">{FUNNEL_LABELS[post.funnelStage]}</span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{post.analyst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed post cards */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Detalhes por Post</h3>
            <div className="space-y-6">
              {sortedPosts.map((post) => (
                <div key={post.id} className={`group relative rounded-lg border border-border p-5 space-y-3 ${onPostClick ? "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" : ""}`} onClick={() => onPostClick?.(post)}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">{post.headline}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      {/* Edit & Delete buttons */}
                      {(onPostClick || onEditPost || onDeletePost) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onPostClick && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                              title="Visualizar post"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onEditPost && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                              onClick={(e) => { e.stopPropagation(); onEditPost(post); }}
                              title="Editar post"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {onDeletePost && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm("Tem certeza que deseja excluir este post?")) {
                                  await onDeletePost(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                      {post.artUrl && (
                        <img src={post.artUrl} alt={post.title} className="h-20 w-20 rounded-lg object-cover" />
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <span>📅 {formatDate(post.date)}</span>
                    <span>👤 {post.analyst}</span>
                    <span className="flex items-center gap-1">
                      <PostBadge format={post.format} />
                    </span>
                    <span>🎯 {FUNNEL_LABELS[post.funnelStage]}</span>
                  </div>

                  {post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.hashtags.map((h) => (
                        <span key={h} className="text-xs font-medium text-accent">#{h}</span>
                      ))}
                    </div>
                  )}

                  {post.legend && (
                    <div className="rounded bg-secondary/50 p-3">
                      <p className="text-sm leading-relaxed text-secondary-foreground">{post.legend}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
