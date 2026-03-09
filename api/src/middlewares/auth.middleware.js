const jwt = require("jsonwebtoken");
const Tutor = require("../models/tutor.model");
const Profesor = require("../models/profesor.model");

// Middleware para verificar el token JWT
exports.verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "TOKEN_REQUERIDO",
          mensaje: "Token de autenticación requerido",
        },
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret-key-kidotag-2026",
    );

    // Agregar información del usuario al request
    req.usuario = {
      id: decoded.id,
      tipo: decoded.tipo, // 'tutor' o 'profesor'
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "TOKEN_INVALIDO",
          mensaje: "Token inválido",
        },
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "TOKEN_EXPIRADO",
          mensaje: "Token expirado",
        },
      });
    }

    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error al verificar token",
      },
    });
  }
};

// Middleware para verificar que el usuario es un tutor
exports.esTutor = async (req, res, next) => {
  try {
    if (req.usuario.tipo !== "tutor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo los tutores pueden acceder a este recurso",
        },
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error al verificar permisos",
      },
    });
  }
};

// Middleware para verificar que el usuario es un profesor
exports.esProfesor = async (req, res, next) => {
  try {
    if (req.usuario.tipo !== "profesor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo los profesores pueden acceder a este recurso",
        },
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error al verificar permisos",
      },
    });
  }
};

// Middleware para verificar que un tutor solo acceda a sus propios alumnos
exports.verificarAccesoAlumno = async (req, res, next) => {
  try {
    const { id } = req.params; // ID del alumno
    const alumnoId = id || req.params.alumnoId;

    if (!alumnoId) {
      return next(); // Si no hay alumnoId en los params, continuar
    }

    // Si es profesor, permitir acceso completo
    if (req.usuario.tipo === "profesor") {
      return next();
    }

    // Si es tutor, verificar que el alumno esté en su lista
    if (req.usuario.tipo === "tutor") {
      const tutor = await Tutor.findById(req.usuario.id);

      if (!tutor) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "TUTOR_NO_ENCONTRADO",
            mensaje: "Tutor no encontrado",
          },
        });
      }

      const tieneAcceso = tutor.alumnos.some((a) => a.toString() === alumnoId);

      if (!tieneAcceso) {
        return res.status(403).json({
          ok: false,
          error: {
            codigo: "ACCESO_DENEGADO",
            mensaje: "No tienes permiso para acceder a este alumno",
          },
        });
      }
    }

    next();
  } catch (error) {
    console.error("[AUTH] Error al verificar acceso a alumno:", error);
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error al verificar permisos",
      },
    });
  }
};

// Middleware para filtrar alumnos según el tutor
exports.filtrarAlumnosPorTutor = async (req, res, next) => {
  try {
    // Si es profesor, permitir ver todos los alumnos
    if (req.usuario.tipo === "profesor") {
      return next();
    }

    // Si es tutor, agregar filtro para ver solo sus alumnos
    if (req.usuario.tipo === "tutor") {
      const tutor = await Tutor.findById(req.usuario.id);

      if (!tutor) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "TUTOR_NO_ENCONTRADO",
            mensaje: "Tutor no encontrado",
          },
        });
      }

      // Agregar los IDs de alumnos del tutor al request
      req.alumnosPermitidos = tutor.alumnos.map((a) => a.toString());
    }

    next();
  } catch (error) {
    console.error("[AUTH] Error al filtrar alumnos:", error);
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error al verificar permisos",
      },
    });
  }
};
