import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/alumno_provider.dart';
import 'providers/asistencia_provider.dart';
import 'pages/login.dart';
import 'pages/tutor/home_tutor.dart';
import 'pages/profesor/home_profesor.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AlumnoProvider()),
        ChangeNotifierProvider(create: (_) => AsistenciaProvider()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'KidoTag',
        theme: ThemeData(
          primaryColor: const Color(0xFF1B0B3A),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1B0B3A),
            foregroundColor: Colors.white,
          ),
          drawerTheme: const DrawerThemeData(backgroundColor: Colors.white),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

/// Wrapper para verificar autenticación y redirigir a la página correcta
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isChecking = true;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await context.read<AuthProvider>().checkAuthentication();
    if (mounted) {
      setState(() {
        _isChecking = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isChecking) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        if (!authProvider.isAuthenticated) {
          return const LoginPage();
        }

        // Redirigir según el rol del usuario
        if (authProvider.isTutor) {
          return const HomeTutor();
        } else if (authProvider.isProfesor) {
          return const HomeProfesor();
        } else {
          return const LoginPage();
        }
      },
    );
  }
}
