# Fase 1 - Configurar Google Cloud para Pomodoro

Esta guia deja listo el proyecto de Google para usar:
- Login con Google
- Exportacion a Google Drive (JSON)
- Exportacion puntual de una sesion a Google Calendar

## 1) Crear proyecto en Google Cloud

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Arriba, selecciona proyecto > `New Project`.
3. Nombre sugerido: `pomodoro-portfolio`.
4. Crea el proyecto y seleccionarlo como activo.

## 2) Configurar pantalla de consentimiento OAuth

1. Ir a `APIs & Services` > `OAuth consent screen`.
2. User Type:
   - Para empezar: `External`.
3. Completar campos minimos:
   - App name: `Pomodoro Portfolio`
   - User support email: tu correo
   - Developer contact information: tu correo
4. Guardar.
5. En `Audience`, dejar en `Testing` por ahora.
6. En `Test users`, agrega tu correo de Google (y cualquier tester).

## 3) Habilitar APIs necesarias

Ir a `APIs & Services` > `Library` y habilitar:

- `Google Drive API`
- `Google Calendar API`

## 4) Crear credenciales OAuth 2.0 (Web app)

1. Ir a `APIs & Services` > `Credentials`.
2. `Create Credentials` > `OAuth client ID`.
3. Tipo: `Web application`.
4. Nombre sugerido: `pomodoro-web-local`.
5. Authorized JavaScript origins:
   - `http://localhost:3000`
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Crear y copiar:
   - `Client ID`
   - `Client Secret`

## 5) Variables de entorno en local

Crear archivo `.env.local` en la raiz usando `.env.local.example`.

Minimo para Fase 1:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL=http://localhost:3000`
- `NEXTAUTH_SECRET` (string largo aleatorio)

## 6) Scopes que vamos a usar (para la fase de codigo)

Minimo recomendado:

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/drive.appdata`
- `https://www.googleapis.com/auth/calendar.events`

Nota: `drive.appdata` guarda data oculta de app y reduce friccion con archivos visibles.

## 7) Que tienes que pasarme para seguir

Cuando termines en Google Cloud, comparteme:

1. `GOOGLE_CLIENT_ID` (completo)
2. `GOOGLE_CLIENT_SECRET` (completo)
3. Confirmacion de `redirect URI` exacta creada
4. Confirmacion de que Drive y Calendar API estan habilitadas
5. Correo agregado en `Test users`

Con eso avanzo a implementar login + "Hi, [nombre]" y endpoints base para Drive/Calendar.

## 8) Publicar para todo publico (cuando toque)

No lo hagas ahora para no frenar desarrollo. Mas adelante:

1. Revisar branding/politicas de privacidad.
2. Cambiar OAuth app de `Testing` a `Production`.
3. Validar scopes en caso de revision.

Para portfolio, primero valida flujo en `Testing`.
