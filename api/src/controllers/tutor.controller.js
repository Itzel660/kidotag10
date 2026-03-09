const Tutor = require("../models/tutor.model");
const Alumno = require("../models/alumno.model");
const Asistencia = require("../models/asistencia.model");

// Registrar un nuevo tutor
exports.registrarTutor = async (req, res) => {
  try {
    const { nombre, email, password, telefono, alumnos } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Nombre, email y password son requeridos",
        },
      });
    }

    // Verificar si el email ya está registrado
    const existente = await Tutor.findOne({ email });
    if (existente) {
      return res.status(409).json({
        ok: false,
        error: {
          codigo: "EMAIL_DUPLICADO",
          mensaje: "Este email ya está registrado",
        },
      });
    }

    const tutor = new Tutor({
      nombre,
      email,
      password,
      telefono,
      alumnos: alumnos || [],
    });
    await tutor.save();

    console.log(`[TUTOR] ✓ Registrado: ${nombre} (${email})`);

    res.status(201).json({
      ok: true,
      data: {
        _id: tutor._id,
        nombre: tutor.nombre,
        email: tutor.email,
        telefono: tutor.telefono,
        alumnos: tutor.alumnos,
      },
    });
  } catch (error) {
    console.error("[TUTOR] Error al registrar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Listar todos los tutores
exports.listarTutores = async (req, res) => {
  try {
    const tutores = await Tutor.find()
      .populate("alumnos", "nombre uidTarjeta")
      .sort({ nombre: 1 })
      .lean();

    res.status(200).json({
      ok: true,
      data: tutores,
    });
  } catch (error) {
    console.error("[TUTOR] Error al listar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener un tutor por ID
exports.obtenerTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const tutor = await Tutor.findById(id)
      .populate("alumnos", "nombre uidTarjeta")
      .lean();

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al obtener:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Actualizar un tutor
exports.actualizarTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, alumnos, activo } = req.body;

    const tutor = await Tutor.findByIdAndUpdate(
      id,
      { nombre, email, telefono, alumnos, activo },
      { new: true, runValidators: true },
    ).populate("alumnos", "nombre uidTarjeta");

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    console.log(`[TUTOR] ✓ Actualizado: ${tutor.nombre}`);

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al actualizar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Eliminar un tutor
exports.eliminarTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const tutor = await Tutor.findByIdAndDelete(id);

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    console.log(`[TUTOR] ✓ Eliminado: ${tutor.nombre}`);

    res.status(200).json({
      ok: true,
      mensaje: "Tutor eliminado correctamente",
    });
  } catch (error) {
    console.error("[TUTOR] Error al eliminar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Agregar un alumno a un tutor
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

    const tutor = await Tutor.findByIdAndUpdate(
      id,
      { $addToSet: { alumnos: alumnoId } },
      { new: true },
    ).populate("alumnos", "nombre uidTarjeta");

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    console.log(
      `[TUTOR] ✓ Alumno agregado: ${alumno.nombre} → Tutor: ${tutor.nombre}`,
    );

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al agregar alumno:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Remover un alumno de un tutor
exports.removerAlumno = async (req, res) => {
  try {
    const { id, alumnoId } = req.params;

    const tutor = await Tutor.findByIdAndUpdate(
      id,
      { $pull: { alumnos: alumnoId } },
      { new: true },
    ).populate("alumnos", "nombre uidTarjeta");

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    console.log(`[TUTOR] ✓ Alumno removido del tutor: ${tutor.nombre}`);

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al remover alumno:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener asistencias de los alumnos de un tutor
exports.obtenerAsistenciasAlumnos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    const tutor = await Tutor.findById(id).populate(
      "alumnos",
      "nombre uidTarjeta",
    );

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    const alumnosIds = tutor.alumnos.map((a) => a._id);

    let query = { alumno: { $in: alumnosIds } };

    // Filtrar por rango de fechas si se proporcionan
    if (fechaInicio || fechaFin) {
      query.fecha = {};
      if (fechaInicio) query.fecha.$gte = new Date(fechaInicio);
      if (fechaFin) query.fecha.$lte = new Date(fechaFin);
    }

    const asistencias = await Asistencia.find(query)
      .populate("alumno", "nombre uidTarjeta")
      .sort({ fecha: -1 })
      .lean();

    res.status(200).json({
      ok: true,
      data: {
        tutor: {
          _id: tutor._id,
          nombre: tutor.nombre,
          email: tutor.email,
        },
        alumnos: tutor.alumnos,
        asistencias: asistencias,
      },
    });
  } catch (error) {
    console.error("[TUTOR] Error al obtener asistencias:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Registrar un nuevo device para el tutor
exports.registrarDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId, deviceType, deviceName } = req.body;

    if (!deviceId || !deviceType) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "deviceId y deviceType son requeridos",
        },
      });
    }

    const tutor = await Tutor.findById(id);

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    // Verificar si el device ya existe
    const deviceExistente = tutor.devices.find((d) => d.deviceId === deviceId);

    if (deviceExistente) {
      // Actualizar la fecha de último login
      deviceExistente.lastLogin = new Date();
      deviceExistente.isActive = true;
    } else {
      // Agregar nuevo device
      tutor.devices.push({
        deviceId,
        deviceType,
        deviceName,
        lastLogin: new Date(),
        isActive: true,
      });
    }

    await tutor.save();

    console.log(
      `[TUTOR] ✓ Device registrado: ${deviceType} (${deviceId}) → Tutor: ${tutor.nombre}`,
    );

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al registrar device:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Desactivar un device
exports.desactivarDevice = async (req, res) => {
  try {
    const { id, deviceId } = req.params;

    const tutor = await Tutor.findById(id);

    if (!tutor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TUTOR_NO_ENCONTRADO",
          mensaje: "Tutor no encontrado",
        },
      });
    }

    const device = tutor.devices.find((d) => d.deviceId === deviceId);

    if (!device) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "DEVICE_NO_ENCONTRADO",
          mensaje: "Device no encontrado",
        },
      });
    }

    device.isActive = false;
    await tutor.save();

    console.log(
      `[TUTOR] ✓ Device desactivado: ${deviceId} → Tutor: ${tutor.nombre}`,
    );

    res.status(200).json({
      ok: true,
      data: tutor,
    });
  } catch (error) {
    console.error("[TUTOR] Error al desactivar device:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
