import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  decodeEntities,
  fetchInstagramViaEmbed,
  getInstagramShortcode,
  isInstagramUrl,
} from "../_shared/instagram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 500, code?: string) {
  return jsonResponse({ error: message, code }, status);
}

function extractFailureResponse(message: string, code: string) {
  return jsonResponse({ error: message, code, fallback: true }, 200);
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function isMetaAdLibrary(url: string): boolean {
  return /(?:facebook|fb)\.com\/ads\/library/i.test(url);
}


async function fetchScrapeRaw(url: string, waitFor = 3500): Promise<{ markdown: string | null; error?: string }> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) return { markdown: null, error: "Firecrawl não configurado." };

  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { Authorization: `Bearer ${FIRECRAWL_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "rawHtml"], onlyMainContent: false, waitFor }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Firecrawl error:", res.status, errText);
      if (res.status === 402) return { markdown: null, error: "Créditos do Firecrawl esgotados." };
      return { markdown: null, error: `Firecrawl retornou ${res.status}` };
    }

    const data = await res.json();
    const markdown = data?.data?.markdown || data?.markdown || "";
    const rawHtml = data?.data?.rawHtml || data?.rawHtml || "";
    const combined = `${markdown}\n\n<!-- RAW_HTML -->\n${rawHtml}`;
    if (combined.length < 50) return { markdown: null, error: "Não foi possível extrair conteúdo." };
    return { markdown: combined };
  } catch (e: any) {
    console.error("Firecrawl exception:", e);
    return { markdown: null, error: e?.message || "Erro ao chamar Firecrawl" };
  }
}

function extractMetaAdCopy(combined: string): string {
  let adText = combined.split("<!-- RAW_HTML -->")[0] || combined;

  const sponsoredMatch = adText.match(/\*\*\s*(Sponsored|Patrocinado)\s*\*\*/i);
  if (sponsoredMatch && sponsoredMatch.index !== undefined) {
    adText = adText.slice(sponsoredMatch.index + sponsoredMatch[0].length);
  } else {
    const libIdMatch = adText.match(/Library ID:\s*\d+[\s\S]{0,500}?\n\n/i);
    if (libIdMatch && libIdMatch.index !== undefined) {
      adText = adText.slice(libIdMatch.index + libIdMatch[0].length);
    }
  }
  const closeIdx = adText.search(/\n+\s*Close\s*$/im);
  if (closeIdx > 0) adText = adText.slice(0, closeIdx);

  return cleanText(adText);
}

function extractInstagramCaption(combined: string): string {
  let text = combined.split("<!-- RAW_HTML -->")[0] || combined;
  text = text
    .replace(/Log in[\s\S]*?Continue/gi, "")
    .replace(/Sign up[\s\S]*?account/gi, "")
    .replace(/See translation/gi, "")
    .replace(/View all \d+ comments?/gi, "")
    .replace(/More from \w+/gi, "");
  return cleanText(text);
}

function cleanText(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/Sorry, we're having trouble playing this video\.?/gi, "")
    .replace(/Learn more/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\\\\/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function extractVideoUrl(combined: string): string | null {
  const html = combined.split("<!-- RAW_HTML -->")[1] || combined;
  const patterns = [
    /"video_hd_url"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
    /"video_sd_url"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
    /"playable_url_quality_hd"\s*:\s*"([^"]+)"/i,
    /"playable_url"\s*:\s*"([^"]+)"/i,
    /"browser_native_hd_url"\s*:\s*"([^"]+)"/i,
    /"browser_native_sd_url"\s*:\s*"([^"]+)"/i,
    /"video_url"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
    /"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
    /"(https:\\?\/\\?\/[^"]*?(?:fbcdn|cdninstagram)\.[^"]*?\.mp4[^"]*?)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const url = m[1].replace(/\\\//g, "/").replace(/\\u0026/g, "&").replace(/\\"/g, '"');
      if (url.startsWith("https://")) {
        console.log("Extracted video URL via pattern:", re.source.slice(0, 60));
        return url;
      }
    }
  }
  return null;
}

async function transcribeVideoWithGemini(videoUrl: string): Promise<{ transcript: string | null; error?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return { transcript: null, error: "LOVABLE_API_KEY não configurada" };

  try {
    console.log("Downloading video from:", videoUrl.slice(0, 120));
    const videoRes = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.facebook.com/",
      },
    });
    if (!videoRes.ok) return { transcript: null, error: `Falha ao baixar vídeo (HTTP ${videoRes.status})` };

    const buf = await videoRes.arrayBuffer();
    const sizeMB = buf.byteLength / (1024 * 1024);
    console.log(`Video size: ${sizeMB.toFixed(2)} MB`);
    if (buf.byteLength > 18 * 1024 * 1024) {
      return { transcript: null, error: `Vídeo muito grande (${sizeMB.toFixed(1)}MB). Limite: 18MB.` };
    }

    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
    }
    const base64 = btoa(binary);
    const dataUrl = `data:video/mp4;base64,${base64}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Transcreva EXATAMENTE a fala (áudio) deste vídeo em português brasileiro. Regras:\n\n1. Transcreva APENAS o áudio falado, palavra por palavra, com pontuação natural e quebras de parágrafo entre blocos de fala.\n2. NÃO descreva o vídeo, NÃO adicione comentários, NÃO traduza.\n3. NÃO inclua texto sobreposto na tela (legendas burn-in) se for IGUAL ou MUITO PARECIDO com a fala — isso causa duplicação. IGNORE-A.\n4. Use [colchetes] APENAS para texto visual REALMENTE diferente da fala (ex: nome de marca em placa, telefone, CTA visual tipo 'CLIQUE AQUI', preço na tela). Se na dúvida, NÃO use colchetes.\n5. Se o vídeo não tiver fala, responda apenas: SEM_FALA",
              },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Gemini transcription error:", response.status, errText);
      if (response.status === 429) return { transcript: null, error: "Limite de requisições da IA atingido." };
      if (response.status === 402) return { transcript: null, error: "Créditos da IA esgotados." };
      return { transcript: null, error: `IA retornou ${response.status}` };
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || "";
    if (!text || text === "SEM_FALA" || text.length < 10) {
      return { transcript: null, error: "Vídeo sem fala detectada." };
    }
    return { transcript: text };
  } catch (e: any) {
    console.error("transcribeVideoWithGemini exception:", e);
    return { transcript: null, error: e?.message || "Erro ao transcrever vídeo" };
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .trim();
}

function parseTimedTextXML(xml: string): string {
  const matches = xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g);
  const lines: string[] = [];
  for (const m of matches) {
    const decoded = decodeEntities(m[1].replace(/<[^>]+>/g, ""));
    if (decoded) lines.push(decoded);
  }
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

async function tryTimedTextDirect(videoId: string): Promise<string | null> {
  for (const lang of ["pt-BR", "pt", "en", "es"]) {
    for (const kind of ["", "&kind=asr"]) {
      try {
        const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}${kind}`;
        const res = await fetch(url);
        if (!res.ok) continue;
        const xml = await res.text();
        if (!xml || xml.length < 50) continue;
        const transcript = parseTimedTextXML(xml);
        if (transcript.length > 30) return transcript;
      } catch {}
    }
  }
  return null;
}

async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=pt-BR`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (watchRes.ok) {
      const html = await watchRes.text();
      const match = html.match(/"captionTracks":(\[.*?\])/);
      if (match) {
        try {
          const tracks = JSON.parse(match[1]);
          if (tracks.length) {
            const track =
              tracks.find((t: any) => t.languageCode?.startsWith("pt")) ||
              tracks.find((t: any) => t.languageCode?.startsWith("en")) ||
              tracks[0];
            if (track?.baseUrl) {
              const baseUrl = track.baseUrl.replace(/\\u0026/g, "&");
              const captionRes = await fetch(baseUrl);
              if (captionRes.ok) {
                const xml = await captionRes.text();
                const transcript = parseTimedTextXML(xml);
                if (transcript.length > 30) return transcript;
              }
            }
          }
        } catch (e) { console.error("captionTracks parse error:", e); }
      }
    }
  } catch (e) { console.error("watch page fetch error:", e); }
  return await tryTimedTextDirect(videoId);
}

async function callAI(messages: Array<{ role: string; content: string }>, temperature = 0.7) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages, temperature }),
  });

  if (!response.ok) {
    if (response.status === 429) throw { status: 429, message: "Limite de requisições atingido." };
    if (response.status === 402) throw { status: 402, message: "Créditos da IA esgotados." };
    throw new Error("Erro na geração com IA");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function buildAnalysisPrompt(transcript: string, contextoExtra: string) {
  return `Você é um copywriter sênior com cabeça de social media strategist. Você analisa criativos de referência (Reels, posts virais, anúncios da Meta, vídeos do YouTube) e gera VARIAÇÕES novas mantendo a essência da mensagem mas com nova roupagem — pronto pra postar nas redes sociais brasileiras.

## TRANSCRIÇÃO / COPY ORIGINAL:
"""
${transcript.slice(0, 6000)}
"""

${contextoExtra ? `## CONTEXTO ADICIONAL:\n${contextoExtra}\n` : ""}

## SUA TAREFA — ENGENHARIA REVERSA:

### Etapa 1: ANÁLISE
Identifique no original:
- **Promessa central**: o que está sendo prometido
- **Público-alvo**: para quem está falando
- **Hook usado**: o gancho dos primeiros segundos (o que parou o scroll)
- **Estrutura narrativa**: como a mensagem se desenvolve
- **CTA**: a chamada para ação final
- **Tom de voz**: formal, casual, agressivo, consultivo, divertido, etc.

### Etapa 2: NOVO ROTEIRO
Reescreva do zero um roteiro NOVO mantendo a essência da mensagem central, mas com:
- **Novo hook** (obrigatoriamente diferente do original — pense em parar o scroll no feed)
- **Nova estrutura narrativa** (não copie a sequência do original)
- **Novo CTA** (mesma intenção, palavras diferentes, contextualizado para social)

### Etapa 3: 3 HOOKS ALTERNATIVOS PARA TESTE A/B
Crie 3 hooks ADICIONAIS, cada um com um ângulo psicológico DIFERENTE entre si (ex: pergunta provocativa, declaração polêmica, dado surpreendente, história em 1ª pessoa, contradição, antes/depois). Cada hook deve ter no MÁXIMO 2 frases curtas — pronto pra ser falado nos primeiros 3 segundos do vídeo.

NÃO use frameworks rígidos. Construa o roteiro de forma natural, fluida, como um copywriter que vive no Instagram escreveria — priorizando ritmo, clareza e conexão.

## FORMATO DE RESPOSTA (JSON):
{
  "analise": {
    "promessa": "...",
    "publico": "...",
    "hook_original": "...",
    "estrutura": "...",
    "cta_original": "...",
    "tom": "..."
  },
  "variacao": {
    "novo_hook": "...",
    "roteiro": "Roteiro completo do novo vídeo, formatado em parágrafos curtos como falaria na câmera. Use quebras de linha (\\n\\n) entre os blocos.",
    "novo_cta": "...",
    "duracao_estimada": "Ex: 30-45 segundos",
    "observacoes": "Dicas de gravação, entonação, cortes ou b-roll sugeridos"
  },
  "hooks_alternativos": [
    { "hook": "...", "angulo": "Ex: Pergunta provocativa" },
    { "hook": "...", "angulo": "Ex: Dado surpreendente" },
    { "hook": "...", "angulo": "Ex: História em 1ª pessoa" }
  ]
}

REGRAS:
- Português do Brasil, linguagem natural e falada
- Roteiro pronto pra gravar (sem marcações técnicas de câmera)
- Mantenha a essência da promessa, mude completamente a embalagem
- Sem clichês, sem frases genéricas
- Responda APENAS o JSON, sem markdown.`;
}

function parseJSON(content: string) {
  const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { action, url, transcript, contexto_extra } = body;

    if (action === "extract") {
      if (!url || typeof url !== "string") return errorResponse("URL é obrigatória", 400);
      const transcribeAudio: boolean = body.transcribe_audio !== false;

      // Meta Ad Library — scrape + transcrever áudio do MP4
      if (isMetaAdLibrary(url)) {
        const { markdown, error } = await fetchScrapeRaw(url);
        if (!markdown) return extractFailureResponse(error || "Não foi possível ler este anúncio.", "META_SCRAPE_FAILED");

        const writtenCopy = extractMetaAdCopy(markdown);
        let videoTranscript: string | null = null;
        let videoError: string | undefined;

        if (transcribeAudio) {
          const videoUrl = extractVideoUrl(markdown);
          if (videoUrl) {
            const result = await transcribeVideoWithGemini(videoUrl);
            videoTranscript = result.transcript;
            videoError = result.error;
          } else {
            videoError = "Vídeo não encontrado no anúncio (pode ser apenas imagem).";
          }
        }

        const finalTranscript = videoTranscript || writtenCopy;
        if (!finalTranscript || finalTranscript.length < 30) {
          return extractFailureResponse(videoError || "Anúncio sem texto suficiente. Cole manualmente.", "META_SCRAPE_FAILED");
        }

        return jsonResponse({
          transcript: finalTranscript,
          source: "meta_ad_library",
          transcript_kind: videoTranscript ? "audio" : "written",
          written_copy: writtenCopy || null,
          video_warning: videoTranscript ? null : videoError,
        });
      }

      // Instagram — embed scrape + fallback + transcrever áudio
      if (isInstagramUrl(url)) {
        const shortcode = getInstagramShortcode(url);
        if (!shortcode) return errorResponse("URL do Instagram inválida.", 400, "INSTAGRAM_INVALID_URL");

        const { videoUrl, caption, error: embedError } = await fetchInstagramViaEmbed(shortcode);
        const writtenCopy = caption ? cleanText(caption) : "";

        let videoTranscript: string | null = null;
        let videoError: string | undefined = embedError;

        if (transcribeAudio && videoUrl) {
          const result = await transcribeVideoWithGemini(videoUrl);
          videoTranscript = result.transcript;
          if (!videoTranscript) videoError = result.error;
        } else if (transcribeAudio && !videoUrl) {
          videoError = embedError || "Vídeo não encontrado (Instagram pode ter bloqueado o scrape ou é foto/carrossel).";
        }

        const finalTranscript = videoTranscript || writtenCopy;
        if (!finalTranscript || finalTranscript.length < 30) {
          return extractFailureResponse(
            videoError || "Não foi possível extrair conteúdo deste post. Cole a transcrição manualmente na aba 'Transcrição manual'.",
            "INSTAGRAM_SCRAPE_FAILED"
          );
        }

        return jsonResponse({
          transcript: finalTranscript,
          source: "instagram",
          transcript_kind: videoTranscript ? "audio" : "written",
          written_copy: writtenCopy || null,
          video_warning: videoTranscript ? null : videoError,
        });
      }

      // YouTube — captions
      const ytId = getYouTubeId(url);
      if (!ytId) return extractFailureResponse("URL não suportada. Use Meta Ad Library, Instagram (post/reel) ou YouTube — ou cole o texto manualmente.", "UNSUPPORTED_PLATFORM");

      const transcriptText = await fetchYouTubeTranscript(ytId);
      if (!transcriptText) return extractFailureResponse("Não foi possível extrair a legenda deste vídeo. Cole a transcrição manualmente.", "NO_CAPTIONS");

      return jsonResponse({ transcript: transcriptText, source: "youtube" });
    }

    if (action === "generate") {
      if (!transcript || typeof transcript !== "string" || transcript.trim().length < 30) return errorResponse("Transcrição muito curta ou ausente.", 400);

      const prompt = buildAnalysisPrompt(transcript, contexto_extra || "");
      const content = await callAI([
        { role: "system", content: "Você é um copywriter sênior com cabeça de social media. Responda APENAS em JSON válido." },
        { role: "user", content: prompt },
      ]);

      const result = parseJSON(content);
      return new Response(JSON.stringify({ result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return errorResponse("Action inválida. Use 'extract' ou 'generate'.", 400);
  } catch (error: any) {
    console.error("reverse-engineer-copy error:", error);
    const status = error?.status || 500;
    const message = error?.message || (error instanceof Error ? error.message : "Erro desconhecido");
    return errorResponse(message, status);
  }
});
