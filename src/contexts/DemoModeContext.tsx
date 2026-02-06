import { createContext, useContext, ReactNode, useMemo, useCallback } from "react";
import { useDemoMode } from "@/hooks/useDemoMode";
import {
  maskName,
  maskPhone,
  maskEmail,
  maskAddress,
  maskNumber,
  maskPercentage,
  maskCity,
  maskRecord,
  maskRecords,
  maskObservation,
  maskSocialHandle,
  maskDate,
} from "@/lib/demoMask";

interface DemoModeContextType {
  isDemoMode: boolean;
  // Convenience wrappers that only mask when demo mode is active
  m: {
    name: (val: string | null | undefined) => string;
    phone: (val: string | null | undefined) => string;
    email: (val: string | null | undefined) => string;
    address: (val: string | null | undefined) => string;
    number: (val: number, label?: string) => number;
    percentage: (val: number, label?: string) => number;
    city: (val: string | null | undefined) => string;
    date: (val: string | null | undefined) => string | null;
    social: (val: string | null | undefined) => string;
    observation: (val: string | null | undefined) => string;
    record: <T extends Record<string, unknown>>(rec: T) => T;
    records: <T extends Record<string, unknown>>(recs: T[]) => T[];
    /** Replaces platform name / brand references with a generic label */
    platformName: (val: string) => string;
  };
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { isDemoMode } = useDemoMode();

  const m = useMemo(() => ({
    name: (val: string | null | undefined) => isDemoMode ? maskName(val) : (val ?? ""),
    phone: (val: string | null | undefined) => isDemoMode ? maskPhone(val) : (val ?? ""),
    email: (val: string | null | undefined) => isDemoMode ? maskEmail(val) : (val ?? ""),
    address: (val: string | null | undefined) => isDemoMode ? maskAddress(val) : (val ?? ""),
    number: (val: number, label?: string) => isDemoMode ? maskNumber(val, label) : val,
    percentage: (val: number, label?: string) => isDemoMode ? maskPercentage(val, label) : val,
    city: (val: string | null | undefined) => isDemoMode ? maskCity(val) : (val ?? ""),
    date: (val: string | null | undefined) => isDemoMode ? maskDate(val) : (val ?? null),
    social: (val: string | null | undefined) => isDemoMode ? maskSocialHandle(val) : (val ?? ""),
    observation: (val: string | null | undefined) => isDemoMode ? maskObservation(val) : (val ?? ""),
    record: <T extends Record<string, unknown>>(rec: T) => isDemoMode ? maskRecord(rec) : rec,
    records: <T extends Record<string, unknown>>(recs: T[]) => isDemoMode ? maskRecords(recs) : recs,
    platformName: (val: string) => isDemoMode ? "Plataforma 360.ai" : val,
  }), [isDemoMode]);

  return (
    <DemoModeContext.Provider value={{ isDemoMode, m }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMask() {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMask must be used within DemoModeProvider");
  }
  return context;
}
