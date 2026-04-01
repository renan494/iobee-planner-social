import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, User, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";
import { toast } from "@/hooks/use-toast";

export default function Clients() {
  const { posts, clients, addClient } = usePosts();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newMonthlyPosts, setNewMonthlyPosts] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const clientStats = useMemo(() => {
    return clients.map((name) => {
      const clientPosts = posts.filter((p) => p.client === name);
      const analysts = [...new Set(clientPosts.map((p) => p.analyst))];
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      clientPosts.forEach((p) => byFormat[p.format]++);
      return { name, total: clientPosts.length, analysts, byFormat };
    });
  }, [posts, clients]);

  const [saving, setSaving] = useState(false);

  const handleAddClient = async () => {
    const trimmed = newClientName.trim();
    if (!trimmed) return;
    if (clients.includes(trimmed)) {
      toast({ title: "Cliente já existe", description: `"${trimmed}" já está cadastrado.`, variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addClient({
        name: trimmed,
        monthlyPosts: parseInt(newMonthlyPosts) || 0,
        objective: newObjective.trim() || undefined,
        goal: newGoal.trim() || undefined,
      });
      toast({ title: "Cliente cadastrado", description: `"${trimmed}" foi adicionado com sucesso.` });
      setNewClientName("");
      setNewMonthlyPosts("");
      setNewObjective("");
      setNewGoal("");
      setDialogOpen(false);
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível cadastrar o cliente.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus clientes e veja a produção de cada um.</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar Cliente
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientStats.map((c) => (
          <Card key={c.name} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => navigate(`/clientes/${encodeURIComponent(c.name)}`)}>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">{c.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{c.total} posts</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(Object.entries(c.byFormat) as [PostFormat, number][]).map(([fmt, count]) =>
                  count > 0 ? (
                    <Badge key={fmt} variant="secondary" className="text-xs">
                      {FORMAT_LABELS[fmt]}: {count}
                    </Badge>
                  ) : null
                )}
              </div>
              {c.analysts.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Analistas:</span>
                  {c.analysts.map((a) => (
                    <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nome do cliente *</Label>
              <Input
                id="client-name"
                placeholder="Ex: iOBEE"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthly-posts">Quantidade de posts mensais</Label>
              <Input
                id="monthly-posts"
                type="number"
                min="0"
                placeholder="Ex: 20"
                value={newMonthlyPosts}
                onChange={(e) => setNewMonthlyPosts(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo</Label>
              <Textarea
                id="objective"
                placeholder="Descreva o objetivo do cliente..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Meta</Label>
              <Input
                id="goal"
                placeholder="Ex: 10k seguidores até dezembro"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddClient} disabled={saving || !newClientName.trim()}>
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}