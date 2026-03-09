import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'profesor/home_profesor.dart';
import 'tutor/home_tutor.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final emailController = TextEditingController();
  final passController = TextEditingController();
  String tipoUsuario = 'tutor'; // 'tutor' o 'profesor'

  @override
  void dispose() {
    emailController.dispose();
    passController.dispose();
    super.dispose();
  }

  Future<void> iniciarSesion() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = context.read<AuthProvider>();

    bool success = false;

    if (tipoUsuario == 'tutor') {
      success = await authProvider.loginTutor(
        emailController.text.trim(),
        passController.text.trim(),
      );
    } else {
      success = await authProvider.loginProfesor(
        emailController.text.trim(),
        passController.text.trim(),
      );
    }

    if (!mounted) return;

    if (success) {
      // La navegación se maneja automáticamente por el AuthWrapper
      // Pero podemos navegar manualmente si lo preferimos
      if (authProvider.isTutor) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeTutor()),
        );
      } else if (authProvider.isProfesor) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeProfesor()),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(authProvider.error ?? 'Error al iniciar sesión'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Iniciar sesión'), centerTitle: true),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_person_rounded, size: 80),
              const SizedBox(height: 30),

              // Selector de tipo de usuario
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'tutor',
                    label: Text('Tutor'),
                    icon: Icon(Icons.family_restroom),
                  ),
                  ButtonSegment(
                    value: 'profesor',
                    label: Text('Profesor'),
                    icon: Icon(Icons.school),
                  ),
                ],
                selected: {tipoUsuario},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    tipoUsuario = newSelection.first;
                  });
                },
              ),
              const SizedBox(height: 20),

              // Campo de email
              TextFormField(
                controller: emailController,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.email),
                ),
                keyboardType: TextInputType.emailAddress,
                enabled: !authProvider.isLoading,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingresa tu email';
                  }
                  if (!value.contains('@')) {
                    return 'Email inválido';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Campo de contraseña
              TextFormField(
                controller: passController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Contraseña',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock),
                ),
                enabled: !authProvider.isLoading,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Ingresa tu contraseña';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 30),

              // Botón de login
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: authProvider.isLoading ? null : iniciarSesion,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1B0B3A),
                    foregroundColor: Colors.white,
                  ),
                  child:
                      authProvider.isLoading
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                          : const Text(
                            'Ingresar',
                            style: TextStyle(fontSize: 16),
                          ),
                ),
              ),

              // Información de prueba (puedes eliminar esto en producción)
              if (!authProvider.isLoading)
                Padding(
                  padding: const EdgeInsets.only(top: 20),
                  child: Text(
                    'Demo: maria@example.com / password123',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
