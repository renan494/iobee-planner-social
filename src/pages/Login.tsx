import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo-iobee.svg";
import { Loader2, BarChart3, Calendar, Users, Sparkles } from "lucide-react";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: any) {
      toast({
        title: "Erro ao entrar",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Calendar, text: "Calendário editorial inteligente" },
    { icon: BarChart3, text: "Métricas e relatórios em tempo real" },
    { icon: Users, text: "Gestão de clientes e analistas" },
    { icon: Sparkles, text: "Planejamento estratégico de conteúdo" },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #140F00 0%, #1a1400 50%, #2a2000 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "#FDB600" }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-[0.07]"
          style={{ background: "#FDB600" }} />
        <div className="absolute top-1/3 right-10 w-40 h-40 rounded-full opacity-[0.05]"
          style={{ background: "#FDB600" }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo + tagline */}
          <div>
            <img src={logo} alt="iOBEE" className="h-12 brightness-0 invert" />
            <p className="mt-2 text-sm font-medium tracking-wider uppercase"
              style={{ color: "#FDB600" }}>
              Social Lab
            </p>
          </div>

          {/* Hero text */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight text-white">
                Planeje, organize e<br />
                <span style={{ color: "#FDB600" }}>conquiste resultados.</span>
              </h2>
              <p className="mt-4 text-base text-white/60 max-w-md leading-relaxed">
                A plataforma completa para gestão de conteúdo em redes sociais da sua agência.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "rgba(253, 182, 0, 0.15)" }}>
                    <f.icon className="h-4 w-4" style={{ color: "#FDB600" }} />
                  </div>
                  <span className="text-sm text-white/80">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} iOBEE – Agência de Marketing Digital e Growth.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <img src={logo} alt="iOBEE" className="h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h1>
            <p className="text-sm text-muted-foreground">
              Faça login para acessar o painel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold text-sm"
              disabled={loading}
              style={{ background: "#FDB600", color: "#140F00" }}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            iOBEE Planner · Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
