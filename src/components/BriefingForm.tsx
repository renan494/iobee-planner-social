import { useRef, useState, useEffect } from "react";
import { Folder, Pencil, Trash2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type SocialNetworkKey =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "facebook"
  | "pinterest"
  | "threads";

const SOCIAL_NETWORK_OPTIONS: { key: SocialNetworkKey; label: string }[] = [
  { key: "instagram", label: "Instagram" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "facebook", label: "Facebook" },
  { key: "pinterest", label: "Pinterest" },
  { key: "threads", label: "Threads" },
];

export interface BriefingFormValues {
  name: string;
  niche: string;
  /** Frequência de postagem desejada (ex: "5x por semana") */
  postingFrequency: string;
  /** Redes sociais ativas / prioritárias */
  socialNetworks: SocialNetworkKey[];
  targetAudience: string;
  /** Dores, desejos e objeções do público */
  audiencePains: string;
  /** Objetivo macro de social media */
  objective: string;
  /** Oferta principal / produto-âncora a vender no social */
  mainOffer: string;
  competitors: string;
  /** Perfis de referência que admira */
  successReferences: string;
  toneOfVoice: string;
  /** Pilares de conteúdo (Educacional, Bastidores, Vendas...) */
  contentPillars: string;
  /** CTAs preferidos (DM, link na bio, "comente AQUI"...) */
  ctaPreferences: string;
  differentials: string;
  productsServices: string;
  brandValues: string;
  currentSocialPresence: string;
  /** Tópicos / palavras proibidas */
  bannedTopics: string;
  /** Hashtags base da marca */
  hashtagsBase: string;
  instagramHandle: string;
}

export const emptyBriefing: BriefingFormValues = {
  name: "",
  niche: "",
  postingFrequency: "",
  socialNetworks: [],
  targetAudience: "",
  audiencePains: "",
  objective: "",
  mainOffer: "",
  competitors: "",
  successReferences: "",
  toneOfVoice: "",
  contentPillars: "",
  ctaPreferences: "",
  differentials: "",
  productsServices: "",
  brandValues: "",
  currentSocialPresence: "",
  bannedTopics: "",
  hashtagsBase: "",
  instagramHandle: "",
};

interface BriefingFormProps {
  values: BriefingFormValues;
  onChange: (values: BriefingFormValues) => void;
  onCancel: () => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
  /** When true, the name field is read-only (used in edit mode). */
  lockName?: boolean;
  /** Initial avatar URL to display. */
  avatarUrl?: string | null;
  onAvatarChange?: (url: string) => void;
  /** Title shown on save button. */
  saveLabel?: string;
}

export function BriefingForm({
  values,
  onChange,
  onCancel,
  onSave,
  saving,
  lockName,
  avatarUrl,
  onAvatarChange,
  saveLabel = "Salvar Briefing",
}: BriefingFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(avatarUrl ?? null);
  useEffect(() => { setLocalAvatar(avatarUrl ?? null); }, [avatarUrl]);

  const update = <K extends keyof BriefingFormValues>(key: K, v: BriefingFormValues[K]) => {
    onChange({ ...values, [key]: v });
  };
  const toggleNetwork = (key: SocialNetworkKey) => {
    const has = values.socialNetworks.includes(key);
    onChange({
      ...values,
      socialNetworks: has ? values.socialNetworks.filter((p) => p !== key) : [...values.socialNetworks, key],
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("client-avatars").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("client-avatars").getPublicUrl(path);
      setLocalAvatar(urlData.publicUrl);
      onAvatarChange?.(urlData.publicUrl);
    } catch {
      toast({ title: "Erro", description: "Não foi possível enviar a foto.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const fieldInputClass = "h-12 rounded-full border border-foreground/80 bg-background px-5 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";
  const fieldTextareaClass = "min-h-[110px] rounded-2xl border border-foreground/80 bg-background px-5 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0";
  const labelClass = "text-[13px] font-medium text-muted-foreground";

  // Completude: conta quantos campos estratégicos estão preenchidos
  const trackedFields: Array<keyof BriefingFormValues> = [
    "name", "niche", "instagramHandle", "postingFrequency", "mainOffer",
    "targetAudience", "audiencePains", "objective", "contentPillars",
    "ctaPreferences", "competitors", "successReferences", "toneOfVoice",
    "brandValues", "productsServices", "differentials", "currentSocialPresence",
    "bannedTopics", "hashtagsBase",
  ];
  const filledCount = trackedFields.filter((k) => {
    const v = values[k];
    return typeof v === "string" && v.trim().length > 0;
  }).length + (values.socialNetworks.length > 0 ? 1 : 0);
  const totalFields = trackedFields.length + 1; // +1 = redes sociais
  const completion = Math.round((filledCount / totalFields) * 100);
  const completionTone =
    completion >= 80 ? { label: "Excelente — IA com contexto rico", bar: "bg-foreground", chip: "bg-foreground text-background" }
    : completion >= 50 ? { label: "Bom — pode melhorar", bar: "bg-primary", chip: "bg-primary text-primary-foreground" }
    : completion >= 25 ? { label: "Raso — IA terá pouco contexto", bar: "bg-orange-500", chip: "bg-orange-500 text-white" }
    : { label: "Quase vazio — output será genérico", bar: "bg-destructive", chip: "bg-destructive text-destructive-foreground" };

  return (
    <div className="rounded-3xl border-2 border-primary bg-card p-8 shadow-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Folder className="h-5 w-5 text-foreground" />
          <span className="text-xl font-bold text-foreground">
            {values.name.trim() || "Novo cliente"}
          </span>
          <span className="rounded-full border border-primary px-3 py-0.5 text-xs font-semibold text-primary">
            Briefing
          </span>
          <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold", completionTone.chip)}>
            {completion}% preenchido
          </span>
        </div>
        <div className="flex items-center gap-1">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => fileInputRef.current?.click()} title="Foto de perfil">
            {localAvatar ? (
              <img src={localAvatar} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={onCancel} title="Descartar">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Briefing de Social Media</h2>

      {/* Disclaimer — por que preencher bem */}
      <div className="mb-7 rounded-2xl border border-primary/40 bg-primary/10 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20">
            <Sparkles className="h-4 w-4 text-foreground" />
          </div>
          <div className="space-y-2 text-sm leading-relaxed text-foreground/85">
            <p className="font-semibold text-foreground">
              Quanto mais detalhado este briefing, mais estratégica e personalizada será a I.A.
            </p>
            <p>
              Tudo que você escrever aqui vira <strong>contexto bruto</strong> para a I.A gerar
              estratégias, copies, ideias de conteúdo e roteiros. Briefing raso = conteúdo
              genérico. Briefing rico = posts que parecem feitos por alguém de dentro da marca.
            </p>
            <ul className="ml-4 list-disc space-y-1 text-foreground/80">
              <li>
                <strong>Seja específico</strong>: em vez de “público jovem”, escreva “mulheres 28–40
                que tentaram emagrecer 3+ vezes e desistiram”.
              </li>
              <li>
                <strong>Fale na voz do cliente</strong>: use frases reais que o público diz
                (objeções, dores, desejos) — isso vira hook e copy direto.
              </li>
              <li>
                <strong>Dê exemplos concretos</strong>: cite produtos, ofertas, perfis de
                referência (@), CTAs que costumam funcionar e o que <em>não</em> pode aparecer.
              </li>
              <li>
                <strong>Atualize sempre</strong>: ao mudar oferta, posicionamento ou pilares, edite
                o briefing — a I.A passa a usar a versão nova imediatamente.
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Campos com <span className="font-semibold text-foreground">*</span> são obrigatórios.
              Os demais são opcionais — mas cada campo preenchido aumenta a qualidade do output.
            </p>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-name" className={labelClass}>Nome do cliente *</Label>
        <Input
          id="bf-name"
          className={cn(fieldInputClass, lockName && "opacity-70 cursor-not-allowed")}
          placeholder="Ex: iOBEE"
          value={values.name}
          disabled={lockName}
          onChange={(e) => update("name", e.target.value)}
        />
      </div>

      {/* Segmento + @Instagram */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-niche" className={labelClass}>Segmento / Nicho</Label>
          <Input id="bf-niche" className={fieldInputClass} placeholder="Ex: Agência de marketing digital" value={values.niche} onChange={(e) => update("niche", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-ig" className={labelClass}>@ do Instagram principal</Label>
          <Input id="bf-ig" className={fieldInputClass} placeholder="@suamarca" value={values.instagramHandle} onChange={(e) => update("instagramHandle", e.target.value)} />
        </div>
      </div>

      {/* Frequência + Oferta principal */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-freq" className={labelClass}>Frequência de postagem desejada</Label>
          <Input id="bf-freq" className={fieldInputClass} placeholder="Ex: 5 posts + 3 stories por semana" value={values.postingFrequency} onChange={(e) => update("postingFrequency", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-offer" className={labelClass}>Oferta principal a vender no social</Label>
          <Input id="bf-offer" className={fieldInputClass} placeholder="Ex: Mentoria 1:1, Curso X..." value={values.mainOffer} onChange={(e) => update("mainOffer", e.target.value)} />
        </div>
      </div>

      {/* Público + Dores */}
      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-audience" className={labelClass}>Público-alvo (idade, gênero, localização, interesses)</Label>
        <Textarea id="bf-audience" className={fieldTextareaClass} placeholder="Descreva o público em detalhes..." value={values.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} />
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-pains" className={labelClass}>Dores, desejos e objeções do público</Label>
        <Textarea id="bf-pains" className={fieldTextareaClass} placeholder="Ex: Não consegue gerar leads consistentes; tem medo de investir e não dar retorno..." value={values.audiencePains} onChange={(e) => update("audiencePains", e.target.value)} />
      </div>

      {/* Objetivo */}
      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-objective" className={labelClass}>Objetivo macro no social media</Label>
        <Textarea id="bf-objective" className={fieldTextareaClass} placeholder="Ex: Construir autoridade e gerar 30 leads qualificados/mês via DM" value={values.objective} onChange={(e) => update("objective", e.target.value)} />
      </div>

      {/* Pilares + CTAs */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-pillars" className={labelClass}>Pilares de conteúdo</Label>
          <Textarea id="bf-pillars" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder="Ex: Educacional, Bastidores, Cases, Vendas, Inspiracional" value={values.contentPillars} onChange={(e) => update("contentPillars", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-ctas" className={labelClass}>CTAs / chamadas preferidas</Label>
          <Textarea id="bf-ctas" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder='Ex: "Comente AQUI", DM com palavra-chave, link na bio...' value={values.ctaPreferences} onChange={(e) => update("ctaPreferences", e.target.value)} />
        </div>
      </div>

      {/* Concorrentes + Referências */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-competitors" className={labelClass}>Concorrentes diretos</Label>
          <Textarea id="bf-competitors" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder="Ex: @marcaX, @marcaY, @empresaZ..." value={values.competitors} onChange={(e) => update("competitors", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-refs" className={labelClass}>Perfis de referência (que admira)</Label>
          <Textarea id="bf-refs" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder="Ex: @perfilA, @perfilB — pelo storytelling / edição..." value={values.successReferences} onChange={(e) => update("successReferences", e.target.value)} />
        </div>
      </div>

      {/* Redes sociais */}
      <div className="mb-8 space-y-3">
        <Label className={labelClass}>Redes sociais ativas / prioritárias</Label>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
          {SOCIAL_NETWORK_OPTIONS.map((opt) => {
            const checked = values.socialNetworks.includes(opt.key);
            return (
              <button key={opt.key} type="button" onClick={() => toggleNetwork(opt.key)} className="flex items-center gap-2.5 group">
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                  checked ? "border-foreground bg-foreground text-background" : "border-foreground/70 bg-background"
                )}>
                  {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className="text-base font-medium text-foreground">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <details className="mb-8 rounded-2xl border border-border bg-background/40 px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          Campos avançados (tom de voz, valores, hashtags base, tópicos proibidos...)
        </summary>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bf-tone" className={labelClass}>Tom de voz</Label>
              <Input id="bf-tone" className={fieldInputClass} placeholder="Ex: Direto, provocador, com humor leve" value={values.toneOfVoice} onChange={(e) => update("toneOfVoice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-bv" className={labelClass}>Valores da marca</Label>
              <Input id="bf-bv" className={fieldInputClass} placeholder="Ex: Transparência, ousadia, resultado" value={values.brandValues} onChange={(e) => update("brandValues", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-prod" className={labelClass}>Produtos / Serviços (catálogo)</Label>
            <Textarea id="bf-prod" className={fieldTextareaClass} value={values.productsServices} onChange={(e) => update("productsServices", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-diff" className={labelClass}>Diferenciais competitivos</Label>
            <Textarea id="bf-diff" className={fieldTextareaClass} value={values.differentials} onChange={(e) => update("differentials", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-presence" className={labelClass}>Presença atual nas redes (números, status)</Label>
            <Textarea id="bf-presence" className={fieldTextareaClass} placeholder="Ex: IG com 12k, ER 1.2%, TikTok recém-criado..." value={values.currentSocialPresence} onChange={(e) => update("currentSocialPresence", e.target.value)} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bf-banned" className={labelClass}>Tópicos / palavras proibidas</Label>
              <Textarea id="bf-banned" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder="Ex: política, religião, palavrões" value={values.bannedTopics} onChange={(e) => update("bannedTopics", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-tags" className={labelClass}>Hashtags base da marca</Label>
              <Textarea id="bf-tags" className={cn(fieldTextareaClass, "min-h-[90px]")} placeholder="#suamarca #nichoX #dorY" value={values.hashtagsBase} onChange={(e) => update("hashtagsBase", e.target.value)} />
            </div>
          </div>
        </div>
      </details>

      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        <button type="button" onClick={onCancel} className="text-base font-medium text-foreground/70 hover:text-foreground transition-colors">
          Cancelar
        </button>
        <Button
          size="lg"
          onClick={onSave}
          disabled={saving || !values.name.trim()}
          className="h-12 gap-2 rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Check className="h-5 w-5" strokeWidth={3} />
          {saving ? "Salvando..." : saveLabel}
        </Button>
      </div>
      {uploading && <p className="mt-3 text-right text-xs text-muted-foreground">Enviando foto...</p>}
    </div>
  );
}
