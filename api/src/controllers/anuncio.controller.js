const Anuncio = require("../models/anuncio.model");
const Profesor = require("../models/profesor.model");
const Grupo = require("../models/grupo.model");
const Alumno = require("../models/alumno.model");
const Tutor = require("../models/tutor.model");

const CAMPOS_TUTOR = "nombre email telefono";
const CAMPOS_AUTOR = "nombre email";

const normalizarIds = (valores = []) => {
  if (!Array.isArray(valores)) {
    return [];
  }

  return [
    ...new Set(
      valores
        .map((valor) =>
          typeof valor === "string" ? valor : valor?._id || valor,
        )
        .filter(Boolean)
        .map((valor) => valor.toString()),
    ),
  ];
};

const obtenerProfesorSolicitante = async (profesorId) => {
  return Profesor.findById(profesorId)
    .select("nombre email esAdmin activo")
    .lean();
};

const obtenerTutorIdsDesdeAlumnos = async (alumnoIds = []) => {
  if (alumnoIds.length === 0) {
    return [];
  }

  const alumnos = await Alumno.find({
    _id: { $in: alumnoIds },
    tutor: { $exists: true, $ne: null },
  })
    .select("tutor")
    .lean();

  return normalizarIds(alumnos.map((alumno) => alumno.tutor));
};

const obtenerGrupoPermitido = async (grupoId, profesor) => {
  const grupo = await Grupo.findOne({
    _id: grupoId,
    activo: true,
  })
    .select("nombre profesor alumnos activo")
    .lean();

  if (!grupo) {
    return { error: "GRUPO_NO_ENCONTRADO", mensaje: "Grupo no encontrado" };
  }

  if (!profesor.esAdmin && String(grupo.profesor) !== String(profesor._id)) {
    return {
      error: "ACCESO_DENEGADO",
      mensaje: "Solo puedes enviar anuncios a tus propios grupos",
      status: 403,
    };
  }

  return { grupo };
};

const obtenerTutorIdsPermitidosParaProfesor = async (profesorId) => {
  const grupos = await Grupo.find({ profesor: profesorId, activo: true })
    .select("alumnos")
    .lean();

  const alumnoIds = normalizarIds(
    grupos.flatMap((grupo) => grupo.alumnos || []),
  );

  return obtenerTutorIdsDesdeAlumnos(alumnoIds);
};

const cargarAnuncioPoblado = async (anuncioId) => {
  return Anuncio.findById(anuncioId)
    .populate("autor", CAMPOS_AUTOR)
    .populate("grupo", "nombre")
    .populate("destinatarios", CAMPOS_TUTOR)
    .populate("vistoPor.tutor", CAMPOS_TUTOR)
    .lean();
};

const serializarAnuncio = (anuncio, usuario) => {
  if (!anuncio) {
    return null;
  }

  const usuarioId = usuario?.id ? usuario.id.toString() : null;
  const vistaActual = usuarioId
    ? anuncio.vistoPor?.find(
        (vista) => String(vista.tutor?._id || vista.tutor) === usuarioId,
      )
    : null;

  return {
    ...anuncio,
    totalDestinatarios: anuncio.destinatarios?.length || 0,
    totalVistos: anuncio.vistoPor?.length || 0,
    visto: Boolean(vistaActual),
    fechaVista: vistaActual?.fechaVista || null,
  };
};

exports.crearAnuncio = async (req, res) => {
  try {
    const { titulo, mensaje, alcance, grupoId, tutorIds } = req.body;

    if (!titulo || !mensaje || !alcance) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "titulo, mensaje y alcance son requeridos",
        },
      });
    }

    if (!["grupo", "tutores", "todos"].includes(alcance)) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "ALCANCE_INVALIDO",
          mensaje: "El alcance debe ser 'grupo', 'tutores' o 'todos'",
        },
      });
    }

    const profesor = await obtenerProfesorSolicitante(req.usuario.id);
    if (!profesor || !profesor.activo) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "PROFESOR_NO_ENCONTRADO",
          mensaje: "Profesor no encontrado o inactivo",
        },
      });
    }

    let grupo = null;
    let destinatarios = [];

    if (alcance === "grupo") {
      if (!grupoId) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "grupoId es requerido para anuncios por grupo",
          },
        });
      }

      const resultadoGrupo = await obtenerGrupoPermitido(grupoId, profesor);
      if (resultadoGrupo.error) {
        return res.status(resultadoGrupo.status || 404).json({
          ok: false,
          error: {
            codigo: resultadoGrupo.error,
            mensaje: resultadoGrupo.mensaje,
          },
        });
      }

      grupo = resultadoGrupo.grupo;
      destinatarios = await obtenerTutorIdsDesdeAlumnos(grupo.alumnos || []);
    }

    if (alcance === "tutores") {
      const tutorIdsNormalizados = normalizarIds(tutorIds);
      if (tutorIdsNormalizados.length === 0) {
        return res.status(400).json({
          ok: false,
          error: {
            codigo: "DATOS_INVALIDOS",
            mensaje: "Debes seleccionar al menos un tutor",
          },
        });
      }

      const tutoresActivos = await Tutor.find({
        _id: { $in: tutorIdsNormalizados },
        activo: true,
      })
        .select("_id")
        .lean();

      if (tutoresActivos.length !== tutorIdsNormalizados.length) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "TUTOR_NO_ENCONTRADO",
            mensaje:
              "Uno o mas tutores seleccionados no existen o estan inactivos",
          },
        });
      }

      if (!profesor.esAdmin) {
        const tutorIdsPermitidos = await obtenerTutorIdsPermitidosParaProfesor(
          profesor._id,
        );
        const todosPermitidos = tutorIdsNormalizados.every((tutorId) =>
          tutorIdsPermitidos.includes(tutorId),
        );

        if (!todosPermitidos) {
          return res.status(403).json({
            ok: false,
            error: {
              codigo: "ACCESO_DENEGADO",
              mensaje:
                "Solo puedes seleccionar tutores que pertenezcan a tus grupos",
            },
          });
        }
      }

      destinatarios = tutorIdsNormalizados;
    }

    if (alcance === "todos") {
      if (!profesor.esAdmin) {
        return res.status(403).json({
          ok: false,
          error: {
            codigo: "ACCESO_DENEGADO",
            mensaje:
              "Solo un administrador puede enviar anuncios a todos los tutores",
          },
        });
      }

      const tutoresActivos = await Tutor.find({ activo: true })
        .select("_id")
        .lean();

      destinatarios = normalizarIds(tutoresActivos.map((tutor) => tutor._id));
    }

    if (destinatarios.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "SIN_DESTINATARIOS",
          mensaje: "No se encontraron tutores para este anuncio",
        },
      });
    }

    const anuncio = await Anuncio.create({
      autor: profesor._id,
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      alcance,
      grupo: grupo?._id,
      grupoNombre: grupo?.nombre,
      destinatarios,
      vistoPor: [],
    });

    const anuncioPoblado = await cargarAnuncioPoblado(anuncio._id);

    console.log(
      `[ANUNCIOS] ✓ Anuncio enviado: ${profesor.nombre} -> ${destinatarios.length} tutores (${alcance})`,
    );

    res.status(201).json({
      ok: true,
      data: serializarAnuncio(anuncioPoblado, req.usuario),
    });
  } catch (error) {
    console.error("[ANUNCIOS] Error al crear anuncio:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

exports.obtenerAnuncios = async (req, res) => {
  try {
    const { id, tipo } = req.usuario;
    let filtro = {};

    if (tipo === "tutor") {
      filtro.destinatarios = id;
    } else if (tipo === "profesor") {
      const profesor = await obtenerProfesorSolicitante(id);
      if (!profesor) {
        return res.status(404).json({
          ok: false,
          error: {
            codigo: "PROFESOR_NO_ENCONTRADO",
            mensaje: "Profesor no encontrado",
          },
        });
      }

      filtro = profesor.esAdmin ? {} : { autor: id };
    }

    const anuncios = await Anuncio.find(filtro)
      .populate("autor", CAMPOS_AUTOR)
      .populate("grupo", "nombre")
      .populate("destinatarios", CAMPOS_TUTOR)
      .populate("vistoPor.tutor", CAMPOS_TUTOR)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      ok: true,
      data: anuncios.map((anuncio) => serializarAnuncio(anuncio, req.usuario)),
    });
  } catch (error) {
    console.error("[ANUNCIOS] Error al obtener anuncios:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

exports.marcarAnuncioVisto = async (req, res) => {
  try {
    const { id: anuncioId } = req.params;
    const { id: tutorId, tipo } = req.usuario;

    if (tipo !== "tutor") {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "Solo los tutores pueden registrar la lectura de un anuncio",
        },
      });
    }

    const anuncio = await Anuncio.findById(anuncioId);
    if (!anuncio) {
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "ANUNCIO_NO_ENCONTRADO",
          mensaje: "Anuncio no encontrado",
        },
      });
    }

    const esDestinatario = anuncio.destinatarios.some(
      (destinatarioId) => String(destinatarioId) === String(tutorId),
    );

    if (!esDestinatario) {
      return res.status(403).json({
        ok: false,
        error: {
          codigo: "ACCESO_DENEGADO",
          mensaje: "No tienes permiso para ver este anuncio",
        },
      });
    }

    const yaVisto = anuncio.vistoPor.some(
      (vista) => String(vista.tutor) === String(tutorId),
    );

    if (!yaVisto) {
      anuncio.vistoPor.push({ tutor: tutorId, fechaVista: new Date() });
      await anuncio.save();
    }

    const anuncioPoblado = await cargarAnuncioPoblado(anuncioId);

    if (!yaVisto) {
      const ioSocket = req.app.get("io");
      if (ioSocket) {
        ioSocket.emit("anuncio-visto", {
          anuncioId,
          tutorId,
          anuncio: serializarAnuncio(anuncioPoblado),
        });
      }
    }

    res.status(200).json({
      ok: true,
      data: serializarAnuncio(anuncioPoblado, req.usuario),
    });
  } catch (error) {
    console.error("[ANUNCIOS] Error al marcar anuncio como visto:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
