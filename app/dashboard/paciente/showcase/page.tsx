'use client';

/**
 * MediSync — Patient dashboard, "Warm Clinical Editorial" design study.
 *
 * Self-contained showcase: no API, no auth, no shared design tokens. Mock
 * Spanish data so it renders standalone even when the backend is down.
 * View at /dashboard/paciente/showcase. Leaves the production paciente
 * dashboard untouched.
 *
 * Aesthetic: warm bone paper · deep pine healing accent · terracotta urgency.
 * Display serif (Fraunces) + grotesque body (Hanken Grotesk). The signature
 * piece is the "próximo turno" boarding-pass ticket with a live countdown.
 */

import { useEffect, useMemo, useState } from 'react';

/* ----------------------------------------------------------------------- */
/* Mock data (Spanish domain language — matches the real app)              */
/* ----------------------------------------------------------------------- */

const PACIENTE = { nombre: 'Sofía', apellido: 'Mendoza', inicial: 'SM' };

// Next appointment lives a couple days out so the countdown is always alive.
function proximoTurnoDate() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(14, 30, 0, 0);
  return d;
}

const PROXIMO = {
  profesional: 'Dra. Valentina Ríos',
  especialidad: 'Cardiología',
  modalidad: 'Presencial' as 'Presencial' | 'Virtual',
  lugar: 'Consultorio 4B · Clínica del Parque',
  duracion: 30,
  codigo: 'MS-7F4Q',
};

const AGENDA = [
  { id: 1, hora: '09:00', dia: 'Mié 25', prof: 'Lic. Tomás Aguirre', esp: 'Nutrición', modalidad: 'Virtual', estado: 'Confirmado' },
  { id: 2, hora: '11:30', dia: 'Vie 27', prof: 'Dr. Iván Solé', esp: 'Clínica Médica', modalidad: 'Presencial', estado: 'Reservado' },
  { id: 3, hora: '16:00', dia: 'Lun 30', prof: 'Dra. Paula Esquivel', esp: 'Dermatología', modalidad: 'Presencial', estado: 'Reservado' },
];

const RECETAS = [
  { id: 1, droga: 'Enalapril 10mg', pauta: '1 comp · cada 24h', restante: 12, total: 30 },
  { id: 2, droga: 'Rosuvastatina 20mg', pauta: '1 comp · noche', restante: 21, total: 30 },
];

const DATOS = {
  alergias: ['Penicilina', 'AINEs'],
  grupo: '0+',
  cobertura: 'OSDE 310',
};

const ESPERA = [
  { id: 1, esp: 'Dermatología', prof: 'Dra. Paula Esquivel', desde: 'hace 3 días', pos: 2 },
  { id: 2, esp: 'Oftalmología', prof: 'Dr. Marcos Lema', desde: 'hace 1 día', pos: 5 },
];

// Adherence over the last 8 weeks (0–100), drives the hand-drawn sparkline.
const ADHERENCIA = [74, 80, 78, 88, 84, 90, 87, 94];

const INDICE_SALUD = 86;

/* ----------------------------------------------------------------------- */
/* Tiny inline icons — keeps the artifact dependency-free                  */
/* ----------------------------------------------------------------------- */

type IconProps = { size?: number; className?: string };
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const I = {
  Pulse: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M3 12h3.5L9 5l4 14 2.5-7H21" />
    </svg>
  ),
  Calendar: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" /><path d="M3 9h18M8 2.5v4M16 2.5v4" />
    </svg>
  ),
  Clock: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7.5V12l3 2" />
    </svg>
  ),
  Video: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" /><path d="M15.5 10l6-3.5v11l-6-3.5z" />
    </svg>
  ),
  Pin: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  Pill: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" /><path d="M8.5 8.5l7 7" />
    </svg>
  ),
  Shield: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4.5" />
    </svg>
  ),
  Bell: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  Arrow: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Plus: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Stetho: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M5 3v6a4 4 0 0 0 8 0V3" /><path d="M9 13v2a5 5 0 0 0 10 0v-2" /><circle cx="19" cy="9" r="2" />
    </svg>
  ),
  Spark: ({ size = 18, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} className={className}>
      <path d="M12 3l1.8 5L19 9.8 14 12l-2 5-2-5L5 9.8 10 8z" />
    </svg>
  ),
};

/* ----------------------------------------------------------------------- */
/* Hand-drawn adherence sparkline (smooth Catmull-Rom → bezier)            */
/* ----------------------------------------------------------------------- */

function Sparkline({ data, w = 320, h = 96 }: { data: number[]; w?: number; h?: number }) {
  const pad = 6;
  const min = Math.min(...data) - 4;
  const max = Math.max(...data) + 4;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (w - pad * 2),
    h - pad - ((v - min) / (max - min)) * (h - pad * 2),
  ]);

  const line = pts.reduce((acc, [x, y], i, a) => {
    if (i === 0) return `M ${x} ${y}`;
    const [px, py] = a[i - 1];
    const cx = (px + x) / 2;
    return `${acc} C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }, '');
  const area = `${line} L ${pts[pts.length - 1][0]} ${h} L ${pts[0][0]} ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--pine)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--pine)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path d={line} fill="none" stroke="var(--pine)" strokeWidth="2.25" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="4.5" fill="var(--paper)" stroke="var(--pine)" strokeWidth="2.25" />
    </svg>
  );
}

/* ----------------------------------------------------------------------- */
/* Health-index conic ring                                                 */
/* ----------------------------------------------------------------------- */

function HealthRing({ value }: { value: number }) {
  return (
    <div
      className="ms-ring"
      style={{
        background: `conic-gradient(var(--pine) ${value * 3.6}deg, var(--ring-track) 0deg)`,
      }}
    >
      <div className="ms-ring-hole">
        <span className="ms-ring-num">{value}</span>
        <span className="ms-ring-lbl">índice</span>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Page                                                                    */
/* ----------------------------------------------------------------------- */

export default function ShowcaseDashboard() {
  const [mounted, setMounted] = useState(false);
  const target = useMemo(() => proximoTurnoDate(), []);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const saludo = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }, []);

  const countdown = useMemo(() => {
    const ms = Math.max(0, target.getTime() - now.getTime());
    const d = Math.floor(ms / 86_400_000);
    const hh = Math.floor((ms % 86_400_000) / 3_600_000);
    const mm = Math.floor((ms % 3_600_000) / 60_000);
    const ss = Math.floor((ms % 60_000) / 1000);
    return { d, hh, mm, ss };
  }, [target, now]);

  const fechaLarga = useMemo(
    () =>
      new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(target),
    [target],
  );
  const hora = useMemo(
    () => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(target),
    [target],
  );

  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="ms-root">
      {/* Webfonts — hoisted to <head> by React */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,9.0&family=Hanken+Grotesk:wght@400;500;600;700&display=swap"
      />

      <style>{css}</style>

      <div className="ms-grain" aria-hidden />

      {/* -- Top bar -------------------------------------------------- */}
      <header className="ms-bar">
        <div className="ms-bar-in">
          <div className="ms-brand">
            <span className="ms-brand-mark"><I.Pulse size={17} /></span>
            <span className="ms-brand-word">MediSync</span>
          </div>
          <nav className="ms-bar-actions">
            <button className="ms-icon-btn" aria-label="Notificaciones">
              <I.Bell size={17} />
              <span className="ms-dot" />
            </button>
            <button className="ms-chip-btn">
              <I.Plus size={15} /> Reservar turno
            </button>
            <div className="ms-avatar" title={`${PACIENTE.nombre} ${PACIENTE.apellido}`}>
              {PACIENTE.inicial}
            </div>
          </nav>
        </div>
      </header>

      <main className="ms-wrap">
        {/* -- Greeting ------------------------------------------------ */}
        <section className="ms-hello reveal" style={{ '--d': '40ms' } as React.CSSProperties}>
          <div>
            <p className="ms-eyebrow">{saludo}</p>
            <h1 className="ms-h1">
              {PACIENTE.nombre}<span className="ms-h1-dot">.</span>
            </h1>
            <p className="ms-sub">
              Tu próximo control es en <strong>{mounted ? countdown.d : '—'} días</strong>. La adherencia
              al tratamiento subió a <strong>94%</strong> esta semana — seguí así.
            </p>
          </div>
          <HealthRing value={INDICE_SALUD} />
        </section>

        {/* -- Bento grid --------------------------------------------- */}
        <div className="ms-grid">
          {/* Signature: boarding-pass appointment ticket */}
          <section className="ms-ticket reveal" style={{ '--d': '120ms' } as React.CSSProperties}>
            <div className="ms-ticket-body">
              <div className="ms-ticket-head">
                <span className="ms-tag">
                  {PROXIMO.modalidad === 'Virtual' ? <I.Video size={13} /> : <I.Pin size={13} />}
                  {PROXIMO.modalidad}
                </span>
                <span className="ms-ticket-code">{PROXIMO.codigo}</span>
              </div>

              <p className="ms-ticket-kicker">Próximo turno</p>
              <h2 className="ms-ticket-prof">{PROXIMO.profesional}</h2>
              <p className="ms-ticket-esp">
                <I.Stetho size={14} /> {PROXIMO.especialidad}
              </p>

              <div className="ms-ticket-when">
                <div>
                  <span className="ms-ticket-lbl">Fecha</span>
                  <span className="ms-ticket-val ms-cap">{fechaLarga}</span>
                </div>
                <div>
                  <span className="ms-ticket-lbl">Hora</span>
                  <span className="ms-ticket-val">{hora} hs</span>
                </div>
                <div>
                  <span className="ms-ticket-lbl">Duración</span>
                  <span className="ms-ticket-val">{PROXIMO.duracion} min</span>
                </div>
              </div>

              <p className="ms-ticket-place"><I.Pin size={13} /> {PROXIMO.lugar}</p>
            </div>

            {/* perforated stub */}
            <div className="ms-stub">
              <span className="ms-stub-lbl">Comienza en</span>
              <div className="ms-count" suppressHydrationWarning>
                {mounted ? (
                  <>
                    <Unit n={countdown.d} l="d" />
                    <Sep />
                    <Unit n={pad2(countdown.hh)} l="h" />
                    <Sep />
                    <Unit n={pad2(countdown.mm)} l="m" />
                    <Sep />
                    <Unit n={pad2(countdown.ss)} l="s" />
                  </>
                ) : (
                  <span className="ms-count-skel">··:··:··</span>
                )}
              </div>
              <button className="ms-cta">
                Ver detalles <I.Arrow size={16} />
              </button>
              <button className="ms-cta-ghost">Reprogramar</button>
            </div>
          </section>

          {/* Adherence */}
          <section className="ms-card ms-adher reveal" style={{ '--d': '200ms' } as React.CSSProperties}>
            <div className="ms-card-head">
              <h3 className="ms-card-title"><I.Pulse size={16} /> Adherencia</h3>
              <span className="ms-trend">↑ 8 sem</span>
            </div>
            <div className="ms-adher-num">
              94<span>%</span>
            </div>
            <p className="ms-card-note">Tomas registradas vs. indicadas</p>
            <div className="ms-spark"><Sparkline data={ADHERENCIA} /></div>
          </section>

          {/* Vertical agenda timeline */}
          <section className="ms-card ms-agenda reveal" style={{ '--d': '280ms' } as React.CSSProperties}>
            <div className="ms-card-head">
              <h3 className="ms-card-title"><I.Calendar size={16} /> Agenda</h3>
              <button className="ms-link">Ver todo <I.Arrow size={13} /></button>
            </div>
            <ol className="ms-timeline">
              {AGENDA.map((t) => (
                <li key={t.id} className="ms-tl-item">
                  <span className="ms-tl-node" />
                  <div className="ms-tl-when">
                    <span className="ms-tl-hora">{t.hora}</span>
                    <span className="ms-tl-dia">{t.dia}</span>
                  </div>
                  <div className="ms-tl-body">
                    <p className="ms-tl-prof">{t.prof}</p>
                    <p className="ms-tl-esp">
                      {t.esp} · <span className={t.modalidad === 'Virtual' ? 'ms-mod-virt' : 'ms-mod-pres'}>{t.modalidad}</span>
                    </p>
                  </div>
                  <span className={`ms-estado ${t.estado === 'Confirmado' ? 'is-conf' : ''}`}>{t.estado}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Active prescriptions */}
          <section className="ms-card ms-recetas reveal" style={{ '--d': '360ms' } as React.CSSProperties}>
            <div className="ms-card-head">
              <h3 className="ms-card-title"><I.Pill size={16} /> Recetas activas</h3>
              <span className="ms-count-pill">{RECETAS.length}</span>
            </div>
            <div className="ms-receta-list">
              {RECETAS.map((r) => {
                const pct = Math.round((r.restante / r.total) * 100);
                const low = pct <= 40;
                return (
                  <div key={r.id} className="ms-receta">
                    <div className="ms-receta-top">
                      <span className="ms-receta-droga">{r.droga}</span>
                      <span className={`ms-receta-qty ${low ? 'is-low' : ''}`}>{r.restante}/{r.total}</span>
                    </div>
                    <p className="ms-receta-pauta">{r.pauta}</p>
                    <div className="ms-bar"><span style={{ width: `${pct}%` }} className={low ? 'is-low' : ''} /></div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Waitlist */}
          <section className="ms-card ms-espera reveal" style={{ '--d': '440ms' } as React.CSSProperties}>
            <div className="ms-card-head">
              <h3 className="ms-card-title"><I.Clock size={16} /> Lista de espera</h3>
              <span className="ms-count-pill ms-pine-pill">{ESPERA.length}</span>
            </div>
            <p className="ms-card-note" style={{ marginBottom: 14 }}>
              Te avisamos apenas se libere un turno antes.
            </p>
            <div className="ms-espera-list">
              {ESPERA.map((e) => (
                <div key={e.id} className="ms-espera-item">
                  <span className="ms-pulse" aria-hidden />
                  <div className="ms-espera-body">
                    <p className="ms-espera-esp">{e.esp}</p>
                    <p className="ms-espera-prof">{e.prof} · en espera {e.desde}</p>
                  </div>
                  <span className="ms-espera-pos">
                    <span className="ms-espera-pos-n">{e.pos}º</span>
                    <span className="ms-espera-pos-l">en fila</span>
                  </span>
                  <button className="ms-espera-x" aria-label="Salir de la lista">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* Medical snapshot */}
          <section className="ms-card ms-datos reveal" style={{ '--d': '520ms' } as React.CSSProperties}>
            <div className="ms-card-head">
              <h3 className="ms-card-title"><I.Shield size={16} /> Ficha médica</h3>
            </div>
            <div className="ms-datos-row">
              <span className="ms-datos-k">Grupo</span>
              <span className="ms-datos-v">{DATOS.grupo}</span>
            </div>
            <div className="ms-datos-row">
              <span className="ms-datos-k">Cobertura</span>
              <span className="ms-datos-v">{DATOS.cobertura}</span>
            </div>
            <div className="ms-datos-aler">
              <span className="ms-datos-k">Alergias</span>
              <div className="ms-aler-tags">
                {DATOS.alergias.map((a) => (
                  <span key={a} className="ms-aler-tag">{a}</span>
                ))}
              </div>
            </div>
            <button className="ms-cta-ghost ms-full">Actualizar datos médicos</button>
          </section>
        </div>

        <footer className="ms-foot">
          <span><I.Spark size={13} /> MediSync · estudio de diseño</span>
          <span>Datos de demostración</span>
        </footer>
      </main>
    </div>
  );
}

function Unit({ n, l }: { n: number | string; l: string }) {
  return (
    <span className="ms-unit">
      <span className="ms-unit-n" suppressHydrationWarning>{n}</span>
      <span className="ms-unit-l">{l}</span>
    </span>
  );
}
function Sep() {
  return <span className="ms-unit-sep">:</span>;
}

/* ----------------------------------------------------------------------- */
/* Styles                                                                  */
/* ----------------------------------------------------------------------- */

const css = `
.ms-root{
  --paper:#F1ECE0; --paper-2:#E8E1D1; --card:#FBF8F1; --card-2:#F6F1E6;
  --ink:#1A2520; --ink-2:#414B45; --muted:#76817A; --line:#E0D8C6;
  --pine:#10604C; --pine-2:#0B493A; --pine-soft:#D9E6DE;
  --coral:#D9583A; --coral-soft:#F4E0D7; --gold:#B6862D;
  --ring-track:#E2DBCC;
  position:relative; min-height:100vh; width:100%;
  background:
    radial-gradient(120% 80% at 100% 0%, #EAE3D4 0%, transparent 55%),
    radial-gradient(90% 70% at 0% 100%, #ECE6D8 0%, transparent 50%),
    var(--paper);
  color:var(--ink);
  font-family:'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif;
  font-feature-settings:'ss01' 1,'cv01' 1;
  -webkit-font-smoothing:antialiased;
  overflow-x:hidden;
}
.ms-root *{box-sizing:border-box;}

/* film grain */
.ms-grain{
  position:fixed; inset:0; pointer-events:none; z-index:0; opacity:.05; mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* top bar */
.ms-bar{position:sticky; top:0; z-index:20; backdrop-filter:blur(10px);
  background:color-mix(in srgb, var(--paper) 78%, transparent);
  border-bottom:1px solid var(--line);}
.ms-bar-in{max-width:1120px; margin:0 auto; padding:14px 24px; display:flex; align-items:center; justify-content:space-between;}
.ms-brand{display:flex; align-items:center; gap:10px;}
.ms-brand-mark{display:grid; place-items:center; width:30px; height:30px; border-radius:9px;
  background:var(--pine); color:#F1ECE0; box-shadow:0 2px 0 var(--pine-2);}
.ms-brand-word{font-family:'Fraunces',serif; font-weight:600; font-size:20px; letter-spacing:-.02em;}
.ms-bar-actions{display:flex; align-items:center; gap:10px;}
.ms-icon-btn{position:relative; display:grid; place-items:center; width:38px; height:38px; border-radius:11px;
  border:1px solid var(--line); background:var(--card); color:var(--ink-2); cursor:pointer; transition:.18s;}
.ms-icon-btn:hover{transform:translateY(-1px); border-color:var(--pine); color:var(--pine);}
.ms-dot{position:absolute; top:9px; right:10px; width:7px; height:7px; border-radius:50%; background:var(--coral); box-shadow:0 0 0 2px var(--card);}
.ms-chip-btn{display:inline-flex; align-items:center; gap:7px; height:38px; padding:0 16px; border-radius:11px;
  border:1px solid var(--pine); background:var(--pine); color:#F4EFE3; font-weight:600; font-size:14px; cursor:pointer;
  box-shadow:0 2px 0 var(--pine-2); transition:.18s;}
.ms-chip-btn:hover{transform:translateY(-1px); box-shadow:0 4px 0 var(--pine-2);}
.ms-avatar{display:grid; place-items:center; width:38px; height:38px; border-radius:50%;
  background:var(--coral-soft); color:var(--coral); font-weight:700; font-size:13px; border:1px solid color-mix(in srgb,var(--coral) 25%, transparent);}

/* layout */
.ms-wrap{position:relative; z-index:1; max-width:1120px; margin:0 auto; padding:42px 24px 64px;}

/* greeting */
.ms-hello{display:flex; align-items:center; justify-content:space-between; gap:32px; margin-bottom:38px; flex-wrap:wrap;}
.ms-eyebrow{font-size:13px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--pine); margin:0 0 6px;}
.ms-h1{font-family:'Fraunces',serif; font-weight:500; font-size:clamp(42px,7vw,76px); line-height:.95;
  letter-spacing:-.03em; margin:0; color:var(--ink);}
.ms-h1-dot{color:var(--coral);}
.ms-sub{max-width:46ch; margin:14px 0 0; font-size:15.5px; line-height:1.55; color:var(--ink-2);}
.ms-sub strong{color:var(--pine); font-weight:600;}

/* health ring */
.ms-ring{flex-shrink:0; width:128px; height:128px; border-radius:50%; display:grid; place-items:center;
  box-shadow:inset 0 0 0 1px var(--line);}
.ms-ring-hole{width:100px; height:100px; border-radius:50%; background:var(--paper); display:grid; place-items:center; gap:0;
  box-shadow:0 1px 2px rgba(0,0,0,.04);}
.ms-ring-num{font-family:'Fraunces',serif; font-weight:600; font-size:34px; line-height:1; color:var(--pine);}
.ms-ring-lbl{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted);}

/* bento grid */
.ms-grid{display:grid; grid-template-columns:repeat(12,1fr); gap:18px;}
.ms-card{background:var(--card); border:1px solid var(--line); border-radius:20px; padding:22px;
  box-shadow:0 1px 2px rgba(26,37,32,.03); transition:transform .22s ease, box-shadow .22s ease, border-color .22s ease;}
.ms-card:hover{transform:translateY(-3px); box-shadow:0 14px 30px -18px rgba(16,96,76,.4); border-color:color-mix(in srgb,var(--pine) 30%, var(--line));}
.ms-card-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;}
.ms-card-title{display:flex; align-items:center; gap:8px; margin:0; font-size:14px; font-weight:600; letter-spacing:.01em; color:var(--ink); }
.ms-card-title svg{color:var(--pine);}
.ms-card-note{margin:4px 0 0; font-size:12.5px; color:var(--muted);}
.ms-link{display:inline-flex; align-items:center; gap:4px; background:none; border:0; color:var(--pine); font-weight:600; font-size:12.5px; cursor:pointer;}
.ms-link:hover{text-decoration:underline; text-underline-offset:3px;}

/* ticket */
.ms-ticket{grid-column:span 7; display:flex; border-radius:22px; overflow:hidden;
  border:1px solid var(--line); background:var(--card);
  box-shadow:0 18px 40px -28px rgba(16,96,76,.55); transition:transform .22s ease, box-shadow .22s ease;}
.ms-ticket:hover{transform:translateY(-3px); box-shadow:0 26px 50px -28px rgba(16,96,76,.6);}
.ms-ticket-body{flex:1; padding:26px 28px;}
.ms-ticket-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;}
.ms-tag{display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px;
  background:var(--pine-soft); color:var(--pine-2); font-size:12px; font-weight:600;}
.ms-ticket-code{font-family:'Fraunces',serif; font-size:13px; letter-spacing:.18em; color:var(--muted);}
.ms-ticket-kicker{margin:0 0 2px; font-size:12px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--coral);}
.ms-ticket-prof{font-family:'Fraunces',serif; font-weight:500; font-size:30px; line-height:1.05; letter-spacing:-.02em; margin:0 0 6px; color:var(--ink);}
.ms-ticket-esp{display:flex; align-items:center; gap:7px; margin:0 0 22px; font-size:14px; color:var(--ink-2);}
.ms-ticket-esp svg{color:var(--pine);}
.ms-ticket-when{display:flex; gap:30px; padding:18px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line);}
.ms-ticket-when>div{display:flex; flex-direction:column; gap:3px;}
.ms-ticket-lbl{font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--muted);}
.ms-ticket-val{font-size:15px; font-weight:600; color:var(--ink);}
.ms-cap{text-transform:capitalize;}
.ms-ticket-place{display:flex; align-items:center; gap:7px; margin:16px 0 0; font-size:13px; color:var(--muted);}
.ms-ticket-place svg{color:var(--pine);}

/* perforated stub */
.ms-stub{position:relative; width:222px; flex-shrink:0; padding:26px 22px; display:flex; flex-direction:column; gap:10px;
  background:
    radial-gradient(circle at left top, transparent 9px, transparent 9px),
    linear-gradient(var(--pine), var(--pine-2));
  color:#EAF3EE;}
.ms-stub::before{content:""; position:absolute; left:-9px; top:0; bottom:0; width:18px;
  background:
    radial-gradient(circle at center, var(--paper) 0 8px, transparent 8.5px) left center / 18px 26px repeat-y;}
.ms-stub-lbl{font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#A9CBBF;}
.ms-count{display:flex; align-items:flex-start; gap:4px; margin:2px 0 6px;}
.ms-count-skel{font-family:'Fraunces',serif; font-size:30px; letter-spacing:.06em; color:#A9CBBF;}
.ms-unit{display:flex; flex-direction:column; align-items:center; gap:1px; min-width:30px;}
.ms-unit-n{font-family:'Fraunces',serif; font-weight:600; font-size:30px; line-height:1; font-variant-numeric:tabular-nums; color:#FBF8F1;}
.ms-unit-l{font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#9DC3B6;}
.ms-unit-sep{font-family:'Fraunces',serif; font-size:26px; line-height:1; color:#6FA593; padding-top:1px;}
.ms-cta{margin-top:auto; display:inline-flex; align-items:center; justify-content:center; gap:8px; height:42px; border-radius:12px;
  border:0; background:#F4EFE3; color:var(--pine-2); font-weight:700; font-size:14px; cursor:pointer; transition:.18s;}
.ms-cta:hover{gap:12px; background:#fff;}
.ms-cta-ghost{display:inline-flex; align-items:center; justify-content:center; height:38px; border-radius:11px;
  border:1px solid rgba(244,239,227,.35); background:transparent; color:#DCEBE3; font-weight:600; font-size:13px; cursor:pointer; transition:.18s;}
.ms-cta-ghost:hover{background:rgba(244,239,227,.12);}

/* adherence */
.ms-adher{grid-column:span 5; display:flex; flex-direction:column;}
.ms-trend{font-size:12px; font-weight:600; color:var(--pine); background:var(--pine-soft); padding:3px 9px; border-radius:999px;}
.ms-adher-num{font-family:'Fraunces',serif; font-weight:500; font-size:58px; line-height:1; letter-spacing:-.03em; color:var(--ink);}
.ms-adher-num span{font-size:26px; color:var(--pine); margin-left:2px;}
.ms-spark{margin-top:auto; padding-top:14px;}

/* agenda timeline */
.ms-agenda{grid-column:span 7;}
.ms-timeline{list-style:none; margin:0; padding:0; position:relative;}
.ms-timeline::before{content:""; position:absolute; left:55px; top:10px; bottom:10px; width:1.5px; background:var(--line);}
.ms-tl-item{position:relative; display:grid; grid-template-columns:46px 1fr auto; align-items:center; gap:16px; padding:11px 0;}
.ms-tl-node{position:absolute; left:50px; width:11px; height:11px; border-radius:50%; background:var(--card); border:2px solid var(--pine); z-index:1;}
.ms-tl-when{display:flex; flex-direction:column; text-align:right;}
.ms-tl-hora{font-family:'Fraunces',serif; font-weight:600; font-size:16px; color:var(--ink); font-variant-numeric:tabular-nums;}
.ms-tl-dia{font-size:11px; color:var(--muted); text-transform:capitalize;}
.ms-tl-body{padding-left:18px;}
.ms-tl-prof{margin:0; font-size:14.5px; font-weight:600; color:var(--ink);}
.ms-tl-esp{margin:2px 0 0; font-size:12.5px; color:var(--muted);}
.ms-mod-virt{color:var(--pine); font-weight:600;}
.ms-mod-pres{color:var(--gold); font-weight:600;}
.ms-estado{font-size:11px; font-weight:600; padding:4px 10px; border-radius:999px; background:var(--card-2); color:var(--muted); border:1px solid var(--line);}
.ms-estado.is-conf{background:var(--pine-soft); color:var(--pine-2); border-color:transparent;}

/* recetas */
.ms-recetas{grid-column:span 5;}
.ms-count-pill{display:grid; place-items:center; min-width:22px; height:22px; padding:0 6px; border-radius:999px; background:var(--coral-soft); color:var(--coral); font-size:12px; font-weight:700;}
.ms-receta-list{display:flex; flex-direction:column; gap:16px;}
.ms-receta-top{display:flex; align-items:baseline; justify-content:space-between;}
.ms-receta-droga{font-size:14.5px; font-weight:600; color:var(--ink);}
.ms-receta-qty{font-family:'Fraunces',serif; font-weight:600; font-size:14px; color:var(--pine);}
.ms-receta-qty.is-low{color:var(--coral);}
.ms-receta-pauta{margin:3px 0 8px; font-size:12.5px; color:var(--muted);}
.ms-bar{height:6px; border-radius:999px; background:var(--card-2); overflow:hidden;}
.ms-bar>span{display:block; height:100%; border-radius:999px; background:var(--pine);}
.ms-bar>span.is-low{background:var(--coral);}

/* waitlist */
.ms-espera{grid-column:span 7; display:flex; flex-direction:column;}
.ms-pine-pill{background:var(--pine-soft); color:var(--pine-2);}
.ms-espera-list{display:flex; flex-direction:column; gap:10px; margin-top:auto;}
.ms-espera-item{display:flex; align-items:center; gap:14px; padding:13px 15px; border-radius:14px;
  background:var(--card-2); border:1px solid var(--line); transition:.18s;}
.ms-espera-item:hover{border-color:color-mix(in srgb,var(--pine) 32%, var(--line)); background:var(--card);}
.ms-pulse{position:relative; flex-shrink:0; width:9px; height:9px; border-radius:50%; background:var(--pine);}
.ms-pulse::after{content:""; position:absolute; inset:0; border-radius:50%; background:var(--pine);
  animation:ms-ping 1.8s cubic-bezier(0,0,.2,1) infinite;}
@keyframes ms-ping{0%{transform:scale(1); opacity:.5;} 80%,100%{transform:scale(2.6); opacity:0;}}
.ms-espera-body{flex:1; min-width:0;}
.ms-espera-esp{margin:0; font-size:14.5px; font-weight:600; color:var(--ink);}
.ms-espera-prof{margin:2px 0 0; font-size:12.5px; color:var(--muted);}
.ms-espera-pos{display:flex; flex-direction:column; align-items:flex-end; line-height:1;}
.ms-espera-pos-n{font-family:'Fraunces',serif; font-weight:600; font-size:18px; color:var(--pine);}
.ms-espera-pos-l{font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); margin-top:2px;}
.ms-espera-x{flex-shrink:0; width:26px; height:26px; border-radius:8px; border:1px solid var(--line); background:var(--card);
  color:var(--muted); font-size:17px; line-height:1; cursor:pointer; transition:.16s;}
.ms-espera-x:hover{border-color:var(--coral); color:var(--coral); background:var(--coral-soft);}
@media (prefers-reduced-motion:reduce){.ms-pulse::after{animation:none;}}

/* datos */
.ms-datos{grid-column:span 5; display:flex; flex-direction:column;}
.ms-datos-row{display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px dashed var(--line);}
.ms-datos-k{font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted);}
.ms-datos-v{font-family:'Fraunces',serif; font-weight:600; font-size:16px; color:var(--ink);}
.ms-datos-aler{padding:12px 0 16px;}
.ms-aler-tags{display:flex; flex-wrap:wrap; gap:7px; margin-top:9px;}
.ms-aler-tag{padding:5px 11px; border-radius:8px; background:var(--coral-soft); color:var(--coral); font-size:12.5px; font-weight:600;
  border:1px solid color-mix(in srgb,var(--coral) 22%, transparent);}
.ms-full{width:100%; margin-top:auto; color:var(--pine-2); border-color:var(--line); background:var(--card-2);}
.ms-datos .ms-full:hover{background:var(--pine-soft);}

/* footer */
.ms-foot{display:flex; align-items:center; justify-content:space-between; margin-top:34px; padding-top:20px;
  border-top:1px solid var(--line); font-size:12.5px; color:var(--muted);}
.ms-foot span{display:inline-flex; align-items:center; gap:6px;}

/* reveal animation */
.reveal{opacity:0; transform:translateY(14px); animation:ms-rise .7s cubic-bezier(.2,.7,.2,1) forwards; animation-delay:var(--d,0ms);}
@keyframes ms-rise{to{opacity:1; transform:none;}}
@media (prefers-reduced-motion:reduce){.reveal{animation:none; opacity:1; transform:none;}}

/* responsive */
@media (max-width:900px){
  .ms-ticket,.ms-adher,.ms-agenda,.ms-recetas,.ms-espera,.ms-datos{grid-column:span 12;}
  .ms-ticket{flex-direction:column;}
  .ms-stub{width:100%;}
  .ms-stub::before{left:0; right:0; top:-9px; bottom:auto; width:auto; height:18px;
    background:radial-gradient(circle at center, var(--paper) 0 8px, transparent 8.5px) center top / 26px 18px repeat-x;}
}
@media (max-width:560px){
  .ms-hello{flex-direction:column; align-items:flex-start;}
  .ms-ticket-when{gap:20px; flex-wrap:wrap;}
}
`;
