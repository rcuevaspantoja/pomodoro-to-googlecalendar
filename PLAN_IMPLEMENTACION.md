# Plan de implementacion: Pomodoro + Google Calendar

Este documento define los pasos para construir la app en 3 etapas, desde la base tecnica hasta la creacion automatica de bloques en Google Calendar y el registro historico.

## Vision del proyecto

Construir una app de pomodoro que permita:
- Iniciar y finalizar bloques de foco.
- Registrar automaticamente cada bloque como evento en Google Calendar.
- Conservar un historial util para analizar progreso (trabajo, gimnasio, estudio, etc.).

---

## Etapa 1: Base de la aplicacion en Next.js

Objetivo: dejar una base robusta de frontend/backend para iterar rapido.

### 1.1 Inicializacion y estructura
- [x] Crear proyecto con Next.js (App Router, TypeScript, ESLint, Tailwind).
- [ ] Definir estructura de carpetas:
  - `app/` para rutas y layouts
  - `components/` para UI reusable
  - `lib/` para utilidades y servicios externos
  - `types/` para modelos TypeScript
  - `app/api/` para endpoints server-side

### 1.2 Modelo funcional minimo (MVP UI)
- [ ] Crear pantalla principal con:
  - Temporizador pomodoro
  - Selector de tipo de bloque (trabajo/gimnasio/estudio/personal)
  - Campo de titulo/descripcion del bloque
  - Botones de iniciar, pausar y finalizar
- [ ] Crear vista de historial local (inicialmente mock o memoria).

### 1.3 Persistencia inicial
- [ ] Elegir base de datos (sugerido: PostgreSQL + Prisma o Supabase).
- [ ] Crear entidad `PomodoroSession` con campos base:
  - `id`
  - `userId`
  - `title`
  - `category`
  - `startTime`
  - `endTime`
  - `durationMinutes`
  - `status` (completed/cancelled/interrupted)
  - `calendarEventId` (nullable)
- [ ] Crear endpoints CRUD basicos para sesiones.

### 1.4 Criterio de cierre etapa 1
- App corre localmente.
- Se puede completar un pomodoro y ver su registro persistido en la app.
- API interna lista para conectar con Google en la siguiente etapa.

---

## Etapa 2: Sincronizacion con Google (Auth + Calendar + datos)

Objetivo: autenticar usuario y preparar sincronizacion segura con Google Calendar.

### 2.1 Autenticacion OAuth con Google
- [ ] Implementar login con Google (NextAuth/Auth.js recomendado).
- [ ] Solicitar scopes minimos necesarios:
  - `openid`, `email`, `profile`
  - `https://www.googleapis.com/auth/calendar.events`
- [ ] Gestionar y refrescar tokens de acceso de forma segura.

### 2.2 Integracion base con Google Calendar API
- [ ] Configurar cliente de Google API en servidor (`lib/google-calendar.ts`).
- [ ] Probar lectura de calendarios del usuario.
- [ ] Definir calendario destino (principal o uno dedicado "Pomodoro Tracker").

### 2.3 Estrategia de almacenamiento
- [ ] Definir fuente de verdad:
  - Opcion recomendada: DB propia como fuente principal + Google Calendar como espejo de agenda.
- [ ] Guardar relacion entre sesion local y evento Google (`calendarEventId`).
- [ ] Manejar reintentos ante fallos de red/API.

### 2.4 Criterio de cierre etapa 2
- Usuario puede autenticarse con Google.
- App crea y valida conexion con Google Calendar.
- Existe pipeline seguro para crear/actualizar eventos y asociarlos a sesiones locales.

---

## Etapa 3: Pomodoro completo + incrustacion en Google Calendar

Objetivo: cerrar flujo end-to-end desde temporizador hasta trazabilidad historica.

### 3.1 Flujo final del pomodoro
- [ ] Al iniciar: crear sesion en estado `running`.
- [ ] Al pausar/reanudar: actualizar metadata de sesion.
- [ ] Al finalizar: cerrar sesion (`endTime`, `durationMinutes`, `status=completed`).

### 3.2 Creacion de evento en Google Calendar
- [ ] Al finalizar un bloque, crear evento con:
  - Titulo del bloque
  - Categoria
  - Inicio/fin reales
  - Descripcion opcional (notas, objetivo, energia, etc.)
- [ ] Guardar `calendarEventId` devuelto por Google.
- [ ] En caso de fallo, marcar sesion como `sync_pending` para reintento.

### 3.3 Historial y analitica basica
- [ ] Implementar historial filtrable por:
  - Fecha
  - Categoria
  - Duracion
- [ ] Mostrar metricas simples:
  - Total de pomodoros por semana
  - Horas por categoria
  - Racha de dias con actividad

### 3.4 Criterio de cierre etapa 3
- Cada pomodoro completado deja registro local y evento en Google Calendar.
- Historial visible y util para seguimiento personal.
- Flujo estable frente a errores comunes (token expirado, red, limite API).

---

## Tareas transversales (recomendadas en paralelo)

- [ ] Validaciones (duracion minima/maxima, campos requeridos).
- [ ] Estados de carga y errores UX claros.
- [ ] Logging basico para depuracion.
- [ ] Pruebas:
  - Unitarias (logica de temporizador y mapeo de eventos)
  - Integracion (API interna + Google)
- [ ] Preparar despliegue (Vercel) y variables de entorno seguras.

## Proximo hito sugerido

Implementar primero un MVP local de pomodoro + guardado en DB sin Google, y justo despues activar OAuth + creacion de eventos. Esto simplifica debugging y reduce riesgo en etapas tempranas.
