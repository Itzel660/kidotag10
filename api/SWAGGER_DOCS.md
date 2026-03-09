# Documentación Swagger - KidoTag API

## 📚 Instalación

Para instalar las nuevas dependencias de Swagger, ejecuta:

```bash
cd api
npm install
```

Esto instalará:

- `swagger-jsdoc`: Para generar la especificación OpenAPI desde los comentarios JSDoc
- `swagger-ui-express`: Para servir la interfaz de Swagger UI

## 🚀 Iniciar el servidor

```bash
npm start
# o en modo desarrollo
npm run dev
```

## 📖 Acceder a la documentación

Una vez que el servidor esté ejecutándose, puedes acceder a la documentación Swagger en:

### 🌐 URL de Swagger UI

```
http://localhost:3000/api-docs
```

O si estás accediendo desde otra máquina en la red:

```
http://0.0.0.0:3000/api-docs
```

## 🎯 Características de Swagger UI

La interfaz de Swagger te permite:

- ✅ Ver todos los endpoints disponibles organizados por tags
- ✅ Ver los esquemas de datos (Alumno, Tutor, Profesor, Grupo, etc.)
- ✅ Probar los endpoints directamente desde el navegador
- ✅ Ver ejemplos de request y response
- ✅ Ver los códigos de respuesta HTTP posibles
- ✅ Exportar la especificación OpenAPI en formato JSON o YAML

## 📋 Endpoints Documentados

### Estado

- `GET /api/v1/estado` - Verificar estado del sistema

### Alumnos

- `POST /api/v1/alumnos` - Crear alumno
- `GET /api/v1/alumnos` - Listar alumnos
- `GET /api/v1/alumnos/:id` - Obtener alumno
- `PUT /api/v1/alumnos/:id` - Actualizar alumno
- `DELETE /api/v1/alumnos/:id` - Eliminar alumno

### Asistencias

- `POST /api/v1/asistencias` - Registrar asistencia
- `GET /api/v1/asistencias` - Listar asistencias

### Tutores

- `POST /api/v1/tutores` - Crear tutor
- `GET /api/v1/tutores` - Listar tutores
- `GET /api/v1/tutores/:id` - Obtener tutor
- `PUT /api/v1/tutores/:id` - Actualizar tutor
- `DELETE /api/v1/tutores/:id` - Eliminar tutor
- `POST /api/v1/tutores/:id/alumnos` - Agregar alumno al tutor
- `DELETE /api/v1/tutores/:id/alumnos/:alumnoId` - Remover alumno del tutor
- `GET /api/v1/tutores/:id/asistencias` - Obtener asistencias de alumnos del tutor
- `POST /api/v1/tutores/:id/devices` - Registrar device
- `DELETE /api/v1/tutores/:id/devices/:deviceId` - Desactivar device

### Profesores

- `POST /api/v1/profesores` - Crear profesor
- `GET /api/v1/profesores` - Listar profesores
- `GET /api/v1/profesores/:id` - Obtener profesor
- `PUT /api/v1/profesores/:id` - Actualizar profesor
- `DELETE /api/v1/profesores/:id` - Eliminar profesor
- `GET /api/v1/profesores/:id/grupos` - Obtener grupos del profesor

### Grupos

- `POST /api/v1/grupos` - Crear grupo
- `GET /api/v1/grupos` - Listar grupos
- `GET /api/v1/grupos/:id` - Obtener grupo
- `PUT /api/v1/grupos/:id` - Actualizar grupo
- `DELETE /api/v1/grupos/:id` - Eliminar grupo
- `POST /api/v1/grupos/:id/alumnos` - Agregar alumno al grupo
- `DELETE /api/v1/grupos/:id/alumnos/:alumnoId` - Remover alumno del grupo

## 🔧 Probando los endpoints

### Desde Swagger UI:

1. Abre `http://localhost:3000/api-docs`
2. Haz clic en el endpoint que deseas probar
3. Haz clic en "Try it out"
4. Completa los parámetros requeridos
5. Haz clic en "Execute"
6. Verás la respuesta del servidor

### Ejemplo con cURL:

```bash
# Crear un alumno
curl -X POST http://localhost:3000/api/v1/alumnos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan Pérez","uidTarjeta":"A1B2C3D4"}'

# Listar todos los alumnos
curl http://localhost:3000/api/v1/alumnos

# Crear un tutor
curl -X POST http://localhost:3000/api/v1/tutores \
  -H "Content-Type: application/json" \
  -d '{"nombre":"María González","email":"maria@example.com","password":"pass123"}'
```

## 📱 Estructura de Respuestas

Todas las respuestas siguen este formato:

### Éxito:

```json
{
  "ok": true,
  "data": { ... }
}
```

### Error:

```json
{
  "ok": false,
  "error": {
    "codigo": "ERROR_CODE",
    "mensaje": "Mensaje descriptivo del error"
  }
}
```

## 🎨 Personalización

La configuración de Swagger se encuentra en:

- `src/config/swagger.js` - Configuración principal
- Archivos de rutas en `src/routes/*.js` - Documentación JSDoc de cada endpoint

Para agregar documentación a un nuevo endpoint, usa comentarios JSDoc siguiendo el formato OpenAPI 3.0:

```javascript
/**
 * @swagger
 * /api/v1/recurso:
 *   get:
 *     summary: Descripción del endpoint
 *     tags: [NombreTag]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 */
router.get("/", controller.metodo);
```

## 📞 Soporte

Para más información sobre la especificación OpenAPI:

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
