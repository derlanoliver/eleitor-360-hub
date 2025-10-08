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

  // Fetch user profile with direct queries (avoiding RPC issues)
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      console.log('🔍 Fetching user profile for:', userId);

      // Try platform_admins first
      const { data: platformAdmin, error: adminError } = await supabase
        .from('platform_admins')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (platformAdmin && !adminError) {
        console.log('✅ Found platform_admin:', platformAdmin.email);
        
        // Get accessible tenants for platform admin
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('status', 'active');

        return {
          id: userId,
          email: platformAdmin.email,
          name: platformAdmin.name,
          role: platformAdmin.role,
          avatar: "/src/assets/logo-rafael-prudente.png",
          userType: 'platform_admin',
          accessibleTenants: tenants?.map(t => t.id) || [],
          currentTenantId: null
        };
      }

      // If not platform admin, try profiles (tenant admin)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile && !profileError) {
        console.log('✅ Found tenant profile:', profile.email);
        return {
          id: userId,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatar: "/src/assets/logo-rafael-prudente.png",
          userType: 'tenant_admin',
          accessibleTenants: [profile.tenant_id],
          currentTenantId: profile.tenant_id
        };
      }

      console.warn('⚠️ No user profile found for:', userId);
      return null;
    } catch (err) {
      console.error('❌ Exception fetching user profile:', err);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (!mounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // CRITICAL: Use setTimeout(0) to avoid Supabase deadlock
          setTimeout(async () => {
            if (!mounted) return;
            
            console.log('👤 Fetching user profile for:', session.user.id);
            const profile = await fetchUserProfile(session.user.id);
            
            if (profile && mounted) {
              console.log('✅ User profile loaded:', profile.userType);
              setUser(profile);
            } else {
              console.warn('⚠️ Failed to load user profile');
            }
            
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
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