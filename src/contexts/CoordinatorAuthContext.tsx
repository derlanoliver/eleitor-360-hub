import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CoordinatorSession {
  leader_id: string;
  nome_completo: string;
  telefone: string;
  email: string | null;
  affiliate_token: string | null;
  pontuacao_total: number;
  cadastros: number;
  hierarchy_level: number | null;
  is_verified: boolean | null;
  cidade_nome: string | null;
  session_token: string;
}

interface CoordinatorAuthContextType {
  session: CoordinatorSession | null;
  login: (data: CoordinatorSession) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const CoordinatorAuthContext = createContext<CoordinatorAuthContextType>({
  session: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function CoordinatorAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CoordinatorSession | null>(() => {
    try {
      const stored = sessionStorage.getItem("coordinator_session");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback((data: CoordinatorSession) => {
    setSession(data);
    sessionStorage.setItem("coordinator_session", JSON.stringify(data));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    sessionStorage.removeItem("coordinator_session");
  }, []);

  return (
    <CoordinatorAuthContext.Provider
      value={{
        session,
        login,
        logout,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </CoordinatorAuthContext.Provider>
  );
}

export function useCoordinatorAuth() {
  return useContext(CoordinatorAuthContext);
}
