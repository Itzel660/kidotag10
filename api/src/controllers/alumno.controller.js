const Alumno = require("../models/alumno.model");

// Busca un alumno por uidTarjeta (uso interno)
exports.buscarAlumnoPorTag = async (uidTarjeta) => {
  return await Alumno.findOne({ uidTarjeta });
};

// Registrar un nuevo alumno
exports.registrarAlumno = async (req, res) => {
  try {
    const { nombre, uidTarjeta } = req.body;

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

    const alumno = new Alumno({ nombre, uidTarjeta });
    await alumno.save();

    console.log(`[ALUMNO] ✓ Registrado: ${nombre} (UID: ${uidTarjeta})`);

    res.status(201).json({
      ok: true,
      data: {
        _id: alumno._id,
        nombre: alumno.nombre,
        uidTarjeta: alumno.uidTarjeta,
      },
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

    const alumnos = await Alumno.find(query).sort({ nombre: 1 }).lean();

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
    const alumno = await Alumno.findById(id).lean();

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
    const { nombre, uidTarjeta } = req.body;

    if (!nombre && !uidTarjeta) {
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

    const alumno = await Alumno.findByIdAndUpdate(
      id,
      {
        $set: { ...(nombre && { nombre }), ...(uidTarjeta && { uidTarjeta }) },
      },
      { new: true },
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
