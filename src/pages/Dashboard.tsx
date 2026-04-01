import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Image, Film, Clapperboard, MessageCircle, TrendingUp, Clock, Upload, PenTool, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { DateRangePicker } from "@/components/DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePosts } from "@/contexts/PostsContext";
import { useActivity } from "@/contexts/ActivityContext";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { PostFormat } from "@/data/posts";

const FORMAT_CONFIG: Record<PostFormat, { label: string; icon: typeof Image; color: string }> = {
  static: { label: "Estáticos", icon: Image, color: "bg-[hsl(var(--format-static))]" },
  carousel: { label: "Carrosséis", icon: BarChart3, color: "bg-[hsl(var(--format-carousel))]" },
  reels: { label: "Reels", icon: Clapperboard, color: "bg-[hsl(var(--format-reels))]" },
  stories: { label: "Stories", icon: MessageCircle, color: "bg-[hsl(var(--format-stories))]" },
};

export default function Dashboard() {
  const { posts, analysts } = usePosts();
  const { activities, clearActivities } = useActivity();
  const isAdmin = useAdminCheck();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    });
  }, [posts, startDate, endDate]);

  const formatCounts = useMemo(() => {
    const counts: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
    filteredPosts.forEach((p) => counts[p.format]++);
    return counts;
  }, [filteredPosts]);

  const analystStats = useMemo(() => {
    return analysts.map((name) => {
      const analystPosts = filteredPosts.filter((p) => p.analyst === name);
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      analystPosts.forEach((p) => byFormat[p.format]++);
      const accounts = new Set(analystPosts.map((p) => p.client)).size;
      return { name, accounts, total: analystPosts.length, ...byFormat };
    });
  }, [filteredPosts, analysts]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do planejamento de conteúdo.</p>
        </div>
        <div className="ml-auto">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          />
        </div>
       </div>

      {/* Format cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.entries(FORMAT_CONFIG) as [PostFormat, typeof FORMAT_CONFIG["static"]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <Card key={key} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{cfg.label}</CardTitle>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{formatCounts[key]}</div>
                <p className="mt-1 text-xs text-muted-foreground">posts agendados</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analyst table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analistas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Analista</TableHead>
                <TableHead className="text-center">Contas</TableHead>
                <TableHead className="text-center">Estáticos</TableHead>
                <TableHead className="text-center">Carrosséis</TableHead>
                <TableHead className="text-center">Reels</TableHead>
                <TableHead className="text-center">Stories</TableHead>
                <TableHead className="text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analystStats.map((a) => (
                <TableRow key={a.name}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell className="text-center">{a.accounts}</TableCell>
                  <TableCell className="text-center">{a.static}</TableCell>
                  <TableCell className="text-center">{a.carousel}</TableCell>
                  <TableCell className="text-center">{a.reels}</TableCell>
                  <TableCell className="text-center">{a.stories}</TableCell>
                  <TableCell className="text-center font-bold">{a.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-4 w-4" />
            Atividades Recentes
          </CardTitle>
          {isAdmin && activities.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm("Limpar todo o log de atividades?")) clearActivities();
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 15).map((act) => {
                const Icon = act.action === "calendar_imported" ? Upload
                  : act.action === "post_created" ? PenTool
                  : act.action === "post_deleted" ? Trash2
                  : Clock;
                return (
                  <div key={act.id} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{act.description}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {act.analyst && <span>{act.analyst}</span>}
                        {act.analyst && <span>·</span>}
                        <span>{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}