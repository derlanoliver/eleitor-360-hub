import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/DashboardLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetSuccess from "./pages/ResetSuccess";
import Dashboard from "./pages/Dashboard";
import Leaders from "./pages/Leaders";
import LeadersRanking from "./pages/LeadersRanking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-success" element={<ResetSuccess />} />
          
          {/* Dashboard routes with sidebar layout */}
          <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
          <Route path="/leaders" element={<DashboardLayout><Leaders /></DashboardLayout>} />
          <Route path="/leaders/ranking" element={<DashboardLayout><LeadersRanking /></DashboardLayout>} />
          <Route path="/contacts" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Contatos (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/campaigns" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Campanhas (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/events" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Eventos (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/segments" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Segmentos (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/messaging" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Mensagens (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/settings/privacy" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Configurações de Privacidade (Em desenvolvimento)</h1></div></DashboardLayout>} />
          <Route path="/settings/organization" element={<DashboardLayout><div className="p-6"><h1 className="text-2xl font-bold">Configurações da Organização (Em desenvolvimento)</h1></div></DashboardLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
