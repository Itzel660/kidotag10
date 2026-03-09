import 'package:flutter/material.dart';

class JustificantesProfesor extends StatelessWidget {
  const JustificantesProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Justificantes'),
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
