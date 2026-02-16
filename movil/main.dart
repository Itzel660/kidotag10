import 'package:flutter/material.dart';
import 'pages/login.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'KidoTag',
      theme: ThemeData(
        primaryColor: const Color(0xFF1B0B3A),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1B0B3A),
          foregroundColor: Colors.white,
        ),
        drawerTheme: const DrawerThemeData(backgroundColor: Colors.white),
      ),
      home: LoginPage(),
    );
  }
}
