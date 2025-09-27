import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  Target, 
  MessageSquare,
  Settings,
  Shield,
  Building,
  LogOut
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Menu items organizados por seção
const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Lideranças", url: "/leaders", icon: UserCheck },
];

const campaignItems = [
  { title: "Campanhas", url: "/campaigns", icon: Target },
  { title: "Eventos", url: "/events", icon: Calendar },
  { title: "Segmentos", url: "/segments", icon: Target },
];

const communicationItems = [
  { title: "Mensagens", url: "/messaging", icon: MessageSquare },
];

const settingsItems = [
  { title: "Privacidade", url: "/settings/privacy", icon: Shield },
  { title: "Organização", url: "/settings/organization", icon: Building },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";
  
  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary-100 text-primary-700 font-medium border-r-2 border-primary-500" : "hover:bg-gray-100 text-gray-700";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        {/* Logo/Header */}
        <div className="p-4 border-b border-gray-200">
          {!isCollapsed ? (
            <div>
              <h2 className="text-lg font-bold text-primary-600">
                Plataforma 360
              </h2>
              <p className="text-sm text-gray-600">Eleitor/DF</p>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            {!isCollapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        ${getNavCls(isActive)} 
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      `}
                    >
                      <>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Campanhas & Eventos */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            {!isCollapsed && "Campanhas"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {campaignItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        ${getNavCls(isActive)} 
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      `}
                    >
                      <>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Comunicação */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            {!isCollapsed && "Comunicação"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        ${getNavCls(isActive)} 
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      `}
                    >
                      <>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            {!isCollapsed && "Configurações"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => `
                        ${getNavCls(isActive)} 
                        flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      `}
                    >
                      <>
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto p-4 border-t border-gray-200">
          <SidebarMenuButton asChild>
            <NavLink 
              to="/login" 
              className="text-red-600 hover:bg-red-50 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <>
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span className="ml-3">Sair</span>}
              </>
            </NavLink>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}