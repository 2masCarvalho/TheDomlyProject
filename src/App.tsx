import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { AtivosPage } from "./pages/AtivosPage";
import { AtivoDetailPage } from "./pages/AtivoDetailPage";
import { NotificacoesPage } from "./pages/NotificacoesPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/secret-admin-panel"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/condominios"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/condominios/:id/ativos"
              element={
                <ProtectedRoute>
                  <Index>
                    <AtivosPage />
                  </Index>
                </ProtectedRoute>
              }
            />
            <Route
              path="/condominios/:id/notificacoes"
              element={
                <ProtectedRoute>
                  <Index>
                    <NotificacoesPage />
                  </Index>
                </ProtectedRoute>
              }
            />
            <Route
              path="/condominios/:condominioId/ativos/:ativoId"
              element={
                <ProtectedRoute>
                  <Index>
                    <AtivoDetailPage />
                  </Index>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
