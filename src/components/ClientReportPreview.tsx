import { useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download } from "lucide-react";
import logoSvg from "@/assets/logo-iobee.svg";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
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
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // Brand colors
    const yellow: [number, number, number] = [253, 182, 0];
    const dark: [number, number, number] = [20, 15, 0];
    const warmBg: [number, number, number] = [255, 249, 230];
    const gray: [number, number, number] = [120, 115, 100];

    // Convert SVG logo to a canvas-rendered PNG for reliable embedding
    let logoDataUrl: string | null = null;
    let logoAspect = 1;
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = logoSvg;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = Math.round(600 * (img.naturalHeight / img.naturalWidth));
      logoAspect = img.naturalHeight / img.naturalWidth;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      logoDataUrl = canvas.toDataURL("image/png");
    } catch { /* proceed without logo */ }

    const drawLogo = (x: number, y: number, w: number) => {
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", x, y, w, w * logoAspect);
      }
    };

    const addHeader = () => {
      // Top accent bar
      doc.setFillColor(...yellow);
      doc.rect(0, 0, pageWidth, 3, "F");
      // Logo top-right
      drawLogo(pageWidth - 40, 6, 30);
      // Thin line under header area
      doc.setDrawColor(240, 235, 220);
      doc.setLineWidth(0.3);
      doc.line(margin, 18, pageWidth - margin, 18);
    };

    const addFooter = (pageNum: number, totalPages: number) => {
      // Bottom bar
      doc.setFillColor(...dark);
      doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
      // Yellow accent line
      doc.setFillColor(...yellow);
      doc.rect(0, pageHeight - 10, pageWidth, 1.5, "F");
      // Footer text
      doc.setFontSize(7);
      doc.setTextColor(200, 195, 180);
      doc.text("iOBEE · Social Media Intelligence", margin, pageHeight - 4);
      doc.text(`${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
    };

    // ==========================================
    // PAGE 1: COVER (clean white with branded accents)
    // ==========================================
    // Top yellow accent line
    doc.setFillColor(...yellow);
    doc.rect(0, 0, pageWidth, 3, "F");

    // Logo centered
    drawLogo(pageWidth / 2 - 25, 20, 50);

    // Yellow thin divider under logo
    const logoBottom = 20 + 50 * logoAspect + 8;
    doc.setFillColor(...yellow);
    doc.rect(pageWidth / 2 - 30, logoBottom, 60, 1, "F");

    // Client name
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(clientName.toUpperCase(), pageWidth / 2, logoBottom + 16, { align: "center" });

    // Subtitle
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text("RELATÓRIO DE CONTEÚDO", pageWidth / 2, logoBottom + 26, { align: "center" });

    // Info box with left yellow border
    const boxY = logoBottom + 38;
    doc.setFillColor(250, 248, 243);
    doc.roundedRect(margin, boxY, contentWidth, 34, 3, 3, "F");
    doc.setFillColor(...yellow);
    doc.rect(margin, boxY, 2.5, 34, "F");

    doc.setFontSize(10);
    doc.setTextColor(...dark);
    const infoCol1X = margin + 10;
    const infoCol2X = pageWidth / 2 + 8;

    doc.setFont("helvetica", "bold");
    doc.text("Total de posts:", infoCol1X, boxY + 11);
    doc.setFont("helvetica", "normal");
    doc.text(`${posts.length}`, infoCol1X + 35, boxY + 11);

    doc.setFont("helvetica", "bold");
    doc.text("Analista(s):", infoCol2X, boxY + 11);
    doc.setFont("helvetica", "normal");
    doc.text(analysts.join(", "), infoCol2X + 28, boxY + 11);

    doc.setFont("helvetica", "bold");
    doc.text("Formatos:", infoCol1X, boxY + 22);
    doc.setFont("helvetica", "normal");
    const fmtText = (Object.entries(byFormat) as [PostFormat, number][])
      .filter(([, c]) => c > 0)
      .map(([f, c]) => `${FORMAT_LABELS[f]}: ${c}`)
      .join("  ·  ");
    doc.text(fmtText, infoCol1X + 23, boxY + 22);

    doc.setFont("helvetica", "bold");
    doc.text("Gerado em:", infoCol2X, boxY + 22);
    doc.setFont("helvetica", "normal");
    doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), infoCol2X + 26, boxY + 22);

    // ==========================================
    // PAGE 2: SUMMARY TABLE
    // ==========================================
    doc.addPage();
    addHeader();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("RESUMO DE POSTS", margin, 28);

    // Yellow underline for section title
    doc.setFillColor(...yellow);
    doc.rect(margin, 30, 45, 1.5, "F");

    autoTable(doc, {
      startY: 38,
      head: [["Data", "Título", "Headline", "Formato", "Funil", "Analista"]],
      body: sortedPosts.map((p) => [
        formatDate(p.date),
        p.title,
        p.headline,
        FORMAT_LABELS[p.format],
        FUNNEL_LABELS[p.funnelStage],
        p.analyst,
      ]),
      styles: { fontSize: 8, cellPadding: 4, textColor: dark },
      headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: warmBg },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
      },
    });

    // ==========================================
    // POST DETAIL PAGES (1 per page)
    // ==========================================
    sortedPosts.forEach((post, idx) => {
      doc.addPage();
      addHeader();

      let y = 24;

      // Post number badge
      doc.setFillColor(...yellow);
      doc.roundedRect(margin, y - 4, 18, 8, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(`${idx + 1}/${sortedPosts.length}`, margin + 9, y + 1, { align: "center" });

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(post.title, margin + 22, y + 1);
      y += 12;

      // Headline
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      const headlineLines = doc.splitTextToSize(post.headline, contentWidth);
      doc.text(headlineLines, margin, y);
      y += headlineLines.length * 5.5 + 6;

      // Yellow divider
      doc.setFillColor(...yellow);
      doc.rect(margin, y, contentWidth, 1, "F");
      y += 8;

      // Details in a styled grid
      doc.setFillColor(...warmBg);
      const detailPairs: [string, string][] = [
        ["📅  Data", formatDate(post.date)],
        ["📋  Formato", FORMAT_LABELS[post.format]],
        ["🎯  Funil", FUNNEL_LABELS[post.funnelStage]],
        ["👤  Analista", post.analyst],
      ];
      if (post.channels && post.channels.length > 0) {
        detailPairs.push(["📱  Canais", post.channels.join(", ")]);
      }

      const detailBoxH = detailPairs.length * 8 + 6;
      doc.roundedRect(margin, y - 3, contentWidth, detailBoxH, 2, 2, "F");

      doc.setFontSize(9);
      detailPairs.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(label, margin + 5, y + 3);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(value, margin + 42, y + 3);
        y += 8;
      });
      y += 6;

      // Hashtags
      if (post.hashtags.length > 0) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...yellow);
        const hashText = post.hashtags.map((h) => "#" + h).join("  ");
        const hashLines = doc.splitTextToSize(hashText, contentWidth);
        doc.text(hashLines, margin, y);
        y += hashLines.length * 5 + 6;
      }

      // Legend / copy
      if (post.legend) {
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text("LEGENDA / CONTEÚDO", margin, y);
        y += 5;

        // Yellow left-border accent box
        const legendLines = doc.splitTextToSize(post.legend, contentWidth - 14);
        const boxH = legendLines.length * 4.5 + 8;

        doc.setFillColor(...warmBg);
        doc.roundedRect(margin, y - 3, contentWidth, boxH, 2, 2, "F");
        doc.setFillColor(...yellow);
        doc.rect(margin, y - 3, 2.5, boxH, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 45, 35);
        doc.text(legendLines, margin + 7, y + 2);
      }
    });

    // Add headers & footers to all pages (skip cover header)
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      addFooter(i, total);
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
                <div key={post.id} className={`group relative rounded-lg border border-border p-5 space-y-3 ${onPostClick ? "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" : ""}`} onClick={() => onPostClick?.(post)}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{post.title}</h4>
                        <p className="text-sm text-muted-foreground">{post.headline}</p>
                      </div>
                      {onPostClick && (
                        <Pencil className="h-3.5 w-3.5 mt-1 flex-shrink-0 text-muted-foreground/30 group-hover:text-primary/60 transition-colors" />
                      )}
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
