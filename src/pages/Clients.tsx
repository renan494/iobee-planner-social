import { useMemo } from "react";
import { Users, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, type PostFormat } from "@/data/posts";

export default function Clients() {
  const { posts, clients } = usePosts();

  const clientStats = useMemo(() => {
    return clients.map((name) => {
      const clientPosts = posts.filter((p) => p.client === name);
      const analysts = [...new Set(clientPosts.map((p) => p.analyst))];
      const byFormat: Record<PostFormat, number> = { static: 0, carousel: 0, reels: 0, stories: 0 };
      clientPosts.forEach((p) => byFormat[p.format]++);
      return { name, total: clientPosts.length, analysts, byFormat };
    });
  }, [posts, clients]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus clientes e veja a produção de cada um.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clientStats.map((c) => (
          <Card key={c.name}>
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
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Analistas:</span>
                {c.analysts.map((a) => (
                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}