import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faEdit, faTrash, faSearch } from '@fortawesome/free-solid-svg-icons';
import { getApiUrl, apiGet, apiPost, apiPut, apiDelete } from '../config/api.config';
import './Alumnos.css';

const Alumnos = () => {
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', uidTarjeta: '' });

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet('alumnos');
      if (datos.ok) {
        setAlumnos(datos.data);
      }
    } catch (error) {
      console.error('Error al cargar alumnos:', error);
    }
  };

  const guardarAlumno = async (e) => {
    e.preventDefault();
    
    try {
      const datos = alumnoEditando
        ? await apiPut(`alumnos/${alumnoEditando._id}`, formData)
        : await apiPost('alumnos', formData);
      
      if (datos.ok) {
        alert(alumnoEditando ? 'Alumno actualizado correctamente' : 'Alumno registrado correctamente');
        setFormData({ nombre: '', uidTarjeta: '' });
        setAlumnoEditando(null);
        setMostrarFormulario(false);
        cargarAlumnos();
      } else {
        alert(datos.error.mensaje || 'Error al guardar alumno');
      }
    } catch (error) {
      console.error('Error al guardar alumno:', error);
      alert('Error al guardar alumno');
    }
  };

  const editarAlumno = (alumno) => {
    setAlumnoEditando(alumno);
    setFormData({ nombre: alumno.nombre, uidTarjeta: alumno.uidTarjeta });
    setMostrarFormulario(true);
  };

  const eliminarAlumno = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${nombre}?`)) return;

    try {
      const datos = await apiDelete(`alumnos/${id}`);
      
      if (datos.ok) {
        alert('Alumno eliminado correctamente');
        cargarAlumnos();
      } else {
        alert(datos.error.mensaje || 'Error al eliminar alumno');
      }
    } catch (error) {
      console.error('Error al eliminar alumno:', error);
      alert('Error al eliminar alumno');
    }
  };

  const cancelarFormulario = () => {
    setFormData({ nombre: '', uidTarjeta: '' });
    setAlumnoEditando(null);
    setMostrarFormulario(false);
  };

  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    alumno.uidTarjeta.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="alumnos">
      <div className="section-header">
        <h2>Gestión de Alumnos</h2>
        <button 
          onClick={() => setMostrarFormulario(!mostrarFormulario)} 
          className="btn-primary"
        >
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-container">
          <h3>{alumnoEditando ? 'Editar Alumno' : 'Registrar Nuevo Alumno'}</h3>
          <form onSubmit={guardarAlumno}>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                placeholder="Ej: Juan Pérez García"
              />
            </div>
            <div className="form-group">
              <label>UID de Tarjeta NFC</label>
              <input
                type="text"
                value={formData.uidTarjeta}
                onChange={(e) => setFormData({ ...formData, uidTarjeta: e.target.value.toUpperCase() })}
                required
                placeholder="Ej: ABCD1234"
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {alumnoEditando ? 'Actualizar' : 'Registrar'}
              </button>
              <button type="button" onClick={cancelarFormulario} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="search-bar">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre o UID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>UID Tarjeta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="3" className="loading">
                  {busqueda ? 'No se encontraron alumnos' : 'No hay alumnos registrados'}
                </td>
              </tr>
            ) : (
              alumnosFiltrados.map((alumno) => (
                <tr key={alumno._id}>
                  <td><strong>{alumno.nombre}</strong></td>
                  <td><code>{alumno.uidTarjeta}</code></td>
                  <td className="action-buttons">
                    <button 
                      onClick={() => editarAlumno(alumno)}
                      className="btn-edit"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => eliminarAlumno(alumno._id, alumno.nombre)}
                      className="btn-delete"
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

      <div className="stats-summary">
        <p>Total de alumnos registrados: <strong>{alumnos.length}</strong></p>
      </div>
    </div>
  );
};

export default Alumnos;
