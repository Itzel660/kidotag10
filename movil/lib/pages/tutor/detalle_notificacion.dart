import 'package:flutter/material.dart';

class DetalleNotificacion extends StatelessWidget {
  const DetalleNotificacion({super.key, required this.noti});

  final Map<String, dynamic> noti;

  @override
  Widget build(BuildContext context) {
    final titulo = noti['titulo']?.toString() ?? 'Notificacion';
    final mensaje = noti['mensaje']?.toString() ?? 'Sin contenido';
    final fecha = noti['fecha']?.toString() ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle de notificacion')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              titulo,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            if (fecha.isNotEmpty)
              Text(
                fecha,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  fontWeight: FontWeight.w500,
                ),
              ),
            const SizedBox(height: 20),
            Expanded(
              child: SingleChildScrollView(
                child: Text(
                  mensaje,
                  style: const TextStyle(fontSize: 16, height: 1.5),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
