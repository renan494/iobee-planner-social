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

function parsePautas(fullText: string): ParsedPauta[] {
  const pautas: ParsedPauta[] = [];

  // Split by "Pauta" markers
  const pautaRegex = /Pauta\s*\d+[.:]/gi;
  const segments = fullText.split(pautaRegex);

  // Skip first segment (before first Pauta)
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];

    // Extract headline
    const headlineMatch = segment.match(/Headline[:\s]*([^\n.]+)/i);
    const headline = headlineMatch
      ? headlineMatch[1].trim()
      : segment.substring(0, 80).trim();

    // Extract title from first meaningful text
    const titleMatch = segment.match(/([A-ZÀ-ÿ][^.!?\n]{5,60})/);
    const title = titleMatch ? titleMatch[1].trim() : `Pauta ${i}`;

    // Extract legend from "Legenda" section
    const legendMatch = segment.match(/Legenda[^:]*:\s*([^#]{10,300})/i);
    const legend = legendMatch ? legendMatch[1].trim() : "";

    pautas.push({
      title: title.length > 60 ? title.substring(0, 57) + "..." : title,
      headline: headline.length > 100 ? headline.substring(0, 97) + "..." : headline,
      format: detectFormat(segment),
      funnelStage: detectFunnelStage(segment),
      legend,
      hashtags: extractHashtags(segment),
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

  const dates = distributeDates(pautas.length, year, month);

  return pautas.map((pauta, i) => ({
    id: `import-${Date.now()}-${i}`,
    client,
    analyst,
    title: pauta.title,
    headline: pauta.headline,
    format: pauta.format,
    funnelStage: pauta.funnelStage,
    date: dates[i] || format(new Date(year, month, i + 1), "yyyy-MM-dd"),
    hashtags: pauta.hashtags,
    legend: pauta.legend || undefined,
  }));
}
