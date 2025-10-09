import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para acessar os papéis do usuário autenticado
 * 
 * Agora usa o AuthContext como fonte de dados,
 * que busca os papéis automaticamente após login.
 */
export function useRoles() {
  const { userRoles, isLoading } = useAuth();
  
  return { 
    roles: userRoles, 
    loading: isLoading, 
    error: null 
  };
}
