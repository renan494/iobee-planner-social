import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import type { Post, PostFormat, FunnelStage } from "@/data/posts";
import { format, addDays, startOfMonth, getDay } from "date-fns";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(" ");
    pages.push(text);
  }

  return pages.join("\n\n--- PAGE BREAK ---\n\n");
}

async function extractTextFromPPTX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slides: string[] = [];

  // Get all slide XML files
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async("text");
    // Extract text from XML tags
    const textContent = xml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    slides.push(textContent);
  }

  return slides.join("\n\n--- SLIDE BREAK ---\n\n");
}

interface ParsedPauta {
  title: string;
  headline: string;
  format: PostFormat;
  funnelStage: FunnelStage;
  legend: string;
  hashtags: string[];
  parsedDate?: { day: number; month: number };
}

function detectFormat(text: string): PostFormat {
  const upper = text.toUpperCase();
  if (upper.includes("CARROSSEL") || upper.includes("CAROUSEL")) return "carousel";
  if (upper.includes("REELS") || upper.includes("REEL")) return "reels";
  if (upper.includes("STORIES") || upper.includes("STORY")) return "stories";
  return "static";
}

function detectFunnelStage(text: string): FunnelStage {
  const upper = text.toUpperCase();
  if (upper.includes("FUNDO")) return "fundo";
  if (upper.includes("MEIO")) return "meio";
  return "topo";
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#\w+/g) || [];
  return matches.map((h) => h.replace("#", "")).slice(0, 5);
}

interface ParsedDate {
  day: number;
  month: number;
}

function extractDateFromPage(text: string): ParsedDate | null {
  // Match patterns like "Quinta-feira, 02/04" or "Sábado, 04/04" or just "02/04"
  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
  if (dateMatch) {
    return { day: parseInt(dateMatch[1]), month: parseInt(dateMatch[2]) - 1 };
  }
  return null;
}

function isContentPage(text: string): boolean {
  // A content page has a format keyword AND a date
  const hasFormat = /\b(EST[AÁ]TICO|CARROSSEL|CAROUSEL|REELS?|STORIES?|STORY)\b/i.test(text);
  const hasDate = /\d{1,2}\/\d{1,2}/.test(text);
  return hasFormat && hasDate;
}

function extractLegend(text: string): string {
  // Remove format labels, date lines, hashtags, image references, page markers
  const lines = text.split("\n");
  const legendLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip format labels
    if (/^(EST[AÁ]TICO|CARROSSEL|CAROUSEL|REELS?|STORIES?|STORY|REEL)\s*$/i.test(trimmed)) continue;
    // Skip date lines
    if (/^(Segunda|Terça|Quarta|Quinta|Sexta|Sábado|Domingo)/i.test(trimmed)) continue;
    // Skip client name headers (all caps, short)
    if (/^(DIVINA\s*TERRA|[A-Z\s]{3,20})$/.test(trimmed) && trimmed.length < 25) continue;
    // Skip hashtag-only lines
    if (/^#\w/.test(trimmed) && trimmed.split(" ").every(w => w.startsWith("#") || w.length < 3)) continue;
    // Skip page markers and image refs
    if (/^(---|###|Images from|\*|parsed-documents|CLIQUE AQUI|Link na bio)/i.test(trimmed)) continue;
    // Skip very short lines that are likely UI elements
    if (trimmed.length < 5) continue;

    legendLines.push(trimmed);
  }

  return legendLines.join("\n").trim();
}

function extractTitle(text: string): string {
  const legend = extractLegend(text);
  // Take first sentence or first 60 chars
  const firstSentence = legend.match(/^([^.!?\n]{10,80})/);
  if (firstSentence) {
    const t = firstSentence[1].trim();
    return t.length > 60 ? t.substring(0, 57) + "..." : t;
  }
  return legend.substring(0, 60).trim() || "Post";
}

function parsePautas(fullText: string): ParsedPauta[] {
  const pautas: ParsedPauta[] = [];

  // Try splitting by page breaks first (PDF format)
  let pages = fullText.split(/---\s*PAGE BREAK\s*---/i);

  // If only one page, try slide breaks (PPTX format)
  if (pages.length <= 1) {
    pages = fullText.split(/---\s*SLIDE BREAK\s*---/i);
  }

  // If still one segment, try the old "Pauta" marker format as fallback
  if (pages.length <= 1) {
    const pautaRegex = /Pauta\s*\d+[.:]/gi;
    const segments = fullText.split(pautaRegex);
    if (segments.length > 1) {
      pages = segments.slice(1);
    }
  }

  for (const page of pages) {
    if (!isContentPage(page)) continue;

    const parsedDate = extractDateFromPage(page);
    const legend = extractLegend(page);
    const title = extractTitle(page);

    pautas.push({
      title,
      headline: title,
      format: detectFormat(page),
      funnelStage: detectFunnelStage(page),
      legend: legend.substring(0, 500),
      hashtags: extractHashtags(page),
      parsedDate: parsedDate || undefined,
    });
  }

  return pautas;
}

function distributeDates(
  count: number,
  year: number,
  month: number
): string[] {
  const monthStart = startOfMonth(new Date(year, month));
  const dates: string[] = [];

  // Distribute evenly across weekdays (Mon-Fri)
  let currentDate = monthStart;
  let placed = 0;

  while (placed < count) {
    const dayOfWeek = getDay(currentDate);
    // Skip weekends (0=Sun, 6=Sat)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(format(currentDate, "yyyy-MM-dd"));
      placed++;
    }
    currentDate = addDays(currentDate, placed < count ? Math.max(1, Math.floor(22 / count)) : 1);
    // Safety: don't go beyond month + 40 days
    if (currentDate > addDays(monthStart, 40)) {
      // Fill remaining with sequential weekdays from start
      currentDate = addDays(monthStart, 1);
      while (placed < count) {
        if (getDay(currentDate) !== 0 && getDay(currentDate) !== 6) {
          dates.push(format(currentDate, "yyyy-MM-dd"));
          placed++;
        }
        currentDate = addDays(currentDate, 1);
      }
    }
  }

  return dates.sort();
}

export async function parseFileToPost(
  file: File,
  client: string,
  analyst: string,
  year: number,
  month: number
): Promise<Post[]> {
  let fullText: string;

  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".pdf")) {
    fullText = await extractTextFromPDF(file);
  } else if (fileName.endsWith(".pptx")) {
    fullText = await extractTextFromPPTX(file);
  } else {
    throw new Error("Formato não suportado. Use PDF ou PPTX.");
  }

  const pautas = parsePautas(fullText);

  if (pautas.length === 0) {
    throw new Error("Nenhuma pauta encontrada no arquivo. Verifique se o documento segue o formato de planejamento.");
  }

  // Use parsed dates from the document when available, otherwise distribute evenly
  const fallbackDates = distributeDates(pautas.length, year, month);

  return pautas.map((pauta, i) => {
    let date: string;
    if (pauta.parsedDate) {
      const y = pauta.parsedDate.month !== month ? year : year;
      date = format(new Date(year, pauta.parsedDate.month, pauta.parsedDate.day), "yyyy-MM-dd");
    } else {
      date = fallbackDates[i] || format(new Date(year, month, i + 1), "yyyy-MM-dd");
    }

    return {
      id: `import-${Date.now()}-${i}`,
      client,
      analyst,
      title: pauta.title,
      headline: pauta.headline,
      format: pauta.format,
      funnelStage: pauta.funnelStage,
      date,
      hashtags: pauta.hashtags,
      legend: pauta.legend || undefined,
    };
  });
}
