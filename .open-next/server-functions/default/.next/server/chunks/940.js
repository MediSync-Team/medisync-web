"use strict";exports.id=940,exports.ids=[940],exports.modules={16113:(a,b,c)=>{function d(a,b){return`
    <div class="seccion">
      <div class="seccion-titulo">${a}</div>
      <div class="seccion-cuerpo">${b.replace(/\n/g,"<br>")}</div>
    </div>`}function e(a){let{receta:b,profesional:c,paciente:e,fechaHora:f,modalidad:g}=a,h=new Date(f).toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),i=new Date(f).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),j=new Date(b.emitidaAt).toLocaleString("es-AR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),k=`
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`,l=c.fotoUrl?`<img src="${c.fotoUrl}" class="foto-prof" alt="Foto profesional" onerror="this.style.display='none'" />`:"",m=[b.diagnostico&&d("Diagn\xf3stico",b.diagnostico),b.planTratamiento&&d("Plan de tratamiento",b.planTratamiento),b.medicamentos&&d("Medicamentos",b.medicamentos),d("Indicaciones",b.indicaciones),b.estudiosSolicitados&&d("Estudios solicitados",b.estudiosSolicitados),b.proximoControl&&d("Pr\xf3ximo control",b.proximoControl),b.advertencias&&d("⚠ Advertencias",b.advertencias),b.observaciones&&d("Observaciones",b.observaciones)].filter(Boolean).join(""),n=`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta — Dr/a. ${c.nombre} ${c.apellido}</title>
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

    /* ── Membrete ─────────────────────── */
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

    /* ── Datos del turno ────────────────── */
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

    /* ── Separador ──────────────────────── */
    .sep {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0 0 18px 0;
    }

    /* ── T\xedtulo principal ───────────────── */
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

    /* ── Secciones ──────────────────────── */
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

    /* ── Pie de p\xe1gina ──────────────────── */
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
    .footer-emisi\xf3n {
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

    /* ── Bot\xf3n imprimir (solo pantalla) ── */
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
      ${l}
      <div>
        <div class="prof-nombre">Dr/a. ${c.nombre} ${c.apellido}</div>
        <div class="prof-esp">${c.especialidad}</div>
        ${c.matricula?`<div class="prof-mat">Mat. ${c.matricula}</div>`:""}
      </div>
    </div>
    <div class="membrete-der">
      <div class="logo-wrap">
        ${k}
        <span class="logo-text">MediSync</span>
      </div>
      ${c.lugarAtencion?`<strong>${c.lugarAtencion}</strong>`:""}
      ${c.telefono?`Tel: ${c.telefono}`:""}
    </div>
  </div>

  <!-- Datos del turno -->
  <div class="datos-turno">
    <div class="datos-turno-col">
      <div class="dato-label">Paciente</div>
      <div class="dato-valor">${e?`${e.nombre} ${e.apellido}`:"Paciente sin cuenta"}</div>
    </div>
    <div class="datos-turno-col" style="text-align:center">
      <div class="dato-label">Fecha de consulta</div>
      <div class="dato-valor">${h}, ${i} h</div>
    </div>
    <div class="datos-turno-col" style="text-align:right">
      <div class="dato-label">Modalidad</div>
      <span class="badge-modalidad">${"VIRTUAL"===g?"Virtual":"Presencial"}</span>
    </div>
  </div>

  <hr class="sep">

  <!-- T\xedtulo -->
  <div class="titulo-receta">Receta e Indicaciones M\xe9dicas</div>

  <!-- Secciones de la receta -->
  ${m}

  <!-- Pie de p\xe1gina -->
  <div class="footer">
    <div class="footer-emisi\xf3n">
      Emitida el ${j}<br>
      Documento generado por MediSync
    </div>
    <div class="firma-wrap">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Dr/a. ${c.nombre} ${c.apellido}</div>
      ${c.matricula?`<div style="font-size:8pt;color:#64748b">Mat. ${c.matricula}</div>`:""}
    </div>
    <div class="footer-medisync">medisync.com.ar</div>
  </div>

</body>
</html>`,o=window.open("","_blank","width=900,height=750");o?(o.document.write(n),o.document.close(),setTimeout(()=>o.print(),600)):alert("Permitir ventanas emergentes para descargar el PDF.")}c.d(b,{a:()=>e})},19099:(a,b,c)=>{var d=c(54839);c.o(d,"useParams")&&c.d(b,{useParams:function(){return d.useParams}}),c.o(d,"useRouter")&&c.d(b,{useRouter:function(){return d.useRouter}}),c.o(d,"useSearchParams")&&c.d(b,{useSearchParams:function(){return d.useSearchParams}})},27288:(a,b,c)=>{c.d(b,{A:()=>g});var d=c(48249),e=c(67484),f=c(74429);function g({storageKey:a,steps:b,delay:c=900}){let[h,i]=(0,e.useState)(!1),[j,k]=(0,e.useState)(!1),[l,m]=(0,e.useState)(0),[n,o]=(0,e.useState)(null);(0,e.useCallback)(()=>{if(!j||l>=b.length)return;let a=document.querySelector(b[l].selector);a?o(a.getBoundingClientRect()):o(null)},[j,l,b]);let p=(0,e.useCallback)(()=>{localStorage.setItem(a,"1"),k(!1)},[a]),q=(0,e.useCallback)(()=>{l<b.length-1?m(a=>a+1):p()},[l,b.length,p]),r=(0,e.useCallback)(()=>{l>0&&m(a=>a-1)},[l]);if(!h||!j)return null;let s=b[l];if(!s)return null;let t=window.innerWidth,u=window.innerHeight,v=n?{x:Math.max(0,n.left-10),y:Math.max(0,n.top-10),w:Math.min(t,n.width+20),h:n.height+20,rx:10}:{x:t/2-100,y:u/2-40,w:200,h:80,rx:10},w=Math.min(320,t-32),x=s.position??"bottom",y=v.x+v.w/2-w/2,z=v.y+v.h+14;"top"===x?z=v.y-190:"right"===x?(y=v.x+v.w+14,z=v.y):"left"===x?(y=v.x-w-14,z=v.y):"center"===x&&(y=t/2-w/2,z=u/2-90),y=Math.max(8,Math.min(y,t-w-8)),z=Math.max(8,Math.min(z,u-220));let A=l===b.length-1,B=(0,d.jsxs)("div",{className:"fixed inset-0 z-[9999]","aria-modal":"true",role:"dialog","aria-label":"Tour de introducci\xf3n",children:[(0,d.jsxs)("svg",{className:"pointer-events-none",style:{position:"fixed",inset:0,width:"100%",height:"100%"},"aria-hidden":"true",children:[(0,d.jsx)("defs",{children:(0,d.jsxs)("mask",{id:"ms-tour-mask",children:[(0,d.jsx)("rect",{fill:"white",x:"0",y:"0",width:"100%",height:"100%"}),(0,d.jsx)("rect",{fill:"black",x:v.x,y:v.y,width:v.w,height:v.h,rx:v.rx})]})}),(0,d.jsx)("rect",{fill:"rgba(15,23,42,0.72)",x:"0",y:"0",width:"100%",height:"100%",mask:"url(#ms-tour-mask)"}),(0,d.jsx)("rect",{fill:"none",stroke:"#3b82f6",strokeWidth:"2.5",x:v.x,y:v.y,width:v.w,height:v.h,rx:v.rx,opacity:"0.9"})]}),(0,d.jsx)("div",{className:"fixed inset-0",style:{zIndex:-1},onClick:p,"aria-hidden":"true"}),(0,d.jsxs)("div",{role:"document",className:"fixed bg-white rounded-2xl shadow-2xl",style:{left:y,top:z,width:w,zIndex:1},children:[(0,d.jsxs)("div",{className:"bg-blue-600 rounded-t-2xl px-5 py-3 flex items-center justify-between",children:[(0,d.jsx)("div",{className:"flex gap-1",children:b.map((a,b)=>(0,d.jsx)("div",{className:"h-1.5 rounded-full transition-all duration-300",style:{width:b===l?20:6,backgroundColor:b<=l?"white":"rgba(255,255,255,0.3)"}},b))}),(0,d.jsx)("button",{onClick:p,className:"text-blue-100 hover:text-white text-xs font-medium transition-colors","aria-label":"Cerrar tour",children:"Saltar tour \xd7"})]}),(0,d.jsxs)("div",{className:"px-5 py-4",children:[(0,d.jsxs)("p",{className:"text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1",children:["Paso ",l+1," de ",b.length]}),(0,d.jsx)("h3",{className:"font-bold text-slate-800 text-base mb-2 leading-snug",children:s.title}),(0,d.jsx)("p",{className:"text-sm text-slate-500 leading-relaxed",children:s.description})]}),(0,d.jsxs)("div",{className:"px-5 pb-4 flex items-center justify-between gap-3",children:[(0,d.jsx)("button",{onClick:r,disabled:0===l,className:`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${0===l?"invisible":"text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,children:"← Anterior"}),(0,d.jsx)("button",{onClick:q,className:`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${A?"bg-emerald-600 hover:bg-emerald-700":"bg-blue-600 hover:bg-blue-700"}`,children:A?"\xa1Entendido!":"Siguiente →"})]})]})]});return(0,f.createPortal)(B,document.body)}},29186:(a,b,c)=>{c.d(b,{r:()=>k});var d=c(48249),e=c(67484),f=c(91239),g=c(30564);let h={TURNO_RESERVADO:"\uD83D\uDCC5",TURNO_CONFIRMADO:"✅",TURNO_CANCELADO:"❌",RECETA_EMITIDA:"\uD83D\uDC8A"};function i({notif:a,onRead:b}){let c=h[a.tipo]??"\uD83D\uDD14";return(0,d.jsxs)("div",{className:`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!a.leida?"bg-blue-50/60 dark:bg-blue-900/20":""}`,onClick:()=>{a.leida||b(a.id),a.link&&(window.location.href=a.link)},children:[(0,d.jsx)("span",{className:"text-xl mt-0.5 shrink-0",children:c}),(0,d.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,d.jsxs)("div",{className:"flex items-start justify-between gap-2",children:[(0,d.jsx)("p",{className:`text-sm font-medium text-slate-800 dark:text-slate-100 ${!a.leida?"font-semibold":""}`,children:a.titulo}),(0,d.jsx)("span",{className:"text-[11px] text-slate-400 dark:text-slate-500 shrink-0",children:function(a){let b=Math.floor((Date.now()-new Date(a).getTime())/6e4);if(b<1)return"ahora";if(b<60)return`hace ${b} min`;let c=Math.floor(b/60);if(c<24)return`hace ${c} h`;let d=Math.floor(c/24);return`hace ${d} d`}(a.createdAt)})]}),(0,d.jsx)("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2",children:a.cuerpo})]}),!a.leida&&(0,d.jsx)("span",{className:"w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"})]})}function j({onClose:a}){let{notifications:b,unread:c,markRead:e,markAllRead:h}=(0,f.E)(),{t:k}=(0,g.u)();return k("common"),(0,d.jsxs)("div",{className:"absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden",children:[(0,d.jsxs)("div",{className:"flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700",children:[(0,d.jsxs)("div",{className:"flex items-center gap-2",children:[(0,d.jsx)("span",{className:"text-sm font-semibold text-slate-800 dark:text-slate-100",children:"Notificaciones"}),c>0&&(0,d.jsx)("span",{className:"px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full",children:c})]}),c>0&&(0,d.jsx)("button",{onClick:()=>h(),className:"text-xs text-blue-600 dark:text-blue-400 hover:underline",children:"Marcar todas le\xeddas"})]}),(0,d.jsx)("div",{className:"max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700",children:0===b.length?(0,d.jsx)("p",{className:"px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500",children:"Sin notificaciones"}):b.map(a=>(0,d.jsx)(i,{notif:a,onRead:e},a.id))})]})}function k(){let{unread:a}=(0,f.E)(),[b,c]=(0,e.useState)(!1),g=(0,e.useRef)(null);return(0,d.jsxs)("div",{ref:g,className:"relative",children:[(0,d.jsxs)("button",{onClick:()=>c(a=>!a),className:"relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors","aria-label":"Notificaciones",children:[(0,d.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.8,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"})}),a>0&&(0,d.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none",children:a>9?"9+":a})]}),b&&(0,d.jsx)(j,{onClose:()=>c(!1)})]})}},57818:(a,b,c)=>{c.d(b,{A:()=>g});var d=c(48249),e=c(38099),f=c(30564);function g({compact:a=!1}){let{theme:b,toggleTheme:c}=(0,e.D)(),{lang:h,setLang:i,t:j}=(0,f.u)();return j("common"),(0,d.jsxs)("div",{className:"flex items-center gap-1",children:[(0,d.jsxs)("button",{onClick:()=>i("es"===h?"en":"es"),title:"es"===h?"Switch to English":"Cambiar a Espa\xf1ol",className:"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",children:[(0,d.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"})}),!a&&(0,d.jsx)("span",{children:"es"===h?"EN":"ES"}),a&&(0,d.jsx)("span",{children:"es"===h?"EN":"ES"})]}),(0,d.jsxs)("button",{onClick:c,title:"light"===b?"Modo oscuro":"Modo claro",className:"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",children:["light"===b?(0,d.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"})}):(0,d.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"})}),!a&&(0,d.jsx)("span",{className:"hidden sm:inline",children:"light"===b?"\uD83C\uDF19":"☀️"})]})]})}},73995:(a,b,c)=>{c.d(b,{A:()=>h});var d=c(48249),e=c(67484),f=c(58306);let g=[{value:"NO_ESPECIFICADO",label:"Prefiero no decirlo"},{value:"MASCULINO",label:"Masculino"},{value:"FEMENINO",label:"Femenino"},{value:"OTRO",label:"Otro"}];function h({isOpen:a,onClose:b,userType:c,user:i,onUpdate:j}){let[k,l]=(0,e.useState)(!1),[m,n]=(0,e.useState)(""),[o,p]=(0,e.useState)(""),[q,r]=(0,e.useState)(null),[s,t]=(0,e.useState)(!1),[u,v]=(0,e.useState)(""),[w,x]=(0,e.useState)(!1),[y,z]=(0,e.useState)({nombre:"",apellido:"",telefono:"",genero:"NO_ESPECIFICADO",precioConsulta:"",lugarAtencion:"",bio:"",fechaNacimiento:"",dni:"",obraSocial:"",fotoUrl:""}),A=async()=>{if(q){t(!0),v("");try{await f.FH.notifications.updatePreferences(q),v("Preferencias guardadas")}catch{v("Error al guardar preferencias")}finally{t(!1)}}},B=async a=>{x(!0),v("");try{await f.FH.notifications.sendTest(a),v(`Prueba de ${"EMAIL"===a?"email":"WhatsApp"} enviada`)}catch{v("Error al enviar notificaci\xf3n de prueba")}finally{x(!1)}},C=a=>{z({...y,[a.target.name]:a.target.value})},D=async a=>{let d,e;if(a.preventDefault(),l(!0),n(""),p(""),y.telefono&&(d=y.telefono,!/^[\d\s\-\+\(\)]{8,20}$/.test(d))){n("El tel\xe9fono debe tener entre 8 y 20 caracteres (solo n\xfameros, espacios, +, - y par\xe9ntesis)"),l(!1);return}if("paciente"===c&&y.dni&&(e=y.dni,!/^\d{7,8}$/.test(e))){n("El DNI debe tener entre 7 y 8 d\xedgitos num\xe9ricos"),l(!1);return}if(y.fechaNacimiento&&new Date(y.fechaNacimiento)>new Date){n("La fecha de nacimiento no puede ser futura"),l(!1);return}try{"profesional"===c&&i.profesional?await f.FH.profesional.updatePerfil(i.profesional.id,{nombre:y.nombre,apellido:y.apellido,telefono:y.telefono||"",genero:y.genero,precioConsulta:y.precioConsulta?Number(y.precioConsulta):void 0,lugarAtencion:y.lugarAtencion||void 0,bio:y.bio||void 0,fotoUrl:y.fotoUrl||void 0}):"paciente"===c&&i.paciente&&await f.FH.pacientes.updatePerfil({nombre:y.nombre,apellido:y.apellido,telefono:y.telefono||void 0,genero:y.genero,fechaNacimiento:y.fechaNacimiento||void 0,dni:y.dni||void 0,obraSocial:y.obraSocial||void 0,fotoUrl:y.fotoUrl||void 0}),p("\xa1Perfil actualizado correctamente!"),setTimeout(()=>{b(),j&&j(),window.location.reload()},1500)}catch(a){n(a instanceof Error?a.message:"Error al guardar")}finally{l(!1)}};return a?(0,d.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",children:(0,d.jsxs)("div",{className:"bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto",children:[(0,d.jsxs)("div",{className:"sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center",children:[(0,d.jsx)("h2",{className:"text-xl font-bold text-gray-900",children:"Editar Perfil"}),(0,d.jsx)("button",{onClick:b,className:"text-gray-400 hover:text-gray-600 text-2xl leading-none",children:"\xd7"})]}),(0,d.jsxs)("form",{onSubmit:D,className:"p-6 space-y-4",children:[m&&(0,d.jsx)("div",{className:"bg-red-50 text-red-600 p-3 rounded-md text-sm",children:m}),o&&(0,d.jsx)("div",{className:"bg-green-50 text-green-600 p-3 rounded-md text-sm",children:o}),(0,d.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nombre"}),(0,d.jsx)("input",{type:"text",name:"nombre",value:y.nombre,onChange:C,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Apellido"}),(0,d.jsx)("input",{type:"text",name:"apellido",value:y.apellido,onChange:C,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"G\xe9nero"}),(0,d.jsx)("select",{name:"genero",value:y.genero,onChange:C,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",children:g.map(a=>(0,d.jsx)("option",{value:a.value,children:a.label},a.value))})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Tel\xe9fono"}),(0,d.jsx)("input",{type:"tel",name:"telefono",value:y.telefono,onChange:C,pattern:"[\\d\\s\\-\\+\\(\\)]{8,20}",title:"Solo n\xfameros, espacios, +, - y par\xe9ntesis (8-20 caracteres)",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"+54 11 1234 5678"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"URL de Foto de Perfil"}),(0,d.jsx)("input",{type:"url",name:"fotoUrl",value:y.fotoUrl,onChange:C,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"https://ejemplo.com/foto.jpg"})]}),"profesional"===c&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Precio de Consulta ($)"}),(0,d.jsx)("input",{type:"number",name:"precioConsulta",value:y.precioConsulta,onChange:C,min:"0",max:"999999",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"5000"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Lugar de Atenci\xf3n"}),(0,d.jsx)("input",{type:"text",name:"lugarAtencion",value:y.lugarAtencion,onChange:C,maxLength:200,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Direcci\xf3n del consultorio"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Biograf\xeda"}),(0,d.jsx)("textarea",{name:"bio",value:y.bio,onChange:C,rows:3,maxLength:500,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Breve descripci\xf3n profesional..."})]})]}),"paciente"===c&&(0,d.jsxs)(d.Fragment,{children:[(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Fecha de Nacimiento"}),(0,d.jsx)("input",{type:"date",name:"fechaNacimiento",value:y.fechaNacimiento,onChange:C,max:new Date().toISOString().split("T")[0],className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"DNI"}),(0,d.jsx)("input",{type:"text",name:"dni",value:y.dni,onChange:C,pattern:"\\d{7,8}",title:"7 u 8 d\xedgitos num\xe9ricos",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"12345678"})]}),(0,d.jsxs)("div",{children:[(0,d.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Obra Social"}),(0,d.jsx)("input",{type:"text",name:"obraSocial",value:y.obraSocial,onChange:C,maxLength:100,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Nombre de obra social (opcional)"})]})]}),q&&(0,d.jsxs)("div",{className:"pt-4 border-t border-gray-200",children:[(0,d.jsx)("h3",{className:"text-sm font-semibold text-gray-700 mb-3",children:"Notificaciones"}),(0,d.jsx)("div",{className:"space-y-3",children:[{field:"notifEmail",label:"Notificaciones por email"},{field:"notifWhatsapp",label:"Notificaciones por WhatsApp"},..."paciente"===c?[{field:"aceptaRecordatorios",label:"Aceptar recordatorios de turnos"},{field:"notifRecordatorio24h",label:"Recordatorio 24 horas antes"},{field:"notifRecordatorio2h",label:"Recordatorio 2 horas antes"}]:[]].map(({field:a,label:b})=>void 0!==q[a]?(0,d.jsxs)("label",{className:"flex items-center justify-between cursor-pointer select-none",children:[(0,d.jsx)("span",{className:"text-sm text-gray-600",children:b}),(0,d.jsx)("button",{type:"button",role:"switch","aria-checked":!!q[a],onClick:()=>{q&&r({...q,[a]:!q[a]})},className:`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${q[a]?"bg-blue-600":"bg-gray-300"}`,children:(0,d.jsx)("span",{className:`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${q[a]?"translate-x-6":"translate-x-1"}`})})]},a):null)}),u&&(0,d.jsx)("p",{className:`mt-2 text-xs ${u.startsWith("Error")?"text-red-500":"text-emerald-600"}`,children:u}),(0,d.jsxs)("div",{className:"mt-3 flex gap-2",children:[(0,d.jsx)("button",{type:"button",onClick:A,disabled:s,className:"flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50",children:s?"Guardando...":"Guardar preferencias"}),(0,d.jsx)("button",{type:"button",onClick:()=>B("EMAIL"),disabled:w,title:"Enviar email de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"✉️"}),(0,d.jsx)("button",{type:"button",onClick:()=>B("WHATSAPP"),disabled:w,title:"Enviar WhatsApp de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"\uD83D\uDCAC"})]})]}),(0,d.jsxs)("div",{className:"pt-4 flex gap-3",children:[(0,d.jsx)("button",{type:"button",onClick:b,className:"flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50",children:"Cancelar"}),(0,d.jsx)("button",{type:"submit",disabled:k,className:"flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",children:k?"Guardando...":"Guardar Cambios"})]})]})]})}):null}},79881:(a,b,c)=>{c.d(b,{A:()=>g});var d=c(48249),e=c(67484);c(58306);var f=c(30564);function g({turnoId:a,profesionalNombre:b,fechaHora:c,onClose:h}){let{t:i}=(0,f.u)(),j=i("videoCall"),[k,l]=(0,e.useState)("loading"),[m,n]=(0,e.useState)(null),[o,p]=(0,e.useState)(""),q=(0,e.useRef)(null);(0,e.useRef)(null);let r=new Date(c).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"});return(0,d.jsxs)("div",{className:"fixed inset-0 z-50 flex flex-col bg-slate-900",children:[(0,d.jsxs)("div",{className:"flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0",children:[(0,d.jsxs)("div",{className:"flex items-center gap-3",children:[(0,d.jsx)("div",{className:`w-2 h-2 rounded-full ${"ready"===k?"bg-emerald-400 animate-pulse":"bg-slate-500"}`}),(0,d.jsxs)("span",{className:"text-white font-medium text-sm",children:[j.title," — ",b]}),(0,d.jsx)("span",{className:"text-slate-400 text-xs",children:r})]}),(0,d.jsxs)("div",{className:"flex items-center gap-2",children:[m&&"error"!==k&&(0,d.jsx)("a",{href:m,target:"_blank",rel:"noopener noreferrer",className:"text-slate-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors",children:j.openTab}),(0,d.jsxs)("button",{onClick:h,className:"flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors",children:[(0,d.jsx)("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})}),j.leave]})]})]}),(0,d.jsxs)("div",{className:"flex-1 relative",children:["loading"===k&&(0,d.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-10 pointer-events-none",children:[(0,d.jsxs)("svg",{className:"w-8 h-8 animate-spin",fill:"none",viewBox:"0 0 24 24",children:[(0,d.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,d.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]}),(0,d.jsx)("span",{className:"text-sm",children:j.connecting})]}),"error"===k&&(0,d.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6 z-10",children:[(0,d.jsx)("div",{className:"w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center",children:(0,d.jsx)("svg",{className:"w-8 h-8 text-red-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,d.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"})})}),(0,d.jsxs)("div",{children:[(0,d.jsx)("p",{className:"text-white font-medium mb-1",children:j.errorTitle}),(0,d.jsx)("p",{className:"text-slate-400 text-sm mb-3",children:o}),m&&(0,d.jsx)("a",{href:m,target:"_blank",rel:"noopener noreferrer",className:"inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors",children:j.joinBrowser})]}),(0,d.jsx)("button",{onClick:h,className:"text-slate-400 hover:text-white text-sm transition-colors",children:j.close})]}),(0,d.jsx)("div",{ref:q,className:"w-full h-full"})]})]})}},97983:(a,b,c)=>{c.d(b,{A6:()=>z,Au:()=>o,BF:()=>v,CT:()=>g,Es:()=>A,Kx:()=>l,O4:()=>h,Sr:()=>q,Tb:()=>t,WI:()=>x,XF:()=>k,ai:()=>s,e:()=>f,fN:()=>w,hw:()=>y,mo:()=>u,np:()=>r,ny:()=>i,uV:()=>j,uc:()=>m,ui:()=>n,uv:()=>p});var d=c(48249);function e(a,b="0 0 24 24"){return function({size:c=16,className:e=""}){return(0,d.jsx)("svg",{width:c,height:c,viewBox:b,fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,"aria-hidden":"true",children:a})}}function f({size:a=28,className:b=""}){return(0,d.jsxs)("svg",{width:a,height:a,viewBox:"0 0 32 32",fill:"none",className:b,"aria-hidden":"true",children:[(0,d.jsx)("rect",{width:"32",height:"32",rx:"8",fill:"#2563EB"}),(0,d.jsx)("path",{d:"M9 16h14M16 9v14",stroke:"white",strokeWidth:"3",strokeLinecap:"round"}),(0,d.jsx)("circle",{cx:"16",cy:"16",r:"5",stroke:"white",strokeWidth:"1.5"})]})}let g=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,d.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,d.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,d.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})),h=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,d.jsx)("polyline",{points:"12 6 12 12 16 14"})]})),i=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),(0,d.jsx)("circle",{cx:"12",cy:"7",r:"4"})]})),j=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),(0,d.jsx)("polyline",{points:"16 17 21 12 16 7"}),(0,d.jsx)("line",{x1:"21",y1:"12",x2:"9",y2:"12"})]})),k=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),(0,d.jsx)("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]})),l=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),(0,d.jsx)("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),(0,d.jsx)("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]})),m=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("polyline",{points:"3 6 5 6 21 6"}),(0,d.jsx)("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]})),n=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}),(0,d.jsx)("rect",{x:"8",y:"2",width:"8",height:"4",rx:"1"}),(0,d.jsx)("line",{x1:"9",y1:"12",x2:"15",y2:"12"}),(0,d.jsx)("line",{x1:"9",y1:"16",x2:"13",y2:"16"})]})),o=e((0,d.jsx)("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})),p=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),(0,d.jsx)("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})),q=e((0,d.jsx)("polyline",{points:"20 6 9 17 4 12"})),r=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("polygon",{points:"23 7 16 12 23 17 23 7"}),(0,d.jsx)("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2"})]})),s=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("rect",{x:"3",y:"3",width:"18",height:"18",rx:"1"}),(0,d.jsx)("path",{d:"M3 9h18"}),(0,d.jsx)("path",{d:"M9 21V9"})]})),t=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,d.jsx)("circle",{cx:"12",cy:"10",r:"3"})]})),u=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,d.jsx)("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),(0,d.jsx)("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})),v=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("rect",{x:"1",y:"4",width:"22",height:"16",rx:"2"}),(0,d.jsx)("line",{x1:"1",y1:"10",x2:"23",y2:"10"})]})),w=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("polyline",{points:"23 4 23 10 17 10"}),(0,d.jsx)("polyline",{points:"1 20 1 14 7 14"}),(0,d.jsx)("path",{d:"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"})]})),x=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("circle",{cx:"11",cy:"11",r:"8"}),(0,d.jsx)("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}));function y({size:a=16,className:b=""}){return(0,d.jsxs)("svg",{width:a,height:a,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:b,"aria-hidden":"true",children:[(0,d.jsx)("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),(0,d.jsx)("circle",{cx:"9",cy:"7",r:"4"}),(0,d.jsx)("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),(0,d.jsx)("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}let z=e((0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),(0,d.jsx)("polyline",{points:"12 19 5 12 12 5"})]})),A=e((0,d.jsx)("path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"}));e((0,d.jsx)("polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"}))}};