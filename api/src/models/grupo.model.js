const mongoose = require("mongoose");

const grupoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      trim: true,
    },
    profesor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profesor",
      required: true,
    },
    alumnos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Alumno",
      },
    ],
    horario: {
      type: String,
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Grupo", grupoSchema);
