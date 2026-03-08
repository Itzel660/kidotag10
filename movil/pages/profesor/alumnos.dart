import 'package:flutter/material.dart';

class AlumnosProfesor extends StatelessWidget {
  const AlumnosProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lista de Alumnos'),
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
