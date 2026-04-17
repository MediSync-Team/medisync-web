"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[749],{24953:(e,t,a)=>{a.d(t,{A:()=>s});var r=a(95155),o=a(12115),n=a(8776);let i=[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"},{urls:"stun:stun2.l.google.com:19302"}];function s({turnoId:e,profesionalNombre:t,fechaHora:a,onClose:l}){let[c,d]=(0,o.useState)("connecting"),[x,u]=(0,o.useState)(""),[m,p]=(0,o.useState)(!0),[h,f]=(0,o.useState)(!0),[b,g]=(0,o.useState)(!1),[v,j]=(0,o.useState)(0),y=(0,o.useRef)(null),w=(0,o.useRef)(null),k=(0,o.useRef)(null),N=(0,o.useRef)(null),C=(0,o.useRef)(null),S=(0,o.useRef)(null),E=(0,o.useRef)([]),M=new Date(a).toLocaleString("es-AR",{dateStyle:"short",timeStyle:"short"}),A=(0,o.useCallback)(()=>{S.current&&clearInterval(S.current),k.current?.close(),N.current?.close(),C.current?.getTracks().forEach(e=>e.stop()),k.current=null,N.current=null,C.current=null},[]),L=(0,o.useCallback)(e=>{let t=new RTCPeerConnection({iceServers:i});return e.getTracks().forEach(a=>t.addTrack(a,e)),t.onicecandidate=e=>{e.candidate&&k.current?.readyState===WebSocket.OPEN&&k.current.send(JSON.stringify({type:"ice-candidate",candidate:e.candidate.toJSON()}))},t.ontrack=e=>{w.current&&(w.current.srcObject=e.streams[0]),g(!0),d("in-call"),S.current=setInterval(()=>j(e=>e+1),1e3)},t.onconnectionstatechange=()=>{["disconnected","failed","closed"].includes(t.connectionState)&&(d("ended"),S.current&&clearInterval(S.current))},N.current=t,t},[]);(0,o.useEffect)(()=>{let t=!1;return async function(){try{let a,r=localStorage.getItem("token"),o=await fetch(`${n.tE}/turnos/${e}/video-token`,{headers:r?{Authorization:`Bearer ${r}`}:{}}),i=await o.json();if(!i.success)throw Error(i.error?.message??"Error al obtener acceso");if(t)return;let{ticket:s}=i.data;try{a=await navigator.mediaDevices.getUserMedia({video:!0,audio:!0})}catch{throw Error("No se pudo acceder a la c\xe1mara o el micr\xf3fono. Verific\xe1 los permisos del navegador.")}if(t)return void a.getTracks().forEach(e=>e.stop());C.current=a,y.current&&(y.current.srcObject=a);let l=new WebSocket(`${n.tE.replace(/\/api\/?$/,"").replace(/^https/,"wss").replace(/^http/,"ws")}/ws/video?ticket=${s}`);k.current=l,l.onopen=()=>{t||d("waiting")},l.onerror=()=>{t||(u("Error al conectar con el servidor de videollamada."),d("error"))},l.onclose=e=>{t||1e3===e.code||d(e=>"in-call"===e?"ended":"error"===e?"error":"ended")},l.onmessage=async e=>{let r;if(!t){try{r=JSON.parse(e.data)}catch{return}switch(r.type){case"waiting":d("waiting");break;case"peer-joined":d("calling");break;case"start-call":{d("calling");let e=L(a),t=await e.createOffer();await e.setLocalDescription(t),l.send(JSON.stringify({type:"offer",sdp:e.localDescription}));break}case"offer":{d("calling");let e=L(a);for(let t of(await e.setRemoteDescription(new RTCSessionDescription(r.sdp)),E.current))try{await e.addIceCandidate(new RTCIceCandidate(t))}catch{}E.current=[];let t=await e.createAnswer();await e.setLocalDescription(t),l.send(JSON.stringify({type:"answer",sdp:e.localDescription}));break}case"answer":{let e=N.current;if(e){for(let t of(await e.setRemoteDescription(new RTCSessionDescription(r.sdp)),E.current))try{await e.addIceCandidate(new RTCIceCandidate(t))}catch{}E.current=[]}break}case"ice-candidate":{let e=N.current,t=r.candidate;if(e&&e.remoteDescription)try{await e.addIceCandidate(new RTCIceCandidate(t))}catch{}else E.current.push(t);break}case"peer-left":d("ended"),S.current&&clearInterval(S.current);break;case"error":u(String(r.message??"Error desconocido")),d("error")}}}}catch(e){t||(u(e instanceof Error?e.message:"Error al iniciar la videollamada"),d("error"))}}(),()=>{t=!0,A()}},[e,L,A]);let $=(0,o.useCallback)(()=>{A(),d("ended")},[A]),R=e=>{let t=Math.floor(e/60).toString().padStart(2,"0"),a=(e%60).toString().padStart(2,"0");return`${t}:${a}`},D={connecting:"Iniciando...",waiting:"Esperando al otro participante…",calling:"Estableciendo conexi\xf3n…","in-call":`En consulta \xb7 ${R(v)}`,ended:"Llamada finalizada",error:"Error de conexi\xf3n"}[c];return(0,r.jsxs)("div",{className:"fixed inset-0 z-50 flex flex-col bg-slate-900",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex-shrink-0",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2.5 min-w-0",children:[(0,r.jsx)("span",{className:`w-2 h-2 rounded-full shrink-0 ${"in-call"===c?"bg-emerald-400 animate-pulse":"error"===c?"bg-red-400":"ended"===c?"bg-slate-500":"bg-amber-400 animate-pulse"}`}),(0,r.jsx)("span",{className:"text-white font-medium text-sm truncate",children:"in-call"===c||"calling"===c||"waiting"===c?`Videoconsulta \xb7 Dr/a. ${t}`:D}),"in-call"===c&&(0,r.jsx)("span",{className:"text-emerald-400 text-xs font-mono shrink-0",children:R(v)}),(0,r.jsx)("span",{className:"text-slate-500 text-xs hidden sm:inline shrink-0",children:M})]}),(0,r.jsx)("button",{onClick:"ended"===c||"error"===c?l:$,className:"ml-3 shrink-0 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors",title:"Cerrar",children:(0,r.jsx)("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M6 18L18 6M6 6l12 12"})})})]}),(0,r.jsxs)("div",{className:"flex-1 relative overflow-hidden bg-slate-900",children:[(0,r.jsx)("video",{ref:w,autoPlay:!0,playsInline:!0,className:`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${b?"opacity-100":"opacity-0"}`}),!b&&("connecting"===c||"waiting"===c||"calling"===c)&&(0,r.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-5",children:[(0,r.jsx)("div",{className:"w-24 h-24 rounded-full bg-slate-700/80 flex items-center justify-center",children:(0,r.jsx)("svg",{className:"w-12 h-12 text-slate-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"})})}),(0,r.jsxs)("div",{className:"text-center",children:[(0,r.jsx)("p",{className:"text-slate-200 font-medium mb-1",children:D}),"waiting"===c&&(0,r.jsx)("p",{className:"text-slate-400 text-sm",children:"Compart\xed el link o avisale al otro participante que ingrese"})]}),("connecting"===c||"calling"===c)&&(0,r.jsxs)("svg",{className:"w-5 h-5 text-slate-400 animate-spin",fill:"none",viewBox:"0 0 24 24",children:[(0,r.jsx)("circle",{className:"opacity-25",cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeWidth:"4"}),(0,r.jsx)("path",{className:"opacity-75",fill:"currentColor",d:"M4 12a8 8 0 018-8v8H4z"})]})]}),"ended"===c&&(0,r.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-4",children:[(0,r.jsx)("div",{className:"w-20 h-20 rounded-full bg-slate-700/80 flex items-center justify-center",children:(0,r.jsx)("svg",{className:"w-10 h-10 text-slate-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"})})}),(0,r.jsx)("p",{className:"text-slate-200 font-medium",children:"Llamada finalizada"}),v>0&&(0,r.jsxs)("p",{className:"text-slate-400 text-sm",children:["Duraci\xf3n: ",R(v)]}),(0,r.jsx)("button",{onClick:l,className:"mt-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors",children:"Cerrar"})]}),"error"===c&&(0,r.jsxs)("div",{className:"absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center",children:[(0,r.jsx)("div",{className:"w-20 h-20 rounded-full bg-red-900/30 flex items-center justify-center",children:(0,r.jsx)("svg",{className:"w-10 h-10 text-red-400",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"})})}),(0,r.jsxs)("div",{children:[(0,r.jsx)("p",{className:"text-white font-semibold mb-2",children:"No se pudo conectar"}),(0,r.jsx)("p",{className:"text-slate-400 text-sm leading-relaxed",children:x})]}),(0,r.jsx)("button",{onClick:l,className:"px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm transition-colors",children:"Cerrar"})]}),(0,r.jsxs)("div",{className:`absolute bottom-20 right-4 transition-all duration-300 ${"in-call"===c?"w-36 sm:w-44":"w-28 sm:w-36"} aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600/50 bg-slate-800`,children:[(0,r.jsx)("video",{ref:y,autoPlay:!0,muted:!0,playsInline:!0,className:"w-full h-full object-cover"}),!h&&(0,r.jsx)("div",{className:"absolute inset-0 flex items-center justify-center bg-slate-800",children:(0,r.jsx)("svg",{className:"w-7 h-7 text-slate-500",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.5,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"})})}),!m&&(0,r.jsx)("div",{className:"absolute top-1.5 left-1.5 bg-red-600/90 rounded-full p-1",children:(0,r.jsx)("svg",{className:"w-3 h-3 text-white",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25"})})})]})]}),("in-call"===c||"waiting"===c||"calling"===c||"connecting"===c)&&(0,r.jsxs)("div",{className:"flex-shrink-0 flex items-center justify-center gap-5 py-4 px-4 bg-slate-800/90 backdrop-blur border-t border-slate-700",children:[(0,r.jsx)("button",{onClick:()=>{let e=C.current?.getAudioTracks()[0];e&&(e.enabled=!e.enabled,p(e.enabled))},title:m?"Silenciar micr\xf3fono":"Activar micr\xf3fono",className:`w-12 h-12 rounded-full flex items-center justify-center transition-all ${m?"bg-slate-700 hover:bg-slate-600 text-white":"bg-red-600 hover:bg-red-700 text-white"}`,children:m?(0,r.jsx)("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"})}):(0,r.jsx)("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25"})})}),(0,r.jsx)("button",{onClick:$,title:"Colgar",className:"w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all shadow-lg scale-100 hover:scale-105 active:scale-95",children:(0,r.jsx)("svg",{className:"w-7 h-7 text-white",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 3.75L18 6m0 0l2.25 2.25M18 6l2.25-2.25M18 6l-2.25 2.25m-10.5 6l4.72-4.72a.75.75 0 011.28.531V15m0 0l4.72-4.72M6.75 15H4.5a.75.75 0 01-.75-.75V8.25"})})}),(0,r.jsx)("button",{onClick:()=>{let e=C.current?.getVideoTracks()[0];e&&(e.enabled=!e.enabled,f(e.enabled))},title:h?"Apagar c\xe1mara":"Activar c\xe1mara",className:`w-12 h-12 rounded-full flex items-center justify-center transition-all ${h?"bg-slate-700 hover:bg-slate-600 text-white":"bg-red-600 hover:bg-red-700 text-white"}`,children:h?(0,r.jsx)("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"})}):(0,r.jsx)("svg",{className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.531l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25h9M3 3l18 18"})})})]})]})}},45511:(e,t,a)=>{a.d(t,{r:()=>d});var r=a(95155),o=a(12115),n=a(72209),i=a(10333);let s={TURNO_RESERVADO:"\uD83D\uDCC5",TURNO_CONFIRMADO:"✅",TURNO_CANCELADO:"❌",RECETA_EMITIDA:"\uD83D\uDC8A"};function l({notif:e,onRead:t}){let a=s[e.tipo]??"\uD83D\uDD14";return(0,r.jsxs)("div",{className:`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!e.leida?"bg-blue-50/60 dark:bg-blue-900/20":""}`,onClick:()=>{e.leida||t(e.id),e.link&&(window.location.href=e.link)},children:[(0,r.jsx)("span",{className:"text-xl mt-0.5 shrink-0",children:a}),(0,r.jsxs)("div",{className:"flex-1 min-w-0",children:[(0,r.jsxs)("div",{className:"flex items-start justify-between gap-2",children:[(0,r.jsx)("p",{className:`text-sm font-medium text-slate-800 dark:text-slate-100 ${!e.leida?"font-semibold":""}`,children:e.titulo}),(0,r.jsx)("span",{className:"text-[11px] text-slate-400 dark:text-slate-500 shrink-0",children:function(e){let t=Math.floor((Date.now()-new Date(e).getTime())/6e4);if(t<1)return"ahora";if(t<60)return`hace ${t} min`;let a=Math.floor(t/60);if(a<24)return`hace ${a} h`;let r=Math.floor(a/24);return`hace ${r} d`}(e.createdAt)})]}),(0,r.jsx)("p",{className:"text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2",children:e.cuerpo})]}),!e.leida&&(0,r.jsx)("span",{className:"w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"})]})}function c({onClose:e}){let{notifications:t,unread:a,markRead:o,markAllRead:s}=(0,n.E)(),{t:d}=(0,i.u)();return d("common"),(0,r.jsxs)("div",{className:"absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden",children:[(0,r.jsxs)("div",{className:"flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700",children:[(0,r.jsxs)("div",{className:"flex items-center gap-2",children:[(0,r.jsx)("span",{className:"text-sm font-semibold text-slate-800 dark:text-slate-100",children:"Notificaciones"}),a>0&&(0,r.jsx)("span",{className:"px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full",children:a})]}),a>0&&(0,r.jsx)("button",{onClick:()=>s(),className:"text-xs text-blue-600 dark:text-blue-400 hover:underline",children:"Marcar todas le\xeddas"})]}),(0,r.jsx)("div",{className:"max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700",children:0===t.length?(0,r.jsx)("p",{className:"px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500",children:"Sin notificaciones"}):t.map(e=>(0,r.jsx)(l,{notif:e,onRead:o},e.id))})]})}function d(){let{unread:e}=(0,n.E)(),[t,a]=(0,o.useState)(!1),i=(0,o.useRef)(null);return(0,o.useEffect)(()=>{function e(e){i.current&&!i.current.contains(e.target)&&a(!1)}return t&&document.addEventListener("mousedown",e),()=>document.removeEventListener("mousedown",e)},[t]),(0,r.jsxs)("div",{ref:i,className:"relative",children:[(0,r.jsxs)("button",{onClick:()=>a(e=>!e),className:"relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors","aria-label":"Notificaciones",children:[(0,r.jsx)("svg",{xmlns:"http://www.w3.org/2000/svg",className:"w-5 h-5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.8,children:(0,r.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"})}),e>0&&(0,r.jsx)("span",{className:"absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full leading-none",children:e>9?"9+":e})]}),t&&(0,r.jsx)(c,{onClose:()=>a(!1)})]})}},63165:(e,t,a)=>{function r(e,t){return`
    <div class="seccion">
      <div class="seccion-titulo">${e}</div>
      <div class="seccion-cuerpo">${t.replace(/\n/g,"<br>")}</div>
    </div>`}function o(e){let{receta:t,profesional:a,paciente:o,fechaHora:n,modalidad:i}=e,s=new Date(n).toLocaleDateString("es-AR",{weekday:"long",year:"numeric",month:"long",day:"numeric"}),l=new Date(n).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),c=new Date(t.emitidaAt).toLocaleString("es-AR",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),d=`
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>`,x=a.fotoUrl?`<img src="${a.fotoUrl}" class="foto-prof" alt="Foto profesional" onerror="this.style.display='none'" />`:"",u=[t.diagnostico&&r("Diagn\xf3stico",t.diagnostico),t.planTratamiento&&r("Plan de tratamiento",t.planTratamiento),t.medicamentos&&r("Medicamentos",t.medicamentos),r("Indicaciones",t.indicaciones),t.estudiosSolicitados&&r("Estudios solicitados",t.estudiosSolicitados),t.proximoControl&&r("Pr\xf3ximo control",t.proximoControl),t.advertencias&&r("⚠ Advertencias",t.advertencias),t.observaciones&&r("Observaciones",t.observaciones)].filter(Boolean).join(""),m=`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receta — Dr/a. ${a.nombre} ${a.apellido}</title>
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
        <div class="prof-nombre">Dr/a. ${a.nombre} ${a.apellido}</div>
        <div class="prof-esp">${a.especialidad}</div>
        ${a.matricula?`<div class="prof-mat">Mat. ${a.matricula}</div>`:""}
      </div>
    </div>
    <div class="membrete-der">
      <div class="logo-wrap">
        ${d}
        <span class="logo-text">MediSync</span>
      </div>
      ${a.lugarAtencion?`<strong>${a.lugarAtencion}</strong>`:""}
      ${a.telefono?`Tel: ${a.telefono}`:""}
    </div>
  </div>

  <!-- Datos del turno -->
  <div class="datos-turno">
    <div class="datos-turno-col">
      <div class="dato-label">Paciente</div>
      <div class="dato-valor">${o?`${o.nombre} ${o.apellido}`:"Paciente sin cuenta"}</div>
    </div>
    <div class="datos-turno-col" style="text-align:center">
      <div class="dato-label">Fecha de consulta</div>
      <div class="dato-valor">${s}, ${l} h</div>
    </div>
    <div class="datos-turno-col" style="text-align:right">
      <div class="dato-label">Modalidad</div>
      <span class="badge-modalidad">${"VIRTUAL"===i?"Virtual":"Presencial"}</span>
    </div>
  </div>

  <hr class="sep">

  <!-- T\xedtulo -->
  <div class="titulo-receta">Receta e Indicaciones M\xe9dicas</div>

  <!-- Secciones de la receta -->
  ${u}

  <!-- Pie de p\xe1gina -->
  <div class="footer">
    <div class="footer-emisi\xf3n">
      Emitida el ${c}<br>
      Documento generado por MediSync
    </div>
    <div class="firma-wrap">
      <div class="firma-linea"></div>
      <div class="firma-nombre">Dr/a. ${a.nombre} ${a.apellido}</div>
      ${a.matricula?`<div style="font-size:8pt;color:#64748b">Mat. ${a.matricula}</div>`:""}
    </div>
    <div class="footer-medisync">medisync.com.ar</div>
  </div>

</body>
</html>`,p=window.open("","_blank","width=900,height=750");p?(p.document.write(m),p.document.close(),setTimeout(()=>p.print(),600)):alert("Permitir ventanas emergentes para descargar el PDF.")}a.d(t,{a:()=>o})},72209:(e,t,a)=>{a.d(t,{E:()=>l,NotificationProvider:()=>s});var r=a(95155),o=a(12115),n=a(8776);let i=(0,o.createContext)({notifications:[],unread:0,markRead:async()=>{},markAllRead:async()=>{}});function s({children:e}){let[t,a]=(0,o.useState)([]),[l,c]=(0,o.useState)(0),d=(0,o.useRef)(null),x=(0,o.useCallback)(async()=>{if(localStorage.getItem("token"))try{let e=await n.vx.getInbox();a(e.notifs),c(e.unread)}catch{}},[]);(0,o.useEffect)(()=>{x();let e=localStorage.getItem("token");if(!e)return;let t=new EventSource(`${n.tE}/notifications/stream?token=${encodeURIComponent(e)}`);return d.current=t,t.onmessage=e=>{try{let t=JSON.parse(e.data);a(e=>[t,...e]),c(e=>e+1)}catch{}},t.onerror=()=>{},()=>{t.close(),d.current=null}},[x]);let u=(0,o.useCallback)(async e=>{await n.vx.markRead(e),a(t=>t.map(t=>t.id===e?{...t,leida:!0}:t)),c(e=>Math.max(0,e-1))},[]),m=(0,o.useCallback)(async()=>{await n.vx.markAllRead(),a(e=>e.map(e=>({...e,leida:!0}))),c(0)},[]);return(0,r.jsx)(i.Provider,{value:{notifications:t,unread:l,markRead:u,markAllRead:m},children:e})}function l(){return(0,o.useContext)(i)}},79087:(e,t,a)=>{a.d(t,{A:()=>s});var r=a(95155),o=a(12115),n=a(8776);let i=[{value:"NO_ESPECIFICADO",label:"Prefiero no decirlo"},{value:"MASCULINO",label:"Masculino"},{value:"FEMENINO",label:"Femenino"},{value:"OTRO",label:"Otro"}];function s({isOpen:e,onClose:t,userType:a,user:l,onUpdate:c}){let[d,x]=(0,o.useState)(!1),[u,m]=(0,o.useState)(""),[p,h]=(0,o.useState)(""),[f,b]=(0,o.useState)(null),[g,v]=(0,o.useState)(!1),[j,y]=(0,o.useState)(""),[w,k]=(0,o.useState)(!1),[N,C]=(0,o.useState)({nombre:"",apellido:"",telefono:"",genero:"NO_ESPECIFICADO",precioConsulta:"",lugarAtencion:"",bio:"",fechaNacimiento:"",dni:"",obraSocial:"",fotoUrl:""});(0,o.useEffect)(()=>{e&&("profesional"===a&&l.profesional?C({nombre:l.profesional.nombre||"",apellido:l.profesional.apellido||"",telefono:l.profesional.telefono||"",genero:l.profesional.genero||"NO_ESPECIFICADO",precioConsulta:l.profesional.precioConsulta?.toString()||"",lugarAtencion:l.profesional.lugarAtencion||"",bio:l.profesional.bio||"",fechaNacimiento:"",dni:"",obraSocial:"",fotoUrl:l.profesional.fotoUrl||""}):"paciente"===a&&l.paciente&&C({nombre:l.paciente.nombre||"",apellido:l.paciente.apellido||"",telefono:l.paciente.telefono||"",genero:l.paciente.genero||"NO_ESPECIFICADO",precioConsulta:"",lugarAtencion:"",bio:"",fechaNacimiento:l.paciente.fechaNacimiento?l.paciente.fechaNacimiento.split("T")[0]:"",dni:l.paciente.dni||"",obraSocial:l.paciente.obraSocial||"",fotoUrl:l.paciente.fotoUrl||""}),m(""),h(""),y(""),n.FH.notifications.getPreferences().then(b).catch(()=>{}))},[e,a,l]);let S=async()=>{if(f){v(!0),y("");try{await n.FH.notifications.updatePreferences(f),y("Preferencias guardadas")}catch{y("Error al guardar preferencias")}finally{v(!1)}}},E=async e=>{k(!0),y("");try{await n.FH.notifications.sendTest(e),y(`Prueba de ${"EMAIL"===e?"email":"WhatsApp"} enviada`)}catch{y("Error al enviar notificaci\xf3n de prueba")}finally{k(!1)}},M=e=>{C({...N,[e.target.name]:e.target.value})},A=async e=>{let r,o;if(e.preventDefault(),x(!0),m(""),h(""),N.telefono&&(r=N.telefono,!/^[\d\s\-\+\(\)]{8,20}$/.test(r))){m("El tel\xe9fono debe tener entre 8 y 20 caracteres (solo n\xfameros, espacios, +, - y par\xe9ntesis)"),x(!1);return}if("paciente"===a&&N.dni&&(o=N.dni,!/^\d{7,8}$/.test(o))){m("El DNI debe tener entre 7 y 8 d\xedgitos num\xe9ricos"),x(!1);return}if(N.fechaNacimiento&&new Date(N.fechaNacimiento)>new Date){m("La fecha de nacimiento no puede ser futura"),x(!1);return}try{"profesional"===a&&l.profesional?await n.FH.profesional.updatePerfil(l.profesional.id,{nombre:N.nombre,apellido:N.apellido,telefono:N.telefono||"",genero:N.genero,precioConsulta:N.precioConsulta?Number(N.precioConsulta):void 0,lugarAtencion:N.lugarAtencion||void 0,bio:N.bio||void 0,fotoUrl:N.fotoUrl||void 0}):"paciente"===a&&l.paciente&&await n.FH.pacientes.updatePerfil({nombre:N.nombre,apellido:N.apellido,telefono:N.telefono||void 0,genero:N.genero,fechaNacimiento:N.fechaNacimiento||void 0,dni:N.dni||void 0,obraSocial:N.obraSocial||void 0,fotoUrl:N.fotoUrl||void 0}),h("\xa1Perfil actualizado correctamente!"),setTimeout(()=>{t(),c&&c(),window.location.reload()},1500)}catch(e){m(e instanceof Error?e.message:"Error al guardar")}finally{x(!1)}};return e?(0,r.jsx)("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",children:(0,r.jsxs)("div",{className:"bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto",children:[(0,r.jsxs)("div",{className:"sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center",children:[(0,r.jsx)("h2",{className:"text-xl font-bold text-gray-900",children:"Editar Perfil"}),(0,r.jsx)("button",{onClick:t,className:"text-gray-400 hover:text-gray-600 text-2xl leading-none",children:"\xd7"})]}),(0,r.jsxs)("form",{onSubmit:A,className:"p-6 space-y-4",children:[u&&(0,r.jsx)("div",{className:"bg-red-50 text-red-600 p-3 rounded-md text-sm",children:u}),p&&(0,r.jsx)("div",{className:"bg-green-50 text-green-600 p-3 rounded-md text-sm",children:p}),(0,r.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Nombre"}),(0,r.jsx)("input",{type:"text",name:"nombre",value:N.nombre,onChange:M,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Apellido"}),(0,r.jsx)("input",{type:"text",name:"apellido",value:N.apellido,onChange:M,required:!0,minLength:2,maxLength:50,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"G\xe9nero"}),(0,r.jsx)("select",{name:"genero",value:N.genero,onChange:M,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",children:i.map(e=>(0,r.jsx)("option",{value:e.value,children:e.label},e.value))})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Tel\xe9fono"}),(0,r.jsx)("input",{type:"tel",name:"telefono",value:N.telefono,onChange:M,pattern:"[\\d\\s\\-\\+\\(\\)]{8,20}",title:"Solo n\xfameros, espacios, +, - y par\xe9ntesis (8-20 caracteres)",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"+54 11 1234 5678"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"URL de Foto de Perfil"}),(0,r.jsx)("input",{type:"url",name:"fotoUrl",value:N.fotoUrl,onChange:M,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"https://ejemplo.com/foto.jpg"})]}),"profesional"===a&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Precio de Consulta ($)"}),(0,r.jsx)("input",{type:"number",name:"precioConsulta",value:N.precioConsulta,onChange:M,min:"0",max:"999999",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"5000"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Lugar de Atenci\xf3n"}),(0,r.jsx)("input",{type:"text",name:"lugarAtencion",value:N.lugarAtencion,onChange:M,maxLength:200,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Direcci\xf3n del consultorio"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Biograf\xeda"}),(0,r.jsx)("textarea",{name:"bio",value:N.bio,onChange:M,rows:3,maxLength:500,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Breve descripci\xf3n profesional..."})]})]}),"paciente"===a&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Fecha de Nacimiento"}),(0,r.jsx)("input",{type:"date",name:"fechaNacimiento",value:N.fechaNacimiento,onChange:M,max:new Date().toISOString().split("T")[0],className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"DNI"}),(0,r.jsx)("input",{type:"text",name:"dni",value:N.dni,onChange:M,pattern:"\\d{7,8}",title:"7 u 8 d\xedgitos num\xe9ricos",className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"12345678"})]}),(0,r.jsxs)("div",{children:[(0,r.jsx)("label",{className:"block text-sm font-medium text-gray-700 mb-1",children:"Obra Social"}),(0,r.jsx)("input",{type:"text",name:"obraSocial",value:N.obraSocial,onChange:M,maxLength:100,className:"w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",placeholder:"Nombre de obra social (opcional)"})]})]}),f&&(0,r.jsxs)("div",{className:"pt-4 border-t border-gray-200",children:[(0,r.jsx)("h3",{className:"text-sm font-semibold text-gray-700 mb-3",children:"Notificaciones"}),(0,r.jsx)("div",{className:"space-y-3",children:[{field:"notifEmail",label:"Notificaciones por email"},{field:"notifWhatsapp",label:"Notificaciones por WhatsApp"},..."paciente"===a?[{field:"aceptaRecordatorios",label:"Aceptar recordatorios de turnos"},{field:"notifRecordatorio24h",label:"Recordatorio 24 horas antes"},{field:"notifRecordatorio2h",label:"Recordatorio 2 horas antes"}]:[]].map(({field:e,label:t})=>void 0!==f[e]?(0,r.jsxs)("label",{className:"flex items-center justify-between cursor-pointer select-none",children:[(0,r.jsx)("span",{className:"text-sm text-gray-600",children:t}),(0,r.jsx)("button",{type:"button",role:"switch","aria-checked":!!f[e],onClick:()=>{f&&b({...f,[e]:!f[e]})},className:`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${f[e]?"bg-blue-600":"bg-gray-300"}`,children:(0,r.jsx)("span",{className:`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${f[e]?"translate-x-6":"translate-x-1"}`})})]},e):null)}),j&&(0,r.jsx)("p",{className:`mt-2 text-xs ${j.startsWith("Error")?"text-red-500":"text-emerald-600"}`,children:j}),(0,r.jsxs)("div",{className:"mt-3 flex gap-2",children:[(0,r.jsx)("button",{type:"button",onClick:S,disabled:g,className:"flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50",children:g?"Guardando...":"Guardar preferencias"}),(0,r.jsx)("button",{type:"button",onClick:()=>E("EMAIL"),disabled:w,title:"Enviar email de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"✉️"}),(0,r.jsx)("button",{type:"button",onClick:()=>E("WHATSAPP"),disabled:w,title:"Enviar WhatsApp de prueba",className:"px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50",children:w?"...":"\uD83D\uDCAC"})]})]}),(0,r.jsxs)("div",{className:"pt-4 flex gap-3",children:[(0,r.jsx)("button",{type:"button",onClick:t,className:"flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50",children:"Cancelar"}),(0,r.jsx)("button",{type:"submit",disabled:d,className:"flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",children:d?"Guardando...":"Guardar Cambios"})]})]})]})}):null}},86285:(e,t,a)=>{a.d(t,{A6:()=>C,Au:()=>p,BF:()=>y,CT:()=>i,Es:()=>S,Kx:()=>x,O4:()=>s,Sr:()=>f,Tb:()=>v,WI:()=>k,XF:()=>d,ai:()=>g,e:()=>n,fN:()=>w,hw:()=>N,mo:()=>j,np:()=>b,ny:()=>l,uV:()=>c,uc:()=>u,ui:()=>m,uv:()=>h});var r=a(95155);function o(e,t="0 0 24 24"){return function({size:a=16,className:o=""}){return(0,r.jsx)("svg",{width:a,height:a,viewBox:t,fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:o,"aria-hidden":"true",children:e})}}function n({size:e=28,className:t=""}){return(0,r.jsxs)("svg",{width:e,height:e,viewBox:"0 0 32 32",fill:"none",className:t,"aria-hidden":"true",children:[(0,r.jsx)("rect",{width:"32",height:"32",rx:"8",fill:"#2563EB"}),(0,r.jsx)("path",{d:"M9 16h14M16 9v14",stroke:"white",strokeWidth:"3",strokeLinecap:"round"}),(0,r.jsx)("circle",{cx:"16",cy:"16",r:"5",stroke:"white",strokeWidth:"1.5"})]})}let i=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("rect",{x:"3",y:"4",width:"18",height:"18",rx:"2"}),(0,r.jsx)("line",{x1:"16",y1:"2",x2:"16",y2:"6"}),(0,r.jsx)("line",{x1:"8",y1:"2",x2:"8",y2:"6"}),(0,r.jsx)("line",{x1:"3",y1:"10",x2:"21",y2:"10"})]})),s=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,r.jsx)("polyline",{points:"12 6 12 12 16 14"})]})),l=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("path",{d:"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}),(0,r.jsx)("circle",{cx:"12",cy:"7",r:"4"})]})),c=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"}),(0,r.jsx)("polyline",{points:"16 17 21 12 16 7"}),(0,r.jsx)("line",{x1:"21",y1:"12",x2:"9",y2:"12"})]})),d=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("path",{d:"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"}),(0,r.jsx)("path",{d:"M13.73 21a2 2 0 0 1-3.46 0"})]})),x=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("line",{x1:"18",y1:"20",x2:"18",y2:"10"}),(0,r.jsx)("line",{x1:"12",y1:"20",x2:"12",y2:"4"}),(0,r.jsx)("line",{x1:"6",y1:"20",x2:"6",y2:"14"})]})),u=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("polyline",{points:"3 6 5 6 21 6"}),(0,r.jsx)("path",{d:"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"})]})),m=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"}),(0,r.jsx)("rect",{x:"8",y:"2",width:"8",height:"4",rx:"1"}),(0,r.jsx)("line",{x1:"9",y1:"12",x2:"15",y2:"12"}),(0,r.jsx)("line",{x1:"9",y1:"16",x2:"13",y2:"16"})]})),p=o((0,r.jsx)("path",{d:"M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"})),h=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("line",{x1:"18",y1:"6",x2:"6",y2:"18"}),(0,r.jsx)("line",{x1:"6",y1:"6",x2:"18",y2:"18"})]})),f=o((0,r.jsx)("polyline",{points:"20 6 9 17 4 12"})),b=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("polygon",{points:"23 7 16 12 23 17 23 7"}),(0,r.jsx)("rect",{x:"1",y:"5",width:"15",height:"14",rx:"2"})]})),g=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("rect",{x:"3",y:"3",width:"18",height:"18",rx:"1"}),(0,r.jsx)("path",{d:"M3 9h18"}),(0,r.jsx)("path",{d:"M9 21V9"})]})),v=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("path",{d:"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"}),(0,r.jsx)("circle",{cx:"12",cy:"10",r:"3"})]})),j=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("circle",{cx:"12",cy:"12",r:"10"}),(0,r.jsx)("line",{x1:"12",y1:"8",x2:"12",y2:"12"}),(0,r.jsx)("line",{x1:"12",y1:"16",x2:"12.01",y2:"16"})]})),y=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("rect",{x:"1",y:"4",width:"22",height:"16",rx:"2"}),(0,r.jsx)("line",{x1:"1",y1:"10",x2:"23",y2:"10"})]})),w=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("polyline",{points:"23 4 23 10 17 10"}),(0,r.jsx)("polyline",{points:"1 20 1 14 7 14"}),(0,r.jsx)("path",{d:"M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"})]})),k=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("circle",{cx:"11",cy:"11",r:"8"}),(0,r.jsx)("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]}));function N({size:e=16,className:t=""}){return(0,r.jsxs)("svg",{width:e,height:e,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:t,"aria-hidden":"true",children:[(0,r.jsx)("path",{d:"M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"}),(0,r.jsx)("circle",{cx:"9",cy:"7",r:"4"}),(0,r.jsx)("path",{d:"M23 21v-2a4 4 0 0 0-3-3.87"}),(0,r.jsx)("path",{d:"M16 3.13a4 4 0 0 1 0 7.75"})]})}let C=o((0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("line",{x1:"19",y1:"12",x2:"5",y2:"12"}),(0,r.jsx)("polyline",{points:"12 19 5 12 12 5"})]})),S=o((0,r.jsx)("path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"}));o((0,r.jsx)("polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"}))}}]);