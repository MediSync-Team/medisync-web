'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../lib/i18n/context';

export interface TourStep {
  /** CSS selector for the element to highlight. Use [data-onboarding="id"] format. */
  selector: string;
  title: string;
  description: string;
  /** Where to place the tooltip relative to the highlighted element */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Props {
  /** localStorage key — tour shows only if key is absent */
  storageKey: string;
  steps: TourStep[];
  /** Delay (ms) before the tour appears after mount */
  delay?: number;
  /**
   * Gate the tour. When false the tour never activates and hides if already
   * showing — used to hold it back while a higher-priority modal (e.g. the
   * professional onboarding wizard) is open so they don't overlap.
   */
  enabled?: boolean;
}

export default function OnboardingTour({ storageKey, steps, delay = 900, enabled = true }: Props) {
  const { t } = useLang();
  const tour = t('onboardingTour');
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Ensure we only run on the client
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !enabled) return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const t = setTimeout(() => setActive(true), delay);
      return () => clearTimeout(t);
    }
  }, [mounted, storageKey, delay, enabled]);

  const updateRect = useCallback(() => {
    if (!active || stepIndex >= steps.length) return;
    const el = document.querySelector(steps[stepIndex].selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [active, stepIndex, steps]);

  useEffect(() => {
    if (!active) return;
    const step = steps[stepIndex];
    const el = step ? document.querySelector(step.selector) : null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // wait for scroll to settle, then grab fresh rect
      const t = setTimeout(updateRect, 350);
      return () => clearTimeout(t);
    } else {
      setRect(null);
    }
  }, [active, stepIndex, steps, updateRect]);

  useEffect(() => {
    if (!active) return;
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, updateRect]);

  const dismiss = useCallback(() => {
    localStorage.setItem(storageKey, '1');
    setActive(false);
  }, [storageKey]);

  const next = useCallback(() => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      dismiss();
    }
  }, [stepIndex, steps.length, dismiss]);

  const prev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  if (!mounted || !active || !enabled) return null;

  const step = steps[stepIndex];
  if (!step) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const PAD = 10;

  const spot = rect
    ? {
        x: Math.max(0, rect.left - PAD),
        y: Math.max(0, rect.top - PAD),
        w: Math.min(vw, rect.width + PAD * 2),
        h: rect.height + PAD * 2,
        rx: 10,
      }
    : { x: vw / 2 - 100, y: vh / 2 - 40, w: 200, h: 80, rx: 10 };

  const TOOLTIP_W = Math.min(320, vw - 32);
  const pos = step.position ?? 'bottom';

  let tx = spot.x + spot.w / 2 - TOOLTIP_W / 2;
  let ty = spot.y + spot.h + 14;

  if (pos === 'top') {
    ty = spot.y - 190;
  } else if (pos === 'right') {
    tx = spot.x + spot.w + 14;
    ty = spot.y;
  } else if (pos === 'left') {
    tx = spot.x - TOOLTIP_W - 14;
    ty = spot.y;
  } else if (pos === 'center') {
    tx = vw / 2 - TOOLTIP_W / 2;
    ty = vh / 2 - 90;
  }

  // Clamp tooltip within viewport
  tx = Math.max(8, Math.min(tx, vw - TOOLTIP_W - 8));
  const maxTooltipH = Math.min(320, vh - 32);
  if (ty + maxTooltipH > vh - 8) {
    ty = Math.max(8, vh - maxTooltipH - 8);
  }
  ty = Math.max(8, ty);

  const isLast = stepIndex === steps.length - 1;
  const stepProgress = tour.stepProgress
    .replace('{{current}}', String(stepIndex + 1))
    .replace('{{total}}', String(steps.length));

  const overlay = (
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog" aria-label={tour.dialogLabel}>
      {/* SVG overlay with spotlight hole */}
      <svg
        className="pointer-events-none"
        style={{ position: 'fixed', inset: 0, width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <defs>
          <mask id="ms-tour-mask">
            <rect fill="white" x="0" y="0" width="100%" height="100%" />
            <rect
              fill="black"
              x={spot.x}
              y={spot.y}
              width={spot.w}
              height={spot.h}
              rx={spot.rx}
            />
          </mask>
        </defs>
        {/* Darkened background */}
        <rect
          fill="rgba(15,23,42,0.72)"
          x="0"
          y="0"
          width="100%"
          height="100%"
          mask="url(#ms-tour-mask)"
        />
        {/* Spotlight ring */}
        <rect
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          x={spot.x}
          y={spot.y}
          width={spot.w}
          height={spot.h}
          rx={spot.rx}
          opacity="0.9"
        />
      </svg>

      {/* Click backdrop to dismiss */}
      <div
        className="fixed inset-0"
        style={{ zIndex: -1 }}
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Tooltip card */}
      <div
        role="document"
        className="fixed bg-white rounded-2xl shadow-2xl overflow-y-auto"
        style={{
          left: tx,
          top: ty,
          width: TOOLTIP_W,
          maxHeight: Math.min(320, vh - 32),
          zIndex: 1,
        }}
      >
        {/* Blue top bar */}
        <div className="bg-blue-600 rounded-t-2xl px-5 py-3 flex items-center justify-between">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === stepIndex ? 20 : 6,
                  backgroundColor: i <= stepIndex ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
          <button
            onClick={dismiss}
            className="text-blue-100 hover:text-white text-xs font-medium transition-colors"
            aria-label={tour.closeAria}
          >
            {tour.skip}
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            {stepProgress}
          </p>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-2 leading-snug">
            {step.title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between gap-3">
          <button
            onClick={prev}
            disabled={stepIndex === 0}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              stepIndex === 0
                ? 'invisible'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tour.previous}
          </button>

          <button
            onClick={next}
            className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${
              isLast
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLast ? tour.finish : tour.next}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
