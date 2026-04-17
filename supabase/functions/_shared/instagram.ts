// Helpers compartilhados entre edge functions para ler conteúdo do Instagram
// e decodificar entidades HTML em texto extraído de scrape.

export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .trim();
}

export function isInstagramUrl(url: string): boolean {
  return /(?:instagram\.com|instagr\.am)\/(p|reel|reels|tv)\//i.test(url);
}

export function getInstagramShortcode(url: string): string | null {
  const m = url.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : null;
}

export interface InstagramEmbedResult {
  videoUrl: string | null;
  caption: string | null;
  error?: string;
}

/**
 * Lê post/reel público do Instagram usando o User-Agent do crawler do Facebook
 * (facebookexternalhit). Funciona para posts públicos sem precisar de login/API.
 * Retorna caption (via og:description) e videoUrl quando disponível (reels).
 */
export async function fetchInstagramViaEmbed(shortcode: string): Promise<InstagramEmbedResult> {
  const cleanUrl = `https://www.instagram.com/reel/${shortcode}/`;
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)",
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  try {
    const res = await fetch(cleanUrl, { headers, redirect: "follow" });
    if (!res.ok) {
      console.error("Instagram fetch error:", res.status);
      if (res.status === 404) return { videoUrl: null, caption: null, error: "Post não encontrado ou privado." };
      return { videoUrl: null, caption: null, error: `Instagram retornou ${res.status}. O post pode ser privado.` };
    }

    const html = await res.text();

    // Caption via og:description (formato: "X likes, Y comments - user on date: \"caption\"")
    let caption: string | null = null;
    const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    if (ogDesc) {
      const raw = decodeEntities(ogDesc[1]);
      const m = raw.match(/:\s*[“”"]([\s\S]+?)[“”"]?\s*$/) || raw.match(/:\s*"([\s\S]+)"\s*$/);
      caption = (m ? m[1] : raw).trim();
    }

    // Fallback: og:title (alguns posts não tem description)
    if (!caption || caption.length < 20) {
      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
      if (ogTitle) {
        const t = decodeEntities(ogTitle[1]);
        if (t && t.length > 20) caption = t;
      }
    }

    // Video URL via og:video (reels)
    let videoUrl: string | null = null;
    const videoPatterns = [
      /<meta[^>]+property=["']og:video:secure_url["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i,
      /"video_url"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
      /"contentUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/i,
    ];
    for (const re of videoPatterns) {
      const m = html.match(re);
      if (m && m[1]) {
        videoUrl = decodeEntities(m[1]).replace(/\\\//g, "/").replace(/\\u0026/g, "&");
        break;
      }
    }

    if (!caption && !videoUrl) {
      return {
        videoUrl: null,
        caption: null,
        error: "Não foi possível extrair conteúdo deste post. O Instagram bloqueia leitura de posts privados ou via login. Cole o texto manualmente.",
      };
    }

    return { videoUrl, caption };
  } catch (e: any) {
    console.error("Instagram fetch exception:", e);
    return { videoUrl: null, caption: null, error: e?.message || "Erro ao ler o post do Instagram" };
  }
}
