import { useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import logoSvg from "@/assets/logo-iobee.svg";
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
  onPostClick?: (post: Post) => void;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

export function ClientReportPreview({ clientName, posts, analysts, byFormat, avatarUrl, onPostClick }: ClientReportPreviewProps) {
  const sortedPosts = [...posts].sort((a, b) => a.date.localeCompare(b.date));

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Brand colors
    const brandYellow: [number, number, number] = [253, 182, 0]; // #FDB600
    const brandDark: [number, number, number] = [20, 15, 0]; // #140F00

    // Load logo as image
    let logoImg: HTMLImageElement | null = null;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = logoSvg;
      });
      logoImg = img;
    } catch { /* proceed without logo */ }

    const addHeader = (doc: jsPDF) => {
      // Yellow top bar
      doc.setFillColor(...brandYellow);
      doc.rect(0, 0, pageWidth, 8, "F");

      // Logo on top-right
      if (logoImg) {
        const logoW = 35;
        const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth);
        doc.addImage(logoImg, "SVG", pageWidth - logoW - 14, 12, logoW, logoH);
      }
    };

    const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
      doc.setFillColor(...brandYellow);
      doc.rect(0, pageHeight - 6, pageWidth, 6, "F");
      doc.setFontSize(7);
      doc.setTextColor(...brandDark);
      doc.text(`iOBEE · Relatório de ${clientName}`, 14, pageHeight - 9);
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - 14, pageHeight - 9, { align: "right" });
    };

    // --- PAGE 1: Cover + Summary Table ---
    addHeader(doc);

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandDark);
    doc.text(clientName, 14, 35);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`${posts.length} posts · ${analysts.length} analista(s)`, 14, 43);
    doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 49);

    doc.setTextColor(...brandDark);
    doc.setFontSize(9);
    const statsLine = (Object.entries(byFormat) as [PostFormat, number][])
      .filter(([, count]) => count > 0)
      .map(([fmt, count]) => `${FORMAT_LABELS[fmt]}: ${count}`)
      .join("  ·  ");
    doc.text(statsLine, 14, 58);

    // Summary table
    autoTable(doc, {
      startY: 65,
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
      headStyles: { fillColor: brandDark, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [255, 251, 235] },
      margin: { left: 14, right: 14 },
    });

    // --- 1 POST PER PAGE ---
    const totalPages = 1 + sortedPosts.length;

    sortedPosts.forEach((post) => {
      doc.addPage();
      addHeader(doc);

      let y = 30;

      // Title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...brandDark);
      doc.text(post.title, 14, y);
      y += 9;

      // Headline
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const headlineLines = doc.splitTextToSize(post.headline, pageWidth - 28);
      doc.text(headlineLines, 14, y);
      y += headlineLines.length * 6 + 6;

      // Divider
      doc.setDrawColor(...brandYellow);
      doc.setLineWidth(0.8);
      doc.line(14, y, pageWidth - 14, y);
      y += 8;

      // Details
      doc.setFontSize(9);
      doc.setTextColor(...brandDark);
      doc.setFont("helvetica", "bold");

      const detailPairs = [
        ["Data", formatDate(post.date)],
        ["Formato", FORMAT_LABELS[post.format]],
        ["Funil", FUNNEL_LABELS[post.funnelStage]],
        ["Analista", post.analyst],
      ];
      if (post.channels && post.channels.length > 0) {
        detailPairs.push(["Canais", post.channels.join(", ")]);
      }

      detailPairs.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 45, y);
        y += 7;
      });

      // Hashtags
      if (post.hashtags.length > 0) {
        y += 3;
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...brandYellow);
        const hashText = post.hashtags.map((h) => "#" + h).join("  ");
        const hashLines = doc.splitTextToSize(hashText, pageWidth - 28);
        doc.text(hashLines, 14, y);
        y += hashLines.length * 5 + 6;
      }

      // Legend
      if (post.legend) {
        y += 2;
        // Background box
        doc.setFillColor(255, 251, 235);
        const legendLines = doc.splitTextToSize(post.legend, pageWidth - 36);
        const boxH = legendLines.length * 5 + 10;
        doc.roundedRect(14, y - 4, pageWidth - 28, boxH, 2, 2, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 55, 40);
        doc.text(legendLines, 18, y + 2);
      }
    });

    // Add footers to all pages
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      addFooter(doc, i, total);
    }

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
                <div key={post.id} className={`rounded-lg border border-border p-5 space-y-3 ${onPostClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}`} onClick={() => onPostClick?.(post)}>
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
