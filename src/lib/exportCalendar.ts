import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import type { Post } from "@/data/posts";
import { FORMAT_LABELS, FUNNEL_LABELS } from "@/data/posts";

function sortByDate(posts: Post[]) {
  return [...posts].sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

// Convert SVG to PNG data URL via canvas
async function svgToDataUrl(svgUrl: string, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve("");
    img.src = svgUrl;
  });
}

export async function exportToPDF(posts: Post[], title: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const sorted = sortByDate(posts);

  // Brand header bar
  doc.setFillColor(20, 15, 0); // #140F00
  doc.rect(0, 0, pageW, 28, "F");

  // Yellow accent line
  doc.setFillColor(253, 182, 0); // #FDB600
  doc.rect(0, 28, pageW, 2, "F");

  // Logo
  const { default: logoSvg } = await import("@/assets/logo-iobee.svg");
  const logoDataUrl = await svgToDataUrl(logoSvg, 120, 26);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", 14, 4, 50, 11);
  }

  // Header text on dark bar
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Calendário de Conteúdo", 14, 22);

  // Export date on right
  doc.setFontSize(8);
  doc.text(
    `Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
    pageW - 14,
    22,
    { align: "right" }
  );

  // Subtitle below bar
  doc.setTextColor(20, 15, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 38);

  // Table
  autoTable(doc, {
    startY: 43,
    head: [["Data", "Cliente", "Analista", "Formato", "Funil", "Título", "Headline"]],
    body: sorted.map((p) => [
      formatDate(p.date),
      p.client,
      p.analyst,
      FORMAT_LABELS[p.format],
      FUNNEL_LABELS[p.funnelStage],
      p.title,
      p.headline,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [253, 182, 0], textColor: [20, 15, 0], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 243, 235] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18 },
      5: { cellWidth: 50 },
      6: { cellWidth: "auto" },
    },
    // Footer with iOBEE branding on each page
    didDrawPage: (data) => {
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(245, 243, 235);
      doc.rect(0, pageH - 12, pageW, 12, "F");
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text("iOBEE • Calendário de Conteúdo", 14, pageH - 5);
      doc.text(
        `Página ${doc.getCurrentPageInfo().pageNumber}`,
        pageW - 14,
        pageH - 5,
        { align: "right" }
      );
    },
  });

  doc.save(`calendario-conteudo-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportToExcel(posts: Post[], title: string) {
  const sorted = sortByDate(posts);

  // Header rows with branding
  const headerRows = [
    ["iOBEE — Calendário de Conteúdo"],
    [title],
    [`Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`],
    [], // blank row
  ];

  const data = sorted.map((p) => [
    formatDate(p.date),
    p.client,
    p.analyst,
    FORMAT_LABELS[p.format],
    FUNNEL_LABELS[p.funnelStage],
    p.title,
    p.headline,
    p.legend || "",
    p.hashtags.map((h) => `#${h}`).join(" "),
  ]);

  const headers = ["Data", "Cliente", "Analista", "Formato", "Etapa do Funil", "Título", "Headline", "Legenda", "Hashtags"];

  const ws = XLSX.utils.aoa_to_sheet([...headerRows, headers, ...data]);

  // Column widths
  ws["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 35 },
    { wch: 40 },
    { wch: 50 },
    { wch: 40 },
  ];

  // Merge branding cells
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calendário");
  XLSX.writeFile(wb, `calendario-conteudo-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}
