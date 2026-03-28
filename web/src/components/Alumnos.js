import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAuth } from "../context/AuthContext";
import {
  faUserPlus,
  faEdit,
  faTrash,
  faSearch,
  faSave,
  faTimes,
  faChild,
  faAllergies,
  faWeight,
  faRulerVertical,
  faHeartbeat,
  faPhone,
  faGraduationCap,
  faIdCard,
  faVenusMars,
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { apiDelete, apiGet, apiPost, apiPut } from "../config/api.config";
import "./PerfilAlumno.css";
import "./Alumnos.css";

const formInicial = {
  nombre: "",
  uidTarjeta: "",
  fechaNacimiento: "",
  genero: "",
  grado: "",
  alergias: [],
  condicionesMedicas: [],
  tipoSangre: "",
  peso: "",
  estatura: "",
  contactoEmergencia: {
    nombre: "",
    telefono: "",
    parentesco: "",
  },
  tutor: null,
  notasEscolares: "",
};

const Alumnos = () => {
  const { token } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tutores, setTutores] = useState([]);
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [mostrarModalTutor, setMostrarModalTutor] = useState(false);
  const [formTutor, setFormTutor] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });
  const [formData, setFormData] = useState(formInicial);
  const [editando, setEditando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nuevaAlergia, setNuevaAlergia] = useState("");
  const [nuevaCondicion, setNuevaCondicion] = useState("");

  useEffect(() => {
    cargarAlumnos();
    cargarTutores();
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

  const crearTutorRapido = async () => {
    if (!formTutor.nombre || !formTutor.email || !formTutor.password) {
      alert("Nombre, email y password son obligatorios");
      return;
    }

    try {
      const respuesta = await apiPost("tutores", formTutor, token);
      if (!respuesta.ok) {
        alert(respuesta.error?.mensaje || "Error al crear tutor");
        return;
      }

      const tutorCreado = respuesta.data;
      setTutores((prev) => [...prev, tutorCreado]);
      setFormData({ ...formData, tutor: tutorCreado });
      setBusquedaTutor(tutorCreado.nombre);
      setMostrarModalTutor(false);
      setFormTutor({ nombre: "", email: "", password: "", telefono: "" });
      alert("Tutor creado y asignado al alumno");
    } catch (error) {
      console.error("Error al crear tutor:", error);
      alert("Error al crear tutor");
    }
  };

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet("alumnos");
      if (datos.ok) {
        setAlumnos(datos.data);
        if (datos.data.length > 0 && !alumnoSeleccionado && !creando) {
          seleccionarAlumno(datos.data[0]);
        }
      }
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
    }
  };

  const inicializarForm = (alumno) => ({
    nombre: alumno.nombre || "",
    uidTarjeta: alumno.uidTarjeta || "",
    fechaNacimiento: alumno.fechaNacimiento
      ? new Date(alumno.fechaNacimiento).toISOString().split("T")[0]
      : "",
    genero: alumno.genero || "",
    grado: alumno.grado || "",
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
    tutor: alumno.tutor || null,
    notasEscolares: alumno.notasEscolares || "",
  });

  const seleccionarAlumno = (alumno) => {
    setAlumnoSeleccionado(alumno);
    setFormData(inicializarForm(alumno));
    setEditando(false);
    setCreando(false);
  };

  const iniciarCreacion = () => {
    setAlumnoSeleccionado(null);
    setFormData(formInicial);
    setEditando(true);
    setCreando(true);
  };

  const cancelarEdicion = () => {
    if (creando) {
      setCreando(false);
      if (alumnos.length > 0) {
        seleccionarAlumno(alumnos[0]);
      } else {
        setAlumnoSeleccionado(null);
        setFormData(formInicial);
        setEditando(false);
      }
      return;
    }

    if (alumnoSeleccionado) {
      setFormData(inicializarForm(alumnoSeleccionado));
    }
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

  const guardarAlumno = async () => {
    try {
      const payload = {
        ...formData,
        uidTarjeta: formData.uidTarjeta.toUpperCase(),
      };

      if (!payload.fechaNacimiento) delete payload.fechaNacimiento;
      if (!payload.genero) delete payload.genero;
      if (!payload.grado) delete payload.grado;
      if (payload.peso === "") delete payload.peso;
      else payload.peso = Number(payload.peso);
      if (payload.estatura === "") delete payload.estatura;
      else payload.estatura = Number(payload.estatura);

      const datosBase = {
        nombre: payload.nombre,
        uidTarjeta: payload.uidTarjeta,
        fechaNacimiento: payload.fechaNacimiento,
        genero: payload.genero,
        grado: payload.grado,
        tutor: payload.tutor?._id || null,
      };

      const respuestaBase = creando
        ? await apiPost("alumnos", datosBase)
        : await apiPut(`alumnos/${alumnoSeleccionado._id}`, datosBase);

      if (!respuestaBase.ok) {
        alert(respuestaBase.error?.mensaje || "Error al guardar alumno");
        return;
      }

      const alumnoGuardado = respuestaBase.data;
      const respuestaPerfil = await apiPut(
        `alumnos/${alumnoGuardado._id}/perfil`,
        {
          alergias: payload.alergias,
          condicionesMedicas: payload.condicionesMedicas,
          tipoSangre: payload.tipoSangre,
          peso: payload.peso,
          estatura: payload.estatura,
          contactoEmergencia: payload.contactoEmergencia,
          notasEscolares: payload.notasEscolares,
          fechaNacimiento: payload.fechaNacimiento,
          genero: payload.genero,
          grado: payload.grado,
        },
      );

      if (!respuestaPerfil.ok) {
        alert(respuestaPerfil.error?.mensaje || "Error al guardar el perfil");
        return;
      }

      let alumnoActualizado = respuestaPerfil.data;

      const respuestaFinal = await apiGet(`alumnos/${alumnoGuardado._id}`);
      if (respuestaFinal.ok) {
        alumnoActualizado = respuestaFinal.data;
      }

      alert(
        creando
          ? "Alumno registrado correctamente"
          : "Alumno actualizado correctamente",
      );

      setAlumnos((prev) => {
        const existe = prev.some((item) => item._id === alumnoActualizado._id);
        if (existe) {
          return prev.map((item) =>
            item._id === alumnoActualizado._id ? alumnoActualizado : item,
          );
        }
        return [...prev, alumnoActualizado].sort((a, b) =>
          a.nombre.localeCompare(b.nombre),
        );
      });

      setAlumnoSeleccionado(alumnoActualizado);
      setFormData(inicializarForm(alumnoActualizado));
      setEditando(false);
      setCreando(false);
    } catch (error) {
      console.error("Error al guardar alumno:", error);
      alert("Error al guardar alumno");
    }
  };

  const eliminarAlumno = async () => {
    if (!alumnoSeleccionado) return;
    if (
      !window.confirm(
        `¿Estás seguro de eliminar a ${alumnoSeleccionado.nombre}?`,
      )
    )
      return;

    try {
      const datos = await apiDelete(`alumnos/${alumnoSeleccionado._id}`);
      if (!datos.ok) {
        alert(datos.error?.mensaje || "Error al eliminar alumno");
        return;
      }

      const restantes = alumnos.filter(
        (item) => item._id !== alumnoSeleccionado._id,
      );
      setAlumnos(restantes);
      setAlumnoSeleccionado(restantes[0] || null);
      setFormData(restantes[0] ? inicializarForm(restantes[0]) : formInicial);
      setEditando(false);
      alert("Alumno eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar alumno:", error);
      alert("Error al eliminar alumno");
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

  const alumnosFiltrados = alumnos.filter((alumno) => {
    const texto = busqueda.toLowerCase();
    const tutorNombre = alumno.tutor?.nombre?.toLowerCase() || "";
    const tutorEmail = alumno.tutor?.email?.toLowerCase() || "";

    return (
      alumno.nombre.toLowerCase().includes(texto) ||
      alumno.uidTarjeta.toLowerCase().includes(texto) ||
      (alumno.grado || "").toLowerCase().includes(texto) ||
      tutorNombre.includes(texto) ||
      tutorEmail.includes(texto)
    );
  });

  const tutoresFiltrados = tutores.filter((tutor) => {
    const texto = busquedaTutor.toLowerCase();
    return (
      tutor.nombre.toLowerCase().includes(texto) ||
      tutor.email.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="alumnos-profile">
      <div className="section-header alumnos-header">
        <div>
          <h2>Gestión de Alumnos</h2>
          <p className="alumnos-subtitle">
            Administra el perfil completo de cada alumno.
          </p>
        </div>
        <button onClick={iniciarCreacion} className="btn-primary">
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Nuevo Alumno</span>
        </button>
      </div>

      <div className="search-bar alumnos-search">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          type="text"
          placeholder="Buscar por nombre, UID o grado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="perfil-tabs alumnos-tabs">
        {alumnosFiltrados.map((alumno) => (
          <button
            key={alumno._id}
            className={`perfil-tab ${alumnoSeleccionado?._id === alumno._id && !creando ? "active" : ""}`}
            onClick={() => seleccionarAlumno(alumno)}
          >
            <FontAwesomeIcon icon={faChild} />
            <span>{alumno.nombre}</span>
          </button>
        ))}
      </div>

      {!alumnoSeleccionado && !creando ? (
        <div className="perfil-container">
          <p className="perfil-sin-datos">
            {alumnos.length === 0
              ? "No hay alumnos registrados."
              : "Selecciona un alumno para ver su perfil."}
          </p>
        </div>
      ) : (
        <div className="perfil-container">
          <div className="perfil-contenido">
            <div className="perfil-header-card">
              <div className="perfil-avatar">
                {(formData.nombre || "N").charAt(0).toUpperCase()}
              </div>
              <div className="perfil-header-info">
                <h2>{formData.nombre || "Nuevo Alumno"}</h2>
                {!!formData.fechaNacimiento && !creando && (
                  <span className="perfil-edad">
                    {calcularEdad(formData.fechaNacimiento)} años
                  </span>
                )}
                {!!formData.grado && (
                  <span className="perfil-grado">{formData.grado}</span>
                )}
              </div>
              <div className="alumnos-header-actions">
                {!creando && alumnoSeleccionado && !editando && (
                  <button
                    className="btn-editar-perfil danger"
                    onClick={eliminarAlumno}
                  >
                    <FontAwesomeIcon icon={faTrash} /> Eliminar
                  </button>
                )}
                <button
                  className={`btn-editar-perfil ${editando ? "cancelar" : ""}`}
                  onClick={() => {
                    if (editando) {
                      cancelarEdicion();
                    } else {
                      setEditando(true);
                    }
                  }}
                >
                  <FontAwesomeIcon icon={editando ? faTimes : faEdit} />
                  {editando ? "Cancelar" : "Editar Perfil"}
                </button>
              </div>
            </div>

            {editando ? (
              <div className="perfil-form">
                <div className="perfil-seccion">
                  <h3>Información Personal</h3>
                  <div className="perfil-form-grid">
                    <div className="campo">
                      <label>Nombre Completo</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        placeholder="Ej: Juan Pérez García"
                      />
                    </div>
                    <div className="campo">
                      <label>
                        <FontAwesomeIcon icon={faIdCard} /> UID de Tarjeta
                      </label>
                      <input
                        type="text"
                        value={formData.uidTarjeta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            uidTarjeta: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="Ej: ABCD1234"
                      />
                    </div>
                    <div className="campo">
                      <label>
                        <FontAwesomeIcon icon={faCalendarDays} /> Fecha de
                        Nacimiento
                      </label>
                      <input
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            fechaNacimiento: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="campo">
                      <label>
                        <FontAwesomeIcon icon={faVenusMars} /> Género
                      </label>
                      <select
                        value={formData.genero}
                        onChange={(e) =>
                          setFormData({ ...formData, genero: e.target.value })
                        }
                      >
                        <option value="">Seleccionar</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    <div className="campo">
                      <label>
                        <FontAwesomeIcon icon={faGraduationCap} /> Grado
                      </label>
                      <input
                        type="text"
                        value={formData.grado}
                        placeholder="Ej: 1° Primaria"
                        onChange={(e) =>
                          setFormData({ ...formData, grado: e.target.value })
                        }
                      />
                    </div>
                    <div className="campo tutor-asociado">
                      <label>Tutor asociado</label>
                      <input
                        type="text"
                        placeholder="Buscar tutor por nombre o email..."
                        value={busquedaTutor || formData.tutor?.nombre || ""}
                        onChange={(e) => {
                          setBusquedaTutor(e.target.value);
                          if (!e.target.value) {
                            setFormData({ ...formData, tutor: null });
                          }
                        }}
                      />

                      {formData.tutor && (
                        <div className="tutor-info-seleccionado">
                          <strong>{formData.tutor.nombre}</strong>
                          <span>{formData.tutor.email}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, tutor: null });
                              setBusquedaTutor("");
                            }}
                          >
                            Quitar
                          </button>
                        </div>
                      )}

                      {busquedaTutor && tutoresFiltrados.length > 0 && (
                        <div className="tutor-sugerencias">
                          {tutoresFiltrados.map((tutor) => (
                            <div
                              key={tutor._id}
                              className="tutor-item"
                              onClick={() => {
                                setFormData({ ...formData, tutor });
                                setBusquedaTutor(tutor.nombre);
                              }}
                            >
                              <strong>{tutor.nombre}</strong>
                              <span>{tutor.email}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {busquedaTutor && tutoresFiltrados.length === 0 && (
                        <div className="tutor-sugerencias vacio">
                          <span>No se encontró ningún tutor.</span>
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={() => setMostrarModalTutor(true)}
                          >
                            Crear un tutor nuevo
                          </button>
                        </div>
                      )}

                      {!busquedaTutor && (
                        <button
                          type="button"
                          className="btn-secondary crear-tutor-directo"
                          onClick={() => setMostrarModalTutor(true)}
                        >
                          Crear tutor nuevo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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
                          setFormData({
                            ...formData,
                            tipoSangre: e.target.value,
                          })
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
                        <span
                          key={`${alergia}-${index}`}
                          className="chip alergia-chip"
                        >
                          {alergia}
                          <button
                            type="button"
                            onClick={() => eliminarAlergia(index)}
                          >
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
                        <span
                          key={`${condicion}-${index}`}
                          className="chip condicion-chip"
                        >
                          {condicion}
                          <button
                            type="button"
                            onClick={() => eliminarCondicion(index)}
                          >
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
                      rows="4"
                      maxLength="1000"
                      placeholder="Observaciones escolares, adaptación, necesidades de aprendizaje, etc."
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
                  <button
                    className="btn-guardar-perfil"
                    type="button"
                    onClick={guardarAlumno}
                  >
                    <FontAwesomeIcon icon={faSave} />{" "}
                    {creando ? "Registrar Alumno" : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="perfil-vista">
                <div className="perfil-seccion">
                  <h3>Información Personal</h3>
                  <div className="perfil-datos-grid">
                    <div className="dato">
                      <span className="dato-label">Nombre</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.nombre || "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">UID Tarjeta</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.uidTarjeta || "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Fecha de Nacimiento</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.fechaNacimiento
                          ? new Date(
                              alumnoSeleccionado.fechaNacimiento,
                            ).toLocaleDateString("es-MX")
                          : "No registrada"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Género</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.genero
                          ? alumnoSeleccionado.genero.charAt(0).toUpperCase() +
                            alumnoSeleccionado.genero.slice(1)
                          : "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Grado</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.grado || "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Tutor</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.tutor
                          ? `${alumnoSeleccionado.tutor.nombre} (${alumnoSeleccionado.tutor.email})`
                          : "No asignado"}
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
                        {alumnoSeleccionado?.tipoSangre || "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Peso</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.peso
                          ? `${alumnoSeleccionado.peso} kg`
                          : "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Estatura</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.estatura
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
                      {alumnoSeleccionado?.alergias?.length > 0 ? (
                        <div className="chips-container">
                          {alumnoSeleccionado.alergias.map((item, index) => (
                            <span
                              key={`${item}-${index}`}
                              className="chip alergia-chip vista"
                            >
                              {item}
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
                      {alumnoSeleccionado?.condicionesMedicas?.length > 0 ? (
                        <div className="chips-container">
                          {alumnoSeleccionado.condicionesMedicas.map(
                            (item, index) => (
                              <span
                                key={`${item}-${index}`}
                                className="chip condicion-chip vista"
                              >
                                {item}
                              </span>
                            ),
                          )}
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
                        {alumnoSeleccionado?.contactoEmergencia?.nombre ||
                          "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Teléfono</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.contactoEmergencia?.telefono ||
                          "No registrado"}
                      </span>
                    </div>
                    <div className="dato">
                      <span className="dato-label">Parentesco</span>
                      <span className="dato-valor">
                        {alumnoSeleccionado?.contactoEmergencia?.parentesco ||
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
                    {alumnoSeleccionado?.notasEscolares ||
                      "Sin notas registradas."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarModalTutor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Crear Tutor</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formTutor.nombre}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formTutor.email}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={formTutor.password}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={formTutor.telefono}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, telefono: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMostrarModalTutor(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={crearTutorRapido}
              >
                Crear y asignar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alumnos;
