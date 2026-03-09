/// Respuesta genérica del API
///
/// Todas las respuestas del API siguen este formato
class ApiResponse<T> {
  final bool ok;
  final T? data;
  final ApiError? error;

  ApiResponse({required this.ok, this.data, this.error});

  /// Crear respuesta exitosa
  factory ApiResponse.success(T data) {
    return ApiResponse(ok: true, data: data, error: null);
  }

  /// Crear respuesta de error
  factory ApiResponse.failure(String code, String message) {
    return ApiResponse(
      ok: false,
      data: null,
      error: ApiError(codigo: code, mensaje: message),
    );
  }

  /// Parsear desde JSON del API
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    if (json['ok'] == true) {
      return ApiResponse(
        ok: true,
        data: fromJsonT != null ? fromJsonT(json['data']) : json['data'] as T?,
        error: null,
      );
    } else {
      return ApiResponse(
        ok: false,
        data: null,
        error:
            json['error'] != null
                ? ApiError.fromJson(json['error'])
                : ApiError(codigo: 'ERROR', mensaje: 'Error desconocido'),
      );
    }
  }

  /// Verificar si fue exitosa
  bool get isSuccess => ok && error == null;

  /// Verificar si hubo error
  bool get isError => !ok || error != null;
}

/// Error del API
class ApiError {
  final String codigo;
  final String mensaje;

  ApiError({required this.codigo, required this.mensaje});

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      codigo: json['codigo'] ?? 'ERROR',
      mensaje: json['mensaje'] ?? 'Error desconocido',
    );
  }

  Map<String, dynamic> toJson() {
    return {'codigo': codigo, 'mensaje': mensaje};
  }

  @override
  String toString() => mensaje;
}
