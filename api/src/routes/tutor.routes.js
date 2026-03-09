const express = require("express");
const router = express.Router();
const tutorController = require("../controllers/tutor.controller");

/**
 * @swagger
 * /api/v1/tutores:
 *   post:
 *     summary: Registrar un nuevo tutor
 *     tags: [Tutores]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: María González
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               telefono:
 *                 type: string
 *                 example: 5551234567
 *               alumnos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *     responses:
 *       201:
 *         description: Tutor registrado exitosamente
 *       409:
 *         description: Email duplicado
 */
router.post("/", tutorController.registrarTutor);

/**
 * @swagger
 * /api/v1/tutores:
 *   get:
 *     summary: Listar todos los tutores
 *     tags: [Tutores]
 *     responses:
 *       200:
 *         description: Lista de tutores
 */
router.get("/", tutorController.listarTutores);

/**
 * @swagger
 * /api/v1/tutores/{id}:
 *   get:
 *     summary: Obtener un tutor por ID
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del tutor
 *       404:
 *         description: Tutor no encontrado
 */
router.get("/:id", tutorController.obtenerTutor);

/**
 * @swagger
 * /api/v1/tutores/{id}:
 *   put:
 *     summary: Actualizar un tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               telefono:
 *                 type: string
 *               alumnos:
 *                 type: array
 *                 items:
 *                   type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tutor actualizado
 *       404:
 *         description: Tutor no encontrado
 */
router.put("/:id", tutorController.actualizarTutor);

/**
 * @swagger
 * /api/v1/tutores/{id}:
 *   delete:
 *     summary: Eliminar un tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tutor eliminado
 */
router.delete("/:id", tutorController.eliminarTutor);

/**
 * @swagger
 * /api/v1/tutores/{id}/alumnos:
 *   post:
 *     summary: Agregar un alumno al tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - alumnoId
 *             properties:
 *               alumnoId:
 *                 type: string
 *                 description: ID del alumno a agregar
 *     responses:
 *       200:
 *         description: Alumno agregado exitosamente
 */
router.post("/:id/alumnos", tutorController.agregarAlumno);

/**
 * @swagger
 * /api/v1/tutores/{id}/alumnos/{alumnoId}:
 *   delete:
 *     summary: Remover un alumno del tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: alumnoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alumno removido
 */
router.delete("/:id/alumnos/:alumnoId", tutorController.removerAlumno);

/**
 * @swagger
 * /api/v1/tutores/{id}/asistencias:
 *   get:
 *     summary: Obtener asistencias de los alumnos del tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fechaInicio
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Asistencias de los alumnos del tutor
 */
router.get("/:id/asistencias", tutorController.obtenerAsistenciasAlumnos);

/**
 * @swagger
 * /api/v1/tutores/{id}/devices:
 *   post:
 *     summary: Registrar un device para el tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - deviceId
 *               - deviceType
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: device-123-abc
 *               deviceType:
 *                 type: string
 *                 enum: [web, mobile]
 *                 example: web
 *               deviceName:
 *                 type: string
 *                 example: Chrome on Windows
 *     responses:
 *       200:
 *         description: Device registrado
 */
router.post("/:id/devices", tutorController.registrarDevice);

/**
 * @swagger
 * /api/v1/tutores/{id}/devices/{deviceId}:
 *   delete:
 *     summary: Desactivar un device del tutor
 *     tags: [Tutores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device desactivado
 */
router.delete("/:id/devices/:deviceId", tutorController.desactivarDevice);

module.exports = router;
