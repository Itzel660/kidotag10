import 'package:flutter/material.dart';
import '../../data/notificaciones.dart';
import 'detalle_notificacion.dart';

class NotificacionesTutor extends StatefulWidget {
  const NotificacionesTutor({super.key});

  @override
  State<NotificacionesTutor> createState() => _NotificacionesTutorState();
}

class _NotificacionesTutorState extends State<NotificacionesTutor> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Notificaciones")),

      body: ValueListenableBuilder(
        valueListenable: notificacionesDB,
        builder: (context, lista, _) {
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: lista.length,
            itemBuilder: (context, index) {
              final noti = lista[index];

              return GestureDetector(
                onTap: () {
                  final nuevaLista = [...notificacionesDB.value];
                  nuevaLista[index]["leido"] = true;
                  notificacionesDB.value = nuevaLista;

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) =>
                          DetalleNotificacion(noti: nuevaLista[index]),
                    ),
                  );
                },

                child: Card(
                  color: noti["leido"]
                      ? Colors.white
                      : Colors.blue.shade50,
                  elevation: 4,
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    title: Text(
                      noti["titulo"],
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(noti["mensaje"]),
                    trailing: Text(noti["fecha"]),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
