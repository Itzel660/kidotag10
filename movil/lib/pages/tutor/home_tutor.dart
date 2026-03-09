import 'package:flutter/material.dart';
import 'menu_tutor.dart';
import 'package:kidotag/widgets/badge_notificaciones.dart';
import '../tutor/notificacion.dart';

class HomeTutor extends StatefulWidget {
  const HomeTutor({super.key});

  @override
  State<HomeTutor> createState() => _HomeTutorState();
}

class _HomeTutorState extends State<HomeTutor> {
  bool isLoading = true;
  String nombreAlumno = "";
  bool asistioHoy = true; // Cambia a false para probar pantalla de no asistencia
  String fechaEntrada = "-- --";

  @override
  void initState() {
    super.initState();
    cargarDatos();
  }

  Future<void> cargarDatos() async {

    setState(() {
      nombreAlumno = "Diego López";

      if (asistioHoy) {
        fechaEntrada = "14/02/2026 - 07:32 AM";
      } else {
        fechaEntrada = "-- --";
      }

      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final hoy =
        "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}";

    return Scaffold(
      drawer: const MenuTutor(),
      appBar: AppBar(
        title: const Text("Estado del Alumno"),
        centerTitle: true,
        actions: [
          BadgeNotificaciones(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const NotificacionesTutor(),
                ),
              );
            },
          )
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [

            CircleAvatar(
              radius: 35,
              backgroundColor: Colors.blue.shade100,
              child: const Icon(
                Icons.account_circle,
                size: 50,
                color: Colors.blue,
              ),
            ),

            const SizedBox(height: 15),


            Text(
              nombreAlumno,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 5),


            Text(
              "Fecha: $hoy",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),

            const SizedBox(height: 25),


            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    vertical: 12, horizontal: 20),
                decoration: BoxDecoration(
                  color: asistioHoy ? Colors.green : Colors.grey,
                  borderRadius: BorderRadius.circular(30),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      asistioHoy ? Icons.check_circle : Icons.cancel,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      asistioHoy
                          ? "Dentro de la escuela"
                          : "No asistió",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),

            Center(
               child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                Text(
                  "Última entrada",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 10),

                Container(
                  padding: const EdgeInsets.all(15),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    fechaEntrada,
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ]
              ),
            ),




            const Spacer(),


            if (!asistioHoy)
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.orange,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  "Pendiente justificante",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
