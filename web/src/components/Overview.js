import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faArrowUp, faClipboardCheck, faChartBar, faSignOutAlt, faBell, faUserPlus, faCheckCircle, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';
import config, { apiGet } from '../config/api.config';
import './Overview.css';

const Overview = () => {
  const [estadisticas, setEstadisticas] = useState({
    totalRegistros: 0,
    entradasHoy: 0,
    salidasHoy: 0,
    tasaAsistencia: 86.5
  });
  const [registrosRecientes, setRegistrosRecientes] = useState([]);
  const [grupoUsuario, setGrupoUsuario] = useState(null);
  const [grupos, setGrupos] = useState([
    { id: 'A', nombre: 'Grupo A', estudiantes: 25, presentes: 22, ausentes: 3 },
    { id: 'B', nombre: 'Grupo B', estudiantes: 28, presentes: 26, ausentes: 2 },
    { id: 'C', nombre: 'Grupo C', estudiantes: 23, presentes: 20, ausentes: 3 }
  ]);
  const [notificaciones, setNotificaciones] = useState([
    { id: 1, tipo: 'entrada', mensaje: 'Juan Pérez registró entrada', tiempo: '2 min', leido: false },
    { id: 2, tipo: 'salida', mensaje: 'María García registró salida', tiempo: '5 min', leido: false },
    { id: 3, tipo: 'info', mensaje: '3 alumnos sin registro hoy', tiempo: '10 min', leido: true },
    { id: 4, tipo: 'entrada', mensaje: 'Carlos López registró entrada', tiempo: '15 min', leido: true }
  ]);
  const [notificacionesExpandidas, setNotificacionesExpandidas] = useState(false);

  useEffect(() => {
    cargarRegistrosAsistencia();
    cargarGrupoUsuario();
  }, []);

  // Configurar Socket.IO para actualizaciones en tiempo real
  useEffect(() => {
    const socket = io(config.socketUrl);

    socket.on('connect', () => {
      console.log('[Socket] Dashboard conectado en tiempo real');
    });

    socket.on('nueva-asistencia', (asistencia) => {
      console.log('[Socket] Nueva asistencia en dashboard:', asistencia);
      
      // Agregar a registros recientes
      setRegistrosRecientes(prev => [asistencia, ...prev.slice(0, 7)]);
      
      // Actualizar estadísticas si es del día actual
      const hoy = new Date().toISOString().split('T')[0];
      const fechaAsistencia = new Date(asistencia.fechaHora).toISOString().split('T')[0];
      
      if (fechaAsistencia === hoy) {
        setEstadisticas(prev => ({
          ...prev,
          totalRegistros: prev.totalRegistros + 1,
          entradasHoy: asistencia.tipo === 'entrada' ? prev.entradasHoy + 1 : prev.entradasHoy,
          salidasHoy: asistencia.tipo === 'salida' ? prev.salidasHoy + 1 : prev.salidasHoy
        }));
      }
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Dashboard desconectado');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const cargarGrupoUsuario = () => {
    const grupoGuardado = localStorage.getItem('grupoUsuario');
    if (grupoGuardado) {
      setGrupoUsuario(grupoGuardado);
    }
  };

  const asignarAGrupo = (idGrupo) => {
    localStorage.setItem('grupoUsuario', idGrupo);
    setGrupoUsuario(idGrupo);
  };

  const cargarRegistrosAsistencia = async () => {
    try {
      const datos = await apiGet('asistencias');
      
      if (datos.ok) {
        const registros = datos.data;
        const hoy = new Date().toISOString().split('T')[0];
        const registrosHoy = registros.filter(registro => {
          const fechaRegistro = new Date(registro.fechaHora).toISOString().split('T')[0];
          return fechaRegistro === hoy;
        });
        
        setEstadisticas({
          totalRegistros: registros.length,
          entradasHoy: registrosHoy.filter(r => r.tipo === 'entrada').length,
          salidasHoy: registrosHoy.filter(r => r.tipo === 'salida').length,
          tasaAsistencia: 86.5
        });
        
        setRegistrosRecientes(registros.slice(0, 8));
      }
    } catch (error) {
      console.error('Error al cargar asistencias:', error);
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
    <div className="overview">
      <div className="overview-layout">
        <div className="overview-main">
          <div className="welcome-message">
            <h2>Hola, Bienvenido</h2>
            {!grupoUsuario && (
              <p className="assign-hint">Selecciona un grupo para ser responsable</p>
            )}
          </div>

          {/* Tarjetas de Grupos */}
          <div className="groups-section">
            <h3>Mis Grupos</h3>
            <div className="groups-grid">
              {grupos.map(grupo => (
                <div key={grupo.id} className={`group-card ${grupoUsuario === grupo.id ? 'active' : ''}`}>
                  <div className="group-header">
                    <h4>{grupo.nombre}</h4>
                    {grupoUsuario === grupo.id && (
                      <span className="responsible-badge">
                        <FontAwesomeIcon icon={faCheckCircle} /> Responsable
                      </span>
                    )}
                  </div>
                  <div className="group-stats">
                    <div className="group-stat">
                      <span className="stat-number">{grupo.estudiantes}</span>
                      <span className="stat-label">Alumnos</span>
                    </div>
                    <div className="group-stat success">
                      <span className="stat-number">{grupo.presentes}</span>
                      <span className="stat-label">Presentes</span>
                    </div>
                    <div className="group-stat danger">
                      <span className="stat-number">{grupo.ausentes}</span>
                      <span className="stat-label">Ausentes</span>
                    </div>
                  </div>
                  {!grupoUsuario && (
                    <button 
                      className="btn-assign"
                      onClick={() => asignarAGrupo(grupo.id)}
                    >
                      <FontAwesomeIcon icon={faUserPlus} /> Asignarme
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

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
              <a href="#" className="view-all">Ver Todo</a>
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
                      <td colSpan="5" className="loading">No hay registros disponibles</td>
                    </tr>
                  ) : (
                    registrosRecientes.map((registro, indice) => {
                      const { fecha, hora } = formatearFechaHora(registro.fechaHora);
                      return (
                        <tr key={indice}>
                          <td><strong>{registro.uidTarjeta}</strong></td>
                          <td>
                            <span className={`badge badge-${registro.tipo}`}>
                              {registro.tipo}
                            </span>
                          </td>
                          <td>{fecha}</td>
                          <td>{hora}</td>
                          <td><span className="badge badge-entrada">Válido</span></td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel de Notificaciones */}
        <aside className={`notifications-panel ${notificacionesExpandidas ? 'expanded' : ''}`}>
          <div className="notifications-header" onClick={() => setNotificacionesExpandidas(!notificacionesExpandidas)}>
            <h3>
              <FontAwesomeIcon icon={faBell} /> Notificaciones
            </h3>
            <div className="notifications-header-actions">
              <span className="unread-count">{notificaciones.filter(n => !n.leido).length}</span>
              <button className="toggle-notifications">
                <FontAwesomeIcon icon={notificacionesExpandidas ? faChevronUp : faChevronDown} />
              </button>
            </div>
          </div>
          <div className="notifications-list">
            {notificaciones.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.leido ? 'read' : ''}`}>
                <div className={`notif-icon ${notif.tipo}`}>
                  <FontAwesomeIcon icon={
                    notif.tipo === 'entrada' ? faClipboardCheck : 
                    notif.tipo === 'salida' ? faSignOutAlt : faBell
                  } />
                </div>
                <div className="notif-content">
                  <p>{notif.mensaje}</p>
                  <span className="notif-time">{notif.tiempo}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Overview;
