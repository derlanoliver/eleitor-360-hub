import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSafeSupabase() {
  const { toast } = useToast();

  const safeQuery = async <T = any>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> => {
    try {
      // Validar se o Supabase está disponível
      if (!supabase || typeof supabase.from !== 'function') {
        console.error('❌ Supabase client não está inicializado');
        throw new Error('Sistema de banco de dados não está disponível. Tente novamente em alguns segundos.');
      }
      
      console.log('✅ Supabase client validado, executando query...');
      return await queryFn();
    } catch (error: any) {
      console.error('❌ Erro no query Supabase:', error);
      
      toast({
        title: "Erro ao carregar dados",
        description: error.message || "Erro de conexão com o banco de dados",
        variant: "destructive"
      });
      
      return { data: null, error };
    }
  };

  return { safeQuery, supabase };
}
