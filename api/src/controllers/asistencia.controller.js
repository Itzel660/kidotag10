const Asistencia = require('../models/asistencia.model');

// Registrar evento de entrada/salida
exports.registrarAsistencia = async (req, res) => {
  try {
    const { uidTarjeta, tipo } = req.body;

    // Validar que los campos existan
    if (!uidTarjeta || !tipo) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Datos incompletos o inválidos"
        }
      });
    }

    // Crear nuevo registro de asistencia
    const asistencia = new Asistencia({
      uidTarjeta,
      tipo,
      fechaHora: new Date()
    });

    // Guardar en MongoDB
    const asistenciaGuardada = await asistencia.save();

    // Responder con HTTP 201
    res.status(201).json({
      ok: true,
      data: {
        uidTarjeta: asistenciaGuardada.uidTarjeta,
        tipo: asistenciaGuardada.tipo,
        fechaHora: asistenciaGuardada.fechaHora.toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor"
      }
    });
  }
};

// Listar asistencias (opcionalmente filtrar por uidTarjeta)
exports.listarAsistencias = async (req, res) => {
  try {
    const { uidTarjeta } = req.query;

    if (Object.prototype.hasOwnProperty.call(req.query, 'uidTarjeta') && (uidTarjeta === undefined || uidTarjeta === '')) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Datos incompletos o inválidos"
        }
      });
    }

    const filtro = {};
    if (uidTarjeta) filtro.uidTarjeta = uidTarjeta;

    const asistencias = await Asistencia.find(filtro)
      .sort({ fechaHora: -1 })
      .limit(50)
      .lean();

    const data = asistencias.map(a => ({
      uidTarjeta: a.uidTarjeta,
      tipo: a.tipo,
      fechaHora: a.fechaHora instanceof Date ? a.fechaHora.toISOString() : new Date(a.fechaHora).toISOString()
    }));

    res.status(200).json({ ok: true, data });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor"
      }
    });
  }
};
