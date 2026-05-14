/// Modelo de Alumno
///
/// Representa un alumno en el sistema
class Alumno {
  final String id;
  final String nombre;
  final String apellidos;
  final String uidTarjeta;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Alumno({
    required this.id,
    required this.nombre,
    this.apellidos = '',
    required this.uidTarjeta,
    this.createdAt,
    this.updatedAt,
  });

  String get nombreCompleto =>
      [nombre, apellidos].where((parte) => parte.trim().isNotEmpty).join(' ');

  /// Crear Alumno desde JSON del API
  factory Alumno.fromJson(Map<String, dynamic> json) {
    return Alumno(
      id: json['_id'] ?? '',
      nombre: json['nombre'] ?? '',
      apellidos: json['apellidos'] ?? '',
      uidTarjeta: json['uidTarjeta'] ?? '',
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  /// Convertir a JSON para enviar al API
  Map<String, dynamic> toJson() {
    return {'nombre': nombre, 'apellidos': apellidos, 'uidTarjeta': uidTarjeta};
  }

  /// Copiar con modificaciones
  Alumno copyWith({
    String? id,
    String? nombre,
    String? apellidos,
    String? uidTarjeta,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Alumno(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      apellidos: apellidos ?? this.apellidos,
      uidTarjeta: uidTarjeta ?? this.uidTarjeta,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Alumno(id: $id, nombre: $nombreCompleto, uid: $uidTarjeta)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Alumno && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
