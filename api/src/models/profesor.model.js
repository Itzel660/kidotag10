const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const profesorSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    telefono: {
      type: String,
      trim: true,
    },
    especialidad: {
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

// Hashear password antes de guardar
profesorSchema.pre("save", async function () {
  // Solo hashear si el password fue modificado
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("Profesor", profesorSchema);
