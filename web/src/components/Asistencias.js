import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFilter,
  faCalendar,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { apiGet } from "../config/api.config";
import config from "../config/api.config";
import "./Asistencias.css";

const Asistencias = () => {
  const { token, user } = useAuth();
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [estadisticasFiltradas, setEstadisticasFiltradas] = useState({
    entradas: 0,
    salidas: 0,
    total: 0,
  });

  useEffect(() => {
    const hoy = new Date().toISOString().split("T")[0];
    setFechaFiltro(hoy);
    cargarGrupos();
  }, []);

  useEffect(() => {
    if (fechaFiltro) {
      manejarFiltro();
    }
  }, [fechaFiltro, grupoFiltro]);

  const cargarGrupos = async () => {
    try {
      const datos = await apiGet("grupos", token);
      if (datos.ok) {
        setGrupos(datos.data);
        // Si es profesor (no admin) y tiene un solo grupo, seleccionarlo automáticamente
        if (user?.tipo === "profesor" && !user?.esAdmin && datos.data.length === 1) {
          setGrupoFiltro(datos.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error al cargar grupos:", error);
    }
  };

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(config.socketUrl);

    socket.on("connect", () => {
      console.log("[Socket] Conectado al servidor en tiempo real");
    });

    socket.on("nueva-asistencia", (asistencia) => {
      console.log("[Socket] Nueva asistencia recibida:", asistencia);

      // Verificar si la asistencia es del día actual filtrado
      const fechaAsistencia = new Date(asistencia.fechaHora)
        .toISOString()
        .split("T")[0];
      if (fechaAsistencia === fechaFiltro) {
        // Agregar al inicio de la lista
        setRegistros((prev) => [asistencia, ...prev]);

        // Actualizar estadísticas
        setEstadisticasFiltradas((prev) => ({
          entradas:
            asistencia.tipo === "entrada" ? prev.entradas + 1 : prev.entradas,
          salidas:
            asistencia.tipo === "salida" ? prev.salidas + 1 : prev.salidas,
          total: prev.total + 1,
        }));
      }
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Desconectado del servidor");
    });

    return () => {
      socket.disconnect();
    };
  }, [fechaFiltro]);

  const manejarFiltro = async () => {
    if (!fechaFiltro) {
      alert("Por favor selecciona una fecha");
      return;
    }

    setCargando(true);
    try {
      let endpoint = `asistencias?fecha=${fechaFiltro}`;
      if (grupoFiltro) {
        endpoint += `&grupo=${grupoFiltro}`;
      }

      const datos = await apiGet(endpoint, token);

      if (datos.ok) {
        const entradas = datos.data.filter((r) => r.tipo === "entrada").length;
        const salidas = datos.data.filter((r) => r.tipo === "salida").length;

        setEstadisticasFiltradas({
          entradas,
          salidas,
          total: datos.data.length,
        });

        setRegistros(datos.data);
      } else {
        console.error("[Asistencias] Error en respuesta:", datos);
      }
    } catch (error) {
      console.error("Error al filtrar asistencias:", error);
    }
    setCargando(false);
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

  const esAdmin = user?.tipo === "profesor" && user?.esAdmin;
  const esProfesor = user?.tipo === "profesor" && !user?.esAdmin;

  return (
    <div className="asistencias">
      <div className="section-header">
        <h2>
          {esAdmin
            ? "Asistencias Diarias — Todos los Grupos"
            : esProfesor
              ? "Asistencias Diarias — Mi Grupo"
              : "Asistencias Diarias"}
        </h2>
        <div className="filter-controls">
          <div className="input-group">
            <FontAwesomeIcon icon={faCalendar} className="input-icon" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="input-field"
            />
          </div>
          {(esAdmin || (esProfesor && grupos.length > 1)) && (
            <select
              value={grupoFiltro}
              onChange={(e) => setGrupoFiltro(e.target.value)}
              className="input-field"
            >
              <option value="">Todos los grupos</option>
              {grupos.map((grupo) => (
                <option key={grupo._id} value={grupo._id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          )}
          {esProfesor && grupos.length === 1 && (
            <span className="grupo-badge-inline">
              {grupos[0].nombre}
            </span>
          )}
          <button onClick={manejarFiltro} className="btn-filter">
            <FontAwesomeIcon icon={faFilter} />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat">
          <div className="mini-stat-label">Entradas</div>
          <div className="mini-stat-value">
            {estadisticasFiltradas.entradas}
          </div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Salidas</div>
          <div className="mini-stat-value">{estadisticasFiltradas.salidas}</div>
        </div>
        <div className="mini-stat">
          <div className="mini-stat-label">Total</div>
          <div className="mini-stat-value">{estadisticasFiltradas.total}</div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>UID</th>
            </tr>
          </thead>
          <tbody>
            {registros.length === 0 ? (
              <tr>
                <td colSpan="5" className="loading">
                  {fechaFiltro
                    ? "No hay registros para esta fecha"
                    : "Selecciona fecha y filtra para ver registros"}
                </td>
              </tr>
            ) : (
              registros.map((registro, indice) => {
                const { fecha, hora } = formatearFechaHora(registro.fechaHora);

                return (
                  <tr key={indice}>
                    <td>
                      <strong>{registro.nombre || "Desconocido"}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${registro.tipo}`}>
                        {registro.tipo}
                      </span>
                    </td>
                    <td>{fecha}</td>
                    <td>{hora}</td>
                    <td>
                      <small>{registro.uidTarjeta}</small>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Asistencias;
