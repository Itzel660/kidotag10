# Sistema de Autenticación - KidoTag API

## 🔐 Autenticación y Autorización

El sistema implementa autenticación JWT y control de acceso basado en roles para tutores y profesores.

## 📋 Roles y Permisos

### Tutores

- **Login**: Pueden iniciar sesión con email y password
- **Registro de devices**: Cada login puede registrar el dispositivo usado (web/mobile)
- **Acceso a alumnos**: Solo pueden ver/modificar información de sus alumnos asociados
- **Acceso a asistencias**: Solo pueden ver asistencias de sus alumnos
- **Sin acceso**: No pueden ver información de alumnos de otros tutores

### Profesores

- **Login**: Pueden iniciar sesión con email y password
- **Acceso completo**: Tienen acceso a todos los alumnos y asistencias
- **Gestión de grupos**: Pueden gestionar grupos y sus alumnos asociados

### Alumnos

- **Sin login**: Los alumnos NO tienen acceso al sistema
- **Registro de asistencia**: Se realiza mediante tarjetas NFC (sin autenticación)

## 🚀 Endpoints de Autenticación

### Login Tutor

```http
POST /api/v1/auth/login/tutor
Content-Type: application/json

{
  "email": "maria@example.com",
  "password": "password123",
  "deviceId": "device-abc-123",      // Opcional
  "deviceType": "web",                // Opcional: "web" o "mobile"
  "deviceName": "Chrome on Windows"   // Opcional
}
```

**Respuesta exitosa:**

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tipo": "tutor",
    "usuario": {
      "_id": "65f...",
      "nombre": "María González",
      "email": "maria@example.com",
      "telefono": "5551234567",
      "alumnos": [...],
      "cantidadDevices": 2
    }
  }
}
```

### Login Profesor

```http
POST /api/v1/auth/login/profesor
Content-Type: application/json

{
  "email": "carlos@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**

```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tipo": "profesor",
    "usuario": {
      "_id": "65f...",
      "nombre": "Carlos Ramírez",
      "email": "carlos@example.com",
      "telefono": "5559876543",
      "especialidad": "Matemáticas"
    }
  }
}
```

### Obtener Usuario Actual

```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

### Cambiar Contraseña

```http
PUT /api/v1/auth/cambiar-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "passwordActual": "password123",
  "passwordNuevo": "newpassword456"
}
```

## 🔑 Uso del Token JWT

Una vez que obtienes el token del login, debes incluirlo en el header `Authorization` de todas las peticiones protegidas:

```http
GET /api/v1/alumnos
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ejemplo con cURL:

```bash
# Login de tutor
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login/tutor \
  -H "Content-Type: application/json" \
  -d '{"email":"maria@example.com","password":"password123"}' \
  | jq -r '.data.token')

# Consultar alumnos (solo los del tutor)
curl http://localhost:3000/api/v1/alumnos \
  -H "Authorization: Bearer $TOKEN"

# Consultar asistencias (solo de los alumnos del tutor)
curl http://localhost:3000/api/v1/asistencias \
  -H "Authorization: Bearer $TOKEN"
```

### Ejemplo con JavaScript/Fetch:

```javascript
// Login
const loginResponse = await fetch(
  "http://localhost:3000/api/v1/auth/login/tutor",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "maria@example.com",
      password: "password123",
      deviceId: "web-session-123",
      deviceType: "web",
      deviceName: "Chrome Browser",
    }),
  },
);

const { data } = await loginResponse.json();
const token = data.token;

// Guardar token (localStorage, sessionStorage, etc.)
localStorage.setItem("token", token);

// Usar token en peticiones
const alumnosResponse = await fetch("http://localhost:3000/api/v1/alumnos", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const alumnos = await alumnosResponse.json();
```

## 🛡️ Endpoints Protegidos

### Alumnos

- `GET /api/v1/alumnos` - Listar alumnos (tutores solo ven sus alumnos) 🔒
- `GET /api/v1/alumnos/:id` - Obtener alumno (requiere autorización) 🔒
- `POST /api/v1/alumnos` - Crear alumno 🔒
- `PUT /api/v1/alumnos/:id` - Actualizar alumno (requiere autorización) 🔒
- `DELETE /api/v1/alumnos/:id` - Eliminar alumno (requiere autorización) 🔒

### Asistencias

- `GET /api/v1/asistencias` - Listar asistencias (tutores solo ven las de sus alumnos) 🔒
- `POST /api/v1/asistencias` - Registrar asistencia (ESP32 - sin auth) ✅

### Tutores

Todos los endpoints de tutores requieren autenticación 🔒

### Profesores

Todos los endpoints de profesores requieren autenticación 🔒

### Grupos

Todos los endpoints de grupos requieren autenticación 🔒

## 📝 Crear Usuarios

### Crear Tutor

```bash
curl -X POST http://localhost:3000/api/v1/tutores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María González",
    "email": "maria@example.com",
    "password": "password123",
    "telefono": "5551234567",
    "alumnos": []
  }'
```

### Crear Profesor

```bash
curl -X POST http://localhost:3000/api/v1/profesores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Ramírez",
    "email": "carlos@example.com",
    "password": "password123",
    "telefono": "5559876543",
    "especialidad": "Matemáticas"
  }'
```

**Nota**: Las contraseñas se hashean automáticamente antes de guardarse en la base de datos usando bcrypt.

## 🔐 Seguridad

1. **Passwords hasheados**: Se usa bcrypt con salt de 10 rounds
2. **JWT tokens**: Firmados con secret key configurable
3. **Expiración**: Los tokens expiran en 7 días (configurable)
4. **Control de acceso**: Middlewares verifican permisos antes de acceder a recursos
5. **Devices tracking**: Se registran los dispositivos donde el tutor inicia sesión

## ⚙️ Configuración

Variables de entorno en `.env`:

```env
JWT_SECRET=secret-key-kidotag-2026
JWT_EXPIRES_IN=7d
```

## 🔄 Flujo de Autenticación

### Para Web/Mobile (Tutor o Profesor):

1. **Login** → Enviar email y password → Recibir token JWT
2. **Guardar token** → Almacenar en localStorage/sessionStorage
3. **Incluir token** → Agregar header `Authorization: Bearer {token}` en cada petición
4. **Renovar token** → Hacer login nuevamente cuando expire (7 días)

### Para ESP32 (Registro de Asistencias):

1. **Sin autenticación** → El ESP32 no necesita login
2. **POST /api/v1/asistencias** → Enviar uidTarjeta directamente
3. **Sistema registra** → La asistencia se guarda automáticamente

## 📱 Gestión de Devices

Los tutores pueden tener múltiples dispositivos registrados:

```javascript
{
  "devices": [
    {
      "deviceId": "web-chrome-123",
      "deviceType": "web",
      "deviceName": "Chrome on Windows",
      "lastLogin": "2026-03-08T10:30:00Z",
      "isActive": true
    },
    {
      "deviceId": "mobile-app-456",
      "deviceType": "mobile",
      "deviceName": "Android App",
      "lastLogin": "2026-03-07T15:45:00Z",
      "isActive": true
    }
  ]
}
```

### Desactivar un Device:

```bash
DELETE /api/v1/tutores/:tutorId/devices/:deviceId
Authorization: Bearer {token}
```

## ⚠️ Códigos de Error

- `401` - No autenticado (token faltante o inválido)
- `403` - No autorizado (sin permisos para acceder al recurso)
- `404` - Usuario o recurso no encontrado

## 🧪 Testing con Swagger

La documentación Swagger en `http://localhost:3000/api-docs` incluye:

1. **Botón "Authorize"** → Ingresa el token JWT
2. **Try it out** → Prueba los endpoints protegidos
3. **Auto-incluye header** → Swagger agrega automáticamente el token en las peticiones

---

Para más información, consulta la documentación completa en `/api-docs`
