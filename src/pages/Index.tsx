import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths } from "date-fns";
import { samplePosts, getClients, getAnalysts, type Post } from "@/data/posts";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { ClientFilter } from "@/components/ClientFilter";
import { AnalystFilter } from "@/components/AnalystFilter";
import { FormatLegend } from "@/components/FormatLegend";
import { PostDetailModal } from "@/components/PostDetailModal";
import { ImportModal } from "@/components/ImportModal";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import logo from "@/assets/logo-iobee.svg";

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedAnalyst, setSelectedAnalyst] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(samplePosts);

  const clients = useMemo(() => getClients(posts), [posts]);
  const analysts = useMemo(() => getAnalysts(posts), [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedClient !== "all" && p.client !== selectedClient) return false;
      if (selectedAnalyst !== "all" && p.analyst !== selectedAnalyst) return false;
      return true;
    });
  }, [posts, selectedClient, selectedAnalyst]);

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setModalOpen(true);
  }, []);

  const handleImport = useCallback((newPosts: Post[]) => {
    setPosts((prev) => [...prev, ...newPosts]);
    // Navigate to the month of the first imported post
    if (newPosts.length > 0) {
      const d = new Date(newPosts[0].date + "T12:00:00");
      setCurrentDate(d);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="iOBEE" className="h-7" />
            <span className="hidden text-sm font-bold tracking-tight text-muted-foreground sm:block">
              Calendário de Conteúdo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ClientFilter clients={clients} selected={selectedClient} onChange={setSelectedClient} />
            <AnalystFilter analysts={analysts} selected={selectedAnalyst} onChange={setSelectedAnalyst} />
            <Button onClick={() => setImportOpen(true)} size="sm" className="gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CalendarHeader
            currentDate={currentDate}
            onPrevMonth={() => setCurrentDate((d) => subMonths(d, 1))}
            onNextMonth={() => setCurrentDate((d) => addMonths(d, 1))}
            onToday={() => setCurrentDate(new Date())}
          />
          <FormatLegend />
        </div>

        <CalendarGrid
          currentDate={currentDate}
          posts={filteredPosts}
          onPostClick={handlePostClick}
        />
      </main>

      <PostDetailModal post={selectedPost} open={modalOpen} onOpenChange={setModalOpen} />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        existingClients={clients}
      />
    </div>
  );
}
