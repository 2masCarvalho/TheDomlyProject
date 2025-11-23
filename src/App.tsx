import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CondominiosProvider } from "@/context/CondominiosContext";
import { AtivosProvider } from "@/context/AtivosContext";
import { AppLayout } from "@/components/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { CondominiosPage } from "./pages/CondominiosPage";
import { AtivosPage } from "./pages/AtivosPage";
import { AtivoDetailPage } from "./pages/AtivoDetailPage";
import { NotificacoesPage } from "./pages/NotificacoesPage";
import NotFound from "./pages/NotFound";

// 👇 Formulário de novo condomínio
import CondominioForm from "@/components/CondominioForm/CondominioForm2"; 

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

            {/* Rotas protegidas */}
            <Route
              element={
                <ProtectedRoute>
                  <CondominiosProvider>
                    <AtivosProvider>
                      <AppLayout />
                    </AtivosProvider>
                  </CondominiosProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/novo-condominio" element={<CondominioForm />} />
              <Route path="/condominios" element={<CondominiosPage />} />
              <Route path="/condominios/:id/ativos" element={<AtivosPage />} />
              <Route path="/condominios/:id/notificacoes" element={<NotificacoesPage />} />
              <Route path="/condominios/:condominioId/ativos/:ativoId" element={<AtivoDetailPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
