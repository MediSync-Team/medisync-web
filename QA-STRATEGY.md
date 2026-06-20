# MediSync — Estrategia de QA (Core Features)

> Documento vivo de QA. Cubre los 5 flujos críticos de negocio: **Turnos, Telemedicina,
> Historia Clínica/Recetas, Pagos/Webhooks, Notificaciones/Sync**. Prioridad de riesgo:
> **(1)** el paciente puede pagar y atenderse, **(2)** el médico no tiene conflictos de
> agenda ni fugas de datos médicos.

## Convenciones y entorno

- **Roles del sistema** (`Rol` enum): `PACIENTE`, `PROFESIONAL`, `CLINICA`, `ADMIN`.
  ⚠️ **No existe rol `RECEPCIONISTA`** — la función de recepción la cumple el rol
  **`CLINICA`** (gestiona agenda/invitaciones de sus profesionales). Cualquier caso de
  "recepcionista" se prueba con un usuario `CLINICA`.
- **Stack bajo prueba:** Web Next.js 16 (App Router), API Express/Prisma/PostgreSQL,
  Mobile Expo/React Native. Zona horaria de negocio: `America/Argentina/Buenos_Aires`
  (`utils/clinic-time.ts`) — toda aserción de fecha/hora se valida en TZ de clínica.
- **Niveles de prueba:** unit/integration ya existen (Vitest/RTL web, Jest/Supertest API,
  Cucumber BDD). Este doc agrega **E2E (Playwright)**, **QA manual estructurado** y
  **casos límite de negocio**.
- **Datos de prueba:** E2E golpea una **Postgres de test** dedicada (nunca prod). Seed por
  API (`npm run seed`) o Prisma directo. Servicios externos (MercadoPago, ICE/TURN, Google
  Calendar, email/WhatsApp) **se mockean** salvo indicación expresa.

---

## §1 — Matriz de Happy Paths (E2E fundamentales)

| # | Feature | Actor | Pasos | Resultado esperado |
|---|---------|-------|-------|--------------------|
| HP-1 | **Reserva de turno** | Paciente | 1. Login. 2. Home → buscar profesional (por especialidad/obra social). 3. Abrir perfil → elegir día → slot disponible (bloque 30 min). 4. Confirmar modalidad (PRESENCIAL/VIRTUAL). 5. Reservar. | `POST /turnos` → 201; turno en estado **RESERVADO**; el slot deja de ofrecerse; email de confirmación + evento de calendario (si hay Google token). |
| HP-2 | **Pago de turno** | Paciente | 1. Sobre un turno RESERVADO pago, "Pagar". 2. `POST /pagos/crear-preferencia` → redirect a checkout MP. 3. (mock) MP aprueba → `POST /pagos/webhook`. 4. Volver a `/pago-exitoso`. | Webhook idempotente marca **pago APROBADO** y turno **CONFIRMADO**; `GET /pagos/estado/:turnoId` → `necesitaPago:false`; email "pago aprobado / turno confirmado". |
| HP-3 | **Telemedicina (web)** | Paciente + Profesional | 1. Turno VIRTUAL CONFIRMADO. 2. Dentro de la ventana, cada uno abre la sala → `GET /turnos/:id/video-token`. 3. Cliente abre `ws(s)://…/ws/video?ticket=`. 4. Señalización WebRTC (offer/answer/ICE). | Ambos obtienen `ticket` (1 solo uso, 90 s) + `iceServers`; la sala empareja 2 peers; **conexión `connected`**, media bidireccional; "colgar" cierra limpио (code 1000) y libera la sala. |
| HP-4 | **Historia clínica + receta** | Profesional → Paciente | 1. Profesional abre un turno **COMPLETADO**. 2. Escribe evolución (`POST /turnos/:id/evolucion`). 3. Emite receta (`POST /turnos/:id/receta`) → descarga PDF. 4. Paciente entra a su historial. | Profesional ve/guarda evolución+receta; PDF con datos y **fechas en TZ de clínica**; el paciente ve su receta en `recetas`; un tercero recibe **403** (`assertTurnoAccess`). |
| HP-5 | **Notificaciones + sync** | Sistema | 1. Crear/confirmar turno VIRTUAL. 2. Disparar email + sync calendario. 3. Cron de recordatorios (~30 min) sobre turno < 24 h. | Email/calendario de turno VIRTUAL muestran **CTA "Ingresá a MediSync para unirte"** → `${FRONTEND_URL}/dashboard` (**sin link `meet.jit.si`**); recordatorio se envía una sola vez; el card del turno tiene el botón de videollamada. |

---

## §2 — Matriz de Casos Límite / Pruebas Negativas

> Cada caso indica el **guard real** que debe activarse. Prioridad: concurrencia de agenda
> y control de acceso a datos médicos.

### 2.1 Turnos (Booking & Scheduling)
| ID | Escenario | Esperado |
|----|-----------|----------|
| EC-T1 | **Race condition:** dos pacientes reservan el mismo slot simultáneamente | El advisory lock por día (`acquireAppointmentDayLock`) + `hasAppointmentConflict` serializa: **uno 201, el otro 409 `HORARIO_NO_DISPONIBLE`**. Nunca dos turnos solapados. |
| EC-T2 | Reservar slot en el pasado / fuera de bloque de 30 min / fuera de disponibilidad | 400/409 de validación; no se crea turno. |
| EC-T3 | Profesional plan FREE supera `FREE_PLAN_MONTHLY_TURNO_LIMIT` (20/mes) | Reserva rechazada con error de límite; sugiere upgrade. |
| EC-T4 | Cancelar dentro de la ventana mínima de cancelación | Rechazo según política (`/turnos/politica-cancelacion`); estado no cambia. |
| EC-T5 | Reprogramar PRESENCIAL→VIRTUAL y viceversa | `POST /:id/reprogramar` limpia/ajusta `lugarAtencion`; `linkVideollamada` queda **null** (WebRTC nativo); reconfirma conflictos en la nueva fecha. |
| EC-T6 | Guest: doble uso del token de `POST /turnos/confirmar-reserva` | Segundo intento inválido/expirado; no duplica turno. |
| EC-T7 | Cuerpo de request > 50 kb | **413** (cap global de la API). |

### 2.2 Telemedicina
| ID | Escenario | Esperado |
|----|-----------|----------|
| EC-V1 | Pedir token > 15 min antes del turno (o ya finalizado) | **403 `OUTSIDE_JOIN_WINDOW`** (ventana `[fechaHora-15m, fechaHora+duracionMin]`). |
| EC-V2 | Turno **no VIRTUAL** / estado **CANCELADO** | 400 `NOT_VIRTUAL` / 400 `INVALID_STATE`. |
| EC-V3 | Usuario que no es paciente ni profesional del turno | **403 `FORBIDDEN`** (`assertTurnoAccess`). |
| EC-V4 | Tercer peer intenta entrar a una sala llena | WS cierra con **4002 "Room full"** (máx 2 peers). |
| EC-V5 | Ticket expirado (>90 s) o reusado | WS cierra **4001 "Unauthorized"** (ticket de un solo uso). |
| EC-V6 | Reinicio/deploy de la API durante una llamada | Rooms y tickets **in-memory** se pierden → llamada cae; reconectar requiere nuevo token. (Restricción **single-instance** documentada.) |
| EC-V7 | Desconexión de un peer | El otro recibe `peer-left`; reconexión con back-off; cierre tras timeout. |

### 2.3 Historia Clínica y Recetas
| ID | Escenario | Esperado |
|----|-----------|----------|
| EC-H1 | Otro paciente u otro profesional intenta leer receta/evolución/archivo ajeno | **403 `FORBIDDEN`** en todos los `GET /turnos/:id/*` (fuga de datos = riesgo crítico). |
| EC-H2 | Emitir receta/certificado sobre turno **no COMPLETADO** | Rechazo de estado; no se crea el documento. |
| EC-H3 | Subir archivo > 50 kb / tipo no permitido | 413 / validación de tipo. |
| EC-H4 | Correctitud de fecha en PDFs (receta/certificado/historia) | Fechas en **TZ de clínica** sin importar TZ del navegador (cubierto por `pdf-timezone`/`medical-document-emission-timezone`). |
| EC-H5 | Paciente "invitado" sin cuenta en certificado | Render de datos del paciente null-safe; sin romper el PDF. |

### 2.4 Pagos y Webhooks
| ID | Escenario | Esperado |
|----|-----------|----------|
| EC-P1 | **Webhook duplicado** (MP reintenta) | Aprobación **idempotente**: `updateMany(estado != APROBADO)` + catch P2002; **no** doble incremento de cupón; segunda vez no dispara notificación. |
| EC-P2 | Firma de webhook inválida (con `MP_WEBHOOK_SECRET`) | **401 `INVALID_WEBHOOK_SIGNATURE`**; `fetch` a MP **no** se ejecuta (chequeo antes del fetch). |
| EC-P3 | Webhook "approved" para turno CANCELADO/terminal o inexistente | Se ignora con warn `[pagos] Ignoring approved payment…`; responde `received:true`; no aprueba ingresos. |
| EC-P4 | Cupón 100% off (total → 0) | Confirma turno **sin** llamar a MP (`createMpPreference` no se invoca); cupón se redime 1 vez. |
| EC-P5 | Cupón agotado al momento de redimir | 400 `COUPON_EXHAUSTED`; no se crea pago. |
| EC-P6 | Webhook llega antes de persistir la preferencia / carrera de aprobación | `necesitaPago:false` / sin sobrescribir un pago ya APROBADO. |
| EC-P7 | Fallo de MP al crear preferencia | Se devuelve **500** (la `AppError(400 MP_ERROR)` interna queda envuelta por el try/catch del servicio — comportamiento actual). |

### 2.5 Notificaciones y Sincronización
| ID | Escenario | Esperado |
|----|-----------|----------|
| EC-N1 | Turno VIRTUAL: contenido de email/WhatsApp/calendar | **CTA de login**, **nunca** una URL `meet.jit.si` (migración WebRTC). |
| EC-N2 | Fallo del proveedor de notificación tras pago aprobado | El pago/turno **igual** commitea; webhook responde `received:true`; se loguea `Error enviando notificación…`. |
| EC-N3 | Recordatorio no se duplica en corridas sucesivas del cron | Un solo envío por turno/ventana. |
| EC-N4 | Sync de Google Calendar con token revocado/ausente | Degrada con gracia (no rompe la reserva/pago); turno se crea igual. |
| EC-N5 | Cancelación de turno | Email de cancelación coherente; (nota: hoy los turnos VIRTUAL muestran el CTA de videoconsulta también en cancelación — verificar si se desea suprimir). |

---

## §3 — Blueprint de Automatización E2E (Playwright)

Base existente: `playwright.config.ts` (proyectos chromium/webkit/Pixel 5/iPhone 13, `trace`
+ `video` on-failure, levanta `npm run dev` en :3000). Política de locators:
`getByRole` / `getByLabel` / `getByText`; `getByTestId` solo donde no haya nombre accesible
(agregar `data-testid` en el componente). **Mock** = servicios externos; **DB de test** =
turnos/usuarios reales.

### Flujo 1 — Reserva + Pago (el más crítico de negocio)
```
e2e/booking-payment.spec.ts
test.describe('Paciente reserva y paga un turno', () => {
  test.beforeEach → seed (vía API): profesional con disponibilidad + paciente; login paciente (storageState)
  test('reserva + checkout aprobado confirma el turno', async ({ page }) => {
    step 'buscar profesional'      → getByRole('searchbox') ; assert prof-card visible
    step 'elegir slot'             → getByTestId('slot-disponible').first().click()
    step 'reservar'                → getByRole('button',{name:/reservar/i}) ; assert turno RESERVADO (UI + GET /turnos/:id)
    step 'checkout'                → route.fulfill('**/checkout/preferences', {id,init_point})  // MOCK MP
    step 'simular webhook'         → request.post('/api/pagos/webhook', firma válida) // golpea API+DB test
    step 'verificar'               → assert /pago-exitoso ; GET /pagos/estado → necesitaPago:false ; turno CONFIRMADO
  })
})
```
**Mock:** `**/checkout/preferences` (MP), credenciales TURN. **DB test:** turno/pago reales.
**Aserciones clave:** estado RESERVADO→CONFIRMADO; pago APROBADO; idempotencia (reenviar el
webhook no cambia nada).

### Flujo 2 — Telemedicina Web (acceso + señalización)
```
e2e/telemedicine.spec.ts
test.describe('Sala de videoconsulta', () => {
  test('fuera de ventana → 403; dentro → token + sala', () => {
    seed turno VIRTUAL CONFIRMADO con fechaHora = now (dentro de ventana)
    step '403 si lejos'   → seed fechaHora +2h ; GET video-token → expect 403 OUTSIDE_JOIN_WINDOW
    step 'token ok'       → fechaHora=now ; GET video-token → ticket + iceServers
    step '2 contextos'    → browser.newContext() x2 (paciente/profesional) abren WS ; assert 'waiting'→'start-call'
  })
})
```
**Mock:** ICE (forzar STUN stub); `getUserMedia` con `--use-fake-device-for-media-stream`
(launch flags). **DB test:** turno real. **Aserción:** la negociación llega a `connected`
en chromium; webkit/mobile → smoke de UI (no media real).

### Flujo 3 — Control de acceso a datos médicos (anti-fuga)
```
e2e/medical-records-access.spec.ts
test.describe('Aislamiento de historia clínica', () => {
  test('solo paciente y profesional del turno acceden', () => {
    seed turno COMPLETADO con receta + dos pacientes (A dueño, B ajeno)
    step 'profesional emite'  → login prof ; emite receta ; assert PDF disponible
    step 'paciente A ve'      → login A ; assert receta visible en historial
    step 'paciente B NO ve'   → login B ; GET /turnos/:id/receta → expect 403 FORBIDDEN
  })
})
```
**Mock:** ninguno (puro auth + DB). **Aserción:** 403 cross-user; el PDF renderiza fechas en
TZ de clínica.

> **Datos / aislamiento:** cada `describe` siembra y limpia su propio set (DB de test
> transaccional o `truncate` en `afterAll`). Login vía `storageState` por rol para no repetir
> el form. Correr en CI con 1 sola instancia de API (constraint de salas in-memory).

---

## §4 — Checklist de QA Manual — Mobile (Expo)

> Énfasis en entorno: la videollamada usa `react-native-webrtc` (módulo nativo).

### Entorno / build
- [ ] **NO usar Expo Go** — falla por el módulo nativo. Usar **Dev Build**: `npx expo run:ios` / `npx expo run:android`.
- [ ] Probar en **dispositivo físico** (idealmente 2) para cámara/mic reales y llamada 1-a-1.
- [ ] Backend en **una sola instancia** (salas/tickets in-memory); un restart corta llamadas activas.
- [ ] `EXPO_PUBLIC_API_URL` apunta a la API correcta; token guardado bajo la clave `token` (`expo-secure-store`).

### Permisos de cámara / micrófono
- [ ] **iOS:** primer acceso pide permiso; **conceder** → entra a la sala.
- [ ] **iOS:** **denegar** → mensaje claro, sin crash; ruta para reintentar desde Ajustes.
- [ ] **Android:** conceder / denegar / "no volver a preguntar" → manejo correcto en cada caso.
- [ ] Revocar permiso desde Ajustes del SO con la app en background y volver → re-solicita o degrada con gracia.

### Llamada / ciclo de vida
- [ ] **App a background** durante la llamada (home, bloqueo de pantalla) y volver → reconecta o cierra limpio (sin estado "fantasma").
- [ ] Llamada entrante del SO (teléfono) interrumpe → audio se recupera al volver.
- [ ] **Pérdida de red** (modo avión / wifi↔datos) → back-off de reconexión; tras timeout corta y muestra estado.
- [ ] El otro peer cuelga → se ve `peer-left` y la UI vuelve a estado final.
- [ ] **Ventana de tiempo:** intentar unirse > 15 min antes → bloqueado con mensaje (403 `OUTSIDE_JOIN_WINDOW`).

### Red / media
- [ ] Misma red (STUN-only) → conecta. Redes/NAT distintas → requiere TURN (`CLOUDFLARE_TURN_*` seteado en API); sin TURN, documentar que puede fallar cross-NAT.
- [ ] Altavoz/auricular y orientación de pantalla durante la llamada.

### Smoke general (no-video)
- [ ] Login por rol; tabs correctos por rol (paciente/profesional/clínica/admin).
- [ ] Deep link `medisync://video-call?turnoId=…` abre la sala correcta estando logueado.

---

## Apéndice — Mapa rápido feature → código (para el tester técnico)
- Turnos: `medisync-api/src/services/turnos/*` (`booking`, `reschedule`, `estado`), `utils/appointment-conflicts.ts`, `utils/appointment-locks.ts`, `utils/turno-state.ts`.
- Telemedicina: `routes/turnos.routes.ts` (`/:id/video-token`), `services/video-room.service.ts`, `services/turn.service.ts`.
- Historia/recetas: `services/turnos/clinical.service.ts`, `services/turnos/turno-helpers.ts` (`assertTurnoAccess`), `app/lib/*-pdf.ts` (web).
- Pagos: `medisync-api/src/services/pagos/*` (`payment`, `webhook`, `mercadopago`, `pago-query`).
- Notificaciones/sync: `utils/notifications.ts`, `services/calendar-sync.service.ts`, `services/reminder.service.ts`.
