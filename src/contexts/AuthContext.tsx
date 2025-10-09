import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/rbac";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  userType: 'platform_admin' | 'tenant_admin';
  accessibleTenants: string[];
  currentTenantId?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRoles: UserRole[];
  rolesLoaded: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user && !!session;

  // Create user object from session data
  const createUserFromSession = (session: Session, userData?: any): User => {
    const user = session.user;
    const metadata = user.user_metadata || {};

    if (userData) {
      const isPlatformAdmin = userData.tenant_id === '00000000-0000-0000-0000-000000000001';
      
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: metadata.role || 'user',
        avatar: "/src/assets/logo-rafael-prudente.png",
        userType: isPlatformAdmin ? 'platform_admin' : 'tenant_admin',
        accessibleTenants: [],
        currentTenantId: isPlatformAdmin ? null : userData.tenant_id
      };
    }

    // Fallback para metadados
    const isPlatformAdmin = user.email?.endsWith('@eleitor360.ai');
    
    return {
      id: user.id,
      email: user.email || '',
      name: metadata.name || user.email?.split('@')[0] || 'User',
      role: metadata.role || 'user',
      avatar: "/src/assets/logo-rafael-prudente.png",
      userType: isPlatformAdmin ? 'platform_admin' : 'tenant_admin',
      accessibleTenants: [],
      currentTenantId: metadata.tenant_id || null
    };
  };

  // Fetch user data from unified users table
  const fetchUserData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ [AuthContext] Erro ao buscar user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ [AuthContext] Erro:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    console.log('🚀 [AuthContext] Inicializando');
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 [AuthContext] Event:', event);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          const userData = await fetchUserData(session.user.id);
          const userObj = createUserFromSession(session, userData);
          console.log('✅ [AuthContext] User ready:', userObj.email);
          setUser(userObj);
        } else {
          setUser(null);
          setUserRoles([]);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setIsLoading(false);
      } else if (session.user) {
        const userData = await fetchUserData(session.user.id);
        const userObj = createUserFromSession(session, userData);
        setUser(userObj);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user roles after login (non-blocking)
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        setUserRoles([]);
        setRolesLoaded(true);
        return;
      }

      try {
        console.log('🔍 Buscando papéis para usuário:', user.id);
        
        // Validar se Supabase está disponível antes de fazer query
        if (!supabase || typeof supabase.from !== 'function') {
          console.error('❌ Supabase client não está disponível para buscar roles');
          setUserRoles([]);
          setRolesLoaded(true);
          return;
        }
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('❌ Erro ao buscar papéis:', error);
          throw error;
        }
        
        setUserRoles(data || []);
        console.log('✅ Papéis carregados:', data);
      } catch (err) {
        console.error('❌ Erro crítico ao buscar papéis:', err);
        setUserRoles([]);
      } finally {
        setRolesLoaded(true);
      }
    };

    setRolesLoaded(false);
    fetchUserRoles();
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Credenciais inválidas",
          description: error.message || "E-mail ou senha incorretos.",
          variant: "destructive"
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo de volta!`
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role: 'admin'
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      if (data.user) {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Você já pode fazer login."
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro durante o cadastro. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso."
      });
      
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao desconectar.",
        variant: "destructive"
      });
    }
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated,
    userRoles,
    rolesLoaded,
    login,
    signup,
    logout
  }), [user, isLoading, isAuthenticated, userRoles, rolesLoaded]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};