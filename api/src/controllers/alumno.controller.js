const Alumno = require("../models/alumno.model");
const Tutor = require("../models/tutor.model");

// Busca un alumno por uidTarjeta (uso interno)
exports.buscarAlumnoPorTag = async (uidTarjeta) => {
  return await Alumno.findOne({ uidTarjeta });
};

// Registrar un nuevo alumno
exports.registrarAlumno = async (req, res) => {
  try {
    const { nombre, uidTarjeta, fechaNacimiento, genero, grado, tutor } = req.body;

    if (!nombre || !uidTarjeta) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Nombre y UID de tarjeta son requeridos",
        },
      });
    }

    // Verificar si el UID ya está registrado
    const existente = await Alumno.findOne({ uidTarjeta });
    if (existente) {
      return res.status(409).json({
        ok: false,
        error: {
          codigo: "UID_DUPLICADO",
          mensaje: "Este UID ya está registrado para otro alumno",
        },
      });
    }

    const datosAlumno = { nombre, uidTarjeta };
    if (fechaNacimiento) datosAlumno.fechaNacimiento = fechaNacimiento;
    if (genero) datosAlumno.genero = genero;
    if (grado) datosAlumno.grado = grado;

    if (tutor) {
      const tutorExistente = await Tutor.findById(tutor);
      if (!tutorExistente) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "TUTOR_NO_ENCONTRADO",
            mensaje: "Tutor asociado no encontrado",
          },
        });
      }
      datosAlumno.tutor = tutor;
    }

    const alumno = new Alumno(datosAlumno);
    await alumno.save();

    if (tutor) {
      await Tutor.findByIdAndUpdate(tutor, {
        $addToSet: { alumnos: alumno._id },
      });
    }

    console.log(`[ALUMNO] ✓ Registrado: ${nombre} (UID: ${uidTarjeta})`);

    res.status(201).json({
      ok: true,
      data: alumno,
    });
  } catch (error) {
    console.error("[ALUMNO] Error al registrar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Listar todos los alumnos
exports.listarAlumnos = async (req, res) => {
  try {
    let query = {};

    // Si hay filtro de alumnos permitidos (para tutores)
    if (req.alumnosPermitidos) {
      query._id = { $in: req.alumnosPermitidos };
    }

    const alumnos = await Alumno.find(query)
      .populate("tutor", "nombre email")
      .sort({ nombre: 1 })
      .lean();

    res.status(200).json({
      ok: true,
      data: alumnos,
    });
  } catch (error) {
    console.error("[ALUMNO] Error al listar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener un alumno por ID
exports.obtenerAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await Alumno.findById(id)
      .populate("tutor", "nombre email")
      .lean();

    if (!alumno) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    res.status(200).json({
      ok: true,
      data: alumno,
    });
  } catch (error) {
    console.error("[ALUMNO] Error al obtener:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Actualizar un alumno
exports.actualizarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, uidTarjeta, fechaNacimiento, genero, grado, tutor } = req.body;

    if (!nombre && !uidTarjeta && !fechaNacimiento && !genero && !grado && !tutor) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Debe proporcionar al menos un campo para actualizar",
        },
      });
    }

    // Si se actualiza el UID, verificar que no esté duplicado
    if (uidTarjeta) {
      const existente = await Alumno.findOne({ uidTarjeta, _id: { $ne: id } });
      if (existente) {
        return res.status(409).json({
          ok: false,
          error: {
            codigo: "UID_DUPLICADO",
            mensaje: "Este UID ya está registrado para otro alumno",
          },
        });
      }
    }

    const alumnoActualizado = await Alumno.findById(id);
    if (!alumnoActualizado) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    const actualizacion = {};
    if (nombre) actualizacion.nombre = nombre;
    if (uidTarjeta) actualizacion.uidTarjeta = uidTarjeta;
    if (fechaNacimiento) actualizacion.fechaNacimiento = fechaNacimiento;
    if (genero) actualizacion.genero = genero;
    if (grado) actualizacion.grado = grado;

    if (tutor !== undefined) {
      if (tutor) {
        const tutorExistente = await Tutor.findById(tutor);
        if (!tutorExistente) {
          return res.status(404).json({
            ok: false,
            error: {
              codigo: "TUTOR_NO_ENCONTRADO",
              mensaje: "Tutor asociado no encontrado",
            },
          });
        }
      }
      actualizacion.tutor = tutor || null;

      // actualizar relación tutor <-> alumno
      if (alumnoActualizado.tutor && alumnoActualizado.tutor.toString() !== tutor) {
        await Tutor.findByIdAndUpdate(alumnoActualizado.tutor, {
          $pull: { alumnos: id },
        });
      }
      if (tutor && (!alumnoActualizado.tutor || alumnoActualizado.tutor.toString() !== tutor)) {
        await Tutor.findByIdAndUpdate(tutor, {
          $addToSet: { alumnos: id },
        });
      }
    }

    const alumno = await Alumno.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      { new: true, runValidators: true },
    )
      .populate("tutor", "nombre email")
      .lean();

    if (!alumno) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    console.log(
      `[ALUMNO] ✓ Actualizado: ${alumno.nombre} (UID: ${alumno.uidTarjeta})`,
    );

    res.status(200).json({
      ok: true,
      data: alumno,
    });
  } catch (error) {
    console.error("[ALUMNO] Error al actualizar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Actualizar perfil de un alumno (campos según rol)
exports.actualizarPerfil = async (req, res) => {
  try {
    const { id } = req.params;
    const esTutor = req.usuario.tipo === "tutor";

    // Tutores solo pueden editar info médica, contacto de emergencia y notas
    const camposPermitidos = esTutor
      ? [
          "alergias",
          "condicionesMedicas",
          "tipoSangre",
          "peso",
          "estatura",
          "contactoEmergencia",
          "notasEscolares",
        ]
      : [
          "fechaNacimiento",
          "genero",
          "alergias",
          "condicionesMedicas",
          "tipoSangre",
          "peso",
          "estatura",
          "contactoEmergencia",
          "grado",
          "notasEscolares",
        ];

    const actualizacion = {};
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        actualizacion[campo] = req.body[campo];
      }
    }

    if (Object.keys(actualizacion).length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje:
            "Debe proporcionar al menos un campo del perfil para actualizar",
        },
      });
    }

    const alumno = await Alumno.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      { new: true, runValidators: true },
    ).lean();

    if (!alumno) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    console.log(`[ALUMNO] ✓ Perfil actualizado: ${alumno.nombre}`);

    res.status(200).json({
      ok: true,
      data: alumno,
    });
  } catch (error) {
    console.error("[ALUMNO] Error al actualizar perfil:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Eliminar un alumno
exports.eliminarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const alumno = await Alumno.findByIdAndDelete(id).lean();

    if (!alumno) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    if (alumno.tutor) {
      await Tutor.findByIdAndUpdate(alumno.tutor, {
        $pull: { alumnos: id },
      });
    }

    console.log(
      `[ALUMNO] ✓ Eliminado: ${alumno.nombre} (UID: ${alumno.uidTarjeta})`,
    );

    res.status(200).json({
      ok: true,
      mensaje: "Alumno eliminado correctamente",
    });
  } catch (error) {
    console.error("[ALUMNO] Error al eliminar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
