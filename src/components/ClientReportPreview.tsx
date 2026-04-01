import { useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostBadge } from "./PostBadge";
import { FUNNEL_LABELS, FORMAT_LABELS, type Post, type PostFormat } from "@/data/posts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ClientReportPreviewProps {
  clientName: string;
  posts: Post[];
  analysts: string[];
  byFormat: Record<PostFormat, number>;
  avatarUrl: string | null;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

export function ClientReportPreview({ clientName, posts, analysts, byFormat, avatarUrl }: ClientReportPreviewProps) {
  const sortedPosts = [...posts].sort((a, b) => a.date.localeCompare(b.date));

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(clientName, 14, 25);

    // Subtitle
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`${posts.length} posts · ${analysts.length} analista(s)`, 14, 33);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 39);

    // Stats line
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    const statsLine = (Object.entries(byFormat) as [PostFormat, number][])
      .filter(([, count]) => count > 0)
      .map(([fmt, count]) => `${FORMAT_LABELS[fmt]}: ${count}`)
      .join("  ·  ");
    doc.text(statsLine, 14, 48);

    // Table
    autoTable(doc, {
      startY: 55,
      head: [["Data", "Título", "Headline", "Formato", "Funil", "Analista"]],
      body: sortedPosts.map((p) => [
        formatDate(p.date),
        p.title,
        p.headline,
        FORMAT_LABELS[p.format],
        FUNNEL_LABELS[p.funnelStage],
        p.analyst,
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [60, 60, 60], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 14, right: 14 },
    });

    // Post details pages
    sortedPosts.forEach((post) => {
      doc.addPage();
      let y = 20;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(post.title, 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(post.headline, 14, y);
      y += 10;

      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const details = [
        `Data: ${formatDate(post.date)}`,
        `Formato: ${FORMAT_LABELS[post.format]}`,
        `Funil: ${FUNNEL_LABELS[post.funnelStage]}`,
        `Analista: ${post.analyst}`,
      ];
      details.forEach((d) => {
        doc.text(d, 14, y);
        y += 6;
      });

      if (post.hashtags.length > 0) {
        y += 2;
        doc.text(`Hashtags: ${post.hashtags.map((h) => "#" + h).join(" ")}`, 14, y);
        y += 8;
      }

      if (post.legend) {
        y += 2;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(post.legend, pageWidth - 28);
        doc.text(lines, 14, y);
      }
    });

    doc.save(`relatorio-${clientName.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Preview do Relatório</h2>
        <Button onClick={handleDownloadPDF} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar PDF
        </Button>
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
                    <tr key={post.id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
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
                <div key={post.id} className="rounded-lg border border-border p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground">{post.title}</h4>
                      <p className="text-sm text-muted-foreground">{post.headline}</p>
                    </div>
                    {post.artUrl && (
                      <img src={post.artUrl} alt={post.title} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                    )}
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
