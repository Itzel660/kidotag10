import 'package:flutter/material.dart';
import '../login.dart';
import 'historial_asistencia.dart';
import 'notificacion.dart';
import 'subir_justificante.dart';


class MenuTutor extends StatelessWidget {
  const MenuTutor({super.key});

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
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [

            const Icon(Icons.person, color: Colors.white,size: 80),

            Text(
              'Tutor',
              style: TextStyle(color: Colors.white, fontSize: 22),
            ),
    ]
          ),
          ),

          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Historial de Asistencias'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const HistorialAsistencia(),
                ),
              );
            },
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.upload_file),
            title: const Text('Subir Justificante'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const SubirJustificante(),
                ),
              );
            },
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.notifications),
            title: const Text('Notificaciones'),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const NotificacionesTutor(),
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
      )
      ,
    );
  }
}
