# 🚀 Inicio Rápido - Kidotag

## Pasos para ejecutar la aplicación

### 1. Instalar dependencias (solo la primera vez)
```bash
npm install
```

### 2. Iniciar el servidor de desarrollo
```bash
npm start
```

La aplicación se abrirá automáticamente en http://localhost:3000

### 3. Asegúrate de que el API esté corriendo
```bash
# En otra terminal, navega a la carpeta api
cd ../api
npm install
npm start
```

El API debe estar corriendo en http://localhost:3000

## Comandos disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run build` - Compila la aplicación para producción
- `npm test` - Ejecuta las pruebas

## Estructura de la aplicación

```
web/
├── public/              # Archivos públicos
│   └── index.html      # HTML principal
├── src/
│   ├── components/     # Componentes React
│   │   ├── Sidebar.js
│   │   ├── Header.js
│   │   ├── Overview.js
│   │   ├── Asistencias.js
│   │   └── Alumnos.js
│   ├── assets/
│   │   └── logo.svg    # Logo Kidotag
│   ├── App.js          # Componente principal
│   └── index.js        # Punto de entrada
└── package.json        # Dependencias
```

## Notas importantes

- La aplicación se conecta al API en `http://localhost:3000/api/v1`
- Los datos de alumnos se guardan en localStorage
- Los registros de asistencia se obtienen del API

## Diseño y Tema

- **Colores principales**: Morado oscuro (#1a0b2e) y Cyan (#00d9c0)
- **Sin emojis**: Solo iconos de FontAwesome
- **Diseño compacto**: Optimizado para usar menos espacio
- **Responsive**: Se adapta a diferentes tamaños de pantalla

## Solución de problemas

### Error de puerto ocupado
Si el puerto 3000 está ocupado, puedes cambiarlo:
- Windows: `set PORT=3001 && npm start`
- Mac/Linux: `PORT=3001 npm start`

### El API no responde
Verifica que el servidor API esté corriendo en el puerto 3000

### Dependencias faltantes
Ejecuta `npm install` nuevamente
