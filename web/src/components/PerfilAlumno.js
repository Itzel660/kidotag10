import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChild,
  faEdit,
  faSave,
  faTimes,
  faAllergies,
  faWeight,
  faRulerVertical,
  faHeartbeat,
  faPhone,
  faGraduationCap,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../context/AuthContext";
import { apiGet, apiPut } from "../config/api.config";
import "./PerfilAlumno.css";

const PerfilAlumno = ({ alumnoIdInicial }) => {
  const { user, token } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({});
  const [nuevaAlergia, setNuevaAlergia] = useState("");
  const [nuevaCondicion, setNuevaCondicion] = useState("");

  useEffect(() => {
    cargarAlumnos();
  }, []);

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet("alumnos", token);
      if (datos.ok) {
        setAlumnos(datos.data);
        if (datos.data.length > 0 && !alumnoSeleccionado) {
          const inicial = alumnoIdInicial
            ? datos.data.find((a) => a._id === alumnoIdInicial)
            : null;
          const seleccion = inicial || datos.data[0];
          setAlumnoSeleccionado(seleccion);
          setFormData(inicializarForm(seleccion));
        }
      }
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const inicializarForm = (alumno) => ({
    fechaNacimiento: alumno.fechaNacimiento
      ? new Date(alumno.fechaNacimiento).toISOString().split("T")[0]
      : "",
    genero: alumno.genero || "",
    alergias: alumno.alergias || [],
    condicionesMedicas: alumno.condicionesMedicas || [],
    tipoSangre: alumno.tipoSangre || "",
    peso: alumno.peso || "",
    estatura: alumno.estatura || "",
    contactoEmergencia: {
      nombre: alumno.contactoEmergencia?.nombre || "",
      telefono: alumno.contactoEmergencia?.telefono || "",
      parentesco: alumno.contactoEmergencia?.parentesco || "",
    },
    grado: alumno.grado || "",
    notasEscolares: alumno.notasEscolares || "",
  });

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setFormData(inicializarForm(alumno));
    setEditando(false);
  };

  const agregarAlergia = () => {
    const texto = nuevaAlergia.trim();
    if (texto && !formData.alergias.includes(texto)) {
      setFormData({ ...formData, alergias: [...formData.alergias, texto] });
      setNuevaAlergia("");
    }
  };

  const eliminarAlergia = (index) => {
    setFormData({
      ...formData,
      alergias: formData.alergias.filter((_, i) => i !== index),
    });
  };

  const agregarCondicion = () => {
    const texto = nuevaCondicion.trim();
    if (texto && !formData.condicionesMedicas.includes(texto)) {
      setFormData({
        ...formData,
        condicionesMedicas: [...formData.condicionesMedicas, texto],
      });
      setNuevaCondicion("");
    }
  };

  const eliminarCondicion = (index) => {
    setFormData({
      ...formData,
      condicionesMedicas: formData.condicionesMedicas.filter(
        (_, i) => i !== index,
      ),
    });
  };

  const guardarPerfil = async () => {
    try {
      const datosEnviar = { ...formData };
      if (datosEnviar.peso === "") delete datosEnviar.peso;
      else datosEnviar.peso = Number(datosEnviar.peso);
      if (datosEnviar.estatura === "") delete datosEnviar.estatura;
      else datosEnviar.estatura = Number(datosEnviar.estatura);
      if (datosEnviar.fechaNacimiento === "")
        delete datosEnviar.fechaNacimiento;

      const datos = await apiPut(
        `alumnos/${alumnoSeleccionado._id}/perfil`,
        datosEnviar,
        token,
      );

      if (datos.ok) {
        alert("Perfil actualizado correctamente");
        setEditando(false);
        setAlumnoSeleccionado(datos.data);
        setAlumnos(
          alumnos.map((a) => (a._id === datos.data._id ? datos.data : a)),
        );
        setFormData(inicializarForm(datos.data));
      } else {
        alert(datos.error?.mensaje || "Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Error al guardar perfil");
    }
  };

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  if (alumnos.length === 0) {
    return (
      <div className="perfil-container">
        <p className="perfil-sin-datos">No tienes alumnos asociados.</p>
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <div className="perfil-tabs">
        {alumnos.map((alumno) => (
          <button
            key={alumno._id}
            className={`perfil-tab ${alumnoSeleccionado?._id === alumno._id ? "active" : ""}`}
            onClick={() => seleccionarAlumno(alumno)}
          >
            <FontAwesomeIcon icon={faChild} />
            <span>{alumno.nombre}</span>
          </button>
        ))}
      </div>

      {alumnoSeleccionado && (
        <div className="perfil-contenido">
          <div className="perfil-header-card">
            <div className="perfil-avatar">
              {alumnoSeleccionado.nombre.charAt(0).toUpperCase()}
            </div>
            <div className="perfil-header-info">
              <h2>{alumnoSeleccionado.nombre}</h2>
              {alumnoSeleccionado.fechaNacimiento && (
                <span className="perfil-edad">
                  {calcularEdad(alumnoSeleccionado.fechaNacimiento)} años
                </span>
              )}
              {alumnoSeleccionado.grado && (
                <span className="perfil-grado">{alumnoSeleccionado.grado}</span>
              )}
            </div>
            <button
              className={`btn-editar-perfil ${editando ? "cancelar" : ""}`}
              onClick={() => {
                if (editando) {
                  setFormData(inicializarForm(alumnoSeleccionado));
                }
                setEditando(!editando);
              }}
            >
              <FontAwesomeIcon icon={editando ? faTimes : faEdit} />
              {editando ? "Cancelar" : "Editar Perfil"}
            </button>
          </div>

          {editando ? (
            <div className="perfil-form">
              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faHeartbeat} /> Información Médica
                </h3>
                <div className="perfil-form-grid">
                  <div className="campo">
                    <label>Tipo de Sangre</label>
                    <select
                      value={formData.tipoSangre}
                      onChange={(e) =>
                        setFormData({ ...formData, tipoSangre: e.target.value })
                      }
                    >
                      <option value="">Seleccionar</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="campo">
                    <label>
                      <FontAwesomeIcon icon={faWeight} /> Peso (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.peso}
                      placeholder="Ej: 25.5"
                      onChange={(e) =>
                        setFormData({ ...formData, peso: e.target.value })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>
                      <FontAwesomeIcon icon={faRulerVertical} /> Estatura (cm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.estatura}
                      placeholder="Ej: 120"
                      onChange={(e) =>
                        setFormData({ ...formData, estatura: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="campo-lista">
                  <label>
                    <FontAwesomeIcon icon={faAllergies} /> Alergias
                  </label>
                  <div className="chips-container">
                    {formData.alergias.map((alergia, index) => (
                      <span key={index} className="chip alergia-chip">
                        {alergia}
                        <button onClick={() => eliminarAlergia(index)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="agregar-chip">
                    <input
                      type="text"
                      value={nuevaAlergia}
                      placeholder="Agregar alergia..."
                      onChange={(e) => setNuevaAlergia(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), agregarAlergia())
                      }
                    />
                    <button type="button" onClick={agregarAlergia}>
                      Agregar
                    </button>
                  </div>
                </div>

                <div className="campo-lista">
                  <label>Condiciones Médicas</label>
                  <div className="chips-container">
                    {formData.condicionesMedicas.map((condicion, index) => (
                      <span key={index} className="chip condicion-chip">
                        {condicion}
                        <button onClick={() => eliminarCondicion(index)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="agregar-chip">
                    <input
                      type="text"
                      value={nuevaCondicion}
                      placeholder="Agregar condición..."
                      onChange={(e) => setNuevaCondicion(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), agregarCondicion())
                      }
                    />
                    <button type="button" onClick={agregarCondicion}>
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faPhone} /> Contacto de Emergencia
                </h3>
                <div className="perfil-form-grid">
                  <div className="campo">
                    <label>Nombre</label>
                    <input
                      type="text"
                      value={formData.contactoEmergencia.nombre}
                      placeholder="Nombre del contacto"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactoEmergencia: {
                            ...formData.contactoEmergencia,
                            nombre: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      value={formData.contactoEmergencia.telefono}
                      placeholder="Teléfono"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactoEmergencia: {
                            ...formData.contactoEmergencia,
                            telefono: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="campo">
                    <label>Parentesco</label>
                    <input
                      type="text"
                      value={formData.contactoEmergencia.parentesco}
                      placeholder="Ej: Abuelo/a, Tío/a"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactoEmergencia: {
                            ...formData.contactoEmergencia,
                            parentesco: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faGraduationCap} /> Notas Escolares
                </h3>
                <div className="campo">
                  <textarea
                    value={formData.notasEscolares}
                    placeholder="Observaciones escolares, necesidades especiales de aprendizaje, etc."
                    rows="4"
                    maxLength="1000"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notasEscolares: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="perfil-acciones">
                <button className="btn-guardar-perfil" onClick={guardarPerfil}>
                  <FontAwesomeIcon icon={faSave} /> Guardar Cambios
                </button>
              </div>
            </div>
          ) : (
            <div className="perfil-vista">
              <div className="perfil-seccion">
                <h3>Información Personal</h3>
                <div className="perfil-datos-grid">
                  <div className="dato">
                    <span className="dato-label">Fecha de Nacimiento</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.fechaNacimiento
                        ? new Date(
                            alumnoSeleccionado.fechaNacimiento,
                          ).toLocaleDateString("es-MX")
                        : "No registrada"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">Género</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.genero
                        ? alumnoSeleccionado.genero.charAt(0).toUpperCase() +
                          alumnoSeleccionado.genero.slice(1)
                        : "No registrado"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">Grado</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.grado || "No registrado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faHeartbeat} /> Información Médica
                </h3>
                <div className="perfil-datos-grid">
                  <div className="dato">
                    <span className="dato-label">Tipo de Sangre</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.tipoSangre || "No registrado"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">
                      <FontAwesomeIcon icon={faWeight} /> Peso
                    </span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.peso
                        ? `${alumnoSeleccionado.peso} kg`
                        : "No registrado"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">
                      <FontAwesomeIcon icon={faRulerVertical} /> Estatura
                    </span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.estatura
                        ? `${alumnoSeleccionado.estatura} cm`
                        : "No registrada"}
                    </span>
                  </div>
                </div>
                <div className="perfil-listas">
                  <div className="lista-item">
                    <span className="dato-label">
                      <FontAwesomeIcon icon={faAllergies} /> Alergias
                    </span>
                    {alumnoSeleccionado.alergias?.length > 0 ? (
                      <div className="chips-container">
                        {alumnoSeleccionado.alergias.map((a, i) => (
                          <span key={i} className="chip alergia-chip vista">
                            {a}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="dato-valor sin-datos">
                        Ninguna registrada
                      </span>
                    )}
                  </div>
                  <div className="lista-item">
                    <span className="dato-label">Condiciones Médicas</span>
                    {alumnoSeleccionado.condicionesMedicas?.length > 0 ? (
                      <div className="chips-container">
                        {alumnoSeleccionado.condicionesMedicas.map((c, i) => (
                          <span key={i} className="chip condicion-chip vista">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="dato-valor sin-datos">
                        Ninguna registrada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faPhone} /> Contacto de Emergencia
                </h3>
                <div className="perfil-datos-grid">
                  <div className="dato">
                    <span className="dato-label">Nombre</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.contactoEmergencia?.nombre ||
                        "No registrado"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">Teléfono</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.contactoEmergencia?.telefono ||
                        "No registrado"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">Parentesco</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.contactoEmergencia?.parentesco ||
                        "No registrado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="perfil-seccion">
                <h3>
                  <FontAwesomeIcon icon={faGraduationCap} /> Notas Escolares
                </h3>
                <p className="notas-escolares-texto">
                  {alumnoSeleccionado.notasEscolares ||
                    "Sin notas registradas."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerfilAlumno;
