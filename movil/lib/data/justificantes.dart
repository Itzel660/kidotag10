import 'package:flutter/material.dart';

ValueNotifier<List<Map<String, dynamic>>> justificantesDB =
ValueNotifier([
  {
    "id": "1",
    "alumno": "Juan Pérez",
    "fecha": "10/03/2026",
    "comentario": "El alumno estuvo enfermo",
    "imagen": "https://udocz-cdn-hop.b-cdn.net/documents_html/1089837-51952e48634f655923a5b4fe9b824984/bg1.jpg",
    "estado": "Pendiente"
  },
  {
    "id": "2",
    "alumno": "Ana López",
    "fecha": "09/03/2026",
    "comentario": "Cita médica",
    "imagen": "https://es.scribd.com/document/656399374/JUSTIFICANTE",
    "estado": "Pendiente"
  }
]);