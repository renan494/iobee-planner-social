import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post } from "@/data/posts";

const REPORT_TITLE = "iOBEE Social Lab · Relatório de Conteúdo";

const COLORS = {
  accent: "#FDB600",
  accentSoft: "#FFF4CC",
  dark: "#140F00",
  body: "#463F34",
  muted: "#787364",
  line: "#E8E0CB",
  surface: "#FFF9E6",
  white: "#FFFFFF",
};

export interface ClientReportPrintTemplateOptions {
  clientName: string;
  posts: Post[];
  exportedAt: Date;
  filtersApplied: boolean;
  avatarDataUrl?: string | null;
}

const IOBEE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 233.94" style="width:100%;height:100%"><g><g><path fill="#f9b510" d="M1024.24,219.38v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/><path fill="#f9b510" d="M1080,219.38v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/><path fill="#f9b510" d="M1052.15,170.86v-28.26c0-.14-.07-.26-.19-.33l-24.48-14.13c-.12-.07-.26-.07-.38,0l-24.48,14.13c-.12.07-.19.19-.19.33v28.26c0,.14.07.26.19.33l24.48,14.13c.12.07.26.07.38,0l24.48-14.13c.12-.07.19-.19.19-.33Z"/></g><path fill="#f9b510" d="M289.78,119.19h0c2.42,0,4.34-2.05,4.15-4.47-1.67-21.15-14.93-110.11-119.85-110.11S63.05,86.71,63.13,113.6c0,2.29-1.85,4.14-4.14,4.14h0c-2.4,0-4.3,2.02-4.13,4.42,1.5,21.07,14.06,110.16,119.22,110.16,95.82,0,110.52-75.36,111.55-109.11.07-2.25,1.91-4.02,4.15-4.02ZM89.07,118.63c1.01-12.82.34-75.56,85.01-75.56s85.69,62.75,85.69,75.56-5.4,75.23-85.69,75.23c-87.71,0-84-62.41-85.01-75.23Z"/></g><g><path fill="#140f00" d="M455.65,107.15v.08c0,5.04,3.88,9.17,8.89,9.62,35.17,3.18,53.16,20.12,53.16,46.35,0,73.73-88.07,70.73-88.07,70.73h-117.43V.39h113.43s78.06-4.34,80.07,62.05c.67,26.02-14.35,44.7-50.04,44.7ZM430.97,200.56s50.04,3,50.04-36.7c0-35.36-47.71-34.03-47.71-34.03h-87.74l.33,70.73h85.07ZM418.96,93.8s50.04,1.34,50.04-30.69c0-27.69-48.37-26.69-48.37-26.69h-74.73v57.38h73.06Z"/><g><path fill="#140f00" d="M38.03,65.61v166.96H0V65.61h38.03Z"/><path fill="#140f00" d="M38.03,0v34.59H0V0h38.03Z"/></g><path fill="#140f00" d="M727.03.39h-191.83v233.53h191.83v-36.03l-153.8.33v-65.05h129.44v-32.03h-112.9c-1.87,0-3.38,1.52-3.38,3.38h0c0,1.87-1.51,3.38-3.38,3.38h-.6s-9.2,0-9.2,0v-7.81h0v-63.68h153.81V.39Z"/><path fill="#140f00" d="M936.35.39h-191.83v233.53h191.83v-36.03l-153.8.33v-65.05h129.44v-32.03h-112.9c-1.87,0-3.38,1.52-3.38,3.38h0c0,1.87-1.51,3.38-3.38,3.38h-9.8v-5.83s0-1.98,0-1.98h0v-63.68h153.81V.39Z"/></g></svg>`;

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

  const formatSummary = Object.entries(byFormat)
    .filter(([, count]) => count > 0)
    .map(([postFormat, count]) => `${FORMAT_LABELS[postFormat as keyof typeof FORMAT_LABELS]} · ${count}`)
    .join(" • ") || "Nenhum formato registrado";

  const summaryRows = sortedPosts.length > 0
    ? sortedPosts
        .map(
          (post) => `
            <tr>
              <td>${formatDate(post.date)}</td>
              <td>${escapeHtml(post.title)}</td>
              <td>${escapeHtml(FORMAT_LABELS[post.format])}</td>
              <td>${escapeHtml(FUNNEL_LABELS[post.funnelStage])}</td>
              <td>${escapeHtml((post.channels || []).join(", ") || "—")}</td>
              <td>${escapeHtml(post.analyst)}</td>
            </tr>`,
        )
        .join("")
    : `
      <tr>
        <td>—</td>
        <td>Nenhum post encontrado para este período.</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
        <td>—</td>
      </tr>`;

  const detailCards = sortedPosts.length > 0
    ? sortedPosts
        .map(
          (post, index) => `
            <article class="post-card">
              <div class="post-card__header">
                <div>
                  <p class="eyebrow">Post ${index + 1}</p>
                  <h3>${escapeHtml(post.title)}</h3>
                </div>
                <span class="pill">${escapeHtml(FORMAT_LABELS[post.format])}</span>
              </div>

              <dl class="detail-grid">
                <div><dt>Data</dt><dd>${formatDate(post.date)}</dd></div>
                <div><dt>Funil</dt><dd>${escapeHtml(FUNNEL_LABELS[post.funnelStage])}</dd></div>
                <div><dt>Analista</dt><dd>${escapeHtml(post.analyst)}</dd></div>
                <div><dt>Canais</dt><dd>${escapeHtml((post.channels || []).join(", ") || "—")}</dd></div>
              </dl>

              <div class="content-block">
                <p class="content-label">Headline</p>
                <p>${nl2br(post.headline)}</p>
              </div>

              ${post.legend ? `
                <div class="content-block content-block--soft">
                  <p class="content-label">Legenda</p>
                  <p>${nl2br(post.legend)}</p>
                </div>` : ""}

              ${post.hashtags.length > 0 ? `
                <div class="content-block">
                  <p class="content-label">Hashtags</p>
                  <p>${escapeHtml(post.hashtags.map((tag) => `#${tag}`).join(" "))}</p>
                </div>` : ""}

              ${post.reference ? `
                <div class="content-block">
                  <p class="content-label">Referência</p>
                  <p>${escapeHtml(post.reference)}</p>
                </div>` : ""}
            </article>`,
        )
        .join("")
    : '<article class="post-card"><p>Nenhum conteúdo disponível para exportação.</p></article>';

  const exportedLabel = format(exportedAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(`${clientName} - relatório fiel`)}</title>
        <style>
          @page {
            size: A4;
            margin: 14mm;
          }

          * { box-sizing: border-box; }

          html, body {
            margin: 0;
            padding: 0;
            color: ${COLORS.body};
            font-family: "Helvetica Neue", Arial, sans-serif;
            background: ${COLORS.white};
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            font-size: 11pt;
            line-height: 1.45;
          }

          .page-cover {
            min-height: calc(297mm - 28mm);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            break-after: page;
          }

          .top-bar,
          .section-bar {
            width: 100%;
            height: 6px;
            background: ${COLORS.accent};
            border-radius: 999px;
          }

          .cover-brand {
            margin-top: 18mm;
            font-size: 13pt;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: ${COLORS.dark};
          }

          .cover-content {
            display: grid;
            gap: 8mm;
            max-width: 150mm;
          }

          .cover-kicker,
          .eyebrow,
          .section-label,
          dt {
            margin: 0;
            font-size: 8pt;
            line-height: 1.2;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            color: ${COLORS.muted};
          }

          h1, h2, h3, p {
            margin: 0;
          }

          h1 {
            font-size: 28pt;
            line-height: 1;
            color: ${COLORS.dark};
          }

          h2 {
            font-size: 16pt;
            line-height: 1.15;
            color: ${COLORS.dark};
          }

          h3 {
            font-size: 13pt;
            line-height: 1.2;
            color: ${COLORS.dark};
          }

          .cover-note {
            max-width: 120mm;
            color: ${COLORS.body};
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 4mm;
          }

          .stat-card,
          .post-card,
          .content-block--soft {
            border: 1px solid ${COLORS.line};
            background: ${COLORS.surface};
            border-radius: 4mm;
          }

          .stat-card {
            padding: 4mm;
            min-height: 28mm;
          }

          .section + .section {
            margin-top: 10mm;
          }

          .section-header {
            display: grid;
            gap: 3mm;
            margin-bottom: 5mm;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th, td {
            border: 1px solid ${COLORS.line};
            padding: 2.8mm;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
          }

          th {
            background: ${COLORS.dark};
            color: ${COLORS.white};
            font-size: 8pt;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          tbody tr:nth-child(even) td {
            background: ${COLORS.surface};
          }

          .details-start {
            break-before: page;
            page-break-before: always;
          }

          .post-list {
            display: grid;
            gap: 5mm;
          }

          .post-card {
            padding: 5mm;
            break-inside: avoid;
            page-break-inside: avoid;
            background: ${COLORS.white};
          }

          .post-card__header {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            align-items: flex-start;
            margin-bottom: 4mm;
          }

          .pill {
            flex-shrink: 0;
            border-radius: 999px;
            padding: 1.5mm 3mm;
            background: ${COLORS.accentSoft};
            color: ${COLORS.dark};
            font-size: 8pt;
            font-weight: 700;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 3mm 4mm;
            margin: 0 0 4mm;
          }

          dd {
            margin: 1mm 0 0;
            color: ${COLORS.dark};
            font-weight: 500;
          }

          .content-block {
            margin-top: 3mm;
          }

          .content-block--soft {
            padding: 3mm;
          }

          .content-label {
            margin-bottom: 1mm;
            font-size: 8pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: ${COLORS.muted};
          }

          .meta-footer {
            display: flex;
            justify-content: space-between;
            gap: 4mm;
            font-size: 8.5pt;
            color: ${COLORS.muted};
          }

          @media screen {
            body {
              background: #f6f1e5;
              padding: 8mm 0;
            }

            main {
              width: 210mm;
              margin: 0 auto;
              background: ${COLORS.white};
              box-shadow: 0 12px 40px rgba(20, 15, 0, 0.12);
              padding: 14mm;
            }
          }
        </style>
      </head>
      <body>
        <main>
          <section class="page-cover">
            <div>
              <div class="top-bar"></div>
              <p class="cover-brand">iOBEE Social Lab</p>
            </div>

            <div class="cover-content">
              <p class="cover-kicker">Relatório de Conteúdo</p>
              <h1>${escapeHtml(clientName)}</h1>
              <p class="cover-note">
                Versão simplificada e fiel para exportação em PDF, priorizando consistência visual e abertura sem falhas.
                ${filtersApplied ? " Relatório gerado com filtros de período aplicados." : ""}
              </p>

              <div class="stats-grid">
                <article class="stat-card">
                  <p class="eyebrow">Posts</p>
                  <h2>${sortedPosts.length}</h2>
                </article>
                <article class="stat-card">
                  <p class="eyebrow">Período</p>
                  <p>${escapeHtml(periodText)}</p>
                </article>
                <article class="stat-card">
                  <p class="eyebrow">Analistas</p>
                  <p>${escapeHtml(analysts.join(", ") || "—")}</p>
                </article>
              </div>

              <div>
                <p class="eyebrow">Distribuição de formatos</p>
                <p>${escapeHtml(formatSummary)}</p>
              </div>
            </div>

            <div class="meta-footer">
              <span>${REPORT_TITLE}</span>
              <span>Gerado em ${escapeHtml(exportedLabel)}</span>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <div class="section-bar"></div>
              <p class="section-label">Resumo editorial</p>
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
            <div class="section-header">
              <div class="section-bar"></div>
              <p class="section-label">Detalhamento dos posts</p>
              <h2>Conteúdo detalhado</h2>
            </div>

            <div class="post-list">${detailCards}</div>
          </section>
        </main>
      </body>
    </html>`;
}