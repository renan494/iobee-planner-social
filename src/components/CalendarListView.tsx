import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post, type PostFormat } from "@/data/posts";
import { PostBadge } from "@/components/PostBadge";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarListViewProps {
  posts: Post[];
  onPostClick: (post: Post) => void;
}

export function CalendarListView({ posts, onPostClick }: CalendarListViewProps) {
  const sorted = useMemo(() => [...posts].sort((a, b) => a.date.localeCompare(b.date)), [posts]);

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Headline</TableHead>
              <TableHead>Formato</TableHead>
              <TableHead>Funil</TableHead>
              <TableHead>Canais</TableHead>
              <TableHead>Analista</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  Nenhum post encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((post) => (
                <TableRow
                  key={post.id}
                  className="group cursor-pointer hover:bg-[hsl(var(--primary)/0.08)] transition-colors"
                  onClick={() => onPostClick(post)}
                >
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(post.date + "T12:00:00"), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{post.client}</TableCell>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground">{post.headline}</TableCell>
                  <TableCell><Badge variant="secondary">{FORMAT_LABELS[post.format]}</Badge></TableCell>
                  <TableCell><Badge variant="outline">{FUNNEL_LABELS[post.funnelStage]}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(post.channels || []).length > 0 ? (
                        (post.channels || []).map((ch) => (
                          <span key={ch} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{ch}</span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{post.analyst}</TableCell>
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        onClick={(e) => { e.stopPropagation(); onPostClick(post); }}
                        title="Visualizar post"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
