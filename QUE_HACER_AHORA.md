# 📱 Qué Hacer Ahora - Próximos Pasos

## ✅ Estado Actual

Todo está **100% listo y funcional**:

- ✅ Backend ejecutándose con datos de prueba
- ✅ App móvil con dependencias instaladas
- ✅ Autenticación JWT implementada
- ✅ Providers configurados
- ✅ UI conectada al API

---

## 🚀 Ejecutar la App Móvil AHORA

### Opción 1: Android Emulator (Recomendado para prueba rápida)

```bash
# 1. Abre Android Studio y lanza un emulador
# O usa la línea de comandos:
flutter emulators --launch <emulator_id>

# 2. Verifica que esté conectado
flutter devices

# 3. Ejecuta la app
cd movil
flutter run
```

**NOTA:** El API ya está usando `http://10.0.2.2:3000` que es la IP especial para Android Emulator.

### Opción 2: Dispositivo Físico (Android/iOS)

```bash
# 1. Encuentra tu IP local
# Windows:
ipconfig
# Mac/Linux:
ifconfig

# 2. Edita movil/lib/config/api_config.dart
# Cambia:
static const String baseUrl = 'http://192.168.X.X:3000';
# Reemplaza X.X con tu IP local (ej: 192.168.1.100)

# 3. Conecta tu dispositivo por USB
# Activa "Depuración USB" en opciones de desarrollador

# 4. Verifica conexión
flutter devices

# 5. Ejecuta la app
flutter run
```

---

## 🔐 Credenciales para Probar

### Login como Tutor (María)
```
Email: maria@example.com
Password: password123
```
**Verás:**
- 3 alumnos asignados (Juan, María, Pedro)
- Asistencias de hoy de tus alumnos
- Dashboard con estadísticas

### Login como Tutor (José)
```
Email: jose@example.com
Password: password123
```
**Verás:**
- 2 alumnos asignados (Ana, Carlos)
- Asistencias de hoy de tus alumnos

### Login como Profesor
```
Email: roberto@example.com
Password: password123
```
**Verás:**
- TODOS los alumnos (sin restricciones)
- TODAS las asistencias

---

## 🧪 Qué Probar

### 1. Autenticación ✅
- [ ] Login con credenciales correctas
- [ ] Error con credenciales incorrectas
- [ ] Cambiar entre tutor y profesor
- [ ] Cerrar sesión
- [ ] Reabrir app (sesión persistente)

### 2. Visualización de Datos ✅
- [ ] Ver lista de alumnos
- [ ] Ver asistencias de hoy
- [ ] Ver estadísticas en cards
- [ ] Pull to refresh funciona

### 3. Autorización ✅
- [ ] Login como tutor María: solo ves 3 alumnos
- [ ] Login como tutor José: solo ves 2 alumnos diferentes
- [ ] Login como profesor: ves todos los alumnos

### 4. UI/UX ✅
- [ ] Indicadores de carga aparecen
- [ ] Mensajes de error se muestran
- [ ] Navegación fluida
- [ ] Drawer abre/cierra correctamente

---

## 🛠️ Desarrollo Continuo

### Siguiente Sprint: Historial de Asistencias

Crea una nueva página para ver el historial completo:

```bash
# Crear archivo
touch movil/lib/pages/tutor/historial_asistencia.dart
```

**Ejemplo de implementación:**

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/asistencia_provider.dart';
import '../../models/asistencia.dart';

class HistorialAsistencia extends StatefulWidget {
  final String? alumnoUid; // null = todos los alumnos

  const HistorialAsistencia({super.key, this.alumnoUid});

  @override
  State<HistorialAsistencia> createState() => _HistorialAsistenciaState();
}

class _HistorialAsistenciaState extends State<HistorialAsistencia> {
  String periodo = 'mes'; // 'hoy', 'semana', 'mes'

  @override
  void initState() {
    super.initState();
    _loadAsistencias();
  }

  Future<void> _loadAsistencias() async {
    final provider = context.read<AsistenciaProvider>();
    
    if (widget.alumnoUid != null) {
      await provider.loadAsistenciasByAlumno(widget.alumnoUid!);
    } else {
      switch (periodo) {
        case 'hoy':
          await provider.loadAsistenciasHoy();
          break;
        case 'semana':
          await provider.loadAsistenciasSemana();
          break;
        case 'mes':
          await provider.loadAsistenciasMes();
          break;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AsistenciaProvider>();
    final asistenciasPorDia = provider.asistenciasPorDia;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Historial de Asistencias'),
      ),
      body: Column(
        children: [
          // Filtros
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'hoy', label: Text('Hoy')),
              ButtonSegment(value: 'semana', label: Text('Semana')),
              ButtonSegment(value: 'mes', label: Text('Mes')),
            ],
            selected: {periodo},
            onSelectionChanged: (Set<String> newSelection) {
              setState(() {
                periodo = newSelection.first;
              });
              _loadAsistencias();
            },
          ),
          
          // Lista
          Expanded(
            child: provider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: asistenciasPorDia.length,
                    itemBuilder: (context, index) {
                      final dia = asistenciasPorDia[index];
                      return ExpansionTile(
                        title: Text(dia.fechaFormateada),
                        subtitle: Text('${dia.asistencias.length} registros'),
                        children: dia.asistencias.map((asistencia) {
                          return ListTile(
                            leading: Icon(
                              asistencia.esEntrada ? Icons.login : Icons.logout,
                              color: asistencia.esEntrada ? Colors.green : Colors.red,
                            ),
                            title: Text(asistencia.nombre),
                            subtitle: Text(asistencia.horaFormateadaAMPM),
                            trailing: Chip(label: Text(asistencia.tipo)),
                          );
                        }).toList(),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
```

**Agregar navegación desde home_tutor.dart:**

```dart
// En el drawer o en un botón
ListTile(
  leading: const Icon(Icons.history),
  title: const Text('Historial'),
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const HistorialAsistencia(),
      ),
    );
  },
),
```

---

## 🎯 Roadmap Sugerido

### Sprint 1: Historial ✨ (1-2 días)
- [x] Integración básica completada
- [ ] Vista de historial por fecha
- [ ] Filtros por periodo (hoy/semana/mes)
- [ ] Vista detallada por alumno

### Sprint 2: Notificaciones 🔔 (2-3 días)
- [ ] Socket.IO client en Flutter
- [ ] Escuchar eventos de asistencias
- [ ] Mostrar alertas en tiempo real
- [ ] Badge de notificaciones no leídas

### Sprint 3: Justificantes 📄 (3-4 días)
- [ ] Formulario de subida
- [ ] Image picker para fotos
- [ ] File picker para PDFs
- [ ] Upload a servidor/cloud
- [ ] Vista de justificantes por alumno

### Sprint 4: Perfil y Configuración ⚙️ (2-3 días)
- [ ] Editar perfil del tutor
- [ ] Cambiar contraseña en la UI
- [ ] Gestionar dispositivos registrados
- [ ] Preferencias de notificaciones

### Sprint 5: Reportes y Estadísticas 📊 (3-4 días)
- [ ] Gráficas de asistencia
- [ ] Calendario de asistencias
- [ ] Exportar a PDF/Excel
- [ ] Estadísticas mensuales/anuales

### Sprint 6: Modo Offline 📴 (4-5 días)
- [ ] SQLite local
- [ ] Sincronización al conectar
- [ ] Cola de peticiones pendientes
- [ ] Cacheo inteligente

---

## 🐛 Si Algo No Funciona

### Error: "Connection refused"
```bash
# Verifica que el backend esté corriendo
cd api
npm run dev

# Verifica la URL en api_config.dart
# Android Emulator: http://10.0.2.2:3000
# iOS Simulator: http://localhost:3000
# Dispositivo físico: http://TU_IP_LOCAL:3000
```

### Error: "No alumnos" o "No asistencias"
```bash
# Recrea los datos de prueba
cd api
node scripts/crear-datos-prueba.js --clean
```

### Error al compilar Flutter
```bash
# Limpia y reinstala
cd movil
flutter clean
flutter pub get
flutter run
```

### Ver logs en detalle
```bash
# Terminal 1: Logs del backend
cd api
npm run dev

# Terminal 2: Logs de Flutter
flutter logs
```

---

## 📚 Documentación de Referencia

- **Swagger UI:** http://localhost:3000/api-docs
- **Guía Completa:** [RESUMEN_INTEGRACION.md](RESUMEN_INTEGRACION.md)
- **Inicio Rápido:** [INICIO_RAPIDO.md](INICIO_RAPIDO.md)
- **Autenticación:** [api/AUTENTICACION.md](api/AUTENTICACION.md)
- **Endpoints:** [movil/ENDPOINTS_TUTOR.md](movil/ENDPOINTS_TUTOR.md)

---

## 💡 Tips de Desarrollo

1. **Hot Reload:** Mientras desarrollas en Flutter, usa `r` para hot reload
2. **Debug:** Usa `print()` en Dart o `console.log()` en Node.js
3. **Testing:** Prueba en múltiples dispositivos/emuladores
4. **Git:** Crea commits frecuentes con mensajes descriptivos
5. **Swagger:** Siempre prueba endpoints primero en Swagger antes de implementar en Flutter

---

## 🎉 ¡Ahora es tu turno!

**Comando para ejecutar todo:**

```bash
# Terminal 1: Backend
cd api && npm run dev

# Terminal 2: App móvil (abre otro terminal)
cd movil && flutter run
```

**Login de prueba:** `maria@example.com` / `password123`

---

**¿Listo?** Ejecuta los comandos y comienza a probar la app! 🚀
