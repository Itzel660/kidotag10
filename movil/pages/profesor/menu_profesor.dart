import 'package:flutter/material.dart';
import '../login.dart';
import 'alumnos.dart';
import 'notificacion_profesor.dart';
import 'validar_justificante.dart';


class MenuProfesor extends StatelessWidget {
  const MenuProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(
              color: Color(0xFF1B0B3A),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center ,
            children: [
              Icon(Icons.school,size: 80,color: Colors.white),
              Text(
              'Profesor',
              style: TextStyle(color: Colors.white, fontSize: 22),
            ),
          ],
          ),
          ),

          ListTile(
            leading: const Icon(Icons.group),
            title: const Text('Lista de Alumnos'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const AlumnosProfesor(),
                ),
              );
            },
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.description),
            title: const Text('Justificantes'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const JustificantesProfesor(),
                ),
              );
            },
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Enviar Notificación'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const NotificacionProfesor(),
                ),
              );
            },
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.logout),
            title: const Text('Cerrar sesión'),
            onTap: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (_) => const LoginPage(),
                ),
              );
            },
          ),
          const Divider(),
        ],
      ),
    );
  }
}
