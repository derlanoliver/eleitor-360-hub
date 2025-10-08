/**
 * Whitelabel Utilities
 * 
 * Funções auxiliares para construir URLs usando domínios customizados
 * do tenant (whitelabel/multi-domínio).
 */

type TenantDomain = {
  domain: string;
  is_primary: boolean;
  ssl_status?: string;
};

type TenantWithDomains = {
  tenant_domains?: TenantDomain[];
};

/**
 * Constrói uma URL completa usando host e path
 * 
 * @param host - Domínio (ex: "eleitor360.ai")
 * @param path - Caminho relativo (ex: "/eventos/123")
 * @returns URL completa (ex: "https://eleitor360.ai/eventos/123")
 */
export function buildTenantUrl(host: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `https://${host}${normalizedPath}`;
}

/**
 * Retorna URL absoluta usando o domínio primário do tenant
 * Útil para gerar links de compartilhamento, QR codes, etc.
 * 
 * @param tenant - Objeto tenant com tenant_domains
 * @param path - Caminho relativo
 * @returns URL absoluta ou relativa (fallback)
 */
export function absoluteLinkForTenant(
  tenant: TenantWithDomains | null,
  path: string
): string {
  // Buscar domínio primário
  const primaryDomain = tenant?.tenant_domains?.find(d => d.is_primary)?.domain;
  
  // Se não houver domínio primário, usar o domínio atual
  const host = primaryDomain || window.location.hostname;
  
  return buildTenantUrl(host, path);
}

/**
 * Retorna o domínio primário do tenant ou o atual como fallback
 * 
 * @param tenant - Objeto tenant com tenant_domains
 * @returns Domínio primário ou hostname atual
 */
export function getPrimaryDomain(tenant: TenantWithDomains | null): string {
  return tenant?.tenant_domains?.find(d => d.is_primary)?.domain || window.location.hostname;
}

/**
 * Verifica se o domínio atual é o domínio primário do tenant
 * 
 * @param tenant - Objeto tenant com tenant_domains
 * @returns true se for o domínio primário
 */
export function isCurrentDomainPrimary(tenant: TenantWithDomains | null): boolean {
  const currentHost = window.location.hostname;
  const primaryDomain = tenant?.tenant_domains?.find(d => d.is_primary)?.domain;
  return currentHost === primaryDomain;
}
