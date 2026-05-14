require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Tutor = require("../src/models/tutor.model");
const Profesor = require("../src/models/profesor.model");

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/kidotag";

const archivoMarkdown = path.resolve(__dirname, "..", "USUARIOS_PRUEBA.md");

const tutoresSeed = [
  {
    nombre: "Tutor Demo 1",
    email: "tutor1@kidotag.test",
    password: "Tutor123!",
    telefono: "5551000001",
    alumnos: [],
    activo: true,
  },
  {
    nombre: "Tutor Demo 2",
    email: "tutor2@kidotag.test",
    password: "Tutor123!",
    telefono: "5551000002",
    alumnos: [],
    activo: true,
  },
  {
    nombre: "Tutor Demo 3",
    email: "tutor3@kidotag.test",
    password: "Tutor123!",
    telefono: "5551000003",
    alumnos: [],
    activo: true,
  },
];

const profesoresSeed = [
  {
    nombre: "Profesor Demo 1",
    email: "profesor1@kidotag.test",
    password: "Profesor123!",
    telefono: "5552000001",
    especialidad: "Matematicas",
    esAdmin: true,
    activo: true,
  },
  {
    nombre: "Profesor Demo 2",
    email: "profesor2@kidotag.test",
    password: "Profesor123!",
    telefono: "5552000002",
    especialidad: "Lenguaje",
    esAdmin: false,
    activo: true,
  },
  {
    nombre: "Profesor Demo 3",
    email: "profesor3@kidotag.test",
    password: "Profesor123!",
    telefono: "5552000003",
    especialidad: "Ciencias",
    esAdmin: false,
    activo: true,
  },
];

async function guardarTutor(data) {
  let tutor = await Tutor.findOne({ email: data.email });
  const accion = tutor ? "actualizado" : "creado";

  if (!tutor) {
    tutor = new Tutor(data);
  } else {
    tutor.nombre = data.nombre;
    tutor.email = data.email;
    tutor.password = data.password;
    tutor.telefono = data.telefono;
    tutor.alumnos = data.alumnos;
    tutor.activo = data.activo;
  }

  await tutor.save();

  return {
    rol: "tutor",
    accion,
    id: tutor._id.toString(),
    nombre: tutor.nombre,
    email: tutor.email,
    password: data.password,
    telefono: tutor.telefono || "",
    activo: tutor.activo,
    esAdmin: false,
    especialidad: "",
  };
}

async function guardarProfesor(data) {
  let profesor = await Profesor.findOne({ email: data.email });
  const accion = profesor ? "actualizado" : "creado";

  if (!profesor) {
    profesor = new Profesor(data);
  } else {
    profesor.nombre = data.nombre;
    profesor.email = data.email;
    profesor.password = data.password;
    profesor.telefono = data.telefono;
    profesor.especialidad = data.especialidad;
    profesor.esAdmin = data.esAdmin;
    profesor.activo = data.activo;
  }

  await profesor.save();

  return {
    rol: "profesor",
    accion,
    id: profesor._id.toString(),
    nombre: profesor.nombre,
    email: profesor.email,
    password: data.password,
    telefono: profesor.telefono || "",
    activo: profesor.activo,
    esAdmin: profesor.esAdmin,
    especialidad: profesor.especialidad || "",
  };
}

function generarMarkdown(usuarios) {
  const fechaGeneracion = new Date().toISOString();
  const filas = usuarios.map((usuario) => {
    const admin =
      usuario.rol === "profesor" ? (usuario.esAdmin ? "si" : "no") : "-";
    const especialidad = usuario.especialidad || "-";

    return `| ${usuario.rol} | ${usuario.nombre} | ${usuario.email} | ${usuario.password} | ${usuario.telefono || "-"} | ${especialidad} | ${admin} | ${usuario.activo ? "si" : "no"} | ${usuario.id} | ${usuario.accion} |`;
  });

  return [
    "# Usuarios de prueba",
    "",
    `Generado: ${fechaGeneracion}`,
    "",
    "Se crean 3 tutores y 3 profesores para pruebas de login.",
    "El primer profesor queda habilitado como admin mediante `esAdmin=true`.",
    "",
    "## Credenciales",
    "",
    "| Rol | Nombre | Email | Password | Telefono | Especialidad | Admin | Activo | ID | Estado |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...filas,
    "",
    "## Passwords por rol",
    "",
    "- Tutores: `Tutor123!`",
    "- Profesores: `Profesor123!`",
    "",
  ].join("\n");
}

async function main() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Conectado a MongoDB");

    const usuarios = [];

    for (const tutor of tutoresSeed) {
      const resultado = await guardarTutor(tutor);
      usuarios.push(resultado);
      console.log(`✓ Tutor ${resultado.accion}: ${resultado.email}`);
    }

    for (const profesor of profesoresSeed) {
      const resultado = await guardarProfesor(profesor);
      usuarios.push(resultado);
      console.log(`✓ Profesor ${resultado.accion}: ${resultado.email}`);
    }

    fs.writeFileSync(archivoMarkdown, generarMarkdown(usuarios), "utf8");
    console.log(`✓ Archivo generado: ${archivoMarkdown}`);

    const totalTutores = usuarios.filter(
      (usuario) => usuario.rol === "tutor",
    ).length;
    const totalProfesores = usuarios.filter(
      (usuario) => usuario.rol === "profesor",
    ).length;

    console.log("\nResumen:");
    console.log(`- Tutores: ${totalTutores}`);
    console.log(`- Profesores: ${totalProfesores}`);
  } catch (error) {
    console.error("✗ Error al crear usuarios de prueba:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Conexion a MongoDB cerrada");
  }
}

main();
