import { HistorialTurno, Paciente } from './api';
import { formatClinicCurrentDate, formatClinicInstantDate, formatClinicInstantTime } from './date';

export interface HistorialPDFData {
  paciente: Paciente;
  turnos: HistorialTurno[];
  antecedentes?: {
    antecedentesPersonales?: string | null;
    antecedentesFamiliares?: string | null;
    alergias?: string | null;
    medicacionActual?: string | null;
    habitos?: string | null;
    diagnosticosPrevios?: string | null;
  };
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function nl2br(str: string): string {
  return esc(str).replace(/\n/g, '<br>');
}

function formatFecha(isoString: string, locale = 'es-AR'): string {
  return formatClinicInstantDate(isoString, locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatHora(isoString: string, locale = 'es-AR'): string {
  return formatClinicInstantTime(isoString, locale);
}

function renderAntecedente(label: string, valor?: string | null): string {
  if (!valor?.trim()) return '';
  return `
    <div class="ante-row">
      <span class="ante-label">${esc(label)}</span>
      <span class="ante-val">${nl2br(valor)}</span>
    </div>`;
}

function renderConsulta(item: HistorialTurno, idx: number, locale = 'es-AR'): string {
  const prof = item.profesional;
  const profNombre = prof ? `Dr/a. ${esc(prof.nombre ?? '')} ${esc(prof.apellido ?? '')}` : 'Profesional no disponible';
  const especialidad = prof?.especialidad?.nombre ? esc(prof.especialidad.nombre) : '';
  const modalidadLabel = item.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial';

  const evolucionHtml = item.evolucion?.contenido
    ? `<div class="seccion"><div class="sec-titulo">Evolución clínica</div><div class="sec-cuerpo">${nl2br(item.evolucion.contenido)}</div></div>`
    : '';

  const recetaHtml = item.recetaIndicacion ? (() => {
    const r = item.recetaIndicacion!;
    const rows = [
      r.diagnostico       ? `<div class="receta-row"><span class="receta-label">Diagnóstico</span><span>${nl2br(r.diagnostico)}</span></div>` : '',
      r.planTratamiento   ? `<div class="receta-row"><span class="receta-label">Plan de tratamiento</span><span>${nl2br(r.planTratamiento)}</span></div>` : '',
      r.medicamentos      ? `<div class="receta-row"><span class="receta-label">Medicamentos</span><span>${nl2br(r.medicamentos)}</span></div>` : '',
      r.indicaciones      ? `<div class="receta-row"><span class="receta-label">Indicaciones</span><span>${nl2br(r.indicaciones)}</span></div>` : '',
      r.estudiosSolicitados ? `<div class="receta-row"><span class="receta-label">Estudios solicitados</span><span>${nl2br(r.estudiosSolicitados)}</span></div>` : '',
      r.proximoControl    ? `<div class="receta-row"><span class="receta-label">Próximo control</span><span>${esc(r.proximoControl)}</span></div>` : '',
      r.advertencias      ? `<div class="receta-row receta-warning"><span class="receta-label">⚠ Advertencias</span><span>${nl2br(r.advertencias)}</span></div>` : '',
    ].filter(Boolean).join('');
    return `<div class="seccion seccion-receta"><div class="sec-titulo sec-titulo-green">Receta e indicaciones</div>${rows}</div>`;
  })() : '';

  const archivosHtml = item.archivos?.length
    ? `<div class="seccion"><div class="sec-titulo">Documentos adjuntos</div><div class="sec-cuerpo">${
        item.archivos.map(a => `<span class="archivo-chip">${esc(a.nombreOriginal ?? '')}</span>`).join(' ')
      }</div></div>`
    : '';

  const sinDatos = !item.evolucion && !item.recetaIndicacion && !(item.archivos?.length)
    ? `<p class="sin-datos">Sin evolución clínica registrada para esta consulta.</p>`
    : '';

  return `
  <div class="consulta ${idx === 0 ? 'consulta-first' : ''}">
    <div class="consulta-header">
      <div class="consulta-fecha">
        <span class="consulta-num">${idx + 1}</span>
        ${formatFecha(item.fechaHora, locale)} — ${formatHora(item.fechaHora, locale)} h
      </div>
      <span class="consulta-badge badge-${item.modalidad === 'VIRTUAL' ? 'blue' : 'slate'}">${modalidadLabel}</span>
    </div>
    <div class="consulta-prof">
      <strong>${profNombre}</strong>${especialidad ? ` · <span class="prof-esp">${especialidad}</span>` : ''}
    </div>
    ${evolucionHtml}
    ${recetaHtml}
    ${archivosHtml}
    ${sinDatos}
  </div>`;
}

export function imprimirHistorial(data: HistorialPDFData, locale = 'es-AR') {
  const { paciente, turnos, antecedentes } = data;

  const pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
  const hoy = formatClinicCurrentDate(locale, { day: '2-digit', month: 'long', year: 'numeric' });

  const antecedentesHtml = antecedentes ? [
    renderAntecedente('Antecedentes personales', antecedentes.antecedentesPersonales),
    renderAntecedente('Antecedentes familiares', antecedentes.antecedentesFamiliares),
    renderAntecedente('Alergias', antecedentes.alergias),
    renderAntecedente('Medicación actual', antecedentes.medicacionActual),
    renderAntecedente('Hábitos', antecedentes.habitos),
    renderAntecedente('Diagnósticos previos', antecedentes.diagnosticosPrevios),
  ].filter(Boolean).join('') : '';

  const consultasHtml = turnos.length
    ? turnos.map((t, i) => renderConsulta(t, i, locale)).join('')
    : '<p class="sin-datos">No hay consultas completadas en el historial.</p>';

  const logoSvg = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Historia Clínica — ${pacienteNombre}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10.5pt;
      color: #1e293b;
      background: #fff;
    }
    @page { size: A4; margin: 18mm 20mm 22mm 20mm; }

    /* -- Header ------------------------ */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 3px solid #2563EB;
      margin-bottom: 20px;
    }
    .header-logo { display: flex; align-items: center; gap: 8px; }
    .logo-text { font-size: 16pt; font-weight: bold; color: #2563EB; font-family: Arial, sans-serif; }
    .header-right { text-align: right; font-size: 8.5pt; color: #64748b; font-family: Arial, sans-serif; line-height: 1.7; }
    .header-right strong { font-size: 9.5pt; color: #1e293b; display: block; }

    /* -- Datos del paciente ------------ */
    .paciente-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 22px;
    }
    .paciente-titulo {
      font-size: 8pt; font-family: Arial, sans-serif; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.8px; color: #2563EB; margin-bottom: 8px;
    }
    .paciente-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
    .paciente-row { font-size: 9.5pt; }
    .paciente-label { color: #64748b; font-family: Arial, sans-serif; font-size: 8pt; }

    /* -- Sección antecedentes --------- */
    .bloque-titulo {
      font-size: 11pt; font-weight: bold; color: #1e293b;
      font-family: Arial, sans-serif; text-transform: uppercase;
      letter-spacing: 0.8px; border-left: 4px solid #2563EB;
      padding-left: 10px; margin-bottom: 14px; margin-top: 24px;
    }
    .ante-row {
      display: flex; gap: 14px; padding: 6px 0;
      border-bottom: 1px solid #f1f5f9; font-size: 9.5pt;
    }
    .ante-label {
      font-family: Arial, sans-serif; font-weight: 700; color: #64748b;
      font-size: 8.5pt; min-width: 140px; padding-top: 1px;
    }
    .ante-val { color: #1e293b; line-height: 1.6; flex: 1; }

    /* -- Consultas --------------------- */
    .consulta {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 16px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .consulta-first { margin-top: 0; }
    .consulta-header {
      background: #eff6ff; padding: 8px 14px;
      display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
    }
    .consulta-fecha {
      font-size: 9.5pt; font-weight: bold;
      color: #1d4ed8; font-family: Arial, sans-serif;
      display: flex; align-items: center; gap: 8px;
    }
    .consulta-num {
      background: #2563EB; color: white;
      border-radius: 50%; width: 18px; height: 18px;
      font-size: 8pt; display: inline-flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .consulta-badge {
      font-size: 8pt; font-family: Arial, sans-serif;
      font-weight: 600; padding: 2px 9px; border-radius: 20px;
    }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-slate { background: #f1f5f9; color: #475569; }
    .consulta-prof {
      padding: 8px 14px; font-size: 9.5pt;
      border-bottom: 1px solid #f1f5f9;
    }
    .prof-esp { color: #2563EB; font-style: italic; }

    /* -- Secciones dentro de consulta -- */
    .seccion { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
    .seccion:last-child { border-bottom: none; }
    .sec-titulo {
      font-size: 8pt; font-family: Arial, sans-serif; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.6px;
      color: #64748b; margin-bottom: 5px;
    }
    .sec-titulo-green { color: #059669; }
    .sec-cuerpo { font-size: 9.5pt; color: #1e293b; line-height: 1.65; }

    .seccion-receta { background: #f0fdf4; }
    .receta-row {
      display: grid; grid-template-columns: 130px 1fr;
      gap: 8px; padding: 4px 0;
      border-bottom: 1px solid #dcfce7; font-size: 9.5pt;
    }
    .receta-row:last-child { border-bottom: none; }
    .receta-label { font-family: Arial, sans-serif; font-weight: 700; color: #059669; font-size: 8.5pt; }
    .receta-warning .receta-label { color: #d97706; }

    .archivo-chip {
      display: inline-block; background: #f1f5f9;
      border: 1px solid #e2e8f0; border-radius: 4px;
      padding: 2px 8px; font-size: 8.5pt; font-family: Arial, sans-serif;
      color: #475569; margin: 2px 3px 2px 0;
    }
    .sin-datos { font-style: italic; color: #94a3b8; font-size: 9pt; padding: 10px 14px; }

    /* -- Footer ------------------------ */
    .footer {
      position: fixed; bottom: 0; left: 0; right: 0;
      padding: 8px 20mm; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: space-between; align-items: center;
      font-size: 7.5pt; color: #94a3b8;
      font-family: Arial, sans-serif; background: #fff;
    }
    .footer-medisync { color: #2563EB; font-weight: 700; }

    /* -- Botón imprimir ---------------- */
    .btn-imprimir {
      display: block; margin: 18px auto;
      padding: 10px 28px; background: #2563EB; color: white;
      border: none; border-radius: 8px; font-size: 11pt;
      cursor: pointer; font-family: Arial, sans-serif;
    }
    .btn-imprimir:hover { background: #1d4ed8; }
    @media print {
      body { padding: 0; }
      .btn-imprimir { display: none; }
      .footer { position: fixed; bottom: 0; }
    }
  </style>
</head>
<body>

  <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

  <!-- Header -->
  <div class="header">
    <div class="header-logo">
      ${logoSvg}
      <span class="logo-text">MediSync</span>
    </div>
    <div class="header-right">
      <strong>Historia Clínica Digital</strong>
      Generado el ${hoy}<br>
      Documento confidencial — uso médico
    </div>
  </div>

  <!-- Datos del paciente -->
  <div class="paciente-box">
    <div class="paciente-titulo">Datos del paciente</div>
    <div class="paciente-grid">
      <div class="paciente-row"><span class="paciente-label">Nombre completo</span><br>${esc(pacienteNombre)}</div>
      ${paciente.dni ? `<div class="paciente-row"><span class="paciente-label">DNI</span><br>${esc(paciente.dni)}</div>` : ''}
      ${paciente.fechaNacimiento ? `<div class="paciente-row"><span class="paciente-label">Fecha de nacimiento</span><br>${new Date(paciente.fechaNacimiento).toLocaleDateString(locale)}</div>` : ''}
      ${paciente.telefono ? `<div class="paciente-row"><span class="paciente-label">Teléfono</span><br>${esc(paciente.telefono)}</div>` : ''}
      ${paciente.email ? `<div class="paciente-row"><span class="paciente-label">Email</span><br>${esc(paciente.email)}</div>` : ''}
      ${paciente.obraSocial ? `<div class="paciente-row"><span class="paciente-label">Obra social / Prepaga</span><br>${esc(paciente.obraSocial)}</div>` : ''}
    </div>
  </div>

  ${antecedentesHtml ? `
  <!-- Antecedentes -->
  <div class="bloque-titulo">Antecedentes médicos</div>
  <div>${antecedentesHtml}</div>
  ` : ''}

  <!-- Consultas -->
  <div class="bloque-titulo">Historial de consultas (${turnos.length})</div>
  ${consultasHtml}

  <!-- Footer -->
  <div class="footer">
    <div>Historia clínica de ${esc(pacienteNombre)} · Generada el ${hoy}</div>
    <div class="footer-medisync">MediSync · medisync.com.ar</div>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=800');
  if (!win) {
    alert('Permitir ventanas emergentes para descargar el PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 700);
}
