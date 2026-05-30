'use client';

import { useLang } from '../lib/i18n/context';

interface StarRatingProps {
  value: number;        // 0-5, supports decimals for display
  onChange?: (v: number) => void; // if provided, interactive
  size?: number;
}

export default function StarRating({ value, onChange, size = 20 }: StarRatingProps) {
  const { t } = useLang();
  const ratingText = t('rating');
  const stars = [1, 2, 3, 4, 5];
  const readOnlyAria = ratingText.readOnlyAria.replace('{{value}}', String(value));

  if (!onChange) {
    // Read-only: support half-stars via clip-path
    return (
      <span className="inline-flex items-center gap-0.5" aria-label={readOnlyAria}>
        {stars.map((s) => {
          const fill = Math.min(1, Math.max(0, value - (s - 1)));
          return (
            <span key={s} className="relative inline-block" style={{ width: size, height: size }}>
              {/* Empty star */}
              <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
              {/* Filled overlay */}
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <svg width={size} height={size} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                </span>
              )}
            </span>
          );
        })}
      </span>
    );
  }

  // Interactive
  return (
    <span className="inline-flex items-center gap-1">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          aria-label={(s === 1 ? ratingText.selectStarAriaSingular : ratingText.selectStarAriaPlural).replace('{{value}}', String(s))}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <svg width={size} height={size} viewBox="0 0 24 24"
            fill={s <= value ? '#F59E0B' : 'none'}
            stroke={s <= value ? '#F59E0B' : '#CBD5E1'}
            strokeWidth="1.5"
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </button>
      ))}
    </span>
  );
}
