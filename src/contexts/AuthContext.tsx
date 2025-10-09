import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user && !!session;

  // Create user object from session data
  const createUserFromSession = (session: Session): User => {
    const user = session.user;
    const metadata = user.user_metadata || {};
    
    console.log('👤 Creating user from session:', {
      id: user.id,
      email: user.email,
      metadata
    });

    return {
      id: user.id,
      email: user.email || '',
      name: metadata.name || user.email?.split('@')[0] || 'User',
      role: metadata.role || 'user',
      avatar: "/src/assets/logo-rafael-prudente.png",
      userType: metadata.role === 'super_admin' ? 'platform_admin' : 'tenant_admin',
      accessibleTenants: [],
      currentTenantId: metadata.tenant_id || null
    };
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event, 'Session:', !!session);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Create user object directly from session
          const userData = createUserFromSession(session);
          console.log('✅ User set from session:', userData.userType, userData.email);
          setUser(userData);
        } else {
          console.log('❌ No session, clearing user');
          setUser(null);
          setUserRoles([]);
        }
        
        setIsLoading(false);
        console.log('🎯 Auth ready - isLoading = false, isAuthenticated =', !!session?.user);
      }
    );

    // Check for existing session after setting up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setIsLoading(false);
      }
      // onAuthStateChange will handle the rest
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
        return;
      }

      try {
        console.log('🔍 Buscando papéis para usuário:', user.id);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', user.id);

        if (error) throw error;
        setUserRoles(data || []);
        console.log('✅ Papéis carregados:', data);
      } catch (err) {
        console.error('❌ Erro ao buscar papéis:', err);
        setUserRoles([]);
      }
    };

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

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    userRoles,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};