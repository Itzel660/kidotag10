/**
 * Script para crear datos de prueba en el API
 *
 * Ejecutar con: node scripts/crear-datos-prueba.js
 */

const mongoose = require("mongoose");

// Conectar a MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/kidotag";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✓ Conectado a MongoDB"))
  .catch((err) => {
    console.error("✗ Error al conectar a MongoDB:", err);
    process.exit(1);
  });

// Importar modelos
const Tutor = require("../src/models/tutor.model");
const Profesor = require("../src/models/profesor.model");
const Alumno = require("../src/models/alumno.model");
const Asistencia = require("../src/models/asistencia.model");
const Grupo = require("../src/models/grupo.model");

async function crearDatosPrueba() {
  try {
    console.log("\n=== CREANDO DATOS DE PRUEBA ===\n");

    // 1. Crear alumnos
    console.log("1. Creando alumnos...");
    const alumnos = await Alumno.create([
      { nombre: "Juan Pérez", uidTarjeta: "UID001" },
      { nombre: "María García", uidTarjeta: "UID002" },
      { nombre: "Pedro López", uidTarjeta: "UID003" },
      { nombre: "Ana Martínez", uidTarjeta: "UID004" },
      { nombre: "Carlos Rodríguez", uidTarjeta: "UID005" },
    ]);
    console.log(`   ✓ ${alumnos.length} alumnos creados`);

    // 2. Crear tutor
    console.log("\n2. Creando tutor...");
    const tutor = await Tutor.create({
      nombre: "María González",
      email: "maria@example.com",
      password: "password123", // Se hasheará automáticamente
      telefono: "555-1234",
      alumnos: [alumnos[0]._id, alumnos[1]._id, alumnos[2]._id], // María tiene 3 alumnos
      activo: true,
    });
    console.log(`   ✓ Tutor creado: ${tutor.nombre} (${tutor.email})`);
    console.log(`   ✓ Contraseña: password123`);
    console.log(`   ✓ Alumnos asignados: ${tutor.alumnos.length}`);

    // 3. Crear otro tutor
    console.log("\n3. Creando segundo tutor...");
    const tutor2 = await Tutor.create({
      nombre: "José Ramírez",
      email: "jose@example.com",
      password: "password123",
      telefono: "555-5678",
      alumnos: [alumnos[3]._id, alumnos[4]._id], // José tiene 2 alumnos
      activo: true,
    });
    console.log(`   ✓ Tutor creado: ${tutor2.nombre} (${tutor2.email})`);

    // 4. Crear profesor
    console.log("\n4. Creando profesor...");
    const profesor = await Profesor.create({
      nombre: "Dr. Roberto Sánchez",
      email: "roberto@example.com",
      password: "password123",
      especialidad: "Matemáticas",
      activo: true,
    });
    console.log(`   ✓ Profesor creado: ${profesor.nombre} (${profesor.email})`);
    console.log(`   ✓ Contraseña: password123`);

    // 5. Crear grupo
    console.log("\n5. Creando grupo...");
    const grupo = await Grupo.create({
      nombre: "6to Grado A",
      profesor: profesor._id,
      alumnos: [alumnos[0]._id, alumnos[1]._id, alumnos[2]._id],
      horario: "Lunes a Viernes 8:00-14:00",
    });
    console.log(`   ✓ Grupo creado: ${grupo.nombre}`);
    console.log(`   ✓ Alumnos en grupo: ${grupo.alumnos.length}`);

    // 6. Crear asistencias de hoy
    console.log("\n6. Creando asistencias de hoy...");
    const hoy = new Date();
    const asistenciasHoy = [];

    // Entrada de Juan a las 8:00 AM
    const entrada1 = new Date(hoy);
    entrada1.setHours(8, 0, 0, 0);
    asistenciasHoy.push({
      uidTarjeta: "UID001",
      nombre: "Juan Pérez",
      tipo: "entrada",
      fechaHora: entrada1,
    });

    // Entrada de María a las 8:05 AM
    const entrada2 = new Date(hoy);
    entrada2.setHours(8, 5, 0, 0);
    asistenciasHoy.push({
      uidTarjeta: "UID002",
      nombre: "María García",
      tipo: "entrada",
      fechaHora: entrada2,
    });

    // Entrada de Pedro a las 8:10 AM
    const entrada3 = new Date(hoy);
    entrada3.setHours(8, 10, 0, 0);
    asistenciasHoy.push({
      uidTarjeta: "UID003",
      nombre: "Pedro López",
      tipo: "entrada",
      fechaHora: entrada3,
    });

    // Salida de Juan a las 2:00 PM
    const salida1 = new Date(hoy);
    salida1.setHours(14, 0, 0, 0);
    asistenciasHoy.push({
      uidTarjeta: "UID001",
      nombre: "Juan Pérez",
      tipo: "salida",
      fechaHora: salida1,
    });

    // Salida de María a las 2:05 PM
    const salida2 = new Date(hoy);
    salida2.setHours(14, 5, 0, 0);
    asistenciasHoy.push({
      uidTarjeta: "UID002",
      nombre: "María García",
      tipo: "salida",
      fechaHora: salida2,
    });

    await Asistencia.create(asistenciasHoy);
    console.log(`   ✓ ${asistenciasHoy.length} asistencias de hoy creadas`);

    // 7. Crear asistencias de días anteriores
    console.log("\n7. Creando asistencias de días anteriores...");
    const asistenciasAnteriores = [];

    // Ayer
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const entradaAyer = new Date(ayer);
    entradaAyer.setHours(8, 0, 0, 0);
    asistenciasAnteriores.push({
      uidTarjeta: "UID001",
      nombre: "Juan Pérez",
      tipo: "entrada",
      fechaHora: entradaAyer,
    });

    const salidaAyer = new Date(ayer);
    salidaAyer.setHours(14, 0, 0, 0);
    asistenciasAnteriores.push({
      uidTarjeta: "UID001",
      nombre: "Juan Pérez",
      tipo: "salida",
      fechaHora: salidaAyer,
    });

    await Asistencia.create(asistenciasAnteriores);
    console.log(
      `   ✓ ${asistenciasAnteriores.length} asistencias anteriores creadas`,
    );

    // Resumen
    console.log("\n=== RESUMEN ===\n");
    console.log("Credenciales de acceso:");
    console.log("\nTUTORES:");
    console.log("  Email: maria@example.com");
    console.log("  Password: password123");
    console.log("  Alumnos: 3 (Juan, María, Pedro)");
    console.log("");
    console.log("  Email: jose@example.com");
    console.log("  Password: password123");
    console.log("  Alumnos: 2 (Ana, Carlos)");
    console.log("\nPROFESOR:");
    console.log("  Email: roberto@example.com");
    console.log("  Password: password123");
    console.log("  Grupo: 6to Grado A (3 alumnos)");
    console.log("\nALUMNOS:");
    alumnos.forEach((a) => {
      console.log(`  - ${a.nombre} (UID: ${a.uidTarjeta})`);
    });
    console.log("\nASISTENCIAS:");
    console.log(`  - Hoy: ${asistenciasHoy.length}`);
    console.log(`  - Anteriores: ${asistenciasAnteriores.length}`);
    console.log("\n✓ Datos de prueba creados exitosamente\n");
  } catch (error) {
    console.error("\n✗ Error al crear datos de prueba:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Conexión a MongoDB cerrada");
  }
}

// Función para limpiar datos existentes (opcional)
async function limpiarDatos() {
  console.log("\n=== LIMPIANDO DATOS EXISTENTES ===\n");

  await Asistencia.deleteMany({});
  console.log("   ✓ Asistencias eliminadas");

  await Grupo.deleteMany({});
  console.log("   ✓ Grupos eliminados");

  await Tutor.deleteMany({});
  console.log("   ✓ Tutores eliminados");

  await Profesor.deleteMany({});
  console.log("   ✓ Profesores eliminados");

  await Alumno.deleteMany({});
  console.log("   ✓ Alumnos eliminados");
}

// Ejecutar
(async () => {
  const args = process.argv.slice(2);
  const limpiar = args.includes("--clean");

  if (limpiar) {
    await limpiarDatos();
  }

  await crearDatosPrueba();
})();
