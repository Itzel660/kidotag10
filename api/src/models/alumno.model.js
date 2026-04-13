const mongoose = require("mongoose");

const alumnoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    uidTarjeta: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Perfil del alumno
    fechaNacimiento: {
      type: Date,
    },
    genero: {
      type: String,
      enum: ["masculino", "femenino", "otro"],
      trim: true,
    },
    // Información médica
    alergias: {
      type: [String],
      default: [],
    },
    condicionesMedicas: {
      type: [String],
      default: [],
    },
    tipoSangre: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
      default: "",
    },
    peso: {
      type: Number,
      min: 0,
    },
    estatura: {
      type: Number,
      min: 0,
    },
    // Contacto de emergencia
    contactoEmergencia: {
      nombre: { type: String, trim: true },
      telefono: { type: String, trim: true },
      parentesco: { type: String, trim: true },
    },
    // Relación con tutor
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      default: null,
    },
    // Información escolar
    notasEscolares: {
      type: String,
      maxlength: 1000,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Alumno", alumnoSchema);
