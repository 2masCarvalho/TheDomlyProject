import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CondominiosProvider } from "@/context/CondominiosContext";
import { AtivosProvider } from "@/context/AtivosContext";
import { OcorrenciasProvider } from "@/context/OcorrenciasContext";
import { TrabalhosProvider } from "@/context/TrabalhosContext";
import { TecnicosProvider } from "@/context/TecnicosContext";
import { AppLayout } from "@/components/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { CondominiosPage } from "./pages/CondominiosPage";
import { CondominioDetailPage } from "./pages/CondominioDetailPage";
import { CondominioDocumentosPage } from "./pages/CondominioDocumentosPage";
import { AtivosPage } from "./pages/AtivosPage";
import { AtivoDetailPage } from "./pages/AtivoDetailPage";
import { CalendarPage } from './pages/CalendarPage';
import NotFound from "./pages/NotFound";
import { AlertsPage } from "./pages/AlertsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { DashboardPage } from "./pages/DashboardPage";
import { OcorrenciasPage } from "./pages/OcorrenciasPage";
import { OcorrenciaDetailPage } from "./pages/OcorrenciaDetailPage";
import { TrabalhosPage } from "./pages/TrabalhosPage";
import { TrabalhoDetailPage } from "./pages/TrabalhoDetailPage";
import { TecnicosPage } from "./pages/TecnicosPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { TrabalhoPublicoPage } from "./pages/TrabalhoPublicoPage";
import { ConformidadePage } from "./pages/ConformidadePage";
import { SettingsPage } from "./pages/SettingsPage";
import { SuportePage } from "./pages/SuportePage";
import { JoinPage } from "./pages/JoinPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { GerarDocumentoPage } from "./pages/GerarDocumentoPage";
import { UtilizadoresPage } from "./pages/UtilizadoresPage";
import { RelatoriosPage } from "./pages/RelatoriosPage";
import { RelatorioDetailPage } from "./pages/RelatorioDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/t/:token" element={<TrabalhoPublicoPage />} />
                <Route path="/join/:token" element={<JoinPage />} />

                {/* Rotas protegidas */}
                <Route
                  element={
                    <ProtectedRoute>
                      <CondominiosProvider>
                        <AtivosProvider>
                          <OcorrenciasProvider>
                            <TrabalhosProvider>
                              <TecnicosProvider>
                                <ErrorBoundary>
                                  <AppLayout />
                                </ErrorBoundary>
                              </TecnicosProvider>
                            </TrabalhosProvider>
                          </OcorrenciasProvider>
                        </AtivosProvider>
                      </CondominiosProvider>
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Condomínios */}
                  <Route path="/condominios" element={<CondominiosPage />} />
                  <Route path="/condominios/:id" element={<CondominioDetailPage />} />
                  <Route path="/condominios/:id/documentos" element={<CondominioDocumentosPage />} />
                  <Route path="/condominios/:id/ativos" element={<AtivosPage />} />
                  <Route path="/condominios/:condominioId/ativos/:ativoId" element={<AtivoDetailPage />} />

                  {/* Calendário & Alertas */}
                  <Route path="/calendario" element={<CalendarPage />} />
                  <Route path="/alertas" element={<AlertsPage />} />
                  <Route path="/manutencao" element={<MaintenancePage />} />

                  {/* Ocorrências */}
                  <Route path="/ocorrencias" element={<OcorrenciasPage />} />
                  <Route path="/ocorrencias/:id" element={<OcorrenciaDetailPage />} />

                  {/* Trabalhos & Técnicos */}
                  <Route path="/trabalhos" element={<TrabalhosPage />} />
                  <Route path="/trabalhos/novo" element={<TrabalhosPage />} />
                  <Route path="/trabalhos/:id" element={<TrabalhoDetailPage />} />
                  <Route path="/tecnicos" element={<TecnicosPage />} />

                  {/* Documentos & Templates */}
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route path="/gerar-documento" element={<GerarDocumentoPage />} />

                  {/* Relatórios mensais */}
                  <Route path="/relatorios" element={<RelatoriosPage />} />
                  <Route path="/relatorios/:id" element={<RelatorioDetailPage />} />

                  {/* Gestão */}
                  <Route path="/utilizadores" element={<UtilizadoresPage />} />
                  <Route path="/conformidade" element={<ConformidadePage />} />
                  <Route path="/configuracoes" element={<SettingsPage />} />
                  <Route path="/suporte" element={<SuportePage />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;