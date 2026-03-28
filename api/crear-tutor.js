require("dotenv").config();
const mongoose = require("mongoose");
const Tutor = require("./src/models/tutor.model");

const crearTutor = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Conectado a MongoDB");

    // Datos del nuevo tutor
    const nuevoTutor = {
      nombre: "Usuario Demo",
      email: "user@kidotag.com",
      password: "user123",
      telefono: "5551112222",
      alumnos: [],
      activo: true,
    };

    // Verificar si el email ya existe
    const tutorExistente = await Tutor.findOne({ email: nuevoTutor.email });
    if (tutorExistente) {
      console.log("❌ El tutor con email", nuevoTutor.email, "ya existe");
      console.log("   ID:", tutorExistente._id);
      console.log("   Nombre:", tutorExistente.nombre);
      process.exit(0);
    }

    // Crear el tutor
    const tutor = new Tutor(nuevoTutor);
    await tutor.save();

    console.log("\n✅ Tutor creado exitosamente:");
    console.log("   ID:", tutor._id);
    console.log("   Nombre:", tutor.nombre);
    console.log("   Email:", tutor.email);
    console.log("   Teléfono:", tutor.telefono);
    console.log("\n🔐 Credenciales de acceso:");
    console.log("   Email:", tutor.email);
    console.log("   Password: user123");
    console.log(
      "\n💡 Puedes usar estas credenciales para iniciar sesión en la aplicación web.",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear tutor:", error.message);
    process.exit(1);
  }
};

crearTutor();
