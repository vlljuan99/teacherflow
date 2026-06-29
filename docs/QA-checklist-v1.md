# Banco de pruebas — Gate de release v1.0 (English Odyssey)

Checklist de aceptación manual para decidir si la versión **1.0** está lista.
Complementa a los tests automáticos (`npm test`, lógica pura de negocio).
Aquí se verifican los **flujos de trabajo completos** de extremo a extremo.

> Convención: marca `[x]` cuando el caso pase. Si algo falla, anótalo en la
> sección **Incidencias** del final con la fecha y un detalle reproducible.
> No se da por terminada la v1.0 hasta que todos los bloques **críticos** (🔴)
> estén en verde. Los bloques marcados (🟡) son deseables pero no bloqueantes.

---

## 0. Preparación del entorno de pruebas

- [ ] Base de datos limpia: `npm run db:push` (o migración) sin errores.
- [ ] Semilla cargada: `npm run db:seed` → crea profesora y alumno demo + grupo A2 + preguntas de speaking.
- [ ] Variables de entorno mínimas en `.env` (ver `.env.example`): `DATABASE_URL`, `AUTH_SECRET`.
- [ ] Tests automáticos en verde: `npm test` (85+ tests).
- [ ] Typecheck en verde: `npm run typecheck`.
- [ ] Lint sin errores: `npm run lint`.
- [ ] `npm run build` termina sin errores.
- [ ] App arranca: `npm run dev` y carga `http://localhost:3000`.

**Usuarios de prueba** (crear con `npm run create:user` si hace falta):
- ADMIN — acceso total.
- TEACHER — perfil de profesor.
- STUDENT — alumno demo de la semilla.

---

## 1. 🔴 Autenticación y roles

- [ ] Login con email/contraseña correctos → entra al panel.
- [ ] Login con contraseña incorrecta → mensaje de error, no entra.
- [ ] Login con usuario inexistente → error controlado.
- [ ] Logout → vuelve a `/login` y la sesión queda cerrada.
- [ ] Acceso a ruta de admin sin sesión → redirige a login.
- [ ] Usuario STUDENT no puede entrar en rutas `(admin)` → bloqueado/redirigido.
- [ ] Usuario ADMIN ve secciones exclusivas de admin (logs, gestión de usuarios) que TEACHER no ve.
- [ ] Login con Google (si `AUTH_GOOGLE_ID` configurado) → entra y enlaza la cuenta.
- [ ] Usuario `isActive = false` → no puede iniciar sesión.

## 2. 🔴 Alumnos (Students)

- [ ] Listado de alumnos: carga, busca y filtra.
- [ ] Crear alumno nuevo (datos mínimos) → aparece en el listado.
- [ ] Crear alumno **menor de edad** (`isMinor`) → se marca correctamente y exige tutor/consentimiento.
- [ ] Validación: email mal formado / campos requeridos → error claro, no crea.
- [ ] Ver ficha de alumno: datos, nivel, grupo, profesor asignado.
- [ ] Editar alumno (nivel, estado, canal de notificación) → cambios persisten.
- [ ] Asignar alumno a un grupo y a un profesor.
- [ ] Cambiar estado a INACTIVE → desaparece de listados activos.
- [ ] Subir foto del alumno → se muestra (ver bloque Storage).
- [ ] `allowedTracks`: limitar los tracks de material visibles al alumno funciona.
- [ ] Eliminar alumno → confirma y limpia relaciones (clases, entregas) según las reglas.

## 3. 🟡 Tutores legales (Guardians) y RGPD

- [ ] Crear tutor y vincularlo a un alumno (menor).
- [ ] Ver/editar tutor; la relación tutor↔alumno se ve en ambas fichas.
- [ ] Consentimientos: crear consentimiento (tipo, versión, texto).
- [ ] Aceptar consentimiento queda registrado con nombre, fecha e IP.
- [ ] Revocar consentimiento → estado REVOKED con fecha.
- [ ] Un alumno menor sin consentimiento de datos queda señalado.

## 4. 🔴 Grupos (Groups)

- [ ] Crear grupo (nombre, nivel, horario).
- [ ] Añadir/quitar alumnos del grupo.
- [ ] Editar grupo; borrar grupo (los alumnos quedan sin grupo, no se borran).

## 5. 🔴 Clases (Classes) y recurrencia

- [ ] Crear clase individual (alumno) con fecha/hora.
- [ ] Crear clase de grupo.
- [ ] El **título automático** se genera bien (`Alumno/Grupo — fecha en español`).
- [ ] Crear **serie recurrente** (p. ej. lunes y miércoles hasta una fecha) → se generan todas las clases con la hora correcta. *(Cubierto en unit tests: `recurrence.test.ts`.)*
- [ ] La hora se guarda y muestra en **horario de Madrid** (verano/invierno correcto). *(Cubierto: `timezone.test.ts`.)*
- [ ] Editar una clase de la serie / borrar una clase de la serie.
- [ ] Modalidad ONLINE genera/usa enlace de Meet; IN_PERSON usa ubicación.
- [ ] Adjuntar worksheet o material a una clase → aparece como adjunto.
- [ ] Vista **clase en vivo** (`/classes/[id]/live`) carga y muestra el material/alumnos.
- [ ] Integración Google Calendar (si configurada): la clase aparece en el calendario y crea evento/Meet.

## 6. 🔴 Asistencia (Attendance)

- [ ] Pasar lista de una clase: marcar PRESENT/ABSENT/LATE/EXCUSED por alumno.
- [ ] La asistencia se guarda y se puede editar después.
- [ ] El resumen de asistencia por alumno/grupo es coherente.

## 7. 🔴 Worksheets y ejercicios

- [ ] Crear worksheet (título, nivel, idioma, tema) en estado DRAFT.
- [ ] Añadir ejercicios de cada tipo: opción múltiple, V/F, rellenar huecos, respuesta corta, emparejar, ordenar palabras, reading, listening, writing.
- [ ] Reordenar ejercicios (drag & drop) → el orden persiste.
- [ ] Editar y borrar un ejercicio.
- [ ] Vista previa / review del worksheet muestra todo correctamente.
- [ ] Publicar worksheet (DRAFT → PUBLISHED).
- [ ] **Importar PDF** (`/worksheets`/`/materials/import`): subir PDF, extraer texto y generar ejercicios (IA). Revisar resultado.
- [ ] Archivar worksheet (PUBLISHED → ARCHIVED).

## 8. 🔴 Tareas, entregas y corrección (flujo central)

Este es el flujo más importante de la app. Recorrerlo entero:

- [ ] Asignar worksheet a un alumno (Assignment) con fecha de entrega.
- [ ] Asignar worksheet a un grupo entero → cada alumno recibe su tarea.
- [ ] Marcar tarea como "de verano" (`summer`) → se agrupa aparte en el portal.
- [ ] **(Como alumno)** ver la tarea pendiente en el portal y abrirla.
- [ ] **(Como alumno)** resolver el worksheet (`/portal/worksheets/[id]/solve`), guardar progreso y enviar.
- [ ] La **autocorrección** puntúa bien los tipos auto-corregibles. *(Cubierto: `auto-grade.test.ts`.)*
- [ ] Writing y similares quedan marcados como "requiere corrección manual".
- [ ] **(Como profesor)** ver la entrega en corrección (`/assignments/[id]/corrections`).
- [ ] Corregir manualmente respuesta a respuesta, poner nota y comentarios.
- [ ] La nota final combina auto + manual correctamente.
- [ ] El estado pasa a CORRECTED y el alumno ve la nota y comentarios en su progreso.
- [ ] Reintentos / segunda entrega: comportamiento esperado (no duplica, respeta `@@unique`).

## 9. 🔴 Placement test (prueba de nivel)

- [ ] Iniciar placement test para un alumno (`/students/[id]/placement-test`).
- [ ] **(Como alumno)** completar las 4 partes: grammar, reading, writing, speaking.
- [ ] Grammar y reading se autocorrigen sobre 10. *(Cubierto: `placement-grade.test.ts`.)*
- [ ] Writing y speaking se puntúan manualmente por el profesor.
- [ ] La nota final es la media de las 4 partes y mapea al nivel CEFR correcto. *(Cubierto: `placement-grade.test.ts`.)*
- [ ] El nivel resultante se asigna a la ficha del alumno.

## 10. 🔴 Skills: Speaking y Writing

- [ ] Banco de preguntas de speaking: crear, editar, activar/desactivar, "twists".
- [ ] **(Como alumno)** grabar/subir audio de speaking (`/portal/speaking`).
- [ ] **(Como alumno)** subir tarea de writing (texto o archivo) (`/portal/writing`).
- [ ] **(Como profesor)** revisar la submission, puntuar y comentar (estado → REVIEWED).
- [ ] El alumno ve la corrección de su skill.

## 11. 🟡 Materiales

- [ ] Subir material (PDF, imagen, audio, documento) con metadatos (nivel, track, categoría, examen).
- [ ] Organización por track y subsección coherente con `TRACK_SUBSECTIONS`.
- [ ] Vincular material a alumno / grupo / worksheet.
- [ ] **(Como alumno)** ver solo los materiales de sus tracks permitidos (`allowedTracks`).
- [ ] Descargar material (ver bloque Storage).
- [ ] Importar materiales desde Google Classroom (si configurado).

## 12. 🟡 Pagos (Payments)

- [ ] Crear pago (concepto, importe, vencimiento, método).
- [ ] El importe se muestra en euros con formato correcto. *(Cubierto: `utils.test.ts`.)*
- [ ] Marcar pago como pagado → estado PAID con fecha.
- [ ] Pago vencido sin pagar se muestra como OVERDUE.
- [ ] Listado/filtros de pagos por alumno y por estado.

## 13. 🟡 Cuaderno del alumno (IA) y búsqueda semántica

- [ ] Vincular un Google Doc como cuaderno del alumno.
- [ ] Parsear el cuaderno → se trocea por fechas. *(Cubierto: `notebook-parser.test.ts`.)*
- [ ] Extracción IA: vocabulario, gramática y evaluaciones por sesión.
- [ ] Re-parsear no duplica secciones sin cambios (hash) y reprocesa las cambiadas.
- [ ] Búsqueda semántica sobre el cuaderno devuelve resultados relevantes.

## 14. 🟡 Recordatorios (Email / WhatsApp / cron)

- [ ] Configuración de recordatorios (`/settings/reminders`).
- [ ] El alumno elige su canal: email / WhatsApp / ambos.
- [ ] Normalización del número de WhatsApp correcta. *(Cubierto: `whatsapp.test.ts`.)*
- [ ] Endpoint cron `/api/cron/class-reminders` con `CRON_SECRET` válido envía recordatorios del día siguiente.
- [ ] No se reenvía el mismo recordatorio dos veces (`ClassReminderSent`).
- [ ] Llamada al cron sin/ con secret incorrecto → 401/403.
- [ ] Email de recordatorio llega y enlaza al portal.

## 15. 🟡 Perfil del profesor, búsqueda y auditoría

- [ ] Editar perfil del profesor (contacto, foto, notas) (`/profile`).
- [ ] **(Como alumno)** ver datos de contacto del profesor (`/portal/teacher`).
- [ ] Búsqueda global del admin (`/search`) encuentra alumnos/clases/materiales.
- [ ] Registro de actividad / auditoría (`/logs`) refleja las acciones realizadas (crear, editar, borrar) con actor y fecha.
- [ ] Solo ADMIN accede a los logs.

## 16. 🟡 Portal del alumno (visión integral)

Recorrer el portal completo como alumno:

- [ ] Dashboard: resumen de próximas clases, tareas pendientes, avisos.
- [ ] Mis clases: próximas y pasadas, con enlace de Meet.
- [ ] Mis materiales: solo los permitidos.
- [ ] Mis worksheets/tareas: pendientes, en curso, corregidas, verano.
- [ ] Mi progreso: notas, niveles, evolución.
- [ ] Speaking / Writing: enviar y ver correcciones.
- [ ] Contacto con el profesor.

## 17. 🟡 Internacionalización, almacenamiento y responsive

- [ ] Cambio de idioma es/en (next-intl): textos clave traducidos sin claves crudas.
- [ ] **Copy**: en español se usa "travesía" (nunca "odisea"); en inglés "odyssey".
- [ ] Subida y descarga de archivos con `STORAGE_BACKEND=local` (disco).
- [ ] Subida y descarga con `STORAGE_BACKEND=azure` (si se usa en prod).
- [ ] Límite `MAX_UPLOAD_MB` se respeta → archivo grande rechazado con mensaje.
- [ ] Vista móvil/responsive de panel admin y portal del alumno.
- [ ] Identidad visual Odyssey (crimson + crema) consistente.

## 18. 🟡 Robustez y casos límite

- [ ] Recargar páginas con datos vacíos (sin alumnos, sin clases) → estados vacíos correctos, sin crash.
- [ ] Acciones sobre recursos inexistentes (`/students/idfalso`) → 404 controlado.
- [ ] Envío de formularios con doble click → no duplica registros.
- [ ] Errores de integración externa (Google/IA/SMTP caídos) → la app degrada con aviso, no rompe el flujo principal.
- [ ] Sin claves de IA/Google/SMTP configuradas, los flujos que no dependen de ellas siguen funcionando.

---

## Resumen de cobertura automática (`npm test`)

Estos puntos ya están cubiertos por tests unitarios y no requieren prueba manual
de la lógica (sí de la UI):

| Área | Fichero de test |
|---|---|
| Autocorrección de los 9 tipos de ejercicio | `tests/unit/auto-grade.test.ts` |
| Puntuación y nivel CEFR del placement | `tests/unit/placement-grade.test.ts` |
| Recurrencia de clases (días/semana, tope) | `tests/unit/recurrence.test.ts` |
| Título automático de clase | `tests/unit/class-title.test.ts` |
| Zona horaria Madrid (verano/invierno) | `tests/unit/timezone.test.ts` |
| Normalización de números WhatsApp | `tests/unit/whatsapp.test.ts` |
| Troceado del cuaderno por fechas | `tests/unit/notebook-parser.test.ts` |
| Utilidades (dinero, edad, slug, JSON) | `tests/unit/utils.test.ts` |

---

## Veredicto de release v1.0

- [ ] Todos los bloques 🔴 (críticos) en verde.
- [ ] Tests automáticos, typecheck, lint y build en verde.
- [ ] Incidencias bloqueantes: 0.

**Decisión:** ⬜ Apta para v1.0   ⬜ No apta (ver incidencias)

Firmado: ______________________  Fecha: ____________

---

## Incidencias

| # | Fecha | Bloque | Descripción | Severidad | Estado |
|---|-------|--------|-------------|-----------|--------|
|   |       |        |             |           |        |
