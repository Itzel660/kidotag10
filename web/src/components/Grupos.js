import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faUsers,
  faUserPlus,
  faUserMinus,
  faTimes,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import "./Grupos.css";

const Grupos = () => {
  const { token, user } = useAuth();
  const [grupos, setGrupos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [grupoExpandido, setGrupoExpandido] = useState(null);
  const [busquedaAlumno, setBusquedaAlumno] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    profesor: "",
    horario: "",
    activo: true,
  });

  useEffect(() => {
    cargarGrupos();
    cargarProfesores();
    cargarAlumnos();
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

  const cargarProfesores = async () => {
    try {
      const datos = await apiGet("profesores", token);
      if (datos.ok) {
        setProfesores(datos.data);
      }
    } catch (error) {
      console.error("Error al cargar profesores:", error);
    }
  };

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet("alumnos", token);
      if (datos.ok) {
        setAlumnos(datos.data);
      }
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.profesor) {
        alert("Debe seleccionar un profesor");
        return;
      }

      const datos = editando
        ? await apiPut(`grupos/${editando._id}`, payload, token)
        : await apiPost("grupos", payload, token);

      if (datos.ok) {
        alert(editando ? "Grupo actualizado" : "Grupo creado");
        resetFormulario();
        cargarGrupos();
      } else {
        alert(datos.error?.mensaje || "Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar grupo");
    }
  };

  const editar = (grupo) => {
    setEditando(grupo);
    setFormData({
      nombre: grupo.nombre || "",
      descripcion: grupo.descripcion || "",
      profesor: grupo.profesor?._id || "",
      horario: grupo.horario || "",
      activo: grupo.activo !== false,
    });
    setMostrarFormulario(true);
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el grupo "${nombre}"?`))
      return;
    try {
      const datos = await apiDelete(`grupos/${id}`, token);
      if (datos.ok) {
        alert("Grupo eliminado");
        cargarGrupos();
        if (grupoExpandido === id) setGrupoExpandido(null);
      } else {
        alert(datos.error?.mensaje || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar grupo");
    }
  };

  const agregarAlumnoAGrupo = async (grupoId, alumnoId) => {
    try {
      const datos = await apiPost(
        `grupos/${grupoId}/alumnos`,
        { alumnoId },
        token,
      );
      if (datos.ok) {
        cargarGrupos();
        cargarAlumnos();
      } else {
        alert(datos.error?.mensaje || "Error al agregar alumno");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al agregar alumno al grupo");
    }
  };

  const removerAlumnoDeGrupo = async (grupoId, alumnoId) => {
    try {
      const datos = await apiDelete(
        `grupos/${grupoId}/alumnos/${alumnoId}`,
        token,
      );
      if (datos.ok) {
        cargarGrupos();
        cargarAlumnos();
      } else {
        alert(datos.error?.mensaje || "Error al remover alumno");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al remover alumno del grupo");
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      profesor: "",
      horario: "",
      activo: true,
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  const gruposFiltrados = grupos.filter(
    (g) =>
      g.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      g.profesor?.nombre?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const alumnosEnGrupo = (grupo) => grupo.alumnos || [];

  const alumnosDisponibles = (grupo) => {
    const idsEnGrupo = new Set(
      (grupo.alumnos || []).map((a) => a._id),
    );
    return alumnos.filter(
      (a) =>
        !idsEnGrupo.has(a._id) &&
        a.nombre?.toLowerCase().includes(busquedaAlumno.toLowerCase()),
    );
  };

  return (
    <div className="grupos-container">
      <div className="profesores-header">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button
          className="btn-primary"
          onClick={() => {
            resetFormulario();
            setMostrarFormulario(true);
          }}
        >
          <FontAwesomeIcon icon={faPlus} /> Nuevo Grupo
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-container">
          <h3>{editando ? "Editar Grupo" : "Nuevo Grupo"}</h3>
          <form onSubmit={guardar}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  placeholder="Ej: Grupo 3A"
                />
              </div>
              <div className="form-group">
                <label>Profesor *</label>
                <select
                  value={formData.profesor}
                  onChange={(e) =>
                    setFormData({ ...formData, profesor: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar profesor</option>
                  {profesores.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Horario</label>
                <input
                  type="text"
                  value={formData.horario}
                  onChange={(e) =>
                    setFormData({ ...formData, horario: e.target.value })
                  }
                  placeholder="Ej: Lunes a Viernes 8:00-14:00"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción del grupo"
                />
              </div>
              {editando && (
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) =>
                        setFormData({ ...formData, activo: e.target.checked })
                      }
                    />
                    Grupo activo
                  </label>
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={resetFormulario}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editando ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Profesor</th>
              <th>Horario</th>
              <th>Alumnos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gruposFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No hay grupos registrados
                </td>
              </tr>
            ) : (
              gruposFiltrados.map((g) => (
                <React.Fragment key={g._id}>
                  <tr
                    className={grupoExpandido === g._id ? "row-expanded" : ""}
                  >
                    <td>
                      <strong>{g.nombre}</strong>
                      {g.descripcion && (
                        <span className="grupo-desc">{g.descripcion}</span>
                      )}
                    </td>
                    <td>{g.profesor?.nombre || "-"}</td>
                    <td>{g.horario || "-"}</td>
                    <td>
                      <span
                        className="badge-alumnos"
                        onClick={() =>
                          setGrupoExpandido(
                            grupoExpandido === g._id ? null : g._id,
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faUsers} />{" "}
                        {g.alumnos?.length || 0}
                        <FontAwesomeIcon
                          icon={
                            grupoExpandido === g._id
                              ? faChevronUp
                              : faChevronDown
                          }
                          className="chevron-icon"
                        />
                      </span>
                    </td>
                    <td>
                      {g.activo !== false ? (
                        <span className="badge badge-activo">Activo</span>
                      ) : (
                        <span className="badge badge-inactivo">Inactivo</span>
                      )}
                    </td>
                    <td className="actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => editar(g)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => eliminar(g._id, g.nombre)}
                        title="Eliminar"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                  {grupoExpandido === g._id && (
                    <tr className="alumnos-row">
                      <td colSpan="6">
                        <div className="alumnos-panel">
                          <div className="alumnos-panel-header">
                            <h4>
                              <FontAwesomeIcon icon={faUsers} /> Alumnos en{" "}
                              {g.nombre}
                            </h4>
                          </div>

                          <div className="alumnos-en-grupo">
                            {alumnosEnGrupo(g).length === 0 ? (
                              <p className="sin-alumnos">
                                No hay alumnos en este grupo
                              </p>
                            ) : (
                              <div className="chips-alumnos">
                                {alumnosEnGrupo(g).map((a) => (
                                  <span key={a._id} className="chip-alumno">
                                    {a.nombre}
                                    <button
                                      onClick={() =>
                                        removerAlumnoDeGrupo(g._id, a._id)
                                      }
                                      title="Remover del grupo"
                                    >
                                      <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="agregar-alumno-seccion">
                            <h5>
                              <FontAwesomeIcon icon={faUserPlus} /> Agregar
                              alumno
                            </h5>
                            <input
                              type="text"
                              placeholder="Buscar alumno para agregar..."
                              value={busquedaAlumno}
                              onChange={(e) =>
                                setBusquedaAlumno(e.target.value)
                              }
                              className="input-buscar-alumno"
                            />
                            {busquedaAlumno && (
                              <div className="lista-alumnos-disponibles">
                                {alumnosDisponibles(g).length === 0 ? (
                                  <p className="sin-resultados">
                                    No se encontraron alumnos
                                  </p>
                                ) : (
                                  alumnosDisponibles(g)
                                    .slice(0, 10)
                                    .map((a) => (
                                      <div
                                        key={a._id}
                                        className="alumno-disponible"
                                        onClick={() => {
                                          agregarAlumnoAGrupo(g._id, a._id);
                                          setBusquedaAlumno("");
                                        }}
                                      >
                                        <span>{a.nombre}</span>
                                        <span className="uid-tag">
                                          {a.uidTarjeta}
                                        </span>
                                      </div>
                                    ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Grupos;
