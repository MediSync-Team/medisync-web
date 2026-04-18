import { CertificadoConDatos } from './api';

export function imprimirCertificado(cert: CertificadoConDatos) {
  const prof = cert.turno.profesional;
  const pac = cert.turno.paciente;
  const fecha = new Date(cert.turno.fechaHora);
  const fechaStr = fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  const diasTexto = cert.diasReposo && cert.diasReposo > 0
    ? `prescribiéndose reposo médico por ${cert.diasReposo} día${cert.diasReposo !== 1 ? 's' : ''} a partir del ${fechaStr}`
    : '';

  const codValidacion = cert.id.substring(0, 8).toUpperCase();
  const qrData = `${window.location.origin}/verificar/${cert.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}`;

  const initials = `${prof.nombre[0]}${prof.apellido[0]}`.toUpperCase();
  const fotoUrlOrInitials = prof.fotoUrl
    ? `<img src="${prof.fotoUrl}" alt="Foto" style="width:60px; height:60px; border-radius:50%; object-fit:cover; margin-right:15px;" />`
    : `<div style="width:60px; height:60px; background:linear-gradient(135deg, #2563EB, #1e40af); border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; margin-right:15px;">${initials}</div>`;

  const tipoLabel = {
    REPOSO: 'Reposo Médico',
    CONSULTA: 'Justificación de Consulta',
    APTITUD: 'Aptitud Física',
    LIBRE: 'Certificado Médico',
  }[cert.tipo] || 'Certificado Médico';

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Certificado Médico</title>
      <style>
        * { margin: 0; padding: 0; }
        @page {
          size: A4;
          margin: 0;
        }
        body {
          font-family: 'Georgia', serif;
          color: #1E293B;
          padding: 40px;
          line-height: 1.6;
        }
        .container {
          max-width: 750px;
          margin: 0 auto;
          border: 2px solid #E2E8F0;
          border-radius: 8px;
          padding: 40px;
          background: white;
        }
        .header {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #E2E8F0;
        }
        .header-content {
          flex: 1;
        }
        .header-logo {
          text-align: right;
        }
        .header-logo svg {
          width: 40px;
          height: 40px;
        }
        .prof-name {
          font-weight: bold;
          font-size: 16px;
          color: #1E293B;
        }
        .prof-specialty {
          font-size: 13px;
          color: #64748B;
          margin: 2px 0;
        }
        .prof-details {
          font-size: 12px;
          color: #64748B;
          margin-top: 4px;
        }
        .title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          color: #2563EB;
          margin: 30px 0 10px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .subtitle {
          text-align: center;
          font-size: 12px;
          color: #64748B;
          margin-bottom: 20px;
        }
        .badge {
          display: inline-block;
          background: #DBEAFE;
          color: #0C4A6E;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: bold;
          text-align: center;
          margin: 0 auto;
          margin-bottom: 20px;
        }
        .content {
          margin: 25px 0;
          font-size: 14px;
          line-height: 1.8;
          text-align: justify;
        }
        .signature-line {
          border-top: 1px solid #1E293B;
          width: 200px;
          margin: 50px auto 10px auto;
        }
        .signature-text {
          text-align: center;
          font-size: 12px;
          margin-top: 5px;
          font-weight: bold;
        }
        .signature-details {
          text-align: center;
          font-size: 11px;
          color: #64748B;
        }
        .footer {
          border-top: 1px solid #E2E8F0;
          margin-top: 30px;
          padding-top: 15px;
          text-align: center;
          font-size: 11px;
          color: #64748B;
          display: flex;
          justify-content: center;
          gap: 15px;
          align-items: center;
        }
        .qr-code {
          text-align: center;
        }
        .qr-code img {
          width: 60px;
          height: 60px;
        }
        .validation-code {
          text-align: center;
          font-weight: bold;
          font-size: 12px;
          margin-top: 5px;
        }
        @media print {
          .btn-imprimir { display: none; }
          body { padding: 0; }
          .container { border: none; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; align-items: center; flex: 1;">
            ${fotoUrlOrInitials}
            <div class="header-content">
              <div class="prof-name">Dr/a. ${prof.nombre} ${prof.apellido}</div>
              <div class="prof-specialty">${prof.especialidad.nombre}</div>
              <div class="prof-details">
                Mat. ${prof.matricula || 'N/A'} · ${prof.telefono}
              </div>
              ${prof.lugarAtencion ? `<div class="prof-details">${prof.lugarAtencion}</div>` : ''}
            </div>
          </div>
          <div class="header-logo">
            <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#2563EB" opacity="0.1" stroke="#2563EB" stroke-width="1"/>
              <text x="20" y="24" font-size="16" font-weight="bold" fill="#2563EB" text-anchor="middle">M</text>
            </svg>
          </div>
        </div>

        <!-- Title -->
        <div class="title">Certificado Médico</div>
        <div class="badge">${tipoLabel}</div>

        <!-- Content -->
        <div class="content">
          <p>Quien suscribe, <strong>Dr/a. ${prof.nombre} ${prof.apellido}</strong>, Mat. <strong>${prof.matricula || 'N/A'}</strong>, especialista en <strong>${prof.especialidad.nombre}</strong>, certifica que el/la paciente <strong>${pac?.nombre} ${pac?.apellido}</strong>
          ${pac?.dni ? `, DNI ${pac.dni}` : ''}, fue atendido/a el <strong>${fechaStr}</strong> en modalidad <strong>${cert.turno.modalidad === 'VIRTUAL' ? 'Virtual' : 'Presencial'}</strong>.</p>

          <p style="margin-top: 15px;">
            <strong>Diagnóstico:</strong> ${cert.diagnostico}
          </p>

          <p style="margin-top: 15px;">
            ${cert.texto}
            ${diasTexto ? `<br/><br/>${diasTexto}.` : ''}
          </p>
        </div>

        <!-- Signature -->
        <div style="margin-top: 40px;">
          <div class="signature-line"></div>
          <div class="signature-text">Dr/a. ${prof.nombre} ${prof.apellido}</div>
          <div class="signature-details">Mat. ${prof.matricula || 'N/A'}</div>
          <div class="signature-details" style="margin-top: 8px;">Buenos Aires, ${fechaStr}</div>
        </div>

        <!-- Footer with QR -->
        <div class="footer">
          <div>
            <div>Certificado emitido a través de MediSync</div>
            <div>Código: ${codValidacion}</div>
          </div>
          <div class="qr-code">
            <img src="${qrCodeUrl}" alt="QR" />
            <div class="validation-code">${codValidacion}</div>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px;">
        <button class="btn-imprimir" onclick="window.print()" style="padding: 10px 20px; background: #2563EB; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Imprimir o Descargar PDF
        </button>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=900,height=750');
  if (!win) {
    alert('Por favor, permitir ventanas emergentes para descargar el certificado');
    return;
  }
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 600);
}
