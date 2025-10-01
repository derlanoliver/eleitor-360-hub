import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  Target, 
  FolderKanban,
  Bot,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Menu items organizados por seção
const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Contatos", url: "/contacts", icon: Users },
  { title: "Lideranças", url: "/leaders", icon: UserCheck },
];

const campaignItems = [
  { title: "Campanhas", url: "/campaigns", icon: Target },
  { title: "Eventos", url: "/events", icon: Calendar },
  { title: "Programas", url: "/projects", icon: FolderKanban },
];

const communicationItems = [
  { title: "Agente IA", url: "/ai-agent", icon: Bot },
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

  const renderMenuItem = (item: { title: string; url: string; icon: any }) => {
    const content = (
      <SidebarMenuButton asChild>
        <NavLink 
          to={item.url} 
          end 
          className={({ isActive }) => `
            ${getNavCls(isActive)} 
            flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'px-3 py-2'} rounded-lg text-sm font-medium transition-colors w-full
          `}
        >
          <item.icon className={`${isCollapsed ? 'h-6 w-6' : 'h-5 w-5'} shrink-0`} />
          {!isCollapsed && <span className="ml-3">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        {/* Logo/Header */}
        <div className={`p-4 ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
          {!isCollapsed ? (
            <div>
              <h2 className="text-lg font-bold text-primary-600">
                Rafael Prudente 360.ai
              </h2>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-base">R</span>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Principal
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Campanhas & Eventos */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Campanhas
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {campaignItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Comunicação */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Comunicação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Configurações */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Configurações
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {renderMenuItem(item)}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className={`mt-auto p-4 ${!isCollapsed ? 'border-t border-gray-200' : ''}`}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/login" 
                    className="text-red-600 hover:bg-red-50 w-full flex items-center justify-center py-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut className="h-6 w-6" />
                  </NavLink>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Sair
              </TooltipContent>
            </Tooltip>
          ) : (
            <SidebarMenuButton asChild>
              <NavLink 
                to="/login" 
                className="text-red-600 hover:bg-red-50 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-3">Sair</span>
              </NavLink>
            </SidebarMenuButton>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}