import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganization } from "@/hooks/useOrganization";
import { useDemoMask } from "@/contexts/DemoModeContext";
import { 
  LayoutDashboard, Users, UserCheck, Calendar, Target, FolderKanban, Bot, Settings, Shield,
  Building, LogOut, UserPlus, List, History as HistoryIcon, MessageSquare, Mail, HelpCircle,
  Ticket, Map, ClipboardList, Smartphone, GitBranch, Clock, CalendarDays, Globe,
  ChevronDown, Eye, Heart, GitCompare, UsersRound, MessageCircle, Sparkles, CalendarCheck, FileBarChart
} from "lucide-react";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type AppRole = 'super_admin' | 'admin' | 'atendente' | 'checkin_operator';

interface MenuItem { title: string; url: string; icon: any; roles: AppRole[]; }
interface SubMenuItem { title: string; url: string; icon: any; }

const mainItems: MenuItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Contatos", url: "/contacts", icon: Users, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Lideranças", url: "/leaders", icon: UserCheck, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Árvore", url: "/leaders/tree", icon: GitBranch, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Mapa Estratégico", url: "/strategic-map", icon: Map, roles: ['super_admin', 'admin', 'atendente'] },
];

const campaignItems: MenuItem[] = [
  { title: "Campanhas", url: "/campaigns", icon: Target, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Pesquisas", url: "/surveys", icon: ClipboardList, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Eventos", url: "/events", icon: Calendar, roles: ['super_admin', 'admin', 'atendente', 'checkin_operator'] },
  { title: "Programas", url: "/projects", icon: FolderKanban, roles: ['super_admin', 'admin', 'atendente'] },
];

const publicOpinionSubItems: SubMenuItem[] = [
  { title: "Visão Geral", url: "/public-opinion", icon: Eye },
  { title: "Sentimento", url: "/public-opinion/sentiment", icon: Heart },
  { title: "Linha do Tempo", url: "/public-opinion/timeline", icon: Clock },
  { title: "Comparação", url: "/public-opinion/comparison", icon: GitCompare },
  { title: "Demografia", url: "/public-opinion/demographics", icon: UsersRound },
  { title: "Menções", url: "/public-opinion/comments", icon: MessageCircle },
  { title: "Insights IA", url: "/public-opinion/insights", icon: Sparkles },
  { title: "Eventos", url: "/public-opinion/events", icon: CalendarCheck },
  { title: "Relatórios", url: "/public-opinion/reports", icon: FileBarChart },
];

const communicationItems: MenuItem[] = [
  { title: "Agente IA", url: "/ai-agent", icon: Bot, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "WhatsApp", url: "/whatsapp", icon: MessageSquare, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Email", url: "/email", icon: Mail, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "SMS", url: "/sms", icon: Smartphone, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Agendados", url: "/scheduled", icon: Clock, roles: ['super_admin', 'admin', 'atendente'] },
];

const officeItems: MenuItem[] = [
  { title: "Nova Visita", url: "/office/new", icon: UserPlus, roles: ['super_admin', 'admin', 'atendente'] },
  { title: "Agenda", url: "/office/schedule", icon: CalendarDays, roles: ['super_admin'] },
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
  const { m } = useDemoMask();

  const platformName = m.platformName(organization?.nome_plataforma || "Minha Plataforma");
  const platformInitial = platformName.charAt(0).toUpperCase();
  const isCollapsed = state === "collapsed";

  const isPublicOpinionActive = currentPath.startsWith('/public-opinion');
  const [poOpen, setPoOpen] = useState(isPublicOpinionActive);

  useEffect(() => {
    if (isPublicOpinionActive) setPoOpen(true);
  }, [isPublicOpinionActive]);

  const filterByRole = (items: MenuItem[]) => {
    if (!role) return [];
    return items.filter(item => item.roles.includes(role as AppRole));
  };

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [location.pathname, isMobile, setOpenMobile]);
  
  const getNavCls = (isActive: boolean) =>
    isActive ? "bg-primary-100 text-primary-700 font-medium border-r-2 border-primary-500" : "hover:bg-gray-100 text-gray-700";

  const renderMenuItem = (item: MenuItem | SubMenuItem) => {
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
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">{item.title}</TooltipContent>
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
  const showPublicOpinion = role === 'super_admin';

  const renderSection = (label: string, items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <SidebarGroup>
        {!isCollapsed && (
          <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">{label}</SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>{renderMenuItem(item)}</SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-gray-200">
        {/* Logo/Header */}
        <div className={`${isCollapsed ? 'py-6 px-2.5' : 'p-4'} ${!isCollapsed ? 'border-b border-gray-200' : ''}`}>
          {!isCollapsed ? (
            <h2 className="text-lg font-bold text-primary-600">{platformName}</h2>
          ) : (
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-base">{platformInitial}</span>
            </div>
          )}
        </div>

        {renderSection("Principal", filteredMainItems)}
        {renderSection("Campanhas", filteredCampaignItems)}

        {/* Comunicação with Public Opinion collapsible */}
        {(filteredCommunicationItems.length > 0 || showPublicOpinion) && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">Comunicação</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {/* Public Opinion Collapsible - before Agente IA */}
                {showPublicOpinion && (
                  <SidebarMenuItem>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to="/public-opinion"
                              className={({ isActive }) => `
                                ${isPublicOpinionActive ? "bg-primary-100 text-primary-700 font-medium border-r-2 border-primary-500" : "hover:bg-gray-100 text-gray-700"}
                                flex items-center justify-center px-2.5 py-3 rounded-lg text-sm font-medium transition-colors w-full
                              `}
                            >
                              <Globe className="h-6 w-6 shrink-0" />
                            </NavLink>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">Opinião Pública</TooltipContent>
                      </Tooltip>
                    ) : (
                      <Collapsible open={poOpen} onOpenChange={setPoOpen}>
                        <CollapsibleTrigger className={`
                          ${isPublicOpinionActive ? "bg-primary-100 text-primary-700 font-medium" : "hover:bg-gray-100 text-gray-700"}
                          flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full
                        `}>
                          <Globe className="h-5 w-5 shrink-0" />
                          <span className="ml-3 flex-1 text-left">Opinião Pública</span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${poOpen ? 'rotate-180' : ''}`} />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 pl-3">
                            {publicOpinionSubItems.map((sub) => (
                              <NavLink
                                key={sub.url}
                                to={sub.url}
                                end
                                className={({ isActive }) => `
                                  ${isActive ? "text-primary-700 font-medium bg-primary-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
                                  flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors
                                `}
                              >
                                <sub.icon className="h-3.5 w-3.5 shrink-0" />
                                {sub.title}
                              </NavLink>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </SidebarMenuItem>
                )}
                {filteredCommunicationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>{renderMenuItem(item)}</SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {renderSection("Gabinete", filteredOfficeItems)}

        {/* Configurações */}
        {(filteredSettingsItems.length > 0 || filteredAdminSettingsItems.length > 0) && (
          <SidebarGroup>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-gray-500 text-xs font-medium uppercase tracking-wider">Configurações</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>{renderMenuItem(item)}</SidebarMenuItem>
                ))}
                {isSuperAdmin && filteredAdminSettingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>{renderMenuItem(item)}</SidebarMenuItem>
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
              <TooltipContent side="right" className="font-medium">Sair</TooltipContent>
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
