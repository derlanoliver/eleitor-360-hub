import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
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
  LogOut,
  UserCog,
  Building2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoles } from "@/hooks/useRoles";
import { isSuperUser } from "@/lib/rbac";

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
import { useIsMobile } from "@/hooks/use-mobile";

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
  { title: "Configurações", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Setup Usuários", url: "/setup-users", icon: UserCog },
];

const platformItems = [
  { title: "Gerenciar Tenants", url: "/platform/tenants", icon: Building2 },
  { title: "Usuários Globais", url: "/platform/admins", icon: Shield },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { roles } = useRoles();
  const isSuper = isSuperUser(roles);
  const isPlatformAdmin = user?.userType === 'platform_admin';

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);
  
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
            flex items-center ${isCollapsed ? 'justify-center px-2.5 py-3' : 'px-3 py-2'} rounded-lg text-sm font-medium transition-colors w-full
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
        <div className={`${isCollapsed ? 'py-6 px-2.5' : 'p-4'} ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
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

        {/* Plataforma (apenas platform_admin) */}
        {isPlatformAdmin && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-orange-600 text-xs font-medium uppercase tracking-wider">
                Plataforma
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {platformItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin (apenas super_admin) */}
        {isSuper && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-red-500 text-xs font-medium uppercase tracking-wider">
                Admin
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Logout */}
        <div className={`mt-auto ${isCollapsed ? 'py-6 px-2.5' : 'p-4'} ${!isCollapsed ? 'border-t border-gray-200' : ''}`}>
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