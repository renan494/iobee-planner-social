import { useState, useMemo, useCallback, useEffect } from "react";
import {
  addMonths, subMonths,
  addDays, subDays,
  addWeeks, subWeeks,
  addQuarters, subQuarters,
  addYears, subYears,
  format,
} from "date-fns";
import { usePosts } from "@/contexts/PostsContext";
import { getClients, getAnalysts, type Post, FORMAT_LABELS, CHANNEL_OPTIONS, type PostFormat } from "@/data/posts";
import { CalendarHeader } from "@/components/CalendarHeader";
import { CalendarGrid } from "@/components/CalendarGrid";
import { DayView } from "@/components/DayView";
import { WeekView } from "@/components/WeekView";
import { QuarterView } from "@/components/QuarterView";
import { YearView } from "@/components/YearView";
import { SemesterView } from "@/components/SemesterView";
import { CalendarListView } from "@/components/CalendarListView";
import { ClientFilter } from "@/components/ClientFilter";
import { AnalystFilter } from "@/components/AnalystFilter";
import { ViewModeSwitcher } from "@/components/ViewModeSwitcher";
import { FormatLegend } from "@/components/FormatLegend";
import { PostDetailModal } from "@/components/PostDetailModal";
import { ImportModal } from "@/components/ImportModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Upload, Download, FileText, FileSpreadsheet, List, LayoutGrid, PenTool } from "lucide-react";
import { exportToPDF, exportToExcel } from "@/lib/exportCalendar";
import { useNavigate } from "react-router-dom";
import { VIEW_LABELS } from "@/types/calendar";
import type { ViewMode } from "@/types/calendar";


export default function CalendarPage() {
  const routerNavigate = useNavigate();
  const { posts, clients, analysts, addPosts, updatePostDate, updatePostArt, updatePost, deletePost } = usePosts();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1));
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  type DatePreset = "all" | "day" | "month" | "quarter" | "year" | "custom";
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [showCustomCalendars, setShowCustomCalendars] = useState(false);
  const [selectedClient, setSelectedClient] = useState("all");
  const [selectedAnalyst, setSelectedAnalyst] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [layoutMode, setLayoutMode] = useState<"calendar" | "list">("calendar");

  const applyPreset = useCallback((preset: DatePreset) => {
    setDatePreset(preset);
    setShowCustomCalendars(false);
    const now = new Date();
    switch (preset) {
      case "all":
        setDateFrom(undefined);
        setDateTo(undefined);
        break;
      case "day":
        setDateFrom(startOfDay(now));
        setDateTo(endOfDay(now));
        break;
      case "month":
        setDateFrom(startOfMonth(now));
        setDateTo(endOfMonth(now));
        break;
      case "quarter":
        setDateFrom(startOfQuarter(now));
        setDateTo(endOfQuarter(now));
        break;
      case "year":
        setDateFrom(startOfYear(now));
        setDateTo(endOfYear(now));
        break;
      case "custom":
        setShowCustomCalendars(true);
        break;
    }
  }, []);

  const availableClients = useMemo(() => {
    if (selectedAnalyst === "all") return clients;
    return getClients(posts.filter((p) => p.analyst === selectedAnalyst));
  }, [clients, posts, selectedAnalyst]);

  const availableAnalysts = useMemo(() => {
    if (selectedClient === "all") return analysts;
    return getAnalysts(posts.filter((p) => p.client === selectedClient));
  }, [analysts, posts, selectedClient]);

  useEffect(() => {
    if (selectedClient !== "all" && !availableClients.includes(selectedClient)) setSelectedClient("all");
  }, [availableClients, selectedClient]);

  useEffect(() => {
    if (selectedAnalyst !== "all" && !availableAnalysts.includes(selectedAnalyst)) setSelectedAnalyst("all");
  }, [availableAnalysts, selectedAnalyst]);

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (selectedClient !== "all" && p.client !== selectedClient) return false;
      if (selectedAnalyst !== "all" && p.analyst !== selectedAnalyst) return false;
      if (selectedFormat !== "all" && p.format !== selectedFormat) return false;
      if (selectedChannel !== "all" && !(p.channels || []).includes(selectedChannel)) return false;
      if (dateFrom && p.date < format(dateFrom, "yyyy-MM-dd")) return false;
      if (dateTo && p.date > format(dateTo, "yyyy-MM-dd")) return false;
      return true;
    });
  }, [posts, selectedClient, selectedAnalyst, selectedFormat, selectedChannel, dateFrom, dateTo]);

  const handlePostClick = useCallback((post: Post) => {
    setSelectedPost(post);
    setModalOpen(true);
  }, []);

  const handleImport = useCallback((newPosts: Post[]) => {
    addPosts(newPosts);
    if (newPosts.length > 0) {
      const d = new Date(newPosts[0].date + "T12:00:00");
      setCurrentDate(d);
    }
  }, [addPosts]);

  const handleUpdateDate = useCallback((postId: string, newDate: string) => {
    updatePostDate(postId, newDate);
    setSelectedPost((prev) => prev && prev.id === postId ? { ...prev, date: newDate } : prev);
  }, [updatePostDate]);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate((d) => {
      switch (viewMode) {
        case "day": return dir === 1 ? addDays(d, 1) : subDays(d, 1);
        case "week": return dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1);
        case "month": return dir === 1 ? addMonths(d, 1) : subMonths(d, 1);
        case "quarter": return dir === 1 ? addQuarters(d, 1) : subQuarters(d, 1);
        case "semester": return dir === 1 ? addMonths(d, 6) : addMonths(d, -6);
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
      case "semester":
        return <SemesterView currentDate={currentDate} posts={filteredPosts} onPostClick={handlePostClick} />;
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
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 space-y-4">
      {/* Row 1: Navigation + Import/Export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          onPrev={() => navigate(-1)}
          onNext={() => navigate(1)}
          onToday={() => setCurrentDate(new Date())}
        />
        <Button onClick={() => routerNavigate("/criar")} className="gap-2 font-semibold">
          <PenTool className="h-4 w-4" />
          Produzir Conteúdo
        </Button>
      </div>

      {/* Row 2: Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <ClientFilter clients={availableClients} selected={selectedClient} onChange={setSelectedClient} />
        <AnalystFilter analysts={availableAnalysts} selected={selectedAnalyst} onChange={setSelectedAnalyst} />
        <Select value={selectedFormat} onValueChange={setSelectedFormat}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os formatos</SelectItem>
            {(Object.entries(FORMAT_LABELS) as [PostFormat, string][]).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-[160px] h-9 text-sm">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os canais</SelectItem>
            {CHANNEL_OPTIONS.map((ch) => (
              <SelectItem key={ch} value={ch}>{ch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 3: View mode + Legend + Layout toggle */}
      {/* Row 3: View mode + Layout toggle */}
      <div className="flex items-center gap-3">
        <ViewModeSwitcher value={viewMode} onChange={setViewMode} />
        <div className="ml-auto flex items-center rounded-lg border border-border p-0.5">
          <Button
            variant={layoutMode === "calendar" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setLayoutMode("calendar")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={layoutMode === "list" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setLayoutMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {layoutMode === "list" ? (
        <CalendarListView posts={filteredPosts} onPostClick={handlePostClick} />
      ) : (
        renderView()
      )}

      {/* Legend + Import/Export below calendar */}
      <div className="flex items-center justify-between pt-2">
        <FormatLegend />
        <div className="flex items-center gap-2">
          <Button onClick={() => setImportOpen(true)} size="sm" variant="outline" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Download className="h-4 w-4" />
                Exportar
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

      <PostDetailModal post={selectedPost} open={modalOpen} onOpenChange={setModalOpen} onUpdateDate={handleUpdateDate} onUpdateArt={updatePostArt} onUpdatePost={updatePost} onDeletePost={async (id) => { await deletePost(id); setModalOpen(false); }} />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
        existingClients={clients}
      />
    </div>
  );
}