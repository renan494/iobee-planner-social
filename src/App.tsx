import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PostsProvider } from "@/contexts/PostsContext";
import { ActivityProvider } from "@/contexts/ActivityContext";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import CreatePost from "./pages/CreatePost";
import CalendarPage from "./pages/CalendarPage";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Analysts from "./pages/Analysts";
import AnalystDetail from "./pages/AnalystDetail";
import Drafts from "./pages/Drafts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PostsProvider>
        <ActivityProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/criar" element={<CreatePost />} />
                <Route path="/rascunhos" element={<Drafts />} />
                <Route path="/calendario" element={<CalendarPage />} />
                <Route path="/clientes" element={<Clients />} />
                <Route path="/clientes/:name" element={<ClientDetail />} />
                <Route path="/analistas" element={<Analysts />} />
                <Route path="/analistas/:name" element={<AnalystDetail />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ActivityProvider>
      </PostsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
