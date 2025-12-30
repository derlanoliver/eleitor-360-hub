import Joyride, { CallBackProps, STATUS, EVENTS, ACTIONS } from "react-joyride";
import { useTutorialContext } from "@/contexts/TutorialContext";

interface TutorialOverlayProps {
  page: string;
  onComplete?: () => void;
}

export function TutorialOverlay({ page, onComplete }: TutorialOverlayProps) {
  const { run, steps, stepIndex, setStepIndex, completeTutorial, stopTutorial, currentPage } =
    useTutorialContext();

  // Only render if this is the current page's tutorial
  if (currentPage !== page) {
    return null;
  }

  const handleCallback = (data: CallBackProps) => {
    const { status, action, type, index } = data;

    // Handle step navigation
    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      }
    }

    // Handle completion or skip
    if (status === STATUS.FINISHED) {
      completeTutorial(page);
      onComplete?.();
    } else if (status === STATUS.SKIPPED) {
      completeTutorial(page);
    } else if (action === ACTIONS.CLOSE) {
      stopTutorial();
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      showSkipButton
      showProgress
      disableOverlayClose
      spotlightClicks={false}
      callback={handleCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Finalizar",
        next: "Próximo",
        skip: "Pular tutorial",
        open: "Abrir",
      }}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          zIndex: 10000,
          arrowColor: "#fff",
          backgroundColor: "#fff",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          textColor: "#333",
        },
        spotlight: {
          borderRadius: 8,
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        tooltipContainer: {
          textAlign: "left" as const,
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        tooltipContent: {
          fontSize: 14,
          lineHeight: 1.6,
          padding: "8px 0",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: 8,
          fontSize: 14,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: 10,
          fontSize: 14,
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 13,
        },
        buttonClose: {
          color: "hsl(var(--muted-foreground))",
        },
        tooltipFooter: {
          marginTop: 16,
        },
        overlay: {
          cursor: "default",
        },
      }}
      floaterProps={{
        disableAnimation: false,
      }}
    />
  );
}
