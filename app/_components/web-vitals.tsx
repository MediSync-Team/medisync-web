"use client";

import { useReportWebVitals } from "next/web-vitals";

/**
 * Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB).
 * Dev: logs to console for baseline/regression checks.
 * Prod: hook a POST to an analytics/RUM endpoint here when ready.
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[web-vitals] ${metric.name}`, Math.round(metric.value));
    }
  });

  return null;
}
