'use client';

import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { useLang } from '../lib/i18n/context';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface Props {
  /** Current photo URL. Existing externally-hosted URLs are shown as-is. */
  value: string;
  onChange: (url: string) => void;
  /** Fallback text (e.g. initials) shown when there is no photo. */
  initials?: string;
  disabled?: boolean;
}

/**
 * Profile photo picker: uploads a chosen file to the API and returns its URL via
 * `onChange`. Renders the current `value` as a live preview, so photos that were
 * previously saved as a plain URL keep displaying and are preserved until the
 * user actually uploads a new file.
 */
export default function ImageUpload({ value, onChange, initials, disabled }: Props) {
  const { t } = useLang();
  const iu = t('imageUpload');
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [broken, setBroken] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the user re-pick the same file after an error
    if (!file) return;
    setError('');
    if (!ALLOWED_TYPES.includes(file.type)) { setError(iu.invalidType); return; }
    if (file.size > MAX_BYTES) { setError(iu.tooLarge); return; }

    setUploading(true);
    try {
      const { url } = await api.media.subirImagen(file);
      setBroken(false);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : iu.uploadError);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
        {value && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={iu.alt}
            className="w-full h-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <span className="text-lg font-semibold text-slate-400">{initials || '★'}</span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className="btn btn-secondary btn-sm text-xs"
          >
            {uploading ? iu.uploading : value ? iu.change : iu.choose}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={() => { setError(''); setBroken(false); onChange(''); }}
              disabled={disabled}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              {iu.remove}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400">{iu.hint}</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFile}
          className="hidden"
        />
      </div>
    </div>
  );
}
