const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Tutor = require("../models/tutor.model");
const Profesor = require("../models/profesor.model");

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-kidotag-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Generar token JWT
const generarToken = (id, tipo, email) => {
  return jwt.sign({ id, tipo, email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Login para tutores
exports.loginTutor = async (req, res) => {
  try {
    const { email, password, deviceId, deviceType, deviceName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Email y password son requeridos",
        },
      });
    }

    // Buscar tutor por email
    const tutor = await Tutor.findOne({ email }).populate(
      "alumnos",
      "nombre uidTarjeta",
    );

    if (!tutor) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Email o contraseña incorrectos",
        },
      });
    }

    // Verificar que el tutor esté activo
    if (!tutor.activo) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "CUENTA_INACTIVA",
          mensaje: "La cuenta del tutor está inactiva",
        },
      });
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, tutor.password);

    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Email o contraseña incorrectos",
        },
      });
    }

    // Registrar device si se proporcionó
    if (deviceId && deviceType) {
      const deviceExistente = tutor.devices.find(
        (d) => d.deviceId === deviceId,
      );

      if (deviceExistente) {
        deviceExistente.lastLogin = new Date();
        deviceExistente.isActive = true;
      } else {
        tutor.devices.push({
          deviceId,
          deviceType,
          deviceName: deviceName || `${deviceType} device`,
          lastLogin: new Date(),
          isActive: true,
        });
      }

      await tutor.save();
    }

    // Generar token
    const token = generarToken(tutor._id, "tutor", tutor.email);

    console.log(`[AUTH] ✓ Login tutor: ${tutor.nombre} (${tutor.email})`);

    res.status(200).json({
      ok: true,
      data: {
        token,
        tipo: "tutor",
        usuario: {
          _id: tutor._id,
          nombre: tutor.nombre,
          email: tutor.email,
          telefono: tutor.telefono,
          alumnos: tutor.alumnos,
          cantidadDevices: tutor.devices.filter((d) => d.isActive).length,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] Error en login tutor:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Login para profesores
exports.loginProfesor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Email y password son requeridos",
        },
      });
    }

    // Buscar profesor por email
    const profesor = await Profesor.findOne({ email });

    if (!profesor) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Email o contraseña incorrectos",
        },
      });
    }

    // Verificar que el profesor esté activo
    if (!profesor.activo) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "CUENTA_INACTIVA",
          mensaje: "La cuenta del profesor está inactiva",
        },
      });
    }

    // Verificar password
    const passwordValido = await bcrypt.compare(password, profesor.password);

    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "CREDENCIALES_INVALIDAS",
          mensaje: "Email o contraseña incorrectos",
        },
      });
    }

    // Generar token
    const token = generarToken(profesor._id, "profesor", profesor.email);

    console.log(
      `[AUTH] ✓ Login profesor: ${profesor.nombre} (${profesor.email})`,
    );

    res.status(200).json({
      ok: true,
      data: {
        token,
        tipo: "profesor",
        usuario: {
          _id: profesor._id,
          nombre: profesor.nombre,
          email: profesor.email,
          telefono: profesor.telefono,
          especialidad: profesor.especialidad,
        },
      },
    });
  } catch (error) {
    console.error("[AUTH] Error en login profesor:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Obtener información del usuario autenticado
exports.obtenerUsuarioActual = async (req, res) => {
  try {
    const { id, tipo } = req.usuario;

    let usuario;

    if (tipo === "tutor") {
      usuario = await Tutor.findById(id)
        .select("-password")
        .populate("alumnos", "nombre uidTarjeta")
        .lean();
    } else if (tipo === "profesor") {
      usuario = await Profesor.findById(id).select("-password").lean();
    }

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "USUARIO_NO_ENCONTRADO",
          mensaje: "Usuario no encontrado",
        },
      });
    }

    res.status(200).json({
      ok: true,
      data: {
        tipo,
        usuario,
      },
    });
  } catch (error) {
    console.error("[AUTH] Error al obtener usuario actual:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Cambiar contraseña
exports.cambiarPassword = async (req, res) => {
  try {
    const { id, tipo } = req.usuario;
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Password actual y nuevo son requeridos",
        },
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "PASSWORD_INVALIDO",
          mensaje: "El password debe tener al menos 6 caracteres",
        },
      });
    }

    let usuario;
    let Model;

    if (tipo === "tutor") {
      Model = Tutor;
    } else if (tipo === "profesor") {
      Model = Profesor;
    }

    usuario = await Model.findById(id);

    if (!usuario) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "USUARIO_NO_ENCONTRADO",
          mensaje: "Usuario no encontrado",
        },
      });
    }

    // Verificar password actual
    const passwordValido = await bcrypt.compare(
      passwordActual,
      usuario.password,
    );

    if (!passwordValido) {
      return res.status(401).json({
        ok: false,
        error: {
          codigo: "PASSWORD_INCORRECTO",
          mensaje: "Password actual incorrecto",
        },
      });
    }

    // Hashear nuevo password
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(passwordNuevo, salt);

    await usuario.save();

    console.log(`[AUTH] ✓ Password cambiado: ${usuario.nombre}`);

    res.status(200).json({
      ok: true,
      mensaje: "Password actualizado correctamente",
    });
  } catch (error) {
    console.error("[AUTH] Error al cambiar password:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
