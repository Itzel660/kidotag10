import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faEdit,
  faTrash,
  faSearch,
  faUserGraduate,
} from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import { obtenerNombreCompletoAlumno } from "../utils/alumnoNombre";
import "./Tutores.css";

const Tutores = () => {
  const { token } = useAuth();
  const [tutores, setTutores] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    alumnos: [],
  });

  useEffect(() => {
    cargarTutores();
    cargarAlumnos();
  }, []);

  const cargarTutores = async () => {
    try {
      const datos = await apiGet("tutores", token);
      if (datos.ok) {
        setTutores(datos.data);
      }
    } catch (error) {
      console.error("Error al cargar tutores:", error);
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
      if (editando && !payload.password) {
        delete payload.password;
      }

      const datos = editando
        ? await apiPut(`tutores/${editando._id}`, payload, token)
        : await apiPost("tutores", payload, token);

      if (datos.ok) {
        alert(editando ? "Tutor actualizado" : "Tutor registrado");
        resetFormulario();
        cargarTutores();
      } else {
        alert(datos.error?.mensaje || "Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar tutor");
    }
  };

  const editar = (tutor) => {
    setEditando(tutor);
    setFormData({
      nombre: tutor.nombre,
      email: tutor.email,
      password: "",
      telefono: tutor.telefono || "",
      alumnos:
        tutor.alumnos?.map((a) => (typeof a === "string" ? a : a._id)) || [],
    });
    setMostrarFormulario(true);
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    try {
      const datos = await apiDelete(`tutores/${id}`, token);
      if (datos.ok) {
        alert("Tutor eliminado");
        cargarTutores();
      } else {
        alert(datos.error?.mensaje || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar tutor");
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: "",
      email: "",
      password: "",
      telefono: "",
      alumnos: [],
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  const toggleAlumno = (alumnoId) => {
    setFormData((prev) => ({
      ...prev,
      alumnos: prev.alumnos.includes(alumnoId)
        ? prev.alumnos.filter((id) => id !== alumnoId)
        : [...prev.alumnos, alumnoId],
    }));
  };

  const tutoresFiltrados = tutores.filter(
    (t) =>
      t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const obtenerNombresAlumnos = (alumnosArr) => {
    if (!alumnosArr || alumnosArr.length === 0) return "-";
    return alumnosArr
      .map((a) =>
        typeof a === "object"
          ? a.nombre
          : alumnos.find((al) => al._id === a)?.nombre || a,
      )
      .join(", ");
  };

  return (
    <div className="tutores-container">
      <div className="tutores-header">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar tutor..."
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
          <FontAwesomeIcon icon={faUserPlus} /> Nuevo Tutor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-container">
          <h3>{editando ? "Editar Tutor" : "Nuevo Tutor"}</h3>
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
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  {editando
                    ? "Password (dejar vacío para no cambiar)"
                    : "Password *"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required={!editando}
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group alumnos-selector">
              <label>
                <FontAwesomeIcon icon={faUserGraduate} /> Alumnos asociados
              </label>
              <div className="alumnos-grid">
                {alumnos.map((alumno) => (
                  <label
                    key={alumno._id}
                    className={`alumno-chip ${formData.alumnos.includes(alumno._id) ? "selected" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.alumnos.includes(alumno._id)}
                      onChange={() => toggleAlumno(alumno._id)}
                    />
                    {obtenerNombreCompletoAlumno(alumno)}
                  </label>
                ))}
                {alumnos.length === 0 && (
                  <span className="no-alumnos">No hay alumnos registrados</span>
                )}
              </div>
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
                {editando ? "Actualizar" : "Registrar"}
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
              <th>Email</th>
              <th>Teléfono</th>
              <th>Alumnos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tutoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty">
                  No hay tutores registrados
                </td>
              </tr>
            ) : (
              tutoresFiltrados.map((t) => (
                <tr key={t._id}>
                  <td data-label="Nombre">
                    <strong>{t.nombre}</strong>
                  </td>
                  <td data-label="Email">{t.email}</td>
                  <td data-label="Teléfono">{t.telefono || "-"}</td>
                  <td data-label="Alumnos">
                    {obtenerNombresAlumnos(t.alumnos)}
                  </td>
                  <td data-label="Acciones" className="actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => editar(t)}
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => eliminar(t._id, t.nombre)}
                      title="Eliminar"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
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

export default Tutores;
