import 'package:flutter/material.dart';
import '../../data/notificaciones.dart';

class NotificacionProfesor extends StatefulWidget {
  const NotificacionProfesor({super.key});

  @override
  State<NotificacionProfesor> createState() => _NotificacionProfesorState();
}

class _NotificacionProfesorState extends State<NotificacionProfesor> {
  final tituloCtrl = TextEditingController();
  final mensajeCtrl = TextEditingController();

  void enviar() {
    final titulo = tituloCtrl.text.trim();
    final mensaje = mensajeCtrl.text.trim();

    if (titulo.isEmpty && mensaje.isEmpty) {
      mostrarError("Debe ingresar título y mensaje");
      return;
    }

    if (titulo.isEmpty) {
      mostrarError("Debe ingresar titulo");
      return;
    }

    if (mensaje.isEmpty) {
      mostrarError("Debe ingresar mensaje");
      return;
    }

    final lista = [...notificacionesDB.value];

    lista.insert(0, {
      "id": DateTime.now().toString(),
      "titulo": titulo,
      "mensaje": mensaje,
      "fecha": DateTime.now().toString().substring(0, 10),
      "leido": false
    });

    notificacionesDB.value = lista;

    Navigator.pop(context);
  }

  void mostrarError(String texto) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texto),
        backgroundColor: Colors.grey,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Enviar Notificación")),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: tituloCtrl,
              decoration: const InputDecoration(labelText: "Título"),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: mensajeCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
              labelText: "Mensaje",
              hintText: "Escriba su mensaje...",
              border: OutlineInputBorder(),
            ),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: enviar,
              child: const Text("Enviar"),
            )
          ],
        ),
      ),
    );
  }

}
