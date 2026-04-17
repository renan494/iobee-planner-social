import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post } from "@/data/posts";

const REPORT_TITLE = "iOBEE Social Lab · Relatório de Conteúdo";

const COLORS = {
  accent: "#FDB600",
  accentSoft: "#FFF1B8",
  accentDeep: "#B07F00",
  ink: "#0E0A00",
  body: "#3D3729",
  muted: "#8A8472",
  mutedSoft: "#BAB29C",
  line: "#ECE5D2",
  lineSoft: "#F5EFDF",
  surface: "#FBF7EC",
  white: "#FFFFFF",
};

export interface ClientReportPrintTemplateOptions {
  clientName: string;
  posts: Post[];
  exportedAt: Date;
  filtersApplied: boolean;
  avatarDataUrl?: string | null;
  artDataUrls?: Map<string, string[]>;
}

const IOBEE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 233.94" style="width:100%;height:100%"><g><g><path fill="#f9b510" d="M1024.24,219.38v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/><path fill="#f9b510" d="M1080,219.38v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/><path fill="#f9b510" d="M1052.15,170.86v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/></g><path fill="#f9b510" d="M289.78,119.19h0c2.42,0,4.34-2.05,4.15-4.47-1.67-21.15-14.93-110.11-119.85-110.11S63.05,86.71,63.13,113.6c0,2.29-1.85,4.14-4.14,4.14h0c-2.4,0-4.3,2.02-4.13,4.42,1.5,21.07,14.06,110.16,119.22,110.16,95.82,0,110.52-75.36,111.55-109.11.07-2.25,1.91-4.02,4.15-4.02ZM89.07,118.63c1.01-12.82.34-75.56,85.01-75.56s85.69,62.75,85.69,75.56-5.4,75.23-85.69,75.23c-87.71,0-84-62.41-85.01-75.23Z"/></g><g><path fill="#140f00" d="M455.65,107.15v.08c0,5.04,3.88,9.17,8.89,9.62,35.17,3.18,53.16,20.12,53.16,46.35,0,73.73-88.07,70.73-88.07,70.73h-117.43V.39h113.43s78.06-4.34,80.07,62.05c.67,26.02-14.35,44.7-50.04,44.7ZM430.97,200.56s50.04,3,50.04-36.7c0-35.36-47.71-34.03-47.71-34.03h-87.74l.33,70.73h85.07ZM418.96,93.8s50.04,1.34,50.04-30.69c0-27.69-48.37-26.69-48.37-26.69h-74.73v57.38h73.06Z"/><g><path fill="#140f00" d="M38.03,65.61v166.96H0V65.61h38.03Z"/><path fill="#140f00" d="M38.03,0v34.59H0V0h38.03Z"/></g><path fill="#140f00" d="M727.03.39h-191.83v233.53h191.83v-36.03l-153.8.33v-65.05h129.44v-32.03h-112.9c-1.87,0-3.38,1.52-3.38,3.38h0c0,1.87-1.51,3.38-3.38,3.38h-.6s-9.2,0-9.2,0v-7.81h0v-63.68h153.81V.39Z"/><path fill="#140f00" d="M936.35.39h-191.83v233.53h191.83v-36.03l-153.8.33v-65.05h129.44v-32.03h-112.9c-1.87,0-3.38,1.52-3.38,3.38h0c0,1.87-1.51,3.38-3.38,3.38h-9.8v-5.83s0-1.98,0-1.98h0v-63.68h153.81V.39Z"/></g></svg>`;

const FORMAT_ACCENT: Record<string, string> = {
  static: "#FDB600",
  carousel: "#3B82F6",
  reels: "#EF4444",
  stories: "#8B5CF6",
};

function formatDate(dateStr: string) {
  return format(new Date(`${dateStr}T12:00:00`), "dd/MM/yyyy");
}

function formatLongDate(dateStr: string) {
  return format(new Date(`${dateStr}T12:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function escapeHtml(value: string | null | undefined) {
  return (value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value: string | null | undefined) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

export function createClientReportPrintTemplate({
  clientName,
  posts,
  exportedAt,
  filtersApplied,
  avatarDataUrl,
  artDataUrls,
}: ClientReportPrintTemplateOptions) {
  const sortedPosts = [...posts].sort((a, b) => a.date.localeCompare(b.date));
  const analysts = [...new Set(sortedPosts.map((post) => post.analyst.trim()).filter(Boolean))];

  const byFormat = sortedPosts.reduce<Record<string, number>>((acc, post) => {
    acc[post.format] = (acc[post.format] ?? 0) + 1;
    return acc;
  }, {});

  const rangeStart = sortedPosts[0]?.date;
  const rangeEnd = sortedPosts[sortedPosts.length - 1]?.date;

  const periodText = rangeStart && rangeEnd
    ? rangeStart === rangeEnd
      ? formatLongDate(rangeStart)
      : `${formatDate(rangeStart)} — ${formatDate(rangeEnd)}`
    : "Período personalizado";

  const totalChannels = new Set(sortedPosts.flatMap((p) => p.channels || [])).size;

  const FUNNEL_COLORS: Record<string, string> = {
    topo: "#FDB600",
    meio: "#3B82F6",
    fundo: "#10B981",
  };
  const funnelOrder: Array<"topo" | "meio" | "fundo"> = ["topo", "meio", "fundo"];
  const funnelCounts = funnelOrder.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = sortedPosts.filter((p) => p.funnelStage === stage).length;
    return acc;
  }, {});
  const funnelTotal = sortedPosts.length;
  const funnelSegments = funnelOrder
    .filter((stage) => (funnelCounts[stage] ?? 0) > 0)
    .map((stage) => {
      const count = funnelCounts[stage];
      const pct = funnelTotal > 0 ? (count / funnelTotal) * 100 : 0;
      return `<div class="funnel-bar__segment" style="width: ${pct.toFixed(2)}%; background: ${FUNNEL_COLORS[stage]}" title="${FUNNEL_LABELS[stage]} ${count}"></div>`;
    })
    .join("");
  const funnelLegend = funnelOrder
    .map((stage) => {
      const count = funnelCounts[stage] ?? 0;
      const pct = funnelTotal > 0 ? Math.round((count / funnelTotal) * 100) : 0;
      return `
        <div class="funnel-legend__item">
          <span class="funnel-legend__dot" style="background: ${FUNNEL_COLORS[stage]}"></span>
          <span class="funnel-legend__label">${FUNNEL_LABELS[stage]}</span>
          <span class="funnel-legend__value">${count} <span class="funnel-legend__pct">· ${pct}%</span></span>
        </div>`;
    })
    .join("");

  const formatChips = Object.entries(byFormat)
    .filter(([, count]) => count > 0)
    .map(([fmt, count]) => `
      <span class="chip" style="--chip-color: ${FORMAT_ACCENT[fmt] || COLORS.accent}">
        <span class="chip__dot"></span>
        ${escapeHtml(FORMAT_LABELS[fmt as keyof typeof FORMAT_LABELS])}
        <span class="chip__count">${count}</span>
      </span>`)
    .join("") || `<span class="chip"><span class="chip__dot"></span>Nenhum formato registrado</span>`;

  const summaryRows = sortedPosts.length > 0
    ? sortedPosts
        .map(
          (post) => `
            <tr>
              <td class="cell-date">${formatDate(post.date)}</td>
              <td class="cell-title">${escapeHtml(post.title)}</td>
              <td>
                <span class="tag tag--format" style="--tag-color: ${FORMAT_ACCENT[post.format] || COLORS.accent}">
                  ${escapeHtml(FORMAT_LABELS[post.format])}
                </span>
              </td>
              <td><span class="tag tag--funnel">${escapeHtml(FUNNEL_LABELS[post.funnelStage])}</span></td>
              <td class="cell-muted">${escapeHtml((post.channels || []).join(" · ") || "—")}</td>
              <td class="cell-muted">${escapeHtml(post.analyst)}</td>
            </tr>`,
        )
        .join("")
    : `
      <tr>
        <td colspan="6" class="cell-empty">Nenhum post encontrado para este período.</td>
      </tr>`;

  // Pick legend density tier so it always fits in the fixed-height card.
  // Tiers tuned for ~110mm tall x 110mm wide legend box (≈1 column ~ 38 chars/line).
  const pickLegendTier = (legend: string | null | undefined) => {
    const len = (legend ?? "").length;
    if (len <= 280)   return { fontSize: "10pt",  lineHeight: 1.45, cols: 1 };
    if (len <= 700)   return { fontSize: "9pt",   lineHeight: 1.4,  cols: 1 };
    if (len <= 1400)  return { fontSize: "8.5pt", lineHeight: 1.35, cols: 2 };
    if (len <= 2400)  return { fontSize: "7.5pt", lineHeight: 1.3,  cols: 2 };
    if (len <= 3600)  return { fontSize: "7pt",   lineHeight: 1.25, cols: 3 };
    return                  { fontSize: "6.5pt", lineHeight: 1.2,  cols: 3 };
  };

  const detailCards = sortedPosts.length > 0
    ? sortedPosts
        .map(
          (post, index) => {
            const accent = FORMAT_ACCENT[post.format] || COLORS.accent;
            const legendTier = pickLegendTier(post.legend);
            const arts = artDataUrls?.get(post.id) ?? [];
            const placeholder = `
              <div class="post-card__thumb post-card__thumb--placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
                <span>Sem arte</span>
              </div>`;
            const thumbBlock = arts.length === 0
              ? placeholder
              : arts.length === 1
                ? `<img class="post-card__thumb" src="${arts[0]}" alt="Arte do post" />`
                : (() => {
                    const slides = arts.slice(0, 4);
                    const total = Math.min(arts.length, 4);
                    return `<div class="post-card__thumb-grid">${slides
                      .map(
                        (src, i) => `<div class="post-card__thumb-grid__cell"><img src="${src}" alt="Arte do post ${i + 1}" /><span class="post-card__thumb-grid__counter">${i + 1}/${total}</span></div>`,
                      )
                      .join("")}</div>`;
                  })();
            return `
            <article class="post-card" style="--accent: ${accent}">
              <div class="post-card__index" aria-hidden="true">
                <span class="post-card__index-num">${String(index + 1).padStart(2, "0")}</span>
                <span class="post-card__index-total">/${String(sortedPosts.length).padStart(2, "0")}</span>
              </div>
              <div class="post-card__rail"></div>
              <div class="post-card__body">
                <header class="post-card__header">
                  <p class="eyebrow">Post ${String(index + 1).padStart(2, "0")} · ${formatDate(post.date)}</p>
                  <h3>${escapeHtml(post.title)}</h3>
                  <span class="tag tag--format" style="--tag-color: ${accent}; margin-top: 2mm;">
                    ${escapeHtml(FORMAT_LABELS[post.format])}
                  </span>
                </header>

                <div class="post-card__columns">
                  <aside class="post-card__col-left">
                    ${thumbBlock}
                    <div class="meta-stack">
                      <div><span class="meta-label">Funil</span><span class="meta-value">${escapeHtml(FUNNEL_LABELS[post.funnelStage])}</span></div>
                      <div><span class="meta-label">Analista</span><span class="meta-value">${escapeHtml(post.analyst)}</span></div>
                      <div><span class="meta-label">Canais</span><span class="meta-value">${escapeHtml((post.channels || []).join(" · ") || "—")}</span></div>
                    </div>
                  </aside>

                  <div class="post-card__col-right">
                    <div class="content-block">
                      <p class="content-label">Headline</p>
                      <p class="content-text content-text--lead">${nl2br(post.headline)}</p>
                    </div>

                    ${post.legend ? `
                      <div class="content-block content-block--soft content-block--scroll">
                        <p class="content-label">Legenda</p>
                        <p class="content-text legend-text" style="font-size:${legendTier.fontSize};line-height:${legendTier.lineHeight};column-count:${legendTier.cols};">${nl2br(post.legend)}</p>
                      </div>` : ""}

                    ${post.hashtags.length > 0 ? `
                      <div class="content-block">
                        <p class="content-label">Hashtags</p>
                        <p class="content-text content-text--accent">${escapeHtml(post.hashtags.map((tag) => `#${tag}`).join("  "))}</p>
                      </div>` : ""}

                    ${post.reference ? `
                      <div class="content-block">
                        <p class="content-label">Referência</p>
                        <p class="content-text content-text--mono">${escapeHtml(post.reference)}</p>
                      </div>` : ""}
                  </div>
                </div>
              </div>
            </article>`;
          },
        )
        .join("")
    : '<article class="post-card"><div class="post-card__body"><p>Nenhum conteúdo disponível para exportação.</p></div></article>';

  const exportedLabel = format(exportedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(`${clientName} - relatório`)}</title>
        <style>
          @page {
            size: A4;
            margin: 22mm 16mm 20mm;
            @top-left {
              content: "iOBEE Social Lab";
              font-family: "Helvetica Neue", Arial, sans-serif;
              font-size: 8pt;
              font-weight: 700;
              letter-spacing: 0.16em;
              text-transform: uppercase;
              color: ${COLORS.muted};
              padding-bottom: 4mm;
              border-bottom: 0.3mm solid ${COLORS.line};
              width: 100%;
              vertical-align: bottom;
            }
            @top-right {
              content: "${escapeHtml(clientName).replace(/"/g, '\\"')}";
              font-family: "Helvetica Neue", Arial, sans-serif;
              font-size: 8pt;
              font-weight: 700;
              letter-spacing: 0.06em;
              color: ${COLORS.ink};
              padding-bottom: 4mm;
              border-bottom: 0.3mm solid ${COLORS.line};
              vertical-align: bottom;
            }
            @bottom-left {
              content: "Relatório de Conteúdo";
              font-family: "Helvetica Neue", Arial, sans-serif;
              font-size: 8pt;
              color: ${COLORS.muted};
              padding-top: 4mm;
              border-top: 0.3mm solid ${COLORS.line};
              width: 100%;
              vertical-align: top;
            }
            @bottom-right {
              content: counter(page) " / " counter(pages);
              font-family: "Helvetica Neue", Arial, sans-serif;
              font-size: 8pt;
              font-weight: 700;
              color: ${COLORS.ink};
              padding-top: 4mm;
              border-top: 0.3mm solid ${COLORS.line};
              vertical-align: top;
              white-space: nowrap;
            }
          }

          @page :first {
            margin: 14mm;
            @top-left { content: ""; border-bottom: 0; }
            @top-right { content: ""; border-bottom: 0; }
            @bottom-left { content: ""; border-top: 0; }
            @bottom-right { content: ""; border-top: 0; }
          }

          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            padding: 0;
            color: ${COLORS.body};
            font-family: "Helvetica Neue", "Inter", Arial, sans-serif;
            background: ${COLORS.white};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-size: 10.5pt;
            line-height: 1.55;
          }

          h1, h2, h3, p { margin: 0; }

          /* ===== COVER ===== */

          .page-cover {
            height: 269mm;
            display: flex;
            flex-direction: column;
            break-after: page;
            page-break-after: always;
            position: relative;
            overflow: hidden;
          }

          .cover-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-top: 6mm;
          }

          .brand-logo {
            width: 34mm;
            height: auto;
          }

          .cover-meta {
            text-align: right;
            font-size: 8pt;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: ${COLORS.muted};
            font-weight: 700;
            line-height: 1.6;
          }

          .cover-meta strong {
            display: block;
            color: ${COLORS.ink};
            font-size: 9pt;
            margin-top: 1mm;
          }

          .cover-hero {
            margin-top: 28mm;
            display: grid;
            gap: 6mm;
          }

          .cover-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 3mm;
            font-size: 8pt;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.accentDeep};
          }

          .cover-eyebrow::before {
            content: "";
            width: 10mm;
            height: 0.6mm;
            background: ${COLORS.accent};
          }

          .cover-title {
            display: flex;
            align-items: center;
            gap: 8mm;
            margin-top: 1mm;
          }

          .client-avatar {
            width: 26mm;
            height: 26mm;
            border-radius: 50%;
            object-fit: cover;
            background: ${COLORS.surface};
            display: block;
            flex-shrink: 0;
            box-shadow: 0 0 0 1mm ${COLORS.white}, 0 0 0 1.4mm ${COLORS.accent};
          }

          .client-avatar--fallback {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26pt;
            font-weight: 800;
            color: ${COLORS.ink};
            background: ${COLORS.accentSoft};
            text-transform: uppercase;
            letter-spacing: 0;
          }

          h1 {
            font-size: 44pt;
            line-height: 0.95;
            color: ${COLORS.ink};
            font-weight: 800;
            letter-spacing: -0.02em;
          }

          .cover-note {
            max-width: 130mm;
            font-size: 11pt;
            line-height: 1.55;
            color: ${COLORS.body};
            margin-top: 4mm;
          }

          .cover-divider {
            margin-top: 14mm;
            height: 0.3mm;
            background: ${COLORS.line};
          }

          .stats-grid {
            margin-top: 8mm;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0;
          }

          .stat {
            padding: 4mm 5mm 4mm 0;
            border-right: 0.3mm solid ${COLORS.line};
          }

          .stat:last-child { border-right: 0; padding-right: 0; }
          .stat:not(:first-child) { padding-left: 5mm; }

          .stat-label {
            font-size: 7.5pt;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
          }

          .stat-value {
            display: block;
            margin-top: 2mm;
            font-size: 22pt;
            font-weight: 800;
            color: ${COLORS.ink};
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .stat-value--small {
            font-size: 11pt;
            font-weight: 700;
            line-height: 1.3;
          }

          .formats-row {
            margin-top: 10mm;
          }

          .formats-row__label {
            font-size: 7.5pt;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
            margin-bottom: 3mm;
          }

          .chip-row {
            display: flex;
            flex-wrap: wrap;
            gap: 2.5mm;
          }

          .chip {
            display: inline-flex;
            align-items: center;
            gap: 2mm;
            padding: 1.6mm 3.5mm 1.6mm 2.8mm;
            border: 0.3mm solid ${COLORS.line};
            border-radius: 999px;
            font-size: 8.5pt;
            font-weight: 600;
            color: ${COLORS.ink};
            background: ${COLORS.white};
          }

          .chip__dot {
            width: 2.2mm;
            height: 2.2mm;
            border-radius: 50%;
            background: var(--chip-color, ${COLORS.accent});
            flex-shrink: 0;
          }

          .chip__count {
            margin-left: 1mm;
            color: ${COLORS.muted};
            font-weight: 700;
          }

          .funnel-row {
            margin-top: 8mm;
          }

          .funnel-row__head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3mm;
          }

          .funnel-row__total {
            font-size: 8pt;
            font-weight: 700;
            color: ${COLORS.muted};
            letter-spacing: 0.06em;
          }

          .funnel-bar {
            display: flex;
            width: 100%;
            height: 4mm;
            border-radius: 999px;
            overflow: hidden;
            background: ${COLORS.lineSoft};
            border: 0.3mm solid ${COLORS.line};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .funnel-bar__segment {
            height: 100%;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .funnel-bar--empty {
            opacity: 0.6;
          }

          .funnel-legend {
            margin-top: 3.5mm;
            display: flex;
            flex-wrap: wrap;
            gap: 6mm;
          }

          .funnel-legend__item {
            display: inline-flex;
            align-items: center;
            gap: 2mm;
            font-size: 9pt;
            color: ${COLORS.ink};
          }

          .funnel-legend__dot {
            width: 2.6mm;
            height: 2.6mm;
            border-radius: 50%;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .funnel-legend__label {
            font-weight: 700;
          }

          .funnel-legend__value {
            color: ${COLORS.body};
            font-weight: 600;
          }

          .funnel-legend__pct {
            color: ${COLORS.muted};
            font-weight: 600;
          }

          .funnel-empty {
            margin-top: 2.5mm;
            font-size: 9pt;
            color: ${COLORS.muted};
          }

          .cover-foot {
            margin-top: auto;
            padding-top: 10mm;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            font-size: 8pt;
            color: ${COLORS.muted};
            letter-spacing: 0.04em;
          }

          .cover-foot__brand {
            font-weight: 700;
            color: ${COLORS.ink};
            text-transform: uppercase;
            letter-spacing: 0.16em;
            font-size: 7.5pt;
          }

          /* ===== SECTIONS ===== */

          .section + .section { margin-top: 14mm; }

          .section-header {
            margin-bottom: 6mm;
          }

          .section-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 3mm;
            font-size: 7.5pt;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.accentDeep};
          }

          .section-eyebrow::before {
            content: "";
            width: 8mm;
            height: 0.5mm;
            background: ${COLORS.accent};
          }

          .section-header h2 {
            font-size: 22pt;
            line-height: 1.05;
            color: ${COLORS.ink};
            font-weight: 800;
            letter-spacing: -0.015em;
            margin-top: 2mm;
          }

          /* ===== TABLE ===== */

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }

          thead { display: table-header-group; }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            text-align: left;
            font-size: 7pt;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            font-weight: 700;
            color: ${COLORS.muted};
            padding: 3mm 3mm 3mm 0;
            border-bottom: 0.5mm solid ${COLORS.ink};
            background: ${COLORS.white};
            vertical-align: bottom;
          }

          td {
            padding: 3.5mm 3mm 3.5mm 0;
            text-align: left;
            vertical-align: top;
            border-bottom: 0.3mm solid ${COLORS.line};
            color: ${COLORS.body};
            word-break: break-word;
          }

          th:first-child, td:first-child { padding-left: 0; }
          th:last-child, td:last-child { padding-right: 0; }

          .cell-date {
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            color: ${COLORS.ink};
            font-weight: 600;
            font-size: 8.5pt;
          }

          .cell-title {
            color: ${COLORS.ink};
            font-weight: 600;
            min-width: 50mm;
          }

          .cell-muted { color: ${COLORS.muted}; font-size: 8.5pt; }

          .cell-empty {
            text-align: center;
            color: ${COLORS.muted};
            padding: 8mm 0;
            font-style: italic;
          }

          .tag {
            display: inline-flex;
            align-items: center;
            gap: 1.5mm;
            padding: 1.2mm 2.8mm;
            border-radius: 999px;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            white-space: nowrap;
          }

          .tag--format {
            color: ${COLORS.ink};
            background: ${COLORS.white};
            border: 0.4mm solid var(--tag-color, ${COLORS.accent});
            position: relative;
            padding-left: 4mm;
          }

          .tag--format::before {
            content: "";
            position: absolute;
            left: 1.6mm;
            top: 50%;
            transform: translateY(-50%);
            width: 1.6mm;
            height: 1.6mm;
            border-radius: 50%;
            background: var(--tag-color, ${COLORS.accent});
          }

          .tag--funnel {
            background: ${COLORS.surface};
            color: ${COLORS.body};
            border: 0.3mm solid ${COLORS.line};
          }

          /* ===== POST CARDS ===== */

          .details-start {
            break-before: page;
            page-break-before: always;
          }

          .post-list {
            display: block;
          }

          .post-card {
            position: relative;
            display: flex;
            gap: 0;
            border: 0.3mm solid ${COLORS.line};
            border-radius: 3mm;
            overflow: hidden;
            background: ${COLORS.white};
            break-inside: avoid;
            page-break-inside: avoid;
            break-after: page;
            page-break-after: always;
            height: 240mm;
          }

          .post-card:last-child {
            break-after: avoid;
            page-break-after: avoid;
          }

          .post-card__index {
            position: absolute;
            top: 4mm;
            right: 6mm;
            display: flex;
            align-items: baseline;
            gap: 0.5mm;
            font-family: "Helvetica Neue", Arial, sans-serif;
            font-weight: 800;
            line-height: 0.9;
            letter-spacing: -0.04em;
            color: var(--accent, ${COLORS.accent});
            opacity: 0.18;
            pointer-events: none;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            z-index: 1;
          }

          .post-card__index-num {
            font-size: 56pt;
          }

          .post-card__index-total {
            font-size: 22pt;
            color: ${COLORS.muted};
            opacity: 0.9;
          }

          .post-card__rail {
            width: 2mm;
            flex-shrink: 0;
            background: var(--accent, ${COLORS.accent});
          }

          .post-card__body {
            flex: 1;
            padding: 6mm 7mm;
            display: flex;
            flex-direction: column;
            min-width: 0;
          }

          .post-card__header {
            margin-bottom: 5mm;
            padding-right: 32mm;
          }

          .post-card__header h3 {
            font-size: 15pt;
            line-height: 1.2;
            color: ${COLORS.ink};
            font-weight: 700;
            margin-top: 1.5mm;
            letter-spacing: -0.005em;
          }

          .post-card__columns {
            display: flex;
            gap: 7mm;
            flex: 1;
            min-height: 0;
          }

          .post-card__col-left {
            width: 60mm;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 4mm;
          }

          .post-card__col-right {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .meta-stack {
            display: flex;
            flex-direction: column;
            gap: 2.5mm;
            border-top: 0.3mm solid ${COLORS.lineSoft};
            padding-top: 3mm;
          }

          .meta-stack > div {
            display: flex;
            flex-direction: column;
          }

          .post-card__thumb {
            width: 60mm;
            height: 60mm;
            object-fit: cover;
            border-radius: 2mm;
            border: 0.3mm solid ${COLORS.line};
            background: ${COLORS.surface};
            flex-shrink: 0;
            display: block;
          }

          .post-card__thumb--placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2.5mm;
            background: ${COLORS.lineSoft};
            border: 0.3mm dashed ${COLORS.mutedSoft};
            color: ${COLORS.muted};
          }

          .post-card__thumb--placeholder svg {
            width: 16mm;
            height: 16mm;
            opacity: 0.55;
          }

          .post-card__thumb--placeholder span {
            font-size: 7.5pt;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            font-weight: 700;
          }

          .post-card__thumb-grid {
            width: 60mm;
            height: 60mm;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 1mm;
            flex-shrink: 0;
            border-radius: 2mm;
            overflow: hidden;
            background: ${COLORS.surface};
          }

          .post-card__thumb-grid__cell {
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;
            border-radius: 1.2mm;
            border: 0.3mm solid ${COLORS.line};
          }

          .post-card__thumb-grid__cell img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .post-card__thumb-grid__counter {
            position: absolute;
            top: 1.2mm;
            right: 1.2mm;
            background: rgba(14, 10, 0, 0.72);
            color: ${COLORS.white};
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.04em;
            padding: 0.6mm 1.6mm;
            border-radius: 999px;
            line-height: 1;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .eyebrow {
            font-size: 7pt;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
          }

          .meta-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 3mm;
            padding: 3mm 0;
            border-top: 0.3mm solid ${COLORS.lineSoft};
            border-bottom: 0.3mm solid ${COLORS.lineSoft};
            margin-bottom: 4mm;
          }

          .meta-label {
            display: block;
            font-size: 6.5pt;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
            margin-bottom: 0.8mm;
          }

          .meta-value {
            display: block;
            font-size: 9pt;
            color: ${COLORS.ink};
            font-weight: 600;
          }

          .content-block + .content-block {
            margin-top: 3mm;
          }

          .content-block--soft {
            background: ${COLORS.surface};
            border-radius: 2mm;
            padding: 3mm 3.5mm;
            border-left: 0.6mm solid ${COLORS.accent};
          }

          .content-block--scroll {
            flex: 1 1 auto;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .content-block--scroll .content-text.legend-text {
            column-gap: 4mm;
            flex: 1 1 auto;
            overflow: hidden;
            margin: 0;
          }

          .content-label {
            font-size: 6.5pt;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
            margin-bottom: 1mm;
          }

          .content-text {
            font-size: 9pt;
            line-height: 1.45;
            color: ${COLORS.body};
          }

          .content-text--lead {
            font-size: 10pt;
            line-height: 1.4;
            color: ${COLORS.ink};
            font-weight: 500;
          }

          .content-text--accent {
            color: ${COLORS.accentDeep};
            font-weight: 600;
            font-size: 8.5pt;
          }

          .content-text--mono {
            font-family: "SF Mono", "Menlo", "Consolas", monospace;
            font-size: 8.5pt;
            color: ${COLORS.muted};
            word-break: break-all;
          }

          @media screen {
            body {
              background: #efe9d8;
              padding: 10mm 0;
            }

            main {
              width: 210mm;
              margin: 0 auto;
              background: ${COLORS.white};
              box-shadow: 0 18px 50px rgba(20, 15, 0, 0.14);
              padding: 16mm;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <section class="page-cover">
            <div class="cover-top">
              <div class="brand-logo">${IOBEE_LOGO_SVG}</div>
              <div class="cover-meta">
                Edição
                <strong>${escapeHtml(format(exportedAt, "MM · yyyy", { locale: ptBR }))}</strong>
              </div>
            </div>

            <div class="cover-hero">
              <span class="cover-eyebrow">Relatório de Conteúdo</span>
              <div class="cover-title">
                ${avatarDataUrl
                  ? `<img class="client-avatar" src="${avatarDataUrl}" alt="${escapeHtml(clientName)}" />`
                  : `<div class="client-avatar client-avatar--fallback">${escapeHtml(clientName.trim().charAt(0) || "?")}</div>`}
                <h1>${escapeHtml(clientName)}</h1>
              </div>
              <p class="cover-note">
                Compilado fiel da produção editorial do período, com resumo executivo e detalhamento por post.${filtersApplied ? " Os dados refletem os filtros de período aplicados." : ""}
              </p>
            </div>

            <div class="cover-divider"></div>

            <div class="stats-grid">
              <div class="stat">
                <span class="stat-label">Posts</span>
                <span class="stat-value">${sortedPosts.length}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Período</span>
                <span class="stat-value stat-value--small">${escapeHtml(periodText)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Analistas</span>
                <span class="stat-value stat-value--small">${escapeHtml(analysts.join(", ") || "—")}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Canais</span>
                <span class="stat-value">${totalChannels}</span>
              </div>
            </div>

            <div class="formats-row">
              <p class="formats-row__label">Distribuição de formatos</p>
              <div class="chip-row">${formatChips}</div>
            </div>

            <div class="funnel-row">
              <div class="funnel-row__head">
                <p class="formats-row__label">Distribuição por etapa do funil</p>
                <span class="funnel-row__total">${funnelTotal} ${funnelTotal === 1 ? "post" : "posts"}</span>
              </div>
              ${funnelTotal > 0
                ? `<div class="funnel-bar">${funnelSegments}</div>
                   <div class="funnel-legend">${funnelLegend}</div>`
                : `<div class="funnel-bar funnel-bar--empty"></div>
                   <p class="funnel-empty">Nenhum post com etapa do funil registrada.</p>`}
            </div>

            <div class="cover-foot">
              <span class="cover-foot__brand">${REPORT_TITLE}</span>
              <span>Gerado em ${escapeHtml(exportedLabel)}</span>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <span class="section-eyebrow">01 · Visão geral</span>
              <h2>Resumo de posts</h2>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Título</th>
                  <th>Formato</th>
                  <th>Funil</th>
                  <th>Canais</th>
                  <th>Analista</th>
                </tr>
              </thead>
              <tbody>${summaryRows}</tbody>
            </table>
          </section>

          <section class="section details-start">
            <div class="post-list">${detailCards}</div>
          </section>
        </main>
      </body>
    </html>`;
}
