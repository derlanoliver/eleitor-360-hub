import { ReactNode } from 'react';
import { useTenant } from '@/contexts/TenantContext';

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const { tenant, isLoading } = useTenant();

  console.log('🎨 [TenantThemeProvider] Estado:', { isLoading, tenant: tenant?.name });

  // Loading state
  if (isLoading) {
    console.log('⏳ [TenantThemeProvider] Mostrando tela de carregamento');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Tenant suspenso ou cancelado
  if (tenant?.status === 'suspended' || tenant?.status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold">
            Conta {tenant?.status === 'suspended' ? 'Suspensa' : 'Cancelada'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {tenant?.status === 'suspended'
              ? 'Sua conta está temporariamente suspensa. Entre em contato com o suporte para regularizar seu acesso.'
              : 'Esta conta foi cancelada. Para mais informações, entre em contato com o suporte.'}
          </p>
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Organização: <span className="font-semibold text-foreground">{tenant?.name}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tenant ativo: renderizar aplicação
  return <>{children}</>;
}
