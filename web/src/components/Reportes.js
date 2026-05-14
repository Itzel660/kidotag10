import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendar,
  faCheckCircle,
  faClock,
  faDownload,
  faFileArrowDown,
  faFilter,
  faLayerGroup,
  faTriangleExclamation,
  faUserXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { apiDownload, apiGet } from "../config/api.config";
import "./Asistencias.css";
import "./Reportes.css";

const ESTADOS_DISPONIBLES = [
  {
    id: "presente",
    etiqueta: "Presentes",
    icono: faCheckCircle,
    clase: "success",
  },
  {
    id: "inasistencia",
    etiqueta: "Inasistencias",
    icono: faUserXmark,
    clase: "danger",
  },
  {
    id: "tarde",
    etiqueta: "Tardanzas",
    icono: faClock,
    clase: "warning",
  },
];

const crearFechaHoy = () => new Date().toISOString().split("T")[0];

const descargarBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = fileName;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
};

const obtenerEstadosSeleccionados = (estadosActivos) =>
  Object.entries(estadosActivos)
    .filter(([, activo]) => activo)
    .map(([estadoId]) => estadoId);

const construirQueryReporte = ({
  modoFecha,
  fecha,
  fechaInicio,
  fechaFin,
  grupoFiltro,
  estadosActivos,
}) => {
  const estados = obtenerEstadosSeleccionados(estadosActivos);
  if (estados.length === 0) {
    return { error: "Selecciona al menos un estado para filtrar" };
  }

  if (modoFecha === "dia" && !fecha) {
    return { error: "Selecciona una fecha para consultar el reporte" };
  }

  if (modoFecha === "rango") {
    if (!fechaInicio || !fechaFin) {
      return { error: "Selecciona fecha de inicio y fecha fin" };
    }

    if (fechaInicio > fechaFin) {
      return {
        error: "La fecha de inicio no puede ser mayor que la fecha fin",
      };
    }
  }

  const params = new URLSearchParams();

  if (grupoFiltro) {
    params.set("grupo", grupoFiltro);
  }

  if (modoFecha === "dia") {
    params.set("fecha", fecha);
  } else {
    params.set("fechaInicio", fechaInicio);
    params.set("fechaFin", fechaFin);
  }

  if (estados.length < ESTADOS_DISPONIBLES.length) {
    params.set("estados", estados.join(","));
  }

  return { query: params.toString() };
};

const Reportes = () => {
  const { token, user } = useAuth();
  const [modoFecha, setModoFecha] = useState("dia");
  const [fecha, setFecha] = useState(crearFechaHoy());
  const [fechaInicio, setFechaInicio] = useState(crearFechaHoy());
  const [fechaFin, setFechaFin] = useState(crearFechaHoy());
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [resumen, setResumen] = useState({
    presente: 0,
    inasistencia: 0,
    tarde: 0,
    total: 0,
  });
  const [estadosActivos, setEstadosActivos] = useState({
    presente: true,
    inasistencia: true,
    tarde: true,
  });
  const [cargando, setCargando] = useState(true);
  const [accionActiva, setAccionActiva] = useState("");
  const [error, setError] = useState("");

  const esAdmin = user?.tipo === "profesor" && user?.esAdmin;
  const esProfesor = user?.tipo === "profesor";

  const cargarReporte = async (overrideGrupo = null) => {
    const queryData = construirQueryReporte({
      modoFecha,
      fecha,
      fechaInicio,
      fechaFin,
      grupoFiltro: overrideGrupo ?? grupoFiltro,
      estadosActivos,
    });

    if (queryData.error) {
      setError(queryData.error);
      setCargando(false);
      return;
    }

    setError("");
    setCargando(true);

    try {
      const datos = await apiGet(
        `asistencias/reportes?${queryData.query}`,
        token,
      );

      if (!datos.ok) {
        throw new Error(datos.error?.mensaje || "No se pudo cargar el reporte");
      }

      setRegistros(datos.data || []);
      setResumen({
        presente: datos.meta?.estados?.presente || 0,
        inasistencia: datos.meta?.estados?.inasistencia || 0,
        tarde: datos.meta?.estados?.tarde || 0,
        total: datos.meta?.total || 0,
      });
    } catch (loadError) {
      console.error("Error al cargar reportes:", loadError);
      setRegistros([]);
      setResumen({ presente: 0, inasistencia: 0, tarde: 0, total: 0 });
      setError(loadError.message || "No se pudo cargar el reporte");
    } finally {
      setCargando(false);
    }
  };

  const cargarGrupos = async () => {
    setCargando(true);
    setError("");

    try {
      const datos = await apiGet("grupos", token);

      if (!datos.ok) {
        throw new Error(
          datos.error?.mensaje || "No se pudieron cargar los grupos",
        );
      }

      const gruposDisponibles = datos.data || [];
      const grupoInicial =
        !esAdmin && gruposDisponibles.length === 1
          ? gruposDisponibles[0]._id
          : "";

      setGrupos(gruposDisponibles);
      setGrupoFiltro(grupoInicial);
      await cargarReporte(grupoInicial);
    } catch (loadError) {
      console.error("Error al cargar grupos para reportes:", loadError);
      setGrupos([]);
      setError(loadError.message || "No se pudieron cargar los grupos");
      setCargando(false);
    }
  };

  useEffect(() => {
    const cargarInicial = async () => {
      if (!esProfesor) {
        setCargando(false);
        return;
      }

      setCargando(true);
      setError("");

      try {
        const datos = await apiGet("grupos", token);

        if (!datos.ok) {
          throw new Error(
            datos.error?.mensaje || "No se pudieron cargar los grupos",
          );
        }

        const gruposDisponibles = datos.data || [];
        const grupoInicial =
          !esAdmin && gruposDisponibles.length === 1
            ? gruposDisponibles[0]._id
            : "";
        const estadosIniciales = {
          presente: true,
          inasistencia: true,
          tarde: true,
        };
        const queryData = construirQueryReporte({
          modoFecha: "dia",
          fecha,
          fechaInicio,
          fechaFin,
          grupoFiltro: grupoInicial,
          estadosActivos: estadosIniciales,
        });

        setGrupos(gruposDisponibles);
        setGrupoFiltro(grupoInicial);

        if (queryData.error) {
          setError(queryData.error);
          setCargando(false);
          return;
        }

        const reporte = await apiGet(
          `asistencias/reportes?${queryData.query}`,
          token,
        );

        if (!reporte.ok) {
          throw new Error(
            reporte.error?.mensaje || "No se pudo cargar el reporte",
          );
        }

        setRegistros(reporte.data || []);
        setResumen({
          presente: reporte.meta?.estados?.presente || 0,
          inasistencia: reporte.meta?.estados?.inasistencia || 0,
          tarde: reporte.meta?.estados?.tarde || 0,
          total: reporte.meta?.total || 0,
        });
      } catch (loadError) {
        console.error("Error al preparar reportes:", loadError);
        setGrupos([]);
        setRegistros([]);
        setResumen({ presente: 0, inasistencia: 0, tarde: 0, total: 0 });
        setError(loadError.message || "No se pudo cargar la vista de reportes");
      } finally {
        setCargando(false);
      }
    };

    cargarInicial();
  }, [esAdmin, esProfesor, fecha, fechaFin, fechaInicio, token]);

  const alternarEstado = (estadoId) => {
    setEstadosActivos((previo) => {
      const activosActuales = Object.values(previo).filter(Boolean).length;

      if (previo[estadoId] && activosActuales === 1) {
        return previo;
      }

      return {
        ...previo,
        [estadoId]: !previo[estadoId],
      };
    });
    setError("");
  };

  const manejarExportacion = async ({ tipo, formato }) => {
    const queryData = construirQueryReporte({
      modoFecha,
      fecha,
      fechaInicio,
      fechaFin,
      grupoFiltro,
      estadosActivos,
    });

    if (queryData.error) {
      setError(queryData.error);
      return;
    }

    if (tipo === "plantilla" && !grupoFiltro) {
      setError("Selecciona un grupo para descargar la plantilla en blanco");
      return;
    }

    setAccionActiva(`${tipo}-${formato}`);
    setError("");

    try {
      const endpoint =
        tipo === "plantilla"
          ? `asistencias/reportes/plantilla?grupo=${grupoFiltro}&formato=${formato}`
          : `asistencias/reportes/export?${queryData.query}&formato=${formato}`;
      const respuesta = await apiDownload(
        endpoint,
        token,
        tipo === "plantilla"
          ? `plantilla_grupo.${formato}`
          : `reporte_asistencias.${formato}`,
      );

      descargarBlob(respuesta.data.blob, respuesta.data.fileName);
    } catch (downloadError) {
      console.error("Error al descargar reporte:", downloadError);
      setError(downloadError.message || "No se pudo descargar el archivo");
    } finally {
      setAccionActiva("");
    }
  };

  if (!esProfesor) {
    return (
      <div className="reportes reportes-empty-state">
        <div className="reportes-note reportes-note-warning">
          Esta seccion esta disponible solo para profesores.
        </div>
      </div>
    );
  }

  return (
    <div className="reportes asistencias">
      <div className="section-header">
        <h2>Reportes de asistencia por grupo</h2>
        <p className="reportes-subtitle">
          Consulta por dia o por rango y exporta resultados consolidados por
          alumno.
        </p>
        <div className="filter-controls reportes-toolbar">
          <div
            className="reportes-mode-toggle"
            role="tablist"
            aria-label="Modo de fecha"
          >
            <button
              type="button"
              className={`reportes-mode-btn ${modoFecha === "dia" ? "active" : ""}`}
              onClick={() => setModoFecha("dia")}
            >
              Dia
            </button>
            <button
              type="button"
              className={`reportes-mode-btn ${modoFecha === "rango" ? "active" : ""}`}
              onClick={() => setModoFecha("rango")}
            >
              Rango
            </button>
          </div>

          {modoFecha === "dia" ? (
            <div className="input-group">
              <FontAwesomeIcon icon={faCalendar} className="input-icon" />
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="input-field"
              />
            </div>
          ) : (
            <>
              <div className="input-group">
                <FontAwesomeIcon icon={faCalendar} className="input-icon" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(event) => setFechaInicio(event.target.value)}
                  className="input-field"
                />
              </div>
              <div className="input-group">
                <FontAwesomeIcon icon={faCalendar} className="input-icon" />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(event) => setFechaFin(event.target.value)}
                  className="input-field"
                />
              </div>
            </>
          )}

          {(esAdmin || grupos.length > 1) && (
            <div className="input-group reportes-group-field">
              <FontAwesomeIcon icon={faLayerGroup} className="input-icon" />
              <select
                value={grupoFiltro}
                onChange={(event) => setGrupoFiltro(event.target.value)}
                className="input-field"
              >
                <option value="">Todos los grupos</option>
                {grupos.map((grupo) => (
                  <option key={grupo._id} value={grupo._id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!esAdmin && grupos.length === 1 && grupos[0] && (
            <span className="grupo-badge-inline">{grupos[0].nombre}</span>
          )}

          <button
            type="button"
            onClick={() => cargarReporte()}
            className="btn-filter"
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div className="reportes-statuses">
        {ESTADOS_DISPONIBLES.map((estadoItem) => (
          <button
            key={estadoItem.id}
            type="button"
            className={`reportes-status-chip ${estadoItem.clase} ${
              estadosActivos[estadoItem.id] ? "active" : ""
            }`}
            onClick={() => alternarEstado(estadoItem.id)}
          >
            <FontAwesomeIcon icon={estadoItem.icono} />
            <span>{estadoItem.etiqueta}</span>
          </button>
        ))}
      </div>

      <div className="reportes-note">
        <FontAwesomeIcon icon={faTriangleExclamation} />
        <span>
          Tarde = primera entrada despues del horario del grupo + 10 minutos.
          Inasistencia = sin entrada registrada en un dia programado.
        </span>
      </div>

      {error && (
        <div className="reportes-note reportes-note-error">{error}</div>
      )}

      <div className="stats-row reportes-stats-row">
        <div className="mini-stat reportes-stat-card success">
          <div className="mini-stat-label">Presentes</div>
          <div className="mini-stat-value">{resumen.presente}</div>
        </div>
        <div className="mini-stat reportes-stat-card danger">
          <div className="mini-stat-label">Inasistencias</div>
          <div className="mini-stat-value">{resumen.inasistencia}</div>
        </div>
        <div className="mini-stat reportes-stat-card warning">
          <div className="mini-stat-label">Tardanzas</div>
          <div className="mini-stat-value">{resumen.tarde}</div>
        </div>
        <div className="mini-stat reportes-stat-card info">
          <div className="mini-stat-label">Total</div>
          <div className="mini-stat-value">{resumen.total}</div>
        </div>
      </div>

      <div className="reportes-actions">
        <button
          type="button"
          className="btn-export"
          onClick={() =>
            manejarExportacion({ tipo: "reporte", formato: "xlsx" })
          }
          disabled={accionActiva !== ""}
        >
          <FontAwesomeIcon icon={faDownload} />
          <span>
            {accionActiva === "reporte-xlsx"
              ? "Exportando..."
              : "Exportar XLSX"}
          </span>
        </button>
        <button
          type="button"
          className="btn-export secondary"
          onClick={() =>
            manejarExportacion({ tipo: "reporte", formato: "csv" })
          }
          disabled={accionActiva !== ""}
        >
          <FontAwesomeIcon icon={faFileArrowDown} />
          <span>
            {accionActiva === "reporte-csv" ? "Exportando..." : "Exportar CSV"}
          </span>
        </button>
        <button
          type="button"
          className="btn-export ghost"
          onClick={() =>
            manejarExportacion({ tipo: "plantilla", formato: "xlsx" })
          }
          disabled={accionActiva !== "" || !grupoFiltro}
          title={
            !grupoFiltro
              ? "Selecciona un grupo para descargar la plantilla"
              : "Descargar plantilla"
          }
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>
            {accionActiva === "plantilla-xlsx"
              ? "Descargando plantilla..."
              : "Plantilla en blanco"}
          </span>
        </button>
      </div>

      <div className="table-container">
        <table className="data-table reportes-table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Estado</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>UID</th>
              <th>Horario</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan="9" className="loading">
                  Cargando reporte...
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan="9" className="loading empty">
                  No hay resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              registros.map((registro) => (
                <tr
                  key={`${registro.grupoId}-${registro.alumnoId}-${registro.fecha}`}
                >
                  <td data-label="Grupo">{registro.grupoNombre}</td>
                  <td data-label="Fecha">{registro.fecha}</td>
                  <td data-label="Alumno">
                    <strong>{registro.alumnoNombre}</strong>
                  </td>
                  <td data-label="Estado">
                    <span className={`badge badge-${registro.estado}`}>
                      {registro.estado}
                    </span>
                  </td>
                  <td data-label="Entrada">{registro.horaEntrada || "-"}</td>
                  <td data-label="Salida">{registro.horaSalida || "-"}</td>
                  <td data-label="UID">
                    <small>{registro.uidTarjeta || "Sin UID"}</small>
                  </td>
                  <td data-label="Horario">
                    {registro.horario || "No definido"}
                  </td>
                  <td data-label="Observaciones">
                    {registro.observaciones || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;
