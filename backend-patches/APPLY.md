# Parches del backend — Google OAuth (Etapa 3)

Estos archivos van en el repo `minilearn-teams`. No requieren gems adicionales.

## Checklist de aplicación

### 1. Copiar los dos archivos nuevos

```bash
# Desde la raíz del repo minilearn-teams:
cp backend-patches/google_controller.rb \
   apps/api/app/controllers/api/v1/auth/google_controller.rb

cp backend-patches/google_oauth_service.rb \
   apps/api/app/services/authentication/google_oauth_service.rb
```

### 2. Actualizar routes.rb

En `apps/api/config/routes.rb`, dentro del bloque `namespace :auth`, agrega:

```ruby
namespace :auth do
  resources :sessions,      only: [:create]
  resources :registrations, only: [:create]
  post :google, to: "auth/google#create"   # <-- NUEVA LÍNEA
end
```

### 3. Configurar variable de entorno

En producción (Heroku u otro):

```bash
heroku config:set GOOGLE_CLIENT_ID=tu_google_client_id_aqui
```

En desarrollo, agrega en `.env` (o usa `dotenv-rails`):
```
GOOGLE_CLIENT_ID=tu_google_client_id_aqui
```

### 4. Configurar CORS para la landing

En `apps/api/config/initializers/cors.rb`, asegúrate de permitir el dominio de la landing:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "https://teams.minilearn.app", "http://localhost:4173"
    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head]
  end
end
```

### 5. Actualizar la landing (minilearn-teams-web)

En `main.js`, reemplaza los valores de config:

```js
const ML = {
  apiBase:        'https://TU_API_URL',   // URL real de tu Rails API
  appUrl:         'https://TU_APP_URL',   // URL real del admin
  googleClientId: 'TU_GOOGLE_CLIENT_ID', // Mismo que en el backend
};
```

### 6. Cómo obtener el Google Client ID

1. Ve a https://console.cloud.google.com
2. Crea un proyecto o usa uno existente
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Authorized JavaScript origins: `https://teams.minilearn.app` (y `http://localhost:4173` para dev)
6. Authorized redirect URIs: no es necesario para el flujo client-side
7. Copia el Client ID generado

## Endpoint creado

```
POST /api/v1/auth/google
Content-Type: application/json

{
  "google": {
    "id_token": "<JWT del cliente Google>",
    "workspace_name": "Empresa S.A."    // requerido solo para nuevos usuarios
  }
}
```

**Respuesta exitosa (201):**
```json
{
  "token": "abc123...",
  "workspace_slug": "empresa-sa",
  "user": {
    "id": 42,
    "name": "Ana García",
    "email": "ana@empresa.com"
  }
}
```

**Respuesta de error (422):**
```json
{
  "error": "El token no está destinado a esta aplicación."
}
```

## Notas técnicas

- La verificación usa el endpoint `tokeninfo` de Google (sin gems extra).
- Para alto volumen, reemplazar por verificación local con JWKS (ver comentario en el service).
- Los usuarios creados vía Google tienen contraseña aleatoria que nunca usan.
- Un usuario que se registró con email puede luego usar Google con el mismo email — el service lo detecta y devuelve su sesión existente.
