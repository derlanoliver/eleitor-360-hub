import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

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
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user && !!session;

  // Fetch user profile using get_user_context
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase.rpc('get_user_context', {
        user_id: userId
      });

      if (error) {
        console.error('Error fetching user context:', error);
        return null;
      }

      if (!data || data.length === 0 || data[0].user_type === 'unknown') {
        console.log('No user context found for user:', userId);
        return null;
      }

      const context = data[0];
      const userData = context.user_data as any;

      return {
        id: userId,
        email: userData.email || '',
        name: userData.name || 'User',
        role: userData.role || 'admin',
        avatar: "/src/assets/logo-rafael-prudente.png",
        userType: context.user_type as 'platform_admin' | 'tenant_admin',
        accessibleTenants: context.accessible_tenants || [],
        currentTenantId: userData.tenant_id || null
      };
    } catch (err) {
      console.error('Exception fetching user context:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          console.log('👤 Fetching user profile for:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          if (profile && mounted) {
            console.log('✅ User profile loaded:', profile.userType, profile.accessibleTenants);
            setUser(profile);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      if (session?.user) {
        console.log('👤 Initial session - fetching user profile for:', session.user.id);
        const profile = await fetchUserProfile(session.user.id);
        if (profile && mounted) {
          console.log('✅ Initial user profile loaded:', profile.userType, profile.accessibleTenants);
          setUser(profile);
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
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
    } finally {
      setIsLoading(false);
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