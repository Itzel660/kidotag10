import 'package:flutter/material.dart';
import 'package:kidotag/pages/profesor/menu_profesor.dart';

class AlumnosProfesor extends StatelessWidget {
  const AlumnosProfesor({super.key});

  @override
  Widget build(BuildContext context) {
    /// DATOS SIMULADOS
    final alumnos = [
      {"nombre": "Ana López", "estado": "Presente"},
      {"nombre": "Carlos Ruiz", "estado": "Falta justificada"},
      {"nombre": "María Torres", "estado": "Presente"},
      {"nombre": "Luis Pérez", "estado": "Presente"},
      {"nombre": "Sofía Díaz", "estado": "Falta"},
      {"nombre": "Marco Pérez", "estado": "Falta injustificada"},
    ];

    return Scaffold(
      drawer: MenuProfesor(),
      appBar: AppBar(title: const Text("Alumnos del Grupo"),centerTitle: true,),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: alumnos.length,

        itemBuilder: (context, index) {

          final alumno = alumnos[index];

          final estado = alumno["estado"] ;

          Color colorEstado;
          IconData iconoEstado;

          switch (estado) {
            case "Presente":
              colorEstado = Colors.green;
              iconoEstado = Icons.account_circle_rounded;
              break;

            case "Falta justificada":
              colorEstado = Colors.lightGreen;
              iconoEstado = Icons.account_circle_rounded;
              break;

            case "Falta injustificada":
              colorEstado = Colors.grey.shade800;
              iconoEstado = Icons.account_circle_rounded;
              break;

            default: // "Falta"
              colorEstado = Colors.grey;
              iconoEstado = Icons.account_circle_outlined;
          }

          return Card(
            elevation: 4,
            margin: const EdgeInsets.only(bottom: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor:colorEstado,
                child: Icon(
                  iconoEstado,
                  color: Colors.white,
                ),
              ),
              title: Text(
                alumno["nombre"]!,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(alumno["estado"]!),
              //trailing: const Icon(Icons.arrow_forward_ios, size: 18),
              onTap: () {
               /// luego abriremos historial del alumno
              },
            ),
          );
        },
      ),
    );
  }
}
