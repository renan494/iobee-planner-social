import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Post } from "@/data/posts";
import { FORMAT_LABELS, FUNNEL_LABELS } from "@/data/posts";

function sortByDate(posts: Post[]) {
  return [...posts].sort((a, b) => a.date.localeCompare(b.date));
}

function formatDate(dateStr: string) {
  return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
}

export function exportToPDF(posts: Post[], title: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  const sorted = sortByDate(posts);

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("iOBEE — Calendário de Conteúdo", 14, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 26);
  doc.setFontSize(9);
  doc.text(`Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 32);

  // Table
  autoTable(doc, {
    startY: 38,
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
  });

  doc.save(`calendario-conteudo-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export function exportToExcel(posts: Post[], title: string) {
  const sorted = sortByDate(posts);

  const data = sorted.map((p) => ({
    Data: formatDate(p.date),
    Cliente: p.client,
    Analista: p.analyst,
    Formato: FORMAT_LABELS[p.format],
    "Etapa do Funil": FUNNEL_LABELS[p.funnelStage],
    Título: p.title,
    Headline: p.headline,
    Legenda: p.legend || "",
    Hashtags: p.hashtags.map((h) => `#${h}`).join(" "),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, // Data
    { wch: 20 }, // Cliente
    { wch: 18 }, // Analista
    { wch: 12 }, // Formato
    { wch: 14 }, // Funil
    { wch: 35 }, // Título
    { wch: 40 }, // Headline
    { wch: 50 }, // Legenda
    { wch: 40 }, // Hashtags
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Calendário");
  XLSX.writeFile(wb, `calendario-conteudo-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
}
