import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class SubirJustificante extends StatefulWidget {
  const SubirJustificante({super.key});

  @override
  State<SubirJustificante> createState() => _SubirJustificanteState();
}

class _SubirJustificanteState extends State<SubirJustificante> {

  final TextEditingController comentarioController = TextEditingController();

  DateTime? fechaSeleccionada;
  File? imagen;
  bool isLoading = false;

  final ImagePicker picker = ImagePicker();


  Future<void> seleccionarFecha(BuildContext context) async {
    final DateTime? fecha = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2025),
      lastDate: DateTime.now(),
    );

    if (fecha != null) {
      setState(() {
        fechaSeleccionada = fecha;
      });
    }
  }


  Future<void> tomarFoto() async {
    final XFile? foto = await picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (foto != null) {
      setState(() {
        imagen = File(foto.path);
      });
    }
  }


  Future<void> elegirGaleria() async {
    final XFile? foto = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );

    if (foto != null) {
      setState(() {
        imagen = File(foto.path);
      });
    }
  }

  // Simulación de enviar justificante
  Future<void> enviarJustificante() async {

    if (fechaSeleccionada == null || imagen == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Seleccione fecha e imagen"),
        ),
      );
      return;
    }

    setState(() {
      isLoading = true;
    });

    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      isLoading = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("Justificante enviado correctamente"),
      ),
    );

    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Subir Justificante"),
        centerTitle: true,
      ),

      body:
     Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [


            ElevatedButton.icon(
              onPressed: () => seleccionarFecha(context),
              icon: const Icon(Icons.calendar_today),
              label: Text(
                fechaSeleccionada == null
                    ? "Seleccione fecha de la falta"
                    : "${fechaSeleccionada!.day}/${fechaSeleccionada!.month}/${fechaSeleccionada!.year}",
              ),
            ),

            TextField(
              controller: comentarioController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: "Motivo",
                hintText: "Escriba el motivo de la falta...",
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),


            if (imagen != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(
                  imagen!,
                  height: 200,
                  fit: BoxFit.cover,
                ),
              ),

            const SizedBox(height: 20),


            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [

                ElevatedButton.icon(
                  onPressed: tomarFoto,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text("Cámara"),
                ),

                ElevatedButton.icon(
                  onPressed: elegirGaleria,
                  icon: const Icon(Icons.photo),
                  label: const Text("Galería"),
                ),
              ],
            ),

            const Spacer(),

            isLoading
                ? const Center(child: CircularProgressIndicator())
                : ElevatedButton(
              onPressed: enviarJustificante,
              child: const Text("Enviar Justificante"),
            ),
          ],
        ),

      ),
    );
  }
}
