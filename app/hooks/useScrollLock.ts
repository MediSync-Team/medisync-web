'use client';

import { useLayoutEffect } from 'react';

// Module-level so stacked modals don't unlock early or restore the wrong values.
let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';

/** Locks body scroll while mounted (custom modals render conditionally, so mounting = open). */
export function useScrollLock(active = true) {
  useLayoutEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [active]);
}
