const Profesor = require("../models/profesor.model");
const Grupo = require("../models/grupo.model");

// Registrar un nuevo profesor
exports.registrarProfesor = async (req, res) => {
  try {
    const { nombre, email, password, telefono, especialidad } = req.body;

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
    const existente = await Profesor.findOne({ email });
    if (existente) {
      return res.status(409).json({
        ok: false,
        error: {
          codigo: "EMAIL_DUPLICADO",
          mensaje: "Este email ya está registrado",
        },
      });
    }

    const profesor = new Profesor({
      nombre,
      email,
      password,
      telefono,
      especialidad,
    });
    await profesor.save();

    console.log(`[PROFESOR] ✓ Registrado: ${nombre} (${email})`);

    res.status(201).json({
      ok: true,
      data: {
        _id: profesor._id,
        nombre: profesor.nombre,
        email: profesor.email,
        telefono: profesor.telefono,
        especialidad: profesor.especialidad,
      },
    });
  } catch (error) {
    console.error("[PROFESOR] Error al registrar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Listar todos los profesores
exports.listarProfesores = async (req, res) => {
  try {
    const profesores = await Profesor.find().sort({ nombre: 1 }).lean();

    res.status(200).json({
      ok: true,
      data: profesores,
    });
  } catch (error) {
    console.error("[PROFESOR] Error al listar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener un profesor por ID
exports.obtenerProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const profesor = await Profesor.findById(id).lean();

    if (!profesor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    res.status(200).json({
      ok: true,
      data: profesor,
    });
  } catch (error) {
    console.error("[PROFESOR] Error al obtener:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Actualizar un profesor
exports.actualizarProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, especialidad, activo } = req.body;

    const profesor = await Profesor.findByIdAndUpdate(
      id,
      { nombre, email, telefono, especialidad, activo },
      { new: true, runValidators: true },
    );

    if (!profesor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    console.log(`[PROFESOR] ✓ Actualizado: ${profesor.nombre}`);

    res.status(200).json({
      ok: true,
      data: profesor,
    });
  } catch (error) {
    console.error("[PROFESOR] Error al actualizar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Eliminar un profesor
exports.eliminarProfesor = async (req, res) => {
  try {
    const { id } = req.params;
    const profesor = await Profesor.findByIdAndDelete(id);

    if (!profesor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    console.log(`[PROFESOR] ✓ Eliminado: ${profesor.nombre}`);

    res.status(200).json({
      ok: true,
      mensaje: "Profesor eliminado correctamente",
    });
  } catch (error) {
    console.error("[PROFESOR] Error al eliminar:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener los grupos de un profesor
exports.obtenerGruposProfesor = async (req, res) => {
  try {
    const { id } = req.params;

    const profesor = await Profesor.findById(id);
    if (!profesor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado",
        },
      });
    }

    const grupos = await Grupo.find({ profesor: id })
      .populate("alumnos", "nombre uidTarjeta")
      .lean();

    res.status(200).json({
      ok: true,
      data: {
        profesor: {
          _id: profesor._id,
          nombre: profesor.nombre,
          email: profesor.email,
          especialidad: profesor.especialidad,
        },
        grupos: grupos,
      },
    });
  } catch (error) {
    console.error("[PROFESOR] Error al obtener grupos:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
