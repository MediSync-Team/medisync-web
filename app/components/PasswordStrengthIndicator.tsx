'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function getRequirements(password: string): StrengthRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
}

function getStrength(password: string): { level: 'weak' | 'fair' | 'good' | 'strong'; score: number } {
  if (password.length === 0) {
    return { level: 'weak', score: 0 };
  }

  const reqs = getRequirements(password);
  const metRequirements = Object.values(reqs).filter(Boolean).length;

  if (metRequirements <= 1) return { level: 'weak', score: 1 };
  if (metRequirements === 2) return { level: 'fair', score: 2 };
  if (metRequirements === 3) return { level: 'good', score: 3 };
  return { level: 'strong', score: 4 };
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements = getRequirements(password);
  const { level, score } = getStrength(password);

  const requirements_list = [
    { label: 'Mínimo 8 caracteres', met: requirements.minLength },
    { label: 'Al menos una mayúscula', met: requirements.hasUppercase },
    { label: 'Al menos una minúscula', met: requirements.hasLowercase },
    { label: 'Al menos un número', met: requirements.hasNumber },
    { label: 'Al menos un carácter especial (!@#$%...)', met: requirements.hasSpecial },
  ];

  const colors = {
    weak: 'bg-red-500',
    fair: 'bg-amber-500',
    good: 'bg-blue-500',
    strong: 'bg-emerald-500',
  };

  const labels = {
    weak: 'Muy débil',
    fair: 'Aceptable',
    good: 'Buena',
    strong: 'Fuerte',
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Fortaleza de contraseña
          </label>
          {password && (
            <span className={`text-xs font-semibold ${
              level === 'weak' ? 'text-red-600' :
              level === 'fair' ? 'text-amber-600' :
              level === 'good' ? 'text-blue-600' :
              'text-emerald-600'
            }`}>
              {labels[level]}
            </span>
          )}
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${colors[level]}`}
            style={{ width: `${(score / 4) * 100}%` }}
            role="progressbar"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label={`Fortaleza de contraseña: ${labels[level]}`}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      {password && (
        <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Requisitos:
          </p>
          <ul className="space-y-1">
            {requirements_list.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-xs">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className={req.met ? 'text-emerald-600' : 'text-slate-300 dark:text-slate-600'}
                >
                  {req.met ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <>
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </>
                  )}
                </svg>
                <span className={req.met ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                  {req.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export { getRequirements, getStrength };
