# CRM TAMIVAR - Frontend

Frontend del CRM TAMIVAR construido con React, TypeScript y Tailwind CSS.

## El README es la documentacion base
Si, el README funciona como documentacion inicial del proyecto. Aqui normalmente se explica:
- Que es el proyecto
- Como instalarlo
- Como configurarlo
- Como ejecutarlo
- Estructura y decisiones tecnicas principales

## Stack
- React
- TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM

## Estructura de carpetas
```text
src/
  app/
    App.tsx
    layout/
    providers/
    routing/
  modules/
    auth/
    dashboard/
    properties/
    leads/
    users/
    hr/
  shared/
    components/
    constants/
    context/
    lib/
    types/
  styles/
    globals.css
docs/
  architecture.md
```

## Roles contemplados
- SUPER_ADMIN
- ADMIN
- MARKETING
- RH
- ASESOR_VENTAS
- COORDINADOR_VENTAS

La base ya permite multiples roles por usuario para habilitar vistas/modulos dinamicos.

## Instalacion
```bash
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Configuracion
1. Crear `.env` en la raiz.
2. Definir la URL del backend:

```env
VITE_API_URL=http://localhost:3000
```

## Proximo paso recomendado
- Conectar login real contra `tamivar-api` (`/auth/login` y `/auth/verify-2fa`).
- Guardar sesion con `access_token`.
- Cargar permisos/roles reales desde backend.
- Crear componentes reutilizables de tabla/formulario.

