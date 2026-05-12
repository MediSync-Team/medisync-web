'use client';

import { useLang } from '../../lib/i18n/context';
import { ShieldIcon } from '../../components/icons';

export default function UpgradePrompt({ feature, onViewPlans }: { feature: string; onViewPlans: () => void }) {
  const { t } = useLang();
  const d = t('dashboard');
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4 inline-flex items-center justify-center"><ShieldIcon size={42} className="text-slate-500" /></div>
      <p className="text-lg font-medium text-slate-900">{d.upgradeFeaturePrefix}{feature}{d.upgradeFeatureSuffix}</p>
      <p className="text-sm text-slate-600 mt-2">{d.upgradeDesc}</p>
      <button onClick={onViewPlans} className="btn btn-primary mt-6">
        {d.viewPlans}
      </button>
    </div>
  );
}
