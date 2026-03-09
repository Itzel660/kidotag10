# Plan de Integración API - App Móvil KidoTag

## 📱 Estado Actual de la App Móvil

### Estructura Existente:

```
lib/
├── main.dart
└── pages/
    ├── login.dart (Login hardcodeado)
    ├── tutor/
    │   ├── home_tutor.dart
    │   ├── menu_tutor.dart
    │   ├── historial_asistencia.dart (datos mock)
    │   ├── notificacion.dart
    │   └── subir_justificante.dart
    └── profesor/
        ├── home_profesor.dart
        ├── menu_profesor.dart
        ├── alumnos.dart
        ├── notificacion_profesor.dart
        └── validar_justificante.dart
```

### Problemas Actuales:

- ❌ Login hardcodeado (usuario: 'tutor'/'profesor', password: '1234')
- ❌ No hay conexión con el API
- ❌ Datos de asistencia son mock/estáticos
- ❌ No hay gestión de estado
- ❌ No hay almacenamiento de token JWT
- ❌ No hay manejo de errores de red

## 🎯 Endpoints del API Necesarios para Tutores

### Autenticación:

- `POST /api/v1/auth/login/tutor` - Login del tutor
  - Request: `{ email, password, deviceId, deviceType, deviceName }`
  - Response: `{ token, tipo, usuario: { _id, nombre, email, alumnos, ... } }`

### Alumnos:

- `GET /api/v1/alumnos` - Listar alumnos del tutor (filtrado automático)
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok, data: [alumnos] }`

- `GET /api/v1/alumnos/:id` - Obtener detalle de un alumno
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok, data: alumno }`

### Asistencias:

- `GET /api/v1/asistencias` - Listar asistencias (filtradas por alumnos del tutor)
  - Headers: `Authorization: Bearer {token}`
  - Query params: `?fecha=YYYY-MM-DD` (opcional)
  - Response: `{ ok, data: [asistencias] }`

- `GET /api/v1/tutores/:id/asistencias` - Asistencias de alumnos del tutor
  - Headers: `Authorization: Bearer {token}`
  - Query params: `?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD`
  - Response: `{ ok, data: { tutor, alumnos, asistencias } }`

### Perfil:

- `GET /api/v1/auth/me` - Obtener info del usuario autenticado
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ ok, data: { tipo, usuario } }`

- `PUT /api/v1/auth/cambiar-password` - Cambiar contraseña
  - Headers: `Authorization: Bearer {token}`
  - Request: `{ passwordActual, passwordNuevo }`

## 🏗️ Implementación Propuesta

### Fase 1: Configuración Base (Prioridad: ALTA)

#### 1.1 Agregar Dependencias en `pubspec.yaml`

```yaml
dependencies:
  http: ^1.2.0 # Para peticiones HTTP
  provider: ^6.1.1 # Gestión de estado
  shared_preferences: ^2.2.2 # Almacenar token JWT
  device_info_plus: ^9.1.1 # Obtener info del dispositivo
  flutter_secure_storage: ^9.0.0 # Almacenar token de forma segura
```

#### 1.2 Crear Estructura de Carpetas

```
lib/
├── config/
│   └── api_config.dart          # URL base del API
├── models/
│   ├── tutor.dart               # Modelo de Tutor
│   ├── alumno.dart              # Modelo de Alumno
│   ├── asistencia.dart          # Modelo de Asistencia
│   └── api_response.dart        # Modelo genérico de respuesta
├── services/
│   ├── auth_service.dart        # Servicio de autenticación
│   ├── alumno_service.dart      # Servicio de alumnos
│   ├── asistencia_service.dart  # Servicio de asistencias
│   └── storage_service.dart     # Manejo de token y datos locales
├── providers/
│   ├── auth_provider.dart       # Provider de autenticación
│   ├── alumno_provider.dart     # Provider de alumnos
│   └── asistencia_provider.dart # Provider de asistencias
└── pages/ (existente)
```

### Fase 2: Modelos de Datos (Prioridad: ALTA)

#### 2.1 `lib/config/api_config.dart`

```dart
class ApiConfig {
  // Cambiar según entorno
  static const String baseUrl = 'http://10.0.2.2:3000'; // Android Emulator
  // static const String baseUrl = 'http://localhost:3000'; // iOS Simulator
  // static const String baseUrl = 'http://192.168.1.X:3000'; // Dispositivo físico

  static const String authLogin = '/api/v1/auth/login/tutor';
  static const String authMe = '/api/v1/auth/me';
  static const String alumnos = '/api/v1/alumnos';
  static const String asistencias = '/api/v1/asistencias';
  static const String tutorAsistencias = '/api/v1/tutores';
}
```

#### 2.2 `lib/models/tutor.dart`

```dart
class Tutor {
  final String id;
  final String nombre;
  final String email;
  final String? telefono;
  final List<String> alumnosIds;

  Tutor({...});

  factory Tutor.fromJson(Map<String, dynamic> json) {
    return Tutor(
      id: json['_id'],
      nombre: json['nombre'],
      email: json['email'],
      telefono: json['telefono'],
      alumnosIds: List<String>.from(json['alumnos']?.map((a) => a['_id'] ?? a) ?? []),
    );
  }
}
```

#### 2.3 `lib/models/alumno.dart`

```dart
class Alumno {
  final String id;
  final String nombre;
  final String uidTarjeta;
  final DateTime? createdAt;

  Alumno({...});

  factory Alumno.fromJson(Map<String, dynamic> json) => ...
}
```

#### 2.4 `lib/models/asistencia.dart`

```dart
class Asistencia {
  final String uidTarjeta;
  final String nombre;
  final String tipo; // 'entrada' o 'salida'
  final DateTime fechaHora;

  Asistencia({...});

  factory Asistencia.fromJson(Map<String, dynamic> json) => ...
}
```

### Fase 3: Servicios (Prioridad: ALTA)

#### 3.1 `lib/services/storage_service.dart`

```dart
class StorageService {
  static final FlutterSecureStorage _storage = FlutterSecureStorage();

  static Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  static Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  static Future<void> deleteToken() async {
    await _storage.delete(key: 'jwt_token');
  }

  static Future<void> saveTutorData(Tutor tutor) async {
    await _storage.write(key: 'tutor_id', value: tutor.id);
    await _storage.write(key: 'tutor_nombre', value: tutor.nombre);
    await _storage.write(key: 'tutor_email', value: tutor.email);
  }
}
```

#### 3.2 `lib/services/auth_service.dart`

```dart
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';

class AuthService {
  Future<Map<String, dynamic>> loginTutor(String email, String password) async {
    // Obtener info del dispositivo
    final deviceInfo = await _getDeviceInfo();

    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.authLogin}'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'deviceId': deviceInfo['deviceId'],
        'deviceType': 'mobile',
        'deviceName': deviceInfo['deviceName'],
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['ok']) {
        // Guardar token
        await StorageService.saveToken(data['data']['token']);
        return data;
      }
      throw Exception(data['error']['mensaje']);
    } else if (response.statusCode == 401) {
      throw Exception('Email o contraseña incorrectos');
    } else {
      throw Exception('Error de conexión');
    }
  }

  Future<Map<String, dynamic>> _getDeviceInfo() async {
    // Implementar según plataforma
  }

  Future<Map<String, dynamic>> getUserInfo() async {
    final token = await StorageService.getToken();
    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.authMe}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Error al obtener usuario');
  }

  Future<void> logout() async {
    await StorageService.deleteToken();
  }
}
```

#### 3.3 `lib/services/alumno_service.dart`

```dart
class AlumnoService {
  Future<List<Alumno>> getAlumnos() async {
    final token = await StorageService.getToken();

    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.alumnos}'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['ok']) {
        return (data['data'] as List)
            .map((json) => Alumno.fromJson(json))
            .toList();
      }
      throw Exception('Error al cargar alumnos');
    } else if (response.statusCode == 401) {
      throw Exception('Sesión expirada');
    }
    throw Exception('Error de conexión');
  }

  Future<Alumno> getAlumno(String id) async {
    final token = await StorageService.getToken();

    final response = await http.get(
      Uri.parse('${ApiConfig.baseUrl}${ApiConfig.alumnos}/$id'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Alumno.fromJson(data['data']);
    }
    throw Exception('Error al cargar alumno');
  }
}
```

#### 3.4 `lib/services/asistencia_service.dart`

```dart
class AsistenciaService {
  Future<List<Asistencia>> getAsistencias({String? fecha}) async {
    final token = await StorageService.getToken();

    String url = '${ApiConfig.baseUrl}${ApiConfig.asistencias}';
    if (fecha != null) {
      url += '?fecha=$fecha';
    }

    final response = await http.get(
      Uri.parse(url),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['ok']) {
        return (data['data'] as List)
            .map((json) => Asistencia.fromJson(json))
            .toList();
      }
    }
    throw Exception('Error al cargar asistencias');
  }

  Future<Map<String, dynamic>> getAsistenciasTutor(
    String tutorId,
    {String? fechaInicio, String? fechaFin}
  ) async {
    final token = await StorageService.getToken();

    String url = '${ApiConfig.baseUrl}${ApiConfig.tutorAsistencias}/$tutorId/asistencias';
    List<String> params = [];
    if (fechaInicio != null) params.add('fechaInicio=$fechaInicio');
    if (fechaFin != null) params.add('fechaFin=$fechaFin');
    if (params.isNotEmpty) url += '?${params.join('&')}';

    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    }
    throw Exception('Error al cargar asistencias');
  }
}
```

### Fase 4: Providers (Prioridad: ALTA)

#### 4.1 `lib/providers/auth_provider.dart`

```dart
import 'package:flutter/material.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;
  Tutor? _currentTutor;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  Tutor? get currentTutor => _currentTutor;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _authService.loginTutor(email, password);
      _currentTutor = Tutor.fromJson(response['data']['usuario']);
      await StorageService.saveTutorData(_currentTutor!);
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      _isAuthenticated = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _isAuthenticated = false;
    _currentTutor = null;
    notifyListeners();
  }

  Future<void> checkAuthStatus() async {
    final token = await StorageService.getToken();
    if (token != null) {
      try {
        final userInfo = await _authService.getUserInfo();
        _currentTutor = Tutor.fromJson(userInfo['data']['usuario']);
        _isAuthenticated = true;
      } catch (e) {
        _isAuthenticated = false;
      }
      notifyListeners();
    }
  }
}
```

### Fase 5: Actualizar UI (Prioridad: MEDIA)

#### 5.1 Modificar `lib/main.dart`

```dart
void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AlumnoProvider()),
        ChangeNotifierProvider(create: (_) => AsistenciaProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          if (authProvider.isAuthenticated) {
            return const HomeTutor();
          }
          return const LoginPage();
        },
      ),
    );
  }
}
```

#### 5.2 Modificar `lib/pages/login.dart`

```dart
class _LoginPageState extends State<LoginPage> {
  final emailController = TextEditingController();
  final passController = TextEditingController();
  bool _isLoading = false;

  void iniciarSesion() async {
    String email = emailController.text.trim();
    String password = passController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor completa todos los campos')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    bool success = await authProvider.login(email, password);

    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeTutor()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(authProvider.errorMessage ?? 'Error al iniciar sesión')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión')),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator())
        : Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email),
                  ),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: passController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                ),
                const SizedBox(height: 30),
                ElevatedButton(
                  onPressed: iniciarSesion,
                  child: const Text('Ingresar'),
                ),
              ],
            ),
          ),
    );
  }
}
```

#### 5.3 Modificar `lib/pages/tutor/home_tutor.dart`

- Mostrar nombre del tutor desde `authProvider.currentTutor.nombre`
- Cargar lista de alumnos desde `alumnoProvider.getAlumnos()`
- Mostrar tarjetas con información de cada alumno

#### 5.4 Modificar `lib/pages/tutor/historial_asistencia.dart`

```dart
class _HistorialAsistenciaState extends State<HistorialAsistencia> {
  bool isLoading = true;
  List<Asistencia> asistencias = [];

  @override
  void initState() {
    super.initState();
    cargarHistorial();
  }

  Future<void> cargarHistorial() async {
    try {
      final asistenciaProvider = Provider.of<AsistenciaProvider>(context, listen: false);
      await asistenciaProvider.loadAsistencias();
      setState(() {
        asistencias = asistenciaProvider.asistencias;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
}
```

### Fase 6: Funcionalidades Adicionales (Prioridad: BAJA)

#### 6.1 Manejo de errores de red

- Interceptor para manejar errores 401 (token expirado)
- Retry automático
- Modo offline básico

#### 6.2 Notificaciones en tiempo real

- Implementar Socket.IO client
- Escuchar evento 'nueva-asistencia'
- Mostrar notificación push

#### 6.3 Caché de datos

- Guardar últimas asistencias en local
- Sincronizar cuando haya conexión

## 📋 Checklist de Implementación

### Sprint 1 - Autenticación (1-2 días)

- [ ] Agregar dependencias en pubspec.yaml
- [ ] Crear estructura de carpetas
- [ ] Crear ApiConfig
- [ ] Crear modelo Tutor
- [ ] Crear StorageService
- [ ] Crear AuthService
- [ ] Crear AuthProvider
- [ ] Modificar main.dart con Provider
- [ ] Modificar LoginPage para usar API
- [ ] Probar login con tutor real del backend

### Sprint 2 - Alumnos (1-2 días)

- [ ] Crear modelo Alumno
- [ ] Crear AlumnoService
- [ ] Crear AlumnoProvider
- [ ] Modificar HomeTutor para mostrar alumnos
- [ ] Crear pantalla detalle de alumno
- [ ] Probar listado y detalle

### Sprint 3 - Asistencias (1-2 días)

- [ ] Crear modelo Asistencia
- [ ] Crear AsistenciaService
- [ ] Crear AsistenciaProvider
- [ ] Modificar HistorialAsistencia para usar API
- [ ] Agregar filtros por fecha
- [ ] Agrupar asistencias por día
- [ ] Mostrar entrada/salida

### Sprint 4 - Refinamiento (1 día)

- [ ] Manejo de errores
- [ ] Loading states
- [ ] UI/UX improvements
- [ ] Logout funcional
- [ ] Refresh al hacer pull

## 🔐 Configuración del API Base URL

Para probar en diferentes entornos:

### Android Emulator:

```dart
static const String baseUrl = 'http://10.0.2.2:3000';
```

### iOS Simulator:

```dart
static const String baseUrl = 'http://localhost:3000';
```

### Dispositivo Físico (misma red WiFi):

```dart
static const String baseUrl = 'http://192.168.1.X:3000'; // IP de tu PC
```

### Producción:

```dart
static const String baseUrl = 'https://api.kidotag.com';
```

## 🧪 Testing

### Datos de prueba:

1. Crear tutor en el backend:

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

2. Crear alumnos y asociarlos al tutor

3. Registrar algunas asistencias

4. Probar login en la app con:
   - Email: `maria@example.com`
   - Password: `password123`

## 📝 Notas Importantes

1. **Seguridad**: El token JWT se almacena en FlutterSecureStorage (encriptado)
2. **Expiración**: Los tokens expiran en 7 días, después el usuario debe volver a hacer login
3. **Device Tracking**: Cada login registra el dispositivo móvil usado
4. **Offline**: Por ahora no hay soporte offline, se necesita conexión
5. **Socket.IO**: Para notificaciones en tiempo real (Fase futura)

---

Este plan está listo para implementarse fase por fase. Se recomienda empezar por Sprint 1 (Autenticación) y validar que funciona antes de continuar.
