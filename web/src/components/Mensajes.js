import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faCheck,
  faEnvelope,
  faEnvelopeOpen,
  faCalendarAlt,
  faUserGraduate,
  faCheckCircle,
  faTimesCircle,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost, apiPut } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import "./Mensajes.css";

const Mensajes = () => {
  const { user, token, setMensajesNoLeidos } = useAuth();
  const esTutor = user?.tipo === "tutor";
  const esProfesor = user?.tipo === "profesor";

  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Form state for tutor
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState({
    alumnoId: "",
    tipo: "inasistencia",
    mensaje: "",
    fecha: new Date().toISOString().split("T")[0],
  });
  const [enviando, setEnviando] = useState(false);
  const [respondiendo, setRespondiendo] = useState(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");

  useEffect(() => {
    cargarMensajes();
  }, []);

  const cargarMensajes = async () => {
    setCargando(true);
    try {
      const datos = await apiGet("mensajes", token);
      if (datos.ok) {
        setMensajes(datos.data);
      }
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
    setCargando(false);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!formData.alumnoId || !formData.mensaje) {
      alert("Selecciona un alumno y escribe un mensaje");
      return;
    }

    setEnviando(true);
    try {
      const datos = await apiPost("mensajes", formData, token);
      if (datos.ok) {
        setFormData({
          alumnoId: "",
          tipo: "inasistencia",
          mensaje: "",
          fecha: new Date().toISOString().split("T")[0],
        });
        setMostrarFormulario(false);
        cargarMensajes();
      } else {
        alert(datos.error?.mensaje || "Error al enviar mensaje");
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      alert("Error al enviar mensaje");
    }
    setEnviando(false);
  };

  const marcarLeido = async (id) => {
    try {
      const datos = await apiPut(`mensajes/${id}/leer`, {}, token);
      if (datos.ok) {
        setMensajes((prev) =>
          prev.map((m) => (m._id === id ? { ...m, leido: true } : m)),
        );
        setMensajesNoLeidos((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error al marcar como leído:", error);
    }
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
        setMensajes((prev) => prev.map((m) => (m._id === id ? datos.data : m)));
        setMensajesNoLeidos((prev) => Math.max(0, prev - 1));
        setRespondiendo(null);
        setRespuestaTexto("");
      }
    } catch (error) {
      console.error("Error al responder mensaje:", error);
    }
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

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatearFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mensajes-container">
      {/* Header */}
      <div className="mensajes-header">
        <h2>
          <FontAwesomeIcon icon={faEnvelope} />{" "}
          {esTutor ? "Enviar Notificación" : "Bandeja de Mensajes"}
        </h2>
        {esTutor && (
          <button
            className="btn-primary"
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span>Nuevo Mensaje</span>
          </button>
        )}
      </div>

      {/* Formulario de envío - solo tutores */}
      {esTutor && mostrarFormulario && (
        <div className="mensaje-form-container">
          <form onSubmit={enviarMensaje} className="mensaje-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faUserGraduate} /> Alumno
                </label>
                <select
                  value={formData.alumnoId}
                  onChange={(e) =>
                    setFormData({ ...formData, alumnoId: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar alumno...</option>
                  {user?.alumnos?.map((alumno) => (
                    <option key={alumno._id} value={alumno._id}>
                      {alumno.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de notificación</label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                >
                  <option value="inasistencia">Inasistencia futura</option>
                  <option value="salida_temprana">Salida temprana</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <FontAwesomeIcon icon={faCalendarAlt} /> Fecha
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mensaje</label>
              <textarea
                value={formData.mensaje}
                onChange={(e) =>
                  setFormData({ ...formData, mensaje: e.target.value })
                }
                placeholder="Describe el motivo..."
                rows="3"
                maxLength="500"
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setMostrarFormulario(false)}
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

      {/* Lista de mensajes */}
      <div className="mensajes-lista">
        {cargando ? (
          <div className="mensajes-empty">Cargando mensajes...</div>
        ) : mensajes.length === 0 ? (
          <div className="mensajes-empty">
            {esTutor
              ? 'No has enviado mensajes aún. Usa el botón "Nuevo Mensaje" para notificar al profesor.'
              : "No tienes mensajes."}
          </div>
        ) : (
          mensajes.map((msg) => {
            const badge = getEstadoBadge(msg.estado);
            return (
              <div
                key={msg._id}
                className={`mensaje-card ${msg.leido ? "leido" : "no-leido"}`}
              >
                <div className="mensaje-icon">
                  <FontAwesomeIcon
                    icon={msg.leido ? faEnvelopeOpen : faEnvelope}
                  />
                </div>
                <div className="mensaje-body">
                  <div className="mensaje-meta">
                    <span className={`mensaje-tipo ${msg.tipo}`}>
                      {msg.tipo === "inasistencia"
                        ? "Inasistencia"
                        : "Salida Temprana"}
                    </span>
                    <span className={`mensaje-estado ${badge.className}`}>
                      <FontAwesomeIcon icon={badge.icon} /> {badge.label}
                    </span>
                    <span className="mensaje-fecha">
                      {formatearFechaHora(msg.createdAt)}
                    </span>
                  </div>
                  <div className="mensaje-info">
                    {esProfesor && (
                      <span className="mensaje-remitente">
                        De: <strong>{msg.remitente?.nombre || "Tutor"}</strong>
                        {msg.remitente?.telefono &&
                          ` (${msg.remitente.telefono})`}
                      </span>
                    )}
                    {esTutor && (
                      <span className="mensaje-remitente">
                        Para:{" "}
                        <strong>
                          {msg.destinatario?.nombre || "Profesor"}
                        </strong>
                      </span>
                    )}
                    <span className="mensaje-alumno">
                      Alumno: <strong>{msg.alumno?.nombre || "N/A"}</strong>
                    </span>
                    <span className="mensaje-fecha-evento">
                      <FontAwesomeIcon icon={faCalendarAlt} /> Fecha:{" "}
                      {formatearFecha(msg.fecha)}
                    </span>
                  </div>
                  <p className="mensaje-texto">{msg.mensaje}</p>

                  {/* Respuesta del profesor visible para el tutor */}
                  {esTutor && msg.respuesta && (
                    <div className="mensaje-respuesta">
                      <strong>Respuesta del profesor:</strong> {msg.respuesta}
                    </div>
                  )}

                  {/* Botones de aprobar/rechazar para profesor */}
                  {esProfesor && msg.estado === "pendiente" && (
                    <div className="mensaje-acciones">
                      {respondiendo === msg._id ? (
                        <div className="respuesta-form">
                          <input
                            type="text"
                            placeholder="Respuesta opcional..."
                            value={respuestaTexto}
                            onChange={(e) => setRespuestaTexto(e.target.value)}
                            maxLength={500}
                          />
                          <div className="respuesta-btns">
                            <button
                              className="btn-aprobar"
                              onClick={() =>
                                responderMensaje(msg._id, "aprobado")
                              }
                            >
                              <FontAwesomeIcon icon={faCheckCircle} /> Aprobar
                            </button>
                            <button
                              className="btn-rechazar"
                              onClick={() =>
                                responderMensaje(msg._id, "rechazado")
                              }
                            >
                              <FontAwesomeIcon icon={faTimesCircle} /> Rechazar
                            </button>
                            <button
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
                          className="btn-responder"
                          onClick={() => setRespondiendo(msg._id)}
                        >
                          Responder
                        </button>
                      )}
                    </div>
                  )}

                  {/* Estado ya respondido para profesor */}
                  {esProfesor &&
                    msg.estado !== "pendiente" &&
                    msg.respuesta && (
                      <div className="mensaje-respuesta">
                        <strong>Tu respuesta:</strong> {msg.respuesta}
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Mensajes;
