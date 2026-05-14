import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBullhorn,
  faCalendarAlt,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faClock,
  faEnvelope,
  faEnvelopeOpen,
  faPaperPlane,
  faTimesCircle,
  faTrash,
  faUserGraduate,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import config, {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import { obtenerNombreCompletoAlumno } from "../utils/alumnoNombre";
import "./Mensajes.css";

const LIMITE_DIAS_MENSAJES = 15;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

const crearFormularioInicial = (alumnoId = "") => ({
  alumnoId,
  tipo: "inasistencia",
  mensaje: "",
  fecha: new Date().toISOString().split("T")[0],
});

const ANUNCIO_INICIAL = {
  titulo: "",
  mensaje: "",
  alcance: "grupo",
  grupoId: "",
  tutorIds: [],
};

const opcionesTipoMensaje = [
  {
    value: "inasistencia",
    label: "Inasistencia",
    description: "Avisa que el alumno no asistirá en la fecha indicada.",
    icon: faCalendarAlt,
  },
  {
    value: "salida_temprana",
    label: "Salida temprana",
    description: "Indica que el alumno saldrá antes del horario habitual.",
    icon: faClock,
  },
];

const filtrarTutoresPermitidos = (
  tutores = [],
  grupos = [],
  esAdmin = false,
) => {
  const tutoresActivos = tutores.filter((tutor) => tutor.activo !== false);

  if (esAdmin) {
    return tutoresActivos;
  }

  const alumnoIdsPermitidos = new Set(
    grupos.flatMap((grupo) =>
      (grupo.alumnos || []).map((alumno) => String(alumno?._id || alumno)),
    ),
  );

  return tutoresActivos.filter((tutor) =>
    (tutor.alumnos || []).some((alumno) =>
      alumnoIdsPermitidos.has(String(alumno?._id || alumno)),
    ),
  );
};

const obtenerTutorIdsPorGrupo = (grupoId, grupos = [], tutores = []) => {
  if (!grupoId) {
    return [];
  }

  const grupo = grupos.find((item) => item._id === grupoId);
  if (!grupo) {
    return [];
  }

  const alumnoIdsGrupo = new Set(
    (grupo.alumnos || []).map((alumno) => String(alumno?._id || alumno)),
  );

  return [
    ...new Set(
      tutores
        .filter((tutor) =>
          (tutor.alumnos || []).some((alumno) =>
            alumnoIdsGrupo.has(String(alumno?._id || alumno)),
          ),
        )
        .map((tutor) => tutor._id),
    ),
  ];
};

const obtenerVistaPrevia = (texto, longitud = 160) => {
  if (!texto) {
    return "";
  }

  return texto.length > longitud
    ? `${texto.slice(0, longitud).trim()}...`
    : texto;
};

const esItemReciente = (fechaValor, diasLimite = LIMITE_DIAS_MENSAJES) => {
  const fecha = new Date(fechaValor);

  if (Number.isNaN(fecha.getTime())) {
    return true;
  }

  return Date.now() - fecha.getTime() <= diasLimite * MILISEGUNDOS_POR_DIA;
};

const ordenarPorFechaDesc = (items = []) =>
  [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

const Mensajes = () => {
  const { user, token, setMensajesNoLeidos } = useAuth();
  const esTutor = user?.tipo === "tutor";
  const esProfesor = user?.tipo === "profesor";
  const esAdmin = esProfesor && user?.esAdmin;
  const alumnosTutor = user?.alumnos ?? [];

  const [mensajes, setMensajes] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [tutoresDisponibles, setTutoresDisponibles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tabActiva, setTabActiva] = useState("solicitudes");
  const [mostrarFormularioMensaje, setMostrarFormularioMensaje] =
    useState(false);
  const [mostrarFormularioAnuncio, setMostrarFormularioAnuncio] =
    useState(false);
  const [formData, setFormData] = useState(() => crearFormularioInicial());
  const [anuncioFormData, setAnuncioFormData] = useState(ANUNCIO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [enviandoAnuncio, setEnviandoAnuncio] = useState(false);
  const [respondiendo, setRespondiendo] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [eliminando, setEliminando] = useState(null);
  const [anunciosAbiertos, setAnunciosAbiertos] = useState({});
  const [marcandoAnuncio, setMarcandoAnuncio] = useState(null);
  const [anuncioTutorActivo, setAnuncioTutorActivo] = useState(null);

  const alumnoPredeterminadoId = alumnosTutor[0]?._id ?? "";
  const alumnoSeleccionado = alumnosTutor.find(
    (alumno) => alumno._id === formData.alumnoId,
  );

  useEffect(() => {
    setTabActiva(esTutor ? "anuncios" : "solicitudes");
  }, [esTutor]);

  useEffect(() => {
    if (
      !esTutor ||
      !mostrarFormularioMensaje ||
      formData.alumnoId ||
      !alumnoPredeterminadoId
    ) {
      return;
    }

    setFormData((prev) => ({ ...prev, alumnoId: alumnoPredeterminadoId }));
  }, [
    alumnoPredeterminadoId,
    esTutor,
    formData.alumnoId,
    mostrarFormularioMensaje,
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);

      try {
        const [datosMensajes, datosAnuncios, datosGrupos, datosTutores] =
          await Promise.all([
            apiGet("mensajes", token),
            apiGet("anuncios", token),
            esProfesor ? apiGet("grupos", token) : Promise.resolve(null),
            esProfesor ? apiGet("tutores", token) : Promise.resolve(null),
          ]);

        if (datosMensajes?.ok) {
          setMensajes(ordenarPorFechaDesc(datosMensajes.data || []));
        }

        if (datosAnuncios?.ok) {
          setAnuncios(ordenarPorFechaDesc(datosAnuncios.data || []));
        }

        if (esProfesor) {
          const gruposCargados = datosGrupos?.ok ? datosGrupos.data || [] : [];
          const tutoresCargados = datosTutores?.ok
            ? datosTutores.data || []
            : [];

          setGrupos(gruposCargados);
          setTutoresDisponibles(
            filtrarTutoresPermitidos(tutoresCargados, gruposCargados, esAdmin),
          );
        } else {
          setGrupos([]);
          setTutoresDisponibles([]);
        }
      } catch (error) {
        console.error("Error al cargar mensajes y anuncios:", error);
      }

      setCargando(false);
    };

    cargarDatos();
  }, [esAdmin, esProfesor, token]);

  useEffect(() => {
    if (!esProfesor) {
      return undefined;
    }

    const socket = io(config.socketUrl);

    socket.on("anuncio-visto", ({ anuncio }) => {
      if (!anuncio?._id) {
        return;
      }

      setAnuncios((prev) => {
        let actualizado = false;
        const siguientes = prev.map((item) => {
          if (item._id !== anuncio._id) {
            return item;
          }

          actualizado = true;
          return { ...item, ...anuncio };
        });

        return actualizado ? siguientes : prev;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [esProfesor]);

  const cambiarTab = (tab) => {
    setTabActiva(tab);
    setMostrarFormularioMensaje(false);
    setMostrarFormularioAnuncio(false);
    setRespondiendo(null);
    setRespuestaTexto("");
    setEliminando(null);
    setAnunciosAbiertos({});
    setAnuncioTutorActivo(null);
  };

  const limpiarFormularioMensaje = () => {
    setFormData(crearFormularioInicial(alumnoPredeterminadoId));
    setMostrarFormularioMensaje(false);
  };

  const limpiarFormularioAnuncio = () => {
    setAnuncioFormData(ANUNCIO_INICIAL);
    setMostrarFormularioAnuncio(false);
  };

  const cerrarAnuncioTutor = () => {
    setAnuncioTutorActivo(null);
  };

  const actualizarAlcanceAnuncio = (alcance) => {
    setAnuncioFormData((prev) => ({
      ...prev,
      alcance,
      grupoId: "",
      tutorIds: [],
    }));
  };

  const alternarTutorSeleccionado = (tutorId) => {
    setAnuncioFormData((prev) => ({
      ...prev,
      tutorIds: prev.tutorIds.includes(tutorId)
        ? prev.tutorIds.filter((id) => id !== tutorId)
        : [...prev.tutorIds, tutorId],
    }));
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case "aprobado":
        return {
          icon: faCheckCircle,
          label: "Aprobado",
          className: "estado-aprobado",
        };
      case "rechazado":
        return {
          icon: faTimesCircle,
          label: "Rechazado",
          className: "estado-rechazado",
        };
      default:
        return {
          icon: faClock,
          label: "Pendiente",
          className: "estado-pendiente",
        };
    }
  };

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatearFechaHora = (fecha) =>
    new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatearAlcance = (anuncio) => {
    if (anuncio.alcance === "grupo") {
      return anuncio.grupo?.nombre || anuncio.grupoNombre || "Grupo";
    }

    if (anuncio.alcance === "tutores") {
      return "Tutores seleccionados";
    }

    return "Todos los tutores";
  };

  const obtenerPendientesAnuncio = (anuncio) => {
    const vistosIds = new Set(
      (anuncio.vistoPor || []).map((vista) =>
        String(vista.tutor?._id || vista.tutor),
      ),
    );

    return (anuncio.destinatarios || []).filter(
      (destinatario) =>
        !vistosIds.has(String(destinatario?._id || destinatario)),
    );
  };

  const obtenerCantidadDestinatarios = () => {
    if (anuncioFormData.alcance === "grupo") {
      return obtenerTutorIdsPorGrupo(
        anuncioFormData.grupoId,
        grupos,
        tutoresDisponibles,
      ).length;
    }

    if (anuncioFormData.alcance === "tutores") {
      return anuncioFormData.tutorIds.length;
    }

    return tutoresDisponibles.length;
  };

  const enviarMensaje = async (event) => {
    event.preventDefault();

    if (!formData.alumnoId || !formData.mensaje.trim()) {
      alert("Selecciona un alumno y escribe los detalles");
      return;
    }

    setEnviando(true);
    try {
      const datos = await apiPost(
        "mensajes",
        { ...formData, mensaje: formData.mensaje.trim() },
        token,
      );

      if (datos.ok) {
        const datosMensajes = await apiGet("mensajes", token);
        if (datosMensajes?.ok) {
          setMensajes(ordenarPorFechaDesc(datosMensajes.data || []));
        }
        limpiarFormularioMensaje();
      } else {
        alert(datos.error?.mensaje || "Error al enviar mensaje");
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar mensaje");
    }
    setEnviando(false);
  };

  const responderMensaje = async (id, estado) => {
    try {
      const datos = await apiPut(
        `mensajes/${id}/responder`,
        {
          estado,
          respuesta: respuestaTexto || undefined,
        },
        token,
      );

      if (datos.ok) {
        setMensajes((prev) =>
          prev.map((mensaje) => (mensaje._id === id ? datos.data : mensaje)),
        );
        setMensajesNoLeidos((prev) => Math.max(0, prev - 1));
        setRespondiendo(null);
        setRespuestaTexto("");
      }
    } catch (error) {
      console.error("Error al responder mensaje:", error);
    }
  };

  const eliminarMensaje = async (id) => {
    try {
      const datos = await apiDelete(`mensajes/${id}`, token);

      if (datos.ok) {
        setMensajes((prev) => prev.filter((mensaje) => mensaje._id !== id));
      } else {
        alert(datos.error?.mensaje || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error al eliminar mensaje:", error);
    }

    setEliminando(null);
  };

  const enviarAnuncio = async (event) => {
    event.preventDefault();

    if (!anuncioFormData.titulo.trim() || !anuncioFormData.mensaje.trim()) {
      alert("Escribe un titulo y el contenido del anuncio");
      return;
    }

    if (
      anuncioFormData.alcance === "grupo" &&
      !anuncioFormData.grupoId
    ) {
      alert("Selecciona un grupo destinatario");
      return;
    }

    if (
      anuncioFormData.alcance === "tutores" &&
      anuncioFormData.tutorIds.length === 0
    ) {
      alert("Selecciona al menos un tutor");
      return;
    }

    setEnviandoAnuncio(true);
    try {
      const payload = {
        titulo: anuncioFormData.titulo.trim(),
        mensaje: anuncioFormData.mensaje.trim(),
        alcance: anuncioFormData.alcance,
        grupoId:
          anuncioFormData.alcance === "grupo"
            ? anuncioFormData.grupoId
            : undefined,
        tutorIds:
          anuncioFormData.alcance === "tutores"
            ? anuncioFormData.tutorIds
            : undefined,
      };

      const datos = await apiPost("anuncios", payload, token);

      if (datos.ok) {
        setAnuncios((prev) =>
          ordenarPorFechaDesc([
            datos.data,
            ...prev.filter((anuncio) => anuncio._id !== datos.data._id),
          ]),
        );
        limpiarFormularioAnuncio();
      } else {
        alert(datos.error?.mensaje || "Error al enviar anuncio");
      }
    } catch (error) {
      console.error("Error al enviar anuncio:", error);
      alert("Error al enviar anuncio");
    }
    setEnviandoAnuncio(false);
  };

  const alternarAnuncio = (anuncio) => {
    setAnunciosAbiertos((prev) => ({
      ...prev,
      [anuncio._id]: !prev[anuncio._id],
    }));
  };

  const abrirAnuncioTutor = async (anuncio) => {
    if (marcandoAnuncio === anuncio._id) {
      return;
    }

    let anuncioActualizado = anuncio;

    if (!anuncio.visto) {
      setMarcandoAnuncio(anuncio._id);
      try {
        const datos = await apiPut(`anuncios/${anuncio._id}/ver`, {}, token);
        if (datos.ok) {
          anuncioActualizado = datos.data;
          setAnuncios((prev) =>
            prev.map((item) => (item._id === anuncio._id ? datos.data : item)),
          );
          setMensajesNoLeidos((prev) => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error("Error al registrar vista del anuncio:", error);
      }
      setMarcandoAnuncio(null);
    }

    setAnuncioTutorActivo(anuncioActualizado);
  };

  const renderSolicitud = (mensaje) => {
    const badge = getEstadoBadge(mensaje.estado);

    return (
      <div
        key={mensaje._id}
        className={`mensaje-card ${mensaje.leido ? "leido" : "no-leido"}`}
      >
        <div className="mensaje-icon">
          <FontAwesomeIcon icon={mensaje.leido ? faEnvelopeOpen : faEnvelope} />
        </div>
        <div className="mensaje-body">
          <div className="mensaje-meta">
            <span className={`mensaje-tipo ${mensaje.tipo}`}>
              {mensaje.tipo === "inasistencia"
                ? "Inasistencia"
                : "Salida Temprana"}
            </span>
            <span className={`mensaje-estado ${badge.className}`}>
              <FontAwesomeIcon icon={badge.icon} /> {badge.label}
            </span>
            <span className="mensaje-fecha">
              {formatearFechaHora(mensaje.createdAt)}
            </span>
          </div>

          <div className="mensaje-info">
            {esProfesor && (
              <span className="mensaje-remitente">
                De: <strong>{mensaje.remitente?.nombre || "Tutor"}</strong>
                {mensaje.remitente?.telefono
                  ? ` (${mensaje.remitente.telefono})`
                  : ""}
              </span>
            )}
            {esTutor && (
              <span className="mensaje-remitente">
                Para: <strong>{mensaje.destinatario?.nombre || "Profesor"}</strong>
              </span>
            )}
            <span className="mensaje-alumno">
              Alumno: <strong>{obtenerNombreCompletoAlumno(mensaje.alumno) || "N/A"}</strong>
            </span>
            <span className="mensaje-fecha-evento">
              <FontAwesomeIcon icon={faCalendarAlt} /> Fecha: {formatearFecha(mensaje.fecha)}
            </span>
          </div>

          <p className="mensaje-texto">{mensaje.mensaje}</p>

          {esTutor && mensaje.respuesta && (
            <div className="mensaje-respuesta">
              <strong>Respuesta del profesor:</strong> {mensaje.respuesta}
            </div>
          )}

          {esProfesor && mensaje.estado === "pendiente" && (
            <div className="mensaje-acciones">
              {respondiendo === mensaje._id ? (
                <div className="respuesta-form">
                  <input
                    type="text"
                    placeholder="Respuesta opcional..."
                    value={respuestaTexto}
                    onChange={(event) => setRespuestaTexto(event.target.value)}
                    maxLength={500}
                  />
                  <div className="respuesta-btns">
                    <button
                      type="button"
                      className="btn-aprobar"
                      onClick={() => responderMensaje(mensaje._id, "aprobado")}
                    >
                      <FontAwesomeIcon icon={faCheckCircle} /> Aprobar
                    </button>
                    <button
                      type="button"
                      className="btn-rechazar"
                      onClick={() => responderMensaje(mensaje._id, "rechazado")}
                    >
                      <FontAwesomeIcon icon={faTimesCircle} /> Rechazar
                    </button>
                    <button
                      type="button"
                      className="btn-cancel-sm"
                      onClick={() => {
                        setRespondiendo(null);
                        setRespuestaTexto("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-responder"
                  onClick={() => setRespondiendo(mensaje._id)}
                >
                  Responder
                </button>
              )}
            </div>
          )}

          {esProfesor && mensaje.estado !== "pendiente" && mensaje.respuesta && (
            <div className="mensaje-respuesta">
              <strong>Tu respuesta:</strong> {mensaje.respuesta}
            </div>
          )}

          {esProfesor && (
            <div className="mensaje-eliminar">
              {eliminando === mensaje._id ? (
                <div className="confirmar-eliminar">
                  <span>¿Eliminar este mensaje?</span>
                  <button
                    type="button"
                    className="btn-confirmar-eliminar"
                    onClick={() => eliminarMensaje(mensaje._id)}
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    className="btn-cancel-sm"
                    onClick={() => setEliminando(null)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-eliminar"
                  onClick={() => setEliminando(mensaje._id)}
                  title="Eliminar mensaje"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAnuncioTutor = (anuncio) => {
    return (
      <div
        key={anuncio._id}
        className={`mensaje-card anuncio-card ${anuncio.visto ? "leido" : "no-leido"}`}
      >
        <div className="mensaje-icon anuncio-icon">
          <FontAwesomeIcon icon={faBullhorn} />
        </div>
        <div className="mensaje-body">
          <div className="mensaje-meta anuncio-meta-simple">
            <span
              className={`mensaje-tipo ${
                anuncio.visto ? "anuncio-visto" : "anuncio-nuevo"
              }`}
            >
              {anuncio.visto ? "Visto" : "Nuevo anuncio"}
            </span>
          </div>

          <div className="anuncio-tutor-resumen">
            <span className="anuncio-tutor-remitente">
              De: <strong>{anuncio.autor?.nombre || "Profesor"}</strong>
            </span>
            <h3 className="anuncio-titulo anuncio-tutor-titulo">
              {anuncio.titulo}
            </h3>
          </div>

          <div className="anuncio-footer anuncio-footer-tutor">
            <button
              type="button"
              className="btn-expandir-anuncio"
              onClick={() => abrirAnuncioTutor(anuncio)}
              disabled={marcandoAnuncio === anuncio._id}
            >
              <span>
                {marcandoAnuncio === anuncio._id ? "Abriendo..." : "Abrir anuncio"}
              </span>
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnuncioProfesor = (anuncio) => {
    const abierto = Boolean(anunciosAbiertos[anuncio._id]);
    const pendientes = obtenerPendientesAnuncio(anuncio);

    return (
      <div key={anuncio._id} className="mensaje-card anuncio-card leido">
        <div className="mensaje-icon anuncio-icon">
          <FontAwesomeIcon icon={faBullhorn} />
        </div>
        <div className="mensaje-body">
          <div className="mensaje-meta">
            <span className="mensaje-tipo anuncio-enviado">Anuncio enviado</span>
            <span className="mensaje-fecha">
              {formatearFechaHora(anuncio.createdAt)}
            </span>
          </div>

          <div className="mensaje-info">
            <span className="mensaje-remitente">
              Alcance: <strong>{formatearAlcance(anuncio)}</strong>
            </span>
            <span className="mensaje-alumno">
              Destinatarios: <strong>{anuncio.totalDestinatarios}</strong>
            </span>
            <span className="mensaje-fecha-evento">
              <FontAwesomeIcon icon={faEnvelopeOpen} /> Vistos: {anuncio.totalVistos}
            </span>
          </div>

          <h3 className="anuncio-titulo">{anuncio.titulo}</h3>
          <p className="anuncio-resumen">{obtenerVistaPrevia(anuncio.mensaje)}</p>

          <div className="anuncio-metricas">
            <span className="anuncio-chip">{anuncio.totalDestinatarios} tutores</span>
            <span className="anuncio-chip anuncio-chip-success">
              {anuncio.totalVistos} vistos
            </span>
            <span className="anuncio-chip anuncio-chip-muted">
              {Math.max(0, anuncio.totalDestinatarios - anuncio.totalVistos)} pendientes
            </span>
          </div>

          <div className="anuncio-footer">
            <span className="anuncio-ayuda">
              Consulta quién ya abrió el anuncio y quién aún no.
            </span>
            <button
              type="button"
              className="btn-expandir-anuncio"
              onClick={() => alternarAnuncio(anuncio)}
            >
              <span>{abierto ? "Ocultar seguimiento" : "Ver seguimiento"}</span>
              <FontAwesomeIcon icon={abierto ? faChevronUp : faChevronDown} />
            </button>
          </div>

          {abierto && (
            <div className="anuncio-detalle anuncio-seguimiento">
              <p className="mensaje-texto">{anuncio.mensaje}</p>
              <div className="anuncio-seguimiento-grid">
                <div className="anuncio-seguimiento-columna">
                  <h4>Ya lo vieron</h4>
                  {anuncio.vistoPor?.length ? (
                    <ul className="anuncio-lista-estado">
                      {anuncio.vistoPor.map((vista) => (
                        <li key={`${anuncio._id}-${vista.tutor?._id || vista.tutor}`}>
                          <strong>{vista.tutor?.nombre || "Tutor"}</strong>
                          <span>{formatearFechaHora(vista.fechaVista)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="anuncio-vacio">Aún no hay lecturas registradas.</p>
                  )}
                </div>

                <div className="anuncio-seguimiento-columna">
                  <h4>Pendientes</h4>
                  {pendientes.length ? (
                    <ul className="anuncio-lista-estado">
                      {pendientes.map((tutor) => (
                        <li key={`${anuncio._id}-pendiente-${tutor._id || tutor}`}>
                          <strong>{tutor.nombre || "Tutor"}</strong>
                          <span>{tutor.email || "Sin email"}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="anuncio-vacio">
                      Todos los destinatarios ya vieron este anuncio.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const gruposActivos = grupos.filter((grupo) => grupo.activo !== false);
  const solicitudesPendientes = mensajes.filter(
    (mensaje) => mensaje.estado === "pendiente",
  ).length;
  const anunciosSinVer = anuncios.filter((anuncio) => !anuncio.visto).length;
  const itemsActivos = tabActiva === "solicitudes" ? mensajes : anuncios;
  const itemsRecientes = ordenarPorFechaDesc(
    itemsActivos.filter((item) => esItemReciente(item.createdAt)),
  );
  const itemsAntiguos = ordenarPorFechaDesc(
    itemsActivos.filter((item) => !esItemReciente(item.createdAt)),
  );

  return (
    <div className="mensajes-container">
      <div className="mensajes-header">
        <h2>
          <FontAwesomeIcon
            icon={tabActiva === "anuncios" ? faBullhorn : faEnvelope}
          />{" "}
          {esProfesor
            ? tabActiva === "anuncios"
              ? "Anuncios"
              : "Solicitudes de tutores"
            : tabActiva === "anuncios"
              ? "Anuncios"
              : "Mensajes al profesor"}
        </h2>

        {esTutor && tabActiva === "solicitudes" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setMostrarFormularioMensaje((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Nuevo mensaje</span>
          </button>
        )}

        {esProfesor && tabActiva === "anuncios" && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setMostrarFormularioAnuncio((prev) => !prev)}
          >
            <FontAwesomeIcon icon={faBullhorn} />
            <span>Nuevo anuncio</span>
          </button>
        )}
      </div>

      <div className="mensajes-tabs">
        <button
          type="button"
          className={`mensajes-tab ${tabActiva === "solicitudes" ? "active" : ""}`}
          onClick={() => cambiarTab("solicitudes")}
        >
          <FontAwesomeIcon icon={faEnvelope} />
          <span>{esProfesor ? "Solicitudes" : "Mis mensajes"}</span>
          {esProfesor && solicitudesPendientes > 0 && (
            <span className="tab-badge">{solicitudesPendientes}</span>
          )}
        </button>
        <button
          type="button"
          className={`mensajes-tab ${tabActiva === "anuncios" ? "active" : ""}`}
          onClick={() => cambiarTab("anuncios")}
        >
          <FontAwesomeIcon icon={faBullhorn} />
          <span>{esProfesor ? "Anuncios" : "Anuncios recibidos"}</span>
          {esTutor && anunciosSinVer > 0 && (
            <span className="tab-badge">{anunciosSinVer}</span>
          )}
        </button>
      </div>

      {esTutor && tabActiva === "solicitudes" && mostrarFormularioMensaje && (
        <div className="mensaje-form-container">
          <form onSubmit={enviarMensaje} className="mensaje-form">
            <div className="form-group">
              <label>
                <FontAwesomeIcon icon={faUserGraduate} /> Alumno
              </label>
              {alumnosTutor.length === 0 ? (
                <div className="mensaje-selector-empty">
                  No tienes alumnos asociados para enviar mensajes.
                </div>
              ) : (
                <div
                  className="mensaje-selector-tabs"
                  role="group"
                  aria-label="Selección de alumno"
                >
                  {alumnosTutor.map((alumno) => {
                    const nombreAlumno = obtenerNombreCompletoAlumno(alumno);
                    const activo = formData.alumnoId === alumno._id;

                    return (
                      <button
                        key={alumno._id}
                        type="button"
                        className={`mensaje-selector-tab ${activo ? "active" : ""}`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            alumnoId: alumno._id,
                          }))
                        }
                        aria-pressed={activo}
                      >
                        <FontAwesomeIcon icon={faUserGraduate} />
                        <span>{nombreAlumno || "Alumno"}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {alumnoSeleccionado && (
                <span className="mensaje-selector-help">
                  Avisarás al profesor sobre{" "}
                  {obtenerNombreCompletoAlumno(alumnoSeleccionado)}.
                </span>
              )}
            </div>

            <div className="form-row form-row-secondary">
              <div className="form-group">
                <label>Tipo de mensaje</label>
                <div
                  className="mensaje-type-options"
                  role="group"
                  aria-label="Selección de tipo de mensaje"
                >
                  {opcionesTipoMensaje.map((opcion) => {
                    const activa = formData.tipo === opcion.value;

                    return (
                      <button
                        key={opcion.value}
                        type="button"
                        className={`mensaje-type-option ${activa ? "active" : ""}`}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tipo: opcion.value,
                          }))
                        }
                        aria-pressed={activa}
                      >
                        <span className="mensaje-type-icon">
                          <FontAwesomeIcon icon={opcion.icon} />
                        </span>
                        <span className="mensaje-type-copy">
                          <strong>{opcion.label}</strong>
                          <span>{opcion.description}</span>
                        </span>
                        {activa && (
                          <span className="mensaje-type-check">
                            <FontAwesomeIcon icon={faCheck} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faCalendarAlt} /> Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      fecha: event.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Detalles</label>
              <textarea
                value={formData.mensaje}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    mensaje: event.target.value,
                  }))
                }
                placeholder="Comparte los detalles para el profesor..."
                rows="3"
                maxLength="500"
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={limpiarFormularioMensaje}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={enviando}>
                {enviando ? "Enviando..." : "Enviar mensaje"}
              </button>
            </div>
          </form>
        </div>
      )}

      {esProfesor && tabActiva === "anuncios" && mostrarFormularioAnuncio && (
        <div className="mensaje-form-container anuncio-form-container">
          <form onSubmit={enviarAnuncio} className="mensaje-form anuncio-form">
            <div className="form-row anuncio-form-row">
              <div className="form-group">
                <label>Título del anuncio</label>
                <input
                  type="text"
                  value={anuncioFormData.titulo}
                  onChange={(event) =>
                    setAnuncioFormData((prev) => ({
                      ...prev,
                      titulo: event.target.value,
                    }))
                  }
                  maxLength={120}
                  placeholder="Ej. Reunión de tutores mañana"
                  required
                />
              </div>

              <div className="form-group form-group-full">
                <label>¿A quién va dirigido?</label>
                <div className="audiencia-opciones">
                  <label
                    className={`audiencia-opcion ${anuncioFormData.alcance === "grupo" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="alcance"
                      checked={anuncioFormData.alcance === "grupo"}
                      onChange={() => actualizarAlcanceAnuncio("grupo")}
                    />
                    <span>Grupo</span>
                  </label>

                  <label
                    className={`audiencia-opcion ${anuncioFormData.alcance === "tutores" ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="alcance"
                      checked={anuncioFormData.alcance === "tutores"}
                      onChange={() => actualizarAlcanceAnuncio("tutores")}
                    />
                    <span>Tutores específicos</span>
                  </label>

                  {esAdmin && (
                    <label
                      className={`audiencia-opcion ${anuncioFormData.alcance === "todos" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="alcance"
                        checked={anuncioFormData.alcance === "todos"}
                        onChange={() => actualizarAlcanceAnuncio("todos")}
                      />
                      <span>Todos los tutores</span>
                    </label>
                  )}
                </div>
              </div>

              {anuncioFormData.alcance === "grupo" && (
                <div className="form-group form-group-full">
                  <label>Grupo destinatario</label>
                  <select
                    value={anuncioFormData.grupoId}
                    onChange={(event) =>
                      setAnuncioFormData((prev) => ({
                        ...prev,
                        grupoId: event.target.value,
                      }))
                    }
                    required
                  >
                    <option value="">Seleccionar grupo...</option>
                    {gruposActivos.map((grupo) => (
                      <option key={grupo._id} value={grupo._id}>
                        {grupo.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {anuncioFormData.alcance === "tutores" && (
                <div className="form-group form-group-full">
                  <label>Tutores destinatarios</label>
                  {tutoresDisponibles.length === 0 ? (
                    <div className="selector-vacio">
                      No hay tutores disponibles para este profesor.
                    </div>
                  ) : (
                    <div className="tutores-selector-grid">
                      {tutoresDisponibles.map((tutor) => (
                        <label key={tutor._id} className="tutor-selector-item">
                          <input
                            type="checkbox"
                            checked={anuncioFormData.tutorIds.includes(tutor._id)}
                            onChange={() => alternarTutorSeleccionado(tutor._id)}
                          />
                          <div>
                            <strong>{tutor.nombre}</strong>
                            <span>
                              {(tutor.alumnos || [])
                                .map((alumno) => obtenerNombreCompletoAlumno(alumno))
                                .join(", ") || "Sin alumnos asignados"}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group form-group-full">
                <label>Mensaje</label>
                <textarea
                  value={anuncioFormData.mensaje}
                  onChange={(event) =>
                    setAnuncioFormData((prev) => ({
                      ...prev,
                      mensaje: event.target.value,
                    }))
                  }
                  placeholder="Escribe el anuncio para los tutores..."
                  rows="4"
                  maxLength="1000"
                  required
                />
              </div>
            </div>

            <div className="anuncio-resumen-envio">
              <span className="anuncio-resumen-chip">
                <FontAwesomeIcon icon={faUsers} /> {obtenerCantidadDestinatarios()} destinatarios
              </span>
              <span className="anuncio-resumen-texto">
                Los tutores solo podrán leer el anuncio; no podrán responder.
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={limpiarFormularioAnuncio}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={enviandoAnuncio}
              >
                {enviandoAnuncio ? "Enviando..." : "Enviar anuncio"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mensajes-lista">
        {cargando ? (
          <div className="mensajes-empty">Cargando mensajes...</div>
        ) : itemsActivos.length === 0 ? (
          <div className="mensajes-empty">
            {tabActiva === "solicitudes"
              ? esTutor
                ? 'No has enviado mensajes aún. Usa el botón "Nuevo mensaje" para notificar al profesor.'
                : "No tienes mensajes."
              : esProfesor
                ? "Aún no has enviado anuncios. Usa el botón 'Nuevo anuncio' para comunicarte con los tutores."
                : "No tienes anuncios por ahora."}
          </div>
        ) : (
          <>
            {itemsRecientes.length > 0 && (
              <div className="mensajes-seccion">
                <div className="mensajes-seccion-header">
                  <h3>Recientes</h3>
                  <span>Ultimos {LIMITE_DIAS_MENSAJES} dias</span>
                </div>
                {itemsRecientes.map((item) =>
                  tabActiva === "solicitudes"
                    ? renderSolicitud(item)
                    : esProfesor
                      ? renderAnuncioProfesor(item)
                      : renderAnuncioTutor(item),
                )}
              </div>
            )}

            {itemsAntiguos.length > 0 && (
              <div className="mensajes-seccion mensajes-seccion-antiguos">
                <div className="mensajes-seccion-header">
                  <h3>Antiguos</h3>
                  <span>Mas de {LIMITE_DIAS_MENSAJES} dias</span>
                </div>
                {itemsAntiguos.map((item) =>
                  tabActiva === "solicitudes"
                    ? renderSolicitud(item)
                    : esProfesor
                      ? renderAnuncioProfesor(item)
                      : renderAnuncioTutor(item),
                )}
              </div>
            )}
          </>
        )}
      </div>

      {esTutor && anuncioTutorActivo && (
        <div className="anuncio-modal-backdrop" onClick={cerrarAnuncioTutor}>
          <div
            className="anuncio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`anuncio-modal-${anuncioTutorActivo._id}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="anuncio-modal-header">
              <div>
                <span
                  className={`mensaje-tipo ${
                    anuncioTutorActivo.visto ? "anuncio-visto" : "anuncio-nuevo"
                  }`}
                >
                  {anuncioTutorActivo.visto ? "Visto" : "Nuevo anuncio"}
                </span>
                <h3
                  id={`anuncio-modal-${anuncioTutorActivo._id}`}
                  className="anuncio-modal-titulo"
                >
                  {anuncioTutorActivo.titulo}
                </h3>
              </div>
              <button
                type="button"
                className="btn-cancel-sm"
                onClick={cerrarAnuncioTutor}
              >
                Cerrar
              </button>
            </div>

            <div className="anuncio-modal-meta">
              <span>
                De: <strong>{anuncioTutorActivo.autor?.nombre || "Profesor"}</strong>
              </span>
              <span>
                Fecha: <strong>{formatearFechaHora(anuncioTutorActivo.createdAt)}</strong>
              </span>
              <span>
                Alcance: <strong>{formatearAlcance(anuncioTutorActivo)}</strong>
              </span>
              {anuncioTutorActivo.fechaVista && (
                <span>
                  Leído: <strong>{formatearFechaHora(anuncioTutorActivo.fechaVista)}</strong>
                </span>
              )}
            </div>

            <div className="anuncio-modal-contenido">
              <p className="mensaje-texto">{anuncioTutorActivo.mensaje}</p>
              <div className="anuncio-detalle-nota">
                <FontAwesomeIcon icon={faEnvelopeOpen} /> Este anuncio es solo informativo y no admite respuestas.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mensajes;
