import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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

// Mock user data
const MOCK_USER: User = {
  id: "1",
  email: "admin@rafaelprudente.com", 
  name: "Rafael Prudente",
  role: "Deputado Federal",
  avatar: "/src/assets/logo-rafael-prudente.png"
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isAuthenticated = !!user;

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    setIsLoading(true);
    
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("auth_user");
    const storedToken = localStorage.getItem("auth_token");
    const rememberMe = localStorage.getItem("auth_remember") === "true";
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        
        // If remember me is disabled, check session storage instead
        if (!rememberMe) {
          const sessionUser = sessionStorage.getItem("auth_user");
          const sessionToken = sessionStorage.getItem("auth_token");
          
          if (sessionUser && sessionToken) {
            setUser(JSON.parse(sessionUser));
          } else {
            // Session expired, clear localStorage
            localStorage.removeItem("auth_user");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_remember");
          }
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error("Error parsing stored user:", error);
        logout();
      }
    }
    
    setIsLoading(false);
  };

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Mock authentication delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock authentication logic
      if (email === "admin@rafaelprudente.com" && password === "123456") {
        const mockToken = `mock_token_${Date.now()}`;
        
        // Store user data
        const userJson = JSON.stringify(MOCK_USER);
        
        if (rememberMe) {
          // Store in localStorage for persistent login
          localStorage.setItem("auth_user", userJson);
          localStorage.setItem("auth_token", mockToken);
          localStorage.setItem("auth_remember", "true");
        } else {
          // Store in sessionStorage for session-only login
          sessionStorage.setItem("auth_user", userJson);
          sessionStorage.setItem("auth_token", mockToken);
          localStorage.setItem("auth_remember", "false");
        }
        
        setUser(MOCK_USER);
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo, ${MOCK_USER.name}`
        });
        
        return true;
      } else {
        toast({
          title: "Credenciais inválidas",
          description: "E-mail ou senha incorretos. Tente: admin@rafaelprudente.com / 123456",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
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

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_remember");
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