import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ContactImport {
  nome_completo: string;
  whatsapp: string;
  data_nascimento: string;
  endereco: string;
  observacao?: string;
  cidade?: string;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  updated: number;
  errors: Array<{ line: number; error: string }>;
}

export function useImportContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contacts: ContactImport[]): Promise<ImportResult> => {
      const { data, error } = await supabase.functions.invoke('import-contacts', {
        body: { contacts },
      });

      if (error) throw error;
      return data as ImportResult;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['office_leaders'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });

      if (result.success) {
        toast({
          title: "Importação concluída com sucesso!",
          description: `${result.inserted} contatos inseridos, ${result.updated} atualizados.`,
        });
      } else {
        toast({
          title: "Importação concluída com erros",
          description: `${result.inserted} inseridos, ${result.updated} atualizados, ${result.errors.length} erros.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      const message = error?.message || "Erro ao importar contatos";
      toast({
        title: "Erro na importação",
        description: message,
        variant: "destructive",
      });
    },
  });
}
