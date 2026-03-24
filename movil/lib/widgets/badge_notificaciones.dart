import 'package:flutter/material.dart';
import '../data/notificaciones.dart';

class BadgeNotificaciones extends StatelessWidget {
  final VoidCallback onTap;

  const BadgeNotificaciones({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: notificacionesDB,
      builder: (context, value, _) {
        int cantidad =
            value.where((n) => n["leido"] == false).length;

        return Stack(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications),
              onPressed: onTap,
            ),

            if (cantidad > 0)
              Positioned(
                right: 6,
                top: 6,
                child: Container(
                  padding: const EdgeInsets.all(5),
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    cantidad.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}