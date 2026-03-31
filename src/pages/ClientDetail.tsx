import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, FUNNEL_LABELS, type PostFormat, type FunnelStage } from "@/data/posts";

export default function ClientDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { posts } = usePosts();

  const clientName = decodeURIComponent(name || "");
  const clientPosts = useMemo(() => posts.filter((p) => p.client === clientName), [posts, clientName]);

  const analysts = useMemo(() => [...new Set(clientPosts.map((p) => p.analyst))], [clientPosts]);
  const byFormat = useMemo(() => {
    const acc: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
    clientPosts.forEach((p) => acc[p.format]++);
    return acc;
  }, [clientPosts]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <Button variant="ghost" size="sm" className="mb-4 gap-1.5" onClick={() => navigate("/clientes")}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <User className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{clientName}</h1>
          <p className="text-sm text-muted-foreground">{clientPosts.length} posts · {analysts.length} analista(s)</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.entries(byFormat) as [PostFormat, number][]).map(([fmt, count]) =>
          count > 0 ? (
            <Badge key={fmt} variant="secondary">{FORMAT_LABELS[fmt]}: {count}</Badge>
          ) : null
        )}
        <span className="mx-2 text-muted-foreground">|</span>
        {analysts.map((a) => (
          <Badge key={a} variant="outline">{a}</Badge>
        ))}
      </div>

      {/* Posts table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Headline</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Funil</TableHead>
                <TableHead>Analista</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum post encontrado para este cliente.
                  </TableCell>
                </TableRow>
              ) : (
                clientPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="whitespace-nowrap">{new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-muted-foreground">{post.headline}</TableCell>
                    <TableCell><Badge variant="secondary">{FORMAT_LABELS[post.format]}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{FUNNEL_LABELS[post.funnelStage]}</Badge></TableCell>
                    <TableCell>{post.analyst}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
