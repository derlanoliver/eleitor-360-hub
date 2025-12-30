import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Step } from "react-joyride";

interface TutorialContextType {
  run: boolean;
  steps: Step[];
  currentPage: string;
  stepIndex: number;
  startTutorial: (page: string, steps: Step[]) => void;
  stopTutorial: () => void;
  completeTutorial: (page: string) => void;
  hasSeenTutorial: (page: string) => boolean;
  resetTutorial: (page: string) => void;
  setStepIndex: (index: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_PREFIX = "tutorial_seen_";

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentPage, setCurrentPage] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  const hasSeenTutorial = useCallback((page: string): boolean => {
    return localStorage.getItem(`${TUTORIAL_STORAGE_PREFIX}${page}`) === "true";
  }, []);

  const startTutorial = useCallback((page: string, tutorialSteps: Step[]) => {
    setCurrentPage(page);
    setSteps(tutorialSteps);
    setStepIndex(0);
    setRun(true);
  }, []);

  const stopTutorial = useCallback(() => {
    setRun(false);
    setStepIndex(0);
  }, []);

  const completeTutorial = useCallback((page: string) => {
    localStorage.setItem(`${TUTORIAL_STORAGE_PREFIX}${page}`, "true");
    setRun(false);
    setStepIndex(0);
  }, []);

  const resetTutorial = useCallback((page: string) => {
    localStorage.removeItem(`${TUTORIAL_STORAGE_PREFIX}${page}`);
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        run,
        steps,
        currentPage,
        stepIndex,
        startTutorial,
        stopTutorial,
        completeTutorial,
        hasSeenTutorial,
        resetTutorial,
        setStepIndex,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorialContext() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorialContext must be used within a TutorialProvider");
  }
  return context;
}
