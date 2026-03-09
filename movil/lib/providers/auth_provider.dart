import 'package:flutter/foundation.dart';
import '../models/tutor.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';

/// Provider de autenticación
///
/// Maneja el estado de la sesión del usuario (login, logout, información)
class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  Tutor? _tutor;
  dynamic _profesor;
  bool _isLoading = false;
  String? _error;
  String? _userRole; // 'tutor' o 'profesor'

  Tutor? get tutor => _tutor;
  dynamic get profesor => _profesor;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _tutor != null || _profesor != null;
  String? get userRole => _userRole;
  bool get isTutor => _userRole == 'tutor';
  bool get isProfesor => _userRole == 'profesor';

  String get userName {
    if (_tutor != null) return _tutor!.nombre;
    if (_profesor != null) return _profesor['nombre'] ?? '';
    return '';
  }

  /// Login de tutor
  Future<bool> loginTutor(String email, String password) async {
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
      _userRole = 'tutor';
      _profesor = null;
      notifyListeners();
      return true;
    } else {
      _error = response.error?.mensaje;
      notifyListeners();
      return false;
    }
  }

  /// Login de profesor
  Future<bool> loginProfesor(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _authService.loginProfesor(
      email: email,
      password: password,
    );

    _isLoading = false;

    if (response.isSuccess) {
      _profesor = response.data!['profesor'];
      _userRole = 'profesor';
      _tutor = null;
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
    _profesor = null;
    _userRole = null;
    _error = null;
    notifyListeners();
  }

  /// Verificar sesión guardada (al abrir la app)
  Future<void> checkAuthentication() async {
    final isAuth = await _authService.isAuthenticated();
    if (isAuth) {
      final userInfo = await _storageService.getAllUserInfo();
      final role = userInfo['userRole'];

      if (role != null) {
        _userRole = role;

        // Obtener información completa del usuario desde el API
        final response = await _authService.getUserInfo();

        if (response.isSuccess) {
          if (role == 'tutor') {
            _tutor = Tutor.fromJson(response.data!['usuario']);
            _profesor = null;
          } else if (role == 'profesor') {
            _profesor = response.data!['usuario'];
            _tutor = null;
          }
          notifyListeners();
        } else {
          // Token inválido o expirado, limpiar sesión
          await logout();
        }
      }
    }
  }

  /// Cambiar contraseña
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    final response = await _authService.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );

    _isLoading = false;

    if (response.isSuccess) {
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
}
