import { useRef, useState } from "react";
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
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const allSorted = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const sortedPosts = allSorted.filter((p) => {
    if (dateFrom && p.date < format(dateFrom, "yyyy-MM-dd")) return false;
    if (dateTo && p.date > format(dateTo, "yyyy-MM-dd")) return false;
    return true;
  });
  const hasFilters = dateFrom || dateTo;

  const handleDownloadPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const totalPosts = sortedPosts.length;
    const rangeStart = sortedPosts[0]?.date;
    const rangeEnd = sortedPosts[sortedPosts.length - 1]?.date;

    // Brand colors
    const yellow: [number, number, number] = [253, 182, 0];
    const dark: [number, number, number] = [20, 15, 0];
    const warmBg: [number, number, number] = [255, 249, 230];
    const gray: [number, number, number] = [120, 115, 100];
    const soft: [number, number, number] = [248, 244, 234];
    const line: [number, number, number] = [232, 224, 203];
    const body: [number, number, number] = [70, 64, 52];

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

    const cleanAnalysts = analysts.map((name) => name.trim()).filter(Boolean);

    const formatSummary = (Object.entries(byFormat) as [PostFormat, number][])
      .filter(([, c]) => c > 0)
      .map(([f, c]) => `${FORMAT_LABELS[f]} · ${c}`)
      .join("  •  ") || "Nenhum formato registrado";

    const dateSummary = rangeStart && rangeEnd
      ? rangeStart === rangeEnd
        ? format(new Date(rangeStart + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : `${format(new Date(rangeStart + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })} — ${format(new Date(rangeEnd + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}`
      : "Período personalizado";

    const subtitleText = hasFilters
      ? "Relatório filtrado para apresentação e execução"
      : "Planejamento editorial organizado para execução";

    const drawLabelValue = (label: string, value: string, x: number, y: number, maxWidth: number) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gray);
      doc.text(label.toUpperCase(), x, y);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      const valueLines = doc.splitTextToSize(value, maxWidth);
      doc.text(valueLines, x, y + 7);
    };

    const addHeader = (sectionTitle?: string, sectionSubtitle?: string) => {
      doc.setFillColor(...yellow);
      doc.rect(0, 0, pageWidth, 3, "F");

      drawLogo(margin, 6, 28);

      doc.setDrawColor(...line);
      doc.setLineWidth(0.3);
      doc.line(margin, 19, pageWidth - margin, 19);

      if (sectionTitle) {
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(sectionTitle, pageWidth - margin, 11);
      }

      if (sectionSubtitle) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(sectionSubtitle, pageWidth - margin, 16);
      }
    };

    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setFillColor(...body);
      doc.rect(0, pageHeight - 10, pageWidth, 10, "F");

      doc.setFillColor(...yellow);
      doc.rect(0, pageHeight - 10, pageWidth, 1.5, "F");

      doc.setFontSize(7);
      doc.setTextColor(255, 249, 230);
      doc.text("iOBEE Social Lab · Relatório de Conteúdo", margin, pageHeight - 4);
      doc.text(`${pageNum}/${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
    };

    // ==========================================
    // PAGE 1: COVER
    doc.setFillColor(...yellow);
    doc.rect(0, 0, pageWidth, 3, "F");

    drawLogo(pageWidth / 2 - 28, 18, 56);

    const logoBottom = 18 + 56 * logoAspect;
    doc.setDrawColor(...yellow);
    doc.setLineWidth(0.5);
    doc.line(margin + 8, logoBottom + 12, pageWidth - margin - 8, logoBottom + 12);

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(clientName, pageWidth / 2, logoBottom + 31, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(...yellow);
    doc.text("Relatório de Conteúdo", pageWidth / 2, logoBottom + 45, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    const subtitleLines = doc.splitTextToSize(subtitleText, 120);
    doc.text(subtitleLines, pageWidth / 2, logoBottom + 58, { align: "center" });

    const featureY = logoBottom + 72;
    doc.setFillColor(...soft);
    doc.roundedRect(margin + 6, featureY, contentWidth - 12, 26, 4, 4, "F");
    doc.setFillColor(...yellow);
    doc.rect(margin + 6, featureY, 2.5, 26, "F");

    const featureLines = doc.splitTextToSize(
      "Posts, headlines, formatos, analistas e artes organizados em um material pronto para apresentação.",
      contentWidth - 32,
    );
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    doc.text(featureLines, pageWidth / 2, featureY + 10, { align: "center" });

    const statsY = featureY + 40;
    const cardGap = 5;
    const cardW = (contentWidth - cardGap * 2) / 3;
    [margin, margin + cardW + cardGap, margin + (cardW + cardGap) * 2].forEach((x) => {
      doc.setFillColor(...soft);
      doc.roundedRect(x, statsY, cardW, 28, 4, 4, "F");
    });

    drawLabelValue("Posts no relatório", `${totalPosts}`, margin + 6, statsY + 8, cardW - 12);
    drawLabelValue("Período", dateSummary, margin + cardW + cardGap + 6, statsY + 8, cardW - 12);
    drawLabelValue("Analistas", cleanAnalysts.join(", ") || "—", margin + (cardW + cardGap) * 2 + 6, statsY + 8, cardW - 12);

    const formatsY = statsY + 38;
    doc.setDrawColor(...yellow);
    doc.setLineWidth(0.4);
    doc.line(margin + 8, formatsY, pageWidth - margin - 8, formatsY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text("DISTRIBUIÇÃO DE FORMATOS", pageWidth / 2, formatsY + 7, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    const formatLines = doc.splitTextToSize(formatSummary, contentWidth - 20);
    doc.text(formatLines, pageWidth / 2, formatsY + 17, { align: "center" });

    const footerInfoY = pageHeight - 28;
    doc.setDrawColor(...yellow);
    doc.setLineWidth(0.4);
    doc.line(margin + 8, footerInfoY - 10, pageWidth - margin - 8, footerInfoY - 10);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    doc.text(`Base: ${totalPosts} posts • ${cleanAnalysts.length} analista(s)`, pageWidth / 2, footerInfoY, { align: "center" });
    doc.setTextColor(...yellow);
    doc.text(format(new Date(), "MMMM 'de' yyyy", { locale: ptBR }), pageWidth / 2, footerInfoY + 8, { align: "center" });

    // ==========================================
    // PAGE 2: SUMMARY TABLE
    // ==========================================
    doc.addPage();
    addHeader("Resumo editorial", clientName);

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
      styles: { fontSize: 8, cellPadding: 4, textColor: body, lineColor: line, lineWidth: 0.2 },
      headStyles: { fillColor: dark, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: warmBg },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 22 },
        3: { cellWidth: 22 },
        4: { cellWidth: 18 },
      },
      didDrawPage: () => {
        addHeader("Resumo editorial", clientName);
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
      addHeader("Peça detalhada", `${clientName} · ${FORMAT_LABELS[post.format]}`);

      const images = artImages.get(post.id) || [];
      const isCarousel = post.format === "carousel" && images.length > 1;
      const hasArt = images.length > 0;

      // Phone mockup dimensions
      const phoneWidth = 40;
      const phoneInternalPad = 8;

      let y = 24;

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gray);
      doc.text("PLANEJAMENTO VISUAL", margin, y - 1);

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
      const titleLines = doc.splitTextToSize(post.title, contentWidth - 22);
      doc.text(titleLines, margin + 22, y + 1);
      y += titleLines.length * 8 + 4;

      // Headline
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      const headlineLines = doc.splitTextToSize(post.headline, contentWidth);
      doc.text(headlineLines, margin, y);
      y += headlineLines.length * 5.5 + 6;

      // Yellow divider (full width)
      doc.setFillColor(...yellow);
      doc.rect(margin, y, contentWidth, 1, "F");
      y += 8;

      // ---- DETAILS BOX with phone inside ----
      const detailPairs: [string, string][] = [
        ["Data", formatDate(post.date)],
        ["Formato", FORMAT_LABELS[post.format]],
        ["Funil", FUNNEL_LABELS[post.funnelStage]],
        ["Analista", post.analyst],
      ];
      if (post.channels && post.channels.length > 0) {
        detailPairs.push(["Canais", post.channels.join(", ")]);
      }

      // Calculate phone height for the box
      let phoneH = 0;
      if (hasArt) {
        const screenWidth = phoneWidth - 4;
        const screenHeight = screenWidth * (16 / 9);
        phoneH = screenHeight + 12;
      }

      // Calculate title/headline height inside the box
      const titleInsideLines = doc.splitTextToSize(post.title, hasArt ? contentWidth - phoneWidth - phoneInternalPad * 2 - 10 : contentWidth - 14);
      const titleInsideH = titleInsideLines.length * 7 + 4;
      const headlineInsideLines = doc.splitTextToSize(post.headline, hasArt ? contentWidth - phoneWidth - phoneInternalPad * 2 - 10 : contentWidth - 14);
      const headlineInsideH = headlineInsideLines.length * 5 + 4;

      const detailTextH = titleInsideH + headlineInsideH + detailPairs.length * 8 + 10;
      const detailBoxH = Math.max(detailTextH, hasArt ? phoneH + phoneInternalPad * 2 : detailTextH);
      const detailBoxY = y - 3;

      // Draw detail box background
      doc.setFillColor(...warmBg);
      doc.roundedRect(margin, detailBoxY, contentWidth, detailBoxH, 3, 3, "F");
      doc.setFillColor(...yellow);
      doc.rect(margin, detailBoxY, 2, detailBoxH, "F");

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gray);
      doc.text("VISÃO GERAL DA PEÇA", margin + 8, detailBoxY + 7);

      // Draw phone mockup inside the box (right side)
      if (hasArt) {
        const firstImg = images[0];
        const phoneXPos = margin + contentWidth - phoneWidth - phoneInternalPad;
        const phoneYPos = detailBoxY + (detailBoxH - phoneH) / 2;
        drawPhoneMockup(doc, firstImg.src, firstImg.width, firstImg.height, phoneXPos, phoneYPos, phoneWidth);
      }

      // Draw title, headline and details (left side, vertically centered)
      const textColWidth = hasArt ? contentWidth - phoneWidth - phoneInternalPad * 2 - 10 : contentWidth - 14;
      let detailY = detailBoxY + (detailBoxH - detailTextH) / 2 + 11;

      // Title inside box
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(titleInsideLines, margin + 8, detailY);
      detailY += titleInsideH;

      // Headline inside box
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...gray);
      doc.text(headlineInsideLines, margin + 8, detailY);
      detailY += headlineInsideH;

      // Detail pairs
      doc.setFontSize(9);
      detailPairs.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text(label, margin + 8, detailY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...gray);
        doc.text(value, margin + 35, detailY);
        detailY += 8;
      });

      y = detailBoxY + detailBoxH + 8;

      // Legend / copy (full width below)
      const hasLegend = !!post.legend;
      const hasHashtags = post.hashtags.length > 0;

      if (hasLegend || hasHashtags) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...dark);
        doc.text("LEGENDA / CONTEÚDO", margin, y);
        y += 5;

        const legendText = post.legend || "";
        const hashText = hasHashtags ? "\n\n" + post.hashtags.map((h) => "#" + h).join(" ") : "";
        const combinedText = (legendText + hashText).trim();

        const legendWidth = contentWidth - 14;
        const combinedLines = doc.splitTextToSize(combinedText, legendWidth);
        const boxH = combinedLines.length * 4.5 + 8;

        doc.setFillColor(...warmBg);
        doc.roundedRect(margin, y - 3, contentWidth, boxH, 3, 3, "F");
        doc.setFillColor(...yellow);
        doc.rect(margin, y - 3, 2.5, boxH, "F");

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...body);
        doc.text(combinedLines, margin + 7, y + 2);
        y += boxH + 4;
      }

      y += 2;

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
          <Button onClick={handleDownloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar PDF
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
