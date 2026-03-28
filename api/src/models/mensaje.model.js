const mongoose = require("mongoose");

const mensajeSchema = new mongoose.Schema(
  {
    remitente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
    },
    destinatario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profesor",
      required: true,
    },
    alumno: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Alumno",
      required: true,
    },
    tipo: {
      type: String,
      enum: ["inasistencia", "salida_temprana"],
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    fecha: {
      type: Date,
      required: true,
    },
    leido: {
      type: Boolean,
      default: false,
    },
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado"],
      default: "pendiente",
    },
    respuesta: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Mensaje", mensajeSchema);
