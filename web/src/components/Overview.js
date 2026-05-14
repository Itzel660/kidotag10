import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faUsers,
  faClipboardCheck,
  faSignOutAlt,
  faBell,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faEnvelope,
  faUserGraduate,
  faChalkboardTeacher,
  faClock,
  faIdCard,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import config, { apiGet } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import { obtenerNombreCompletoAlumno } from "../utils/alumnoNombre";
import "./Overview.css";

const DIAS_SEMANA_CORTOS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const DIAS_SEMANA_MAPA = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};
const RESUMEN_VACIO = {
  fecha: "",
  etiqueta: "",
  entradas: 0,
  inasistencias: 0,
  tardanzas: 0,
  alumnosEsperados: 0,
  entradasEvaluables: 0,
};
const LIMITE_DIAS_MENSAJES = 15;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const esMensajeDentroDeVentana = (
  fechaValor,
  diasLimite = LIMITE_DIAS_MENSAJES,
) => {
  const fecha = new Date(fechaValor);

  if (Number.isNaN(fecha.getTime())) {
    return true;
  }

  return Date.now() - fecha.getTime() <= diasLimite * MILISEGUNDOS_POR_DIA;
};

const normalizarMensajeReciente = (mensaje, esTutor) => {
  if (mensaje.alcance) {
    return {
      _id: `anuncio-${mensaje._id}`,
      leido: esTutor ? Boolean(mensaje.visto) : true,
      iconClass: "anuncio",
      icono: faBullhorn,
      actor: mensaje.autor?.nombre || "Profesor",
      descripcion: mensaje.titulo || mensaje.mensaje,
      detalle:
        mensaje.alcance === "grupo"
          ? mensaje.grupo?.nombre || mensaje.grupoNombre || "Grupo"
          : mensaje.alcance === "tutores"
            ? "Tutores seleccionados"
            : "Todos los tutores",
      createdAt: mensaje.createdAt,
    };
  }

  return {
    _id: `mensaje-${mensaje._id}`,
    leido: Boolean(mensaje.leido),
    iconClass: mensaje.tipo === "inasistencia" ? "info" : "salida",
    icono: mensaje.tipo === "inasistencia" ? faBell : faSignOutAlt,
    actor: esTutor
      ? mensaje.destinatario?.nombre || "Profesor"
      : mensaje.remitente?.nombre || "Tutor",
    descripcion: mensaje.mensaje,
    detalle: mensaje.alumno?.nombre || "Sin alumno",
    createdAt: mensaje.createdAt,
  };
};

const obtenerIdAlumno = (alumno) => {
  if (!alumno) {
    return null;
  }

  if (typeof alumno === "string") {
    return alumno;
  }

  if (typeof alumno._id === "string") {
    return alumno._id;
  }

  if (typeof alumno.toString === "function") {
    return alumno.toString();
  }

  return null;
};

const crearClaveFechaLocal = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

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

const obtenerFechasSemanaLaboral = (fechaBase = new Date()) => {
  const referencia = new Date(fechaBase);
  referencia.setHours(0, 0, 0, 0);

  const diaSemana = referencia.getDay();
  const ajusteLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(referencia);
  lunes.setDate(referencia.getDate() + ajusteLunes);

  return Array.from({ length: 5 }, (_, indice) => {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + indice);
    return fecha;
  });
};

const convertirHoraAMinutos = (horaTexto) => {
  const [horas, minutos] = horaTexto.split(":").map(Number);
  if (Number.isNaN(horas) || Number.isNaN(minutos)) {
    return null;
  }

  return horas * 60 + minutos;
};

const normalizarHorario = (horario = "") =>
  String(horario)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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

const construirResumenSemanal = (
  registros,
  grupos,
  alumnoIdsPermitidos = [],
  fechasResumen = obtenerFechasSemanaLaboral(),
) => {
  const idsPermitidos = alumnoIdsPermitidos.length
    ? new Set(alumnoIdsPermitidos.map((id) => id.toString()))
    : null;
  const configuracionPorAlumno = new Map();

  grupos.forEach((grupo) => {
    const configuracionHorario = obtenerConfiguracionHorario(grupo.horario);

    (grupo.alumnos || []).forEach((alumno) => {
      const alumnoId = obtenerIdAlumno(alumno);
      if (!alumnoId) {
        return;
      }

      if (idsPermitidos && !idsPermitidos.has(alumnoId)) {
        return;
      }

      if (!configuracionPorAlumno.has(alumnoId)) {
        configuracionPorAlumno.set(alumnoId, configuracionHorario);
      }
    });
  });

  const primerasEntradasPorDia = new Map();

  registros.forEach((registro) => {
    if (registro.tipo !== "entrada") {
      return;
    }

    const alumnoId = registro.alumnoId?.toString?.() || null;
    if (!alumnoId || !configuracionPorAlumno.has(alumnoId)) {
      return;
    }

    const fechaRegistro = new Date(registro.fechaHora);
    if (Number.isNaN(fechaRegistro.getTime())) {
      return;
    }

    const claveFecha = crearClaveFechaLocal(fechaRegistro);
    if (!primerasEntradasPorDia.has(claveFecha)) {
      primerasEntradasPorDia.set(claveFecha, new Map());
    }

    const entradasDia = primerasEntradasPorDia.get(claveFecha);
    const entradaActual = entradasDia.get(alumnoId);

    if (!entradaActual || fechaRegistro < entradaActual) {
      entradasDia.set(alumnoId, fechaRegistro);
    }
  });

  return fechasResumen.map((fechaBase) => {
    const fecha = new Date(fechaBase);
    fecha.setHours(0, 0, 0, 0);

    const claveFecha = crearClaveFechaLocal(fecha);
    const diaSemana = fecha.getDay();
    const entradasDia = primerasEntradasPorDia.get(claveFecha) || new Map();
    let alumnosEsperados = 0;
    let entradas = 0;
    let tardanzas = 0;
    let entradasEvaluables = 0;

    configuracionPorAlumno.forEach((configuracion, alumnoId) => {
      if (!configuracion.diasProgramados.has(diaSemana)) {
        return;
      }

      alumnosEsperados += 1;

      const primeraEntrada = entradasDia.get(alumnoId);
      if (!primeraEntrada) {
        return;
      }

      entradas += 1;

      if (configuracion.minutosEntrada === null) {
        return;
      }

      entradasEvaluables += 1;
      const minutosRegistro =
        primeraEntrada.getHours() * 60 + primeraEntrada.getMinutes();

      if (minutosRegistro > configuracion.minutosEntrada + 10) {
        tardanzas += 1;
      }
    });

    return {
      fecha: claveFecha,
      etiqueta: DIAS_SEMANA_CORTOS[diaSemana],
      entradas,
      inasistencias: Math.max(alumnosEsperados - entradas, 0),
      tardanzas,
      alumnosEsperados,
      entradasEvaluables,
    };
  });
};

const Overview = ({ onCambiarSeccion, onVerGrupo, onVerPerfil }) => {
  const { user, token, mensajesNoLeidos } = useAuth();
  const esProfesor = user?.tipo === "profesor";
  const esAdmin = user?.tipo === "profesor" && user?.esAdmin;
  const esTutor = user?.tipo === "tutor";

  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    totalGrupos: 0,
    totalProfesores: 0,
    entradasHoy: 0,
    salidasHoy: 0,
    alumnosPendientes: 0,
  });
  const [registrosRecientes, setRegistrosRecientes] = useState([]);
  const [registrosSemana, setRegistrosSemana] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [mensajesRecientes, setMensajesRecientes] = useState([]);
  const [notificacionesExpandidas, setNotificacionesExpandidas] =
    useState(false);
  const [ultimoRegistroHijos, setUltimoRegistroHijos] = useState(null);
  const alumnosTutorIds = (user?.alumnos || [])
    .map((alumno) => obtenerIdAlumno(alumno))
    .filter(Boolean);
  const alumnosTutorIdsSet = new Set(alumnosTutorIds);
  const alumnoIdsVisiblesLista = esAdmin
    ? []
    : esTutor
      ? alumnosTutorIds
      : grupos.flatMap((grupo) =>
          (grupo.alumnos || [])
            .map((alumno) => obtenerIdAlumno(alumno))
            .filter(Boolean),
        );
  const alumnoIdsVisiblesClave = esAdmin
    ? "admin"
    : alumnoIdsVisiblesLista.join("|");
  const gruposAnaliticos = esTutor
    ? grupos.filter((grupo) =>
        (grupo.alumnos || []).some((alumno) =>
          alumnosTutorIdsSet.has(obtenerIdAlumno(alumno)),
        ),
      )
    : grupos;
  const fechasSemanaLaboral = obtenerFechasSemanaLaboral();
  const resumenSemanal = construirResumenSemanal(
    registrosSemana,
    gruposAnaliticos,
    esTutor ? alumnosTutorIds : [],
    fechasSemanaLaboral,
  );
  const fechasSemanaLaboralSet = new Set(
    fechasSemanaLaboral.map((fecha) => crearClaveFechaLocal(fecha)),
  );
  const fechaHoy = new Date();
  fechaHoy.setHours(0, 0, 0, 0);
  const resumenHoy =
    construirResumenSemanal(
      registrosSemana,
      gruposAnaliticos,
      esTutor ? alumnosTutorIds : [],
      [fechaHoy],
    )[0] || RESUMEN_VACIO;
  const maximoGrafica = Math.max(
    1,
    ...resumenSemanal.map((dia) => Math.max(dia.entradas, dia.inasistencias)),
  );
  const porcentajeInasistencias =
    resumenHoy.alumnosEsperados > 0
      ? Math.round(
          (resumenHoy.inasistencias / resumenHoy.alumnosEsperados) * 100,
        )
      : null;
  const porcentajeTardanzas =
    resumenHoy.entradasEvaluables > 0
      ? Math.round((resumenHoy.tardanzas / resumenHoy.entradasEvaluables) * 100)
      : null;

  useEffect(() => {
    cargarRegistrosAsistencia();
    cargarResumenSemanal();
    cargarMensajesRecientes();
    cargarGrupos();
    if (esAdmin) {
      cargarDatosAdmin();
    }
  }, []);

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(config.socketUrl);
    const alumnoIdsVisibles = esAdmin ? null : new Set(alumnoIdsVisiblesLista);

    socket.on("connect", () => {
      console.log("[Socket] Dashboard conectado en tiempo real");
    });

    socket.on("nueva-asistencia", (asistencia) => {
      if (
        alumnoIdsVisibles &&
        (!asistencia.alumnoId || !alumnoIdsVisibles.has(asistencia.alumnoId))
      ) {
        return;
      }

      console.log("[Socket] Nueva asistencia en dashboard:", asistencia);
      setRegistrosRecientes((prev) => {
        const siguientes = prev.filter(
          (registro) => registro._id !== asistencia._id,
        );
        return [asistencia, ...siguientes].slice(0, 8);
      });

      const fechaRegistro = new Date(asistencia.fechaHora);
      const fechasSemanaLaboralSet = new Set(
        obtenerFechasSemanaLaboral().map((fecha) =>
          crearClaveFechaLocal(fecha),
        ),
      );

      if (
        !Number.isNaN(fechaRegistro.getTime()) &&
        fechasSemanaLaboralSet.has(crearClaveFechaLocal(fechaRegistro))
      ) {
        setRegistrosSemana((prev) => {
          const siguientes = prev.filter(
            (registro) => registro._id !== asistencia._id,
          );
          return [asistencia, ...siguientes];
        });
      }

      const hoy = new Date().toISOString().split("T")[0];
      const fechaAsistencia = fechaRegistro.toISOString().split("T")[0];

      if (fechaAsistencia === hoy) {
        setEstadisticas((prev) => ({
          ...prev,
          entradasHoy:
            asistencia.tipo === "entrada"
              ? prev.entradasHoy + 1
              : prev.entradasHoy,
          salidasHoy:
            asistencia.tipo === "salida"
              ? prev.salidasHoy + 1
              : prev.salidasHoy,
        }));
      }

      if (esTutor) {
        setUltimoRegistroHijos(asistencia);
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Dashboard desconectado");
    });

    return () => {
      socket.disconnect();
    };
  }, [alumnoIdsVisiblesClave, esAdmin]);

  const cargarDatosAdmin = async () => {
    try {
      const [profRes, tutorRes] = await Promise.all([
        apiGet("profesores", token),
        apiGet("tutores", token),
      ]);
      setEstadisticas((prev) => ({
        ...prev,
        totalProfesores: profRes.ok ? profRes.data.length : 0,
      }));
    } catch (error) {
      console.error("Error al cargar datos admin:", error);
    }
  };

  const cargarGrupos = async () => {
    try {
      const datos = await apiGet("grupos", token);
      if (datos.ok) {
        setGrupos(datos.data);
        if (esProfesor) {
          const totalAlumnos = datos.data.reduce(
            (sum, g) => sum + (g.alumnos?.length || 0),
            0,
          );
          setEstadisticas((prev) => ({
            ...prev,
            totalAlumnos,
            totalGrupos: datos.data.length,
          }));
        }
      }
    } catch (error) {
      console.error("Error al cargar grupos:", error);
    }
  };

  const cargarMensajesRecientes = async () => {
    try {
      const [datosMensajes, datosAnuncios] = await Promise.all([
        apiGet("mensajes", token),
        apiGet("anuncios", token),
      ]);

      const feed = [
        ...(datosMensajes?.ok ? datosMensajes.data : []),
        ...(datosAnuncios?.ok ? datosAnuncios.data : []),
      ]
        .map((mensaje) => normalizarMensajeReciente(mensaje, esTutor))
        .filter((mensaje) => esMensajeDentroDeVentana(mensaje.createdAt))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      setMensajesRecientes(feed);
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

  const cargarResumenSemanal = async () => {
    try {
      const respuestas = await Promise.all(
        obtenerFechasSemanaLaboral().map((fecha) => {
          return apiGet(
            `asistencias?fecha=${crearClaveFechaLocal(fecha)}`,
            token,
          );
        }),
      );

      setRegistrosSemana(
        respuestas.flatMap((respuesta) => (respuesta.ok ? respuesta.data : [])),
      );
    } catch (error) {
      console.error("Error al cargar el resumen semanal:", error);
    }
  };

  const cargarRegistrosAsistencia = async () => {
    try {
      const datos = await apiGet("asistencias", token);

      if (datos.ok) {
        const registros = datos.data;
        const hoy = new Date().toISOString().split("T")[0];
        const registrosHoy = registros.filter((registro) => {
          const fechaRegistro = new Date(registro.fechaHora)
            .toISOString()
            .split("T")[0];
          return fechaRegistro === hoy;
        });

        const entradasHoy = registrosHoy.filter(
          (r) => r.tipo === "entrada",
        ).length;
        const salidasHoy = registrosHoy.filter(
          (r) => r.tipo === "salida",
        ).length;

        setEstadisticas((prev) => ({
          ...prev,
          entradasHoy,
          salidasHoy,
        }));

        setRegistrosRecientes(registros.slice(0, 8));

        // Para tutores: encontrar el último registro de sus hijos
        if (esTutor && registros.length > 0) {
          setUltimoRegistroHijos(registros[0]);
        }
      }
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    }
  };

  const formatearFechaHora = (cadenaFecha) => {
    const fecha = new Date(cadenaFecha);
    return {
      fecha: fecha.toLocaleDateString("es-MX"),
      hora: fecha.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatearTiempoRelativo = (fecha) => {
    const ahora = new Date();
    const diff = ahora - new Date(fecha);
    const minutos = Math.floor(diff / 60000);
    if (minutos < 1) return "Ahora";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `${horas}h`;
    return `${Math.floor(horas / 24)}d`;
  };

  const navegarASeccion = (seccion) => {
    if (onCambiarSeccion) {
      onCambiarSeccion(seccion);
    }
  };

  const manejarNavegacionTarjeta = (event, seccion) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navegarASeccion(seccion);
    }
  };

  const abrirPerfilAlumno = (alumnoId) => {
    if (alumnoId && onVerPerfil) {
      onVerPerfil(alumnoId);
    }
  };

  const abrirGrupo = (grupoId) => {
    if (grupoId && onVerGrupo) {
      onVerGrupo(grupoId);
    }
  };

  const manejarNavegacionPerfil = (event, alumnoId) => {
    if ((event.key === "Enter" || event.key === " ") && alumnoId) {
      event.preventDefault();
      abrirPerfilAlumno(alumnoId);
    }
  };

  const manejarNavegacionGrupo = (event, grupoId) => {
    if ((event.key === "Enter" || event.key === " ") && grupoId) {
      event.preventDefault();
      abrirGrupo(grupoId);
    }
  };

  const grupoPorAlumnoId = new Map();
  gruposAnaliticos.forEach((grupo) => {
    (grupo.alumnos || []).forEach((alumno) => {
      const alumnoId = obtenerIdAlumno(alumno);
      if (alumnoId && !grupoPorAlumnoId.has(alumnoId)) {
        grupoPorAlumnoId.set(alumnoId, grupo);
      }
    });
  });

  const primerasEntradasSemanaPorAlumno = new Map();
  const ultimoRegistroPorAlumno = new Map();
  [...registrosSemana, ...registrosRecientes].forEach((registro) => {
    const alumnoId = registro.alumnoId?.toString?.() || null;
    if (!alumnoId) {
      return;
    }

    const fechaRegistro = new Date(registro.fechaHora);
    if (Number.isNaN(fechaRegistro.getTime())) {
      return;
    }

    const ultimoRegistro = ultimoRegistroPorAlumno.get(alumnoId);
    if (!ultimoRegistro || fechaRegistro > ultimoRegistro.fecha) {
      ultimoRegistroPorAlumno.set(alumnoId, {
        fecha: fechaRegistro,
        registro,
      });
    }

    if (registro.tipo !== "entrada") {
      return;
    }

    const claveFecha = crearClaveFechaLocal(fechaRegistro);
    if (!fechasSemanaLaboralSet.has(claveFecha)) {
      return;
    }

    if (!primerasEntradasSemanaPorAlumno.has(alumnoId)) {
      primerasEntradasSemanaPorAlumno.set(alumnoId, new Map());
    }

    const entradasAlumno = primerasEntradasSemanaPorAlumno.get(alumnoId);
    const entradaActual = entradasAlumno.get(claveFecha);
    if (!entradaActual || fechaRegistro < entradaActual) {
      entradasAlumno.set(claveFecha, fechaRegistro);
    }
  });

  const resumenesTutor = (user?.alumnos || [])
    .map((alumno) => {
      const alumnoId = obtenerIdAlumno(alumno);
      const grupo = grupoPorAlumnoId.get(alumnoId) || null;
      const configuracionHorario = grupo
        ? obtenerConfiguracionHorario(grupo.horario)
        : { diasProgramados: new Set(), minutosEntrada: null };
      const entradasAlumno =
        primerasEntradasSemanaPorAlumno.get(alumnoId) || new Map();
      const diasProgramados = fechasSemanaLaboral.filter((fecha) =>
        configuracionHorario.diasProgramados.has(fecha.getDay()),
      );
      const clavesProgramadas = new Set(
        diasProgramados.map((fecha) => crearClaveFechaLocal(fecha)),
      );
      const entradasSemana = Array.from(entradasAlumno.keys()).filter((clave) =>
        clavesProgramadas.has(clave),
      ).length;
      const inasistenciasSemana = Math.max(
        diasProgramados.length - entradasSemana,
        0,
      );
      const tardanzasSemana = diasProgramados.reduce((total, fecha) => {
        if (configuracionHorario.minutosEntrada === null) {
          return total;
        }

        const entrada = entradasAlumno.get(crearClaveFechaLocal(fecha));
        if (!entrada) {
          return total;
        }

        const minutosRegistro = entrada.getHours() * 60 + entrada.getMinutes();
        return minutosRegistro > configuracionHorario.minutosEntrada + 10
          ? total + 1
          : total;
      }, 0);
      const asistenciaSemanal = diasProgramados.length
        ? Math.round((entradasSemana / diasProgramados.length) * 100)
        : null;
      const entradaHoy =
        entradasAlumno.get(crearClaveFechaLocal(fechaHoy)) || null;
      const esperadoHoy = configuracionHorario.diasProgramados.has(
        fechaHoy.getDay(),
      );
      const ultimoRegistro =
        ultimoRegistroPorAlumno.get(alumnoId)?.registro || null;

      let estadoHoy = "Sin grupo asignado";
      let tonoEstado = "neutral";

      if (grupo) {
        if (entradaHoy) {
          estadoHoy = `Entrada ${entradaHoy.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}`;
          tonoEstado = "success";
        } else if (esperadoHoy) {
          estadoHoy = "Sin entrada hoy";
          tonoEstado = "warning";
        } else {
          estadoHoy = "Sin clases hoy";
        }
      }

      return {
        alumnoId,
        nombre: obtenerNombreCompletoAlumno(alumno) || "Alumno",
        uidTarjeta: alumno.uidTarjeta || "Sin UID",
        grupoId: grupo?._id || null,
        grupoNombre: grupo?.nombre || "Grupo sin asignar",
        horarioGrupo: grupo?.horario || "Horario pendiente",
        asistenciaSemanal,
        entradasSemana,
        inasistenciasSemana,
        tardanzasSemana,
        entradaHoy,
        esperadoHoy,
        estadoHoy,
        tonoEstado,
        ultimoRegistro,
        tieneHorarioEntrada: configuracionHorario.minutosEntrada !== null,
        tieneProgramacionSemana: diasProgramados.length > 0,
      };
    })
    .sort((alumnoA, alumnoB) =>
      alumnoA.nombre.localeCompare(alumnoB.nombre, "es-MX", {
        sensitivity: "base",
      }),
    );
  const totalGruposTutor = new Set(
    resumenesTutor.map((alumno) => alumno.grupoId).filter(Boolean),
  ).size;
  const hijosConEntradaHoy = resumenesTutor.filter(
    (alumno) => alumno.entradaHoy,
  ).length;
  const hijosPendientesHoy = resumenesTutor.filter(
    (alumno) => alumno.esperadoHoy && !alumno.entradaHoy,
  ).length;
  const ultimoMovimientoTutor = resumenesTutor.reduce((ultimo, alumno) => {
    if (!alumno.ultimoRegistro) {
      return ultimo;
    }

    if (!ultimo) {
      return alumno;
    }

    return new Date(alumno.ultimoRegistro.fechaHora) >
      new Date(ultimo.ultimoRegistro.fechaHora)
      ? alumno
      : ultimo;
  }, null);

  const renderIndicadoresCard = () => (
    <div className="stat-card stat-card-indicators">
      <div className="stat-header">
        <div className="stat-icon icon-orange">
          <FontAwesomeIcon icon={faClock} />
        </div>
        <span className="stat-label">Indicadores de hoy</span>
      </div>

      <div className="stat-indicator-list">
        <div className="stat-indicator">
          <div className="stat-indicator-top">
            <span className="stat-indicator-label">Inasistencias</span>
            <span className="stat-indicator-value">
              {porcentajeInasistencias !== null
                ? `${porcentajeInasistencias}%`
                : "--"}
            </span>
          </div>
          <div className="stat-indicator-sub">
            {resumenHoy.alumnosEsperados > 0
              ? `${resumenHoy.inasistencias} de ${resumenHoy.alumnosEsperados} alumnos programados`
              : gruposAnaliticos.length > 0
                ? "Sin horario programado hoy"
                : "Configura grupos con horario"}
          </div>
        </div>

        <div className="stat-indicator">
          <div className="stat-indicator-top">
            <span className="stat-indicator-label">Entradas tardias</span>
            <span className="stat-indicator-value">
              {porcentajeTardanzas !== null ? `${porcentajeTardanzas}%` : "--"}
            </span>
          </div>
          <div className="stat-indicator-sub">
            {resumenHoy.entradasEvaluables > 0
              ? `${resumenHoy.tardanzas} de ${resumenHoy.entradasEvaluables} entradas evaluadas`
              : resumenHoy.entradas > 0
                ? "Falta la hora de entrada del grupo"
                : "Sin entradas evaluables hoy"}
          </div>
        </div>
      </div>
    </div>
  );

  // === CARDS PER ROLE ===

  const renderAdminCards = () => (
    <div className="stats-grid">
      <div
        className="stat-card stat-card-clickable"
        role="button"
        tabIndex={0}
        onClick={() => navegarASeccion("alumnos")}
        onKeyDown={(event) => manejarNavegacionTarjeta(event, "alumnos")}
        aria-label="Ir a alumnos"
      >
        <div className="stat-header">
          <div className="stat-icon icon-blue">
            <FontAwesomeIcon icon={faUserGraduate} />
          </div>
          <span className="stat-label">Total Alumnos</span>
        </div>
        <div className="stat-value">{estadisticas.totalAlumnos}</div>
        <div className="stat-sub">En {estadisticas.totalGrupos} grupos</div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon icon-green">
            <FontAwesomeIcon icon={faClipboardCheck} />
          </div>
          <span className="stat-label">Entradas Hoy</span>
        </div>
        <div className="stat-value">{estadisticas.entradasHoy}</div>
        <div className="stat-sub">
          {estadisticas.totalAlumnos > 0
            ? `${Math.round((estadisticas.entradasHoy / estadisticas.totalAlumnos) * 100)}% de asistencia`
            : "Sin alumnos"}
        </div>
      </div>

      {renderIndicadoresCard()}

      <div
        className="stat-card stat-card-clickable"
        role="button"
        tabIndex={0}
        onClick={() => navegarASeccion("profesores")}
        onKeyDown={(event) => manejarNavegacionTarjeta(event, "profesores")}
        aria-label="Ir a profesores"
      >
        <div className="stat-header">
          <div className="stat-icon icon-purple">
            <FontAwesomeIcon icon={faChalkboardTeacher} />
          </div>
          <span className="stat-label">Profesores</span>
        </div>
        <div className="stat-value">{estadisticas.totalProfesores}</div>
        <div className="stat-sub">
          {estadisticas.totalGrupos} grupos activos
        </div>
      </div>
    </div>
  );

  const renderProfesorCards = () => {
    const totalAlumnosProf = grupos.reduce(
      (sum, g) => sum + (g.alumnos?.length || 0),
      0,
    );
    return (
      <div className="stats-grid">
        <div
          className="stat-card stat-card-clickable"
          role="button"
          tabIndex={0}
          onClick={() => navegarASeccion("alumnos")}
          onKeyDown={(event) => manejarNavegacionTarjeta(event, "alumnos")}
          aria-label="Ir a alumnos"
        >
          <div className="stat-header">
            <div className="stat-icon icon-blue">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <span className="stat-label">Mis Alumnos</span>
          </div>
          <div className="stat-value">{totalAlumnosProf}</div>
          <div className="stat-sub">
            En {grupos.length} grupo{grupos.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-green">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <span className="stat-label">Entradas Hoy</span>
          </div>
          <div className="stat-value">{estadisticas.entradasHoy}</div>
          <div className="stat-sub">
            {totalAlumnosProf > 0
              ? `${Math.round((estadisticas.entradasHoy / totalAlumnosProf) * 100)}% asistencia`
              : "Sin alumnos"}
          </div>
        </div>

        {renderIndicadoresCard()}

        <div
          className="stat-card stat-card-clickable"
          role="button"
          tabIndex={0}
          onClick={() => navegarASeccion("grupos")}
          onKeyDown={(event) => manejarNavegacionTarjeta(event, "grupos")}
          aria-label="Ir a grupos"
        >
          <div className="stat-header">
            <div className="stat-icon icon-purple">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <span className="stat-label">Mis Grupos</span>
          </div>
          <div className="stat-value">{grupos.length}</div>
          <div className="stat-sub">{totalAlumnosProf} alumnos total</div>
        </div>
      </div>
    );
  };

  const renderTutorCards = () => {
    const numHijos = resumenesTutor.length;
    return (
      <div className="stats-grid stats-grid-tutor">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-blue">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <span className="stat-label">Mis Hijos</span>
          </div>
          <div className="stat-value">{numHijos}</div>
          <div className="stat-sub">Alumnos asociados</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-purple">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
            <span className="stat-label">Mis Grupos</span>
          </div>
          <div className="stat-value">{totalGruposTutor}</div>
          <div className="stat-sub">
            {totalGruposTutor > 0
              ? `${numHijos} alumno${numHijos !== 1 ? "s" : ""} vinculados`
              : "Sin grupos asignados"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-green">
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <span className="stat-label">Con Entrada Hoy</span>
          </div>
          <div className="stat-value">{hijosConEntradaHoy}</div>
          <div className="stat-sub">
            {hijosPendientesHoy > 0
              ? `${hijosPendientesHoy} pendiente${hijosPendientesHoy !== 1 ? "s" : ""}`
              : resumenesTutor.some((alumno) => alumno.esperadoHoy)
                ? "Todos al corriente"
                : "Sin clases hoy"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-purple">
              <FontAwesomeIcon icon={faClock} />
            </div>
            <span className="stat-label">Última Actividad</span>
          </div>
          <div className="stat-value stat-value-sm">
            {ultimoMovimientoTutor?.ultimoRegistro || ultimoRegistroHijos
              ? formatearTiempoRelativo(
                  ultimoMovimientoTutor?.ultimoRegistro?.fechaHora ||
                    ultimoRegistroHijos.fechaHora,
                )
              : "--"}
          </div>
          <div className="stat-sub">
            {ultimoMovimientoTutor?.ultimoRegistro || ultimoRegistroHijos
              ? `${
                  ultimoMovimientoTutor?.nombre || ultimoRegistroHijos.nombre
                } · ${
                  ultimoMovimientoTutor?.ultimoRegistro?.tipo ||
                  ultimoRegistroHijos.tipo
                }`
              : "Sin actividad reciente"}
          </div>
        </div>
      </div>
    );
  };

  const renderTutorResumenAlumnos = () => (
    <div className="section-container tutor-students-section">
      <div className="section-header">
        <h3>Resumen de mis hijos</h3>
        <span className="chart-caption">
          {totalGruposTutor > 0
            ? `${totalGruposTutor} grupo${totalGruposTutor !== 1 ? "s" : ""} vinculados`
            : "Sin grupos asignados"}
        </span>
      </div>

      {resumenesTutor.length === 0 ? (
        <div className="weekly-chart-empty">
          No hay alumnos asociados a esta cuenta.
        </div>
      ) : (
        <div className="tutor-student-grid">
          {resumenesTutor.map((alumno) => (
            <div
              key={alumno.alumnoId}
              className="tutor-student-card"
              onClick={() => abrirPerfilAlumno(alumno.alumnoId)}
              onKeyDown={(event) =>
                manejarNavegacionPerfil(event, alumno.alumnoId)
              }
              role="button"
              tabIndex={0}
              aria-label={`Ver perfil de ${alumno.nombre}`}
            >
              <div className="tutor-student-header">
                <div>
                  <h4>{alumno.nombre}</h4>
                  <p className="tutor-student-group">{alumno.grupoNombre}</p>
                </div>
                <span className={`tutor-status-pill ${alumno.tonoEstado}`}>
                  {alumno.estadoHoy}
                </span>
              </div>

              <div className="tutor-student-meta">
                <span>
                  <FontAwesomeIcon icon={faIdCard} /> {alumno.uidTarjeta}
                </span>
                <span>{alumno.horarioGrupo}</span>
              </div>

              <div className="tutor-student-stats">
                <div className="tutor-student-stat">
                  <span className="tutor-student-stat-value">
                    {alumno.tieneProgramacionSemana &&
                    alumno.asistenciaSemanal !== null
                      ? `${alumno.asistenciaSemanal}%`
                      : "--"}
                  </span>
                  <span className="tutor-student-stat-label">
                    Asistencia semanal
                  </span>
                </div>

                <div className="tutor-student-stat">
                  <span className="tutor-student-stat-value">
                    {alumno.tieneProgramacionSemana
                      ? alumno.inasistenciasSemana
                      : "--"}
                  </span>
                  <span className="tutor-student-stat-label">
                    Inasistencias
                  </span>
                </div>

                <div className="tutor-student-stat">
                  <span className="tutor-student-stat-value">
                    {alumno.tieneProgramacionSemana &&
                    alumno.tieneHorarioEntrada
                      ? alumno.tardanzasSemana
                      : "--"}
                  </span>
                  <span className="tutor-student-stat-label">Tardanzas</span>
                </div>
              </div>

              <div className="tutor-student-footer">
                <span className="tutor-student-activity">
                  {alumno.ultimoRegistro
                    ? `${alumno.ultimoRegistro.tipo} · ${formatearTiempoRelativo(alumno.ultimoRegistro.fechaHora)}`
                    : "Sin actividad reciente"}
                </span>
                <span className="ver-perfil-link">Ver perfil →</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="overview">
      <div className="overview-layout">
        <div className="overview-main">
          <div className="welcome-message">
            <h2>Hola, {user?.nombre || "Bienvenido"}</h2>
            {esTutor && (
              <p className="assign-hint">
                Información de tus alumnos asociados
              </p>
            )}
          </div>

          {/* Tarjetas específicas por rol */}
          {esAdmin
            ? renderAdminCards()
            : esProfesor
              ? renderProfesorCards()
              : esTutor
                ? renderTutorCards()
                : null}

          {!esTutor && (
            <div className="section-container weekly-chart-section">
              <div className="section-header">
                <h3>Actividad Semanal</h3>
                <span className="chart-caption">
                  Entradas vs inasistencias de lunes a viernes
                </span>
              </div>

              {gruposAnaliticos.length === 0 ? (
                <div className="weekly-chart-empty">
                  Configura grupos con horario para ver inasistencias y
                  tardanzas.
                </div>
              ) : (
                <>
                  <div className="weekly-chart-scroll">
                    <div
                      className="weekly-chart"
                      role="img"
                      aria-label="Grafica semanal de entradas e inasistencias"
                    >
                      {resumenSemanal.map((dia) => (
                        <div key={dia.fecha} className="weekly-chart-column">
                          <div className="weekly-chart-bars">
                            <div
                              className="weekly-bar weekly-bar-entradas"
                              style={{
                                height:
                                  dia.entradas > 0
                                    ? `${Math.max((dia.entradas / maximoGrafica) * 100, 12)}%`
                                    : "0%",
                              }}
                              title={`${dia.etiqueta}: ${dia.entradas} entradas`}
                            >
                              <span className="weekly-bar-value">
                                {dia.entradas}
                              </span>
                            </div>
                            <div
                              className="weekly-bar weekly-bar-inasistencias"
                              style={{
                                height:
                                  dia.inasistencias > 0
                                    ? `${Math.max((dia.inasistencias / maximoGrafica) * 100, 12)}%`
                                    : "0%",
                              }}
                              title={`${dia.etiqueta}: ${dia.inasistencias} inasistencias`}
                            >
                              <span className="weekly-bar-value">
                                {dia.inasistencias}
                              </span>
                            </div>
                          </div>
                          <span className="weekly-chart-label">
                            {dia.etiqueta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="weekly-chart-legend">
                    <span className="weekly-legend-item">
                      <span className="weekly-legend-swatch entradas" />
                      Entradas
                    </span>
                    <span className="weekly-legend-item">
                      <span className="weekly-legend-swatch inasistencias" />
                      Inasistencias
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tarjetas de Grupos - solo profesor/admin */}
          {esProfesor && grupos.length > 0 && (
            <div className="groups-section">
              <h3>Grupos</h3>
              <div className="groups-grid">
                {grupos.map((grupo) => (
                  <div
                    key={grupo._id}
                    className="group-card clickable"
                    onClick={() => abrirGrupo(grupo._id)}
                    onKeyDown={(event) =>
                      manejarNavegacionGrupo(event, grupo._id)
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver grupo ${grupo.nombre}`}
                  >
                    <div className="group-header">
                      <h4>{grupo.nombre}</h4>
                    </div>
                    <p className="group-profesor">
                      Profesor: {grupo.profesor?.nombre || "Sin asignar"}
                    </p>
                    <div className="group-stats">
                      <div className="group-stat">
                        <span className="stat-number">
                          {grupo.alumnos?.length || 0}
                        </span>
                        <span className="stat-label">Alumnos</span>
                      </div>
                    </div>
                    <span className="ver-perfil-link">Ver grupo →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info de alumnos del tutor */}
          {esTutor && renderTutorResumenAlumnos()}

          {/* Registros Recientes */}
          {!esTutor && (
            <div className="section-container">
              <div className="section-header">
                <h3>Registros Recientes</h3>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosRecientes.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="loading">
                          No hay registros disponibles
                        </td>
                      </tr>
                    ) : (
                      registrosRecientes.map((registro, indice) => {
                        const { fecha, hora } = formatearFechaHora(
                          registro.fechaHora,
                        );
                        const tienePerfil = Boolean(registro.alumnoId);
                        return (
                          <tr
                            key={indice}
                            className={tienePerfil ? "data-row-clickable" : ""}
                            onClick={
                              tienePerfil
                                ? () => abrirPerfilAlumno(registro.alumnoId)
                                : undefined
                            }
                            onKeyDown={
                              tienePerfil
                                ? (event) =>
                                    manejarNavegacionPerfil(
                                      event,
                                      registro.alumnoId,
                                    )
                                : undefined
                            }
                            role={tienePerfil ? "button" : undefined}
                            tabIndex={tienePerfil ? 0 : undefined}
                            aria-label={
                              tienePerfil
                                ? `Ver perfil de ${registro.nombre || registro.uidTarjeta}`
                                : undefined
                            }
                          >
                            <td data-label="Alumno">
                              <strong>
                                {registro.nombre || registro.uidTarjeta}
                              </strong>
                            </td>
                            <td data-label="Tipo">
                              <span className={`badge badge-${registro.tipo}`}>
                                {registro.tipo}
                              </span>
                            </td>
                            <td data-label="Fecha">{fecha}</td>
                            <td data-label="Hora">{hora}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Panel de Mensajes Recientes */}
        <aside
          className={`notifications-panel ${notificacionesExpandidas ? "expanded" : ""}`}
        >
          <div
            className="notifications-header"
            onClick={() =>
              setNotificacionesExpandidas(!notificacionesExpandidas)
            }
          >
            <h3>
              <FontAwesomeIcon icon={faEnvelope} /> Mensajes
            </h3>
            <div className="notifications-header-actions">
              {mensajesNoLeidos > 0 && (
                <span className="unread-count">{mensajesNoLeidos}</span>
              )}
              <button className="toggle-notifications">
                <FontAwesomeIcon
                  icon={notificacionesExpandidas ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
          </div>
          <div className="notifications-list">
            {mensajesRecientes.length === 0 ? (
              <div className="notification-item read">
                <div className="notif-content">
                  <p>No hay mensajes recientes</p>
                </div>
              </div>
            ) : (
              mensajesRecientes.map((msg) => (
                <div
                  key={msg._id}
                  className={`notification-item ${msg.leido ? "read" : ""}`}
                >
                  <div className={`notif-icon ${msg.iconClass}`}>
                    <FontAwesomeIcon icon={msg.icono} />
                  </div>
                  <div className="notif-content">
                    <p>
                      <strong>{msg.actor}:</strong> {msg.descripcion}
                    </p>
                    <span className="notif-time">
                      {msg.detalle} · {formatearTiempoRelativo(msg.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Overview;
