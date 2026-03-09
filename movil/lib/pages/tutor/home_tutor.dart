import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/alumno_provider.dart';
import '../../providers/asistencia_provider.dart';
import '../login.dart';

class HomeTutor extends StatefulWidget {
  const HomeTutor({super.key});

  @override
  State<HomeTutor> createState() => _HomeTutorState();
}

class _HomeTutorState extends State<HomeTutor> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final alumnoProvider = context.read<AlumnoProvider>();
    final asistenciaProvider = context.read<AsistenciaProvider>();

    // Cargar alumnos y asistencias en paralelo
    await Future.wait([
      alumnoProvider.loadAlumnos(),
      asistenciaProvider.loadAsistenciasHoy(),
    ]);
  }

  Future<void> _handleLogout() async {
    final authProvider = context.read<AuthProvider>();
    final alumnoProvider = context.read<AlumnoProvider>();
    final asistenciaProvider = context.read<AsistenciaProvider>();

    await authProvider.logout();

    // Limpiar datos de los providers
    alumnoProvider.clear();
    asistenciaProvider.clear();

    if (!mounted) return;

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginPage()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final alumnoProvider = context.watch<AlumnoProvider>();
    final asistenciaProvider = context.watch<AsistenciaProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Hola, ${authProvider.tutor?.nombre ?? "Tutor"}'),
        centerTitle: true,
      ),

      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Color(0xFF1B0B3A)),

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset('assets/icon/kido.png', width: 80, height: 80),
                  const SizedBox(height: 10),
                  Text(
                    'KidoTag',
                    style: TextStyle(color: Colors.white, fontSize: 20),
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Pantalla Principal'),
              onTap: () {
                Navigator.pop(context);
              },
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.access_time_filled),
              title: const Text('Entradas y Salidas'),
              onTap: () {
                Navigator.pop(context);
              },
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.notifications),
              title: const Text('Notificaciones'),
              onTap: () {
                Navigator.pop(context);
              },
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.add_circle_outlined),
              title: const Text('Subir Justificante'),
              onTap: () {
                Navigator.pop(context);
              },
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Cerrar sesión'),
              onTap: _handleLogout,
            ),
            const Divider(),
          ],
        ),
      ),

      body: RefreshIndicator(
        onRefresh: _loadData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Card de Resumen
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Resumen',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatCard(
                            icon: Icons.people,
                            label: 'Mis Alumnos',
                            value:
                                alumnoProvider.isLoading
                                    ? '...'
                                    : '${alumnoProvider.totalAlumnos}',
                            color: Colors.blue,
                          ),
                          _buildStatCard(
                            icon: Icons.check_circle,
                            label: 'Asistencias Hoy',
                            value:
                                asistenciaProvider.isLoading
                                    ? '...'
                                    : '${asistenciaProvider.totalAsistencias}',
                            color: Colors.green,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Card de Alumnos
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Mis Alumnos',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (alumnoProvider.isLoading)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (alumnoProvider.error != null)
                        Text(
                          'Error: ${alumnoProvider.error}',
                          style: const TextStyle(color: Colors.red),
                        )
                      else if (alumnoProvider.alumnos.isEmpty &&
                          !alumnoProvider.isLoading)
                        const Text('No hay alumnos asignados')
                      else
                        ...alumnoProvider.alumnos.take(5).map((alumno) {
                          final ultimaAsistencia = asistenciaProvider
                              .getUltimaAsistencia(alumno.uidTarjeta);
                          return ListTile(
                            leading: CircleAvatar(
                              child: Text(alumno.nombre[0].toUpperCase()),
                            ),
                            title: Text(alumno.nombre),
                            subtitle: Text('UID: ${alumno.uidTarjeta}'),
                            trailing:
                                ultimaAsistencia != null
                                    ? Chip(
                                      label: Text(
                                        ultimaAsistencia.tipo,
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                      backgroundColor:
                                          ultimaAsistencia.esEntrada
                                              ? Colors.green[100]
                                              : Colors.red[100],
                                    )
                                    : null,
                          );
                        }),
                      if (alumnoProvider.alumnos.length > 5)
                        TextButton(
                          onPressed: () {
                            // TODO: Navegar a lista completa de alumnos
                          },
                          child: const Text('Ver todos'),
                        ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Card de Asistencias de Hoy
              Card(
                elevation: 4,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Asistencias de Hoy',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (asistenciaProvider.isLoading)
                            const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (asistenciaProvider.error != null)
                        Text(
                          'Error: ${asistenciaProvider.error}',
                          style: const TextStyle(color: Colors.red),
                        )
                      else if (asistenciaProvider.asistencias.isEmpty &&
                          !asistenciaProvider.isLoading)
                        const Text('No hay asistencias hoy')
                      else
                        ...asistenciaProvider.asistencias.take(10).map((
                          asistencia,
                        ) {
                          final alumno = alumnoProvider.getAlumnoByUid(
                            asistencia.uidTarjeta,
                          );
                          return ListTile(
                            leading: Icon(
                              asistencia.esEntrada ? Icons.login : Icons.logout,
                              color:
                                  asistencia.esEntrada
                                      ? Colors.green
                                      : Colors.red,
                              size: 30,
                            ),
                            title: Text(alumno?.nombre ?? asistencia.nombre),
                            subtitle: Text(asistencia.horaFormateadaAMPM),
                            trailing: Chip(
                              label: Text(
                                asistencia.tipo,
                                style: const TextStyle(fontSize: 12),
                              ),
                              backgroundColor:
                                  asistencia.esEntrada
                                      ? Colors.green[100]
                                      : Colors.red[100],
                            ),
                          );
                        }),
                      if (asistenciaProvider.asistencias.length > 10)
                        TextButton(
                          onPressed: () {
                            // TODO: Navegar a lista completa de asistencias
                          },
                          child: const Text('Ver todas'),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Column(
      children: [
        Icon(icon, size: 40, color: color),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }
}
