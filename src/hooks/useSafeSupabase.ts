import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useSafeSupabase() {
  const { toast } = useToast();

  const safeQuery = async <T = any>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> => {
    const maxAttempts = 3;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        // Validação mais robusta do client Supabase
        if (!supabase || typeof supabase.from !== 'function') {
          throw new Error('CLIENT_NOT_READY');
        }
        
        console.log(`✅ Supabase client validado (tentativa ${attempts + 1}/${maxAttempts})`);
        return await queryFn();
        
      } catch (error: any) {
        attempts++;
        
        // Se é erro de client não pronto e ainda tem tentativas
        if ((error.message === 'CLIENT_NOT_READY' || 
             error.message?.includes('not a function')) && 
            attempts < maxAttempts) {
          
          const delay = 100 * Math.pow(2, attempts - 1); // 100ms, 200ms, 400ms
          console.warn(`⏳ Aguardando client Supabase (${delay}ms)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Erro definitivo
        console.error('❌ Erro no query Supabase:', error);
        toast({
          title: "Erro ao carregar dados",
          description: error.message || "Erro de conexão com o banco de dados",
          variant: "destructive"
        });
        
        return { data: null, error };
      }
    }
    
    return { data: null, error: new Error('Max retries exceeded') };
  };

  return { safeQuery, supabase };
}
