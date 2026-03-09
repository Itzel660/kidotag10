/// Modelo de Tutor
///
/// Representa un tutor en el sistema
class Tutor {
  final String id;
  final String nombre;
  final String email;
  final String? telefono;
  final List<String> alumnosIds;
  final List<Device> devices;
  final bool activo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Tutor({
    required this.id,
    required this.nombre,
    required this.email,
    this.telefono,
    required this.alumnosIds,
    this.devices = const [],
    this.activo = true,
    this.createdAt,
    this.updatedAt,
  });

  /// Crear Tutor desde JSON del API
  factory Tutor.fromJson(Map<String, dynamic> json) {
    return Tutor(
      id: json['_id'] ?? '',
      nombre: json['nombre'] ?? '',
      email: json['email'] ?? '',
      telefono: json['telefono'],
      alumnosIds: _parseAlumnosIds(json['alumnos']),
      devices: _parseDevices(json['devices']),
      activo: json['activo'] ?? true,
      createdAt:
          json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  /// Parsear IDs de alumnos (pueden venir como strings o como objetos)
  static List<String> _parseAlumnosIds(dynamic alumnos) {
    if (alumnos == null) return [];

    if (alumnos is List) {
      return alumnos
          .map((a) {
            if (a is String) return a;
            if (a is Map) return a['_id']?.toString() ?? '';
            return '';
          })
          .where((id) => id.isNotEmpty)
          .toList();
    }

    return [];
  }

  /// Parsear devices
  static List<Device> _parseDevices(dynamic devices) {
    if (devices == null) return [];

    if (devices is List) {
      return devices.map((d) => Device.fromJson(d)).toList();
    }

    return [];
  }

  /// Convertir a JSON para enviar al API
  Map<String, dynamic> toJson() {
    return {
      'nombre': nombre,
      'email': email,
      'telefono': telefono,
      'alumnos': alumnosIds,
      'activo': activo,
    };
  }

  /// Copiar con modificaciones
  Tutor copyWith({
    String? id,
    String? nombre,
    String? email,
    String? telefono,
    List<String>? alumnosIds,
    List<Device>? devices,
    bool? activo,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Tutor(
      id: id ?? this.id,
      nombre: nombre ?? this.nombre,
      email: email ?? this.email,
      telefono: telefono ?? this.telefono,
      alumnosIds: alumnosIds ?? this.alumnosIds,
      devices: devices ?? this.devices,
      activo: activo ?? this.activo,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Tutor(id: $id, nombre: $nombre, email: $email, alumnos: ${alumnosIds.length})';
  }
}

/// Modelo de Device (dispositivo del tutor)
class Device {
  final String deviceId;
  final String deviceType; // 'web' o 'mobile'
  final String? deviceName;
  final DateTime? lastLogin;
  final bool isActive;

  Device({
    required this.deviceId,
    required this.deviceType,
    this.deviceName,
    this.lastLogin,
    this.isActive = true,
  });

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      deviceId: json['deviceId'] ?? '',
      deviceType: json['deviceType'] ?? 'mobile',
      deviceName: json['deviceName'],
      lastLogin:
          json['lastLogin'] != null ? DateTime.parse(json['lastLogin']) : null,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'deviceId': deviceId,
      'deviceType': deviceType,
      'deviceName': deviceName,
      'isActive': isActive,
    };
  }

  @override
  String toString() {
    return 'Device(id: $deviceId, type: $deviceType, name: $deviceName)';
  }
}
