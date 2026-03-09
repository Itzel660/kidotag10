# Configuración de la API

Este módulo centraliza la configuración y las funciones para comunicarse con el backend.

## Importación

```javascript
import config, { 
  getApiUrl, 
  getAuthHeaders,
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete 
} from '../config/api.config';
```

## Funciones Disponibles

### `apiGet(endpoint, token)`
Realizar petición GET.

```javascript
const datos = await apiGet('alumnos');
// GET http://localhost:3000/api/v1/alumnos
```

### `apiPost(endpoint, data, token)`
Realizar petición POST.

```javascript
const resultado = await apiPost('alumnos', {
  nombre: 'Juan Pérez',
  uidTarjeta: 'UID001'
});
```

### `apiPut(endpoint, data, token)`
Realizar petición PUT.

```javascript
const actualizado = await apiPut('alumnos/123', {
  nombre: 'Juan Pérez García'
});
```

### `apiDelete(endpoint, token)`
Realizar petición DELETE.

```javascript
const eliminado = await apiDelete('alumnos/123');
```

### `getApiUrl(endpoint)`
Obtener URL completa.

```javascript
const url = getApiUrl('alumnos');
// http://localhost:3000/api/v1/alumnos
```

### `getAuthHeaders(token)`
Obtener headers con autenticación.

```javascript
const headers = getAuthHeaders('mi-jwt-token');
// { 'Content-Type': 'application/json', 'Authorization': 'Bearer mi-jwt-token' }
```

## Configuración

Las URLs se configuran en el archivo `.env`:

```bash
REACT_APP_API_URL=http://localhost:3000/api/v1
REACT_APP_SOCKET_URL=http://localhost:3000
```

## Ejemplo Completo

```javascript
import React, { useState, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '../config/api.config';

const MiComponente = () => {
  const [items, setItems] = useState([]);

  // Cargar datos
  useEffect(() => {
    const cargar = async () => {
      const resultado = await apiGet('alumnos');
      if (resultado.ok) {
        setItems(resultado.data);
      }
    };
    cargar();
  }, []);

  // Crear nuevo
  const crear = async (data) => {
    const resultado = await apiPost('alumnos', data);
    if (resultado.ok) {
      console.log('Creado:', resultado.data);
    }
  };

  // Eliminar
  const eliminar = async (id) => {
    const resultado = await apiDelete(`alumnos/${id}`);
    if (resultado.ok) {
      console.log('Eliminado');
    }
  };

  return <div>{/* UI */}</div>;
};
```

## Socket.IO

Para usar WebSocket:

```javascript
import io from 'socket.io-client';
import config from '../config/api.config';

const socket = io(config.socketUrl);
```

Consulta [CONFIG_ENV.md](../../CONFIG_ENV.md) para más detalles.
