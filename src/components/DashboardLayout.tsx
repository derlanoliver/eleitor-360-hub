import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import UserMenu from "./UserMenu";
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
            <SidebarTrigger className="mr-4 h-8 w-8 rounded-md hover:bg-gray-100 flex items-center justify-center">
              <Menu className="h-4 w-4" />
            </SidebarTrigger>
            
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                Plataforma 360 Eleitor/DF
              </h1>
            </div>

            {/* User Menu */}
            <UserMenu />
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