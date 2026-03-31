import { useState } from "react";
import { UserPlus, Trash2, Users, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePosts } from "@/contexts/PostsContext";
import { toast } from "@/hooks/use-toast";

export default function Analysts() {
  const { analysts, posts, addAnalyst, updateAnalyst, removeAnalyst } = usePosts();
  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Digite o nome do analista", variant: "destructive" });
      return;
    }
    if (analysts.includes(trimmed)) {
      toast({ title: "Analista já existe", variant: "destructive" });
      return;
    }
    try {
      await addAnalyst(trimmed);
      setName("");
      toast({ title: "Analista cadastrado!", description: `${trimmed} foi adicionado(a).` });
    } catch (err: any) {
      toast({ title: "Erro ao cadastrar", description: err.message, variant: "destructive" });
    }
  };

  const handleEdit = async (oldName: string) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingName(null);
      return;
    }
    if (analysts.includes(trimmed)) {
      toast({ title: "Esse nome já existe", variant: "destructive" });
      return;
    }
    try {
      await updateAnalyst(oldName, trimmed);
      setEditingName(null);
      toast({ title: "Analista atualizado!", description: `${oldName} → ${trimmed}` });
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    }
  };

  const postCountByAnalyst = (analyst: string) =>
    posts.filter((p) => p.analyst === analyst).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analistas</h1>
          <p className="text-sm text-muted-foreground">Gerencie os analistas da equipe.</p>
        </div>
      </div>

      {/* Add form */}
      <div className="mb-6 flex gap-2">
        <Input
          placeholder="Nome do analista"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
          className="max-w-xs"
        />
        <Button onClick={handleAdd}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {analysts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum analista cadastrado.</p>
        )}
        {analysts.map((a) => {
          const count = postCountByAnalyst(a);
          const isEditing = editingName === a;
          return (
            <div
              key={a}
              className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm"
            >
              {isEditing ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEdit(a); if (e.key === "Escape") setEditingName(null); }}
                  className="max-w-xs"
                  autoFocus
                />
              ) : (
                <div>
                  <p className="font-medium text-foreground">{a}</p>
                  <p className="text-xs text-muted-foreground">
                    {count} {count === 1 ? "post" : "posts"}
                  </p>
                </div>
              )}
              <div className="flex gap-1">
                {isEditing ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}>
                      <Save className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditingName(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingName(a); setEditValue(a); }}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        removeAnalyst(a);
                        toast({ title: `${a} removido(a).` });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}