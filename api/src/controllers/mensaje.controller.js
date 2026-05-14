const Mensaje = require("../models/mensaje.model");
const Anuncio = require("../models/anuncio.model");
const Tutor = require("../models/tutor.model");
const Grupo = require("../models/grupo.model");
const Alumno = require("../models/alumno.model");

// Enviar mensaje (solo tutores)
exports.enviarMensaje = async (req, res) => {
  try {
    const { alumnoId, tipo, mensaje, fecha } = req.body;

    if (!alumnoId || !tipo || !mensaje || !fecha) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "alumnoId, tipo, mensaje y fecha son requeridos",
        },
      });
    }

    if (!["inasistencia", "salida_temprana"].includes(tipo)) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "TIPO_INVALIDO",
          mensaje: "El tipo debe ser 'inasistencia' o 'salida_temprana'",
        },
      });
    }

    // Verificar que el alumno pertenece al tutor
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

    const alumnoEnTutor = tutor.alumnos.some((a) => a.toString() === alumnoId);
    if (!alumnoEnTutor) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Este alumno no está asociado a tu cuenta",
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

    // Buscar el grupo del alumno para encontrar al profesor
    const grupo = await Grupo.findOne({
      alumnos: alumnoId,
      activo: true,
    });

    if (!grupo || !grupo.profesor) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "GRUPO_NO_ENCONTRADO",
          mensaje:
            "No se encontró un grupo con profesor asignado para este alumno",
        },
      });
    }

    const nuevoMensaje = await Mensaje.create({
      remitente: req.usuario.id,
      destinatario: grupo.profesor,
      alumno: alumnoId,
      tipo,
      mensaje,
      fecha: new Date(fecha),
    });

    const mensajePoblado = await Mensaje.findById(nuevoMensaje._id)
      .populate("remitente", "nombre email")
      .populate("destinatario", "nombre email")
      .populate("alumno", "nombre apellidos uidTarjeta");

    console.log(
      `[MENSAJES] ✓ Mensaje enviado: ${tutor.nombre} -> profesor del grupo ${grupo.nombre} (${tipo})`,
    );

    res.status(201).json({
      ok: true,
      data: mensajePoblado,
    });
  } catch (error) {
    console.error("[MENSAJES] Error al enviar mensaje:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};

// Obtener mensajes (filtrado por rol)
exports.obtenerMensajes = async (req, res) => {
  try {
    const { id, tipo } = req.usuario;
    let filtro = {};

    if (tipo === "tutor") {
      filtro.remitente = id;
    } else if (tipo === "profesor") {
      // Verificar si es admin
      const Profesor = require("../models/profesor.model");
      const profesor = await Profesor.findById(id);
      if (profesor && profesor.esAdmin) {
        // Admin ve todos los mensajes
        filtro = {};
      } else {
        filtro.destinatario = id;
      }
    }

    const mensajes = await Mensaje.find(filtro)
      .populate("remitente", "nombre email telefono")
      .populate("destinatario", "nombre email")
      .populate("alumno", "nombre apellidos uidTarjeta")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      ok: true,
      data: mensajes,
    });
  } catch (error) {
    console.error("[MENSAJES] Error al obtener mensajes:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};

// Marcar mensaje como leído
exports.marcarLeido = async (req, res) => {
  try {
    const { id: mensajeId } = req.params;
    const { id: usuarioId, tipo } = req.usuario;

    const mensaje = await Mensaje.findById(mensajeId);

    if (!mensaje) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "MENSAJE_NO_ENCONTRADO",
          mensaje: "Mensaje no encontrado",
        },
      });
    }

    // Solo el destinatario o un admin puede marcar como leído
    if (tipo === "profesor") {
      const Profesor = require("../models/profesor.model");
      const profesor = await Profesor.findById(usuarioId);
      const esDestinatario = mensaje.destinatario.toString() === usuarioId;
      const esAdmin = profesor && profesor.esAdmin;

      if (!esDestinatario && !esAdmin) {
        return res.status(403).json({
          ok: false,
          error: {
            codigo: "ACCESO_DENEGADO",
            mensaje: "No tienes permiso para esta acción",
          },
        });
      }
    } else {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo profesores pueden marcar mensajes como leídos",
        },
      });
    }

    mensaje.leido = true;
    await mensaje.save();

    res.status(200).json({
      ok: true,
      data: mensaje,
    });
  } catch (error) {
    console.error("[MENSAJES] Error al marcar mensaje como leído:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};

// Responder mensaje (aprobar/rechazar) - solo profesores
exports.responderMensaje = async (req, res) => {
  try {
    const { id: mensajeId } = req.params;
    const { id: usuarioId, tipo } = req.usuario;
    const { estado, respuesta } = req.body;

    if (!estado || !["aprobado", "rechazado"].includes(estado)) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Estado debe ser 'aprobado' o 'rechazado'",
        },
      });
    }

    if (tipo !== "profesor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo profesores pueden responder mensajes",
        },
      });
    }

    const mensaje = await Mensaje.findById(mensajeId);
    if (!mensaje) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "MENSAJE_NO_ENCONTRADO",
          mensaje: "Mensaje no encontrado",
        },
      });
    }

    const Profesor = require("../models/profesor.model");
    const profesor = await Profesor.findById(usuarioId);
    const esDestinatario = mensaje.destinatario.toString() === usuarioId;
    const esAdmin = profesor && profesor.esAdmin;

    if (!esDestinatario && !esAdmin) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "No tienes permiso para esta acción",
        },
      });
    }

    mensaje.estado = estado;
    mensaje.leido = true;
    if (respuesta) mensaje.respuesta = respuesta;
    await mensaje.save();

    const mensajePoblado = await Mensaje.findById(mensajeId)
      .populate("remitente", "nombre email telefono")
      .populate("destinatario", "nombre email")
      .populate("alumno", "nombre apellidos uidTarjeta");

    console.log(`[MENSAJES] ✓ Mensaje ${estado}: ${mensajeId}`);

    res.status(200).json({ ok: true, data: mensajePoblado });
  } catch (error) {
    console.error("[MENSAJES] Error al responder mensaje:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};

// Eliminar mensaje (solo profesores)
exports.eliminarMensaje = async (req, res) => {
  try {
    const { id: mensajeId } = req.params;
    const { id: usuarioId, tipo } = req.usuario;

    if (tipo !== "profesor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo profesores pueden eliminar mensajes",
        },
      });
    }

    const mensaje = await Mensaje.findById(mensajeId);
    if (!mensaje) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "MENSAJE_NO_ENCONTRADO",
          mensaje: "Mensaje no encontrado",
        },
      });
    }

    const Profesor = require("../models/profesor.model");
    const profesor = await Profesor.findById(usuarioId);
    const esDestinatario = mensaje.destinatario.toString() === usuarioId;
    const esAdmin = profesor && profesor.esAdmin;

    if (!esDestinatario && !esAdmin) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "No tienes permiso para eliminar este mensaje",
        },
      });
    }

    await Mensaje.findByIdAndDelete(mensajeId);
    console.log(`[MENSAJES] ✓ Mensaje eliminado: ${mensajeId}`);

    res.status(200).json({ ok: true, data: { _id: mensajeId } });
  } catch (error) {
    console.error("[MENSAJES] Error al eliminar mensaje:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};

// Contar mensajes no leídos (para polling)
exports.contarNoLeidos = async (req, res) => {
  try {
    const { id, tipo } = req.usuario;
    let filtro = { estado: "pendiente" };

    if (tipo === "tutor") {
      // Contar mensajes con respuesta nueva (aprobado/rechazado) que el tutor aún no ha visto
      const [countRespuestas, countAnuncios] = await Promise.all([
        Mensaje.countDocuments({
          remitente: id,
          estado: { $in: ["aprobado", "rechazado"] },
          leido: false,
        }),
        Anuncio.countDocuments({
          destinatarios: id,
          "vistoPor.tutor": { $nin: [id] },
        }),
      ]);

      return res
        .status(200)
        .json({ ok: true, data: { count: countRespuestas + countAnuncios } });
    } else if (tipo === "profesor") {
      const Profesor = require("../models/profesor.model");
      const profesor = await Profesor.findById(id);
      if (profesor && profesor.esAdmin) {
        // Admin: todos los no leídos
      } else {
        filtro.destinatario = id;
      }
    }

    const count = await Mensaje.countDocuments(filtro);

    res.status(200).json({
      ok: true,
      data: { count },
    });
  } catch (error) {
    console.error("[MENSAJES] Error al contar no leídos:", error);
    res.status(500).json({
      ok: false,
      error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor" },
    });
  }
};
