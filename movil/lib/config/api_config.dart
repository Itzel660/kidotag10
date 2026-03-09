/// Configuración del API
///
/// Constantes para las URLs del backend
class ApiConfig {
  // ============================================
  // CONFIGURACIÓN DE AMBIENTE
  // ============================================

  /// URL base del API - Cambiar según el ambiente
  ///
  /// IMPORTANTE: Usar la IP correcta según el dispositivo:
  /// - Android Emulator: 'http://10.0.2.2:3000'
  /// - iOS Simulator: 'http://localhost:3000'
  /// - Dispositivo Físico (misma red WiFi): 'http://192.168.X.X:3000'
  /// - Producción: 'https://api.kidotag.com'
  static const String baseUrl = 'http://10.0.2.2:3000'; // Android Emulator

  // ============================================
  // ENDPOINTS DE AUTENTICACIÓN
  // ============================================

  /// Login de tutor
  static const String authLoginTutor = '/api/v1/auth/login/tutor';

  /// Login de profesor
  static const String authLoginProfesor = '/api/v1/auth/login/profesor';

  /// Obtener información del usuario autenticado
  static const String authMe = '/api/v1/auth/me';

  /// Cambiar contraseña del usuario autenticado
  static const String authCambiarPassword = '/api/v1/auth/cambiar-password';

  // ============================================
  // ENDPOINTS DE ALUMNOS
  // ============================================

  /// Listar alumnos (para tutores: solo sus alumnos)
  static const String alumnos = '/api/v1/alumnos';

  /// Obtener un alumno específico
  static String alumnoById(String id) => '/api/v1/alumnos/$id';

  /// Crear alumno
  static const String crearAlumno = '/api/v1/alumnos';

  /// Actualizar alumno
  static String actualizarAlumno(String id) => '/api/v1/alumnos/$id';

  /// Eliminar alumno
  static String eliminarAlumno(String id) => '/api/v1/alumnos/$id';

  // ============================================
  // ENDPOINTS DE ASISTENCIAS
  // ============================================

  /// Listar asistencias (para tutores: solo de sus alumnos)
  static const String asistencias = '/api/v1/asistencias';

  /// Registrar asistencia (usado por ESP32)
  static const String registrarAsistencia = '/api/v1/asistencias';

  /// Obtener asistencias de los alumnos de un tutor
  static String asistenciasTutor(String tutorId) =>
      '/api/v1/tutores/$tutorId/asistencias';

  // ============================================
  // ENDPOINTS DE TUTORES
  // ============================================

  /// Listar tutores
  static const String tutores = '/api/v1/tutores';

  /// Obtener un tutor específico
  static String tutorById(String id) => '/api/v1/tutores/$id';

  /// Agregar alumno a un tutor
  static String tutorAgregarAlumno(String tutorId) =>
      '/api/v1/tutores/$tutorId/alumnos';

  /// Remover alumno de un tutor
  static String tutorRemoverAlumno(String tutorId, String alumnoId) =>
      '/api/v1/tutores/$tutorId/alumnos/$alumnoId';

  /// Registrar device del tutor
  static String tutorRegistrarDevice(String tutorId) =>
      '/api/v1/tutores/$tutorId/devices';

  /// Desactivar device del tutor
  static String tutorDesactivarDevice(String tutorId, String deviceId) =>
      '/api/v1/tutores/$tutorId/devices/$deviceId';

  // ============================================
  // ENDPOINTS DE PROFESORES
  // ============================================

  /// Listar profesores
  static const String profesores = '/api/v1/profesores';

  /// Obtener un profesor específico
  static String profesorById(String id) => '/api/v1/profesores/$id';

  /// Obtener grupos de un profesor
  static String profesorGrupos(String profesorId) =>
      '/api/v1/profesores/$profesorId/grupos';

  // ============================================
  // ENDPOINTS DE GRUPOS
  // ============================================

  /// Listar grupos
  static const String grupos = '/api/v1/grupos';

  /// Obtener un grupo específico
  static String grupoById(String id) => '/api/v1/grupos/$id';

  /// Agregar alumno a un grupo
  static String grupoAgregarAlumno(String grupoId) =>
      '/api/v1/grupos/$grupoId/alumnos';

  /// Remover alumno de un grupo
  static String grupoRemoverAlumno(String grupoId, String alumnoId) =>
      '/api/v1/grupos/$grupoId/alumnos/$alumnoId';

  // ============================================
  // ENDPOINTS DE ESTADO
  // ============================================

  /// Obtener estado del sistema
  static const String estado = '/api/v1/estado';

  // ============================================
  // HEADERS COMUNES
  // ============================================

  /// Headers para peticiones con JSON
  static Map<String, String> get jsonHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Headers para peticiones autenticadas
  static Map<String, String> authHeaders(String token) => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer $token',
  };

  // ============================================
  // CONFIGURACIÓN DE TIMEOUT
  // ============================================

  /// Timeout para peticiones HTTP
  static const Duration requestTimeout = Duration(seconds: 30);

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /// Construir URL completa
  static String url(String path) => '$baseUrl$path';

  /// Construir URL con query params
  static String urlWithParams(String path, Map<String, dynamic> params) {
    final uri = Uri.parse('$baseUrl$path');
    final newUri = uri.replace(queryParameters: params);
    return newUri.toString();
  }
}
