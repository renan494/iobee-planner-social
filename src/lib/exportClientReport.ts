import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post, type PostFormat } from "@/data/posts";

const COLORS = {
  yellow: [253, 182, 0] as const,
  dark: [20, 15, 0] as const,
  warm: [255, 249, 230] as const,
  line: [232, 224, 203] as const,
  gray: [120, 115, 100] as const,
  body: [70, 64, 52] as const,
};

function formatDate(dateStr: string) {
  return format(new Date(`${dateStr}T12:00:00`), "dd/MM/yyyy");
}

function sanitizeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "relatorio-cliente";
}

interface ExportClientReportPdfOptions {
  clientName: string;
  posts: Post[];
  exportedAt?: Date;
  filtersApplied?: boolean;
}

export async function exportClientReportPdf({
  clientName,
  posts,
  exportedAt = new Date(),
  filtersApplied = false,
}: ExportClientReportPdfOptions) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  const sortedPosts = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const analysts = [...new Set(sortedPosts.map((post) => post.analyst.trim()).filter(Boolean))];

  const byFormat = sortedPosts.reduce<Record<PostFormat, number>>(
    (acc, post) => {
      acc[post.format] += 1;
      return acc;
    },
    { static: 0, carousel: 0, reels: 0, stories: 0 },
  );

  const rangeStart = sortedPosts[0]?.date;
  const rangeEnd = sortedPosts[sortedPosts.length - 1]?.date;

  const periodText = rangeStart && rangeEnd
    ? rangeStart === rangeEnd
      ? format(new Date(`${rangeStart}T12:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : `${formatDate(rangeStart)} — ${formatDate(rangeEnd)}`
    : "Período personalizado";

  const formatSummary = (Object.entries(byFormat) as [PostFormat, number][])
    .filter(([, count]) => count > 0)
    .map(([postFormat, count]) => `${FORMAT_LABELS[postFormat]} · ${count}`)
    .join("  •  ") || "Nenhum formato registrado";

  const addHeader = (title: string, subtitle?: string) => {
    doc.setFillColor(...COLORS.yellow);
    doc.rect(0, 0, pageWidth, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    doc.text("iOBEE Social Lab", margin, 11);

    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(margin, 16, pageWidth - margin, 16);

    doc.text(title, pageWidth - margin, 11, { align: "right" });

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.gray);
      doc.text(subtitle, pageWidth - margin, 15, { align: "right" });
    }
  };

  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setFillColor(...COLORS.body);
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");

    doc.setFillColor(...COLORS.yellow);
    doc.rect(0, pageHeight - 10, pageWidth, 1.5, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 249, 230);
    doc.text("iOBEE Social Lab · Relatório de Conteúdo", margin, pageHeight - 4);
    doc.text(`${pageNumber}/${totalPages}`, pageWidth - margin, pageHeight - 4, { align: "right" });
  };

  const drawInfoCard = (x: number, y: number, width: number, label: string, value: string) => {
    doc.setFillColor(...COLORS.warm);
    doc.roundedRect(x, y, width, 26, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(label.toUpperCase(), x + 5, y + 7);

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.dark);
    const lines = doc.splitTextToSize(value, width - 10);
    doc.text(lines, x + 5, y + 14);
  };

  doc.setFillColor(...COLORS.yellow);
  doc.rect(0, 0, pageWidth, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text("iOBEE Social Lab", pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(24);
  doc.text(clientName, pageWidth / 2, 52, { align: "center" });

  doc.setFontSize(18);
  doc.setTextColor(...COLORS.yellow);
  doc.text("Relatório de Conteúdo", pageWidth / 2, 64, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.body);
  const coverLines = doc.splitTextToSize(
    filtersApplied
      ? "Versão estável do relatório, sem artes incorporadas, priorizando compatibilidade e consistência na abertura do PDF."
      : "Versão estável do relatório, sem artes incorporadas, priorizando compatibilidade e consistência na abertura do PDF.",
    120,
  );
  doc.text(coverLines, pageWidth / 2, 76, { align: "center" });

  const cardGap = 5;
  const cardWidth = (contentWidth - cardGap * 2) / 3;
  const statsY = 98;
  drawInfoCard(margin, statsY, cardWidth, "Posts", String(sortedPosts.length));
  drawInfoCard(margin + cardWidth + cardGap, statsY, cardWidth, "Período", periodText);
  drawInfoCard(
    margin + (cardWidth + cardGap) * 2,
    statsY,
    cardWidth,
    "Analistas",
    analysts.join(", ") || "—",
  );

  doc.setDrawColor(...COLORS.yellow);
  doc.setLineWidth(0.4);
  doc.line(margin + 8, 140, pageWidth - margin - 8, 140);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gray);
  doc.text("DISTRIBUIÇÃO DE FORMATOS", pageWidth / 2, 147, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.dark);
  const summaryLines = doc.splitTextToSize(formatSummary, contentWidth - 20);
  doc.text(summaryLines, pageWidth / 2, 157, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.body);
  doc.text(
    `Gerado em ${format(exportedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    pageHeight - 24,
    { align: "center" },
  );

  doc.addPage();
  addHeader("Resumo editorial", clientName);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text("RESUMO DE POSTS", margin, 28);

  doc.setFillColor(...COLORS.yellow);
  doc.rect(margin, 30, 42, 1.5, "F");

  autoTable(doc, {
    startY: 38,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [["Data", "Título", "Formato", "Funil", "Canais", "Analista"]],
    body: sortedPosts.length > 0
      ? sortedPosts.map((post) => [
          formatDate(post.date),
          post.title,
          FORMAT_LABELS[post.format],
          FUNNEL_LABELS[post.funnelStage],
          (post.channels || []).join(", ") || "—",
          post.analyst,
        ])
      : [["—", "Nenhum post encontrado para este período.", "—", "—", "—", "—"]],
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: COLORS.body,
      lineColor: COLORS.line,
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: COLORS.warm },
    columnStyles: {
      0: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 18 },
      4: { cellWidth: 30 },
      5: { cellWidth: 24 },
    },
    didDrawPage: () => addHeader("Resumo editorial", clientName),
  });

  doc.addPage();
  addHeader("Detalhamento dos posts", clientName);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text("CONTEÚDO DETALHADO", margin, 28);

  doc.setFillColor(...COLORS.yellow);
  doc.rect(margin, 30, 54, 1.5, "F");

  autoTable(doc, {
    startY: 38,
    margin: { left: margin, right: margin, bottom: 18 },
    head: [["Post", "Conteúdo"]],
    body: sortedPosts.length > 0
      ? sortedPosts.map((post, index) => {
          const content = [
            `Data: ${formatDate(post.date)}`,
            `Formato: ${FORMAT_LABELS[post.format]}`,
            `Funil: ${FUNNEL_LABELS[post.funnelStage]}`,
            `Analista: ${post.analyst}`,
            `Canais: ${(post.channels || []).join(", ") || "—"}`,
            `Headline: ${post.headline}`,
            post.legend ? `Legenda: ${post.legend}` : null,
            post.hashtags.length > 0 ? `Hashtags: ${post.hashtags.map((tag) => `#${tag}`).join(" ")}` : null,
            post.reference ? `Referência: ${post.reference}` : null,
          ]
            .filter(Boolean)
            .join("\n\n");

          return [`#${index + 1} · ${post.title}`, content];
        })
      : [["—", "Nenhum conteúdo disponível para exportação."]],
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: COLORS.body,
      lineColor: COLORS.line,
      lineWidth: 0.2,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: COLORS.dark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: COLORS.warm },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: "bold", textColor: COLORS.dark },
      1: { cellWidth: contentWidth - 48 },
    },
    didDrawPage: () => addHeader("Detalhamento dos posts", clientName),
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    addFooter(page, totalPages);
  }

  doc.save(`${sanitizeFilename(clientName)}-relatorio-estavel.pdf`);
}