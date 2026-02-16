import 'package:flutter/material.dart';
import 'profesor/home_profesor.dart';
import 'tutor/home_tutor.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final userController = TextEditingController();
  final passController = TextEditingController();

  void iniciarSesion() {
    String usuario = userController.text.trim().toLowerCase();
    String password = passController.text.trim();

    if (usuario == 'profesor' && password == '1234') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeProfesor()),
      );
    } else if (usuario == 'tutor' && password == '1234') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeTutor()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Usuario o contraseña incorrectos')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_person_rounded, size: 80),
            const SizedBox(height: 30),

            TextField(
              controller: userController,
              decoration: const InputDecoration(
                labelText: 'Usuario',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),

            TextField(
              controller: passController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: 'Contraseña',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 30),

            ElevatedButton(
              onPressed: iniciarSesion,
              child: const Text('Ingresar'),
            ),
          ],
        ),
      ),
    );
  }
}
