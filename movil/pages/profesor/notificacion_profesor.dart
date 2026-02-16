import 'package:flutter/material.dart';

class NotificacionProfesor extends StatelessWidget {
  const NotificacionProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Enviar Notificación'),
      ),
      body: const Center(
        child: Text(
          "Pendiente conexión DB",
          style: TextStyle(color: Colors.grey),
        ),
      ),
    );
  }
}
