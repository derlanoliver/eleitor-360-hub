import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
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
    const brand = tenantData?.tenant_branding?.[0] || {};
    const root = document.documentElement;

    // Aplicar cor primária (default: #F25822)
    const primaryColor = brand.primary_color || '#F25822';
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--primary-600', primaryColor);

    // Aplicar logo no localStorage para uso global (se necessário)
    if (brand.logo_url) {
      localStorage.setItem('tenant-logo', brand.logo_url);
    }

    // Aplicar favicon dinamicamente
    if (brand.favicon_url) {
      let linkEl = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.rel = 'icon';
        document.head.appendChild(linkEl);
      }
      linkEl.href = brand.favicon_url;
    }
  };

  // Função para carregar dados de um tenant específico
  const loadTenantData = async (tenantId: string): Promise<TenantInfo | null> => {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select(`
        id,
        name,
        slug,
        status,
        account_code,
        tenant_branding (*),
        tenant_settings (*),
        tenant_domains (*)
      `)
      .eq('id', tenantId)
      .maybeSingle();

    if (tenantData) {
      return {
        ...tenantData,
        tenant_branding: Array.isArray(tenantData.tenant_branding) 
          ? tenantData.tenant_branding 
          : [tenantData.tenant_branding],
        tenant_settings: Array.isArray(tenantData.tenant_settings)
          ? tenantData.tenant_settings
          : [tenantData.tenant_settings],
        tenant_domains: Array.isArray(tenantData.tenant_domains)
          ? tenantData.tenant_domains
          : [tenantData.tenant_domains]
      };
    }
    return null;
  };

  // Função para carregar lista de tenants disponíveis (para platform admins)
  const loadAvailableTenants = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar se é platform admin
    const { data: platformAdmin } = await supabase
      .from('platform_admins')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (platformAdmin) {
      // Platform admins podem ver todos os tenants ativos
      const { data: tenants } = await supabase
        .from('tenants')
        .select(`
          id,
          name,
          slug,
          status,
          account_code,
          tenant_branding (logo_url)
        `)
        .eq('status', 'active')
        .order('name');

      if (tenants) {
        const formattedTenants = tenants.map((t: any) => ({
          ...t,
          tenant_branding: Array.isArray(t.tenant_branding) 
            ? t.tenant_branding 
            : t.tenant_branding ? [t.tenant_branding] : [],
          tenant_settings: [],
          tenant_domains: []
        }));
        setAvailableTenants(formattedTenants);
      }
    }
  };

  // Função para trocar de tenant (para platform admins)
  const switchTenant = async (tenantId: string) => {
    setIsLoading(true);
    
    const tenantData = await loadTenantData(tenantId);
    
    if (tenantData) {
      setTenant(tenantData);
      applyBranding(tenantData);
      
      // Persistir tenant ativo no localStorage
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
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('🔒 TenantContext: Usuário não autenticado');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('👤 TenantContext: Inicializando para user', user.id);

        // Get user context to check if platform_admin
        const { data: contextData } = await supabase.rpc('get_user_context', {
          user_id: user.id
        });

        const userType = contextData?.[0]?.user_type;
        console.log('🔑 TenantContext: User type:', userType);

        // Load available tenants (for platform admins)
        if (userType === 'platform_admin') {
          console.log('🏢 TenantContext: Platform admin detectado - carregando tenants');
          await loadAvailableTenants();
        }
        
        // Verificar se há tenant ativo no localStorage (para platform admins)
        const activeTenantId = localStorage.getItem('active-tenant-id');
        
        if (activeTenantId && userType === 'platform_admin') {
          console.log('💾 TenantContext: Tentando usar tenant armazenado:', activeTenantId);
          const tenantData = await loadTenantData(activeTenantId);
          if (tenantData && mounted) {
            console.log('✅ TenantContext: Tenant carregado do localStorage');
            setTenant(tenantData);
            applyBranding(tenantData);
            setIsLoading(false);
            return;
          }
        }

        // Se platform admin e não tem tenant selecionado, selecionar o primeiro disponível
        if (userType === 'platform_admin' && !activeTenantId) {
          console.log('🎯 TenantContext: Nenhum tenant ativo, buscando tenants disponíveis...');
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('status', 'active')
            .order('name')
            .limit(1);

          if (tenants && tenants.length > 0 && mounted) {
            const firstTenant = tenants[0];
            console.log('✅ TenantContext: Selecionando primeiro tenant:', firstTenant.name);
            await switchTenant(firstTenant.id);
            return;
          }
        }

        // Fallback: tentar por domínio
        const domain = window.location.hostname;
        console.log('🌐 TenantContext: Tentando por domínio:', domain);
        const { data, error } = await supabase.functions.invoke('tenant-config', {
          body: { domain },
        });

        if (error) {
          console.error('❌ TenantContext: tenant-config error:', error);
        }

        if (!mounted) return;

        if (data) {
          console.log('✅ TenantContext: Tenant encontrado via edge function');
          setTenant(data);
          applyBranding(data);
        } else {
          // Fallback: buscar tenant_id do profile do usuário logado
          console.log('🔄 TenantContext: Fallback - buscar tenant do profile');
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.tenant_id) {
            console.log('✅ TenantContext: Tenant encontrado via profile');
            const tenantData = await loadTenantData(profile.tenant_id);
            if (tenantData && mounted) {
              setTenant(tenantData);
              applyBranding(tenantData);
            }
          } else {
            console.log('⚠️ TenantContext: Nenhum tenant encontrado');
          }
        }
      } catch (err) {
        console.error('💥 TenantContext: Erro ao buscar configuração:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
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
    [tenant, isLoading, availableTenants]
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
