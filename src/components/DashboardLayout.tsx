import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header com trigger do sidebar */}
          <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-10">
            <SidebarTrigger asChild>
              <Button variant="ghost" size="sm" className="mr-4">
                <Menu className="h-4 w-4" />
              </Button>
            </SidebarTrigger>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Plataforma 360 Eleitor/DF
              </h1>
            </div>

            {/* User info placeholder */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Rafael Prudente</p>
                <p className="text-xs text-gray-600">Deputado Distrital</p>
              </div>
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">RP</span>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}