"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[50],{24953:(e,t,r)=>{r.d(t,{A:()=>s});var a=r(95155),i=r(12115),o=r(8776),n=r(10333);function s({turnoId:e,profesionalNombre:t,fechaHora:r,onClose:l}){let{t:d}=(0,n.u)(),c=d("videoCall"),[x,m]=(0,i.useState)("loading"),[u,p]=(0,i.useState)(null),[h,f]=(0,i.useState)(""),b=(0,i.useRef)(null),g=(0,i.useRef)(null),v=new Date(r).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"});return(0,i.useEffect)(()=>{o.FH.turnos.getVideoToken(e).then(e=>{p(e.joinUrl)}).catch(e=>{f(e.message??c.errorLink),m("error")})},[e]),(0,i.useEffect)(()=>{if(!u||!b.current)return;let e="meet.jit.si",t="";try{let r=new URL(u);e=r.hostname,t=r.pathname.replace(/^\//,"")}catch{t=u.split("/").pop()??""}function r(){let r=window.JitsiMeetExternalAPI;r&&b.current&&(g.current=new r(e,{roomName:t,parentNode:b.current,width:"100%",height:"100%",configOverwrite:{startWithAudioMuted:!1,startWithVideoMuted:!1,disableDeepLinking:!0},interfaceConfigOverwrite:{SHOW_JITSI_WATERMARK:!1,SHOW_WATERMARK_FOR_GUESTS:!1,TOOLBAR_BUTTONS:["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","chat","settings","raisehand","videoquality","tileview"]}}),g.current.addEventListener("videoConferenceLeft",()=>{l()}),m("ready"))}if(window.JitsiMeetExternalAPI)return void r();let a=document.getElementById("jitsi-api-script");if(a)return void a.addEventListener("load",r);let i=document.createElement("script");return i.id="jitsi-api-script",i.src=`https://${e}/external_api.js`,i.async=!0,i.onload=r,i.onerror=()=>{f(c.errorLoad),m("error")},document.head.appendChild(i),()=>{g.current&&(g.current.dispose(),g.current=null)}},[u,l]),(0,a.jsxs)("div",{className:"fixed inset-0 z-50 flex flex-col bg-slate-900",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 flex-shrink-0",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3",children:[(0,a.jsx)("div",{className:`w-2 h-2 rounded-full ${"ready"===x?"bg-emerald-400 animate-pulse":"bg-slate-500"}`}),(0,a.jsxs)("span",{className:"text-white font-medium text-sm",children:[c.title," — ",t]}),(0,a.jsx)("span",{className:"text-slate-400 text-xs",children:v})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[u&&"error"!==x&&(0,a.jsx)("a",{href:u,target:"_blank",rel:"noopener noreferrer",className:"text-slate-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors",children:c.openTab}),(0,a.jsxs)("button",{onClick:l,className:"flex items-center gap-1.5 text-slate-300 hover:text-white text-sm px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors",children:[(0,a.jsx)("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})}),c.leave]})]})]}),(0,a.jsxs)("div",{className:"flex-1 relative",children:["loading"===x&&(0,a.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-10 pointer-events-none",children:[(0,a.jsxs)("svg",{className:"w-8 h-8 animate-spin",fill:"none",viewBox:"0 0 24 24",children:[(0,a.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,a.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]}),(0,a.jsx)("span",{className:"text-sm",children:c.connecting})]}),"error"===x&&(0,a.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6 z-10",children:[(0,a.jsx)("div",{className:"w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center",children:(0,a.jsx)("svg",{className:"w-8 h-8 text-red-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"})})}),(0,a.jsxs)("div",{children:[(0,a.jsx)("p",{className:"text-white font-medium mb-1",children:c.errorTitle}),(0,a.jsx)("p",{className:"text-slate-400 text-sm mb-3",children:h}),u&&(0,a.jsx)("a",{href:u,target:"_blank",rel:"noopener noreferrer",className:"inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors",children:c.joinBrowser})]}),(0,a.jsx)("button",{onClick:l,className:"text-slate-400 hover:text-white text-sm transition-colors",children:c.close})]}),(0,a.jsx)("div",{ref:b,className:"w-full h-full"})]})]})}},45511:(e,t,r)=>{r.d(t,{r:()=>c});var a=r(95155),i=r(12115),o=r(72209),n=r(10333);let s={TURNO_RESERVADO:"\uD83D\uDCC5",TURNO_CONFIRMADO:"✅",TURNO_CANCELADO:"❌",RECETA_EMITIDA:"\uD83D\uDC8A"};function l({notif:e,onRead:t}){let r=s[e.tipo]??"\uD83D\uDD14";return(0,a.jsxs)("div",{className:`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!e.leida?"bg-blue-50/60 dark:bg-blue-900/20":""}`,onClick:()=>{e.leida||t(e.id),e.link&&(window.location.href=e.link)},children:[(0,a.jsx)("span",{className:"text-xl mt-0.5 shrink-0",children:r}),(0,a.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,a.jsxs)("div",{className:"flex items-start justify-between gap-2",children:[(0,a.jsx)("p",{className:`text-sm font-medium text-slate-800 dark:text-slate-100 ${!e.leida?"font-semibold":""}`,children:e.titulo}),(0,a.jsx)("span",{className:"text-[11px] text-slate-400 dark:text-slate-500 shrink-0",children:function(e){let t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"ahora";if(t<60)return`hace ${t} min`;let r=Math.floor(t/60);if(r<24)return`hace ${r} h`;let a=Math.floor(r/24);return`hace ${a} d`}(e.createdAt)})]}),(0,a.jsx)("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2",children:e.cuerpo})]}),!e.leida&&(0,a.jsx)("span",{className:"w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"})]})}function d({onClose:e}){let{notifications:t,unread:r,markRead:i,markAllRead:s}=(0,o.E)(),{t:c}=(0,n.u)();return c("common"),(0,a.jsxs)("div",{className:"absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden",children:[(0,a.jsxs)("div",{className:"flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700",children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsx)("span",{className:"text-sm font-semibold text-slate-800 dark:text-slate-100",children:"Notificaciones"}),r>0&&(0,a.jsx)("span",{className:"px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full",children:r})]}),r>0&&(0,a.jsx)("button",{onClick:()=>s(),className:"text-xs text-blue-600 dark:text-blue-400 hover:underline",children:"Marcar todas le\xeddas"})]}),(0,a.jsx)("div",{className:"max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700",children:0===t.length?(0,a.jsx)("p",{className:"px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500",children:"Sin notificaciones"}):t.map(e=>(0,a.jsx)(l,{notif:e,onRead:i},e.id))})]})}function c(){let{unread:e}=(0,o.E)(),[t,r]=(0,i.useState)(!1),n=(0,i.useRef)(null);return(0,i.useEffect)(()=>{function e(e){n.current&&!n.current.contains(e.target)&&r(!1)}return t&&document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[t]),(0,a.jsxs)("div",{ref:n,className:"relative",children:[(0,a.jsxs)("button",{onClick:()=>r(e=>!e),className:"relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors","aria-label":"Notificaciones",children:[(0,a.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.8,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"})}),e>0&&(0,a.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none",children:e>9?"9+":e})]}),t&&(0,a.jsx)(d,{onClose:()=>r(!1)})]})}},49284:(e,t,r)=>{r.d(t,{A:()=>n});var a=r(95155),i=r(12115),o=r(47650);function n({storageKey:e,steps:t,delay:r=900}){let[s,l]=(0,i.useState)(!1),[d,c]=(0,i.useState)(!1),[x,m]=(0,i.useState)(0),[u,p]=(0,i.useState)(null);(0,i.useEffect)(()=>{l(!0)},[]),(0,i.useEffect)(()=>{if(s&&!localStorage.getItem(e)){let e=setTimeout(()=>c(!0),r);return()=>clearTimeout(e)}},[s,e,r]);let h=(0,i.useCallback)(()=>{if(!d||x>=t.length)return;let e=document.querySelector(t[x].selector);e?p(e.getBoundingClientRect()):p(null)},[d,x,t]);(0,i.useEffect)(()=>{if(!d)return;let e=t[x],r=e?document.querySelector(e.selector):null;if(r){r.scrollIntoView({behavior:"smooth",block:"center"});let e=setTimeout(h,350);return()=>clearTimeout(e)}p(null)},[d,x]),(0,i.useEffect)(()=>{if(d)return h(),window.addEventListener("resize",h),window.addEventListener("scroll",h,!0),()=>{window.removeEventListener("resize",h),window.removeEventListener("scroll",h,!0)}},[d,h]);let f=(0,i.useCallback)(()=>{localStorage.setItem(e,"1"),c(!1)},[e]),b=(0,i.useCallback)(()=>{x<t.length-1?m(e=>e+1):f()},[x,t.length,f]),g=(0,i.useCallback)(()=>{x>0&&m(e=>e-1)},[x]);if(!s||!d)return null;let v=t[x];if(!v)return null;let y=window.innerWidth,j=window.innerHeight,w=u?{x:Math.max(0,u.left-10),y:Math.max(0,u.top-10),w:Math.min(y,u.width+20),h:u.height+20,rx:10}:{x:y/2-100,y:j/2-40,w:200,h:80,rx:10},k=Math.min(320,y-32),N=v.position??"bottom",C=w.x+w.w/2-k/2,E=w.y+w.h+14;"top"===N?E=w.y-190:"right"===N?(C=w.x+w.w+14,E=w.y):"left"===N?(C=w.x-k-14,E=w.y):"center"===N&&(C=y/2-k/2,E=j/2-90),C=Math.max(8,Math.min(C,y-k-8)),E=Math.max(8,Math.min(E,j-220));let S=x===t.length-1,A=(0,a.jsxs)("div",{className:"fixed inset-0 z-[9999]","aria-modal":"true",role:"dialog","aria-label":"Tour de introducci\xf3n",children:[(0,a.jsxs)("svg",{className:"pointer-events-none",style:{position:"fixed",inset:0,width:"100%",height:"100%"},"aria-hidden":"true",children:[(0,a.jsx)("defs",{children:(0,a.jsxs)("mask",{id:"ms-tour-mask",children:[(0,a.jsx)("rect",{fill:"white",x:"0",y:"0",width:"100%",height:"100%"}),(0,a.jsx)("rect",{fill:"black",x:w.x,y:w.y,width:w.w,height:w.h,rx:w.rx})]})}),(0,a.jsx)("rect",{fill:"rgba(15,23,42,0.72)",x:"0",y:"0",width:"100%",height:"100%",mask:"url(#ms-tour-mask)"}),(0,a.jsx)("rect",{fill:"none",stroke:"#3b82f6",strokeWidth:"2.5",x:w.x,y:w.y,width:w.w,height:w.h,rx:w.rx,opacity:"0.9"})]}),(0,a.jsx)("div",{className:"fixed inset-0",style:{zIndex:-1},onClick:f,"aria-hidden":"true"}),(0,a.jsxs)("div",{role:"document",className:"fixed bg-white rounded-2xl shadow-2xl",style:{left:C,top:E,width:k,zIndex:1},children:[(0,a.jsxs)("div",{className:"bg-blue-600 rounded-t-2xl px-5 py-3 flex items-center justify-between",children:[(0,a.jsx)("div",{className:"flex gap-1",children:t.map((e,t)=>(0,a.jsx)("div",{className:"h-1.5 rounded-full transition-all duration-300",style:{width:t===x?20:6,backgroundColor:t<=x?"white":"rgba(255,255,255,0.3)"}},t))}),(0,a.jsx)("button",{onClick:f,className:"text-blue-100 hover:text-white text-xs font-medium transition-colors","aria-label":"Cerrar tour",children:"Saltar tour \xd7"})]}),(0,a.jsxs)("div",{className:"px-5 py-4",children:[(0,a.jsxs)("p",{className:"text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1",children:["Paso ",x+1," de ",t.length]}),(0,a.jsx)("h3",{className:"font-bold text-slate-800 text-base mb-2 leading-snug",children:v.title}),(0,a.jsx)("p",{className:"text-sm text-slate-500 leading-relaxed",children:v.description})]}),(0,a.jsxs)("div",{className:"px-5 pb-4 flex items-center justify-between gap-3",children:[(0,a.jsx)("button",{onClick:g,disabled:0===x,className:`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${0===x?"invisible":"text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`,children:"← Anterior"}),(0,a.jsx)("button",{onClick:b,className:`px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm ${S?"bg-emerald-600 hover:bg-emerald-700":"bg-blue-600 hover:bg-blue-700"}`,children:S?"\xa1Entendido!":"Siguiente →"})]})]})]});return(0,o.createPortal)(A,document.body)}},50808:(e,t,r)=>{r.d(t,{A:()=>n});var a=r(95155),i=r(52159),o=r(10333);function n({compact:e=!1}){let{theme:t,toggleTheme:r}=(0,i.D)(),{lang:s,setLang:l,t:d}=(0,o.u)();return d("common"),(0,a.jsxs)("div",{className:"flex items-center gap-1",children:[(0,a.jsxs)("button",{onClick:()=>l("es"===s?"en":"es"),title:"es"===s?"Switch to English":"Cambiar a Espa\xf1ol",className:"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",children:[(0,a.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"})}),!e&&(0,a.jsx)("span",{children:"es"===s?"EN":"ES"}),e&&(0,a.jsx)("span",{children:"es"===s?"EN":"ES"})]}),(0,a.jsxs)("button",{onClick:r,title:"light"===t?"Modo oscuro":"Modo claro",className:"flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",children:["light"===t?(0,a.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"})}):(0,a.jsx)("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,a.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"})}),!e&&(0,a.jsx)("span",{className:"hidden sm:inline",children:"light"===t?"\uD83C\uDF19":"☀️"})]})]})}},63165:(e,t,r)=>{function a(e,t){return`
    <div class="seccion">
      <div class="seccion-titulo">${e}</div>
      <div class="seccion-cuerpo">${t.replace(/\n/g,"<br>")}</div>
    </div>`}function i(e){let{receta:t,profesional:r,paciente:i,fechaHora:o,modalidad:n}=e,s=new Date(o).toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),l=new Date(o).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),d=new Date(t.emitidaAt).toLocaleString("es-AR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),c=`
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`,x=r.fotoUrl?`<img src="${r.fotoUrl}" class="foto-prof" alt="Foto profesional" onerror="this.style.display='none'" />`:"",m=[t.diagnostico&&a("Diagn\xf3stico",t.diagnostico),t.planTratamiento&&a("Plan de tratamiento",t.planTratamiento),t.medicamentos&&a("Medicamentos",t.medicamentos),a("Indicaciones",t.indicaciones),t.estudiosSolicitados&&a("Estudios solicitados",t.estudiosSolicitados),t.proximoControl&&a("Pr\xf3ximo control",t.proximoControl),t.advertencias&&a("⚠ Advertencias",t.advertencias),t.observaciones&&a("Observaciones",t.observaciones)].filter(Boolean).join(""),u=`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta — Dr/a. ${r.nombre} ${r.apellido}</title>
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
      ${x}
      <div>
        <div class="prof-nombre">Dr/a. ${r.nombre} ${r.apellido}</div>
        <div class="prof-esp">${r.especialidad}</div>
        ${r.matricula?`<div class="prof-mat">Mat. ${r.matricula}</div>`:""}
      </div>
    </div>
    <div class="membrete-der">
      <div class="logo-wrap">
        ${c}
        <span class="logo-text">MediSync</span>
      </div>
      ${r.lugarAtencion?`<strong>${r.lugarAtencion}</strong>`:""}
      ${r.telefono?`Tel: ${r.telefono}`:""}
    </div>
  </div>

  <!-- Datos del turno -->
  <div class="datos-turno">
    <div class="datos-turno-col">
      <div class="dato-label">Paciente</div>
      <div class="dato-valor">${i?`${i.nombre} ${i.apellido}`:"Paciente sin cuenta"}</div>
    </div>
    <div class="datos-turno-col" style="text-align:center">
      <div class="dato-label">Fecha de consulta</div>
      <div class="dato-valor">${s}, ${l} h</div>
    </div>
    <div class="datos-turno-col" style="text-align:right">
      <div class="dato-label">Modalidad</div>
      <span class="badge-modalidad">${"VIRTUAL"===n?"Virtual":"Presencial"}</span>
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
      Emitida el ${d}<br>
      Documento generado por MediSync
    </div>
    <div class="firma-wrap">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Dr/a. ${r.nombre} ${r.apellido}</div>
      ${r.matricula?`<div style="font-size:8pt;color:#64748b">Mat. ${r.matricula}</div>`:""}
    </div>
    <div class="footer-medisync">medisync.com.ar</div>
  </div>

</body>
</html>`,p=window.open("","_blank","width=900,height=750");p?(p.document.write(u),p.document.close(),setTimeout(()=>p.print(),600)):alert("Permitir ventanas emergentes para descargar el PDF.")}r.d(t,{a:()=>i})},72209:(e,t,r)=>{r.d(t,{E:()=>l,NotificationProvider:()=>s});var a=r(95155),i=r(12115),o=r(8776);let n=(0,i.createContext)({notifications:[],unread:0,markRead:async()=>{},markAllRead:async()=>{}});function s({children:e}){let[t,r]=(0,i.useState)([]),[l,d]=(0,i.useState)(0),c=(0,i.useRef)(null),x=(0,i.useCallback)(async()=>{if(localStorage.getItem("token"))try{let e=await o.vx.getInbox();r(e.notifs),d(e.unread)}catch{}},[]);(0,i.useEffect)(()=>{x();let e=localStorage.getItem("token");if(!e)return;let t=new EventSource(`${o.tE}/notifications/stream?token=${encodeURIComponent(e)}`);return c.current=t,t.onmessage=e=>{try{let t=JSON.parse(e.data);r(e=>[t,...e]),d(e=>e+1)}catch{}},t.onerror=()=>{},()=>{t.close(),c.current=null}},[x]);let m=(0,i.useCallback)(async e=>{await o.vx.markRead(e),r(t=>t.map(t=>t.id===e?{...t,leida:!0}:t)),d(e=>Math.max(0,e-1))},[]),u=(0,i.useCallback)(async()=>{await o.vx.markAllRead(),r(e=>e.map(e=>({...e,leida:!0}))),d(0)},[]);return(0,a.jsx)(n.Provider,{value:{notifications:t,unread:l,markRead:m,markAllRead:u},children:e})}function l(){return(0,i.useContext)(n)}},79087:(e,t,r)=>{r.d(t,{A:()=>s});var a=r(95155),i=r(12115),o=r(8776);let n=[{value:"NO_ESPECIFICADO",label:"Prefiero no decirlo"},{value:"MASCULINO",label:"Masculino"},{value:"FEMENINO",label:"Femenino"},{value:"OTRO",label:"Otro"}];function s({isOpen:e,onClose:t,userType:r,user:l,onUpdate:d}){let[c,x]=(0,i.useState)(!1),[m,u]=(0,i.useState)(""),[p,h]=(0,i.useState)(""),[f,b]=(0,i.useState)(null),[g,v]=(0,i.useState)(!1),[y,j]=(0,i.useState)(""),[w,k]=(0,i.useState)(!1),[N,C]=(0,i.useState)({nombre:"",apellido:"",telefono:"",genero:"NO_ESPECIFICADO",precioConsulta:"",lugarAtencion:"",bio:"",fechaNacimiento:"",dni:"",obraSocial:"",fotoUrl:""});(0,i.useEffect)(()=>{e&&("profesional"===r&&l.profesional?C({nombre:l.profesional.nombre||"",apellido:l.profesional.apellido||"",telefono:l.profesional.telefono||"",genero:l.profesional.genero||"NO_ESPECIFICADO",precioConsulta:l.profesional.precioConsulta?.toString()||"",lugarAtencion:l.profesional.lugarAtencion||"",bio:l.profesional.bio||"",fechaNacimiento:"",dni:"",obraSocial:"",fotoUrl:l.profesional.fotoUrl||""}):"paciente"===r&&l.paciente&&C({nombre:l.paciente.nombre||"",apellido:l.paciente.apellido||"",telefono:l.paciente.telefono||"",genero:l.paciente.genero||"NO_ESPECIFICADO",precioConsulta:"",lugarAtencion:"",bio:"",fechaNacimiento:l.paciente.fechaNacimiento?l.paciente.fechaNacimiento.split("T")[0]:"",dni:l.paciente.dni||"",obraSocial:l.paciente.obraSocial||"",fotoUrl:l.paciente.fotoUrl||""}),u(""),h(""),j(""),o.FH.notifications.getPreferences().then(b).catch(()=>{}))},[e,r,l]);let E=async()=>{if(f){v(!0),j("");try{await o.FH.notifications.updatePreferences(f),j("Preferencias guardadas")}catch{j("Error al guardar preferencias")}finally{v(!1)}}},S=async e=>{k(!0),j("");try{await o.FH.notifications.sendTest(e),j(`Prueba de ${"EMAIL"===e?"email":"WhatsApp"} enviada`)}catch{j("Error al enviar notificaci\xf3n de prueba")}finally{k(!1)}},A=e=>{C({...N,[e.target.name]:e.target.value})},M=async e=>{let a,i;if(e.preventDefault(),x(!0),u(""),h(""),N.telefono&&(a=N.telefono,!/^[\d\s\-\+\(\)]{8,20}$/.test(a))){u("El tel\xe9fono debe tener entre 8 y 20 caracteres (solo n\xfameros, espacios, +, - y par\xe9ntesis)"),x(!1);return}if("paciente"===r&&N.dni&&(i=N.dni,!/^\d{7,8}$/.test(i))){u("El DNI debe tener entre 7 y 8 d\xedgitos num\xe9ricos"),x(!1);return}if(N.fechaNacimiento&&new Date(N.fechaNacimiento)>new Date){u("La fecha de nacimiento no puede ser futura"),x(!1);return}try{"profesional"===r&&l.profesional?await o.FH.profesional.updatePerfil(l.profesional.id,{nombre:N.nombre,apellido:N.apellido,telefono:N.telefono||"",genero:N.genero,precioConsulta:N.precioConsulta?Number(N.precioConsulta):void 0,lugarAtencion:N.lugarAtencion||void 0,bio:N.bio||void 0,fotoUrl:N.fotoUrl||void 0}):"paciente"===r&&l.paciente&&await o.FH.pacientes.updatePerfil({nombre:N.nombre,apellido:N.apellido,telefono:N.telefono||void 0,genero:N.genero,fechaNacimiento:N.fechaNacimiento||void 0,dni:N.dni||void 0,obraSocial:N.obraSocial||void 0,fotoUrl:N.fotoUrl||void 0}),h("\xa1Perfil actualizado correctamente!"),setTimeout(()=>{t(),d&&d(),window.location.reload()},1500)}catch(e){u(e instanceof Error?e.message:"Error al guardar")}finally{x(!1)}};return e?(0,a.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",children:(0,a.jsxs)("div",{className:"bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto",children:[(0,a.jsxs)("div",{className:"sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center",children:[(0,a.jsx)("h2",{className:"text-xl font-bold text-gray-900",children:"Editar Perfil"}),(0,a.jsx)("button",{onClick:t,className:"text-gray-400 hover:text-gray-600 text-2xl leading-none",children:"\xd7"})]}),(0,a.jsxs)("form",{onSubmit:M,className:"p-6 space-y-4",children:[m&&(0,a.jsx)("div",{className:"bg-red-50 text-red-600 p-3 rounded-md text-sm",children:m}),p&&(0,a.jsx)("div",{className:"bg-green-50 text-green-600 p-3 rounded-md text-sm",children:p}),(0,a.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nombre"}),(0,a.jsx)("input",{type:"text",name:"nombre",value:N.nombre,onChange:A,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Apellido"}),(0,a.jsx)("input",{type:"text",name:"apellido",value:N.apellido,onChange:A,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"G\xe9nero"}),(0,a.jsx)("select",{name:"genero",value:N.genero,onChange:A,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",children:n.map(e=>(0,a.jsx)("option",{value:e.value,children:e.label},e.value))})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Tel\xe9fono"}),(0,a.jsx)("input",{type:"tel",name:"telefono",value:N.telefono,onChange:A,pattern:"[\\d\\s\\-\\+\\(\\)]{8,20}",title:"Solo n\xfameros, espacios, +, - y par\xe9ntesis (8-20 caracteres)",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"+54 11 1234 5678"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"URL de Foto de Perfil"}),(0,a.jsx)("input",{type:"url",name:"fotoUrl",value:N.fotoUrl,onChange:A,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"https://ejemplo.com/foto.jpg"})]}),"profesional"===r&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Precio de Consulta ($)"}),(0,a.jsx)("input",{type:"number",name:"precioConsulta",value:N.precioConsulta,onChange:A,min:"0",max:"999999",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"5000"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Lugar de Atenci\xf3n"}),(0,a.jsx)("input",{type:"text",name:"lugarAtencion",value:N.lugarAtencion,onChange:A,maxLength:200,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Direcci\xf3n del consultorio"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Biograf\xeda"}),(0,a.jsx)("textarea",{name:"bio",value:N.bio,onChange:A,rows:3,maxLength:500,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Breve descripci\xf3n profesional..."})]})]}),"paciente"===r&&(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Fecha de Nacimiento"}),(0,a.jsx)("input",{type:"date",name:"fechaNacimiento",value:N.fechaNacimiento,onChange:A,max:new Date().toISOString().split("T")[0],className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"DNI"}),(0,a.jsx)("input",{type:"text",name:"dni",value:N.dni,onChange:A,pattern:"\\d{7,8}",title:"7 u 8 d\xedgitos num\xe9ricos",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"12345678"})]}),(0,a.jsxs)("div",{children:[(0,a.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Obra Social"}),(0,a.jsx)("input",{type:"text",name:"obraSocial",value:N.obraSocial,onChange:A,maxLength:100,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Nombre de obra social (opcional)"})]})]}),f&&(0,a.jsxs)("div",{className:"pt-4 border-t border-gray-200",children:[(0,a.jsx)("h3",{className:"text-sm font-semibold text-gray-700 mb-3",children:"Notificaciones"}),(0,a.jsx)("div",{className:"space-y-3",children:[{field:"notifEmail",label:"Notificaciones por email"},{field:"notifWhatsapp",label:"Notificaciones por WhatsApp"},..."paciente"===r?[{field:"aceptaRecordatorios",label:"Aceptar recordatorios de turnos"},{field:"notifRecordatorio24h",label:"Recordatorio 24 horas antes"},{field:"notifRecordatorio2h",label:"Recordatorio 2 horas antes"}]:[]].map(({field:e,label:t})=>void 0!==f[e]?(0,a.jsxs)("label",{className:"flex items-center justify-between cursor-pointer select-none",children:[(0,a.jsx)("span",{className:"text-sm text-gray-600",children:t}),(0,a.jsx)("button",{type:"button",role:"switch","aria-checked":!!f[e],onClick:()=>{f&&b({...f,[e]:!f[e]})},className:`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f[e]?"bg-blue-600":"bg-gray-300"}`,children:(0,a.jsx)("span",{className:`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${f[e]?"translate-x-6":"translate-x-1"}`})})]},e):null)}),y&&(0,a.jsx)("p",{className:`mt-2 text-xs ${y.startsWith("Error")?"text-red-500":"text-emerald-600"}`,children:y}),(0,a.jsxs)("div",{className:"mt-3 flex gap-2",children:[(0,a.jsx)("button",{type:"button",onClick:E,disabled:g,className:"flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50",children:g?"Guardando...":"Guardar preferencias"}),(0,a.jsx)("button",{type:"button",onClick:()=>S("EMAIL"),disabled:w,title:"Enviar email de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"✉️"}),(0,a.jsx)("button",{type:"button",onClick:()=>S("WHATSAPP"),disabled:w,title:"Enviar WhatsApp de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"\uD83D\uDCAC"})]})]}),(0,a.jsxs)("div",{className:"pt-4 flex gap-3",children:[(0,a.jsx)("button",{type:"button",onClick:t,className:"flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50",children:"Cancelar"}),(0,a.jsx)("button",{type:"submit",disabled:c,className:"flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",children:c?"Guardando...":"Guardar Cambios"})]})]})]})}):null}},86285:(e,t,r)=>{r.d(t,{A6:()=>C,Au:()=>p,BF:()=>j,CT:()=>n,Es:()=>E,Kx:()=>x,O4:()=>s,Sr:()=>f,Tb:()=>v,WI:()=>k,XF:()=>c,ai:()=>g,e:()=>o,fN:()=>w,hw:()=>N,mo:()=>y,np:()=>b,ny:()=>l,uV:()=>d,uc:()=>m,ui:()=>u,uv:()=>h});var a=r(95155);function i(e,t="0 0 24 24"){return function({size:r=16,className:i=""}){return(0,a.jsx)("svg",{width:r,height:r,viewBox:t,fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:i,"aria-hidden":"true",children:e})}}function o({size:e=28,className:t=""}){return(0,a.jsxs)("svg",{width:e,height:e,viewBox:"0 0 32 32",fill:"none",className:t,"aria-hidden":"true",children:[(0,a.jsx)("rect",{width:"32",height:"32",rx:"8",fill:"#2563EB"}),(0,a.jsx)("path",{d:"M9 16h14M16 9v14",stroke:"white",strokeWidth:"3",strokeLinecap:"round"}),(0,a.jsx)("circle",{cx:"16",cy:"16",r:"5",stroke:"white",strokeWidth:"1.5"})]})}let n=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,a.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,a.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,a.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})),s=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,a.jsx)("polyline",{points:"12 6 12 12 16 14"})]})),l=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),(0,a.jsx)("circle",{cx:"12",cy:"7",r:"4"})]})),d=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),(0,a.jsx)("polyline",{points:"16 17 21 12 16 7"}),(0,a.jsx)("line",{x1:"21",y1:"12",x2:"9",y2:"12"})]})),c=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),(0,a.jsx)("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]})),x=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),(0,a.jsx)("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),(0,a.jsx)("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]})),m=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("polyline",{points:"3 6 5 6 21 6"}),(0,a.jsx)("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]})),u=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}),(0,a.jsx)("rect",{x:"8",y:"2",width:"8",height:"4",rx:"1"}),(0,a.jsx)("line",{x1:"9",y1:"12",x2:"15",y2:"12"}),(0,a.jsx)("line",{x1:"9",y1:"16",x2:"13",y2:"16"})]})),p=i((0,a.jsx)("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})),h=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),(0,a.jsx)("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})),f=i((0,a.jsx)("polyline",{points:"20 6 9 17 4 12"})),b=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("polygon",{points:"23 7 16 12 23 17 23 7"}),(0,a.jsx)("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2"})]})),g=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("rect",{x:"3",y:"3",width:"18",height:"18",rx:"1"}),(0,a.jsx)("path",{d:"M3 9h18"}),(0,a.jsx)("path",{d:"M9 21V9"})]})),v=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,a.jsx)("circle",{cx:"12",cy:"10",r:"3"})]})),y=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,a.jsx)("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),(0,a.jsx)("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})),j=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("rect",{x:"1",y:"4",width:"22",height:"16",rx:"2"}),(0,a.jsx)("line",{x1:"1",y1:"10",x2:"23",y2:"10"})]})),w=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("polyline",{points:"23 4 23 10 17 10"}),(0,a.jsx)("polyline",{points:"1 20 1 14 7 14"}),(0,a.jsx)("path",{d:"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"})]})),k=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("circle",{cx:"11",cy:"11",r:"8"}),(0,a.jsx)("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}));function N({size:e=16,className:t=""}){return(0,a.jsxs)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:t,"aria-hidden":"true",children:[(0,a.jsx)("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),(0,a.jsx)("circle",{cx:"9",cy:"7",r:"4"}),(0,a.jsx)("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),(0,a.jsx)("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}let C=i((0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),(0,a.jsx)("polyline",{points:"12 19 5 12 12 5"})]})),E=i((0,a.jsx)("path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"}));i((0,a.jsx)("polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"}))},87330:(e,t,r)=>{r.d(t,{A:()=>l,AuthProvider:()=>s});var a=r(95155),i=r(12115),o=r(8776);let n=(0,i.createContext)(null);function s({children:e}){let[t,r]=(0,i.useState)(null),[l,d]=(0,i.useState)(null),[c,x]=(0,i.useState)(!0);(0,i.useEffect)(()=>{let e=localStorage.getItem("token");e?(d(e),o.FH.auth.me().then(r).catch(e=>{let t=e instanceof Error?e.message.toLowerCase():"";(t.includes("token")||t.includes("sesion")||t.includes("sesi\xf3n")||t.includes("unauthorized"))&&(localStorage.removeItem("token"),d(null))}).finally(()=>x(!1))):x(!1)},[]);let m=async(e,t)=>{let a=await o.FH.auth.login({email:e,password:t});localStorage.setItem("token",a.token),d(a.token),r(await o.FH.auth.me())},u=async e=>{let t=await o.FH.auth.register(e);localStorage.setItem("token",t.token),d(t.token),r(await o.FH.auth.me())};return(0,a.jsx)(n.Provider,{value:{user:t,token:l,login:m,register:u,logout:()=>{localStorage.removeItem("token"),d(null),r(null)},loading:c},children:e})}function l(){let e=(0,i.useContext)(n);if(!e)throw Error("useAuth must be used within AuthProvider");return e}}}]);