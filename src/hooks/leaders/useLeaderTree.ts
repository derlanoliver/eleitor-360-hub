import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LeaderTreeNode {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  parent_leader_id: string | null;
  hierarchy_level: number | null;
  depth: number;
  cadastros: number;
  pontuacao_total: number;
  is_active: boolean;
  cidade_id: string | null;
  children?: LeaderTreeNode[];
}

export interface CoordinatorStats {
  total_leaders: number;
  total_cadastros: number;
  total_pontos: number;
}

export interface Coordinator {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone: string | null;
  cadastros: number;
  pontuacao_total: number;
  is_active: boolean;
  cidade_id: string | null;
  cidade?: { nome: string } | null;
}

// Fetch all coordinators
export function useCoordinators() {
  return useQuery({
    queryKey: ["coordinators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, email, telefone, cadastros, pontuacao_total, is_active, cidade_id, cidade:office_cities(nome)")
        .eq("is_coordinator", true)
        .order("nome_completo");

      if (error) throw error;
      return data as Coordinator[];
    },
  });
}

// Fetch leader tree for a coordinator
export function useLeaderTree(coordinatorId: string | null) {
  return useQuery({
    queryKey: ["leader-tree", coordinatorId],
    queryFn: async () => {
      if (!coordinatorId) return null;

      const { data, error } = await supabase.rpc("get_leader_tree", {
        _leader_id: coordinatorId,
      });

      if (error) throw error;

      // Convert flat list to tree structure
      const nodes = data as LeaderTreeNode[];
      return buildTree(nodes, coordinatorId);
    },
    enabled: !!coordinatorId,
  });
}

// Build tree structure from flat list
function buildTree(nodes: LeaderTreeNode[], rootId: string): LeaderTreeNode | null {
  const nodeMap = new Map<string, LeaderTreeNode>();
  
  // Create a map of all nodes
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  let root: LeaderTreeNode | null = null;

  // Build the tree
  nodes.forEach(node => {
    const current = nodeMap.get(node.id)!;
    if (node.id === rootId) {
      root = current;
    } else if (node.parent_leader_id && nodeMap.has(node.parent_leader_id)) {
      const parent = nodeMap.get(node.parent_leader_id)!;
      if (!parent.children) parent.children = [];
      parent.children.push(current);
    }
  });

  return root;
}

// Fetch coordinator network stats
export function useCoordinatorStats(coordinatorId: string | null) {
  return useQuery({
    queryKey: ["coordinator-stats", coordinatorId],
    queryFn: async () => {
      if (!coordinatorId) return null;

      const { data, error } = await supabase.rpc("get_coordinator_network_stats", {
        _coordinator_id: coordinatorId,
      });

      if (error) throw error;
      return data?.[0] as CoordinatorStats | null;
    },
    enabled: !!coordinatorId,
  });
}

// Fetch available leaders (not in any tree)
export function useAvailableLeaders() {
  return useQuery({
    queryKey: ["available-leaders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lideres")
        .select("id, nome_completo, email, telefone, cadastros, pontuacao_total, cidade:office_cities(nome)")
        .is("parent_leader_id", null)
        .eq("is_coordinator", false)
        .eq("is_active", true)
        .order("nome_completo");

      if (error) throw error;
      return data;
    },
  });
}

// Promote leader to coordinator
export function usePromoteToCoordinator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaderId: string) => {
      const { data, error } = await supabase.rpc("promote_to_coordinator", {
        _leader_id: leaderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinators"] });
      queryClient.invalidateQueries({ queryKey: ["available-leaders"] });
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      toast({
        title: "Líder promovido",
        description: "O líder foi promovido a coordenador com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao promover líder",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Demote coordinator
export function useDemoteCoordinator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaderId: string) => {
      const { data, error } = await supabase.rpc("demote_coordinator", {
        _leader_id: leaderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coordinators"] });
      queryClient.invalidateQueries({ queryKey: ["available-leaders"] });
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["leader-tree"] });
      toast({
        title: "Coordenador rebaixado",
        description: "O coordenador foi removido da hierarquia.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rebaixar coordenador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Set parent leader (add subordinate)
export function useSetParentLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leaderId, parentId }: { leaderId: string; parentId: string }) => {
      const { data, error } = await supabase.rpc("set_parent_leader", {
        _leader_id: leaderId,
        _parent_id: parentId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-tree"] });
      queryClient.invalidateQueries({ queryKey: ["available-leaders"] });
      queryClient.invalidateQueries({ queryKey: ["coordinator-stats"] });
      toast({
        title: "Subordinado adicionado",
        description: "O líder foi vinculado à hierarquia com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao vincular líder",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Remove leader from tree
export function useRemoveFromTree() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaderId: string) => {
      const { data, error } = await supabase.rpc("remove_from_tree", {
        _leader_id: leaderId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader-tree"] });
      queryClient.invalidateQueries({ queryKey: ["available-leaders"] });
      queryClient.invalidateQueries({ queryKey: ["coordinator-stats"] });
      toast({
        title: "Líder removido",
        description: "O líder foi removido da hierarquia.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover líder",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
