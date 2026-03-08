import 'package:flutter/material.dart';

class HistorialAsistencia extends StatefulWidget {
  const HistorialAsistencia({super.key});

  @override
  State<HistorialAsistencia> createState() => _HistorialAsistenciaState();
}

class _HistorialAsistenciaState extends State<HistorialAsistencia> {

  bool isLoading = true;

  List<Map<String, dynamic>> asistencias = [];

  @override
  void initState() {
    super.initState();
    cargarHistorial();
  }

  Future<void> cargarHistorial() async {
    await Future.delayed(const Duration(seconds: 2));

    setState(() {
      // Datos prueba
      asistencias = [
        {
          "fecha": "14/02/2026",
          "entrada": "07:32 AM",
          "salida": "01:45 PM",
          "asistio": true
        },
        {
          "fecha": "13/02/2026",
          "entrada": "--",
          "salida": "--",
          "asistio": false
        },
        {
          "fecha": "12/02/2026",
          "entrada": "07:28 AM",
          "salida": "01:40 PM",
          "asistio": true
        },
        {
          "fecha": "11/02/2026",
          "entrada": "07:32 AM",
          "salida": "01:45 PM",
          "asistio": true
        },
        {
          "fecha": "10/02/2026",
          "entrada": "--",
          "salida": "--",
          "asistio": false
        },
        {
          "fecha": "09/02/2026",
          "entrada": "07:28 AM",
          "salida": "01:40 PM",
          "asistio": true
        },
        {
          "fecha": "08/02/2026",
          "entrada": "",
          "salida": "",
          "asistio": false
        },
        {
          "fecha": "07/02/2026",
          "entrada": "--",
          "salida": "--",
          "asistio": false
        },
        {
          "fecha": "06/02/2026",
          "entrada": "07:28 AM",
          "salida": "01:40 PM",
          "asistio": true
        },
      ];

      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text("Historial de Asistencia"),
        centerTitle: true,
      ),

      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : asistencias.isEmpty
          ? const Center(child: Text("No hay registros"))
          : ListView.builder(
        padding: const EdgeInsets.all(15),
        itemCount: asistencias.length,
        itemBuilder: (context, index) {

          final item = asistencias[index];

          return Card(
            elevation: 4,
            margin: const EdgeInsets.only(bottom: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [


                  Text(
                    item["fecha"],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 10),

                  if (item["asistio"]) ...[
                    Row(
                      children: [
                        const Icon(Icons.login, color: Colors.green),
                        const SizedBox(width: 8),
                        Text("Entrada: ${item["entrada"]}"),
                      ],
                    ),

                    const SizedBox(height: 5),

                    Row(
                      children: [
                        const Icon(Icons.logout, color: Colors.red),
                        const SizedBox(width: 8),
                        Text("Salida: ${item["salida"]}"),
                      ],
                    ),
                  ] else ...[
                    Row(
                      children: const [
                        Icon(Icons.cancel, color: Colors.red),
                        SizedBox(width: 8),
                        Text("No asistió"),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
