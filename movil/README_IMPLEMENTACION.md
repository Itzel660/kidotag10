# Integración del API con la App Móvil - KidoTag

## 🚀 Archivos Creados

Se han creado los siguientes archivos base para la integración con el API:

### 📁 Configuración

- `lib/config/api_config.dart` - Configuración de URLs y endpoints del API

### 📦 Modelos

- `lib/models/tutor.dart` - Modelo de Tutor y Device
- `lib/models/alumno.dart` - Modelo de Alumno
- `lib/models/asistencia.dart` - Modelo de Asistencia y helper AsistenciaDia
- `lib/models/api_response.dart` - Respuesta genérica del API

### 🔧 Servicios

- `lib/services/storage_service.dart` - Almacenamiento de JWT y datos de usuario
- `lib/services/auth_service.dart` - Autenticación (login, logout, cambio de contraseña)
- `lib/services/alumno_service.dart` - Operaciones CRUD de alumnos
- `lib/services/asistencia_service.dart` - Consulta de asistencias con filtros

---

## 📋 Pasos para Implementar

### 1️⃣ Instalar Dependencias

Ejecuta el siguiente comando en la terminal:

```bash
cd movil
flutter pub get
```

Esto instalará las siguientes dependencias que ya se agregaron al `pubspec.yaml`:

- `http` - Cliente HTTP para peticiones al API
- `provider` - State management
- `shared_preferences` - Almacenamiento local simple
- `flutter_secure_storage` - Almacenamiento seguro (JWT)
- `device_info_plus` - Información del dispositivo

### 2️⃣ Configurar la URL del API

Abre `lib/config/api_config.dart` y ajusta la URL base según tu entorno:

```dart
// Para Android Emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// Para iOS Simulator
static const String baseUrl = 'http://localhost:3000';

// Para dispositivo físico (misma red WiFi)
static const String baseUrl = 'http://192.168.X.X:3000'; // Cambia por tu IP local

// Para producción
static const String baseUrl = 'https://api.kidotag.com';
```

### 3️⃣ Crear los Providers (State Management)

Crea el archivo `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/tutor.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  Tutor? _tutor;
  bool _isLoading = false;
  String? _error;

  Tutor? get tutor => _tutor;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _tutor != null;

  /// Login de tutor
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _authService.loginTutor(
      email: email,
      password: password,
    );

    _isLoading = false;

    if (response.isSuccess) {
      _tutor = Tutor.fromJson(response.data!['tutor']);
      notifyListeners();
      return true;
    } else {
      _error = response.error?.mensaje;
      notifyListeners();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    await _authService.logout();
    _tutor = null;
    _error = null;
    notifyListeners();
  }

  /// Verificar sesión guardada
  Future<void> checkAuthentication() async {
    final isAuth = await _authService.isAuthenticated();
    if (isAuth) {
      final response = await _authService.getUserInfo();
      if (response.isSuccess) {
        _tutor = Tutor.fromJson(response.data!['usuario']);
        notifyListeners();
      }
    }
  }
}
```

Crea el archivo `lib/providers/alumno_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/alumno.dart';
import '../services/alumno_service.dart';

class AlumnoProvider with ChangeNotifier {
  final AlumnoService _alumnoService = AlumnoService();

  List<Alumno> _alumnos = [];
  bool _isLoading = false;
  String? _error;

  List<Alumno> get alumnos => _alumnos;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Cargar alumnos
  Future<void> loadAlumnos() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _alumnoService.getAlumnos();

    _isLoading = false;

    if (response.isSuccess) {
      _alumnos = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }

  /// Buscar alumno por ID
  Alumno? getAlumnoById(String id) {
    try {
      return _alumnos.firstWhere((a) => a.id == id);
    } catch (e) {
      return null;
    }
  }
}
```

Crea el archivo `lib/providers/asistencia_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/asistencia.dart';
import '../services/asistencia_service.dart';

class AsistenciaProvider with ChangeNotifier {
  final AsistenciaService _asistenciaService = AsistenciaService();

  List<Asistencia> _asistencias = [];
  bool _isLoading = false;
  String? _error;

  List<Asistencia> get asistencias => _asistencias;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Cargar asistencias de hoy
  Future<void> loadAsistenciasHoy() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistenciasHoy();

    _isLoading = false;

    if (response.isSuccess) {
      _asistencias = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }

  /// Cargar asistencias de un alumno
  Future<void> loadAsistenciasByAlumno(String uidTarjeta) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistenciasByAlumno(
      uidTarjeta: uidTarjeta,
    );

    _isLoading = false;

    if (response.isSuccess) {
      _asistencias = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }

  /// Cargar asistencias del mes
  Future<void> loadAsistenciasMes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistenciasMes();

    _isLoading = false;

    if (response.isSuccess) {
      _asistencias = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }
}
```

### 4️⃣ Configurar el main.dart con Providers

Actualiza `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/alumno_provider.dart';
import 'providers/asistencia_provider.dart';
import 'pages/login.dart'; // Tu página de login
import 'pages/home_tutor.dart'; // Tu página principal del tutor

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AlumnoProvider()),
        ChangeNotifierProvider(create: (_) => AsistenciaProvider()),
      ],
      child: MaterialApp(
        title: 'KidoTag',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    // Verificar si hay sesión guardada
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().checkAuthentication();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (authProvider.isAuthenticated) {
          return const HomeTutor(); // Tu página principal
        } else {
          return const LoginPage(); // Tu página de login
        }
      },
    );
  }
}
```

### 5️⃣ Actualizar la Página de Login

Ejemplo básico de implementación en tu página de login:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();

    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!mounted) return;

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Error al iniciar sesión'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'KidoTag',
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 48),
                TextFormField(
                  controller: _emailController,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Ingresa tu email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    border: OutlineInputBorder(),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Ingresa tu contraseña';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: authProvider.isLoading ? null : _handleLogin,
                    child: authProvider.isLoading
                        ? const CircularProgressIndicator()
                        : const Text('Iniciar Sesión'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

### 6️⃣ Cargar Alumnos y Asistencias en Home

Ejemplo de cómo cargar datos en tu página principal:

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/alumno_provider.dart';
import '../providers/asistencia_provider.dart';

class HomeTutor extends StatefulWidget {
  const HomeTutor({super.key});

  @override
  State<HomeTutor> createState() => _HomeTutorState();
}

class _HomeTutorState extends State<HomeTutor> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final alumnoProvider = context.read<AlumnoProvider>();
    final asistenciaProvider = context.read<AsistenciaProvider>();

    await Future.wait([
      alumnoProvider.loadAlumnos(),
      asistenciaProvider.loadAsistenciasHoy(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final alumnoProvider = context.watch<AlumnoProvider>();
    final asistenciaProvider = context.watch<AsistenciaProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, ${authProvider.tutor?.nombre ?? ""}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              authProvider.logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Resumen de alumnos
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Mis Alumnos',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (alumnoProvider.isLoading)
                      const Center(child: CircularProgressIndicator())
                    else if (alumnoProvider.error != null)
                      Text('Error: ${alumnoProvider.error}')
                    else
                      Text('Total: ${alumnoProvider.alumnos.length}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Asistencias de hoy
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Asistencias de Hoy',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (asistenciaProvider.isLoading)
                      const Center(child: CircularProgressIndicator())
                    else if (asistenciaProvider.error != null)
                      Text('Error: ${asistenciaProvider.error}')
                    else if (asistenciaProvider.asistencias.isEmpty)
                      const Text('No hay asistencias hoy')
                    else
                      ...asistenciaProvider.asistencias.map((asistencia) {
                        final alumno = alumnoProvider.getAlumnoById(asistencia.uidTarjeta);
                        return ListTile(
                          leading: Icon(
                            asistencia.esEntrada ? Icons.login : Icons.logout,
                            color: asistencia.esEntrada ? Colors.green : Colors.red,
                          ),
                          title: Text(alumno?.nombre ?? asistencia.nombre),
                          subtitle: Text(asistencia.horaFormateada),
                          trailing: Chip(
                            label: Text(asistencia.tipo),
                          ),
                        );
                      }),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🔐 Datos de Prueba

Para probar la autenticación, crea un tutor en el backend:

```bash
# En la raíz del proyecto api/
npm run dev

# En otra terminal, usar este endpoint con Postman o cURL:
POST http://localhost:3000/api/v1/tutores
Content-Type: application/json

{
  "nombre": "María García",
  "email": "maria@example.com",
  "password": "password123",
  "telefono": "555-1234",
  "alumnos": []
}
```

Luego usa estas credenciales en la app:

- Email: `maria@example.com`
- Password: `password123`

---

## 📚 Recursos Adicionales

- [Documentación del API](/api/SWAGGER_DOCS.md)
- [Endpoints para Tutores](/movil/ENDPOINTS_TUTOR.md)
- [Plan de Integración Completo](/movil/PLAN_INTEGRACION_API.md)
- [Guía de Autenticación](/api/AUTENTICACION.md)

---

## ✅ Checklist de Implementación

- [ ] 1. Instalar dependencias con `flutter pub get`
- [ ] 2. Configurar URL del API en `api_config.dart`
- [ ] 3. Crear los 3 providers (auth, alumno, asistencia)
- [ ] 4. Actualizar `main.dart` con MultiProvider
- [ ] 5. Actualizar la página de login para usar AuthProvider
- [ ] 6. Actualizar la página principal para cargar alumnos y asistencias
- [ ] 7. Crear un tutor de prueba en el backend
- [ ] 8. Probar login en la app móvil
- [ ] 9. Verificar que se cargan alumnos correctamente
- [ ] 10. Verificar que se cargan asistencias correctamente

---

## 🐛 Troubleshooting

### Error de conexión en Android Emulator

Usa `10.0.2.2` en lugar de `localhost`:

```dart
static const String baseUrl = 'http://10.0.2.2:3000';
```

### Error "No hay sesión activa"

Verifica que el token se esté guardando correctamente en `storage_service.dart`.

### Error 401 Unauthorized

El token puede haber expirado (dura 7 días). Haz logout y vuelve a hacer login.

### No se cargan los alumnos del tutor

Verifica que el tutor tenga alumnos asignados usando el endpoint:

```
POST /api/v1/tutores/{tutorId}/alumnos
```

---

¡Implementación lista! 🎉
