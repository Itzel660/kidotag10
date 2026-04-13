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
import io from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import config, { apiGet, apiPut, apiPost, apiDelete } from "../config/api.config";
import "./PerfilAlumno.css";

const formInicial = {
  nombre: "",
  uidTarjeta: "",
  fechaNacimiento: "",
  genero: "",
  grupo: "",
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

const PerfilAlumno = ({ alumnoIdInicial }) => {
  const { user, token } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [formData, setFormData] = useState(formInicial);
  const [nuevaAlergia, setNuevaAlergia] = useState("");
  const [nuevaCondicion, setNuevaCondicion] = useState("");
  const [tutores, setTutores] = useState([]);
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [mostrarModalTutor, setMostrarModalTutor] = useState(false);
  const [formTutor, setFormTutor] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
  });

  useEffect(() => {
    cargarAlumnos();
    cargarTutores();
    cargarGrupos();
    // Si alumnoIdInicial es null, mostrar modo creación
    if (alumnoIdInicial === null) {
      setCreando(true);
      setAlumnoSeleccionado(null);
      setFormData(formInicial);
      setEditando(true);
    }
  }, [alumnoIdInicial]);

  // Escuchar tags NFC leídos en tiempo real
  useEffect(() => {
    if (!editando) return;

    const socket = io(config.socketUrl);

    socket.on("tag-leido", ({ uidTarjeta }) => {
      setFormData((prev) => ({ ...prev, uidTarjeta }));
    });

    socket.on("tag-ya-registrado", ({ uidTarjeta, nombre }) => {
      alert(`El tag ${uidTarjeta} ya está registrado para el alumno: ${nombre}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [editando]);

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

  const cargarAlumnos = async () => {
    try {
      const datos = await apiGet("alumnos", token);
      if (datos.ok) {
        setAlumnos(datos.data);
        if (datos.data.length > 0 && !alumnoSeleccionado && !creando) {
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

  const inicializarForm = (alumno) => ({
    nombre: alumno.nombre || "",
    uidTarjeta: alumno.uidTarjeta || "",
    fechaNacimiento: alumno.fechaNacimiento
      ? new Date(alumno.fechaNacimiento).toISOString().split("T")[0]
      : "",
    genero: alumno.genero || "",
    grupo: alumno.grupo?._id || "",
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
    setBusquedaTutor(alumno?.tutor?.nombre || "");
    setEditando(false);
    setCreando(false);
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
      if (creando) {
        // Crear nuevo alumno
        await guardarAlumno();
        return;
      }

      const datosEnviar = { ...formData };
      if (datosEnviar.peso === "") delete datosEnviar.peso;
      else datosEnviar.peso = Number(datosEnviar.peso);
      if (datosEnviar.estatura === "") delete datosEnviar.estatura;
      else datosEnviar.estatura = Number(datosEnviar.estatura);
      if (datosEnviar.fechaNacimiento === "")
        delete datosEnviar.fechaNacimiento;

      // Para profesores/admins, incluir también datos básicos y tag
      if (user?.tipo === "profesor") {
        datosEnviar.uidTarjeta = formData.uidTarjeta?.toUpperCase();
        datosEnviar.tutor = formData.tutor?._id || null;

        // Actualizar datos base (nombre, uid, tutor, grupo) via endpoint principal
        await apiPut(`alumnos/${alumnoSeleccionado._id}`, {
          nombre: formData.nombre,
          uidTarjeta: formData.uidTarjeta?.toUpperCase(),
          tutor: formData.tutor?._id || null,
          grupo: formData.grupo || null,
        }, token);
      }

      const datos = await apiPut(
        `alumnos/${alumnoSeleccionado._id}/perfil`,
        datosEnviar,
        token,
      );

      if (datos.ok) {
        alert("Perfil actualizado correctamente");
        setEditando(false);
        // Recargar datos completos del alumno
        const respuestaFinal = await apiGet(
          `alumnos/${alumnoSeleccionado._id}`,
          token,
        );
        const alumnoActualizado = respuestaFinal.ok
          ? respuestaFinal.data
          : datos.data;
        setAlumnoSeleccionado(alumnoActualizado);
        setAlumnos(
          alumnos.map((a) =>
            a._id === alumnoActualizado._id ? alumnoActualizado : a,
          ),
        );
        setFormData(inicializarForm(alumnoActualizado));
      } else {
        alert(datos.error?.mensaje || "Error al actualizar perfil");
      }
    } catch (error) {
      console.error("Error al guardar perfil:", error);
      alert("Error al guardar perfil");
    }
  };

  const guardarAlumno = async () => {
    try {
      const payload = {
        ...formData,
        uidTarjeta: formData.uidTarjeta.toUpperCase(),
      };

      if (!payload.fechaNacimiento) delete payload.fechaNacimiento;
      if (!payload.genero) delete payload.genero;
      if (payload.peso === "") delete payload.peso;
      else payload.peso = Number(payload.peso);
      if (payload.estatura === "") delete payload.estatura;
      else payload.estatura = Number(payload.estatura);

      const datosBase = {
        nombre: payload.nombre,
        uidTarjeta: payload.uidTarjeta,
        fechaNacimiento: payload.fechaNacimiento,
        genero: payload.genero,
        tutor: payload.tutor?._id || null,
        grupo: payload.grupo || null,
      };

      const respuestaBase = await apiPost("alumnos", datosBase, token);

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
          notasEscolares: payload.notasEscolares,
        },
        token,
      );

      if (!respuestaPerfil.ok) {
        alert(respuestaPerfil.error?.mensaje || "Error al guardar perfil");
        return;
      }

      let alumnoActualizado = respuestaPerfil.data;

      const respuestaFinal = await apiGet(
        `alumnos/${alumnoGuardado._id}`,
        token,
      );
      if (respuestaFinal.ok) {
        alumnoActualizado = respuestaFinal.data;
      }

      alert("Alumno registrado correctamente");

      setAlumnos((prev) => [...prev, alumnoActualizado]);
      setAlumnoSeleccionado(alumnoActualizado);
      setFormData(inicializarForm(alumnoActualizado));
      setEditando(false);
      setCreando(false);
    } catch (error) {
      console.error("Error al guardar alumno:", error);
      alert("Error al guardar alumno");
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

  if (creando && editando) {
    return (
      <div className="perfil-container">
        <div className="perfil-header-card">
          <h2>Crear Nuevo Alumno</h2>
        </div>
        <div className="perfil-form">
          <div className="perfil-seccion">
            <h3>Información Básica</h3>
            <div className="perfil-form-grid">
              <div className="campo">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  placeholder="Nombre del alumno"
                />
              </div>
              <div className="campo">
                <label>UID Tarjeta *</label>
                <input
                  type="text"
                  value={formData.uidTarjeta}
                  onChange={(e) =>
                    setFormData({ ...formData, uidTarjeta: e.target.value })
                  }
                  required
                  placeholder="A1B2C3D4"
                />
              </div>
              <div className="campo">
                <label>Grupo</label>
                <select
                  value={formData.grupo}
                  onChange={(e) =>
                    setFormData({ ...formData, grupo: e.target.value })
                  }
                >
                  <option value="">Sin grupo</option>
                  {grupos.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Fecha de Nacimiento</label>
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
                <label>Género</label>
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
                <label>Tutor</label>
                <input
                  type="text"
                  placeholder="Buscar o crear tutor..."
                  value={busquedaTutor}
                  onChange={(e) => setBusquedaTutor(e.target.value)}
                  list="tutores-list"
                />
                <datalist id="tutores-list">
                  {tutores
                    .filter((t) =>
                      t.nombre
                        .toLowerCase()
                        .includes(busquedaTutor.toLowerCase()),
                    )
                    .map((tutor) => (
                      <option
                        key={tutor._id}
                        value={tutor.nombre}
                        onClick={() => setFormData({ ...formData, tutor })}
                      />
                    ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => setMostrarModalTutor(true)}
                  className="btn-crear-tutor"
                >
                  Crear nuevo tutor
                </button>
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
          </div>

          <div className="perfil-acciones">
            <button className="btn-guardar-perfil" onClick={guardarPerfil}>
              <FontAwesomeIcon icon={faSave} /> Guardar Alumno
            </button>
            <button
              className="btn-cancelar"
              onClick={() => {
                setCreando(false);
                setEditando(false);
                setFormData(formInicial);
                if (alumnos.length > 0) {
                  seleccionarAlumno(alumnos[0]);
                }
              }}
            >
              <FontAwesomeIcon icon={faTimes} /> Cancelar
            </button>
          </div>
        </div>

        {mostrarModalTutor && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Crear Nuevo Tutor</h3>
              <div className="perfil-form-grid">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formTutor.nombre}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, nombre: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formTutor.email}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formTutor.password}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, password: e.target.value })
                  }
                />
                <input
                  type="tel"
                  placeholder="Teléfono"
                  value={formTutor.telefono}
                  onChange={(e) =>
                    setFormTutor({ ...formTutor, telefono: e.target.value })
                  }
                />
              </div>
              <div className="modal-buttons">
                <button onClick={crearTutorRapido}>Crear</button>
                <button
                  onClick={() => setMostrarModalTutor(false)}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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
              {alumnoSeleccionado.grupo?.nombre && (
                <span className="perfil-grado">{alumnoSeleccionado.grupo.nombre}</span>
              )}
            </div>
            <button
              className={`btn-editar-perfil ${editando ? "cancelar" : ""}`}
              onClick={() => {
                if (editando) {
                  setFormData(inicializarForm(alumnoSeleccionado));
                } else {
                  setBusquedaTutor(alumnoSeleccionado?.tutor?.nombre || "");
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
              {user?.tipo === "profesor" && (
                <div className="perfil-seccion">
                  <h3>Información Básica</h3>
                  <div className="perfil-form-grid">
                    <div className="campo">
                      <label>Nombre *</label>
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        required
                        placeholder="Nombre del alumno"
                      />
                    </div>
                    <div className="campo">
                      <label>UID Tarjeta *</label>
                      <input
                        type="text"
                        value={formData.uidTarjeta}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            uidTarjeta: e.target.value,
                          })
                        }
                        required
                        placeholder="A1B2C3D4"
                      />
                    </div>
                    <div className="campo">
                      <label>Grupo</label>
                      <select
                        value={formData.grupo}
                        onChange={(e) =>
                          setFormData({ ...formData, grupo: e.target.value })
                        }
                      >
                        <option value="">Sin grupo</option>
                        {grupos.map((g) => (
                          <option key={g._id} value={g._id}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="campo">
                      <label>Fecha de Nacimiento</label>
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
                      <label>Género</label>
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
                      <label>Tutor</label>
                      <input
                        type="text"
                        placeholder="Buscar o crear tutor..."
                        value={busquedaTutor}
                        onChange={(e) => {
                          setBusquedaTutor(e.target.value);
                          const tutorEncontrado = tutores.find(
                            (t) => t.nombre === e.target.value,
                          );
                          if (tutorEncontrado) {
                            setFormData({
                              ...formData,
                              tutor: tutorEncontrado,
                            });
                          } else {
                            setFormData({ ...formData, tutor: null });
                          }
                        }}
                        list="tutores-list-edit"
                      />
                      <datalist id="tutores-list-edit">
                        {tutores
                          .filter((t) =>
                            t.nombre
                              .toLowerCase()
                              .includes(busquedaTutor.toLowerCase()),
                          )
                          .map((tutor) => (
                            <option key={tutor._id} value={tutor.nombre} />
                          ))}
                      </datalist>
                      <button
                        type="button"
                        onClick={() => setMostrarModalTutor(true)}
                        className="btn-crear-tutor"
                      >
                        Crear nuevo tutor
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
                    <span className="dato-label">Grupo</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.grupo?.nombre || "Sin grupo"}
                    </span>
                  </div>
                  <div className="dato">
                    <span className="dato-label">Tutor</span>
                    <span className="dato-valor">
                      {alumnoSeleccionado.tutor?.nombre || "No asignado"}
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

      {mostrarModalTutor && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Crear Nuevo Tutor</h3>
            <div className="perfil-form-grid">
              <input
                type="text"
                placeholder="Nombre"
                value={formTutor.nombre}
                onChange={(e) =>
                  setFormTutor({ ...formTutor, nombre: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                value={formTutor.email}
                onChange={(e) =>
                  setFormTutor({ ...formTutor, email: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Password"
                value={formTutor.password}
                onChange={(e) =>
                  setFormTutor({ ...formTutor, password: e.target.value })
                }
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={formTutor.telefono}
                onChange={(e) =>
                  setFormTutor({ ...formTutor, telefono: e.target.value })
                }
              />
            </div>
            <div className="modal-buttons">
              <button onClick={crearTutorRapido}>Crear</button>
              <button
                onClick={() => setMostrarModalTutor(false)}
                className="btn-cancelar"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfilAlumno;
