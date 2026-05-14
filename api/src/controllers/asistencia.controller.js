const Asistencia = require("../models/asistencia.model");
const Alumno = require("../models/alumno.model");
const Grupo = require("../models/grupo.model");
const Profesor = require("../models/profesor.model");
const XLSX = require("xlsx");
const { obtenerNombreCompletoAlumno } = require("../utils/alumnoNombre");

const DIAS_SEMANA_MAPA = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};
const ESTADOS_REPORTE_VALIDOS = new Set(["presente", "inasistencia", "tarde"]);
const FORMATOS_EXPORTACION_VALIDOS = new Set(["csv", "xlsx", "xls"]);

const crearClaveFechaLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const normalizarHorario = (horario = "") =>
  String(horario)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const crearRangoDias = (inicio, fin) => {
  const dias = new Set();
  let actual = inicio;

  while (actual !== fin) {
    dias.add(actual);
    actual = (actual + 1) % 7;
  }

  dias.add(fin);
  return dias;
};

const convertirHoraAMinutos = (horaTexto) => {
  const [horas, minutos] = String(horaTexto || "")
    .split(":")
    .map(Number);

  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
};

const obtenerConfiguracionHorario = (horario) => {
  const textoHorario = normalizarHorario(horario);
  const coincidenciaRango = textoHorario.match(
    /(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s*(?:a|-|al|hasta)\s*(lunes|martes|miercoles|jueves|viernes|sabado|domingo)/,
  );
  let diasProgramados = new Set();

  if (coincidenciaRango) {
    diasProgramados = crearRangoDias(
      DIAS_SEMANA_MAPA[coincidenciaRango[1]],
      DIAS_SEMANA_MAPA[coincidenciaRango[2]],
    );
  }

  Object.entries(DIAS_SEMANA_MAPA).forEach(([nombreDia, indiceDia]) => {
    if (textoHorario.includes(nombreDia)) {
      diasProgramados.add(indiceDia);
    }
  });

  if (diasProgramados.size === 0) {
    diasProgramados = new Set([1, 2, 3, 4, 5]);
  }

  const [horaEntrada] = textoHorario.match(/\b\d{1,2}:\d{2}\b/g) || [];

  return {
    diasProgramados,
    minutosEntrada: horaEntrada ? convertirHoraAMinutos(horaEntrada) : null,
  };
};

const parsearFechaLocal = (textoFecha) => {
  if (!textoFecha) {
    return null;
  }

  const [year, month, day] = textoFecha.split("-").map(Number);

  if ([year, month, day].some((valor) => Number.isNaN(valor))) {
    return null;
  }

  const fecha = new Date(year, month - 1, day, 0, 0, 0, 0);

  if (
    fecha.getFullYear() !== year ||
    fecha.getMonth() !== month - 1 ||
    fecha.getDate() !== day
  ) {
    return null;
  }

  return fecha;
};

const obtenerRangoConsulta = ({ fecha, fechaInicio, fechaFin }) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const fechaInicioTexto = fecha || fechaInicio || crearClaveFechaLocal(hoy);
  const fechaFinTexto = fecha || fechaFin || fechaInicioTexto;
  const inicio = parsearFechaLocal(fechaInicioTexto);
  const fin = parsearFechaLocal(fechaFinTexto);

  if (!inicio || !fin) {
    return {
      error: {
        codigo: "DATOS_INVALIDOS",
        mensaje: "Las fechas deben tener formato YYYY-MM-DD",
      },
    };
  }

  if (inicio > fin) {
    return {
      error: {
        codigo: "DATOS_INVALIDOS",
        mensaje: "La fecha de inicio no puede ser mayor que la fecha fin",
      },
    };
  }

  const finDia = new Date(fin);
  finDia.setHours(23, 59, 59, 999);

  return {
    fechaInicio: inicio,
    fechaFin: finDia,
    fechaInicioTexto,
    fechaFinTexto,
  };
};

const obtenerEstadosFiltro = ({ estado, estados }) => {
  const valor = estados || estado;

  if (!valor) {
    return null;
  }

  const listaEstados = String(valor)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (listaEstados.length === 0) {
    return null;
  }

  const estadosInvalidos = listaEstados.filter(
    (item) => !ESTADOS_REPORTE_VALIDOS.has(item),
  );

  if (estadosInvalidos.length > 0) {
    return {
      error: {
        codigo: "DATOS_INVALIDOS",
        mensaje: `Estados invalidos: ${estadosInvalidos.join(", ")}`,
      },
    };
  }

  return new Set(listaEstados);
};

const formatearHoraLocal = (fecha) => {
  if (!(fecha instanceof Date) || Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const normalizarFormatoExportacion = (formato = "xlsx") => {
  const formatoNormalizado = String(formato || "xlsx")
    .trim()
    .toLowerCase();

  if (!FORMATOS_EXPORTACION_VALIDOS.has(formatoNormalizado)) {
    return {
      error: {
        codigo: "DATOS_INVALIDOS",
        mensaje: "El formato debe ser csv o xlsx",
      },
    };
  }

  return formatoNormalizado === "xls" ? "xlsx" : formatoNormalizado;
};

const normalizarNombreArchivo = (valor = "archivo") =>
  String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase() || "archivo";

const crearNombreArchivo = ({
  prefijo,
  grupoNombre,
  fechaInicio,
  fechaFin,
  extension,
}) => {
  const partes = [prefijo];

  if (grupoNombre) {
    partes.push(normalizarNombreArchivo(grupoNombre));
  }

  if (fechaInicio) {
    partes.push(fechaInicio);
  }

  if (fechaFin && fechaFin !== fechaInicio) {
    partes.push(fechaFin);
  }

  return `${partes.join("_")}.${extension}`;
};

const construirBufferExportacion = ({ encabezados, filas, formato, hoja }) => {
  const contenidoHoja = [encabezados, ...filas];
  const worksheet = XLSX.utils.aoa_to_sheet(contenidoHoja);

  if (formato === "csv") {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return Buffer.from(`\uFEFF${csv}`, "utf8");
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, hoja);
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
};

const obtenerMimeTypeExportacion = (formato) => {
  if (formato === "csv") {
    return "text/csv; charset=utf-8";
  }

  return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
};

const enviarArchivo = ({ res, buffer, formato, fileName }) => {
  res.setHeader("Content-Type", obtenerMimeTypeExportacion(formato));
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  res.setHeader("Content-Length", buffer.length);
  return res.status(200).send(buffer);
};

const obtenerProfesorSolicitante = async (profesorId) => {
  return Profesor.findById(profesorId).select("_id esAdmin").lean();
};

const obtenerGruposParaReporte = async ({ profesorId, grupoId }) => {
  const profesor = await obtenerProfesorSolicitante(profesorId);

  if (!profesor) {
    return {
      error: {
        status: 404,
        codigo: "PROFESOR_NO_ENCONTRADO",
        mensaje: "Profesor no encontrado",
      },
    };
  }

  const query = grupoId ? { _id: grupoId } : {};
  if (!profesor.esAdmin) {
    query.profesor = profesorId;
  }

  const grupos = await Grupo.find(query)
    .populate("alumnos", "nombre apellidos uidTarjeta")
    .select("nombre horario profesor alumnos activo")
    .sort({ nombre: 1 })
    .lean();

  if (grupoId && grupos.length === 0) {
    const grupoExiste = await Grupo.exists({ _id: grupoId });

    return {
      error: {
        status: grupoExiste ? 403 : 404,
        codigo: grupoExiste ? "ACCESO_DENEGADO" : "GRUPO_NO_ENCONTRADO",
        mensaje: grupoExiste
          ? "Solo puedes consultar reportes de tus propios grupos"
          : "Grupo no encontrado",
      },
    };
  }

  return { profesor, grupos };
};

const obtenerFechasProgramadasEnRango = (
  fechaInicio,
  fechaFin,
  diasProgramados,
) => {
  const fechas = [];
  const cursor = new Date(fechaInicio);
  cursor.setHours(0, 0, 0, 0);
  const limite = new Date(fechaFin);
  limite.setHours(0, 0, 0, 0);

  while (cursor <= limite) {
    if (diasProgramados.has(cursor.getDay())) {
      fechas.push(new Date(cursor));
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return fechas;
};

const construirMapaEventos = (asistencias = []) => {
  const eventosPorAlumnoYFecha = new Map();

  asistencias.forEach((asistencia) => {
    const fechaEvento = new Date(asistencia.fechaHora);
    if (Number.isNaN(fechaEvento.getTime())) {
      return;
    }

    const clave = `${asistencia.uidTarjeta}|${crearClaveFechaLocal(fechaEvento)}`;
    const eventoActual = eventosPorAlumnoYFecha.get(clave) || {
      primeraEntrada: null,
      ultimaSalida: null,
    };

    if (
      asistencia.tipo === "entrada" &&
      (!eventoActual.primeraEntrada ||
        fechaEvento < eventoActual.primeraEntrada)
    ) {
      eventoActual.primeraEntrada = fechaEvento;
    }

    if (
      asistencia.tipo === "salida" &&
      (!eventoActual.ultimaSalida || fechaEvento > eventoActual.ultimaSalida)
    ) {
      eventoActual.ultimaSalida = fechaEvento;
    }

    eventosPorAlumnoYFecha.set(clave, eventoActual);
  });

  return eventosPorAlumnoYFecha;
};

const construirFilaReporte = ({
  grupo,
  alumno,
  fecha,
  configuracionHorario,
  eventosPorAlumnoYFecha,
}) => {
  const fechaTexto = crearClaveFechaLocal(fecha);
  const claveEvento = alumno.uidTarjeta
    ? `${alumno.uidTarjeta}|${fechaTexto}`
    : null;
  const evento = claveEvento ? eventosPorAlumnoYFecha.get(claveEvento) : null;
  let estado = "inasistencia";
  let observaciones = "Sin entrada registrada";

  if (evento?.primeraEntrada) {
    estado = "presente";
    observaciones = "";

    if (configuracionHorario.minutosEntrada !== null) {
      const minutosRegistro =
        evento.primeraEntrada.getHours() * 60 +
        evento.primeraEntrada.getMinutes();

      if (minutosRegistro > configuracionHorario.minutosEntrada + 10) {
        estado = "tarde";
        observaciones = "Entrada posterior al horario";
      }
    }
  }

  return {
    grupoId: grupo._id.toString(),
    grupoNombre: grupo.nombre,
    alumnoId: alumno._id.toString(),
    alumnoNombre: obtenerNombreCompletoAlumno(alumno),
    uidTarjeta: alumno.uidTarjeta || null,
    fecha: fechaTexto,
    estado,
    horaEntrada: formatearHoraLocal(evento?.primeraEntrada || null),
    horaSalida: formatearHoraLocal(evento?.ultimaSalida || null),
    horario: grupo.horario || "",
    observaciones,
  };
};

const construirReporteAsistencias = async ({
  grupos,
  fechaInicio,
  fechaFin,
  estadosFiltro,
}) => {
  const alumnosPorUid = new Set();

  grupos.forEach((grupo) => {
    (grupo.alumnos || []).forEach((alumno) => {
      if (alumno.uidTarjeta) {
        alumnosPorUid.add(alumno.uidTarjeta);
      }
    });
  });

  const filtroAsistencias = {
    fechaHora: {
      $gte: fechaInicio,
      $lte: fechaFin,
    },
  };

  if (alumnosPorUid.size > 0) {
    filtroAsistencias.uidTarjeta = { $in: Array.from(alumnosPorUid) };
  }

  const asistencias = alumnosPorUid.size
    ? await Asistencia.find(filtroAsistencias)
        .select("uidTarjeta tipo fechaHora")
        .sort({ fechaHora: 1 })
        .lean()
    : [];
  const eventosPorAlumnoYFecha = construirMapaEventos(asistencias);
  const filas = [];

  grupos.forEach((grupo) => {
    const configuracionHorario = obtenerConfiguracionHorario(grupo.horario);
    const fechasProgramadas = obtenerFechasProgramadasEnRango(
      fechaInicio,
      fechaFin,
      configuracionHorario.diasProgramados,
    );

    fechasProgramadas.forEach((fechaProgramada) => {
      (grupo.alumnos || []).forEach((alumno) => {
        const fila = construirFilaReporte({
          grupo,
          alumno,
          fecha: fechaProgramada,
          configuracionHorario,
          eventosPorAlumnoYFecha,
        });

        if (!estadosFiltro || estadosFiltro.has(fila.estado)) {
          filas.push(fila);
        }
      });
    });
  });

  filas.sort((filaA, filaB) => {
    if (filaA.fecha !== filaB.fecha) {
      return filaA.fecha < filaB.fecha ? -1 : 1;
    }

    if (filaA.grupoNombre !== filaB.grupoNombre) {
      return filaA.grupoNombre.localeCompare(filaB.grupoNombre, "es");
    }

    return filaA.alumnoNombre.localeCompare(filaB.alumnoNombre, "es");
  });

  const resumenEstados = filas.reduce(
    (acc, fila) => {
      acc[fila.estado] += 1;
      return acc;
    },
    { presente: 0, inasistencia: 0, tarde: 0 },
  );

  return {
    filas,
    resumenEstados,
  };
};

const resolverReporteAsistencias = async ({ profesorId, query }) => {
  const { grupo, fecha, fechaInicio, fechaFin, estado, estados } = query;
  const rangoConsulta = obtenerRangoConsulta({ fecha, fechaInicio, fechaFin });

  if (rangoConsulta.error) {
    return { error: { status: 400, ...rangoConsulta.error } };
  }

  const estadosFiltro = obtenerEstadosFiltro({ estado, estados });

  if (estadosFiltro?.error) {
    return { error: { status: 400, ...estadosFiltro.error } };
  }

  const gruposPermitidos = await obtenerGruposParaReporte({
    profesorId,
    grupoId: grupo,
  });

  if (gruposPermitidos.error) {
    return { error: gruposPermitidos.error };
  }

  const { filas, resumenEstados } = await construirReporteAsistencias({
    grupos: gruposPermitidos.grupos,
    fechaInicio: rangoConsulta.fechaInicio,
    fechaFin: rangoConsulta.fechaFin,
    estadosFiltro,
  });

  return {
    filas,
    resumenEstados,
    grupos: gruposPermitidos.grupos,
    meta: {
      grupos: gruposPermitidos.grupos.map((grupoItem) => ({
        _id: grupoItem._id,
        nombre: grupoItem.nombre,
      })),
      fechaInicio: rangoConsulta.fechaInicioTexto,
      fechaFin: rangoConsulta.fechaFinTexto,
      estados: resumenEstados,
      total: filas.length,
    },
  };
};

const construirFilasExportacionReporte = (filas = []) => {
  const encabezados = [
    "Grupo",
    "Fecha",
    "Alumno",
    "UID",
    "Estado",
    "Hora entrada",
    "Hora salida",
    "Horario",
    "Observaciones",
  ];
  const filasExportacion = filas.map((fila) => [
    fila.grupoNombre,
    fila.fecha,
    fila.alumnoNombre,
    fila.uidTarjeta || "",
    fila.estado,
    fila.horaEntrada || "",
    fila.horaSalida || "",
    fila.horario || "",
    fila.observaciones || "",
  ]);

  return { encabezados, filas: filasExportacion };
};

const construirFilasPlantillaGrupo = (grupo) => {
  const encabezados = ["Grupo", "Alumno", "UID", "Estado", "Observaciones"];
  const filas = [...(grupo.alumnos || [])]
    .sort((alumnoA, alumnoB) =>
      obtenerNombreCompletoAlumno(alumnoA).localeCompare(
        obtenerNombreCompletoAlumno(alumnoB),
        "es",
      ),
    )
    .map((alumno) => [
      grupo.nombre,
      obtenerNombreCompletoAlumno(alumno),
      alumno.uidTarjeta || "",
      "",
      "",
    ]);

  return { encabezados, filas };
};

// Registrar evento de entrada/salida
exports.registrarAsistencia = async (req, res) => {
  try {
    const { uidTarjeta } = req.body;
    console.log(`[ASISTENCIA] Request recibido - UID: ${uidTarjeta}`);

    if (!uidTarjeta) {
      console.log("[ASISTENCIA] Error: UID vacío o no proporcionado");
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Datos incompletos o inválidos",
        },
      });
    }

    // Buscar alumno asociado al tag
    const alumno = await Alumno.findOne({ uidTarjeta });
    if (!alumno) {
      // Tag no registrado: emitir al frontend para captura en formularios
      const io = req.app.get("io");
      if (io) {
        io.emit("tag-leido", { uidTarjeta });
        console.log(
          `[SOCKET] Evento 'tag-leido' emitido (no registrado): ${uidTarjeta}`,
        );
      }

      console.log(
        `[ASISTENCIA] Tag ${uidTarjeta} no registrado - enviado al frontend`,
      );
      return res.status(200).json({
        ok: true,
        data: {
          enviado: true,
          mensaje: "Tag enviado al formulario",
          uidTarjeta,
        },
      });
    }

    const nombreAlumno = obtenerNombreCompletoAlumno(alumno);

    console.log(
      `[ASISTENCIA] Alumno encontrado: ${nombreAlumno} (UID: ${uidTarjeta})`,
    );

    // Buscar último registro de asistencia de este tag
    const ultimo = await Asistencia.findOne({ uidTarjeta }).sort({
      fechaHora: -1,
    });
    const ahora = new Date();

    // Si hay un registro en los últimos 30 segundos, no responder nada
    if (ultimo && ahora - ultimo.fechaHora < 30 * 1000) {
      const segundos = Math.floor((ahora - ultimo.fechaHora) / 1000);
      console.log(
        `[ASISTENCIA] Bloqueado: Tag pasado hace ${segundos}s (ventana 30s) - ${nombreAlumno}`,
      );
      return res.status(204).send();
    }

    // Si no hay registro previo, registrar ENTRADA
    let tipo = "entrada";
    let mensaje = "";

    if (ultimo) {
      const diffMs = ahora - ultimo.fechaHora;
      // Si la diferencia es menor a 2 minutos, no registrar nada
      if (diffMs < 2 * 60 * 1000) {
        const segundos = Math.floor(diffMs / 1000);
        console.log(
          `[ASISTENCIA] Bloqueado: Tag pasado hace ${segundos}s (ventana 2min) - ${nombreAlumno}`,
        );
        return res.status(204).send();
      }
      // Si el último fue ENTRADA, registrar SALIDA
      if (ultimo.tipo === "entrada") {
        tipo = "salida";
        mensaje = `Salida registrada para ${nombreAlumno} a las ${ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
      } else {
        // Si el último fue SALIDA, registrar ENTRADA
        tipo = "entrada";
        mensaje = `Entrada registrada para ${nombreAlumno} a las ${ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
      }
    } else {
      mensaje = `Entrada registrada para ${nombreAlumno} a las ${ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
    }

    // Registrar asistencia con nombre
    const asistencia = new Asistencia({
      alumnoId: alumno._id,
      uidTarjeta,
      nombre: nombreAlumno,
      tipo,
      fechaHora: ahora,
    });
    await asistencia.save();

    const hora = ahora.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
    console.log(
      `[ASISTENCIA] ✓ ${tipo.toUpperCase()} registrada - ${nombreAlumno} - ${hora}`,
    );

    // Emitir evento de Socket.IO para actualización en tiempo real
    const ioSocket = req.app.get("io");
    if (ioSocket) {
      const eventoAsistencia = {
        _id: asistencia._id,
        alumnoId: alumno._id.toString(),
        uidTarjeta: asistencia.uidTarjeta,
        nombre: asistencia.nombre,
        tipo: asistencia.tipo,
        fechaHora: asistencia.fechaHora.toISOString(),
      };
      ioSocket.emit("nueva-asistencia", eventoAsistencia);
      // Notificar al frontend que este tag ya está registrado
      ioSocket.emit("tag-ya-registrado", { uidTarjeta, nombre: nombreAlumno });
      console.log(
        `[SOCKET] Evento 'nueva-asistencia' emitido para ${nombreAlumno}`,
      );
    }

    return res.status(201).json({
      ok: true,
      data: {
        nombre: nombreAlumno,
        tipo,
        hora,
      },
      mensaje,
    });
  } catch (error) {
    console.error("[ASISTENCIA] Error interno:", error);
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

// Listar asistencias (opcionalmente filtrar por uidTarjeta y/o fecha)
exports.listarAsistencias = async (req, res) => {
  try {
    const { uidTarjeta, fecha, grupo } = req.query;

    if (
      Object.prototype.hasOwnProperty.call(req.query, "uidTarjeta") &&
      (uidTarjeta === undefined || uidTarjeta === "")
    ) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "Datos incompletos o inválidos",
        },
      });
    }

    const filtro = {};
    if (uidTarjeta) filtro.uidTarjeta = uidTarjeta;

    // Si hay filtro de alumnos permitidos (para tutores)
    if (req.alumnosPermitidos) {
      // Obtener los UIDs de los alumnos permitidos
      const alumnosPermitidos = await Alumno.find({
        _id: { $in: req.alumnosPermitidos },
      })
        .select("uidTarjeta")
        .lean();

      const uidsPermitidos = alumnosPermitidos.map((a) => a.uidTarjeta);

      if (filtro.uidTarjeta) {
        // Si ya hay un filtro de uidTarjeta, verificar que esté en la lista permitida
        if (!uidsPermitidos.includes(filtro.uidTarjeta)) {
          return res.status(403).json({
            ok: false,
            error: {
              codigo: "ACCESO_DENEGADO",
              mensaje:
                "No tienes permiso para ver las asistencias de este alumno",
            },
          });
        }
      } else {
        // Si no hay filtro de uidTarjeta, filtrar por los UIDs permitidos
        filtro.uidTarjeta = { $in: uidsPermitidos };
      }
    }

    // Filtrar por grupo si se proporciona
    if (grupo) {
      const grupoDoc = await Grupo.findById(grupo).select("alumnos").lean();
      if (grupoDoc && grupoDoc.alumnos.length > 0) {
        const alumnosGrupo = await Alumno.find({
          _id: { $in: grupoDoc.alumnos },
        })
          .select("uidTarjeta")
          .lean();
        const uidsGrupo = alumnosGrupo.map((a) => a.uidTarjeta);

        if (filtro.uidTarjeta && filtro.uidTarjeta.$in) {
          // Intersectar con filtro existente de tutor
          filtro.uidTarjeta = {
            $in: uidsGrupo.filter((uid) => filtro.uidTarjeta.$in.includes(uid)),
          };
        } else if (!filtro.uidTarjeta) {
          filtro.uidTarjeta = { $in: uidsGrupo };
        }
      } else {
        // Grupo vacío o no encontrado, no hay resultados
        return res.status(200).json({ ok: true, data: [] });
      }
    }

    // Filtrar por fecha si se proporciona (formato: YYYY-MM-DD)
    if (fecha) {
      // Crear fechas en la zona horaria local del servidor
      const [year, month, day] = fecha.split("-").map(Number);
      const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
      const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);

      filtro.fechaHora = {
        $gte: fechaInicio,
        $lte: fechaFin,
      };

      console.log(`[ASISTENCIAS] Filtrando por fecha: ${fecha}`);
      console.log(
        `[ASISTENCIAS] Rango: ${fechaInicio.toISOString()} a ${fechaFin.toISOString()}`,
      );
    }

    const asistencias = await Asistencia.find(filtro)
      .sort({ fechaHora: -1 })
      .limit(fecha ? 1000 : 50) // Más resultados si hay filtro de fecha
      .lean();

    console.log(`[ASISTENCIAS] Registros encontrados: ${asistencias.length}`);

    const uidsSinAlumnoId = [
      ...new Set(
        asistencias
          .filter((asistencia) => !asistencia.alumnoId)
          .map((asistencia) => asistencia.uidTarjeta),
      ),
    ];

    const alumnosPorUid = uidsSinAlumnoId.length
      ? await Alumno.find({ uidTarjeta: { $in: uidsSinAlumnoId } })
          .select("_id uidTarjeta")
          .lean()
      : [];

    const alumnoIdPorUid = new Map(
      alumnosPorUid.map((alumno) => [alumno.uidTarjeta, alumno._id.toString()]),
    );

    // Los datos ya incluyen el nombre del alumno
    const data = asistencias.map((a) => ({
      alumnoId: a.alumnoId
        ? a.alumnoId.toString()
        : alumnoIdPorUid.get(a.uidTarjeta) || null,
      uidTarjeta: a.uidTarjeta,
      nombre: a.nombre,
      tipo: a.tipo,
      fechaHora:
        a.fechaHora instanceof Date
          ? a.fechaHora.toISOString()
          : new Date(a.fechaHora).toISOString(),
    }));

    res.status(200).json({ ok: true, data });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

exports.obtenerReporteAsistencias = async (req, res) => {
  try {
    const reporte = await resolverReporteAsistencias({
      profesorId: req.usuario.id,
      query: req.query,
    });

    if (reporte.error) {
      return res.status(reporte.error.status || 400).json({
        ok: false,
        error: {
          codigo: reporte.error.codigo,
          mensaje: reporte.error.mensaje,
        },
      });
    }

    return res.status(200).json({
      ok: true,
      data: reporte.filas,
      meta: reporte.meta,
    });
  } catch (error) {
    console.error("[REPORTES] Error al generar reporte de asistencias:", error);
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

exports.exportarReporteAsistencias = async (req, res) => {
  try {
    const formato = normalizarFormatoExportacion(req.query.formato || "xlsx");

    if (formato?.error) {
      return res.status(400).json({ ok: false, error: formato.error });
    }

    const reporte = await resolverReporteAsistencias({
      profesorId: req.usuario.id,
      query: req.query,
    });

    if (reporte.error) {
      return res.status(reporte.error.status || 400).json({
        ok: false,
        error: {
          codigo: reporte.error.codigo,
          mensaje: reporte.error.mensaje,
        },
      });
    }

    const { encabezados, filas } = construirFilasExportacionReporte(
      reporte.filas,
    );
    const buffer = construirBufferExportacion({
      encabezados,
      filas,
      formato,
      hoja: "Reporte",
    });
    const fileName = crearNombreArchivo({
      prefijo: "reporte_asistencias",
      grupoNombre:
        reporte.meta.grupos.length === 1
          ? reporte.meta.grupos[0].nombre
          : "grupos",
      fechaInicio: reporte.meta.fechaInicio,
      fechaFin: reporte.meta.fechaFin,
      extension: formato,
    });

    return enviarArchivo({ res, buffer, formato, fileName });
  } catch (error) {
    console.error(
      "[REPORTES] Error al exportar reporte de asistencias:",
      error,
    );
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};

exports.exportarPlantillaGrupo = async (req, res) => {
  try {
    const { grupo } = req.query;

    if (!grupo) {
      return res.status(400).json({
        ok: false,
        error: {
          codigo: "DATOS_INVALIDOS",
          mensaje: "El grupo es requerido para exportar la plantilla",
        },
      });
    }

    const formato = normalizarFormatoExportacion(req.query.formato || "xlsx");

    if (formato?.error) {
      return res.status(400).json({ ok: false, error: formato.error });
    }

    const gruposPermitidos = await obtenerGruposParaReporte({
      profesorId: req.usuario.id,
      grupoId: grupo,
    });

    if (gruposPermitidos.error) {
      return res.status(gruposPermitidos.error.status || 400).json({
        ok: false,
        error: {
          codigo: gruposPermitidos.error.codigo,
          mensaje: gruposPermitidos.error.mensaje,
        },
      });
    }

    const grupoSeleccionado = gruposPermitidos.grupos[0];
    const { encabezados, filas } =
      construirFilasPlantillaGrupo(grupoSeleccionado);
    const buffer = construirBufferExportacion({
      encabezados,
      filas,
      formato,
      hoja: "Plantilla",
    });
    const fileName = crearNombreArchivo({
      prefijo: "plantilla_grupo",
      grupoNombre: grupoSeleccionado.nombre,
      extension: formato,
    });

    return enviarArchivo({ res, buffer, formato, fileName });
  } catch (error) {
    console.error("[REPORTES] Error al exportar plantilla de grupo:", error);
    return res.status(500).json({
      ok: false,
      error: {
        codigo: "ERROR_INTERNO",
        mensaje: "Error interno del servidor",
      },
    });
  }
};
