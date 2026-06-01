import { HistorialTurno, Paciente } from './api';
import { formatClinicCurrentDate, formatClinicInstantDate, formatClinicInstantTime } from './date';
import { interpolate, PdfLanguageInput, resolvePdfI18n } from './pdf-i18n';

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

function renderConsulta(item: HistorialTurno, idx: number, locale = 'es-AR', pdf = resolvePdfI18n('es').pdf): string {
  const prof = item.profesional;
  const profNombre = prof ? `Dr/a. ${esc(prof.nombre ?? '')} ${esc(prof.apellido ?? '')}` : pdf.common.professionalUnavailable;
  const especialidad = prof?.especialidad?.nombre ? esc(prof.especialidad.nombre) : '';
  const modalidadLabel = item.modalidad === 'VIRTUAL' ? pdf.common.virtual : pdf.common.inPerson;

  const evolucionHtml = item.evolucion?.contenido
    ? `<div class="seccion"><div class="sec-titulo">${pdf.history.clinicalEvolution}</div><div class="sec-cuerpo">${nl2br(item.evolucion.contenido)}</div></div>`
    : '';

  const recetaHtml = item.recetaIndicacion ? (() => {
    const r = item.recetaIndicacion!;
    const rows = [
      r.diagnostico       ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.diagnosis}</span><span>${nl2br(r.diagnostico)}</span></div>` : '',
      r.planTratamiento   ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.treatmentPlan}</span><span>${nl2br(r.planTratamiento)}</span></div>` : '',
      r.medicamentos      ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.medicines}</span><span>${nl2br(r.medicamentos)}</span></div>` : '',
      r.indicaciones      ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.indications}</span><span>${nl2br(r.indicaciones)}</span></div>` : '',
      r.estudiosSolicitados ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.requestedStudies}</span><span>${nl2br(r.estudiosSolicitados)}</span></div>` : '',
      r.proximoControl    ? `<div class="receta-row"><span class="receta-label">${pdf.prescription.nextControl}</span><span>${esc(r.proximoControl)}</span></div>` : '',
      r.advertencias      ? `<div class="receta-row receta-warning"><span class="receta-label">${pdf.prescription.warnings}</span><span>${nl2br(r.advertencias)}</span></div>` : '',
    ].filter(Boolean).join('');
    return `<div class="seccion seccion-receta"><div class="sec-titulo sec-titulo-green">${pdf.prescription.prescriptionAndIndications}</div>${rows}</div>`;
  })() : '';

  const archivosHtml = item.archivos?.length
    ? `<div class="seccion"><div class="sec-titulo">${pdf.history.attachedDocuments}</div><div class="sec-cuerpo">${
        item.archivos.map(a => `<span class="archivo-chip">${esc(a.nombreOriginal ?? '')}</span>`).join(' ')
      }</div></div>`
    : '';

  const sinDatos = !item.evolucion && !item.recetaIndicacion && !(item.archivos?.length)
    ? `<p class="sin-datos">${pdf.history.noClinicalEvolution}</p>`
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

export function imprimirHistorial(data: HistorialPDFData, langOrLocale: PdfLanguageInput = 'es') {
  const { lang, locale, pdf } = resolvePdfI18n(langOrLocale);
  const { paciente, turnos, antecedentes } = data;

  const pacienteNombre = `${paciente.nombre} ${paciente.apellido}`;
  const hoy = formatClinicCurrentDate(locale, { day: '2-digit', month: 'long', year: 'numeric' });

  const antecedentesHtml = antecedentes ? [
    renderAntecedente(pdf.history.personalHistory, antecedentes.antecedentesPersonales),
    renderAntecedente(pdf.history.familyHistory, antecedentes.antecedentesFamiliares),
    renderAntecedente(pdf.history.allergies, antecedentes.alergias),
    renderAntecedente(pdf.history.currentMedication, antecedentes.medicacionActual),
    renderAntecedente(pdf.history.habits, antecedentes.habitos),
    renderAntecedente(pdf.history.previousDiagnoses, antecedentes.diagnosticosPrevios),
  ].filter(Boolean).join('') : '';

  const consultasHtml = turnos.length
    ? turnos.map((t, i) => renderConsulta(t, i, locale, pdf)).join('')
    : `<p class="sin-datos">${pdf.history.noCompletedConsultations}</p>`;

  const logoSvg = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`;

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${interpolate(pdf.history.browserTitle, { patient: pacienteNombre })}</title>
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

  <button class="btn-imprimir" onclick="window.print()">🖨️ ${pdf.common.printSavePdf}</button>

  <!-- Header -->
  <div class="header">
    <div class="header-logo">
      ${logoSvg}
      <span class="logo-text">MediSync</span>
    </div>
    <div class="header-right">
      <strong>${pdf.history.title}</strong>
      ${interpolate(pdf.common.generatedOn, { date: hoy })}<br>
      ${pdf.common.confidentialMedicalUse}
    </div>
  </div>

  <!-- Datos del paciente -->
  <div class="paciente-box">
    <div class="paciente-titulo">${pdf.history.patientData}</div>
    <div class="paciente-grid">
      <div class="paciente-row"><span class="paciente-label">${pdf.history.fullName}</span><br>${esc(pacienteNombre)}</div>
      ${paciente.dni ? `<div class="paciente-row"><span class="paciente-label">DNI</span><br>${esc(paciente.dni)}</div>` : ''}
      ${paciente.fechaNacimiento ? `<div class="paciente-row"><span class="paciente-label">${pdf.history.birthDate}</span><br>${new Date(paciente.fechaNacimiento).toLocaleDateString(locale)}</div>` : ''}
      ${paciente.telefono ? `<div class="paciente-row"><span class="paciente-label">${pdf.history.phone}</span><br>${esc(paciente.telefono)}</div>` : ''}
      ${paciente.email ? `<div class="paciente-row"><span class="paciente-label">Email</span><br>${esc(paciente.email)}</div>` : ''}
      ${paciente.obraSocial ? `<div class="paciente-row"><span class="paciente-label">${pdf.history.healthInsurance}</span><br>${esc(paciente.obraSocial)}</div>` : ''}
    </div>
  </div>

  ${antecedentesHtml ? `
  <!-- Antecedentes -->
  <div class="bloque-titulo">${pdf.history.medicalAntecedents}</div>
  <div>${antecedentesHtml}</div>
  ` : ''}

  <!-- Consultas -->
  <div class="bloque-titulo">${interpolate(pdf.history.consultations, { count: turnos.length })}</div>
  ${consultasHtml}

  <!-- Footer -->
  <div class="footer">
    <div>${interpolate(pdf.history.generatedFooter, { patient: esc(pacienteNombre), date: hoy })}</div>
    <div class="footer-medisync">MediSync · medisync.com.ar</div>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=960,height=800');
  if (!win) {
    alert(pdf.common.popupBlockedPdf);
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 700);
}
