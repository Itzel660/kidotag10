import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/api_response.dart';
import '../models/asistencia.dart';
import 'storage_service.dart';

/// Servicio de asistencias
///
/// Maneja operaciones de asistencias (registros de entrada/salida)
class AsistenciaService {
  final StorageService _storageService = StorageService();

  /// Obtener lista de asistencias
  ///
  /// NOTA: Si el usuario es tutor, solo obtiene las asistencias de sus alumnos
  /// Si es profesor, obtiene todas las asistencias
  ///
  /// Parámetros opcionales:
  /// - uidTarjeta: Filtrar por UID de tarjeta
  /// - fechaInicio: Filtrar desde esta fecha (formato: yyyy-MM-dd)
  /// - fechaFin: Filtrar hasta esta fecha (formato: yyyy-MM-dd)
  ///
  /// Retorna: Lista de asistencias
  Future<ApiResponse<List<Asistencia>>> getAsistencias({
    String? uidTarjeta,
    String? fechaInicio,
    String? fechaFin,
  }) async {
    try {
      final token = await _storageService.getToken();

      if (token == null) {
        return ApiResponse.failure('NO_TOKEN', 'No hay sesión activa');
      }

      // Construir query params
      final Map<String, dynamic> queryParams = {};
      if (uidTarjeta != null) queryParams['uidTarjeta'] = uidTarjeta;
      if (fechaInicio != null) queryParams['fechaInicio'] = fechaInicio;
      if (fechaFin != null) queryParams['fechaFin'] = fechaFin;

      final url =
          queryParams.isNotEmpty
              ? Uri.parse(
                ApiConfig.urlWithParams(ApiConfig.asistencias, queryParams),
              )
              : Uri.parse(ApiConfig.url(ApiConfig.asistencias));

      final response = await http
          .get(url, headers: ApiConfig.authHeaders(token))
          .timeout(ApiConfig.requestTimeout);

      final responseData = jsonDecode(response.body);

      if (response.statusCode == 200 && responseData['ok'] == true) {
        final List<dynamic> asistenciasJson = responseData['data'];
        final asistencias =
            asistenciasJson.map((json) => Asistencia.fromJson(json)).toList();
        return ApiResponse.success(asistencias);
      } else {
        final error = responseData['error'] ?? {};
        return ApiResponse.failure(
          error['codigo'] ?? 'GET_ASISTENCIAS_ERROR',
          error['mensaje'] ?? 'Error al obtener asistencias',
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

  /// Obtener asistencias de un alumno específico
  ///
  /// Parámetros:
  /// - uidTarjeta: UID de la tarjeta del alumno
  /// - fechaInicio: Filtrar desde esta fecha (opcional)
  /// - fechaFin: Filtrar hasta esta fecha (opcional)
  ///
  /// Retorna: Lista de asistencias del alumno
  Future<ApiResponse<List<Asistencia>>> getAsistenciasByAlumno({
    required String uidTarjeta,
    String? fechaInicio,
    String? fechaFin,
  }) async {
    return await getAsistencias(
      uidTarjeta: uidTarjeta,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    );
  }

  /// Obtener asistencias de hoy
  ///
  /// Retorna: Lista de asistencias del día actual
  Future<ApiResponse<List<Asistencia>>> getAsistenciasHoy() async {
    final hoy = DateTime.now();
    final fecha = _formatDate(hoy);

    return await getAsistencias(fechaInicio: fecha, fechaFin: fecha);
  }

  /// Obtener asistencias de la semana actual
  ///
  /// Retorna: Lista de asistencias de la semana
  Future<ApiResponse<List<Asistencia>>> getAsistenciasSemana() async {
    final ahora = DateTime.now();
    final inicioSemana = ahora.subtract(Duration(days: ahora.weekday - 1));
    final finSemana = inicioSemana.add(const Duration(days: 6));

    return await getAsistencias(
      fechaInicio: _formatDate(inicioSemana),
      fechaFin: _formatDate(finSemana),
    );
  }

  /// Obtener asistencias del mes actual
  ///
  /// Retorna: Lista de asistencias del mes
  Future<ApiResponse<List<Asistencia>>> getAsistenciasMes() async {
    final ahora = DateTime.now();
    final inicioMes = DateTime(ahora.year, ahora.month, 1);
    final finMes = DateTime(ahora.year, ahora.month + 1, 0);

    return await getAsistencias(
      fechaInicio: _formatDate(inicioMes),
      fechaFin: _formatDate(finMes),
    );
  }

  /// Obtener asistencias en un rango de fechas personalizado
  ///
  /// Parámetros:
  /// - fechaInicio: Fecha de inicio
  /// - fechaFin: Fecha de fin
  ///
  /// Retorna: Lista de asistencias en el rango
  Future<ApiResponse<List<Asistencia>>> getAsistenciasRango({
    required DateTime fechaInicio,
    required DateTime fechaFin,
  }) async {
    return await getAsistencias(
      fechaInicio: _formatDate(fechaInicio),
      fechaFin: _formatDate(fechaFin),
    );
  }

  /// Obtener estadísticas de asistencia de un alumno
  ///
  /// Parámetros:
  /// - uidTarjeta: UID de la tarjeta del alumno
  /// - fechaInicio: Fecha de inicio
  /// - fechaFin: Fecha de fin
  ///
  /// Retorna: Mapa con estadísticas (total, entradas, salidas)
  Future<Map<String, int>> getEstadisticasAlumno({
    required String uidTarjeta,
    required DateTime fechaInicio,
    required DateTime fechaFin,
  }) async {
    final response = await getAsistenciasByAlumno(
      uidTarjeta: uidTarjeta,
      fechaInicio: _formatDate(fechaInicio),
      fechaFin: _formatDate(fechaFin),
    );

    if (response.isSuccess && response.data != null) {
      final asistencias = response.data!;
      final entradas = asistencias.where((a) => a.esEntrada).length;
      final salidas = asistencias.where((a) => a.esSalida).length;

      return {
        'total': asistencias.length,
        'entradas': entradas,
        'salidas': salidas,
      };
    }

    return {'total': 0, 'entradas': 0, 'salidas': 0};
  }

  /// Formatear fecha a string (yyyy-MM-dd)
  String _formatDate(DateTime fecha) {
    final year = fecha.year;
    final month = fecha.month.toString().padLeft(2, '0');
    final day = fecha.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  /// Agrupar asistencias por fecha
  ///
  /// Útil para mostrar asistencias agrupadas por día
  Map<DateTime, List<Asistencia>> agruparPorFecha(
    List<Asistencia> asistencias,
  ) {
    final Map<DateTime, List<Asistencia>> agrupadas = {};

    for (var asistencia in asistencias) {
      final fecha = asistencia.soloFecha;
      if (!agrupadas.containsKey(fecha)) {
        agrupadas[fecha] = [];
      }
      agrupadas[fecha]!.add(asistencia);
    }

    return agrupadas;
  }

  /// Agrupar asistencias por alumno
  ///
  /// Útil para mostrar asistencias por cada alumno
  Map<String, List<Asistencia>> agruparPorAlumno(List<Asistencia> asistencias) {
    final Map<String, List<Asistencia>> agrupadas = {};

    for (var asistencia in asistencias) {
      final uid = asistencia.uidTarjeta;
      if (!agrupadas.containsKey(uid)) {
        agrupadas[uid] = [];
      }
      agrupadas[uid]!.add(asistencia);
    }

    return agrupadas;
  }
}
