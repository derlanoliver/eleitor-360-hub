import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TenantProvider } from "@/contexts/TenantContext";
import { TenantThemeProvider } from "@/providers/TenantThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ResetSuccess from "./pages/ResetSuccess";
import Dashboard from "./pages/Dashboard";
import Leaders from "./pages/Leaders";
import LeadersRanking from "./pages/LeadersRanking";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import Events from "./pages/Events";
import Projects from "./pages/Projects";
import AIAgent from "./pages/AIAgent";
import Settings from "./pages/Settings";
import AIProviders from "./pages/settings/AIProviders";
import OrganizationPage from "./pages/settings/OrganizationPage";
import BrandingPage from "./pages/settings/BrandingPage";
import DomainsPage from "./pages/settings/DomainsPage";
import TeamPage from "./pages/settings/TeamPage";
import IntegrationsPage from "./pages/settings/IntegrationsPage";
import BillingPage from "./pages/settings/BillingPage";
import PrivacyPage from "./pages/settings/PrivacyPage";
import SetupUsers from "./pages/SetupUsers";
import Tenants from "./pages/platform/Tenants";
import PlatformAdmins from "./pages/platform/PlatformAdmins";
import ForceLogout from "./pages/ForceLogout";
import NotFound from "./pages/NotFound";
import { RequireRole } from "./components/RequireRole";

const queryClient = new QueryClient();

const App = () => {
  console.log('🚀 App mounting with AuthProvider');
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <TenantProvider>
              <TenantThemeProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />
            <Route path="/setup-users" element={<SetupUsers />} />
            <Route path="/force-logout" element={<ForceLogout />} />
            
            {/* Protected dashboard routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/leaders" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Leaders />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/leaders/ranking" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <LeadersRanking />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/contacts" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Contacts />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/campaigns" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Campaigns />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Events />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai-agent" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIAgent />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings/organization" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <OrganizationPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/branding" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <BrandingPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/domains" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <DomainsPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/team" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <TeamPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/integrations" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <IntegrationsPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/billing" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <BillingPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/privacy" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <PrivacyPage />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/settings/ai-providers" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user', 'admin']}>
                  <DashboardLayout>
                    <AIProviders />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            
            {/* Platform Routes (only for platform admins) */}
            <Route path="/platform/tenants" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin', 'super_user']}>
                  <DashboardLayout>
                    <Tenants />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            <Route path="/platform/admins" element={
              <ProtectedRoute>
                <RequireRole anyOf={['super_admin']}>
                  <DashboardLayout>
                    <PlatformAdmins />
                  </DashboardLayout>
                </RequireRole>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
              </TenantThemeProvider>
            </TenantProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
