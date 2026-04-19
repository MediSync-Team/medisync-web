'use client';

import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface PasswordInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  ariaLabel?: string;
}

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  autoComplete = 'current-password',
  className = 'field-input',
  ariaLabel,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={className}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={0}
      >
        {showPassword ? (
          <EyeOffIcon size={18} />
        ) : (
          <EyeIcon size={18} />
        )}
      </button>
    </div>
  );
}
