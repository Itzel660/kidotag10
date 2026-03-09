/// Modelo de Asistencia
///
/// Representa un registro de asistencia (entrada o salida)
class Asistencia {
  final String uidTarjeta;
  final String nombre;
  final String tipo; // 'entrada' o 'salida'
  final DateTime fechaHora;

  Asistencia({
    required this.uidTarjeta,
    required this.nombre,
    required this.tipo,
    required this.fechaHora,
  });

  /// Crear Asistencia desde JSON del API
  factory Asistencia.fromJson(Map<String, dynamic> json) {
    return Asistencia(
      uidTarjeta: json['uidTarjeta'] ?? '',
      nombre: json['nombre'] ?? '',
      tipo: json['tipo'] ?? '',
      fechaHora: DateTime.parse(json['fechaHora']),
    );
  }

  /// Convertir a JSON
  Map<String, dynamic> toJson() {
    return {
      'uidTarjeta': uidTarjeta,
      'nombre': nombre,
      'tipo': tipo,
      'fechaHora': fechaHora.toIso8601String(),
    };
  }

  /// Verificar si es entrada
  bool get esEntrada => tipo.toLowerCase() == 'entrada';

  /// Verificar si es salida
  bool get esSalida => tipo.toLowerCase() == 'salida';

  /// Obtener fecha sin hora
  DateTime get soloFecha {
    return DateTime(fechaHora.year, fechaHora.month, fechaHora.day);
  }

  /// Obtener hora formateada (HH:mm)
  String get horaFormateada {
    final hour = fechaHora.hour.toString().padLeft(2, '0');
    final minute = fechaHora.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  /// Obtener hora con AM/PM
  String get horaFormateadaAMPM {
    final hour = fechaHora.hour > 12 ? fechaHora.hour - 12 : fechaHora.hour;
    final minute = fechaHora.minute.toString().padLeft(2, '0');
    final period = fechaHora.hour >= 12 ? 'PM' : 'AM';
    return '${hour.toString().padLeft(2, '0')}:$minute $period';
  }

  /// Obtener fecha formateada (dd/MM/yyyy)
  String get fechaFormateada {
    final day = fechaHora.day.toString().padLeft(2, '0');
    final month = fechaHora.month.toString().padLeft(2, '0');
    final year = fechaHora.year;
    return '$day/$month/$year';
  }

  @override
  String toString() {
    return 'Asistencia($nombre, $tipo, ${fechaFormateada} ${horaFormateada})';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Asistencia &&
        other.uidTarjeta == uidTarjeta &&
        other.fechaHora == fechaHora &&
        other.tipo == tipo;
  }

  @override
  int get hashCode => Object.hash(uidTarjeta, fechaHora, tipo);
}

/// Helper para agrupar asistencias por fecha
class AsistenciaDia {
  final DateTime fecha;
  final List<Asistencia> asistencias;

  AsistenciaDia({required this.fecha, required this.asistencias});

  /// Obtener entrada del día (si existe)
  Asistencia? get entrada {
    try {
      return asistencias.firstWhere((a) => a.esEntrada);
    } catch (e) {
      return null;
    }
  }

  /// Obtener salida del día (si existe)
  Asistencia? get salida {
    try {
      return asistencias.firstWhere((a) => a.esSalida);
    } catch (e) {
      return null;
    }
  }

  /// Verificar si asistió (tiene entrada)
  bool get asistio => entrada != null;

  /// Obtener fecha formateada
  String get fechaFormateada {
    final day = fecha.day.toString().padLeft(2, '0');
    final month = fecha.month.toString().padLeft(2, '0');
    final year = fecha.year;
    return '$day/$month/$year';
  }

  /// Agrupar lista de asistencias por fecha
  static List<AsistenciaDia> agruparPorFecha(List<Asistencia> asistencias) {
    final Map<DateTime, List<Asistencia>> agrupadas = {};

    for (var asistencia in asistencias) {
      final fecha = asistencia.soloFecha;
      if (!agrupadas.containsKey(fecha)) {
        agrupadas[fecha] = [];
      }
      agrupadas[fecha]!.add(asistencia);
    }

    return agrupadas.entries
        .map(
          (entry) => AsistenciaDia(fecha: entry.key, asistencias: entry.value),
        )
        .toList()
      ..sort(
        (a, b) => b.fecha.compareTo(a.fecha),
      ); // Ordenar por fecha descendente
  }
}
