import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faArrowUp,
  faClipboardCheck,
  faChartBar,
  faSignOutAlt,
  faBell,
  faUserPlus,
  faCheckCircle,
  faChevronDown,
  faChevronUp,
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import config, { apiGet } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import "./Overview.css";

const Overview = ({ onVerPerfil }) => {
  const { user, token, mensajesNoLeidos } = useAuth();
  const esProfesor = user?.tipo === "profesor";
  const esTutor = user?.tipo === "tutor";

  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    entradasHoy: 0,
    salidasHoy: 0,
    tasaAsistencia: 0,
  });
  const [registrosRecientes, setRegistrosRecientes] = useState([]);
  const [grupoUsuario, setGrupoUsuario] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [mensajesRecientes, setMensajesRecientes] = useState([]);
  const [notificacionesExpandidas, setNotificacionesExpandidas] =
    useState(false);

  useEffect(() => {
    cargarRegistrosAsistencia();
    if (esProfesor) {
      cargarGrupos();
    }
    cargarMensajesRecientes();
  }, []);

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(config.socketUrl);

    socket.on("connect", () => {
      console.log("[Socket] Dashboard conectado en tiempo real");
    });

    socket.on("nueva-asistencia", (asistencia) => {
      console.log("[Socket] Nueva asistencia en dashboard:", asistencia);

      // Agregar a registros recientes
      setRegistrosRecientes((prev) => [asistencia, ...prev.slice(0, 7)]);

      // Actualizar estadísticas si es del día actual
      const hoy = new Date().toISOString().split("T")[0];
      const fechaAsistencia = new Date(asistencia.fechaHora)
        .toISOString()
        .split("T")[0];

      if (fechaAsistencia === hoy) {
        setEstadisticas((prev) => ({
          ...prev,
          totalRegistros: prev.totalRegistros + 1,
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
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Dashboard desconectado");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const cargarGrupos = async () => {
    try {
      const datos = await apiGet("grupos", token);
      if (datos.ok) {
        setGrupos(datos.data);
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

        setEstadisticas({
          totalRegistros: registros.length,
          entradasHoy: registrosHoy.filter((r) => r.tipo === "entrada").length,
          salidasHoy: registrosHoy.filter((r) => r.tipo === "salida").length,
          tasaAsistencia: 86.5,
        });

        setRegistrosRecientes(registros.slice(0, 8));
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

          {/* Estadísticas Generales */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon icon-blue">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <span className="stat-label">Total Registros</span>
              </div>
              <div className="stat-value">{estadisticas.totalRegistros}</div>
              <div className="stat-trend">
                <FontAwesomeIcon icon={faArrowUp} />
                <span>+12.5%</span>
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
              <div className="stat-trend">
                <FontAwesomeIcon icon={faArrowUp} />
                <span>+8.2%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon icon-purple">
                  <FontAwesomeIcon icon={faChartBar} />
                </div>
                <span className="stat-label">Tasa de Asistencia</span>
              </div>
              <div className="stat-value">{estadisticas.tasaAsistencia}%</div>
              <div className="stat-trend">
                <FontAwesomeIcon icon={faArrowUp} />
                <span>+2.1%</span>
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
              <div className="stat-trend">
                <FontAwesomeIcon icon={faArrowUp} />
                <span>+15.3%</span>
              </div>
            </div>
          </div>

          {/* Registros Recientes */}
          <div className="section-container">
            <div className="section-header">
              <h3>Registros Recientes</h3>
              <a href="#" className="view-all">
                Ver Todo
              </a>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>UID Tarjeta</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosRecientes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="loading">
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
                            <strong>{registro.uidTarjeta}</strong>
                          </td>
                          <td>
                            <span className={`badge badge-${registro.tipo}`}>
                              {registro.tipo}
                            </span>
                          </td>
                          <td>{fecha}</td>
                          <td>{hora}</td>
                          <td>
                            <span className="badge badge-entrada">Válido</span>
                          </td>
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
