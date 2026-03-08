import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faCalendar } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';
import './Asistencias.css';

const API_URL = 'http://localhost:3000/api/v1';
const SOCKET_URL = 'http://localhost:3000';

const Asistencias = () => {
  const [fechaFiltro, setFechaFiltro] = useState('');
  const [grupoFiltro, setGrupoFiltro] = useState('');
  const [registros, setRegistros] = useState([]);
  const [estadisticasFiltradas, setEstadisticasFiltradas] = useState({
    entradas: 0,
    salidas: 0,
    total: 0
  });

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaFiltro(hoy);
  }, []);

  useEffect(() => {
    if (fechaFiltro) {
      manejarFiltro();
    }
  }, [fechaFiltro]);

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('[Socket] Conectado al servidor en tiempo real');
    });

    socket.on('nueva-asistencia', (asistencia) => {
      console.log('[Socket] Nueva asistencia recibida:', asistencia);
      
      // Verificar si la asistencia es del día actual filtrado
      const fechaAsistencia = new Date(asistencia.fechaHora).toISOString().split('T')[0];
      if (fechaAsistencia === fechaFiltro) {
        // Agregar al inicio de la lista
        setRegistros(prev => [asistencia, ...prev]);
        
        // Actualizar estadísticas
        setEstadisticasFiltradas(prev => ({
          entradas: asistencia.tipo === 'entrada' ? prev.entradas + 1 : prev.entradas,
          salidas: asistencia.tipo === 'salida' ? prev.salidas + 1 : prev.salidas,
          total: prev.total + 1
        }));
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Desconectado del servidor');
    });

    return () => {
      socket.disconnect();
    };
  }, [fechaFiltro]);

  const manejarFiltro = async () => {
    if (!fechaFiltro) {
      alert('Por favor selecciona una fecha');
      return;
    }

    try {
      console.log('[Asistencias] Filtrando por fecha:', fechaFiltro);
      // Enviar fecha como parámetro al servidor para filtrado eficiente
      const respuesta = await fetch(`${API_URL}/asistencias?fecha=${fechaFiltro}`);
      const datos = await respuesta.json();
      
      console.log('[Asistencias] Respuesta recibida:', datos);
      
      if (datos.ok) {
        console.log('[Asistencias] Total registros:', datos.data.length);
        // Los datos ya vienen filtrados del servidor
        const entradas = datos.data.filter(r => r.tipo === 'entrada').length;
        const salidas = datos.data.filter(r => r.tipo === 'salida').length;
        
        setEstadisticasFiltradas({
          entradas,
          salidas,
          total: datos.data.length
        });
        
        setRegistros(datos.data);
      } else {
        console.error('[Asistencias] Error en respuesta:', datos);
      }
    } catch (error) {
      console.error('Error al filtrar asistencias:', error);
    }
  };

  const formatearFechaHora = (cadenaFecha) => {
    const fecha = new Date(cadenaFecha);
    return {
      fecha: fecha.toLocaleDateString('es-MX'),
      hora: fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="asistencias">
      <div className="section-header">
        <h2>Asistencias Diarias por Grupo</h2>
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
          <select
            value={grupoFiltro}
            onChange={(e) => setGrupoFiltro(e.target.value)}
            className="input-field"
          >
            <option value="">Todos los grupos</option>
            <option value="A">Grupo A</option>
            <option value="B">Grupo B</option>
            <option value="C">Grupo C</option>
          </select>
          <button onClick={manejarFiltro} className="btn-filter">
            <FontAwesomeIcon icon={faFilter} />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="mini-stat">
          <div className="mini-stat-label">Entradas</div>
          <div className="mini-stat-value">{estadisticasFiltradas.entradas}</div>
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
                  Selecciona fecha y filtra para ver registros
                </td>
              </tr>
            ) : (
              registros.map((registro, indice) => {
                const { fecha, hora } = formatearFechaHora(registro.fechaHora);
                
                return (
                  <tr key={indice}>
                    <td><strong>{registro.nombre || 'Desconocido'}</strong></td>
                    <td>
                      <span className={`badge badge-${registro.tipo}`}>
                        {registro.tipo}
                      </span>
                    </td>
                    <td>{fecha}</td>
                    <td>{hora}</td>
                    <td><small>{registro.uidTarjeta}</small></td>
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
