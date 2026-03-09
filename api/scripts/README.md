# Scripts del API

## crear-datos-prueba.js

Script para crear datos de prueba en la base de datos.

### Uso

```bash
# Crear datos de prueba (preserva datos existentes)
node scripts/crear-datos-prueba.js

# Limpiar y crear datos de prueba
node scripts/crear-datos-prueba.js --clean
```

### Datos creados

**Tutores:**

- Email: `maria@example.com` | Password: `password123` | Alumnos: 3
- Email: `jose@example.com` | Password: `password123` | Alumnos: 2

**Profesor:**

- Email: `roberto@example.com` | Password: `password123`

**Alumnos:**

- Juan Pérez (UID001)
- María García (UID002)
- Pedro López (UID003)
- Ana Martínez (UID004)
- Carlos Rodríguez (UID005)

**Asistencias:**

- Registros de hoy (entradas y salidas)
- Registros de días anteriores

### Notas

- Las contraseñas se hashean automáticamente con bcrypt
- Los alumnos se asignan automáticamente a tutores
- Se crean asistencias de ejemplo para probar la app móvil
