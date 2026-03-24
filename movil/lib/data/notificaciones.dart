import 'package:flutter/material.dart';

ValueNotifier<List<Map<String, dynamic>>> notificacionesDB =
ValueNotifier([
  {
    "id": "1",
    "titulo": "Reunión Escolar",
    "mensaje": "El día 22 de febrero se realizara una reunion referente a las calificaciones de los dos primeros meses del año",
    "fecha": "21/02/2026",
    "leido": false
  }
]);

int contarNoLeidas() {
  return notificacionesDB.value
      .where((n) => n["leido"] == false)
      .length;
}