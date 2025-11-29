import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { TrackingProvider } from "./components/TrackingProvider";
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
import Messaging from "./pages/Messaging";
import Segments from "./pages/Segments";
import AIAgent from "./pages/AIAgent";
import Settings from "./pages/Settings";
import AIProviders from "./pages/settings/AIProviders";
import TrackingSettings from "./pages/settings/TrackingSettings";
import SetupUsers from "./pages/SetupUsers";
import NotFound from "./pages/NotFound";
import EventRegistration from "./pages/EventRegistration";
import EventCheckin from "./pages/EventCheckin";

// Office module pages
import NewVisit from "./pages/office/NewVisit";
import Queue from "./pages/office/Queue";
import History from "./pages/office/History";
import OfficeSettings from "./pages/office/Settings";
import VisitCheckin from "./pages/office/VisitCheckin";
import ScheduleVisit from "./pages/ScheduleVisit";
import AffiliateForm from "./pages/AffiliateForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TrackingProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />
            <Route path="/setup-users" element={<SetupUsers />} />
            
            {/* Public routes */}
            <Route path="/visita-gabinete/:visitId" element={<ScheduleVisit />} />
            <Route path="/affiliate/:leaderToken" element={<AffiliateForm />} />
            <Route path="/eventos/:slug" element={<EventRegistration />} />
            
            {/* Protected check-in routes */}
            <Route path="/checkin/:qrCode" element={
              <ProtectedRoute>
                <EventCheckin />
              </ProtectedRoute>
            } />
            <Route path="/office/checkin/:qrCode" element={
              <ProtectedRoute>
                <VisitCheckin />
              </ProtectedRoute>
            } />
            
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
            <Route path="/settings/ai-providers" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIProviders />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings/tracking" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TrackingSettings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings/privacy" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configurações de Privacidade (Em desenvolvimento)</h1>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings/organization" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configurações da Organização (Em desenvolvimento)</h1>
                  </div>
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* Office module routes */}
            <Route path="/office/new" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NewVisit />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/office/queue" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Queue />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/office/history" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <History />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/office/settings" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <OfficeSettings />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
        </BrowserRouter>
      </TrackingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
