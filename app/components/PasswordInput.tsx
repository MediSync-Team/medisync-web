'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLang } from '../lib/i18n/context';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  className,
  ariaLabel,
}: PasswordInputProps) {
  const { t } = useLang();
  const auth = t('auth');
  const [showPassword, setShowPassword] = useState(false);
  const toggleLabel = showPassword ? auth.hidePassword : auth.showPassword;

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn('pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={toggleLabel}
        title={toggleLabel}
        tabIndex={0}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
