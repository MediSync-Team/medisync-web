'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, Check, X, Building2, MapPin } from 'lucide-react';
import { clinicasApi, InvitacionClinica, Clinica } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import { useLang } from '../../lib/i18n/context';
import { getLocale } from '../../lib/date';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Shell>
    );
  }

  if (state === 'notfound') {
    return (
      <Shell>
        <StatusCard
          icon={<X className="size-6 text-destructive" />}
          title={invitation.notFoundTitle}
          desc={invitation.notFoundDesc}
          action={<Button size="sm" render={<Link href="/dashboard" />}>{invitation.dashboard}</Button>}
        />
      </Shell>
    );
  }

  if (state === 'expired') {
    return (
      <Shell>
        <StatusCard
          icon={<Clock className="size-6 text-warning" />}
          title={invitation.expiredTitle}
          desc={invitation.expiredDesc}
          action={<Button size="sm" variant="outline" render={<Link href="/dashboard" />}>{invitation.dashboard}</Button>}
        />
      </Shell>
    );
  }

  if (state === 'done') {
    return (
      <Shell>
        <StatusCard
          icon={<Check className="size-6 text-success" />}
          title={template(invitation.acceptedTitle, { clinic: inv?.clinica.nombre ?? '' })}
          desc={invitation.acceptedDesc}
          action={<Button size="sm" render={<Link href="/dashboard" />}>{invitation.dashboard}</Button>}
        />
      </Shell>
    );
  }

  if (state === 'rejected') {
    return (
      <Shell>
        <StatusCard
          icon={<X className="size-6 text-destructive" />}
          title={invitation.rejectedTitle}
          desc={invitation.rejectedDesc}
          action={<Button size="sm" variant="outline" render={<Link href="/dashboard" />}>{invitation.dashboard}</Button>}
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
        <Card className="rounded-2xl">
          <CardContent className="flex items-start gap-4 p-6">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
              {clinicaData.logoUrl
                ? <img src={clinicaData.logoUrl} alt="" className="size-full object-cover" />
                : <Building2 className="size-6 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{clinicaData.nombre}</p>
              {clinicaData.descripcion && (
                <p className="mt-0.5 text-sm text-muted-foreground">{clinicaData.descripcion}</p>
              )}
              {clinicaData.direccion && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" />
                  {clinicaData.direccion}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invitation details */}
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
          <p className="mb-1 text-sm font-semibold text-warning">{invitation.readyTitle}</p>
          <p className="text-sm text-warning/90">
            {template(invitation.sentToExpires, { email: inv!.email, expiresAt })}
          </p>
        </div>

        {/* Auth notice if not logged in */}
        {!user && (
          <div className="rounded-2xl border border-info/30 bg-info/5 p-4 text-sm text-info">
            <p className="mb-1 font-semibold">{invitation.loginRequiredTitle}</p>
            <p>{template(invitation.loginRequiredDesc, { email: inv!.email })}</p>
          </div>
        )}

        {/* Email mismatch warning */}
        {user && user.email !== inv!.email && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <p className="mb-1 font-semibold">{invitation.emailMismatchTitle}</p>
            <p>{template(invitation.emailMismatchDesc, { currentEmail: user.email, inviteEmail: inv!.email })}</p>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleRechazar}
            disabled={working || (!!user && user.email !== inv!.email)}
          >
            {invitation.reject}
          </Button>
          <Button
            className="flex-1"
            onClick={handleAceptar}
            disabled={working || (!!user && user.email !== inv!.email)}
          >
            {working ? invitation.processing : user ? invitation.accept : invitation.loginToAccept}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Powered by{' '}
          <a href="https://medisync-web.medisync.workers.dev" className="text-primary hover:underline">MediSync</a>
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const invitation = t('invitation');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <h1 className="font-heading text-xl font-bold">{invitation.title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusCard({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-8 text-center">
        <div className="flex justify-center">{icon}</div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
        {action && <div className="pt-1">{action}</div>}
      </CardContent>
    </Card>
  );
}
