import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppRole, UserRole } from '@/lib/rbac';

/**
 * Hook para buscar e gerenciar papéis do usuário autenticado
 * 
 * Busca automaticamente os papéis quando o usuário faz login
 * e limpa quando faz logout.
 */
export function useRoles() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        
        // Buscar papéis do usuário atual na tabela user_roles
        const { data: userRolesData, error: userRolesError } = await supabase
          .from('user_roles')
          .select('role, tenant_id');
        
        if (userRolesError) throw userRolesError;

        // Se user_roles tem dados, usa eles como fonte primária
        if (userRolesData && userRolesData.length > 0) {
          setRoles(userRolesData as UserRole[]);
          setError(null);
        } else {
          // Fallback: buscar role global do profiles (para compatibilidade retroativa)
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (profileError) throw profileError;

            // Converter profiles.role em formato UserRole (global, tenant_id = null)
            if (profileData?.role) {
              setRoles([{ 
                role: profileData.role as AppRole, 
                tenant_id: null // Role global
              }]);
            } else {
              setRoles([]);
            }
          } else {
            setRoles([]);
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar papéis do usuário:', err);
        setError(err as Error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    // Buscar papéis inicialmente
    fetchRoles();

    // Recarregar quando usuário fizer login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchRoles();
      } else if (event === 'SIGNED_OUT') {
        setRoles([]);
        setLoading(false);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { roles, loading, error };
}
