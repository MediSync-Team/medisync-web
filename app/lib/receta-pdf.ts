import { RecetaIndicacion, Profesional, Paciente } from './api';
import { formatClinicInstantDate, formatClinicInstantDateTime, formatClinicInstantTime } from './date';

export interface RecetaPDFData {
  receta: RecetaIndicacion;
  profesional: {
    nombre: string;
    apellido: string;
    especialidad: string;
    matricula?: string | null;
    lugarAtencion?: string | null;
    telefono?: string | null;
    fotoUrl?: string | null;
  };
  paciente?: {
    nombre: string;
    apellido: string;
    email?: string;
  } | null;
  fechaHora: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
}

function seccion(titulo: string, contenido: string): string {
  return `
    <div class="seccion">
      <div class="seccion-titulo">${titulo}</div>
      <div class="seccion-cuerpo">${contenido.replace(/\n/g, '<br>')}</div>
    </div>`;
}

export function imprimirReceta(data: RecetaPDFData) {
  const { receta, profesional, paciente, fechaHora, modalidad } = data;

  const fechaTurno = formatClinicInstantDate(fechaHora, 'es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const horaTurno = formatClinicInstantTime(fechaHora, 'es-AR');
  const emitidaAt = formatClinicInstantDateTime(receta.emitidaAt, 'es-AR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const logoSvg = `
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`;

  const fotoHtml = profesional.fotoUrl
    ? `<img src="${profesional.fotoUrl}" class="foto-prof" alt="Foto profesional" onerror="this.style.display='none'" />`
    : '';

  const secciones = [
    receta.diagnostico && seccion('Diagnóstico', receta.diagnostico),
    receta.planTratamiento && seccion('Plan de tratamiento', receta.planTratamiento),
    receta.medicamentos && seccion('Medicamentos', receta.medicamentos),
    seccion('Indicaciones', receta.indicaciones),
    receta.estudiosSolicitados && seccion('Estudios solicitados', receta.estudiosSolicitados),
    receta.proximoControl && seccion('Próximo control', receta.proximoControl),
    receta.advertencias && seccion('⚠ Advertencias', receta.advertencias),
    receta.observaciones && seccion('Observaciones', receta.observaciones),
  ].filter(Boolean).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta — Dr/a. ${profesional.nombre} ${profesional.apellido}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      color: #1e293b;
      background: #fff;
      padding: 0;
    }

    @page {
      size: A4;
      margin: 18mm 20mm 22mm 20mm;
    }

    /* -- Membrete ----------------------- */
    .membrete {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 3px solid #2563EB;
      margin-bottom: 18px;
    }
    .membrete-izq {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .foto-prof {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e2e8f0;
      flex-shrink: 0;
    }
    .prof-nombre {
      font-size: 17pt;
      font-weight: bold;
      color: #1e293b;
      letter-spacing: -0.3px;
    }
    .prof-esp {
      font-size: 10.5pt;
      color: #2563EB;
      font-style: italic;
      margin-top: 2px;
    }
    .prof-mat {
      font-size: 9.5pt;
      color: #64748b;
      margin-top: 3px;
    }
    .membrete-der {
      text-align: right;
      font-size: 9pt;
      color: #64748b;
      line-height: 1.7;
      flex-shrink: 0;
    }
    .membrete-der strong {
      display: block;
      color: #1e293b;
      font-size: 9.5pt;
    }
    .logo-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      justify-content: flex-end;
      margin-bottom: 4px;
    }
    .logo-text {
      font-size: 12pt;
      font-weight: bold;
      color: #2563EB;
    }

    /* -- Datos del turno ------------------ */
    .datos-turno {
      display: flex;
      gap: 0;
      margin-bottom: 20px;
    }
    .datos-turno-col {
      flex: 1;
    }
    .datos-turno-col:last-child {
      text-align: right;
    }
    .dato-label {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94a3b8;
      font-family: Arial, sans-serif;
      margin-bottom: 1px;
    }
    .dato-valor {
      font-size: 10.5pt;
      color: #1e293b;
      font-weight: 500;
    }
    .badge-modalidad {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 20px;
      font-size: 9pt;
      font-family: Arial, sans-serif;
      font-weight: 600;
      background: #dbeafe;
      color: #1d4ed8;
    }

    /* -- Separador ------------------------ */
    .sep {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0 0 18px 0;
    }

    /* -- Título principal ----------------- */
    .titulo-receta {
      font-size: 13pt;
      font-weight: bold;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 16px;
      font-family: Arial, sans-serif;
      border-left: 4px solid #2563EB;
      padding-left: 10px;
    }

    /* -- Secciones ------------------------ */
    .seccion {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .seccion-titulo {
      font-size: 9pt;
      font-family: Arial, sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.7px;
      color: #2563EB;
      margin-bottom: 4px;
    }
    .seccion-cuerpo {
      font-size: 10.5pt;
      color: #1e293b;
      line-height: 1.65;
      padding-left: 2px;
    }

    /* -- Pie de página -------------------- */
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 20mm;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #94a3b8;
      font-family: Arial, sans-serif;
      background: #fff;
    }
    .firma-linea {
      width: 160px;
      border-top: 1px solid #94a3b8;
      margin-bottom: 4px;
    }
    .firma-wrap {
      text-align: center;
    }
    .firma-nombre {
      font-size: 9pt;
      color: #1e293b;
      font-weight: 600;
    }
    .footer-emisión {
      text-align: left;
    }
    .footer-medisync {
      text-align: right;
      color: #2563EB;
      font-weight: 600;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .footer { position: fixed; bottom: 0; }
    }

    /* -- Botón imprimir (solo pantalla) -- */
    .btn-imprimir {
      display: block;
      margin: 20px auto;
      padding: 10px 28px;
      background: #2563EB;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 11pt;
      cursor: pointer;
      font-family: Arial, sans-serif;
    }
    .btn-imprimir:hover { background: #1d4ed8; }
    @media print { .btn-imprimir { display: none; } }
  </style>
</head>
<body>

  <button class="btn-imprimir no-print" onclick="window.print()">
    🖨️ Imprimir / Guardar como PDF
  </button>

  <!-- Membrete -->
  <div class="membrete">
    <div class="membrete-izq">
      ${fotoHtml}
      <div>
        <div class="prof-nombre">Dr/a. ${profesional.nombre} ${profesional.apellido}</div>
        <div class="prof-esp">${profesional.especialidad}</div>
        ${profesional.matricula ? `<div class="prof-mat">Mat. ${profesional.matricula}</div>` : ''}
      </div>
    </div>
    <div class="membrete-der">
      <div class="logo-wrap">
        ${logoSvg}
        <span class="logo-text">MediSync</span>
      </div>
      ${profesional.lugarAtencion ? `<strong>${profesional.lugarAtencion}</strong>` : ''}
      ${profesional.telefono ? `Tel: ${profesional.telefono}` : ''}
    </div>
  </div>

  <!-- Datos del turno -->
  <div class="datos-turno">
    <div class="datos-turno-col">
      <div class="dato-label">Paciente</div>
      <div class="dato-valor">${paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente sin cuenta'}</div>
    </div>
    <div class="datos-turno-col" style="text-align:center">
      <div class="dato-label">Fecha de consulta</div>
      <div class="dato-valor">${fechaTurno}, ${horaTurno} h</div>
    </div>
    <div class="datos-turno-col" style="text-align:right">
      <div class="dato-label">Modalidad</div>
      <span class="badge-modalidad">${modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</span>
    </div>
  </div>

  <hr class="sep">

  <!-- Título -->
  <div class="titulo-receta">Receta e Indicaciones Médicas</div>

  <!-- Secciones de la receta -->
  ${secciones}

  <!-- Pie de página -->
  <div class="footer">
    <div class="footer-emisión">
      Emitida el ${emitidaAt}<br>
      Documento generado por MediSync
    </div>
    <div class="firma-wrap">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Dr/a. ${profesional.nombre} ${profesional.apellido}</div>
      ${profesional.matricula ? `<div style="font-size:8pt;color:#64748b">Mat. ${profesional.matricula}</div>` : ''}
    </div>
    <div class="footer-medisync">medisync.com.ar</div>
  </div>

</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=750');
  if (!win) {
    alert('Permitir ventanas emergentes para descargar el PDF.');
    return;
  }
  win.document.write(html);
  win.document.close();
  // Small delay so images load before print dialog
  setTimeout(() => win.print(), 600);
}
