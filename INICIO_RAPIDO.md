# 🚀 Guía Rápida de Inicio - KidoTag

## 📋 Pasos para Probar la Integración

### 1️⃣ Configurar y Ejecutar el Backend (API)

```bash
cd api

# Instalar dependencias (si aún no lo hiciste)
npm install

# Iniciar la base de datos MongoDB (debe estar corriendo)
# Si usas MongoDB local, asegúrate de que esté activo

# Crear datos de prueba
node scripts/crear-datos-prueba.js --clean

# Iniciar el servidor
npm run dev
```

El servidor debería estar corriendo en `http://localhost:3000`

**Verificar:** Abre `http://localhost:3000/api-docs` en el navegador para ver la documentación Swagger.

### 2️⃣ Configurar la App Móvil

```bash
cd movil

# Instalar dependencias de Flutter
flutter pub get
```

### 3️⃣ Configurar la URL del API

Abre el archivo `movil/lib/config/api_config.dart` y configura la URL según tu dispositivo:

```dart
// Para Android Emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// Para iOS Simulator
static const String baseUrl = 'http://localhost:3000';

// Para dispositivo físico (misma red WiFi)
static const String baseUrl = 'http://192.168.X.X:3000'; // Usa tu IP local
```

**Encontrar tu IP local:**

En Windows:

```bash
ipconfig
```

Busca la dirección IPv4 (ej: 192.168.1.100)

En Mac/Linux:

```bash
ifconfig
```

Busca inet (ej: 192.168.1.100)

### 4️⃣ Ejecutar la App Móvil

```bash
# Asegúrate de tener un emulador/dispositivo conectado
flutter devices

# Ejecutar la app
flutter run
```

### 5️⃣ Probar el Login

Usa estas credenciales de prueba:

**Como Tutor:**

- Email: `maria@example.com`
- Password: `password123`
- Verás 3 alumnos asignados y sus asistencias

**Como Tutor (alternativo):**

- Email: `jose@example.com`
- Password: `password123`
- Verás 2 alumnos diferentes

**Como Profesor:**

- Email: `roberto@example.com`
- Password: `password123`
- Verás todos los alumnos

---

## 🔍 Verificar que Todo Funciona

### Backend (API)

1. **Swagger Docs:** http://localhost:3000/api-docs
2. **Estado del servidor:** http://localhost:3000/api/v1/estado

### App Móvil

1. **Login:** Intenta iniciar sesión con las credenciales de prueba
2. **Ver alumnos:** Deberías ver la lista de alumnos del tutor
3. **Ver asistencias:** Deberías ver las asistencias de hoy
4. **Pull to refresh:** Desliza hacia abajo para recargar datos

### Probar con cURL

```bash
# 1. Login
curl -X POST http://localhost:3000/api/v1/auth/login/tutor \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria@example.com",
    "password": "password123",
    "deviceId": "test-device",
    "deviceType": "mobile",
    "deviceName": "Test Phone"
  }'

# Guarda el token que recibes

# 2. Obtener alumnos (reemplaza YOUR_TOKEN con el token del paso 1)
curl http://localhost:3000/api/v1/alumnos \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Obtener asistencias
curl http://localhost:3000/api/v1/asistencias \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🐛 Solución de Problemas

### "No hay conexión a internet" / "Connection refused"

**Problema:** La app móvil no puede conectarse al API

**Solución:**

1. Verifica que el servidor esté corriendo: `http://localhost:3000/api/v1/estado`
2. Si usas Android Emulator, usa `http://10.0.2.2:3000`
3. Si usas dispositivo físico, asegúrate de estar en la misma red WiFi
4. Desactiva el firewall temporalmente o permite la conexión en el puerto 3000

### Error 401 Unauthorized

**Problema:** El token expiró o es inválido

**Solución:**

1. Cierra sesión en la app
2. Vuelve a iniciar sesión
3. El token tiene validez de 7 días

### "No hay alumnos asignados"

**Problema:** El tutor no tiene alumnos

**Solución:**

1. Ejecuta nuevamente el script de datos de prueba:
   ```bash
   node scripts/crear-datos-prueba.js --clean
   ```

### La app no carga datos

**Problema:** La app muestra pantalla en blanco o no carga

**Solución:**

1. Verifica la URL del API en `api_config.dart`
2. Revisa los logs de Flutter: `flutter logs`
3. Verifica que el backend esté respondiendo

### Error de MongoDB

**Problema:** `MongooseError: connect ECONNREFUSED`

**Solución:**

1. Inicia MongoDB:
   - Windows: `net start MongoDB`
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongod`

---

## 📱 Funcionalidades Implementadas

✅ Login con email y contraseña (tutor/profesor)
✅ JWT authentication con almacenamiento seguro
✅ Registro automático de dispositivos
✅ Visualización de alumnos asignados al tutor
✅ Visualización de asistencias de hoy
✅ Pull to refresh para actualizar datos
✅ Logout con limpieza de datos
✅ Manejo de errores y estados de carga
✅ Filtrado automático (tutores solo ven sus alumnos)

---

## 🔄 Próximos Pasos

1. **Historial de asistencias:** Implementar vista detallada de asistencias por alumno
2. **Notificaciones:** Agregar alertas en tiempo real con Socket.IO
3. **Justificantes:** Funcionalidad para subir documentos
4. **Perfil de usuario:** Edición de datos personales
5. **Cambiar contraseña:** Implementar el flujo completo en la UI
6. **Modo offline:** Cachear datos para uso sin conexión

---

## 📚 Documentación Adicional

- [Documentación del API](/api/SWAGGER_DOCS.md)
- [Guía de Autenticación](/api/AUTENTICACION.md)
- [Plan de Integración Completo](/movil/PLAN_INTEGRACION_API.md)
- [Endpoints para Tutores](/movil/ENDPOINTS_TUTOR.md)
- [Guía de Implementación](/movil/README_IMPLEMENTACION.md)

---

## 💡 Tips

- **Desarrollo:** Usa `flutter run` con hot reload para ver cambios en tiempo real
- **Debug:** Usa `print()` en Dart o revisa los logs con `flutter logs`
- **API Testing:** Usa Postman o Thunder Client para probar endpoints
- **MongoDB:** Usa MongoDB Compass para visualizar los datos

---

¡Todo listo para comenzar a desarrollar! 🎉
