import { useState, useEffect } from "react";
import { Shield, UserPlus, Trash2, Loader2, Users, Pencil, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editUser, setEditUser] = useState<ManagedUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("");
  const [saving, setSaving] = useState(false);

  const getToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  };

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchUsers = async () => {
    const token = await getToken();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=list`,
      { headers: { Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
    );
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAdmin().then(() => fetchUsers());
  }, [user]);

  const handleCreate = async () => {
    if (!email || !password) {
      toast({ title: "Preencha email e senha", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=create`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Usuário criado!", description: `${email} pode acessar o sistema.` });
      setEmail("");
      setPassword("");
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    if (!confirm(`Remover acesso de ${userEmail}?`)) return;
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=delete&userId=${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: `${userEmail} removido.` });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const openEdit = (u: ManagedUser) => {
    setEditUser(u);
    setEditEmail(u.email);
    setEditPassword("");
    setEditRole(u.role);
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const token = await getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: editUser.id,
            email: editEmail !== editUser.email ? editEmail : undefined,
            password: editPassword || undefined,
            role: editRole !== editUser.role ? editRole : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Usuário atualizado!" });
      setEditUser(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin && !loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground">Apenas administradores podem gerenciar usuários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerenciar Acessos</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie os acessos dos membros da equipe.</p>
        </div>
      </div>

      {/* Create user form */}
      <div className="mb-8 space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Criar novo acesso
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="analista@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="text" placeholder="Senha inicial" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Acesso
        </Button>
      </div>

      {/* Users table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-6 pb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários do sistema
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    {u.id !== user?.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id, u.email)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit modal */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nova senha (deixe vazio para manter)</Label>
              <Input type="text" placeholder="Nova senha" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
