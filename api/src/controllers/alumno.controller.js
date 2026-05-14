const Alumno = require("../models/alumno.model");
const Tutor = require("../models/tutor.model");
const Grupo = require("../models/grupo.model");
const {
  limpiarTexto,
  obtenerNombreCompletoAlumno,
} = require("../utils/alumnoNombre");

const CAMPOS_TUTOR_ALUMNO = "nombre email telefono";

const obtenerNombreAlumno = (alumno = {}) =>
  obtenerNombreCompletoAlumno(alumno) ||
  limpiarTexto(alumno.nombre) ||
  "Alumno";

const obtenerAlumnoConRelaciones = async (alumnoId) => {
  const alumno = await Alumno.findById(alumnoId)
    .populate("tutor", CAMPOS_TUTOR_ALUMNO)
    .lean();

  if (!alumno) {
    return null;
  }

  const grupo = await Grupo.findOne({ alumnos: alumnoId })
    .select("_id nombre")
    .lean();

  return {
    ...alumno,
    grupo: grupo || null,
  };
};

// Busca un alumno por uidTarjeta (uso interno)
exports.buscarAlumnoPorTag = async (uidTarjeta) => {
  return await Alumno.findOne({ uidTarjeta });
};

// Registrar un nuevo alumno
exports.registrarAlumno = async (req, res) => {
  try {
    const {
      nombre,
      apellidos,
      uidTarjeta,
      fechaNacimiento,
      genero,
      tutor,
      grupo,
    } = req.body;
    const nombreNormalizado = limpiarTexto(nombre);
    const apellidosNormalizados = limpiarTexto(apellidos);
    const uidTarjetaNormalizado = limpiarTexto(uidTarjeta);

    if (!nombreNormalizado || !uidTarjetaNormalizado || !tutor) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Nombre, UID de tarjeta y tutor son requeridos",
        },
      });
    }

    // Verificar si el UID ya está registrado
    const existente = await Alumno.findOne({
      uidTarjeta: uidTarjetaNormalizado,
    });
    if (existente) {
      return res.status(409).json({
        ok: false,
        error: {
          codigo: "UID_DUPLICADO",
          mensaje: "Este UID ya está registrado para otro alumno",
        },
      });
    }

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

    const datosAlumno = {
      nombre: nombreNormalizado,
      uidTarjeta: uidTarjetaNormalizado,
      tutor,
    };
    if (apellidos !== undefined) {
      datosAlumno.apellidos = apellidosNormalizados;
    }
    if (fechaNacimiento) datosAlumno.fechaNacimiento = fechaNacimiento;
    if (genero) datosAlumno.genero = genero;

    const alumno = new Alumno(datosAlumno);
    await alumno.save();

    await Tutor.findByIdAndUpdate(tutor, {
      $addToSet: { alumnos: alumno._id },
    });

    // Agregar alumno al grupo si se proporcionó
    if (grupo) {
      await Grupo.findByIdAndUpdate(grupo, {
        $addToSet: { alumnos: alumno._id },
      });
    }

    const alumnoCreado = await obtenerAlumnoConRelaciones(alumno._id);

    console.log(
      `[ALUMNO] ✓ Registrado: ${obtenerNombreAlumno(alumnoCreado)} (UID: ${uidTarjetaNormalizado})`,
    );

    res.status(201).json({
      ok: true,
      data: alumnoCreado,
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
      .populate("tutor", CAMPOS_TUTOR_ALUMNO)
      .sort({ nombre: 1, apellidos: 1 })
      .lean();

    // Obtener el grupo de cada alumno
    const alumnosConGrupo = await Promise.all(
      alumnos.map(async (alumno) => {
        const grupo = await Grupo.findOne({ alumnos: alumno._id })
          .select("_id nombre")
          .lean();
        return { ...alumno, grupo: grupo || null };
      }),
    );

    res.status(200).json({
      ok: true,
      data: alumnosConGrupo,
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
    const alumno = await obtenerAlumnoConRelaciones(id);

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
    const {
      nombre,
      apellidos,
      uidTarjeta,
      fechaNacimiento,
      genero,
      tutor,
      grupo,
    } = req.body;

    if (
      nombre === undefined &&
      apellidos === undefined &&
      uidTarjeta === undefined &&
      fechaNacimiento === undefined &&
      genero === undefined &&
      tutor === undefined &&
      grupo === undefined
    ) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Debe proporcionar al menos un campo para actualizar",
        },
      });
    }

    // Si se actualiza el UID, verificar que no esté duplicado
    let uidTarjetaNormalizado;
    if (uidTarjeta !== undefined) {
      uidTarjetaNormalizado = limpiarTexto(uidTarjeta);
      if (!uidTarjetaNormalizado) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "El UID de tarjeta no puede estar vacío",
          },
        });
      }

      const existente = await Alumno.findOne({
        uidTarjeta: uidTarjetaNormalizado,
        _id: { $ne: id },
      });
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
    if (nombre !== undefined) {
      const nombreNormalizado = limpiarTexto(nombre);
      if (!nombreNormalizado) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "El nombre no puede estar vacío",
          },
        });
      }

      actualizacion.nombre = nombreNormalizado;
    }
    if (apellidos !== undefined) {
      actualizacion.apellidos = limpiarTexto(apellidos);
    }
    if (uidTarjeta !== undefined) {
      actualizacion.uidTarjeta = uidTarjetaNormalizado;
    }
    if (fechaNacimiento) actualizacion.fechaNacimiento = fechaNacimiento;
    if (genero) actualizacion.genero = genero;

    if (tutor !== undefined) {
      if (!tutor) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "El alumno debe tener un tutor asociado",
          },
        });
      }

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

      actualizacion.tutor = tutor;

      // actualizar relación tutor <-> alumno
      if (
        alumnoActualizado.tutor &&
        alumnoActualizado.tutor.toString() !== tutor
      ) {
        await Tutor.findByIdAndUpdate(alumnoActualizado.tutor, {
          $pull: { alumnos: id },
        });
      }
      if (
        tutor &&
        (!alumnoActualizado.tutor ||
          alumnoActualizado.tutor.toString() !== tutor)
      ) {
        await Tutor.findByIdAndUpdate(tutor, {
          $addToSet: { alumnos: id },
        });
      }
    }

    // Actualizar grupo del alumno
    if (grupo !== undefined) {
      // Remover alumno de todos los grupos actuales
      await Grupo.updateMany({ alumnos: id }, { $pull: { alumnos: id } });
      // Agregar al nuevo grupo si se proporcionó
      if (grupo) {
        await Grupo.findByIdAndUpdate(grupo, {
          $addToSet: { alumnos: id },
        });
      }
    }

    const alumnoActualizadoDoc = await Alumno.findByIdAndUpdate(
      id,
      { $set: actualizacion },
      { new: true, runValidators: true },
    );

    if (!alumnoActualizadoDoc) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    const alumno = await obtenerAlumnoConRelaciones(id);

    console.log(
      `[ALUMNO] ✓ Actualizado: ${obtenerNombreAlumno(alumno)} (UID: ${alumno.uidTarjeta})`,
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
          "nombre",
          "apellidos",
          "uidTarjeta",
          "fechaNacimiento",
          "genero",
          "alergias",
          "condicionesMedicas",
          "tipoSangre",
          "peso",
          "estatura",
          "contactoEmergencia",
          "tutor",
          "notasEscolares",
        ];

    const actualizacion = {};
    const camposEnum = ["genero", "tipoSangre"];
    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        // Para campos enum, un string vacío debe eliminarse en vez de enviarse
        if (camposEnum.includes(campo) && req.body[campo] === "") {
          actualizacion[campo] = undefined;
        } else {
          actualizacion[campo] = req.body[campo];
        }
      }
    }

    if (actualizacion.nombre !== undefined) {
      actualizacion.nombre = limpiarTexto(actualizacion.nombre);
      if (!actualizacion.nombre) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "El nombre no puede estar vacío",
          },
        });
      }
    }

    if (actualizacion.apellidos !== undefined) {
      actualizacion.apellidos = limpiarTexto(actualizacion.apellidos);
    }

    if (actualizacion.uidTarjeta !== undefined) {
      actualizacion.uidTarjeta = limpiarTexto(actualizacion.uidTarjeta);
      if (!actualizacion.uidTarjeta) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "El UID de tarjeta no puede estar vacío",
          },
        });
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

    // Si se actualiza el UID, verificar que no esté duplicado
    if (actualizacion.uidTarjeta !== undefined) {
      const existente = await Alumno.findOne({
        uidTarjeta: actualizacion.uidTarjeta,
        _id: { $ne: id },
      });
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

    // Si se actualiza el tutor, manejar relaciones
    if (actualizacion.tutor !== undefined) {
      const alumnoActual = await Alumno.findById(id);
      if (actualizacion.tutor) {
        const tutorExistente = await Tutor.findById(actualizacion.tutor);
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
      if (
        alumnoActual.tutor &&
        alumnoActual.tutor.toString() !== actualizacion.tutor
      ) {
        await Tutor.findByIdAndUpdate(alumnoActual.tutor, {
          $pull: { alumnos: id },
        });
      }
      if (
        actualizacion.tutor &&
        (!alumnoActual.tutor ||
          alumnoActual.tutor.toString() !== actualizacion.tutor)
      ) {
        await Tutor.findByIdAndUpdate(actualizacion.tutor, {
          $addToSet: { alumnos: id },
        });
      }
      if (!actualizacion.tutor) actualizacion.tutor = null;
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

    console.log(
      `[ALUMNO] ✓ Perfil actualizado: ${obtenerNombreAlumno(alumno)}`,
    );

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
      `[ALUMNO] ✓ Eliminado: ${obtenerNombreAlumno(alumno)} (UID: ${alumno.uidTarjeta})`,
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
