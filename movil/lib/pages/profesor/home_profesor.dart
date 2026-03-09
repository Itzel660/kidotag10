import 'package:flutter/material.dart';
import 'menu_profesor.dart';
import 'package:fl_chart/fl_chart.dart';

class HomeProfesor extends StatelessWidget {
  const HomeProfesor({super.key});

  @override
  Widget build(BuildContext context) {

    /// DATOS SIMULADOS (luego vendrán de Mongo)
    final grupo = "3° B";
    final totalAlumnos = 30;
    final presentes = 25;
    final ausentes = totalAlumnos - presentes;

    final porcentaje = (presentes / totalAlumnos * 100).round();

    final fechaHoy =
        "${DateTime.now().day}/${DateTime.now().month}/${DateTime.now().year}";

    return Scaffold(
      drawer: const MenuProfesor(),
      appBar: AppBar(title: const Text("Profesor"), centerTitle: true,),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Scrollbar(
    child:SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [

            /// TARJETA PRINCIPAL
            Card(
              elevation: 6,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [

                    Text(
                      "Grupo $grupo",
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold),
                    ),

                    const SizedBox(height: 10),

                    Text(
                      "Asistencia del día $fechaHoy",
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        fontSize: 16,
                      ),
                    ),

                    const SizedBox(height: 20),

                    /// PORCENTAJE
                    SizedBox(
                      height: 220,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          PieChart(
                            PieChartData(
                              sectionsSpace: 3,
                              centerSpaceRadius: 60,
                              sections: [
                                PieChartSectionData(
                                  value: presentes.toDouble(),
                                  color: Colors.green,
                                  radius: 50,
                                  title: "",
                                ),
                                PieChartSectionData(
                                  value: ausentes.toDouble(),
                                  color: Colors.grey,
                                  radius: 50,
                                  title: "",
                                ),
                              ],
                            ),
                          ),

                          /// Texto en el centro
                          Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "$porcentaje%",
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: porcentaje >= 80
                                      ? Colors.green
                                      : Colors.grey,
                                ),
                              ),
                              const Text("Asistencia")
                            ],
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        indicador(Color(0xFF4CAF50), "Presentes: $presentes"),
                        indicador(Colors.grey, "Ausentes: $ausentes"),
                      ],
                    ),

                  ],
                ),
              ),
            ),

            const SizedBox(height: 30),

            /// DESGLOSE
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [

                    const Text(
                      "Resumen del grupo",
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold),
                    ),

                    const SizedBox(height: 20),

                    filaDato("Total alumnos:", totalAlumnos.toString()),
                    filaDato("Presentes:", presentes.toString(),
                        color: Colors.green),
                    filaDato("Ausentes:", ausentes.toString(),
                        color: Colors.grey),
                  ],
                ),
              ),
            )
          ],
        ),
    ),
        ),
      ),
    );
  }

  Widget filaDato(String titulo, String valor, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(

            children: [
              Icon(
                  Icons.account_circle_rounded,
                  size: 20,
                  color: color ?? Colors.black,
              ),
          Text(titulo, style: const TextStyle(fontSize: 16)),
          Text(
            valor,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          )
         ]
          ),
        ],
      ),
    );
  }
  Widget indicador(Color color, String texto) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Text(texto),
      ],
    );
  }
}
