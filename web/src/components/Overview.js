import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
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
import "./Overview.css";

const Overview = ({ onVerPerfil }) => {
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
  const [grupos, setGrupos] = useState([]);
  const [mensajesRecientes, setMensajesRecientes] = useState([]);
  const [notificacionesExpandidas, setNotificacionesExpandidas] =
    useState(false);
  const [ultimoRegistroHijos, setUltimoRegistroHijos] = useState(null);

  useEffect(() => {
    cargarRegistrosAsistencia();
    cargarMensajesRecientes();
    if (esProfesor) {
      cargarGrupos();
      if (esAdmin) {
        cargarDatosAdmin();
      }
    }
  }, []);

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(config.socketUrl);

    socket.on("connect", () => {
      console.log("[Socket] Dashboard conectado en tiempo real");
    });

    socket.on("nueva-asistencia", (asistencia) => {
      console.log("[Socket] Nueva asistencia en dashboard:", asistencia);
      setRegistrosRecientes((prev) => [asistencia, ...prev.slice(0, 7)]);

      const hoy = new Date().toISOString().split("T")[0];
      const fechaAsistencia = new Date(asistencia.fechaHora)
        .toISOString()
        .split("T")[0];

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
  }, []);

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
    } catch (error) {
      console.error("Error al cargar grupos:", error);
    }
  };

  const cargarMensajesRecientes = async () => {
    try {
      const datos = await apiGet("mensajes", token);
      if (datos.ok) {
        setMensajesRecientes(datos.data.slice(0, 5));
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
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

  // === CARDS PER ROLE ===

  const renderAdminCards = () => (
    <div className="stats-grid">
      <div className="stat-card">
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

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon icon-orange">
            <FontAwesomeIcon icon={faSignOutAlt} />
          </div>
          <span className="stat-label">Salidas Hoy</span>
        </div>
        <div className="stat-value">{estadisticas.salidasHoy}</div>
        <div className="stat-sub">
          {estadisticas.entradasHoy > 0
            ? `${estadisticas.entradasHoy - estadisticas.salidasHoy} aún en clase`
            : "Sin registros"}
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-header">
          <div className="stat-icon icon-purple">
            <FontAwesomeIcon icon={faChalkboardTeacher} />
          </div>
          <span className="stat-label">Profesores</span>
        </div>
        <div className="stat-value">{estadisticas.totalProfesores}</div>
        <div className="stat-sub">{estadisticas.totalGrupos} grupos activos</div>
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
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-blue">
              <FontAwesomeIcon icon={faUserGraduate} />
            </div>
            <span className="stat-label">Mis Alumnos</span>
          </div>
          <div className="stat-value">{totalAlumnosProf}</div>
          <div className="stat-sub">En {grupos.length} grupo{grupos.length !== 1 ? "s" : ""}</div>
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

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-orange">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
            <span className="stat-label">Salidas Hoy</span>
          </div>
          <div className="stat-value">{estadisticas.salidasHoy}</div>
          <div className="stat-sub">
            {estadisticas.entradasHoy > 0
              ? `${estadisticas.entradasHoy - estadisticas.salidasHoy} aún en clase`
              : "Sin registros"}
          </div>
        </div>

        <div className="stat-card">
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
    const numHijos = user?.alumnos?.length || 0;
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
            <div className="stat-icon icon-green">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <span className="stat-label">Entradas Hoy</span>
          </div>
          <div className="stat-value">{estadisticas.entradasHoy}</div>
          <div className="stat-sub">
            {numHijos > 0
              ? `de ${numHijos} hijo${numHijos !== 1 ? "s" : ""}`
              : "Sin hijos registrados"}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon icon-orange">
              <FontAwesomeIcon icon={faSignOutAlt} />
            </div>
            <span className="stat-label">Salidas Hoy</span>
          </div>
          <div className="stat-value">{estadisticas.salidasHoy}</div>
          <div className="stat-sub">
            {estadisticas.entradasHoy > estadisticas.salidasHoy
              ? `${estadisticas.entradasHoy - estadisticas.salidasHoy} aún en clase`
              : estadisticas.salidasHoy > 0
                ? "Todos salieron"
                : "Sin registros"}
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
            {ultimoRegistroHijos
              ? formatearTiempoRelativo(ultimoRegistroHijos.fechaHora)
              : "--"}
          </div>
          <div className="stat-sub">
            {ultimoRegistroHijos
              ? `${ultimoRegistroHijos.nombre} · ${ultimoRegistroHijos.tipo}`
              : "Sin actividad reciente"}
          </div>
        </div>
      </div>
    );
  };

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

          {/* Tarjetas de Grupos - solo profesor/admin */}
          {esProfesor && grupos.length > 0 && (
            <div className="groups-section">
              <h3>Grupos</h3>
              <div className="groups-grid">
                {grupos.map((grupo) => (
                  <div key={grupo._id} className="group-card">
                    <div className="group-header">
                      <h4>{grupo.nombre}</h4>
                    </div>
                    <div className="group-stats">
                      <div className="group-stat">
                        <span className="stat-number">
                          {grupo.alumnos?.length || 0}
                        </span>
                        <span className="stat-label">Alumnos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info de alumnos del tutor */}
          {esTutor && user?.alumnos && (
            <div className="groups-section">
              <h3>Mis hijos</h3>
              <div className="groups-grid">
                {user.alumnos.map((alumno) => (
                  <div
                    key={alumno._id}
                    className="group-card clickable"
                    onClick={() => onVerPerfil && onVerPerfil(alumno._id)}
                  >
                    <div className="group-header">
                      <h4>{alumno.nombre}</h4>
                    </div>
                    <div className="group-stats">
                      <div className="group-stat">
                        <span className="stat-number">{alumno.uidTarjeta}</span>
                        <span className="stat-label">UID Tarjeta</span>
                      </div>
                    </div>
                    <span className="ver-perfil-link">Ver perfil →</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Registros Recientes */}
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
                      return (
                        <tr key={indice}>
                          <td>
                            <strong>{registro.nombre || registro.uidTarjeta}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${registro.tipo}`}>
                              {registro.tipo}
                            </span>
                          </td>
                          <td>{fecha}</td>
                          <td>{hora}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
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
                  <div
                    className={`notif-icon ${msg.tipo === "inasistencia" ? "info" : "salida"}`}
                  >
                    <FontAwesomeIcon
                      icon={msg.tipo === "inasistencia" ? faBell : faSignOutAlt}
                    />
                  </div>
                  <div className="notif-content">
                    <p>
                      <strong>{msg.remitente?.nombre || "Tutor"}:</strong>{" "}
                      {msg.mensaje}
                    </p>
                    <span className="notif-time">
                      {msg.alumno?.nombre} ·{" "}
                      {formatearTiempoRelativo(msg.createdAt)}
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
