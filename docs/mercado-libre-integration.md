# Integracion Mercado Libre

Base funcional preparada desde el CRM para una futura integracion con la API oficial de Mercado Libre Inmuebles.

## Objetivo

Publicar una propiedad del CRM en Mercado Libre sin recapturar datos manualmente.

## Flujo esperado

1. El usuario abre una propiedad en el CRM.
2. El CRM evalua si la propiedad esta lista para publicarse.
3. El usuario conecta la cuenta de Mercado Libre por OAuth.
4. El backend recibe la autorizacion y guarda tokens.
5. El usuario publica la propiedad.
6. El backend transforma la propiedad al formato de Mercado Libre y realiza la publicacion.
7. El CRM consulta el estado de la publicacion y permite sincronizar cambios.

## Endpoints esperados en backend

### Cuenta

- `GET /integrations/mercado-libre/account`
  - Respuesta:

```json
{
  "connected": true,
  "nickname": "tamivar_inmuebles",
  "expires_at": "2026-07-01T15:00:00.000Z"
}
```

- `POST /integrations/mercado-libre/auth-url`
  - Body opcional:

```json
{
  "propertyId": 123
}
```

  - Respuesta:

```json
{
  "authorization_url": "https://auth.mercadolibre.com.mx/..."
}
```

### Propiedad

- `GET /integrations/mercado-libre/properties/:propertyId`
  - Respuesta:

```json
{
  "account": {
    "connected": true,
    "nickname": "tamivar_inmuebles",
    "expires_at": "2026-07-01T15:00:00.000Z"
  },
  "publication": {
    "publication_id": "MLM123456789",
    "permalink": "https://inmuebles.mercadolibre.com.mx/...",
    "status": "active",
    "last_synced_at": "2026-06-05T20:00:00.000Z",
    "last_error": null
  }
}
```

- `POST /integrations/mercado-libre/properties/:propertyId/publish`
  - Respuesta:

```json
{
  "message": "Propiedad publicada con exito.",
  "publication": {
    "publication_id": "MLM123456789",
    "permalink": "https://inmuebles.mercadolibre.com.mx/...",
    "status": "active",
    "last_synced_at": "2026-06-05T20:00:00.000Z",
    "last_error": null
  }
}
```

- `POST /integrations/mercado-libre/properties/:propertyId/sync`
  - Respuesta:

```json
{
  "message": "Propiedad sincronizada con exito.",
  "publication": {
    "publication_id": "MLM123456789",
    "permalink": "https://inmuebles.mercadolibre.com.mx/...",
    "status": "active",
    "last_synced_at": "2026-06-05T20:15:00.000Z",
    "last_error": null
  }
}
```

## Requisitos recomendados del backend

- Guardar credenciales OAuth por empresa o cuenta operativa.
- Guardar relacion entre `propertyId` del CRM y `publication_id` de Mercado Libre.
- Registrar `status`, `permalink`, `last_synced_at` y `last_error`.
- Tener transformador dedicado para Mercado Libre, no reutilizar el objeto crudo del CRM.
- Implementar logs de publicacion y sincronizacion.

## Campos que ya prepara el CRM

- titulo comercial
- categoria sugerida
- operacion base
- precio base
- descripcion compuesta
- imagenes
- contacto del asesor
- ubicacion
- atributos basicos

## Reglas actuales de readiness en CRM

- estatus publicable: `Disponible`
- operacion soportada:
  - `Venta`
  - `Renta`
  - `Preventa` como warning comercial
- minimo 5 imagenes
- descripcion recomendada de al menos 120 caracteres
- calle y municipio presentes
- categoria mapeada

## Archivos frontend relacionados

- `src/modules/properties/utils/mercadoLibre.ts`
- `src/modules/properties/services/mercadoLibre.api.ts`
- `src/modules/properties/store/useMercadoLibreStore.ts`
- `src/modules/properties/components/PropertyDetailView.tsx`
