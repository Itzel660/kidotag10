import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserPlus,
  faEdit,
  faTrash,
  faSearch,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.config";
import { useAuth } from "../context/AuthContext";
import "./Profesores.css";

const Profesores = () => {
  const { token } = useAuth();
  const [profesores, setProfesores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    especialidad: "",
    esAdmin: false,
  });

  useEffect(() => {
    cargarProfesores();
  }, []);

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

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (editando && !payload.password) {
        delete payload.password;
      }

      const datos = editando
        ? await apiPut(`profesores/${editando._id}`, payload, token)
        : await apiPost("profesores", payload, token);

      if (datos.ok) {
        alert(editando ? "Profesor actualizado" : "Profesor registrado");
        resetFormulario();
        cargarProfesores();
      } else {
        alert(datos.error?.mensaje || "Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar profesor");
    }
  };

  const editar = (profesor) => {
    setEditando(profesor);
    setFormData({
      nombre: profesor.nombre,
      email: profesor.email,
      password: "",
      telefono: profesor.telefono || "",
      especialidad: profesor.especialidad || "",
      esAdmin: profesor.esAdmin || false,
    });
    setMostrarFormulario(true);
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;
    try {
      const datos = await apiDelete(`profesores/${id}`, token);
      if (datos.ok) {
        alert("Profesor eliminado");
        cargarProfesores();
      } else {
        alert(datos.error?.mensaje || "Error al eliminar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar profesor");
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: "",
      email: "",
      password: "",
      telefono: "",
      especialidad: "",
      esAdmin: false,
    });
    setEditando(null);
    setMostrarFormulario(false);
  };

  const profesoresFiltrados = profesores.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.email?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="profesores-container">
      <div className="profesores-header">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar profesor..."
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
          <FontAwesomeIcon icon={faUserPlus} /> Nuevo Profesor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-container">
          <h3>{editando ? "Editar Profesor" : "Nuevo Profesor"}</h3>
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
              <div className="form-group">
                <label>Especialidad</label>
                <input
                  type="text"
                  value={formData.especialidad}
                  onChange={(e) =>
                    setFormData({ ...formData, especialidad: e.target.value })
                  }
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.esAdmin}
                    onChange={(e) =>
                      setFormData({ ...formData, esAdmin: e.target.checked })
                    }
                  />
                  <FontAwesomeIcon icon={faShieldAlt} /> Administrador
                </label>
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
              <th>Especialidad</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No hay profesores registrados
                </td>
              </tr>
            ) : (
              profesoresFiltrados.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.nombre}</strong>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.telefono || "-"}</td>
                  <td>{p.especialidad || "-"}</td>
                  <td>
                    {p.esAdmin ? (
                      <span className="badge badge-admin">
                        <FontAwesomeIcon icon={faShieldAlt} /> Admin
                      </span>
                    ) : (
                      <span className="badge badge-profesor">Profesor</span>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => editar(p)}
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => eliminar(p._id, p.nombre)}
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

export default Profesores;
