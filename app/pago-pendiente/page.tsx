'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { useLang } from '../lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function PagoPendienteContent() {
  const router = useRouter();
  const { t } = useLang();
  const labels = t('auth').paymentResult.pending;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard/paciente');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-warning/10 text-warning">
              <Clock className="size-8" />
            </div>
          </div>
          <h1 className="mb-3 font-heading text-2xl font-bold text-warning">{labels.title}</h1>
          <p className="mb-6 text-muted-foreground">{labels.description}</p>
          <div className="flex flex-col gap-3">
            <Button className="w-full" render={<Link href="/dashboard/paciente" />}>
              {labels.viewAppointments}
            </Button>
            <Button variant="outline" className="w-full" render={<Link href="/" />}>
              {labels.home}
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{labels.redirecting}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PagoPendientePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30" />}>
      <PagoPendienteContent />
    </Suspense>
  );
}
