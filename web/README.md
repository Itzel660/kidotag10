# Kidotag - Sistema de Asistencias

Aplicación web desarrollada con React para gestionar asistencias mediante tarjetas NFC.

## Características

### Dashboard Overview
- Estadísticas en tiempo real
- Visualización de registros recientes
- Métricas de asistencia del día

### Asistencias Diarias
- Filtrado por fecha y grupo
- Vista detallada de entradas y salidas
- Estadísticas instantáneas

### Gestión de Alumnos
- Registro de nuevos alumnos con UID de tarjeta NFC
- Lista visual de alumnos registrados
- Búsqueda y filtrado

## Tecnologías Utilizadas

- **React 18.2**
- **FontAwesome** - Iconografía
- **LocalStorage** - Persistencia de datos de alumnos
- **Fetch API** - Conexión con backend

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Compilar para producción
npm run build
```

## Configuración

La aplicación se conecta al API en `http://localhost:3000/api/v1`. Para cambiar la URL, edita la constante `API_URL` en los componentes.

## Estructura del Proyecto

```
src/
├── components/
│   ├── Sidebar.js/css      # Navegación lateral
│   ├── Header.js/css       # Encabezado y búsqueda
│   ├── Overview.js/css     # Dashboard principal
│   ├── Asistencias.js/css  # Gestión de asistencias
│   └── Alumnos.js/css      # Gestión de alumnos
├── assets/
│   └── logo.svg            # Logo de Kidotag
├── App.js                  # Componente principal
├── App.css                 # Estilos globales
├── index.js                # Punto de entrada
└── index.css               # Variables CSS y reset
```

## Tema de Colores

- **Morado Oscuro**: `#1a0b2e` (Fondo principal)
- **Morado Secundario**: `#2d1b4e` (Sidebar)
- **Cyan**: `#00d9c0` (Acento principal)
- **Verde**: `#00ff9d` (Acento secundario)

## Uso

1. **Iniciar el API**: Asegúrate de que el servidor API esté corriendo en el puerto 3000
2. **Ejecutar la aplicación**: `npm start`
3. **Acceder**: Abre http://localhost:3000 en tu navegador

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm build` - Compila la aplicación para producción
- `npm test` - Ejecuta las pruebas
- `npm eject` - Expulsa la configuración de Create React App

## Licencia

MIT
