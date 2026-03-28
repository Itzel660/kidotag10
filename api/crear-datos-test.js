require("dotenv").config();
const mongoose = require("mongoose");
const Tutor = require("./src/models/tutor.model");
const Profesor = require("./src/models/profesor.model");
const Alumno = require("./src/models/alumno.model");
const Grupo = require("./src/models/grupo.model");

const crearDatos = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Conectado a MongoDB\n");

    // --- Crear 2 profesores (uno por grupo) ---
    const profesoresData = [
      {
        nombre: "Prof. Laura Martínez",
        email: "laura@kidotag.com",
        password: "prof123",
        telefono: "5550001111",
        especialidad: "Primer Grado",
        esAdmin: true,
        activo: true,
      },
      {
        nombre: "Prof. Roberto Sánchez",
        email: "roberto@kidotag.com",
        password: "prof123",
        telefono: "5550002222",
        especialidad: "Cuarto Grado",
        activo: true,
      },
    ];

    const profesores = [];
    for (const data of profesoresData) {
      let profesor = await Profesor.findOne({ email: data.email });
      if (profesor) {
        console.log(`⚠ Profesor ya existe: ${data.nombre} (${data.email})`);
      } else {
        profesor = new Profesor(data);
        await profesor.save();
        console.log(`✅ Profesor creado: ${data.nombre} (${data.email})`);
      }
      profesores.push(profesor);
    }

    // --- Crear 2 alumnos ---
    const alumnosData = [
      { nombre: "Sofía Pérez García", uidTarjeta: "A1B2C3D1" },
      { nombre: "Diego Pérez García", uidTarjeta: "A1B2C3D2" },
    ];

    const alumnos = [];
    for (const data of alumnosData) {
      let alumno = await Alumno.findOne({ uidTarjeta: data.uidTarjeta });
      if (alumno) {
        console.log(`⚠ Alumno ya existe: ${data.nombre} (${data.uidTarjeta})`);
      } else {
        alumno = new Alumno(data);
        await alumno.save();
        console.log(`✅ Alumno creado: ${data.nombre} (${data.uidTarjeta})`);
      }
      alumnos.push(alumno);
    }

    // --- Crear tutor con los 2 alumnos ---
    const tutorData = {
      nombre: "María Pérez",
      email: "maria@kidotag.com",
      password: "tutor123",
      telefono: "5553334444",
      alumnos: alumnos.map((a) => a._id),
      activo: true,
    };

    let tutor = await Tutor.findOne({ email: tutorData.email });
    if (tutor) {
      console.log(
        `⚠ Tutor ya existe: ${tutorData.nombre} (${tutorData.email})`,
      );
    } else {
      tutor = new Tutor(tutorData);
      await tutor.save();
      console.log(`✅ Tutor creado: ${tutorData.nombre} (${tutorData.email})`);
    }

    // --- Crear 2 grupos (grado 1 y grado 4) ---
    const gruposData = [
      {
        nombre: "Grupo 1A",
        descripcion: "Primer grado, grupo A",
        profesor: profesores[0]._id,
        alumnos: [alumnos[0]._id],
        horario: "Lunes-Viernes 8:00-13:00",
        activo: true,
      },
      {
        nombre: "Grupo 4A",
        descripcion: "Cuarto grado, grupo A",
        profesor: profesores[1]._id,
        alumnos: [alumnos[1]._id],
        horario: "Lunes-Viernes 8:00-14:00",
        activo: true,
      },
    ];

    for (const data of gruposData) {
      let grupo = await Grupo.findOne({ nombre: data.nombre });
      if (grupo) {
        console.log(`⚠ Grupo ya existe: ${data.nombre}`);
      } else {
        grupo = new Grupo(data);
        await grupo.save();
        console.log(`✅ Grupo creado: ${data.nombre}`);
      }
    }

    // --- Resumen ---
    console.log("\n========================================");
    console.log("         DATOS DE PRUEBA CREADOS");
    console.log("========================================\n");

    console.log("🔐 CREDENCIALES:\n");

    console.log("  Tutor:");
    console.log("    Email: maria@kidotag.com");
    console.log("    Password: tutor123");
    console.log(`    Alumnos: ${alumnos.map((a) => a.nombre).join(", ")}\n`);

    console.log("  Profesor (Admin) - Grupo 1A:");
    console.log("    Email: laura@kidotag.com");
    console.log("    Password: prof123");
    console.log("    esAdmin: true\n");

    console.log("  Profesor - Grupo 4A:");
    console.log("    Email: roberto@kidotag.com");
    console.log("    Password: prof123");
    console.log("    esAdmin: false\n");

    console.log("📚 GRUPOS:");
    console.log("  Grupo 1A → Sofía Pérez García (Prof. Laura Martínez)");
    console.log("  Grupo 4A → Diego Pérez García (Prof. Roberto Sánchez)\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

crearDatos();
