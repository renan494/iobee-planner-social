import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <PostsProvider>
      <ActivityProvider>
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
            <Route path="/admin/usuarios" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ActivityProvider>
    </PostsProvider>
  );
}

function LoginRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
