import 'package:flutter/material.dart';
import 'menu_profesor.dart';

class HomeProfesor extends StatelessWidget {
  const HomeProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Panel Profesor'),
      ),

      drawer: const MenuProfesor(),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.construction, size: 60, color: Colors.grey),
            SizedBox(height: 20),
            Text(
              "Módulo Profesor",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              "Pendiente conexión DB",
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
