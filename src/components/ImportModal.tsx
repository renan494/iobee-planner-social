import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { parseFileToPost } from "@/lib/fileParser";
import type { Post } from "@/data/posts";
import { toast } from "@/hooks/use-toast";
import { usePosts } from "@/contexts/PostsContext";
import { useActivity } from "@/contexts/ActivityContext";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Analysts now come from context

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (posts: Post[]) => void;
  existingClients: string[];
}

export function ImportModal({ open, onOpenChange, onImport, existingClients }: ImportModalProps) {
  const { analysts, addAnalyst } = usePosts();
  const { logActivity } = useActivity();
  const [file, setFile] = useState<File | null>(null);
  const [client, setClient] = useState("");
  const [newClient, setNewClient] = useState("");
  const [analyst, setAnalyst] = useState("");
  const [newAnalyst, setNewAnalyst] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveClient = client === "__new__" ? newClient : client;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const effectiveAnalystVal = analyst === "__new__" ? newAnalyst.trim() : analyst;

  const handleImport = async () => {
    if (!file || !effectiveClient || !effectiveAnalystVal) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (analyst === "__new__" && effectiveAnalystVal) {
        addAnalyst(effectiveAnalystVal);
      }
      const posts = await parseFileToPost(
        file,
        effectiveClient,
        effectiveAnalystVal,
        parseInt(year)
      );
      onImport(posts);
      logActivity({
        action: "calendar_imported",
        description: `Calendário importado: ${posts.length} pautas de ${effectiveClient}`,
        analyst: effectiveAnalystVal,
        client: effectiveClient,
      });
      toast({
        title: "Importação concluída!",
        description: `${posts.length} pautas importadas para o calendário.`,
      });
      // Reset
      setFile(null);
      setClient("");
      setNewClient("");
      setAnalyst("");
      setNewAnalyst("");
      if (fileRef.current) fileRef.current.value = "";
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Erro na importação",
        description: err.message || "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Importar Planejamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File upload */}
          <div className="space-y-2">
            <Label>Arquivo (PDF ou PPTX)</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 transition-colors hover:border-primary/60 hover:bg-primary/10"
            >
              {file ? (
                <>
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para selecionar um arquivo
                  </span>
                  <span className="text-xs text-muted-foreground">PDF, PPTX</span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.pptx"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Client */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {existingClients.filter(c => c && c.trim() !== "").map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Novo cliente</SelectItem>
              </SelectContent>
            </Select>
            {client === "__new__" && (
              <Input
                placeholder="Nome do novo cliente"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="bg-card"
              />
            )}
          </div>

          {/* Analyst */}
          <div className="space-y-2">
            <Label>Analista</Label>
            <Select value={analyst} onValueChange={setAnalyst}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Selecione o analista" />
              </SelectTrigger>
              <SelectContent>
                {analysts.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
                <SelectItem value="__new__">+ Novo analista</SelectItem>
              </SelectContent>
            </Select>
            {analyst === "__new__" && (
              <Input
                placeholder="Nome do novo analista"
                value={newAnalyst}
                onChange={(e) => setNewAnalyst(e.target.value)}
                className="bg-card"
              />
            )}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label>Ano</Label>
            <Input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={2024}
              max={2030}
              className="bg-card"
            />
            <p className="text-xs text-muted-foreground">
              As datas dos posts serão extraídas automaticamente do arquivo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Importar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
