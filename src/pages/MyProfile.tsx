import { useState } from "react";
import { UserCircle, Mail, Shield, KeyRound, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/PageContainer";

export default function MyProfile() {
  const { user } = useAuth();
  const isAdmin = useAdminCheck();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({ title: "Erro", description: "Digite a nova senha.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Senha atualizada", description: "Sua senha foi alterada com sucesso." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Não foi possível alterar a senha.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer maxWidth="2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <UserCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meus Dados</h1>
          <p className="text-sm text-muted-foreground">Visualize e edite suas informações pessoais.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">E-mail</p>
                <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Cargo</p>
                <Badge variant={isAdmin ? "default" : "secondary"} className="mt-0.5">
                  {isAdmin ? "Administrador" : "Usuário"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={saving} className="w-full sm:w-auto">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Salvando..." : "Alterar Senha"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
