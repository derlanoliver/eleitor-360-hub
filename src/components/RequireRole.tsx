import { ReactNode } from 'react';
import { useRoles } from '@/hooks/useRoles';
import { hasAnyRole, AppRole } from '@/lib/rbac';

interface RequireRoleProps {
  /** Lista de papéis permitidos (basta ter UM deles) */
  anyOf: AppRole[];
  
  /** ID do tenant a verificar (opcional) */
  tenantId?: string | null;
  
  /** Conteúdo a renderizar se tiver permissão */
  children: ReactNode;
  
  /** Conteúdo alternativo se NÃO tiver permissão */
  fallback?: ReactNode;
  
  /** Mostrar loading enquanto carrega papéis */
  showLoading?: boolean;
}

/**
 * Componente guard para controle de acesso baseado em papéis
 * 
 * Uso:
 * ```tsx
 * <RequireRole anyOf={['admin', 'atendente']}>
 *   <Button>Cadastrar contato</Button>
 * </RequireRole>
 * ```
 * 
 * Com tenant específico:
 * ```tsx
 * <RequireRole anyOf={['admin']} tenantId={currentTenantId}>
 *   <Button>Editar configurações</Button>
 * </RequireRole>
 * ```
 */
export function RequireRole({ 
  anyOf, 
  tenantId, 
  children, 
  fallback = null,
  showLoading = false 
}: RequireRoleProps) {
  const { roles, loading } = useRoles();
  
  // Enquanto carrega
  if (loading) {
    return showLoading ? <>Carregando...</> : null;
  }
  
  // Verificar permissão
  const hasPermission = hasAnyRole(roles, anyOf, tenantId);
  
  // Renderizar children ou fallback
  if (!hasPermission) return <>{fallback}</>;
  
  return <>{children}</>;
}
