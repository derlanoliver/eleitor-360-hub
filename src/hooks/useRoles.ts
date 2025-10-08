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
        
        // Buscar papéis do usuário atual
        const { data, error: queryError } = await supabase
          .from('user_roles')
          .select('role, tenant_id');
        
        if (queryError) throw queryError;
        
        setRoles((data || []) as UserRole[]);
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
