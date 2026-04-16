import { Target, Flame, Sparkles, type LucideIcon } from "lucide-react";

export type Framework = "pas" | "aida" | "bab";

export interface FrameworkSection {
  key: string;
  label: string;
  placeholder: string;
  description: string;
}

export interface FrameworkConfig {
  label: string;
  description: string;
  explanation: string;
  icon: LucideIcon;
  when: string;
  works: string[];
  insight: string;
  sections: FrameworkSection[];
}

export const FRAMEWORKS: Record<Framework, FrameworkConfig> = {
  pas: {
    label: "PAS",
    description: "Problema → Agitação → Solução",
    explanation:
      "O framework da dor e urgência. Você começa identificando o problema real do público, depois agita essa dor — torna emocional, mostra consequências, faz a pessoa sentir que precisa agir. Por fim, apresenta a solução como o caminho natural.",
    icon: Flame,
    when: "Quando quer gerar dor e urgência",
    works: ["Reels com dor forte", "Anúncios de serviço", "Posts de venda direta"],
    insight: "Se a agitação não for emocional, a copy morre.",
    sections: [
      { key: "gancho", label: "🪝 Gancho (Hook)", placeholder: "Ex: Você sabia que 9 em cada 10 negócios perdem dinheiro com tráfego pago?", description: "Os primeiros 3 segundos. A frase que para o scroll." },
      { key: "problema", label: "😰 Problema", placeholder: "Ex: Você posta todo dia e o engajamento não sobe.", description: "Identifique a dor real do público." },
      { key: "agitacao", label: "🔥 Agitação", placeholder: "Ex: Enquanto você tenta entender o algoritmo sozinho, seu concorrente já está vendendo todo dia pelo Instagram...", description: "Aperte a dor. Torne emocional e urgente." },
      { key: "solucao", label: "✅ Solução", placeholder: "Ex: Existe um método validado pra crescer no Instagram com conteúdo estratégico. E começa com 1 ajuste simples.", description: "Apresente a saída." },
      { key: "cta", label: "🚀 CTA", placeholder: "Ex: Comenta 'EU QUERO' aqui embaixo que eu te mando o passo a passo no direct.", description: "Chamada para ação contextualizada ao formato social." },
      { key: "texto_anuncio", label: "📝 Legenda do Post / Anúncio", placeholder: "Ex: 🔥 Cansou de postar e ninguém comprar?\n\nA maioria dos perfis perde vendas porque não tem método.\n\n✅ Descubra o passo a passo que já gerou +R$2M.\n\n👉 Comenta 'EU QUERO' que eu te mando.", description: "A legenda final pronta pra publicar (diferente do roteiro do vídeo)." },
    ],
  },
  aida: {
    label: "AIDA",
    description: "Atenção → Interesse → Desejo → Ação",
    explanation:
      "O modelo mais clássico de copywriting, adaptado pra social. Captura a atenção com hook (3 primeiros segundos), gera interesse com identificação, desperta o desejo mostrando o benefício real (não a feature) e fecha com CTA direto.",
    icon: Target,
    when: "Topo e meio de funil — Reels e criativos de Meta Ads",
    works: ["Reels", "Stories", "Meta Ads (feed)", "Carrosséis"],
    insight: "A maioria erra no Desejo — fala feature, não benefício.",
    sections: [
      { key: "atencao", label: "🎯 Atenção (Hook)", placeholder: "Ex: 80% dos perfis pequenos cometem esse erro sem perceber.", description: "Primeiros 3 segundos. O gancho que para o scroll." },
      { key: "interesse", label: "💡 Interesse (Contexto)", placeholder: "Ex: Você posta, posta, posta — e o alcance só cai. Já passou por isso?", description: "Faça a pessoa pensar 'isso sou eu'." },
      { key: "desejo", label: "🔥 Desejo (Benefício)", placeholder: "Ex: Imagina abrir o Insights e ver alcance subindo 3x sem precisar pagar anúncio.", description: "Benefício claro e visualizável. O que muda na vida da pessoa." },
      { key: "acao", label: "🚀 Ação (CTA)", placeholder: "Ex: Salva esse post e segue o perfil pra mais conteúdo de crescimento orgânico.", description: "CTA direto e contextualizado ao formato." },
      { key: "texto_anuncio", label: "📝 Legenda do Post / Anúncio", placeholder: "Ex: 🎯 80% dos perfis travam aqui.\n\nNão é o algoritmo — é a falta de estratégia.\n\n✅ Método validado com +500 perfis.\n\n👉 Salva e compartilha.", description: "A legenda final pronta pra publicar." },
    ],
  },
  bab: {
    label: "BAB",
    description: "Before → After → Bridge",
    explanation:
      "O modelo de transformação. Mostra o 'antes' (situação de dor), pinta o 'depois' (cenário ideal) e constrói a 'ponte' — o caminho. Ideal pra storytelling, conteúdo orgânico e marca pessoal no Instagram.",
    icon: Sparkles,
    when: "Storytelling, marca pessoal e conteúdo orgânico",
    works: ["Reels narrativos", "Carrosséis de transformação", "Stories sequenciais"],
    insight: "Perfeito pra Instagram e marca pessoal.",
    sections: [
      { key: "gancho", label: "🪝 Gancho (Hook)", placeholder: "Ex: Ela saiu de 200 pra 50k seguidores em 90 dias. Quer saber como?", description: "Os primeiros 3 segundos." },
      { key: "before", label: "😔 Before (Situação atual)", placeholder: "Ex: Há 6 meses ela postava todo dia e não passava de 50 curtidas.", description: "Descreva a dor / situação atual com cena específica." },
      { key: "after", label: "🌟 After (Cenário ideal)", placeholder: "Ex: Hoje cada Reels passa de 100k visualizações no automático.", description: "Pinte o cenário ideal. O que muda depois." },
      { key: "bridge", label: "🌉 Bridge (Como chegar lá)", placeholder: "Ex: O que mudou? Trocar 'postar todo dia' por 'postar com método'. E eu posso te mostrar exatamente como.", description: "A ponte: como sair do antes pro depois." },
      { key: "cta", label: "🚀 CTA", placeholder: "Ex: Comenta 'MÉTODO' que eu te mando o passo a passo.", description: "CTA contextualizado." },
      { key: "texto_anuncio", label: "📝 Legenda do Post / Anúncio", placeholder: "Ex: Ela postava todo dia. Nada acontecia.\n\nAté trocar 'postar' por 'postar com método'.\n\n🌟 De 200 a 50k em 90 dias.\n\n👉 Comenta 'MÉTODO'.", description: "A legenda final pronta pra publicar." },
    ],
  },
};

export const FORMATS = [
  { value: "reels", label: "Reels / Stories" },
  { value: "feed_post", label: "Post de Feed (Foto/Carrossel)" },
  { value: "meta_ads", label: "Meta Ads (Anúncio)" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn (Post)" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail Marketing" },
  { value: "organico", label: "Conteúdo Orgânico Geral" },
];
