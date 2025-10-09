/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * Este módulo fornece tipos e funções auxiliares para verificação de papéis
 * e permissões no sistema multi-tenant.
 */

export type AppRole = 
  | 'super_admin'    // Acesso total a todos os tenants
  | 'super_user'     // Leitura total, sem modificações críticas
  | 'admin'          // CRUD completo no próprio tenant
  | 'atendente'      // Leitura + inserção limitada
  | 'checkin_operator'; // Apenas atualização de status de check-in

export interface UserRole {
  role: AppRole;
  tenant_id: string | null; // NULL = papel global (super_admin, super_user)
}

/**
 * Verifica se o usuário pode ver/acessar um tenant específico
 * Super admins/users globais podem ver tudo
 */
export function canSeeTenant(roles: UserRole[], tenantId?: string | null): boolean {
  // Super admins/users globais podem ver qualquer tenant
  if (roles.some(r => r.role === 'super_admin' || r.role === 'super_user')) {
    return true;
  }
  
  // Verifica se possui papel no tenant específico
  return roles.some(r => r.tenant_id && tenantId && r.tenant_id === tenantId);
}

/**
 * Verifica se o usuário possui um papel específico
 * Considera papéis globais (tenant_id NULL) como válidos para qualquer tenant
 */
export function hasRole(
  roles: UserRole[], 
  role: AppRole, 
  tenantId?: string | null
): boolean {
  return roles.some(r => {
    // Verifica se o papel corresponde
    if (r.role !== role) return false;
    
    // Papel global (tenant_id NULL) vale para qualquer tenant
    if (r.tenant_id === null) return true;
    
    // Se tenantId não foi especificado ou é null, só papéis globais passam
    if (tenantId === undefined || tenantId === null) return false;
    
    // Verifica papel no tenant específico
    return r.tenant_id === tenantId;
  });
}

/**
 * Verifica se o usuário possui PELO MENOS UM dos papéis da lista
 * Útil para verificar permissões que aceitam múltiplos papéis
 */
export function hasAnyRole(
  roles: UserRole[], 
  allowedRoles: AppRole[], 
  tenantId?: string | null
): boolean {
  return allowedRoles.some(role => hasRole(roles, role, tenantId));
}

/**
 * Verifica se o usuário é super admin ou super user (papéis globais)
 */
export function isSuperUser(roles: UserRole[]): boolean {
  return roles.some(r => 
    (r.role === 'super_admin' || r.role === 'super_user') && 
    r.tenant_id === null
  );
}

/**
 * Retorna lista de tenants aos quais o usuário tem acesso
 * Super users retornam array vazio (interpretado como "todos")
 */
export function getAccessibleTenantIds(roles: UserRole[]): string[] | 'all' {
  if (isSuperUser(roles)) {
    return 'all';
  }
  
  return [...new Set(
    roles
      .filter(r => r.tenant_id !== null)
      .map(r => r.tenant_id as string)
  )];
}

/**
 * Matriz de permissões por papel (para referência)
 */
export const ROLE_PERMISSIONS = {
  super_admin: {
    description: 'Acesso total a todos os tenants',
    canViewAllTenants: true,
    canModifyAllTenants: true,
    canManageRoles: true,
  },
  super_user: {
    description: 'Leitura total, sem modificações críticas',
    canViewAllTenants: true,
    canModifyAllTenants: false,
    canManageRoles: false,
  },
  admin: {
    description: 'CRUD completo no próprio tenant',
    canViewAllTenants: false,
    canModifyOwnTenant: true,
    canManageRolesInTenant: true,
  },
  atendente: {
    description: 'Leitura + inserção limitada (contatos, visitas)',
    canViewAllTenants: false,
    canModifyOwnTenant: 'limited',
    canManageRoles: false,
  },
  checkin_operator: {
    description: 'Apenas atualização de status de check-in',
    canViewAllTenants: false,
    canModifyOwnTenant: 'checkin_only',
    canManageRoles: false,
  },
} as const;
