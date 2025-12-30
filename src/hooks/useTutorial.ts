import { useEffect, useCallback } from "react";
import { Step } from "react-joyride";
import { useTutorialContext } from "@/contexts/TutorialContext";

interface UseTutorialOptions {
  autoStart?: boolean;
  delay?: number;
}

export function useTutorial(
  page: string,
  steps: Step[],
  options: UseTutorialOptions = {}
) {
  const { autoStart = true, delay = 800 } = options;
  const {
    run,
    startTutorial,
    stopTutorial,
    completeTutorial,
    hasSeenTutorial,
    resetTutorial,
    stepIndex,
    setStepIndex,
  } = useTutorialContext();

  // Auto-start tutorial on first visit
  useEffect(() => {
    if (autoStart && !hasSeenTutorial(page) && steps.length > 0) {
      const timer = setTimeout(() => {
        startTutorial(page, steps);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoStart, delay, hasSeenTutorial, page, startTutorial, steps]);

  // Manual restart
  const restartTutorial = useCallback(() => {
    resetTutorial(page);
    startTutorial(page, steps);
  }, [page, resetTutorial, startTutorial, steps]);

  // Complete handler
  const handleComplete = useCallback(() => {
    completeTutorial(page);
  }, [completeTutorial, page]);

  // Skip handler
  const handleSkip = useCallback(() => {
    completeTutorial(page);
  }, [completeTutorial, page]);

  return {
    run,
    stepIndex,
    setStepIndex,
    restartTutorial,
    stopTutorial,
    handleComplete,
    handleSkip,
    hasSeenTutorial: hasSeenTutorial(page),
  };
}
