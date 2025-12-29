import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
  role: string | null;
  last_login: string | null;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch users for is_active status and last_login
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("id, is_active, last_login");

      if (usersError) throw usersError;

      // Fetch user_roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine data
      const members: TeamMember[] = (profiles || []).map((profile) => {
        const user = users?.find((u) => u.id === profile.id);
        const userRole = roles?.find((r) => r.user_id === profile.id);

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          is_active: user?.is_active ?? true,
          role: userRole?.role || null,
          last_login: user?.last_login || null,
        };
      });

      return members;
    },
  });
}
