export type PostFormat = "static" | "carousel" | "reels" | "stories";
export type FunnelStage = "topo" | "meio" | "fundo";

export interface Post {
  id: string;
  client: string;
  analyst: string;
  title: string;
  headline: string;
  format: PostFormat;
  funnelStage: FunnelStage;
  date: string; // YYYY-MM-DD
  hashtags: string[];
  legend?: string;
  artUrl?: string;
  artUrls?: string[];
  channels?: string[];
}

export const CHANNEL_OPTIONS = [
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "X",
  "YouTube",
  "Pinterest",
] as const;

export const FORMAT_LABELS: Record<PostFormat, string> = {
  static: "Estático",
  carousel: "Carrossel",
  reels: "Reels",
  stories: "Stories",
};

export const FUNNEL_LABELS: Record<FunnelStage, string> = {
  topo: "Topo",
  meio: "Meio",
  fundo: "Fundo",
};

export const samplePosts: Post[] = [
  // ABRIL - Salt Segurança
  { id: "salt-abr-01", client: "Salt Segurança", analyst: "Maria Julya", title: "O custo invisível da portaria", headline: "O que o seu condomínio gasta e não vê?", format: "static", funnelStage: "topo", date: "2026-04-01", hashtags: ["SaltSeguranca", "PortariaRemota", "SegurancaEletronica"], legend: "Síndico, você já parou para calcular o custo real de uma falha humana na portaria?" },
  { id: "salt-abr-02", client: "Salt Segurança", analyst: "Julia", title: "Decisores — Por que escolhem a Salt?", headline: "Por que grandes projetos escolhem a Salt?", format: "static", funnelStage: "fundo", date: "2026-04-03", hashtags: ["SegurancaCorporativa", "Automacao", "SaltSeguranca"], legend: "No mercado de segurança, promessas são fáceis. Entrega técnica e suporte ágil são raros." },
  { id: "salt-abr-03", client: "Salt Segurança", analyst: "Maria Julya", title: "Cidades Inteligentes", headline: "Segurança 360º: Onde o privado e o público se encontram", format: "static", funnelStage: "topo", date: "2026-04-07", hashtags: ["SegurancaUrbana", "VigilanciaIntegrada", "SmartSampa"] },
  { id: "salt-abr-04", client: "Salt Segurança", analyst: "Julia", title: "O Ecossistema Salt", headline: "Segurança não é um produto. É um ecossistema.", format: "carousel", funnelStage: "fundo", date: "2026-04-10", hashtags: ["SegurancaEmpresarial", "AutomacaoPredial", "SaltSeguranca"] },
  { id: "salt-abr-05", client: "Salt Segurança", analyst: "Maria Julya", title: "O Perigo do Acesso Facilitado", headline: "Onde a segurança da sua empresa termina?", format: "carousel", funnelStage: "meio", date: "2026-04-14", hashtags: ["ControleDeAcesso", "GestaoDeEmpresas", "SaltSeguranca"] },
  { id: "salt-abr-06", client: "Salt Segurança", analyst: "Julia", title: "Portaria Remota — Gravação com cliente", headline: "Portaria Remota na prática", format: "reels", funnelStage: "meio", date: "2026-04-17", hashtags: ["PortariaRemota", "SaltSeguranca"] },
  { id: "salt-abr-07", client: "Salt Segurança", analyst: "Maria Julya", title: "Depoimento de Cliente", headline: "O que nossos clientes dizem", format: "reels", funnelStage: "topo", date: "2026-04-22", hashtags: ["DepoimentoCliente", "SaltSeguranca"] },
  { id: "salt-abr-08", client: "Salt Segurança", analyst: "Julia", title: "Vídeo App — Como retirar entrega", headline: "Como retirar sua entrega pelo app", format: "reels", funnelStage: "topo", date: "2026-04-25", hashtags: ["AppSalt", "SaltSeguranca"] },
  // MAIO - Salt Segurança
  { id: "salt-mai-01", client: "Salt Segurança", analyst: "Maria Julya", title: "Psicologia da Oportunidade", headline: "O invasor não escolhe o alvo mais rico", format: "static", funnelStage: "topo", date: "2026-05-05", hashtags: ["PrevencaoDeCrimes", "SegurancaAtiva", "SaltSeguranca"] },
  { id: "salt-mai-02", client: "Salt Segurança", analyst: "Julia", title: "A Falácia da Cerca Elétrica", headline: "Sua cerca elétrica pode fazer muito mais", format: "static", funnelStage: "topo", date: "2026-05-08", hashtags: ["CercaEletrica", "EstrategiaDeSeguranca", "SaltSeguranca"] },
  { id: "salt-mai-03", client: "Salt Segurança", analyst: "Maria Julya", title: "Monitoramento de App sem central", headline: "Você é o seu próprio vigilante?", format: "static", funnelStage: "meio", date: "2026-05-12", hashtags: ["MonitoramentoInteligente", "SaltSeguranca"] },
  { id: "salt-mai-04", client: "Salt Segurança", analyst: "Julia", title: "O Ponto Cego da Gestão", headline: "3 sinais de que a segurança ficou no passado", format: "carousel", funnelStage: "meio", date: "2026-05-15", hashtags: ["GestaoCondominial", "SaltSeguranca"] },
  { id: "salt-mai-05", client: "Salt Segurança", analyst: "Maria Julya", title: "Integração Perímetro + Monitoramento", headline: "Seu sistema conversa entre si?", format: "carousel", funnelStage: "fundo", date: "2026-05-19", hashtags: ["IntegracaoSeguranca", "SaltSeguranca"] },
  { id: "salt-mai-06", client: "Salt Segurança", analyst: "Julia", title: "Instalação em obra — Timelapse", headline: "Do zero à segurança total", format: "reels", funnelStage: "meio", date: "2026-05-22", hashtags: ["ObraSegura", "SaltSeguranca"] },
  { id: "salt-mai-07", client: "Salt Segurança", analyst: "Maria Julya", title: "Como funciona o Monitoramento 24h", headline: "Central de monitoramento por dentro", format: "reels", funnelStage: "topo", date: "2026-05-26", hashtags: ["Monitoramento24h", "SaltSeguranca"] },
  { id: "salt-mai-08", client: "Salt Segurança", analyst: "Julia", title: "Dia das Mães — Institucional", headline: "Proteção que vem do coração", format: "static", funnelStage: "topo", date: "2026-05-10", hashtags: ["DiaDasMaes", "SaltSeguranca"] },
  // JUNHO - Salt Segurança
  { id: "salt-jun-01", client: "Salt Segurança", analyst: "Maria Julya", title: "Case de Sucesso — Condomínio", headline: "Como reduzimos 70% dos incidentes", format: "carousel", funnelStage: "fundo", date: "2026-06-02", hashtags: ["CaseDeSucesso", "SaltSeguranca"] },
  { id: "salt-jun-02", client: "Salt Segurança", analyst: "Julia", title: "Segurança para Empresas", headline: "O kit completo para proteger sua operação", format: "static", funnelStage: "fundo", date: "2026-06-05", hashtags: ["SegurancaCorporativa", "SaltSeguranca"] },
  { id: "salt-jun-03", client: "Salt Segurança", analyst: "Maria Julya", title: "Bastidores da central de monitoramento", headline: "24h por você — veja como funciona", format: "reels", funnelStage: "topo", date: "2026-06-09", hashtags: ["Bastidores", "SaltSeguranca"] },
  { id: "salt-jun-04", client: "Salt Segurança", analyst: "Julia", title: "Dia dos Namorados — Institucional", headline: "Segurança é cuidar de quem você ama", format: "static", funnelStage: "topo", date: "2026-06-12", hashtags: ["DiaDosNamorados", "SaltSeguranca"] },
  // Firebull
  { id: "firebull-abr-01", client: "Firebull", analyst: "Maria Julya", title: "Lançamento Campanha Captação", headline: "Nova fase de captação", format: "static", funnelStage: "topo", date: "2026-04-02", hashtags: ["Firebull", "Captacao"] },
  { id: "firebull-abr-02", client: "Firebull", analyst: "Julia", title: "Resultados Q1", headline: "O trimestre que mudou o jogo", format: "carousel", funnelStage: "fundo", date: "2026-04-08", hashtags: ["Firebull", "Resultados"] },
  { id: "firebull-abr-03", client: "Firebull", analyst: "Maria Julya", title: "Bastidores da equipe", headline: "Conheça quem faz acontecer", format: "reels", funnelStage: "topo", date: "2026-04-15", hashtags: ["Firebull", "Bastidores"] },
  { id: "firebull-mai-01", client: "Firebull", analyst: "Julia", title: "Novidades de Maio", headline: "O que vem por aí", format: "stories", funnelStage: "meio", date: "2026-05-03", hashtags: ["Firebull", "Novidades"] },
  { id: "firebull-mai-02", client: "Firebull", analyst: "Maria Julya", title: "Promoção de Maio", headline: "Aproveite as condições especiais", format: "static", funnelStage: "fundo", date: "2026-05-14", hashtags: ["Firebull", "Promocao"] },
];

export function getClients(posts: Post[]): string[] {
  return [...new Set(posts.map((p) => p.client))].sort();
}

export function getAnalysts(posts: Post[]): string[] {
  return [...new Set(posts.map((p) => p.analyst))].sort();
}
