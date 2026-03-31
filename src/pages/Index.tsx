import { useState, useMemo, useCallback, useEffect } from "react";
import {
  addMonths, subMonths,
  addDays, subDays,
  addWeeks, subWeeks,
  addQuarters, subQuarters,
  addYears, subYears,
} from "date-fns";
import { samplePosts, getClients, getAnalysts, type Post } from "@/data/posts";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayView } from "@/components/DayView";
import { WeekView } from "@/components/WeekView";
import { QuarterView } from "@/components/QuarterView";
import { YearView } from "@/components/YearView";
import { ClientFilter } from "@/components/ClientFilter";
import { AnalystFilter } from "@/components/AnalystFilter";
import { ViewModeSwitcher } from "@/components/ViewModeSwitcher";
import { FormatLegend } from "@/components/FormatLegend";
import { PostDetailModal } from "@/components/PostDetailModal";
import { ImportModal } from "@/components/ImportModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileText, FileSpreadsheet } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exportCalendar";
import { VIEW_LABELS } from "@/types/calendar";
import type { ViewMode } from "@/types/calendar";
import logo from "@/assets/logo-iobee.svg";

export default function Index() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
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
    if (newPosts.length > 0) {
      const d = new Date(newPosts[0].date + "T12:00:00");
      setCurrentDate(d);
    }
  }, []);

  const handleUpdateDate = useCallback((postId: string, newDate: string) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, date: newDate } : p));
    setSelectedPost((prev) => prev && prev.id === postId ? { ...prev, date: newDate } : prev);
  }, []);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate((d) => {
      switch (viewMode) {
        case "day": return dir === 1 ? addDays(d, 1) : subDays(d, 1);
        case "week": return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
        case "month": return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
        case "quarter": return dir === 1 ? addQuarters(d, 1) : subQuarters(d, 1);
        case "year": return dir === 1 ? addYears(d, 1) : subYears(d, 1);
      }
    });
  }, [viewMode]);

  const renderView = () => {
    switch (viewMode) {
      case "day":
        return <DayView currentDate={currentDate} posts={filteredPosts} onPostClick={handlePostClick} />;
      case "week":
        return <WeekView currentDate={currentDate} posts={filteredPosts} onPostClick={handlePostClick} />;
      case "month":
        return <CalendarGrid currentDate={currentDate} posts={filteredPosts} onPostClick={handlePostClick} />;
      case "quarter":
        return <QuarterView currentDate={currentDate} posts={filteredPosts} onPostClick={handlePostClick} />;
      case "year":
        return (
          <YearView
            currentDate={currentDate}
            posts={filteredPosts}
            onPostClick={handlePostClick}
            onNavigateToMonth={(d) => { setCurrentDate(d); setViewMode("month"); }}
          />
        );
    }
  };

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
            <Button onClick={() => setImportOpen(true)} size="sm" variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportToPDF(filteredPosts, `Visão: ${VIEW_LABELS[viewMode]}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Exportar PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportToExcel(filteredPosts, `Visão: ${VIEW_LABELS[viewMode]}`)}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Exportar Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onPrev={() => navigate(-1)}
            onNext={() => navigate(1)}
            onToday={() => setCurrentDate(new Date())}
          />
          <div className="flex items-center gap-3">
            <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
            <FormatLegend />
          </div>
        </div>

        {renderView()}
      </main>

      <PostDetailModal post={selectedPost} open={modalOpen} onOpenChange={setModalOpen} onUpdateDate={handleUpdateDate} />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        existingClients={clients}
      />
    </div>
  );
}
