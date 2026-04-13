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

const Alumnos = ({
  onEditarAlumno = () => {},
  onCrearAlumno = () => {},
} = {}) => {
  const { token, user } = useAuth();
  const [alumnos, setAlumnos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [tutores, setTutores] = useState([]);
  const [busquedaTutor, setBusquedaTutor] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
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
    cargarGrupos();
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
      let endpoint = "alumnos";
      if (user.tipo === "admin") {
        endpoint = "alumnos?filterByGroup=true"; // Admin puede filtrar por grupo
      }
      const datos = await apiGet(endpoint, token);
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

  const renderTablaAlumnos = () => {
    if (!user) {
      return <p>Error: Usuario no autenticado.</p>;
    }

    if (user.tipo === "tutor") {
      // Para tutores, mostrar la vista original
      return <div>{/* Contenido original para tutores */}</div>;
    } else {
      // Filtrar alumnos según grupo seleccionado (solo para admin)
      let alumnosFiltradosPorGrupo = alumnosFiltrados;
      if (user.esAdmin && grupoSeleccionado) {
        alumnosFiltradosPorGrupo = alumnosFiltrados.filter(
          (alumno) => alumno.grupo?._id === grupoSeleccionado,
        );
      }

      const esAdmin = user.esAdmin;
      const esProfesor = user.tipo === "profesor" && !user.esAdmin;
      const grupoProfesor = esProfesor && grupos.length > 0 ? grupos[0] : null;

      // Para profesores y admins, mostrar tabla
      return (
        <div>
          <div className="profesores-header">
            <div className="search-container">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {esAdmin && (
              <select
                className="input-field grupo-select"
                value={grupoSeleccionado}
                onChange={(e) => setGrupoSeleccionado(e.target.value)}
              >
                <option value="">Todos los grupos</option>
                {grupos.map((grupo) => (
                  <option key={grupo._id} value={grupo._id}>
                    {grupo.nombre}
                  </option>
                ))}
              </select>
            )}
            {esProfesor && grupoProfesor && (
              <span className="grupo-badge-header">
                {grupoProfesor.nombre}
              </span>
            )}
            <button className="btn-primary" onClick={onCrearAlumno}>
              <FontAwesomeIcon icon={faUserPlus} /> Nuevo Alumno
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>UID Tarjeta</th>
                  <th>Grupo</th>
                  <th>Tutor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnosFiltradosPorGrupo.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty">
                      No hay alumnos registrados
                    </td>
                  </tr>
                ) : (
                  alumnosFiltradosPorGrupo.map((alumno) => (
                    <tr key={alumno._id}>
                      <td>
                        <strong>{alumno.nombre}</strong>
                      </td>
                      <td>{alumno.uidTarjeta}</td>
                      <td>{alumno.grupo?.nombre || "Sin grupo"}</td>
                      <td>{alumno.tutor?.nombre || "-"}</td>
                      <td className="actions">
                        <button
                          className="btn-icon btn-edit"
                          onClick={() => onEditarAlumno(alumno._id)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="btn-icon btn-delete"
                          onClick={() => {
                            setAlumnoSeleccionado(alumno);
                            eliminarAlumno(alumno._id, alumno.nombre);
                          }}
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
    }
  };

  const inicializarForm = (alumno) => ({
    nombre: alumno.nombre || "",
    uidTarjeta: alumno.uidTarjeta || "",
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

  const eliminarAlumno = async (id = null, nombre = null) => {
    const alumnoId = id || alumnoSeleccionado?._id;
    const alumnoNombre = nombre || alumnoSeleccionado?.nombre;

    if (!alumnoId) return;
    if (!window.confirm(`¿Estás seguro de eliminar a ${alumnoNombre}?`)) return;

    try {
      const datos = await apiDelete(`alumnos/${alumnoId}`);
      if (!datos.ok) {
        alert(datos.error?.mensaje || "Error al eliminar alumno");
        return;
      }

      const restantes = alumnos.filter((item) => item._id !== alumnoId);
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

  return <div className="alumnos-container">{renderTablaAlumnos()}</div>;
};

export default Alumnos;
