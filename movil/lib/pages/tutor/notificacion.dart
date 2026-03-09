import 'package:flutter/material.dart';

class NotificacionesTutor extends StatelessWidget {
  const NotificacionesTutor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
      ),
      body: const Center(
        child: Text(
          "Pendiente conexión DB",
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      ),
    );
  }
}
