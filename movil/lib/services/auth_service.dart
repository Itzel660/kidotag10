import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:device_info_plus/device_info_plus.dart';

import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/tutor.dart';
import 'storage_service.dart';

/// Servicio de autenticación
///
/// Maneja login, logout, y obtención de información del usuario
class AuthService {
  final StorageService _storageService = StorageService();

  /// Login de tutor
  ///
  /// Parámetros:
  /// - email: Email del tutor
  /// - password: Contraseña del tutor
  ///
  /// Retorna: ApiResponse con el token y datos del tutor
  Future<ApiResponse<Map<String, dynamic>>> loginTutor({
    required String email,
    required String password,
  }) async {
    try {
      // Obtener información del dispositivo
      final deviceInfo = await _getDeviceInfo();

      final url = Uri.parse(ApiConfig.url(ApiConfig.authLoginTutor));

      final response = await http
          .post(
            url,
            headers: ApiConfig.jsonHeaders,
            body: jsonEncode({
              'email': email,
              'password': password,
              'deviceId': deviceInfo['deviceId'],
              'deviceType': 'mobile',
              'deviceName': deviceInfo['deviceName'],
            }),
          )
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        // Guardar token
        final token = responseData['data']['token'];
        await _storageService.saveToken(token);

        // Guardar información del usuario
        final tutor = Tutor.fromJson(responseData['data']['tutor']);
        await _storageService.saveUserInfo(
          userId: tutor.id,
          userName: tutor.nombre,
          userEmail: tutor.email,
          userRole: 'tutor',
        );

        return ApiResponse.success(responseData['data']);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'LOGIN_ERROR',
          error['mensaje'] ?? 'Error al iniciar sesión',
        );
      }
    } on SocketException {
      return ApiResponse.failure('NETWORK_ERROR', 'No hay conexión a internet');
    } on http.ClientException {
      return ApiResponse.failure(
        'CONNECTION_ERROR',
        'No se pudo conectar con el servidor',
      );
    } catch (e) {
      return ApiResponse.failure(
        'UNKNOWN_ERROR',
        'Error inesperado: ${e.toString()}',
      );
    }
  }

  /// Login de profesor
  ///
  /// Parámetros:
  /// - email: Email del profesor
  /// - password: Contraseña del profesor
  ///
  /// Retorna: ApiResponse con el token y datos del profesor
  Future<ApiResponse<Map<String, dynamic>>> loginProfesor({
    required String email,
    required String password,
  }) async {
    try {
      final url = Uri.parse(ApiConfig.url(ApiConfig.authLoginProfesor));

      final response = await http
          .post(
            url,
            headers: ApiConfig.jsonHeaders,
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        // Guardar token
        final token = responseData['data']['token'];
        await _storageService.saveToken(token);

        // Guardar información del usuario
        final profesor = responseData['data']['profesor'];
        await _storageService.saveUserInfo(
          userId: profesor['_id'],
          userName: profesor['nombre'],
          userEmail: profesor['email'],
          userRole: 'profesor',
        );

        return ApiResponse.success(responseData['data']);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'LOGIN_ERROR',
          error['mensaje'] ?? 'Error al iniciar sesión',
        );
      }
    } on SocketException {
      return ApiResponse.failure('NETWORK_ERROR', 'No hay conexión a internet');
    } on http.ClientException {
      return ApiResponse.failure(
        'CONNECTION_ERROR',
        'No se pudo conectar con el servidor',
      );
    } catch (e) {
      return ApiResponse.failure(
        'UNKNOWN_ERROR',
        'Error inesperado: ${e.toString()}',
      );
    }
  }

  /// Obtener información del usuario autenticado
  ///
  /// Requiere estar autenticado (tener token guardado)
  ///
  /// Retorna: ApiResponse con los datos del usuario
  Future<ApiResponse<Map<String, dynamic>>> getUserInfo() async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.authMe));

      final response = await http
          .get(url, headers: ApiConfig.authHeaders(token))
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        return ApiResponse.success(responseData['data']);
      } else {
        final error = responseData['error'] ?? {};

        // Si el token expiró o es inválido, limpiar la sesión
        if (response.statusCode == 401) {
          await logout();
        }

        return ApiResponse.failure(
          error['codigo'] ?? 'GET_INFO_ERROR',
          error['mensaje'] ?? 'Error al obtener información del usuario',
        );
      }
    } on SocketException {
      return ApiResponse.failure('NETWORK_ERROR', 'No hay conexión a internet');
    } catch (e) {
      return ApiResponse.failure(
        'UNKNOWN_ERROR',
        'Error inesperado: ${e.toString()}',
      );
    }
  }

  /// Cambiar contraseña del usuario autenticado
  ///
  /// Parámetros:
  /// - currentPassword: Contraseña actual
  /// - newPassword: Nueva contraseña
  ///
  /// Retorna: ApiResponse indicando si se cambió correctamente
  Future<ApiResponse<Map<String, dynamic>>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.authCambiarPassword));

      final response = await http
          .put(
            url,
            headers: ApiConfig.authHeaders(token),
            body: jsonEncode({
              'passwordActual': currentPassword,
              'passwordNuevo': newPassword,
            }),
          )
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        return ApiResponse.success(responseData['data']);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'CHANGE_PASSWORD_ERROR',
          error['mensaje'] ?? 'Error al cambiar la contraseña',
        );
      }
    } on SocketException {
      return ApiResponse.failure('NETWORK_ERROR', 'No hay conexión a internet');
    } catch (e) {
      return ApiResponse.failure(
        'UNKNOWN_ERROR',
        'Error inesperado: ${e.toString()}',
      );
    }
  }

  /// Cerrar sesión
  ///
  /// Elimina el token y la información del usuario guardada
  Future<void> logout() async {
    await _storageService.clearUserData();
  }

  /// Verificar si el usuario está autenticado
  ///
  /// Retorna: true si hay token guardado, false en caso contrario
  Future<bool> isAuthenticated() async {
    return await _storageService.hasToken();
  }

  /// Obtener información local del usuario (sin hacer petición al API)
  ///
  /// Retorna: Mapa con la información del usuario guardada localmente
  Future<Map<String, String?>> getLocalUserInfo() async {
    return await _storageService.getAllUserInfo();
  }

  /// Obtener información del dispositivo
  Future<Map<String, String>> _getDeviceInfo() async {
    final deviceInfoPlugin = DeviceInfoPlugin();

    try {
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfoPlugin.androidInfo;
        return {
          'deviceId': androidInfo.id,
          'deviceName': '${androidInfo.brand} ${androidInfo.model}',
        };
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfoPlugin.iosInfo;
        return {
          'deviceId': iosInfo.identifierForVendor ?? 'unknown',
          'deviceName': '${iosInfo.name} (${iosInfo.model})',
        };
      } else {
        return {'deviceId': 'unknown', 'deviceName': 'Unknown Device'};
      }
    } catch (e) {
      return {'deviceId': 'unknown', 'deviceName': 'Unknown Device'};
    }
  }
}
