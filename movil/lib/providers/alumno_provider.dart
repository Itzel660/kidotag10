import 'package:flutter/foundation.dart';
import '../models/alumno.dart';
import '../services/alumno_service.dart';

/// Provider de alumnos
///
/// Maneja el estado de la lista de alumnos
class AlumnoProvider with ChangeNotifier {
  final AlumnoService _alumnoService = AlumnoService();

  List<Alumno> _alumnos = [];
  bool _isLoading = false;
  String? _error;

  List<Alumno> get alumnos => _alumnos;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalAlumnos => _alumnos.length;

  /// Cargar alumnos
  ///
  /// NOTA: Si el usuario es tutor, solo carga sus alumnos asignados
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

  /// Buscar alumno por UID de tarjeta
  Alumno? getAlumnoByUid(String uidTarjeta) {
    try {
      return _alumnos.firstWhere((a) => a.uidTarjeta == uidTarjeta);
    } catch (e) {
      return null;
    }
  }

  /// Crear un nuevo alumno
  Future<bool> createAlumno({
    required String nombre,
    required String uidTarjeta,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _alumnoService.createAlumno(
      nombre: nombre,
      uidTarjeta: uidTarjeta,
    );

    _isLoading = false;

    if (response.isSuccess) {
      _alumnos.add(response.data!);
      notifyListeners();
      return true;
    } else {
      _error = response.error?.mensaje;
      notifyListeners();
      return false;
    }
  }

  /// Actualizar un alumno
  Future<bool> updateAlumno({
    required String id,
    String? nombre,
    String? uidTarjeta,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _alumnoService.updateAlumno(
      id: id,
      nombre: nombre,
      uidTarjeta: uidTarjeta,
    );

    _isLoading = false;

    if (response.isSuccess) {
      // Actualizar en la lista local
      final index = _alumnos.indexWhere((a) => a.id == id);
      if (index != -1) {
        _alumnos[index] = response.data!;
      }
      notifyListeners();
      return true;
    } else {
      _error = response.error?.mensaje;
      notifyListeners();
      return false;
    }
  }

  /// Eliminar un alumno
  Future<bool> deleteAlumno(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _alumnoService.deleteAlumno(id);

    _isLoading = false;

    if (response.isSuccess) {
      _alumnos.removeWhere((a) => a.id == id);
      notifyListeners();
      return true;
    } else {
      _error = response.error?.mensaje;
      notifyListeners();
      return false;
    }
  }

  /// Limpiar error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Limpiar datos (útil en logout)
  void clear() {
    _alumnos = [];
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
