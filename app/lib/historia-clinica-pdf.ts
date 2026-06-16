/**
 * Historia Clínica — PDF export via browser print.
 *
 * Builds a fully-styled HTML document and opens it in a new window.
 * The window auto-triggers the browser print dialog (which has "Save as PDF").
 * No external libraries required.
 */

import type { HistoriaClinicaPaciente } from './api';
import { formatClinicCurrentDate, formatClinicInstantDateTime } from './date';
import { interpolate, PdfLanguageInput, resolvePdfI18n } from './pdf-i18n';
import { openPrintDocument } from './pdf/print-document';

interface ProfesionalInfo {
  nombre: string;
  apellido: string;
  especialidad?: string;
  matricula?: string | null;
  lugarAtencion?: string | null;
}

function esc(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(iso: string | null | undefined, locale = 'es-AR', opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(locale, opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(iso: string | null | undefined, locale = 'es-AR'): string {
  if (!iso) return '—';
  return formatClinicInstantDateTime(iso, locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function estadoLabel(estado: string, labels: Record<string, string>): string {
  return labels[estado] ?? estado;
}

function sectionRow(label: string, value: string | null | undefined): string {
  if (!value?.trim()) return '';
  return `
    <tr>
      <td class="label">${esc(label)}</td>
      <td class="value">${esc(value).replace(/\n/g, '<br>')}</td>
    </tr>`;
}

export function exportarHistoriaClinicaPDF(
  historia: HistoriaClinicaPaciente,
  profesional: ProfesionalInfo,
  langInput: PdfLanguageInput = 'es',
): void {
  const { lang, locale, pdf } = resolvePdfI18n(langInput);
  const { paciente, resumen, timeline } = historia;
  const hoy = formatClinicCurrentDate(locale, { day: '2-digit', month: 'long', year: 'numeric' });

  // -- Patient info section --------------------------------------------------
  const infoRows = [
    sectionRow(pdf.clinicalRecord.name, `${paciente.nombre} ${paciente.apellido}`),
    sectionRow('DNI', paciente.dni),
    sectionRow(pdf.clinicalRecord.birthDate, fmtDate(paciente.fechaNacimiento as string | undefined, locale)),
    sectionRow(pdf.clinicalRecord.gender, paciente.genero),
    sectionRow('Email', paciente.email),
    sectionRow(pdf.clinicalRecord.phone, paciente.telefono),
    sectionRow(pdf.clinicalRecord.healthInsurance, paciente.obraSocial),
  ].join('');

  // -- Clinical antecedents --------------------------------------------------
  const antecedentesRows = [
    sectionRow(pdf.clinicalRecord.personalHistory,  paciente.antecedentesPersonales),
    sectionRow(pdf.clinicalRecord.familyHistory,  paciente.antecedentesFamiliares),
    sectionRow(pdf.clinicalRecord.allergies,                 paciente.alergias),
    sectionRow(pdf.clinicalRecord.currentMedication,        paciente.medicacionActual),
    sectionRow(pdf.clinicalRecord.habits,                  paciente.habitos),
    sectionRow(pdf.clinicalRecord.previousDiagnoses,     paciente.diagnosticosPrevios),
    sectionRow(pdf.clinicalRecord.generalClinicalNotes, paciente.notasClinicasGenerales),
  ].join('');

  // -- Timeline -------------------------------------------------------------
  const timelineHtml = timeline
    .filter(item => item.estado === 'COMPLETADO' || item.evolucion)
    .map((item, idx) => `
      <div class="consulta ${idx < timeline.length - 1 ? 'not-last' : ''}">
        <div class="consulta-header">
          <span class="consulta-fecha">${fmtDateTime(item.fechaHora, locale)}</span>
          <span class="estado estado-${item.estado.toLowerCase()}">${estadoLabel(item.estado, pdf.common.statuses)}</span>
          <span class="modalidad">${item.modalidad === 'VIRTUAL' ? pdf.common.virtual : pdf.common.inPerson}</span>
        </div>
        ${item.evolucion?.contenido ? `
          <div class="evolucion">
            <p class="evolucion-label">${pdf.clinicalRecord.clinicalEvolution}</p>
            <p class="evolucion-text">${esc(item.evolucion.contenido).replace(/\n/g, '<br>')}</p>
          </div>` : ''}
        ${item.archivos.length > 0 ? `
          <div class="archivos">
            <span class="archivos-label">${pdf.clinicalRecord.attachedFiles}</span>
            ${item.archivos.map(a => `<span class="archivo-chip">${esc(a.nombreOriginal)}</span>`).join('')}
          </div>` : ''}
      </div>`)
    .join('');

  // -- Full HTML document ----------------------------------------------------
  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${interpolate(pdf.clinicalRecord.browserTitle, { patient: `${esc(paciente.nombre)} ${esc(paciente.apellido)}` })}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #1e293b;
      background: #fff;
      padding: 0;
    }
    @page {
      size: A4;
      margin: 20mm 18mm 20mm 18mm;
    }

    /* -- Header -- */
    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 18px;
    }
    .header-brand { display: flex; align-items: center; gap: 8px; }
    .header-logo {
      width: 36px; height: 36px;
      background: #2563eb;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-weight: 800; font-size: 14pt;
    }
    .header-name { font-size: 18pt; font-weight: 700; color: #1e40af; }
    .header-sub  { font-size: 8.5pt; color: #64748b; margin-top: 2px; }
    .header-meta { text-align: right; font-size: 8.5pt; color: #64748b; line-height: 1.6; }
    .header-meta strong { color: #1e293b; }

    /* -- Doc title -- */
    .doc-title {
      font-size: 15pt;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      margin-bottom: 4px;
    }
    .doc-subtitle {
      font-size: 9pt;
      color: #64748b;
      text-align: center;
      margin-bottom: 20px;
    }

    /* -- Section -- */
    .section { margin-bottom: 18px; page-break-inside: avoid; }
    .section-title {
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #2563eb;
      border-bottom: 1px solid #bfdbfe;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }

    /* -- Info table -- */
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 4px 6px; vertical-align: top; }
    .info-table td.label {
      width: 38%;
      font-weight: 600;
      color: #475569;
      font-size: 9.5pt;
    }
    .info-table td.value {
      color: #1e293b;
      font-size: 9.5pt;
    }
    .info-table tr:nth-child(even) td { background: #f8fafc; }

    /* -- Resumen pills -- */
    .resumen {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
    }
    .resumen-pill {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
    }
    .resumen-pill .rp-label { font-size: 7.5pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .resumen-pill .rp-value { font-size: 16pt; font-weight: 700; color: #1e293b; line-height: 1.2; }
    .resumen-pill.green .rp-value { color: #059669; }

    /* -- Consulta -- */
    .consulta {
      margin-bottom: 14px;
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #2563eb;
      border-radius: 6px;
      page-break-inside: avoid;
    }
    .consulta.not-last { margin-bottom: 10px; }
    .consulta-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .consulta-fecha { font-size: 9.5pt; font-weight: 700; color: #1e293b; }
    .estado {
      font-size: 8pt;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 10px;
    }
    .estado-completado { background: #d1fae5; color: #065f46; }
    .estado-reservado  { background: #dbeafe; color: #1e40af; }
    .estado-confirmado { background: #e0f2fe; color: #0c4a6e; }
    .estado-cancelado  { background: #fee2e2; color: #991b1b; }
    .estado-ausente    { background: #fef3c7; color: #92400e; }
    .modalidad { font-size: 8pt; color: #64748b; margin-left: auto; }
    .evolucion { margin-top: 6px; }
    .evolucion-label {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .evolucion-text {
      font-size: 9.5pt;
      color: #1e293b;
      line-height: 1.55;
      white-space: pre-wrap;
    }
    .archivos { margin-top: 6px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .archivos-label { font-size: 8pt; color: #64748b; margin-right: 2px; }
    .archivo-chip {
      font-size: 8pt;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 1px 6px;
      color: #475569;
    }

    /* -- Footer -- */
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    .footer .signature-box {
      text-align: center;
      padding-top: 32px;
      border-top: 1px solid #94a3b8;
      min-width: 160px;
      font-size: 8pt;
      color: #475569;
    }

    @media print {
      .no-print { display: none !important; }
      body { padding: 0; }
    }
  </style>
</head>
<body>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="position:fixed;top:12px;right:12px;z-index:999;display:flex;gap:8px;">
    <button onclick="window.print()"
      style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:9px 20px;font-size:11pt;font-weight:600;cursor:pointer;">
      ${pdf.common.printSaveShort}
    </button>
    <button onclick="window.close()"
      style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;padding:9px 16px;font-size:11pt;cursor:pointer;">
      ${pdf.common.close}
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <div class="header-logo">M</div>
      <div>
        <div class="header-name">MediSync</div>
        <div class="header-sub">${pdf.clinicalRecord.platformSubtitle}</div>
      </div>
    </div>
    <div class="header-meta">
      <div><strong>${pdf.common.doctor}:</strong> Dr/a. ${esc(profesional.nombre)} ${esc(profesional.apellido)}</div>
      ${profesional.especialidad ? `<div><strong>${pdf.common.specialty}:</strong> ${esc(profesional.especialidad)}</div>` : ''}
      ${profesional.matricula ? `<div><strong>${pdf.common.licenseAbbr}:</strong> ${esc(profesional.matricula)}</div>` : ''}
      ${profesional.lugarAtencion ? `<div><strong>${pdf.common.location}:</strong> ${esc(profesional.lugarAtencion)}</div>` : ''}
      <div><strong>${pdf.common.date}:</strong> ${hoy}</div>
    </div>
  </div>

  <!-- Document title -->
  <p class="doc-title">${pdf.clinicalRecord.title}</p>
  <p class="doc-subtitle">
    ${esc(paciente.nombre)} ${esc(paciente.apellido)}
    ${paciente.dni ? ` · DNI ${esc(paciente.dni)}` : ''}
  </p>

  <!-- Resumen -->
  <div class="resumen">
    <div class="resumen-pill">
      <div class="rp-label">${pdf.clinicalRecord.totalConsultations}</div>
      <div class="rp-value">${resumen.totalConsultas}</div>
    </div>
    <div class="resumen-pill green">
      <div class="rp-label">${pdf.clinicalRecord.completed}</div>
      <div class="rp-value">${resumen.consultasCompletadas}</div>
    </div>
    <div class="resumen-pill">
      <div class="rp-label">${pdf.clinicalRecord.lastConsultation}</div>
      <div class="rp-value" style="font-size:10pt;">${fmtDate(resumen.ultimaConsulta, locale)}</div>
    </div>
  </div>

  <!-- Datos del paciente -->
  <div class="section">
    <div class="section-title">${pdf.clinicalRecord.patientData}</div>
    <table class="info-table">${infoRows}</table>
  </div>

  ${antecedentesRows ? `
  <!-- Antecedentes clínicos -->
  <div class="section">
    <div class="section-title">${pdf.clinicalRecord.clinicalAntecedents}</div>
    <table class="info-table">${antecedentesRows}</table>
  </div>` : ''}

  ${timelineHtml ? `
  <!-- Timeline de atenciones -->
  <div class="section">
    <div class="section-title">${pdf.clinicalRecord.careTimeline}</div>
    ${timelineHtml}
  </div>` : ''}

  <!-- Footer -->
  <div class="footer">
    <span>${interpolate(pdf.common.documentGeneratedOn, { date: hoy })} · MediSync</span>
    <div class="signature-box">
      Dr/a. ${esc(profesional.nombre)} ${esc(profesional.apellido)}<br>
      ${profesional.especialidad ? esc(profesional.especialidad) : ''}
      ${profesional.matricula ? ` · ${pdf.common.licenseAbbr} ${esc(profesional.matricula)}` : ''}
    </div>
  </div>

</body>
</html>`;

  openPrintDocument(html, {
    popupBlockedMessage: pdf.common.popupBlockedClinicalRecord,
    features: 'width=900,height=750,scrollbars=yes,resizable=yes',
  });
}
