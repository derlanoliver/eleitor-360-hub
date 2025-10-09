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
  
  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.error('⏱️ [TenantContext] TIMEOUT: Loading travado por mais de 15s. Forçando conclusão.');
        setIsLoading(false);
      }
    }, 15000); // 15 segundos

    return () => clearTimeout(safetyTimeout);
  }, [isLoading]);

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
    console.log('🏢 [TenantContext] Carregando dados do tenant:', tenantId);
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
      console.log('✅ [TenantContext] Tenant carregado:', tenantData.name);
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
    console.error('❌ [TenantContext] Tenant não encontrado:', tenantId);
    return null;
  };

  // Função para carregar lista de tenants disponíveis (para platform admins)
  const loadAvailableTenants = async () => {
    console.log('🔍 [TenantContext] Verificando tenants disponíveis...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('⚠️ [TenantContext] Sem usuário para carregar tenants');
      return;
    }

    // Verificar se é platform admin na tabela users
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    const isPlatformAdmin = userData?.tenant_id === '00000000-0000-0000-0000-000000000001';

    if (isPlatformAdmin) {
      console.log('👑 [TenantContext] Platform admin detectado, carregando todos os tenants');
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
        console.log(`✅ [TenantContext] ${tenants.length} tenants carregados`);
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
    } else {
      console.log('⚠️ [TenantContext] Usuário não é platform admin');
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
    console.log('🚀 [TenantContext] Iniciando inicialização');

    // Reduzido de 300ms para 100ms
    setTimeout(async () => {
      try {
        console.log('🔍 [TenantContext] Buscando usuário autenticado...');
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('🔒 [TenantContext] Usuário não autenticado');
          if (mounted) setIsLoading(false);
          return;
        }

        console.log('👤 [TenantContext] Inicializando para user', user.email);

        // Query direta na tabela users unificada
        const { data: userData } = await supabase
          .from('users')
          .select('tenant_id, is_active')
          .eq('id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        const isPlatformAdmin = userData?.tenant_id === '00000000-0000-0000-0000-000000000001';
        const userType = isPlatformAdmin ? 'platform_admin' : 'tenant_admin';
        console.log('🔑 [TenantContext] User type:', userType);

        // Load available tenants (for platform admins) - NÃO BLOQUEAR
        if (userType === 'platform_admin') {
          console.log('🏢 [TenantContext] Platform admin detectado');
          loadAvailableTenants().catch(err => 
            console.error('❌ [TenantContext] Erro ao carregar tenants disponíveis:', err)
          );
        }
        
        // Verificar se há tenant ativo no localStorage (para platform admins)
        const activeTenantId = localStorage.getItem('active-tenant-id');
        
        if (activeTenantId && userType === 'platform_admin') {
          console.log('💾 [TenantContext] Tentando usar tenant armazenado:', activeTenantId);
          const tenantData = await loadTenantData(activeTenantId);
          if (tenantData && mounted) {
            console.log('✅ [TenantContext] Tenant carregado do localStorage');
            setTenant(tenantData);
            applyBranding(tenantData);
            setIsLoading(false);
            return;
          }
        }

        // Se platform admin e não tem tenant selecionado, selecionar o primeiro disponível
        if (userType === 'platform_admin' && !activeTenantId) {
          console.log('🎯 [TenantContext] Nenhum tenant ativo, buscando primeiro tenant...');
          const { data: tenants } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('status', 'active')
            .order('name')
            .limit(1);

          if (tenants && tenants.length > 0 && mounted) {
            const firstTenant = tenants[0];
            console.log('✅ [TenantContext] Selecionando primeiro tenant:', firstTenant.name);
            const tenantData = await loadTenantData(firstTenant.id);
            if (tenantData) {
              setTenant(tenantData);
              applyBranding(tenantData);
              localStorage.setItem('active-tenant-id', firstTenant.id);
            }
            setIsLoading(false);
            return;
          }
        }

        // Para tenant admins, usar tenant do userData
        if (userType === 'tenant_admin' && userData?.tenant_id) {
          console.log('🏢 [TenantContext] Tenant do usuário:', userData.tenant_id);
          const tenantData = await loadTenantData(userData.tenant_id);
          if (tenantData && mounted) {
            setTenant(tenantData);
            applyBranding(tenantData);
          }
        } else {
          console.log('⚠️ [TenantContext] Nenhum tenant identificado');
        }
      } catch (err) {
        console.error('💥 [TenantContext] Erro ao buscar configuração:', err);
      } finally {
        if (mounted) {
          console.log('✅ [TenantContext] Finalizado (setIsLoading(false))');
          setIsLoading(false);
        }
      }
    }, 100); // Reduzido para 100ms

    return () => {
      console.log('🧹 [TenantContext] Cleanup');
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
