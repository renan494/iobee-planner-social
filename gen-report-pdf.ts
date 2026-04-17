import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { createClientReportPrintTemplate } from "./src/lib/clientReportPrintTemplate";

const longLegend = `Esta é uma legenda propositalmente longa para validar que o card de detalhe do post mantém-se contido em uma única página A4 do PDF mesmo quando o copywriter escreve textos extensos. ${"Conteúdo de teste com bastante palavra para preencher o espaço da legenda. ".repeat(15)}`;

const posts: any[] = [
  { id: "p1", date: "2026-04-01", title: "Post curto", headline: "Headline curta", legend: "Texto curto.", hashtags: ["a","b"], analyst: "Ana", client: "iOBEE", format: "static", funnelStage: "topo", channels: ["instagram"], reference: null, artUrl: null, artUrls: [] },
  { id: "p2", date: "2026-04-05", title: "Post com legenda enorme", headline: "Sub super descritivo aqui", legend: longLegend, hashtags: Array.from({length:12},(_,i)=>`tag${i}`), analyst: "Bruno", client: "iOBEE", format: "carousel", funnelStage: "meio", channels: ["instagram","linkedin"], reference: "ref", artUrl: null, artUrls: [] },
  { id: "p3", date: "2026-04-09", title: "Reels demo", headline: "Hook pra reels", legend: longLegend + longLegend, hashtags: ["reels","demo"], analyst: "Ana", client: "iOBEE", format: "reels", funnelStage: "fundo", channels: ["instagram"], reference: null, artUrl: null, artUrls: [] },
];

const html = createClientReportPrintTemplate({
  clientName: "Cliente Teste",
  posts,
  exportedAt: new Date("2026-04-17T12:00:00"),
  filtersApplied: false,
  avatarDataUrl: null,
  artDataUrls: new Map(),
});

writeFileSync("/tmp/report.html", html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({ path: "/tmp/report.pdf", format: "A4", printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();
console.log("OK");
