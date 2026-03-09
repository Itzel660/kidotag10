const express = require("express");
const router = express.Router();
const asistenciaController = require("../controllers/asistencia.controller");
const {
  verificarToken,
  filtrarAlumnosPorTutor,
} = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/v1/asistencias:
 *   post:
 *     summary: Registrar una asistencia (ESP32)
 *     tags: [Asistencias]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uidTarjeta
 *             properties:
 *               uidTarjeta:
 *                 type: string
 *                 description: UID de la tarjeta NFC del alumno
 *                 example: A1B2C3D4
 *     responses:
 *       201:
 *         description: Asistencia registrada exitosamente
 *       404:
 *         description: Alumno no encontrado
 */
router.post("/", asistenciaController.registrarAsistencia);

/**
 * @swagger
 * /api/v1/asistencias:
 *   get:
 *     summary: Listar asistencias (tutores solo ven las de sus alumnos)
 *     tags: [Asistencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio (opcional)
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin (opcional)
 *     responses:
 *       200:
 *         description: Lista de asistencias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Asistencia'
 *       401:
 *         description: No autenticado
 */
router.get(
  "/",
  verificarToken,
  filtrarAlumnosPorTutor,
  asistenciaController.listarAsistencias,
);

module.exports = router;
