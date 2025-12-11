import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
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
  Briefcase,
  UserPlus,
  List,
  History as HistoryIcon,
  MessageSquare,
  Mail,
  HelpCircle,
  Ticket,
  Map,
  ClipboardList,
  Smartphone,
  GitBranch
} from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

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

type AppRole = 'super_admin' | 'admin' | 'atendente' | 'checkin_operator';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  roles: AppRole[];
}

// Menu items organizados por seção com roles permitidos
const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Contatos", url: "/contacts", icon: Users, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Lideranças", url: "/leaders", icon: UserCheck, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Árvore", url: "/leaders/tree", icon: GitBranch, roles: ['super_admin'] },
  { title: "Mapa Estratégico", url: "/strategic-map", icon: Map, roles: ['super_admin', 'admin', 'atendente'] },
];

const campaignItems: MenuItem[] = [
  { title: "Campanhas", url: "/campaigns", icon: Target, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Pesquisas", url: "/surveys", icon: ClipboardList, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Eventos", url: "/events", icon: Calendar, roles: ['super_admin', 'admin', 'atendente', 'checkin_operator'] },
  { title: "Programas", url: "/projects", icon: FolderKanban, roles: ['super_admin', 'admin', 'atendente'] },
];

const communicationItems: MenuItem[] = [
  { title: "Agente IA", url: "/ai-agent", icon: Bot, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Email", url: "/email", icon: Mail, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "SMS", url: "/sms", icon: Smartphone, roles: ['super_admin', 'admin', 'atendente'] },
];

const officeItems: MenuItem[] = [
  { title: "Nova Visita", url: "/office/new", icon: UserPlus, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Fila do Dia", url: "/office/queue", icon: List, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Histórico", url: "/office/history", icon: HistoryIcon, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Configurações", url: "/office/settings", icon: Settings, roles: ['super_admin', 'admin'] },
];

const settingsItems: MenuItem[] = [
  { title: "Privacidade", url: "/settings/privacy", icon: Shield, roles: ['super_admin', 'admin', 'atendente', 'checkin_operator'] },
  { title: "Organização", url: "/settings/organization", icon: Building, roles: ['super_admin', 'admin'] },
  { title: "Suporte", url: "/settings/support", icon: HelpCircle, roles: ['super_admin', 'admin', 'atendente', 'checkin_operator'] },
];

const adminSettingsItems: MenuItem[] = [
  { title: "Administrar Tickets", url: "/settings/admin-tickets", icon: Ticket, roles: ['super_admin'] },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isMobile = useIsMobile();
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { logout } = useAuth();
  const { role } = useUserRole();
  const { data: organization } = useOrganization();

  const platformName = organization?.nome_plataforma || "Minha Plataforma";
  const platformInitial = platformName.charAt(0).toUpperCase();

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  // Filter menu items based on user role
  const filterByRole = (items: MenuItem[]) => {
    if (!role) return [];
    return items.filter(item => item.roles.includes(role as AppRole));
  };

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [location.pathname, isMobile, setOpenMobile]);
  
  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary-100 text-primary-700 font-medium border-r-2 border-primary-500" : "hover:bg-gray-100 text-gray-700";

  const renderMenuItem = (item: MenuItem) => {
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

  const filteredMainItems = filterByRole(mainItems);
  const filteredCampaignItems = filterByRole(campaignItems);
  const filteredCommunicationItems = filterByRole(communicationItems);
  const filteredOfficeItems = filterByRole(officeItems);
  const filteredSettingsItems = filterByRole(settingsItems);
  const filteredAdminSettingsItems = filterByRole(adminSettingsItems);

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        {/* Logo/Header */}
        <div className={`${isCollapsed ? 'py-6 px-2.5' : 'p-4'} ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
          {!isCollapsed ? (
            <div>
              <h2 className="text-lg font-bold text-primary-600">
                {platformName}
              </h2>
            </div>
          ) : (
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-base">{platformInitial}</span>
            </div>
          )}
        </div>

        {/* Menu Principal */}
        {filteredMainItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Principal
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Campanhas & Eventos */}
        {filteredCampaignItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Campanhas
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCampaignItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Comunicação */}
        {filteredCommunicationItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Comunicação
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredCommunicationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Gabinete */}
        {filteredOfficeItems.length > 0 && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Gabinete
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredOfficeItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Configurações */}
        {(filteredSettingsItems.length > 0 || filteredAdminSettingsItems.length > 0) && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">
                Configurações
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item)}
                  </SidebarMenuItem>
                ))}
                {isSuperAdmin && filteredAdminSettingsItems.map((item) => (
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
                <button 
                  onClick={() => logout()}
                  className="text-red-600 hover:bg-red-50 w-full flex items-center justify-center py-3 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut className="h-6 w-6" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Sair
              </TooltipContent>
            </Tooltip>
          ) : (
            <button 
              onClick={() => logout()}
              className="text-red-600 hover:bg-red-50 w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="ml-3">Sair</span>
            </button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
