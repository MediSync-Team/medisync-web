import { useLang } from './context';
import { translateSpecialtyName } from './translations';

export function useTranslateSpecialty() {
  const { lang } = useLang();
  return (name?: string | null) => translateSpecialtyName(name ?? '', lang);
}
