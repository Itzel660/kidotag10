require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Tutor = require("../src/models/tutor.model");
const Profesor = require("../src/models/profesor.model");
const Alumno = require("../src/models/alumno.model");
const Grupo = require("../src/models/grupo.model");

const mongoUri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/kidotag";
const tutorPassword = "Familias2026!";
const archivoResumen = path.resolve(__dirname, "..", "ESCUELA_DEMO.md");

const tutoresSeed = [
  {
    nombre: "Laura Mendoza",
    email: "laura.mendoza@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100001",
  },
  {
    nombre: "Patricia Vega",
    email: "patricia.vega@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100002",
  },
  {
    nombre: "Jorge Castillo",
    email: "jorge.castillo@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100003",
  },
  {
    nombre: "Clara Rojas",
    email: "clara.rojas@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100004",
  },
  {
    nombre: "Andrea Paredes",
    email: "andrea.paredes@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100005",
  },
  {
    nombre: "Miguel Torres",
    email: "miguel.torres@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100006",
  },
  {
    nombre: "Ana Beltran",
    email: "ana.beltran@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100007",
  },
  {
    nombre: "Lucia Herrera",
    email: "lucia.herrera@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100008",
  },
  {
    nombre: "Ricardo Flores",
    email: "ricardo.flores@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100009",
  },
  {
    nombre: "Elena Navarro",
    email: "elena.navarro@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100010",
  },
  {
    nombre: "Sergio Salas",
    email: "sergio.salas@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100011",
  },
  {
    nombre: "Rosa Cabrera",
    email: "rosa.cabrera@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100012",
  },
  {
    nombre: "Daniela Ruiz",
    email: "daniela.ruiz@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100013",
  },
  {
    nombre: "Hector Pena",
    email: "hector.pena@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100014",
  },
  {
    nombre: "Mariana Moreno",
    email: "mariana.moreno@familia.kidotag.test",
    password: tutorPassword,
    telefono: "5553100015",
  },
];

const gruposSeed = [
  {
    nombre: "1ro Grado A",
    descripcion: "Primer grado de primaria",
    profesorEmail: "profesor2@kidotag.test",
    horario: "Lunes a Viernes 07:30-12:30",
    alumnos: [
      {
        nombre: "Sofia Mendoza",
        uidTarjeta: "KDG-1A-01",
        fechaNacimiento: "2019-03-15",
        genero: "femenino",
        tutorEmail: "laura.mendoza@familia.kidotag.test",
      },
      {
        nombre: "Tomas Vega",
        uidTarjeta: "KDG-1A-02",
        fechaNacimiento: "2019-06-02",
        genero: "masculino",
        tutorEmail: "patricia.vega@familia.kidotag.test",
      },
      {
        nombre: "Emilia Castillo",
        uidTarjeta: "KDG-1A-03",
        fechaNacimiento: "2019-01-20",
        genero: "femenino",
        tutorEmail: "jorge.castillo@familia.kidotag.test",
      },
      {
        nombre: "Lucas Rojas",
        uidTarjeta: "KDG-1A-04",
        fechaNacimiento: "2018-11-11",
        genero: "masculino",
        tutorEmail: "clara.rojas@familia.kidotag.test",
      },
    ],
  },
  {
    nombre: "2do Grado A",
    descripcion: "Segundo grado de primaria",
    profesorEmail: "profesor3@kidotag.test",
    horario: "Lunes a Viernes 07:30-12:30",
    alumnos: [
      {
        nombre: "Diego Castillo",
        uidTarjeta: "KDG-2A-01",
        fechaNacimiento: "2018-02-18",
        genero: "masculino",
        tutorEmail: "jorge.castillo@familia.kidotag.test",
      },
      {
        nombre: "Valentina Paredes",
        uidTarjeta: "KDG-2A-02",
        fechaNacimiento: "2018-05-09",
        genero: "femenino",
        tutorEmail: "andrea.paredes@familia.kidotag.test",
      },
      {
        nombre: "Martin Torres",
        uidTarjeta: "KDG-2A-03",
        fechaNacimiento: "2018-07-21",
        genero: "masculino",
        tutorEmail: "miguel.torres@familia.kidotag.test",
      },
      {
        nombre: "Emma Beltran",
        uidTarjeta: "KDG-2A-04",
        fechaNacimiento: "2018-09-14",
        genero: "femenino",
        tutorEmail: "ana.beltran@familia.kidotag.test",
      },
      {
        nombre: "Samuel Herrera",
        uidTarjeta: "KDG-2A-05",
        fechaNacimiento: "2018-12-01",
        genero: "masculino",
        tutorEmail: "lucia.herrera@familia.kidotag.test",
      },
    ],
  },
  {
    nombre: "3ro Grado A",
    descripcion: "Tercer grado de primaria",
    profesorEmail: "carlos@example.com",
    horario: "Lunes a Viernes 07:30-13:00",
    alumnos: [
      {
        nombre: "Mateo Mendoza",
        uidTarjeta: "KDG-3A-01",
        fechaNacimiento: "2017-04-25",
        genero: "masculino",
        tutorEmail: "laura.mendoza@familia.kidotag.test",
      },
      {
        nombre: "Renata Flores",
        uidTarjeta: "KDG-3A-02",
        fechaNacimiento: "2017-08-13",
        genero: "femenino",
        tutorEmail: "ricardo.flores@familia.kidotag.test",
      },
      {
        nombre: "Thiago Navarro",
        uidTarjeta: "KDG-3A-03",
        fechaNacimiento: "2017-10-30",
        genero: "masculino",
        tutorEmail: "elena.navarro@familia.kidotag.test",
      },
    ],
  },
  {
    nombre: "4to Grado A",
    descripcion: "Cuarto grado de primaria",
    profesorEmail: "profesor1@kidotag.test",
    horario: "Lunes a Viernes 07:30-13:00",
    alumnos: [
      {
        nombre: "Camila Paredes",
        uidTarjeta: "KDG-4A-01",
        fechaNacimiento: "2016-02-11",
        genero: "femenino",
        tutorEmail: "andrea.paredes@familia.kidotag.test",
      },
      {
        nombre: "Bruno Salas",
        uidTarjeta: "KDG-4A-02",
        fechaNacimiento: "2016-05-26",
        genero: "masculino",
        tutorEmail: "sergio.salas@familia.kidotag.test",
      },
      {
        nombre: "Julieta Cabrera",
        uidTarjeta: "KDG-4A-03",
        fechaNacimiento: "2016-08-07",
        genero: "femenino",
        tutorEmail: "rosa.cabrera@familia.kidotag.test",
      },
      {
        nombre: "Nicolas Ruiz",
        uidTarjeta: "KDG-4A-04",
        fechaNacimiento: "2016-11-19",
        genero: "masculino",
        tutorEmail: "daniela.ruiz@familia.kidotag.test",
      },
    ],
  },
  {
    nombre: "5to Grado A",
    descripcion: "Quinto grado de primaria",
    profesorEmail: "roberto@example.com",
    horario: "Lunes a Viernes 07:30-13:30",
    alumnos: [
      {
        nombre: "Alma Herrera",
        uidTarjeta: "KDG-5A-01",
        fechaNacimiento: "2015-01-17",
        genero: "femenino",
        tutorEmail: "lucia.herrera@familia.kidotag.test",
      },
      {
        nombre: "Joaquin Beltran",
        uidTarjeta: "KDG-5A-02",
        fechaNacimiento: "2015-03-22",
        genero: "masculino",
        tutorEmail: "ana.beltran@familia.kidotag.test",
      },
      {
        nombre: "Isabella Ruiz",
        uidTarjeta: "KDG-5A-03",
        fechaNacimiento: "2015-06-28",
        genero: "femenino",
        tutorEmail: "daniela.ruiz@familia.kidotag.test",
      },
      {
        nombre: "Gabriel Pena",
        uidTarjeta: "KDG-5A-04",
        fechaNacimiento: "2015-09-05",
        genero: "masculino",
        tutorEmail: "hector.pena@familia.kidotag.test",
      },
      {
        nombre: "Olivia Moreno",
        uidTarjeta: "KDG-5A-05",
        fechaNacimiento: "2015-12-10",
        genero: "femenino",
        tutorEmail: "mariana.moreno@familia.kidotag.test",
      },
    ],
  },
];

function uniqueIds(ids) {
  return [...new Set(ids.map((id) => id.toString()))];
}

async function upsertTutor(data) {
  let tutor = await Tutor.findOne({ email: data.email });
  const accion = tutor ? "actualizado" : "creado";

  if (!tutor) {
    tutor = new Tutor({
      nombre: data.nombre,
      email: data.email,
      password: data.password,
      telefono: data.telefono,
      alumnos: [],
      activo: true,
    });
  } else {
    tutor.nombre = data.nombre;
    tutor.email = data.email;
    tutor.password = data.password;
    tutor.telefono = data.telefono;
    tutor.activo = true;
  }

  await tutor.save();

  return { tutor, accion };
}

async function upsertAlumno(data, tutor) {
  let alumno = await Alumno.findOne({ uidTarjeta: data.uidTarjeta });
  const accion = alumno ? "actualizado" : "creado";
  const tutorAnterior = alumno?.tutor ? alumno.tutor.toString() : null;

  if (!alumno) {
    alumno = new Alumno({
      nombre: data.nombre,
      uidTarjeta: data.uidTarjeta,
    });
  }

  alumno.nombre = data.nombre;
  alumno.uidTarjeta = data.uidTarjeta;
  alumno.fechaNacimiento = new Date(data.fechaNacimiento);
  alumno.genero = data.genero;
  alumno.tutor = tutor._id;
  alumno.contactoEmergencia = {
    nombre: tutor.nombre,
    telefono: tutor.telefono,
    parentesco: "Tutor",
  };

  await alumno.save();

  if (tutorAnterior && tutorAnterior !== tutor._id.toString()) {
    await Tutor.findByIdAndUpdate(tutorAnterior, {
      $pull: { alumnos: alumno._id },
    });
  }

  return { alumno, accion };
}

async function upsertGrupo(data, profesorId, alumnoIds) {
  let grupo = await Grupo.findOne({ nombre: data.nombre });
  const accion = grupo ? "actualizado" : "creado";

  if (!grupo) {
    grupo = new Grupo({
      nombre: data.nombre,
      descripcion: data.descripcion,
      profesor: profesorId,
      alumnos: alumnoIds,
      horario: data.horario,
      activo: true,
    });
  } else {
    grupo.nombre = data.nombre;
    grupo.descripcion = data.descripcion;
    grupo.profesor = profesorId;
    grupo.alumnos = alumnoIds;
    grupo.horario = data.horario;
    grupo.activo = true;
  }

  await grupo.save();

  return { grupo, accion };
}

function generarMarkdown(resumen) {
  const lineas = [
    "# Escuela demo",
    "",
    `Generado: ${new Date().toISOString()}`,
    "",
    "Se agregan 5 grupos nuevos de primaria, con 21 alumnos y tutores compartidos entre hermanos para simular un colegio real.",
    "",
    "## Acceso de tutores creados",
    "",
    `Password comun: ${tutorPassword}`,
    "",
    "| Tutor | Email | Telefono | Hijos asignados | Estado |",
    "| --- | --- | --- | --- | --- |",
    ...resumen.tutores.map(
      (tutor) =>
        `| ${tutor.nombre} | ${tutor.email} | ${tutor.telefono} | ${tutor.alumnos} | ${tutor.accion} |`,
    ),
    "",
    "## Grupos creados",
    "",
  ];

  for (const grupo of resumen.grupos) {
    lineas.push(`### ${grupo.nombre}`);
    lineas.push("");
    lineas.push(`- Profesor: ${grupo.profesor}`);
    lineas.push(`- Horario: ${grupo.horario}`);
    lineas.push(`- Estado: ${grupo.accion}`);
    lineas.push("");
    lineas.push(
      "| Alumno | UID | Tutor | Tutor email | Estado |",
      "| --- | --- | --- | --- | --- |",
    );

    for (const alumno of grupo.alumnos) {
      lineas.push(
        `| ${alumno.nombre} | ${alumno.uidTarjeta} | ${alumno.tutorNombre} | ${alumno.tutorEmail} | ${alumno.accion} |`,
      );
    }

    lineas.push("");
  }

  return lineas.join("\n");
}

async function main() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Conectado a MongoDB");

    const profesores = await Profesor.find({
      email: { $in: gruposSeed.map((grupo) => grupo.profesorEmail) },
    })
      .select("nombre email")
      .lean();

    const profesoresPorEmail = new Map(
      profesores.map((profesor) => [profesor.email, profesor]),
    );

    const profesoresFaltantes = gruposSeed
      .map((grupo) => grupo.profesorEmail)
      .filter((email, index, emails) => emails.indexOf(email) === index)
      .filter((email) => !profesoresPorEmail.has(email));

    if (profesoresFaltantes.length > 0) {
      throw new Error(
        `Faltan profesores requeridos: ${profesoresFaltantes.join(", ")}`,
      );
    }

    const tutoresPorEmail = new Map();
    const alumnosPorUid = new Map();
    const asignacionesTutor = new Map();
    const resumenTutores = [];
    const resumenGrupos = [];

    for (const tutorData of tutoresSeed) {
      const { tutor, accion } = await upsertTutor(tutorData);
      tutoresPorEmail.set(tutor.email, tutor);
      asignacionesTutor.set(tutor.email, []);
      resumenTutores.push({
        nombre: tutor.nombre,
        email: tutor.email,
        telefono: tutor.telefono || "-",
        alumnos: 0,
        accion,
      });
      console.log(`✓ Tutor ${accion}: ${tutor.email}`);
    }

    for (const grupoData of gruposSeed) {
      const alumnosGrupo = [];

      for (const alumnoData of grupoData.alumnos) {
        const tutor = tutoresPorEmail.get(alumnoData.tutorEmail);
        const { alumno, accion } = await upsertAlumno(alumnoData, tutor);

        alumnosPorUid.set(alumno.uidTarjeta, alumno);
        asignacionesTutor.get(tutor.email).push(alumno._id);
        alumnosGrupo.push({
          nombre: alumno.nombre,
          uidTarjeta: alumno.uidTarjeta,
          tutorNombre: tutor.nombre,
          tutorEmail: tutor.email,
          accion,
          id: alumno._id,
        });
        console.log(
          `✓ Alumno ${accion}: ${alumno.nombre} (${alumno.uidTarjeta})`,
        );
      }

      const profesor = profesoresPorEmail.get(grupoData.profesorEmail);
      const { grupo, accion } = await upsertGrupo(
        grupoData,
        profesor._id,
        alumnosGrupo.map((alumno) => alumno.id),
      );

      resumenGrupos.push({
        nombre: grupo.nombre,
        profesor: profesor.nombre,
        horario: grupo.horario || "-",
        accion,
        alumnos: alumnosGrupo,
      });
      console.log(`✓ Grupo ${accion}: ${grupo.nombre}`);
    }

    for (const tutorResumen of resumenTutores) {
      const tutor = tutoresPorEmail.get(tutorResumen.email);
      const alumnoIds = uniqueIds(asignacionesTutor.get(tutor.email) || []);

      tutor.alumnos = alumnoIds;
      await tutor.save();

      tutorResumen.alumnos = alumnoIds.length;
    }

    fs.writeFileSync(
      archivoResumen,
      generarMarkdown({ tutores: resumenTutores, grupos: resumenGrupos }),
      "utf8",
    );

    console.log(`✓ Archivo generado: ${archivoResumen}`);
    console.log("\nResumen:");
    console.log(`- Grupos creados/actualizados: ${resumenGrupos.length}`);
    console.log(
      `- Alumnos creados/actualizados: ${gruposSeed.reduce(
        (total, grupo) => total + grupo.alumnos.length,
        0,
      )}`,
    );
    console.log(`- Tutores creados/actualizados: ${resumenTutores.length}`);
  } catch (error) {
    console.error("✗ Error al crear la escuela demo:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Conexion a MongoDB cerrada");
  }
}

main();
