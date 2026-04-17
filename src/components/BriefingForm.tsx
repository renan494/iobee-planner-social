import { useRef, useState, useEffect } from "react";
import { Folder, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type PlatformKey = "meta" | "google" | "tiktok";
const PLATFORM_OPTIONS: { key: PlatformKey; label: string }[] = [
  { key: "meta", label: "Meta Ads" },
  { key: "google", label: "Google Ads" },
  { key: "tiktok", label: "TikTok Ads" },
];

export interface BriefingFormValues {
  name: string;
  niche: string;
  websiteUrl: string;
  ticketMedio: string;
  verbaMensal: string;
  targetAudience: string;
  objective: string;
  competitors: string;
  platforms: PlatformKey[];
  toneOfVoice: string;
  differentials: string;
  productsServices: string;
  brandValues: string;
  currentSocialPresence: string;
  instagramHandle: string;
  facebookUrl: string;
  linkedinUrl: string;
  gmbUrl: string;
}

export const emptyBriefing: BriefingFormValues = {
  name: "",
  niche: "",
  websiteUrl: "",
  ticketMedio: "",
  verbaMensal: "",
  targetAudience: "",
  objective: "",
  competitors: "",
  platforms: [],
  toneOfVoice: "",
  differentials: "",
  productsServices: "",
  brandValues: "",
  currentSocialPresence: "",
  instagramHandle: "",
  facebookUrl: "",
  linkedinUrl: "",
  gmbUrl: "",
};

export function formatBRL(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return "";
  const number = parseInt(onlyDigits, 10) / 100;
  return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function parseBRL(value: string): number | undefined {
  const onlyDigits = value.replace(/\D/g, "");
  if (!onlyDigits) return undefined;
  return parseInt(onlyDigits, 10) / 100;
}
export function numberToBRL(n: number | null | undefined): string {
  if (n === null || n === undefined) return "";
  return Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  /** Title shown in header badge area. */
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
  const togglePlatform = (key: PlatformKey) => {
    const has = values.platforms.includes(key);
    onChange({ ...values, platforms: has ? values.platforms.filter((p) => p !== key) : [...values.platforms, key] });
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

      <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Briefing do cliente</h2>

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

      {/* Segmento + URL */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-niche" className={labelClass}>Segmento / Nicho</Label>
          <Input id="bf-niche" className={fieldInputClass} placeholder="Ex: Agência de marketing digital" value={values.niche} onChange={(e) => update("niche", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-website" className={labelClass}>URL do site</Label>
          <Input id="bf-website" className={fieldInputClass} placeholder="https://exemplo.com.br" value={values.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)} />
        </div>
      </div>

      {/* Ticket + Verba */}
      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bf-ticket" className={labelClass}>Ticket Médio</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">R$</span>
            <Input id="bf-ticket" className={cn(fieldInputClass, "pl-12")} placeholder="0,00" inputMode="numeric" value={values.ticketMedio} onChange={(e) => update("ticketMedio", formatBRL(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bf-verba" className={labelClass}>Verba Mensal</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-base font-medium text-muted-foreground">R$</span>
            <Input id="bf-verba" className={cn(fieldInputClass, "pl-12")} placeholder="0,00" inputMode="numeric" value={values.verbaMensal} onChange={(e) => update("verbaMensal", formatBRL(e.target.value))} />
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-audience" className={labelClass}>Público-alvo (idade, gênero, localização, interesses, dores)</Label>
        <Textarea id="bf-audience" className={fieldTextareaClass} placeholder="Descreva o público em detalhes..." value={values.targetAudience} onChange={(e) => update("targetAudience", e.target.value)} />
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-objective" className={labelClass}>Objetivos e Metas</Label>
        <Textarea id="bf-objective" className={fieldTextareaClass} placeholder="Ex: Crescer o faturamento pelo digital em 20%" value={values.objective} onChange={(e) => update("objective", e.target.value)} />
      </div>

      <div className="mb-6 space-y-2">
        <Label htmlFor="bf-competitors" className={labelClass}>Concorrentes</Label>
        <Textarea id="bf-competitors" className={cn(fieldTextareaClass, "min-h-[80px]")} placeholder="Ex: Marca X, Marca Y, Empresa Z..." value={values.competitors} onChange={(e) => update("competitors", e.target.value)} />
      </div>

      <div className="mb-8 space-y-3">
        <Label className={labelClass}>Plataformas</Label>
        <div className="flex flex-wrap items-center gap-6 pt-1">
          {PLATFORM_OPTIONS.map((opt) => {
            const checked = values.platforms.includes(opt.key);
            return (
              <button key={opt.key} type="button" onClick={() => togglePlatform(opt.key)} className="flex items-center gap-2.5 group">
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
          Campos avançados (tom de voz, diferenciais, redes sociais...)
        </summary>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bf-tone" className={labelClass}>Tom de voz</Label>
              <Input id="bf-tone" className={fieldInputClass} value={values.toneOfVoice} onChange={(e) => update("toneOfVoice", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-bv" className={labelClass}>Valores da marca</Label>
              <Input id="bf-bv" className={fieldInputClass} value={values.brandValues} onChange={(e) => update("brandValues", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-prod" className={labelClass}>Produtos / Serviços</Label>
            <Textarea id="bf-prod" className={fieldTextareaClass} value={values.productsServices} onChange={(e) => update("productsServices", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-diff" className={labelClass}>Diferenciais</Label>
            <Textarea id="bf-diff" className={fieldTextareaClass} value={values.differentials} onChange={(e) => update("differentials", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bf-presence" className={labelClass}>Presença atual nas redes</Label>
            <Textarea id="bf-presence" className={fieldTextareaClass} value={values.currentSocialPresence} onChange={(e) => update("currentSocialPresence", e.target.value)} />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bf-ig" className={labelClass}>@ do Instagram</Label>
              <Input id="bf-ig" className={fieldInputClass} value={values.instagramHandle} onChange={(e) => update("instagramHandle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-fb" className={labelClass}>URL do Facebook</Label>
              <Input id="bf-fb" className={fieldInputClass} value={values.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-li" className={labelClass}>URL do LinkedIn</Label>
              <Input id="bf-li" className={fieldInputClass} value={values.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bf-gmb" className={labelClass}>URL do Google Meu Negócio</Label>
              <Input id="bf-gmb" className={fieldInputClass} value={values.gmbUrl} onChange={(e) => update("gmbUrl", e.target.value)} />
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
