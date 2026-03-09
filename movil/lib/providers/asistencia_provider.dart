import 'package:flutter/foundation.dart';
import '../models/asistencia.dart';
import '../services/asistencia_service.dart';

/// Provider de asistencias
///
/// Maneja el estado de las asistencias
class AsistenciaProvider with ChangeNotifier {
  final AsistenciaService _asistenciaService = AsistenciaService();

  List<Asistencia> _asistencias = [];
  bool _isLoading = false;
  String? _error;

  List<Asistencia> get asistencias => _asistencias;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalAsistencias => _asistencias.length;

  /// Asistencias agrupadas por fecha
  List<AsistenciaDia> get asistenciasPorDia {
    return AsistenciaDia.agruparPorFecha(_asistencias);
  }

  /// Cargar todas las asistencias
  Future<void> loadAsistencias() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistencias();

    _isLoading = false;

    if (response.isSuccess) {
      _asistencias = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }

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

  /// Cargar asistencias de un alumno específico
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

  /// Cargar asistencias de la semana
  Future<void> loadAsistenciasSemana() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistenciasSemana();

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

  /// Cargar asistencias en un rango de fechas
  Future<void> loadAsistenciasRango({
    required DateTime fechaInicio,
    required DateTime fechaFin,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _asistenciaService.getAsistenciasRango(
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    );

    _isLoading = false;

    if (response.isSuccess) {
      _asistencias = response.data!;
    } else {
      _error = response.error?.mensaje;
    }

    notifyListeners();
  }

  /// Obtener asistencias de un alumno específico por UID
  List<Asistencia> getAsistenciasByUid(String uidTarjeta) {
    return _asistencias.where((a) => a.uidTarjeta == uidTarjeta).toList();
  }

  /// Obtener última asistencia de un alumno
  Asistencia? getUltimaAsistencia(String uidTarjeta) {
    final asistenciasAlumno = getAsistenciasByUid(uidTarjeta);
    if (asistenciasAlumno.isEmpty) return null;

    // Ordenar por fecha descendente y retornar la primera
    asistenciasAlumno.sort((a, b) => b.fechaHora.compareTo(a.fechaHora));
    return asistenciasAlumno.first;
  }

  /// Obtener estadísticas de un alumno en un rango de fechas
  Future<Map<String, int>> getEstadisticasAlumno({
    required String uidTarjeta,
    required DateTime fechaInicio,
    required DateTime fechaFin,
  }) async {
    return await _asistenciaService.getEstadisticasAlumno(
      uidTarjeta: uidTarjeta,
      fechaInicio: fechaInicio,
      fechaFin: fechaFin,
    );
  }

  /// Limpiar error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Limpiar datos (útil en logout)
  void clear() {
    _asistencias = [];
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
