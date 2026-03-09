# Configuración de Variables de Entorno - Web App

## Variables Disponibles

### `REACT_APP_API_URL`
URL base del API REST.

**Valores comunes:**
- Desarrollo local: `http://localhost:3000/api/v1`
- Desarrollo en red local: `http://192.168.X.X:3000/api/v1`
- Producción: `https://api.kidotag.com/api/v1`

### `REACT_APP_SOCKET_URL`
URL para conexiones WebSocket (Socket.IO).

**Valores comunes:**
- Desarrollo local: `http://localhost:3000`
- Desarrollo en red local: `http://192.168.X.X:3000`
- Producción: `https://api.kidotag.com`

---

## Configuración

### 1. Configurar .env

Copia `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y ajusta las URLs según tu entorno:

```bash
# Desarrollo local
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000

# O desarrollo en red local (para probar desde otros dispositivos)
REACT_APP_API_URL=http://192.168.1.100:3000/api/v1
REACT_APP_SOCKET_URL=http://192.168.1.100:3000
```

### 2. Reiniciar el Servidor

Después de cambiar las variables de entorno, reinicia el servidor:

```bash
npm start
```

---

## Uso en Componentes

### Opción 1: Usar helpers de api.config.js (Recomendado)

```javascript
import { apiGet, apiPost, apiPut, apiDelete } from '../config/api.config';

// GET
const datos = await apiGet('alumnos');

// POST
const resultado = await apiPost('alumnos', { nombre: 'Juan', uidTarjeta: 'UID001' });

// PUT
const actualizado = await apiPut('alumnos/123', { nombre: 'Juan Pérez' });

// DELETE
const eliminado = await apiDelete('alumnos/123');
```

### Opción 2: Usar getApiUrl directamente

```javascript
import { getApiUrl, getAuthHeaders } from '../config/api.config';

const response = await fetch(getApiUrl('alumnos'), {
  method: 'GET',
  headers: getAuthHeaders(),
});
```

### Opción 3: Acceder directamente a las variables

```javascript
const apiUrl = process.env.REACT_APP_API_URL;
const socketUrl = process.env.REACT_APP_SOCKET_URL;
```

---

## Socket.IO

Para usar Socket.IO con la configuración:

```javascript
import io from 'socket.io-client';
import config from '../config/api.config';

const socket = io(config.socketUrl);

socket.on('connect', () => {
  console.log('Conectado al servidor');
});
```

---

## Notas Importantes

1. **Prefijo REACT_APP_**: Las variables de entorno en React DEBEN comenzar con `REACT_APP_` para ser accesibles en el cliente.

2. **Reinicio necesario**: Después de cambiar el `.env`, debes reiniciar el servidor de desarrollo.

3. **No subir .env a Git**: El archivo `.env` está en `.gitignore` y no debe subirse al repositorio.

4. **Variables públicas**: Las variables `REACT_APP_*` son públicas y están incluidas en el bundle del cliente. No pongas información sensible aquí.

---

## Troubleshooting

### Error: "process.env.REACT_APP_API_URL is undefined"

**Solución:**
1. Verifica que la variable esté en `.env` con el prefijo `REACT_APP_`
2. Reinicia el servidor de desarrollo
3. Verifica que estés importando correctamente el config

### Error: "CORS error" o "Network error"

**Solución:**
1. Verifica que el backend esté corriendo
2. Verifica que la URL del API sea correcta
3. Si usas dispositivo físico, usa la IP local en lugar de localhost

---

## Ejemplo Completo

**`.env`:**
```bash
PORT=3001
BROWSER=none
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000
```

**Componente:**
```javascript
import React, { useEffect, useState } from 'react';
import { apiGet } from '../config/api.config';

const MiComponente = () => {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resultado = await apiGet('alumnos');
        if (resultado.ok) {
          setDatos(resultado.data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    cargarDatos();
  }, []);

  return <div>{/* Tu UI aquí */}</div>;
};
```

---

¡Configuración lista! 🎉
