import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePosts } from "@/contexts/PostsContext";
import { FORMAT_LABELS, FUNNEL_LABELS, type Post } from "@/data/posts";
import { PostBadge } from "@/components/PostBadge";
import { PostDetailModal } from "@/components/PostDetailModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Pencil } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";

export default function AnalystDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { posts, updatePostDate, updatePostArt, updatePost, deletePost } = usePosts();

  const analystName = decodeURIComponent(name || "");

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const analystPosts = useMemo(
    () => posts.filter((p) => p.analyst === analystName),
    [posts, analystName]
  );

  const clients = useMemo(
    () => [...new Set(analystPosts.map((p) => p.client))].sort(),
    [analystPosts]
  );

  const filteredPosts = useMemo(() => {
    let result = analystPosts;
    if (clientFilter !== "all") {
      result = result.filter((p) => p.client === clientFilter);
    }
    if (dateFrom) {
      const from = format(dateFrom, "yyyy-MM-dd");
      result = result.filter((p) => p.date >= from);
    }
    if (dateTo) {
      const to = format(dateTo, "yyyy-MM-dd");
      result = result.filter((p) => p.date <= to);
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [analystPosts, clientFilter, dateFrom, dateTo]);

  const hasFilters = clientFilter !== "all" || dateFrom || dateTo;

  return (
    <PageContainer>
      <div className="mb-4">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/analistas")}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{analystName}</h1>
          <p className="text-sm text-muted-foreground">
            {analystPosts.length} {analystPosts.length === 1 ? "post" : "posts"} · {clients.length} cliente(s)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os clientes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yy") : "De"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} locale={ptBR} />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <CalendarIcon className="h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yy") : "Até"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={dateTo} onSelect={setDateTo} locale={ptBR} />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => { setClientFilter("all"); setDateFrom(undefined); setDateTo(undefined); }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 flex flex-wrap gap-2">
        {clients.map((c) => {
          const count = filteredPosts.filter((p) => p.client === c).length;
          if (count === 0) return null;
          return (
            <Badge key={c} variant="outline">{c}: {count}</Badge>
          );
        })}
      </div>

      {/* Posts table */}
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
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum post encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map((post) => (
                  <TableRow
                    key={post.id}
                    className="group cursor-pointer hover:bg-[hsl(var(--primary)/0.08)] transition-colors"
                    onClick={() => setSelectedPost(post)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {new Date(post.date + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{post.client}</TableCell>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-muted-foreground">{post.headline}</TableCell>
                    <TableCell><PostBadge format={post.format as any} /></TableCell>
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
                    <TableCell>
                      <div className="flex gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                          title="Visualizar post"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary"
                          onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                          title="Editar post"
                        >
                          <Pencil className="h-3.5 w-3.5" />
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

      <PostDetailModal
        post={selectedPost}
        open={!!selectedPost}
        onOpenChange={(o) => { if (!o) setSelectedPost(null); }}
        onUpdateDate={(id, date) => { updatePostDate(id, date); setSelectedPost((p) => p ? { ...p, date } : null); }}
        onUpdateArt={async (id, url) => { await updatePostArt(id, url); setSelectedPost((p) => p ? { ...p, artUrl: url ?? undefined } : null); }}
        onUpdatePost={async (id, fields) => { await updatePost(id, fields); setSelectedPost((p) => p ? { ...p, ...fields } : null); }}
        onDeletePost={async (id) => { await deletePost(id); setSelectedPost(null); }}
      />
    </PageContainer>
  );
}
