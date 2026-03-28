import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths } from "date-fns";
import { samplePosts, getClients, getAnalysts, type Post } from "@/data/posts";
import { AnalystFilter } from "@/components/AnalystFilter";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { ClientFilter } from "@/components/ClientFilter";
import { FormatLegend } from "@/components/FormatLegend";
import { PostDetailModal } from "@/components/PostDetailModal";
import logo from "@/assets/logo-iobee.svg";

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedAnalyst, setSelectedAnalyst] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const clients = useMemo(() => getClients(samplePosts), []);
  const analysts = useMemo(() => getAnalysts(samplePosts), []);

  const filteredPosts = useMemo(() => {
    return samplePosts.filter((p) => {
      if (selectedClient !== "all" && p.client !== selectedClient) return false;
      if (selectedAnalyst !== "all" && p.analyst !== selectedAnalyst) return false;
      return true;
    });
  }, [selectedClient, selectedAnalyst]);

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="iOBEE" className="h-7" />
            <span className="hidden text-sm font-bold tracking-tight text-muted-foreground sm:block">
              Calendário de Conteúdo
            </span>
          </div>
          <ClientFilter clients={clients} selected={selectedClient} onChange={setSelectedClient} />
        </div>
      </header>

      {/* Main content */}
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
    </div>
  );
}
