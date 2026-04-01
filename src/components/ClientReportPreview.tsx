import { useRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Trash2 } from "lucide-react";
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
  onEditPost?: (post: Post) => void;
  onDeletePost?: (postId: string) => Promise<void>;
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

export function ClientReportPreview({ clientName, posts, analysts, byFormat, avatarUrl, onPostClick, onEditPost, onDeletePost }: ClientReportPreviewProps) {
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
      head: [["Data", "Título", "Headline", "Formato", "Funil", "Canais", "Analista"]],
      body: sortedPosts.map((p) => [
        formatDate(p.date),
        p.title,
        p.headline,
        FORMAT_LABELS[p.format],
        FUNNEL_LABELS[p.funnelStage],
        (p.channels || []).join(", ") || "—",
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
    // Pre-load ALL art images (single + carousel) with high quality
    const artImages: Map<string, { src: string; width: number; height: number }[]> = new Map();
    await Promise.all(
      sortedPosts.map(async (p) => {
        const urls: string[] = [];
        if (p.format === "carousel" && p.artUrls && p.artUrls.length > 0) {
          urls.push(...p.artUrls);
        } else if (p.artUrl) {
          urls.push(p.artUrl);
        }
        if (urls.length === 0) return;

        const loaded: { src: string; width: number; height: number }[] = [];
        for (const url of urls) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = reject;
              img.src = url;
            });
            // High-res canvas for quality
            const scale = 2;
            const c = document.createElement("canvas");
            c.width = img.naturalWidth * scale;
            c.height = img.naturalHeight * scale;
            const ctx = c.getContext("2d")!;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, c.width, c.height);
            loaded.push({
              src: c.toDataURL("image/png"),
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          } catch { /* skip */ }
        }
        if (loaded.length > 0) artImages.set(p.id, loaded);
      })
    );

    // Helper: draw phone mockup frame
    const drawPhoneMockup = (
      doc: jsPDF,
      imgSrc: string,
      imgW: number,
      imgH: number,
      phoneX: number,
      phoneY: number,
      phoneWidth: number
    ): number => {
      const aspectRatio = imgH / imgW;
      const screenWidth = phoneWidth - 4; // padding inside phone frame
      const screenHeight = screenWidth * (16 / 9); // 9:16 aspect
      const phoneHeight = screenHeight + 12; // top notch + bottom indicator

      // Phone body (dark rounded rect)
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(phoneX, phoneY, phoneWidth, phoneHeight, 4, 4, "F");

      // Screen area (clip image into it)
      const screenX = phoneX + 2;
      const screenY = phoneY + 6;

      // Fit image to screen
      const imgAspect = imgW / imgH;
      let drawW = screenWidth;
      let drawH = drawW / imgAspect;
      if (drawH < screenHeight) {
        // Image is wider, fill height
        drawH = screenHeight;
        drawW = drawH * imgAspect;
      }
      const drawX = screenX + (screenWidth - drawW) / 2;
      const drawY = screenY + (screenHeight - drawH) / 2;

      // Background for screen
      doc.setFillColor(200, 200, 200);
      doc.rect(screenX, screenY, screenWidth, screenHeight, "F");

      doc.addImage(imgSrc, "PNG", drawX, drawY, drawW, drawH);

      // Notch
      const notchW = phoneWidth * 0.4;
      doc.setFillColor(30, 30, 30);
      doc.roundedRect(phoneX + (phoneWidth - notchW) / 2, phoneY, notchW, 4, 1.5, 1.5, "F");

      // Home indicator
      const indicatorW = phoneWidth * 0.35;
      doc.setFillColor(180, 180, 180);
      doc.roundedRect(phoneX + (phoneWidth - indicatorW) / 2, phoneY + phoneHeight - 3.5, indicatorW, 1.2, 0.6, 0.6, "F");

      return phoneHeight;
    };

    sortedPosts.forEach((post, idx) => {
      doc.addPage();
      addHeader();

      const images = artImages.get(post.id) || [];
      const isCarousel = post.format === "carousel" && images.length > 1;
      const hasArt = images.length > 0;

      // Phone mockup dimensions
      const phoneWidth = 36;
      const phoneX = pageWidth - margin - phoneWidth;

      let y = 24;

      // Post number badge
      doc.setFillColor(...yellow);
      doc.roundedRect(margin, y - 4, 18, 8, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(`${idx + 1}/${sortedPosts.length}`, margin + 9, y + 1, { align: "center" });

      // Title (leave room for phone mockup)
      const titleMaxWidth = hasArt ? contentWidth - phoneWidth - 12 : contentWidth - 22;
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      const titleLines = doc.splitTextToSize(post.title, titleMaxWidth);
      doc.text(titleLines, margin + 22, y + 1);
      y += titleLines.length * 8 + 4;

      // Headline
      const headlineMaxWidth = hasArt ? contentWidth - phoneWidth - 12 : contentWidth;
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      const headlineLines = doc.splitTextToSize(post.headline, headlineMaxWidth);
      doc.text(headlineLines, margin, y);
      const headlineBottom = y + headlineLines.length * 5.5;

      // Draw phone mockup with first image
      let artBottom = headlineBottom;
      if (hasArt) {
        const firstImg = images[0];
        const phoneY = 22;
        const phoneH = drawPhoneMockup(doc, firstImg.src, firstImg.width, firstImg.height, phoneX, phoneY, phoneWidth);
        artBottom = Math.max(artBottom, phoneY + phoneH + 4);
      }

      y = Math.max(headlineBottom, artBottom) + 6;

      // Yellow divider
      doc.setFillColor(...yellow);
      doc.rect(margin, y, contentWidth, 1, "F");
      y += 8;

      // Details grid
      doc.setFillColor(...warmBg);
      const detailPairs: [string, string][] = [
        ["Data", formatDate(post.date)],
        ["Formato", FORMAT_LABELS[post.format]],
        ["Funil", FUNNEL_LABELS[post.funnelStage]],
        ["Analista", post.analyst],
      ];
      if (post.channels && post.channels.length > 0) {
        detailPairs.push(["Canais", post.channels.join(", ")]);
      }

      const detailBoxH = detailPairs.length * 8 + 6;
      doc.roundedRect(margin, y - 3, contentWidth, detailBoxH, 2, 2, "F");
      doc.setFillColor(...yellow);
      doc.rect(margin, y - 3, 2, detailBoxH, "F");

      doc.setFontSize(9);
      detailPairs.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(label, margin + 8, y + 3);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(value, margin + 35, y + 3);
        y += 8;
      });
      y += 6;

      // Legend / copy (with hashtags inside)
      const hasLegend = !!post.legend;
      const hasHashtags = post.hashtags.length > 0;

      if (hasLegend || hasHashtags) {
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text("LEGENDA / CONTEÚDO", margin, y);
        y += 5;

        // Build combined content: legend + hashtags
        const legendText = post.legend || "";
        const hashText = hasHashtags ? "\n\n" + post.hashtags.map((h) => "#" + h).join(" ") : "";
        const combinedText = (legendText + hashText).trim();

        const combinedLines = doc.splitTextToSize(combinedText, contentWidth - 14);
        const boxH = combinedLines.length * 4.5 + 8;

        doc.setFillColor(...warmBg);
        doc.roundedRect(margin, y - 3, contentWidth, boxH, 2, 2, "F");
        doc.setFillColor(...yellow);
        doc.rect(margin, y - 3, 2.5, boxH, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 45, 35);
        doc.text(combinedLines, margin + 7, y + 2);
        y += boxH + 4;
      }

      // Carousel: show remaining slides in a row below
      if (isCarousel && images.length > 1) {
        const remainingImages = images.slice(1);
        const thumbSize = 28;
        const gap = 4;
        const maxPerRow = Math.floor((contentWidth + gap) / (thumbSize + gap));

        // Check if we need a new page
        if (y + thumbSize + 14 > pageHeight - 16) {
          doc.addPage();
          addHeader();
          y = 28;
        }

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(`SLIDES DO CARROSSEL (${images.length} slides)`, margin, y);
        y += 5;

        let thumbX = margin;
        let rowIdx = 0;
        remainingImages.forEach((img, i) => {
          if (rowIdx >= maxPerRow) {
            rowIdx = 0;
            thumbX = margin;
            y += thumbSize + gap;
          }

          // Mini phone frame
          const miniPhoneW = thumbSize * 0.9;
          const miniPhoneH = miniPhoneW * (16 / 9) + 4;
          const mpX = thumbX + (thumbSize - miniPhoneW) / 2;

          doc.setFillColor(50, 50, 50);
          doc.roundedRect(mpX, y, miniPhoneW, miniPhoneH, 1.5, 1.5, "F");

          const screenW = miniPhoneW - 2;
          const screenH = miniPhoneW * (16 / 9) - 2;
          const screenX = mpX + 1;
          const screenY = y + 2;

          doc.setFillColor(200, 200, 200);
          doc.rect(screenX, screenY, screenW, screenH, "F");

          const imgAspect = img.width / img.height;
          let dw = screenW;
          let dh = dw / imgAspect;
          if (dh < screenH) {
            dh = screenH;
            dw = dh * imgAspect;
          }
          const dx = screenX + (screenW - dw) / 2;
          const dy = screenY + (screenH - dh) / 2;
          doc.addImage(img.src, "PNG", dx, dy, dw, dh);

          // Slide number
          doc.setFillColor(...yellow);
          doc.setFontSize(6);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...dark);
          const numY = y + miniPhoneH + 3;
          doc.text(`${i + 2}`, mpX + miniPhoneW / 2, numY, { align: "center" });

          thumbX += thumbSize + gap;
          rowIdx++;
        });
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
                  {/* Edit & Delete buttons */}
                  {(onEditPost || onDeletePost) && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {onEditPost && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); onEditPost(post); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeletePost && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Tem certeza que deseja excluir este post?")) {
                              await onDeletePost(post.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
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
