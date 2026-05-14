const Grupo = require("../models/grupo.model");
const Profesor = require("../models/profesor.model");
const Alumno = require("../models/alumno.model");
const { obtenerNombreCompletoAlumno } = require("../utils/alumnoNombre");

// Crear un nuevo grupo
exports.crearGrupo = async (req, res) => {
  try {
    const { nombre, descripcion, profesor, alumnos, horario } = req.body;
    if (req.usuario.tipo !== "profesor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo los profesores pueden crear grupos",
        },
      });
    }

    const profesorSolicitante = await Profesor.findById(req.usuario.id);
    if (!profesorSolicitante) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    const profesorAsignado = profesorSolicitante.esAdmin
      ? profesor
      : req.usuario.id;

    if (!nombre || !profesorAsignado) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Nombre y profesor son requeridos",
        },
      });
    }

    // Verificar que el profesor existe
    const profesorExiste = await Profesor.findById(profesorAsignado);
    if (!profesorExiste) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    const grupo = new Grupo({
      nombre,
      descripcion,
      profesor: profesorAsignado,
      alumnos: alumnos || [],
      horario,
    });
    await grupo.save();

    console.log(
      `[GRUPO] ✓ Creado: ${nombre} (Profesor: ${profesorExiste.nombre})`,
    );

    const grupoPopulado = await Grupo.findById(grupo._id)
      .populate("profesor", "nombre email")
      .populate("alumnos", "nombre apellidos uidTarjeta");

    res.status(201).json({
      ok: true,
      data: grupoPopulado,
    });
  } catch (error) {
    console.error("[GRUPO] Error al crear:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Listar grupos (admin ve todos, profesor solo los suyos)
exports.listarGrupos = async (req, res) => {
  try {
    let query = {};

    // Si es profesor y no admin, filtrar solo sus grupos
    if (req.usuario.tipo === "profesor") {
      const profesor = await Profesor.findById(req.usuario.id);
      if (!profesor?.esAdmin) {
        query.profesor = req.usuario.id;
      }
    }

    const grupos = await Grupo.find(query)
      .populate("profesor", "nombre email")
      .populate("alumnos", "nombre apellidos uidTarjeta")
      .sort({ nombre: 1 })
      .lean();

    res.status(200).json({
      ok: true,
      data: grupos,
    });
  } catch (error) {
    console.error("[GRUPO] Error al listar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener un grupo por ID
exports.obtenerGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await Grupo.findById(id)
      .populate("profesor", "nombre email especialidad")
      .populate("alumnos", "nombre apellidos uidTarjeta")
      .lean();

    if (!grupo) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje: "Grupo no encontrado",
        },
      });
    }

    res.status(200).json({
      ok: true,
      data: grupo,
    });
  } catch (error) {
    console.error("[GRUPO] Error al obtener:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Actualizar un grupo
exports.actualizarGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, profesor, alumnos, horario, activo } =
      req.body;

    if (req.usuario.tipo !== "profesor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo los profesores pueden actualizar grupos",
        },
      });
    }

    const profesorSolicitante = await Profesor.findById(req.usuario.id);
    if (!profesorSolicitante) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    const grupoActual = await Grupo.findById(id);
    if (!grupoActual) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje: "Grupo no encontrado",
        },
      });
    }

    const esAdmin = Boolean(profesorSolicitante.esAdmin);
    if (!esAdmin && String(grupoActual.profesor) !== String(req.usuario.id)) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo puedes editar tus propios grupos",
        },
      });
    }

    if (
      !esAdmin &&
      profesor !== undefined &&
      String(profesor) !== String(req.usuario.id)
    ) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje:
            "Solo los administradores pueden reasignar grupos a otro profesor",
        },
      });
    }

    let profesorAsignado = grupoActual.profesor;

    if (esAdmin && profesor !== undefined) {
      if (!profesor) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "Debe seleccionar un profesor valido",
          },
        });
      }

      const profesorExiste = await Profesor.findById(profesor);
      if (!profesorExiste) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "PROFESOR_NO_ENCONTRADO",
            mensaje: "Profesor no encontrado",
          },
        });
      }

      profesorAsignado = profesor;
    }

    const cambios = {
      profesor: esAdmin ? profesorAsignado : req.usuario.id,
    };

    if (nombre !== undefined) cambios.nombre = nombre;
    if (descripcion !== undefined) cambios.descripcion = descripcion;
    if (alumnos !== undefined) cambios.alumnos = alumnos;
    if (horario !== undefined) cambios.horario = horario;
    if (activo !== undefined) cambios.activo = activo;

    const grupo = await Grupo.findByIdAndUpdate(id, cambios, {
      new: true,
      runValidators: true,
    })
      .populate("profesor", "nombre email")
      .populate("alumnos", "nombre apellidos uidTarjeta");

    console.log(`[GRUPO] ✓ Actualizado: ${grupo.nombre}`);

    res.status(200).json({
      ok: true,
      data: grupo,
    });
  } catch (error) {
    console.error("[GRUPO] Error al actualizar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Eliminar un grupo
exports.eliminarGrupo = async (req, res) => {
  try {
    const { id } = req.params;
    const grupo = await Grupo.findByIdAndDelete(id);

    if (!grupo) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje: "Grupo no encontrado",
        },
      });
    }

    console.log(`[GRUPO] ✓ Eliminado: ${grupo.nombre}`);

    res.status(200).json({
      ok: true,
      mensaje: "Grupo eliminado correctamente",
    });
  } catch (error) {
    console.error("[GRUPO] Error al eliminar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Agregar un alumno a un grupo
exports.agregarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { alumnoId } = req.body;

    if (!alumnoId) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "El ID del alumno es requerido",
        },
      });
    }

    // Verificar que el alumno existe
    const alumno = await Alumno.findById(alumnoId);
    if (!alumno) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ALUMNO_NO_ENCONTRADO",
          mensaje: "Alumno no encontrado",
        },
      });
    }

    const grupo = await Grupo.findByIdAndUpdate(
      id,
      { $addToSet: { alumnos: alumnoId } },
      { new: true },
    )
      .populate("profesor", "nombre email")
      .populate("alumnos", "nombre apellidos uidTarjeta");

    if (!grupo) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje: "Grupo no encontrado",
        },
      });
    }

    console.log(
      `[GRUPO] ✓ Alumno agregado: ${obtenerNombreCompletoAlumno(alumno)} → Grupo: ${grupo.nombre}`,
    );

    res.status(200).json({
      ok: true,
      data: grupo,
    });
  } catch (error) {
    console.error("[GRUPO] Error al agregar alumno:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Remover un alumno de un grupo
exports.removerAlumno = async (req, res) => {
  try {
    const { id, alumnoId } = req.params;

    const grupo = await Grupo.findByIdAndUpdate(
      id,
      { $pull: { alumnos: alumnoId } },
      { new: true },
    )
      .populate("profesor", "nombre email")
      .populate("alumnos", "nombre apellidos uidTarjeta");

    if (!grupo) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje: "Grupo no encontrado",
        },
      });
    }

    console.log(`[GRUPO] ✓ Alumno removido del grupo: ${grupo.nombre}`);

    res.status(200).json({
      ok: true,
      data: grupo,
    });
  } catch (error) {
    console.error("[GRUPO] Error al remover alumno:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
