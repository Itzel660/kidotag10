
const Asistencia = require('../models/asistencia.model');
const Alumno = require('../models/alumno.model');

// Registrar evento de entrada/salida
exports.registrarAsistencia = async (req, res) => {
  try {
    const { uidTarjeta } = req.body;
    console.log(`[ASISTENCIA] Request recibido - UID: ${uidTarjeta}`);
    
    if (!uidTarjeta) {
      console.log('[ASISTENCIA] Error: UID vacío o no proporcionado');
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Datos incompletos o inválidos"
        }
      });
    }

    // Buscar alumno asociado al tag
    const alumno = await Alumno.findOne({ uidTarjeta });
    if (!alumno) {
      console.log(`[ASISTENCIA] Error: Tag ${uidTarjeta} no está registrado`);
      return res.status(404).json({
        ok: false,
        error: {
          codigo: "TAG_NO_REGISTRADO",
          mensaje: "El tag no está asociado a ningún alumno"
        }
      });
    }

    console.log(`[ASISTENCIA] Alumno encontrado: ${alumno.nombre} (UID: ${uidTarjeta})`);

    // Buscar último registro de asistencia de este tag
    const ultimo = await Asistencia.findOne({ uidTarjeta }).sort({ fechaHora: -1 });
    const ahora = new Date();

    // Si hay un registro en los últimos 30 segundos, no responder nada
    if (ultimo && (ahora - ultimo.fechaHora) < 30 * 1000) {
      const segundos = Math.floor((ahora - ultimo.fechaHora) / 1000);
      console.log(`[ASISTENCIA] Bloqueado: Tag pasado hace ${segundos}s (ventana 30s) - ${alumno.nombre}`);
      return res.status(204).send();
    }

    // Si no hay registro previo, registrar ENTRADA
    let tipo = 'entrada';
    let mensaje = '';

    if (ultimo) {
      const diffMs = ahora - ultimo.fechaHora;
      // Si la diferencia es menor a 2 minutos, no registrar nada
      if (diffMs < 2 * 60 * 1000) {
        const segundos = Math.floor(diffMs / 1000);
        console.log(`[ASISTENCIA] Bloqueado: Tag pasado hace ${segundos}s (ventana 2min) - ${alumno.nombre}`);
        return res.status(204).send();
      }
      // Si el último fue ENTRADA, registrar SALIDA
      if (ultimo.tipo === 'entrada') {
        tipo = 'salida';
        mensaje = `Salida registrada para ${alumno.nombre} a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
      } else {
        // Si el último fue SALIDA, registrar ENTRADA
        tipo = 'entrada';
        mensaje = `Entrada registrada para ${alumno.nombre} a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
      }
    } else {
      mensaje = `Entrada registrada para ${alumno.nombre} a las ${ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Registrar asistencia con nombre
    const asistencia = new Asistencia({ 
      uidTarjeta, 
      nombre: alumno.nombre,
      tipo, 
      fechaHora: ahora 
    });
    await asistencia.save();

    const hora = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    console.log(`[ASISTENCIA] ✓ ${tipo.toUpperCase()} registrada - ${alumno.nombre} - ${hora}`);

    // Emitir evento de Socket.IO para actualización en tiempo real
    const io = req.app.get('io');
    if (io) {
      const eventoAsistencia = {
        _id: asistencia._id,
        uidTarjeta: asistencia.uidTarjeta,
        nombre: asistencia.nombre,
        tipo: asistencia.tipo,
        fechaHora: asistencia.fechaHora.toISOString()
      };
      io.emit('nueva-asistencia', eventoAsistencia);
      console.log(`[SOCKET] Evento 'nueva-asistencia' emitido para ${alumno.nombre}`);
    }

    return res.status(201).json({
      ok: true,
      data: {
        nombre: alumno.nombre,
        tipo,
        hora
      },
      mensaje
    });
  } catch (error) {
    console.error('[ASISTENCIA] Error interno:', error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor"
      }
    });
  }
};

// Listar asistencias (opcionalmente filtrar por uidTarjeta y/o fecha)
exports.listarAsistencias = async (req, res) => {
  try {
    const { uidTarjeta, fecha } = req.query;

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
    
    // Filtrar por fecha si se proporciona (formato: YYYY-MM-DD)
    if (fecha) {
      // Crear fechas en la zona horaria local del servidor
      const [year, month, day] = fecha.split('-').map(Number);
      const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
      const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
      
      filtro.fechaHora = {
        $gte: fechaInicio,
        $lte: fechaFin
      };
      
      console.log(`[ASISTENCIAS] Filtrando por fecha: ${fecha}`);
      console.log(`[ASISTENCIAS] Rango: ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}`);
    }

    const asistencias = await Asistencia.find(filtro)
      .sort({ fechaHora: -1 })
      .limit(fecha ? 1000 : 50) // Más resultados si hay filtro de fecha
      .lean();

    console.log(`[ASISTENCIAS] Registros encontrados: ${asistencias.length}`);

    // Los datos ya incluyen el nombre del alumno
    const data = asistencias.map(a => ({
      uidTarjeta: a.uidTarjeta,
      nombre: a.nombre,
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
