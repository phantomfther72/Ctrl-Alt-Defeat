import { useState, useEffect, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";
import { useLocation, useNavigate } from "react-router-dom";

const TOUR_COMPLETED_KEY = "newera_tour_completed";
const TOUR_STEP_KEY = "newera_tour_step";
const TOUR_ACTIVE_KEY = "newera_tour_active";

const tourSteps: (Step & { route?: string })[] = [
  {
    target: "[data-tour='sidebar']",
    content: "Navigate between modules using the sidebar — Dashboard, Data Ingestion, Insights, Forecasting, and Admin.",
    title: "Welcome to New Era Insights! 👋",
    placement: "right",
    disableBeacon: true,
    route: "/",
  },
  {
    target: "[data-tour='topbar']",
    content: "The top bar shows your current page, search, notifications, and your account.",
    title: "Top Bar",
    placement: "bottom",
    route: "/",
  },
  {
    target: "[data-tour='dashboard-signals']",
    content: "These signal cards show demand trends — growing, stable, or declining — for each outlet based on AI analysis.",
    title: "Demand Signals",
    placement: "bottom",
    route: "/",
  },
  {
    target: "[data-tour='dashboard-chart']",
    content: "This chart tracks Delivered vs. Sold vs. Returned copies over time so you can spot trends at a glance.",
    title: "Trend Chart",
    placement: "top",
    route: "/",
  },
  {
    target: "[data-tour='upload-area']",
    content: "Drag & drop or click to upload your distribution CSV files. Data is automatically parsed and processed into analytics.",
    title: "Upload Your Data",
    placement: "bottom",
    disableBeacon: true,
    route: "/data-ingestion",
  },
  {
    target: "[data-tour='upload-history']",
    content: "View all previously uploaded files, their processing status, and preview parsed data.",
    title: "Upload History",
    placement: "top",
    route: "/data-ingestion",
  },
  {
    target: "[data-tour='insights-generate']",
    content: "Click here to run AI analysis on your data. It generates actionable insights and recommendations automatically.",
    title: "Generate AI Insights",
    placement: "bottom",
    disableBeacon: true,
    route: "/insights",
  },
  {
    target: "[data-tour='forecast-kpis']",
    content: "Key forecasting metrics: AI Confidence (R² score), Predicted Growth, Estimated Year-End revenue, and Peak Month.",
    title: "Forecast KPIs",
    placement: "bottom",
    disableBeacon: true,
    route: "/forecasting",
  },
  {
    target: "[data-tour='forecast-chart']",
    content: "The regression chart shows actual revenue vs. the linear trend line and any predicted future values.",
    title: "Regression Forecast",
    placement: "top",
    route: "/forecasting",
  },
  {
    target: "[data-tour='admin-section']",
    content: "Manage system settings, users, and data controls from the Admin panel. You're all set — enjoy exploring!",
    title: "Admin Panel 🎉",
    placement: "bottom",
    disableBeacon: true,
    route: "/admin",
  },
];

export function WalkthroughTour() {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // On mount: check if tour should resume or start fresh
  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (completed) return;

    const active = localStorage.getItem(TOUR_ACTIVE_KEY);
    const savedStep = localStorage.getItem(TOUR_STEP_KEY);

    if (active === "true" && savedStep) {
      // Resume tour at saved step — wait for DOM targets to render
      const idx = parseInt(savedStep, 10);
      const step = tourSteps[idx];
      if (step?.route === location.pathname) {
        setRun(false);
        setStepIndex(idx);
        // Wait for page content (including async data) to render
        const timer = setTimeout(() => setRun(true), 1200);
        return () => clearTimeout(timer);
      }
    } else if (location.pathname === "/") {
      // First time — start tour
      localStorage.setItem(TOUR_ACTIVE_KEY, "true");
      localStorage.setItem(TOUR_STEP_KEY, "0");
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status, action, index, type } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setRun(false);
        localStorage.setItem(TOUR_COMPLETED_KEY, "true");
        localStorage.removeItem(TOUR_ACTIVE_KEY);
        localStorage.removeItem(TOUR_STEP_KEY);
        return;
      }

      if (type === EVENTS.STEP_AFTER) {
        const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;

        if (nextIndex >= 0 && nextIndex < tourSteps.length) {
          const nextStep = tourSteps[nextIndex];
          // Persist step for cross-page resume
          localStorage.setItem(TOUR_STEP_KEY, String(nextIndex));

          if (nextStep.route && nextStep.route !== location.pathname) {
            setRun(false);
            navigate(nextStep.route);
            // The useEffect above will resume the tour on the new page
          } else {
            setStepIndex(nextIndex);
          }
        }
      }

      // If target not found, don't advance — just wait for it to appear
      if (type === EVENTS.TARGET_NOT_FOUND) {
        // Re-trigger after a delay to retry finding the target
        setRun(false);
        setTimeout(() => setRun(true), 1500);
      }
    },
    [location.pathname, navigate]
  );

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
      styles={{
        options: {
          arrowColor: "hsl(222, 47%, 11%)",
          backgroundColor: "hsl(222, 47%, 11%)",
          textColor: "#F1F5F9",
          primaryColor: "hsl(243, 75%, 59%)",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
          width: 340,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
        },
        tooltipTitle: {
          fontSize: "15px",
          fontWeight: 700,
        },
        tooltipContent: {
          fontSize: "13px",
          lineHeight: "1.5",
          padding: "8px 0 0",
        },
        buttonNext: {
          backgroundColor: "hsl(243, 75%, 59%)",
          borderRadius: "8px",
          fontSize: "13px",
          fontWeight: 600,
          padding: "8px 16px",
        },
        buttonBack: {
          color: "#94A3B8",
          fontSize: "13px",
        },
        buttonSkip: {
          color: "#64748B",
          fontSize: "12px",
        },
        spotlight: {
          borderRadius: "12px",
        },
      }}
    />
  );
}

/** Trigger tour manually (e.g. from a help button) */
export function resetTour() {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
  localStorage.removeItem(TOUR_STEP_KEY);
  localStorage.setItem(TOUR_ACTIVE_KEY, "true");
  localStorage.setItem(TOUR_STEP_KEY, "0");
  window.location.reload();
}
