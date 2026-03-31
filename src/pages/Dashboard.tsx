import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Image, Film, Clapperboard, MessageCircle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePosts } from "@/contexts/PostsContext";
import type { PostFormat } from "@/data/posts";

const FORMAT_CONFIG: Record<PostFormat, { label: string; icon: typeof Image; color: string }> = {
  static: { label: "Estáticos", icon: Image, color: "bg-[hsl(var(--format-static))]" },
  carousel: { label: "Carrosséis", icon: BarChart3, color: "bg-[hsl(var(--format-carousel))]" },
  reels: { label: "Reels", icon: Clapperboard, color: "bg-[hsl(var(--format-reels))]" },
  stories: { label: "Stories", icon: MessageCircle, color: "bg-[hsl(var(--format-stories))]" },
};

export default function Dashboard() {
  const { posts, analysts } = usePosts();
  const navigate = useNavigate();

  const formatCounts = useMemo(() => {
    const counts: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
    posts.forEach((p) => counts[p.format]++);
    return counts;
  }, [posts]);

  const analystStats = useMemo(() => {
    return analysts.map((name) => {
      const analystPosts = posts.filter((p) => p.analyst === name);
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      analystPosts.forEach((p) => byFormat[p.format]++);
      return { name, total: analystPosts.length, ...byFormat };
    });
  }, [posts, analysts]);

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
    </div>
  );
}