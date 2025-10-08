import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Branding = {
  primary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  typography_settings?: Record<string, any>;
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
  tenant_branding?: Branding[];
  tenant_settings?: any[];
  tenant_domains?: TenantDomain[];
};

type TenantContextType = {
  tenantId: string | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
};

const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenant: null,
  isLoading: true,
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const domain = window.location.hostname;

        const { data, error } = await supabase.functions.invoke('tenant-config', {
          body: { domain },
        });

        if (error) {
          console.error('tenant-config error:', error);
        }

        if (!mounted) return;

        if (data) {
          setTenant(data);

          // Aplicar branding dinâmico
          const brand = data?.tenant_branding?.[0] || {};
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
        }
      } catch (err) {
        console.error('Erro ao buscar configuração do tenant:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
    }),
    [tenant, isLoading]
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
