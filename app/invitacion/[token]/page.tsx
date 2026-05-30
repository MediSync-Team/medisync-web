'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clinicasApi, InvitacionClinica, Clinica } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import { getLocale } from '../../lib/date';
import { ClockIcon, CheckIcon, XIcon, HospitalIcon, MapPinIcon } from '../../components/icons';

type InvitacionConClinica = InvitacionClinica & {
  clinica: Pick<Clinica, 'nombre' | 'descripcion' | 'logoUrl' | 'direccion'>;
};

type PageState = 'loading' | 'ready' | 'expired' | 'notfound' | 'done' | 'rejected';

function template(value: string, params: Record<string, string>) {
  return Object.entries(params).reduce(
    (text, [key, replacement]) => text.replaceAll(`{{${key}}}`, replacement),
    value
  );
}

export default function InvitacionPage() {
  const { token } = useParams() as { token: string };
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t, lang } = useLang();
  const invitation = t('invitation');
  const locale = getLocale(lang);

  const [state, setState]       = useState<PageState>('loading');
  const [inv, setInv]           = useState<InvitacionConClinica | null>(null);
  const [error, setError]       = useState('');
  const [working, setWorking]   = useState(false);

  useEffect(() => {
    clinicasApi.getInvitacion(token)
      .then(data => { setInv(data); setState('ready'); })
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        setState(msg.toLowerCase().includes('expir') ? 'expired' : 'notfound');
      });
  }, [token]);

  const handleAceptar = async () => {
    if (!user) {
      // Redirect to login with return URL
      router.push(`/login?redirect=/invitacion/${token}`);
      return;
    }
    if (user.rol !== 'PROFESIONAL') {
      setError(invitation.professionalAccountRequired);
      return;
    }
    setWorking(true);
    setError('');
    try {
      await clinicasApi.aceptarInvitacion(token);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : invitation.acceptError);
    } finally {
      setWorking(false);
    }
  };

  const handleRechazar = async () => {
    if (!user) { router.push(`/login?redirect=/invitacion/${token}`); return; }
    setWorking(true);
    try {
      await clinicasApi.rechazarInvitacion(token);
      setState('rejected');
    } catch (err) {
      setError(err instanceof Error ? err.message : invitation.rejectError);
    } finally {
      setWorking(false);
    }
  };

  if (authLoading || state === 'loading') {
    return (
      <Shell>
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </Shell>
    );
  }

  if (state === 'notfound') {
    return (
      <Shell>
        <StatusCard
          icon={<XIcon size={24} className="text-red-600" />}
          title={invitation.notFoundTitle}
          desc={invitation.notFoundDesc}
          action={<Link href="/dashboard" className="btn btn-primary btn-sm">{invitation.dashboard}</Link>}
        />
      </Shell>
    );
  }

  if (state === 'expired') {
    return (
      <Shell>
        <StatusCard
          icon={<ClockIcon size={24} className="text-amber-600" />}
          title={invitation.expiredTitle}
          desc={invitation.expiredDesc}
          action={<Link href="/dashboard" className="btn btn-secondary btn-sm">{invitation.dashboard}</Link>}
        />
      </Shell>
    );
  }

  if (state === 'done') {
    return (
      <Shell>
        <StatusCard
          icon={<CheckIcon size={24} className="text-emerald-600" />}
          title={template(invitation.acceptedTitle, { clinic: inv?.clinica.nombre ?? '' })}
          desc={invitation.acceptedDesc}
          action={<Link href="/dashboard" className="btn btn-primary btn-sm">{invitation.dashboard}</Link>}
        />
      </Shell>
    );
  }

  if (state === 'rejected') {
    return (
      <Shell>
        <StatusCard
          icon={<XIcon size={24} className="text-red-600" />}
          title={invitation.rejectedTitle}
          desc={invitation.rejectedDesc}
          action={<Link href="/dashboard" className="btn btn-secondary btn-sm">{invitation.dashboard}</Link>}
        />
      </Shell>
    );
  }

  // -- READY --
  const clinicaData = inv!.clinica;
  const expiresAt = new Date(inv!.expiresAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Shell>
      <div className="space-y-5">
        {/* Clinic card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
            {clinicaData.logoUrl
              ? <img src={clinicaData.logoUrl} alt="" className="w-full h-full object-cover" />
              : <HospitalIcon size={24} className="text-blue-700" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-200">{clinicaData.nombre}</p>
            {clinicaData.descripcion && (
              <p className="text-sm text-slate-500 mt-0.5">{clinicaData.descripcion}</p>
            )}
            {clinicaData.direccion && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <MapPinIcon size={11} className="text-slate-400" />
                {clinicaData.direccion}
              </p>
            )}
          </div>
        </div>

        {/* Invitation details */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-amber-800 mb-1">{invitation.readyTitle}</p>
          <p className="text-sm text-amber-700">
            {template(invitation.sentToExpires, { email: inv!.email, expiresAt })}
          </p>
        </div>

        {/* Auth notice if not logged in */}
        {!user && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">{invitation.loginRequiredTitle}</p>
            <p>{template(invitation.loginRequiredDesc, { email: inv!.email })}</p>
          </div>
        )}

        {/* Email mismatch warning */}
        {user && user.email !== inv!.email && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">{invitation.emailMismatchTitle}</p>
            <p>{template(invitation.emailMismatchDesc, { currentEmail: user.email, inviteEmail: inv!.email })}</p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRechazar}
            disabled={working || (!!user && user.email !== inv!.email)}
            className="btn btn-secondary flex-1"
          >
            {invitation.reject}
          </button>
          <button
            onClick={handleAceptar}
            disabled={working || (!!user && user.email !== inv!.email)}
            className="btn btn-primary flex-1"
          >
            {working ? invitation.processing : user ? invitation.accept : invitation.loginToAccept}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Powered by{' '}
          <a href="https://medisync-web.medisync.workers.dev" className="text-blue-600 hover:underline">MediSync</a>
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const invitation = t('invitation');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3 shadow-lg">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">{invitation.title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusCard({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
      <div className="text-4xl">{icon}</div>
      <p className="font-bold text-slate-800 dark:text-slate-200">{title}</p>
      <p className="text-sm text-slate-500">{desc}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
