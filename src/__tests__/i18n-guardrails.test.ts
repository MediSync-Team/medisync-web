import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type Match = {
  file: string;
  line: number;
  text: string;
};

type AllowlistEntry = {
  file: string;
  pattern: RegExp;
  reason: string;
};

const appRoot = path.join(process.cwd(), 'app');
const sourceExtensions = new Set(['.ts', '.tsx']);

const scannedUiRoots = [
  'components',
  'dashboard',
  'pago-exitoso',
  'pago-pendiente',
  'pago-fallido',
  'widget',
  'profesional',
  'invitacion',
];

const ignoredFiles = new Set([
  'app/lib/i18n/translations.ts',
]);

const inlineLiteralTernaryPattern =
  /(?:lang\s*={2,3}\s*['"]es['"]|isEs)\s*\?\s*(['"`])(?:(?!\1).)+\1\s*:\s*(['"`])(?:(?!\2).)+\2/;

const spanishPhrasePattern =
  /[¿¡ÁÉÍÓÚÑáéíóúñ]|\b(Guardar|Cancelar|Siguiente|Anterior|Cargando|Eliminar|Editar|Buscar|Seleccioná|Selecciona|Contraseña|contraseña|Notificación|notificación|Turno cancelado|Error al|Aceptar invitación|Iniciar sesión)\b/;

const stringLiteralPattern =
  /(?:'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;

const ternaryAllowlist: AllowlistEntry[] = [
  {
    file: 'app/lib/date.ts',
    pattern: /lang\s*={2,3}\s*['"]es['"]\s*\?\s*['"]es-AR['"]\s*:\s*['"]en-US['"]/,
    reason: 'Locale mapping behavior, not user-facing copy.',
  },
  {
    file: 'app/components/ThemeLangToggle.tsx',
    pattern: /lang\s*={2,3}\s*['"]es['"]\s*\?\s*['"]en['"]\s*:\s*['"]es['"]/,
    reason: 'Language switch behavior, not translated UI copy.',
  },
  {
    file: 'app/components/ThemeLangToggle.tsx',
    pattern: /lang\s*={2,3}\s*['"]es['"]\s*\?\s*['"]EN['"]\s*:\s*['"]ES['"]/,
    reason: 'Compact target-language indicator for the language switcher.',
  },
];

const spanishPhraseAllowlist: AllowlistEntry[] = [
  {
    file: 'app/dashboard/components/DisponibilidadView.tsx',
    pattern: /Capacitación/,
    reason: 'Persisted backend-facing blocking reason value; displayed label is translated.',
  },
  {
    file: 'app/dashboard/components/PlanView.tsx',
    pattern: /(Turnos ilimitados \+ estadísticas avanzadas|Hasta 20 turnos\/mes)/,
    reason: 'Known remaining subscription plan subtitle fallback copy.',
  },
  {
    file: 'app/dashboard/paciente/components/TurnoCard.tsx',
    pattern: /Requiere \$\{horasMinCancelacion\}h de anticipación/,
    reason: 'Known remaining patient appointment cancellation tooltip copy.',
  },
  {
    file: 'app/dashboard/paciente/page.tsx',
    pattern: /(Tus próximos turnos|Aquí vas a ver|Si el profesional que querés|Buscá más profesionales|Desde acá podés|Actualizá tus datos|Turno cancelado correctamente\.|Error al cancelar turno|¡Gracias por tu calificación!)/,
    reason: 'Known remaining patient dashboard/tour/rating copy pending broader patient page i18n pass.',
  },
  {
    file: 'app/profesional/[id]/page.tsx',
    pattern: /(Ubicación|García)/,
    reason: 'Known remaining professional profile copy/test-like sample pending profile page i18n pass.',
  },
  {
    file: 'app/invitacion/[token]/page.tsx',
    pattern: /(Necesitás tener una cuenta|No se pudo aceptar la invitación|Error al rechazar|Invitación no encontrada|El link no es válido|Invitación expirada|Este link ya no es válido|Ya sos parte de la clínica|Invitación rechazada|Rechazaste la invitación|Aceptar invitación|Iniciar sesión para aceptar)/,
    reason: 'Invitation acceptance page has not been migrated to i18n yet.',
  },
];

function walkSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return walkSourceFiles(fullPath);
    if (!sourceExtensions.has(path.extname(fullPath))) return [];
    return [fullPath];
  });
}

function toRepoPath(fullPath: string): string {
  return path.relative(process.cwd(), fullPath).split(path.sep).join('/');
}

function isAllowed(match: Match, allowlist: AllowlistEntry[]): boolean {
  return allowlist.some((entry) => (
    entry.file === match.file && entry.pattern.test(match.text)
  ));
}

function formatMatches(matches: Match[]): string[] {
  return matches.map((match) => `${match.file}:${match.line}: ${match.text}`);
}

function findInlineLiteralTernaries(files: string[]): Match[] {
  return files.flatMap((file) => {
    const repoPath = toRepoPath(file);
    if (ignoredFiles.has(repoPath)) return [];

    return fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, index) => (
        inlineLiteralTernaryPattern.test(line)
          ? [{ file: repoPath, line: index + 1, text: line.trim() }]
          : []
      ));
  });
}

function findSpanishStringLiterals(files: string[]): Match[] {
  return files.flatMap((file) => {
    const repoPath = toRepoPath(file);
    if (ignoredFiles.has(repoPath)) return [];

    return fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, index) => {
        const matches: Match[] = [];
        stringLiteralPattern.lastIndex = 0;
        let literalMatch: RegExpExecArray | null;

        while ((literalMatch = stringLiteralPattern.exec(line))) {
          const literal = literalMatch[1] ?? literalMatch[2] ?? literalMatch[3] ?? '';
          if (spanishPhrasePattern.test(literal)) {
            matches.push({ file: repoPath, line: index + 1, text: literal });
          }
        }

        return matches;
      });
  });
}

describe('i18n guardrails', () => {
  it('detects inline ES/EN literal ternaries but ignores behavior-only toggles', () => {
    expect(inlineLiteralTernaryPattern.test("lang === 'es' ? 'Guardar' : 'Save'")).toBe(true);
    expect(inlineLiteralTernaryPattern.test("lang === 'es' ? 'en' : 'es'")).toBe(true);

    const allAppFiles = walkSourceFiles(appRoot);
    const violations = findInlineLiteralTernaries(allAppFiles)
      .filter((match) => !isAllowed(match, ternaryAllowlist));

    expect(formatMatches(violations)).toEqual([]);
  });

  it('flags hardcoded Spanish UI phrases in selected app surfaces unless explicitly allowlisted', () => {
    expect(spanishPhrasePattern.test('Guardar cambios')).toBe(true);
    expect(spanishPhrasePattern.test('Plain English copy')).toBe(false);

    const selectedFiles = scannedUiRoots.flatMap((dir) => walkSourceFiles(path.join(appRoot, dir)));
    const violations = findSpanishStringLiterals(selectedFiles)
      .filter((match) => !isAllowed(match, spanishPhraseAllowlist));

    expect(formatMatches(violations)).toEqual([]);
  });
});
