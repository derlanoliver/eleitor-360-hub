import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SupportTicket } from "./useSupportTickets";

export function useAllTickets() {
  return useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        abertos: data.filter(t => t.status === 'aberto').length,
        em_analise: data.filter(t => t.status === 'em_analise').length,
        respondidos: data.filter(t => t.status === 'respondido').length,
        resolvidos: data.filter(t => t.status === 'resolvido').length,
        fechados: data.filter(t => t.status === 'fechado').length,
      };
      
      return stats;
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      ticketId: string;
      status: string;
    }) => {
      const updateData: Record<string, any> = {
        status: data.status,
        updated_at: new Date().toISOString(),
      };
      
      if (data.status === 'resolvido') {
        updateData.resolved_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('support_tickets')
        .update(updateData)
        .eq('id', data.ticketId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
  });
}
