# Endpoints del API para App Móvil - Tutor

## 🔐 BASE URL

- **Desarrollo Local**: `http://10.0.2.2:3000` (Android Emulator)
- **Dispositivo Físico**: `http://[TU_IP_LOCAL]:3000`

---

## 📋 ENDPOINTS DISPONIBLES PARA TUTORES

### 1️⃣ AUTENTICACIÓN

#### Login de Tutor

```http
POST /api/v1/auth/login/tutor
Content-Type: application/json

Body:
{
  "email": "maria@example.com",
  "password": "password123",
  "deviceId": "android-device-unique-id",    // Opcional
  "deviceType": "mobile",                     // Opcional: "web" o "mobile"
  "deviceName": "Samsung Galaxy S21"          // Opcional
}

Response 200:
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tipo": "tutor",
    "usuario": {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "nombre": "María González",
      "email": "maria@example.com",
      "telefono": "5551234567",
      "alumnos": [
        {
          "_id": "65f1...",
          "nombre": "Juan Pérez",
          "uidTarjeta": "A1B2C3D4"
        },
        {
          "_id": "65f2...",
          "nombre": "Ana López",
          "uidTarjeta": "E5F6G7H8"
        }
      ],
      "cantidadDevices": 2
    }
  }
}

Response 401:
{
  "ok": false,
  "error": {
    "codigo": "CREDENCIALES_INVALIDAS",
    "mensaje": "Email o contraseña incorrectos"
  }
}
```

#### Obtener Usuario Actual

```http
GET /api/v1/auth/me
Authorization: Bearer {token}

Response 200:
{
  "ok": true,
  "data": {
    "tipo": "tutor",
    "usuario": {
      "_id": "65f1...",
      "nombre": "María González",
      "email": "maria@example.com",
      "telefono": "5551234567",
      "alumnos": [...],
      "activo": true
    }
  }
}
```

#### Cambiar Contraseña

```http
PUT /api/v1/auth/cambiar-password
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "passwordActual": "password123",
  "passwordNuevo": "newpassword456"
}

Response 200:
{
  "ok": true,
  "mensaje": "Password actualizado correctamente"
}
```

---

### 2️⃣ ALUMNOS

#### Listar Alumnos del Tutor

```http
GET /api/v1/alumnos
Authorization: Bearer {token}

Response 200:
{
  "ok": true,
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "nombre": "Juan Pérez",
      "uidTarjeta": "A1B2C3D4",
      "createdAt": "2026-03-01T10:30:00.000Z",
      "updatedAt": "2026-03-01T10:30:00.000Z"
    },
    {
      "_id": "65f2...",
      "nombre": "Ana López",
      "uidTarjeta": "E5F6G7H8",
      "createdAt": "2026-03-02T11:00:00.000Z",
      "updatedAt": "2026-03-02T11:00:00.000Z"
    }
  ]
}
```

**Nota**: El tutor solo verá los alumnos que tiene asociados. El filtrado es automático en el backend.

#### Obtener Detalle de un Alumno

```http
GET /api/v1/alumnos/{id}
Authorization: Bearer {token}

Params:
- id: ID del alumno

Response 200:
{
  "ok": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "nombre": "Juan Pérez",
    "uidTarjeta": "A1B2C3D4",
    "createdAt": "2026-03-01T10:30:00.000Z",
    "updatedAt": "2026-03-01T10:30:00.000Z"
  }
}

Response 403:
{
  "ok": false,
  "error": {
    "codigo": "ACCESO_DENEGADO",
    "mensaje": "No tienes permiso para acceder a este alumno"
  }
}
```

**Nota**: El tutor solo puede acceder a los detalles de sus alumnos asociados.

---

### 3️⃣ ASISTENCIAS

#### Listar Asistencias (de los alumnos del tutor)

```http
GET /api/v1/asistencias
Authorization: Bearer {token}

Query Params (opcionales):
- fecha: YYYY-MM-DD (ejemplo: 2026-03-08)

Ejemplos:
GET /api/v1/asistencias
GET /api/v1/asistencias?fecha=2026-03-08

Response 200:
{
  "ok": true,
  "data": [
    {
      "uidTarjeta": "A1B2C3D4",
      "nombre": "Juan Pérez",
      "tipo": "entrada",
      "fechaHora": "2026-03-08T07:30:15.000Z"
    },
    {
      "uidTarjeta": "A1B2C3D4",
      "nombre": "Juan Pérez",
      "tipo": "salida",
      "fechaHora": "2026-03-08T13:45:30.000Z"
    },
    {
      "uidTarjeta": "E5F6G7H8",
      "nombre": "Ana López",
      "tipo": "entrada",
      "fechaHora": "2026-03-08T07:28:00.000Z"
    }
  ]
}
```

**Nota**: El tutor solo verá asistencias de sus alumnos. El filtrado es automático.

#### Obtener Asistencias Detalladas del Tutor

```http
GET /api/v1/tutores/{tutorId}/asistencias
Authorization: Bearer {token}

Params:
- tutorId: ID del tutor

Query Params (opcionales):
- fechaInicio: YYYY-MM-DD
- fechaFin: YYYY-MM-DD

Ejemplos:
GET /api/v1/tutores/65f1.../asistencias
GET /api/v1/tutores/65f1.../asistencias?fechaInicio=2026-03-01&fechaFin=2026-03-08

Response 200:
{
  "ok": true,
  "data": {
    "tutor": {
      "_id": "65f1...",
      "nombre": "María González",
      "email": "maria@example.com"
    },
    "alumnos": [
      {
        "_id": "65f1...",
        "nombre": "Juan Pérez",
        "uidTarjeta": "A1B2C3D4"
      },
      {
        "_id": "65f2...",
        "nombre": "Ana López",
        "uidTarjeta": "E5F6G7H8"
      }
    ],
    "asistencias": [
      {
        "alumno": {
          "_id": "65f1...",
          "nombre": "Juan Pérez",
          "uidTarjeta": "A1B2C3D4"
        },
        "fecha": "2026-03-08T07:30:15.000Z",
        "_id": "65f..."
      }
    ]
  }
}
```

---

### 4️⃣ GESTIÓN DE DEVICES

#### Registrar un Nuevo Device

```http
POST /api/v1/tutores/{tutorId}/devices
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "deviceId": "android-unique-id-123",
  "deviceType": "mobile",
  "deviceName": "Samsung Galaxy S21"
}

Response 200:
{
  "ok": true,
  "data": {
    "_id": "65f...",
    "nombre": "María González",
    "devices": [
      {
        "deviceId": "android-unique-id-123",
        "deviceType": "mobile",
        "deviceName": "Samsung Galaxy S21",
        "lastLogin": "2026-03-08T10:00:00.000Z",
        "isActive": true
      }
    ]
  }
}
```

#### Desactivar un Device

```http
DELETE /api/v1/tutores/{tutorId}/devices/{deviceId}
Authorization: Bearer {token}

Response 200:
{
  "ok": true,
  "data": { ... }
}
```

---

## 🔒 CÓDIGOS DE RESPUESTA HTTP

### Exitosos:

- **200 OK**: Petición exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Petición exitosa sin contenido de respuesta

### Errores del Cliente:

- **400 Bad Request**: Datos inválidos o incompletos
- **401 Unauthorized**: No autenticado (token faltante o inválido)
- **403 Forbidden**: No autorizado (sin permisos para el recurso)
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: email duplicado)

### Errores del Servidor:

- **500 Internal Server Error**: Error interno del servidor

---

## 📱 FLUJO DE LA APP MÓVIL

### 1. Inicio de Sesión:

```
LoginPage
  ↓ (email + password)
POST /api/v1/auth/login/tutor
  ↓ (recibe token)
Guardar token en FlutterSecureStorage
  ↓
Navegar a HomeTutor
```

### 2. Cargar Alumnos:

```
HomeTutor
  ↓
GET /api/v1/alumnos
  ↓ (lista de alumnos del tutor)
Mostrar tarjetas de alumnos
```

### 3. Ver Historial de Asistencias:

```
HistorialAsistencia
  ↓
GET /api/v1/asistencias?fecha=YYYY-MM-DD
  ↓ (lista de asistencias)
Agrupar por fecha
Mostrar entrada/salida
```

### 4. Ver Detalle de Alumno:

```
DetalleAlumno (alumnoId)
  ↓
GET /api/v1/alumnos/{alumnoId}
  ↓
GET /api/v1/asistencias (filtrado por alumno)
  ↓
Mostrar información y asistencias
```

---

## 🧪 DATOS DE PRUEBA

### Crear Tutor en el Backend:

```bash
curl -X POST http://localhost:3000/api/v1/tutores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María González",
    "email": "maria@example.com",
    "password": "password123",
    "telefono": "5551234567"
  }'
```

### Crear Alumno:

```bash
curl -X POST http://localhost:3000/api/v1/alumnos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "uidTarjeta": "A1B2C3D4"
  }'
```

### Asociar Alumno al Tutor:

```bash
curl -X POST http://localhost:3000/api/v1/tutores/{tutorId}/alumnos \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "alumnoId": "{alumnoId}"
  }'
```

### Probar Login en la App:

- Email: `maria@example.com`
- Password: `password123`

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Token JWT**: Se debe incluir en el header `Authorization: Bearer {token}` en todas las peticiones protegidas

2. **Filtrado Automático**: Los tutores solo ven información de sus alumnos asociados, el filtrado es automático en el backend

3. **Expiración del Token**: Los tokens expiran en 7 días, después el usuario debe volver a hacer login

4. **Device Info**: Es opcional en el login, pero recomendado para tracking de dispositivos

5. **Formato de Fechas**: Usar formato ISO 8601 (YYYY-MM-DD) para fechas en query params

6. **Zona Horaria**: Las fechas se guardan en UTC, considerar conversión según zona horaria local

7. **Límite de Resultados**:
   - Sin filtro de fecha: últimos 50 registros
   - Con filtro de fecha: hasta 1000 registros

---

## 📊 ESTRUCTURA DE DATOS A MOSTRAR EN LA APP

### Pantalla Principal (HomeTutor):

- Nombre del tutor
- Lista de alumnos con:
  - Nombre
  - Última asistencia (entrada/salida)
  - Estado (presente/ausente hoy)

### Historial de Asistencias:

- Agrupado por fecha
- Por cada día mostrar:
  - Fecha
  - Lista de entradas/salidas
  - Hora de entrada
  - Hora de salida
  - Estado (asistió/no asistió)

### Detalle de Alumno:

- Información del alumno
- Historial de asistencias del alumno
- Gráfica de asistencias (opcional)
- Botón para ver más detalles

---

**Documentación completa en**: `PLAN_INTEGRACION_API.md`
