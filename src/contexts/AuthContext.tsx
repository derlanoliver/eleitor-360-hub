import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Initialize with local data to avoid loading screen
  const getInitialUser = () => {
    const storedUser = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  };

  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  const verifySession = useCallback(async () => {
    const sessionToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    
    if (!sessionToken) {
      setUser(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('verify-session', {
        body: { sessionToken }
      });

      if (error || !data?.valid) {
        console.log('Session invalid or expired');
        logout();
      }
      // Se a sessão é válida, não faz nada - evita re-render desnecessário
      // O usuário já está setado do storage local
    } catch (error) {
      console.error('Error verifying session:', error);
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user") || sessionStorage.getItem("auth_user");
    
    // If we have local data, user is already set in initial state
    // Just verify silently in background
    if (userStr && storedToken) {
      try {
        // Silent background verification
        const { data, error } = await supabase.functions.invoke('verify-session', {
          body: { sessionToken: storedToken }
        });

        if (error || !data?.valid) {
          // Session invalid - clear and logout silently
          localStorage.removeItem("auth_user");
          localStorage.removeItem("auth_token");
          sessionStorage.removeItem("auth_user");
          sessionStorage.removeItem("auth_token");
          setUser(null);
        }
      } catch (error) {
        console.error("Silent auth verification failed:", error);
      }
    } else {
      // No local data - clear user state
      setUser(null);
    }
  }, []);

  // Check authentication on app load and set up session refresh
  useEffect(() => {
    checkAuth();
    
    // Set up automatic session check every 5 minutes
    const interval = setInterval(() => {
      verifySession();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAuth, verifySession]);

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('admin-login', {
        body: { email, password }
      });

      if (error || !data?.success) {
        toast({
          title: "Credenciais inválidas",
          description: data?.error || "E-mail ou senha incorretos.",
          variant: "destructive"
        });
        return false;
      }

      const userData: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        avatar: "/src/assets/logo-rafael-prudente.png"
      };

      const userJson = JSON.stringify(userData);
      
      if (rememberMe) {
        localStorage.setItem("auth_user", userJson);
        localStorage.setItem("auth_token", data.session.token);
      } else {
        sessionStorage.setItem("auth_user", userJson);
        sessionStorage.setItem("auth_token", data.session.token);
      }
      
      setUser(userData);
      
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${userData.name}`
      });
      
      return true;
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

  const logout = async () => {
    const sessionToken = localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
    
    // Call logout endpoint to invalidate session
    if (sessionToken) {
      try {
        await supabase.functions.invoke('admin-logout', {
          body: { sessionToken }
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear all stored data
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("auth_token");
    
    setUser(null);
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso."
    });
    
    navigate("/login");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuth
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