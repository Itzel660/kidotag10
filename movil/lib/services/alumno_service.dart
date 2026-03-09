import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/alumno.dart';
import 'storage_service.dart';

/// Servicio de alumnos
///
/// Maneja operaciones CRUD de alumnos
class AlumnoService {
  final StorageService _storageService = StorageService();

  /// Obtener lista de alumnos
  ///
  /// NOTA: Si el usuario es tutor, solo obtiene sus alumnos asignados
  /// Si es profesor, obtiene todos los alumnos
  ///
  /// Retorna: Lista de alumnos
  Future<ApiResponse<List<Alumno>>> getAlumnos() async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.alumnos));

      final response = await http
          .get(url, headers: ApiConfig.authHeaders(token))
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        final List<dynamic> alumnosJson = responseData['data'];
        final alumnos =
            alumnosJson.map((json) => Alumno.fromJson(json)).toList();
        return ApiResponse.success(alumnos);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'GET_ALUMNOS_ERROR',
          error['mensaje'] ?? 'Error al obtener alumnos',
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

  /// Obtener un alumno por ID
  ///
  /// Parámetros:
  /// - id: ID del alumno
  ///
  /// Retorna: Datos del alumno
  Future<ApiResponse<Alumno>> getAlumnoById(String id) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.alumnoById(id)));

      final response = await http
          .get(url, headers: ApiConfig.authHeaders(token))
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        final alumno = Alumno.fromJson(responseData['data']);
        return ApiResponse.success(alumno);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'GET_ALUMNO_ERROR',
          error['mensaje'] ?? 'Error al obtener alumno',
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

  /// Crear un nuevo alumno
  ///
  /// Parámetros:
  /// - nombre: Nombre del alumno
  /// - uidTarjeta: UID de la tarjeta NFC
  ///
  /// Retorna: Alumno creado
  Future<ApiResponse<Alumno>> createAlumno({
    required String nombre,
    required String uidTarjeta,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.crearAlumno));

      final response = await http
          .post(
            url,
            headers: ApiConfig.authHeaders(token),
            body: jsonEncode({'nombre': nombre, 'uidTarjeta': uidTarjeta}),
          )
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 201 && responseData['ok'] == true) {
        final alumno = Alumno.fromJson(responseData['data']);
        return ApiResponse.success(alumno);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'CREATE_ALUMNO_ERROR',
          error['mensaje'] ?? 'Error al crear alumno',
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

  /// Actualizar un alumno
  ///
  /// Parámetros:
  /// - id: ID del alumno
  /// - nombre: Nuevo nombre (opcional)
  /// - uidTarjeta: Nuevo UID de tarjeta (opcional)
  ///
  /// Retorna: Alumno actualizado
  Future<ApiResponse<Alumno>> updateAlumno({
    required String id,
    String? nombre,
    String? uidTarjeta,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      // Construir body solo con campos que se van a actualizar
      final Map<String, dynamic> body = {};
      if (nombre != null) body['nombre'] = nombre;
      if (uidTarjeta != null) body['uidTarjeta'] = uidTarjeta;

      final url = Uri.parse(ApiConfig.url(ApiConfig.actualizarAlumno(id)));

      final response = await http
          .put(
            url,
            headers: ApiConfig.authHeaders(token),
            body: jsonEncode(body),
          )
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        final alumno = Alumno.fromJson(responseData['data']);
        return ApiResponse.success(alumno);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'UPDATE_ALUMNO_ERROR',
          error['mensaje'] ?? 'Error al actualizar alumno',
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

  /// Eliminar un alumno
  ///
  /// Parámetros:
  /// - id: ID del alumno a eliminar
  ///
  /// Retorna: Confirmación de eliminación
  Future<ApiResponse<Map<String, dynamic>>> deleteAlumno(String id) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      final url = Uri.parse(ApiConfig.url(ApiConfig.eliminarAlumno(id)));

      final response = await http
          .delete(url, headers: ApiConfig.authHeaders(token))
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        return ApiResponse.success(responseData['data']);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'DELETE_ALUMNO_ERROR',
          error['mensaje'] ?? 'Error al eliminar alumno',
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
}
