# Arquitectura de carpetas

## Enfoque
- `app/`: composicion global (rutas, layout y providers).
- `modules/`: funcionalidad por dominio activo del CRM.
  - `auth/`: login y 2FA.
  - `dashboard/`: dashboard + vista reutilizable de modulos.
- `shared/`: piezas transversales del frontend.
  - `constants/`: RBAC (roles, permisos por modulo y redireccion).
  - `context/`: estado de autenticacion/sesion.
  - `types/`: tipos base.
- `styles/`: estilos globales y tokens base.
- `assets/`: imagenes estaticas.

## RBAC por modulos
- Roles: `SUPER_ADMIN`, `ADMIN`, `MARKETING`, `RH`, `ASESOR_VENTAS`, `COORDINADOR_VENTAS`.
- Cada rol define permisos por modulo (`view/create/edit/delete`).
- Las vistas se reutilizan; lo que cambia es que acciones se habilitan segun permisos.
