import { createContext, useContext, useEffect, useMemo, useCallback, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Branding = {
  primary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  typography_settings?: any;
};

type TenantDomain = {
  domain: string;
  is_primary: boolean;
  ssl_status?: string;
};

type TenantInfo = {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended' | 'cancelled';
  account_code?: number;
  tenant_branding?: Branding[];
  tenant_settings?: any[];
  tenant_domains?: TenantDomain[];
};

type TenantContextType = {
  tenantId: string | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  availableTenants: TenantInfo[];
  switchTenant: (tenantId: string) => Promise<void>;
};

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenant: null,
  isLoading: true,
  availableTenants: [],
  switchTenant: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTenants, setAvailableTenants] = useState<TenantInfo[]>([]);

  // Função auxiliar para aplicar branding
  const applyBranding = (tenantData: TenantInfo) => {
    try {
      const brand = tenantData?.tenant_branding?.[0] || {};
      const root = document.documentElement;

      // Aplicar cor primária
      const primaryColor = brand.primary_color || '#F25822';
      root.style.setProperty('--primary', primaryColor);

      // Favicon
      if (brand.favicon_url) {
        let linkEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.rel = 'icon';
          document.head.appendChild(linkEl);
        }
        linkEl.href = brand.favicon_url;
      }
    } catch (error) {
      console.error('❌ Erro ao aplicar branding:', error);
    }
  };

  // Função para carregar dados de um tenant específico
  const loadTenantData = async (tenantId: string): Promise<TenantInfo | null> => {
    try {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id, name, slug, status, account_code')
        .eq('id', tenantId)
        .maybeSingle();

      if (tenantData) {
        return {
          ...tenantData,
          tenant_branding: [],
          tenant_settings: [],
          tenant_domains: []
        };
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar tenant:', error);
      return null;
    }
  };

  // Função para carregar lista de tenants disponíveis (para platform admins)
  const loadAvailableTenants = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', session.user.id)
        .maybeSingle();

      const isPlatformAdmin = userData?.tenant_id === '00000000-0000-0000-0000-000000000001';
      if (!isPlatformAdmin) return;

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, name, slug, status, account_code')
        .eq('status', 'active')
        .order('name');

      if (tenants) {
        const formattedTenants = tenants.map((t: any) => ({
          ...t,
          tenant_branding: [],
          tenant_settings: [],
          tenant_domains: []
        }));
        setAvailableTenants(formattedTenants);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tenants:', error);
    }
  };

  // Função para trocar de tenant (para platform admins)
  const switchTenant = useCallback(async (tenantId: string) => {
    setIsLoading(true);
    
    const tenantData = await loadTenantData(tenantId);
    
    if (tenantData) {
      setTenant(tenantData);
      applyBranding(tenantData);
      localStorage.setItem('active-tenant-id', tenantId);
      
      // Atualizar header x-tenant-id
      (supabase as any).rest = {
        ...(supabase as any).rest,
        headers: {
          ...((supabase as any).rest?.headers || {}),
          'x-tenant-id': tenantId,
        },
      };
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeTenant = async () => {
      try {
        console.log('🚀 [TenantContext] Iniciando inicialização');
        
        // Aguardar um momento para o AuthContext estar pronto
        await new Promise(resolve => { timeoutId = setTimeout(resolve, 150); });
        
        if (!mounted) return;

        // Buscar sessão atual
        console.log('🔍 [TenantContext] Verificando sessão...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('🔒 [TenantContext] Sem sessão ativa');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('👤 [TenantContext] Sessão encontrada:', session.user.email);

        // Buscar dados do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, is_active')
          .eq('id', session.user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (!userData) {
          console.error('❌ [TenantContext] Usuário não encontrado na tabela users');
          if (mounted) setIsLoading(false);
          return;
        }

        const PLATFORM_ADMIN_TENANT = '00000000-0000-0000-0000-000000000001';
        const isPlatformAdmin = userData.tenant_id === PLATFORM_ADMIN_TENANT;
        
        console.log('🔑 [TenantContext] Tipo:', isPlatformAdmin ? 'Platform Admin' : 'Tenant Admin');

        // Carregar tenants disponíveis (não bloqueia)
        if (isPlatformAdmin && mounted) {
          loadAvailableTenants().catch(err => 
            console.error('❌ Erro ao carregar tenants:', err)
          );
        }

        // Determinar tenant ativo
        let targetTenantId: string | null = null;

        if (isPlatformAdmin) {
          // Verificar localStorage primeiro
          const storedId = localStorage.getItem('active-tenant-id');
          if (storedId) {
            console.log('💾 [TenantContext] Usando tenant do localStorage:', storedId);
            targetTenantId = storedId;
          } else {
            // Buscar primeiro tenant ativo
            console.log('🔍 [TenantContext] Buscando primeiro tenant...');
            const { data: firstTenant } = await supabase
              .from('tenants')
              .select('id, name')
              .eq('status', 'active')
              .order('name')
              .limit(1)
              .maybeSingle();

            if (firstTenant) {
              console.log('✅ [TenantContext] Primeiro tenant:', firstTenant.name);
              targetTenantId = firstTenant.id;
            }
          }
        } else {
          // Tenant admin usa seu próprio tenant
          targetTenantId = userData.tenant_id;
          console.log('🏢 [TenantContext] Tenant do usuário:', targetTenantId);
        }

        // Carregar dados do tenant
        if (targetTenantId && mounted) {
          const tenantData = await loadTenantData(targetTenantId);
          if (tenantData) {
            setTenant(tenantData);
            applyBranding(tenantData);
            if (isPlatformAdmin) {
              localStorage.setItem('active-tenant-id', targetTenantId);
            }
            console.log('✅ [TenantContext] Tenant configurado');
          }
        }
      } catch (err) {
        console.error('💥 [TenantContext] Erro:', err);
      } finally {
        if (mounted) {
          console.log('✅ [TenantContext] Finalizado');
          setIsLoading(false);
        }
      }
    };

    initializeTenant();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Injetar header x-tenant-id globalmente no client Supabase
  useEffect(() => {
    if (!tenant?.id) return;

    // Modificar headers do client Supabase (approach funciona com client auto-gerado)
    const originalHeaders = (supabase as any).rest?.headers || {};
    (supabase as any).rest = {
      ...(supabase as any).rest,
      headers: {
        ...originalHeaders,
        'x-tenant-id': tenant.id,
      },
    };

    // Também injetar no realtime se disponível
    if ((supabase as any).realtime) {
      (supabase as any).realtime.accessToken = tenant.id;
    }
  }, [tenant?.id]);

  const value = useMemo(
    () => ({
      tenantId: tenant?.id ?? null,
      tenant,
      isLoading,
      availableTenants,
      switchTenant,
    }),
    [tenant, isLoading, availableTenants, switchTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de TenantProvider');
  }
  return context;
}
