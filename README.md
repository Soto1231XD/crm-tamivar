# CRM TAMIVAR - Frontend

Aplicación frontend del CRM TAMIVAR.  
Construida con React + TypeScript + Vite y organizada por módulos con control de acceso por roles.

## Stack principal
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router DOM

## Requisitos
- Node.js 20+ (recomendado)
- npm 10+ (o versión compatible)

## Instalación
```bash
npm install
```

## Ejecución en desarrollo
```bash
npm run dev
```

## Build de producción
```bash
npm run build
```

## Previsualizar build
```bash
npm run preview
```

## Variables de entorno
Este proyecto usa `VITE_API_URL` para apuntar al backend.

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Define la URL del API en `.env`:
```env
VITE_API_URL=http://localhost:3000
```

## Estructura base
```text
src/
  app/        # layout, ruteo y composición general
  assets/     # imágenes e íconos
  modules/    # vistas por módulo (dashboard, propiedades, etc.)
  shared/     # constantes, tipos y utilidades compartidas
  styles/     # estilos globales
```

## Módulos y roles
- Módulos principales: `dashboard`, `properties`, `leads`, `content`, `users`, `system_roles`, `system_logs`
- Roles contemplados:
  - `SUPER_ADMIN`
  - `ADMIN`
  - `MARKETING`
  - `RH`
  - `ASESOR_VENTAS`
  - `COORDINADOR_VENTAS`

