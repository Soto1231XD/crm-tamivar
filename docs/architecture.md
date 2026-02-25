# Arquitectura de carpetas

## Enfoque
- `app/`: composicion global (rutas, layout, providers).
- `modules/`: funcionalidad por dominio del CRM (auth, leads, propiedades, etc.).
- `shared/`: piezas transversales reutilizables.
- `styles/`: estilos globales y tokens base.

## Escalabilidad por roles
La autorizacion se define con:
- `Role`
- `ModuleKey`
- `ROLE_MODULE_ACCESS`

Esto permite que un usuario tenga varios roles y herede acceso a multiples modulos.

