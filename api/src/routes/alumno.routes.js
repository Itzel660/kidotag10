const express = require("express");
const router = express.Router();
const alumnoController = require("../controllers/alumno.controller");
const { verificarToken, verificarAccesoAlumno, filtrarAlumnosPorTutor } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/v1/alumnos:
 *   post:
 *     summary: Registrar un nuevo alumno (requiere autenticación)
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - uidTarjeta
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               uidTarjeta:
 *                 type: string
 *                 example: A1B2C3D4
 *     responses:
 *       201:
 *         description: Alumno registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autenticado
 *       409:
 *         description: UID duplicado
 */
router.post("/", verificarToken, alumnoController.registrarAlumno);

/**
 * @swagger
 * /api/v1/alumnos:
 *   get:
 *     summary: Listar alumnos (tutores solo ven sus alumnos)
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alumnos
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
 *                     $ref: '#/components/schemas/Alumno'
 *       401:
 *         description: No autenticado
 */
router.get("/", verificarToken, filtrarAlumnosPorTutor, alumnoController.listarAlumnos);

/**
 * @swagger
 * /api/v1/alumnos/{id}:
 *   get:
 *     summary: Obtener un alumno por ID (requiere autorización)
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alumno
 *     responses:
 *       200:
 *         description: Datos del alumno
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Alumno'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Alumno no encontrado
 */
router.get("/:id", verificarToken, verificarAccesoAlumno, alumnoController.obtenerAlumno);

/**
 * @swagger
 * /api/v1/alumnos/{id}:
 *   put:
 *     summary: Actualizar un alumno (requiere autorización)
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alumno
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               uidTarjeta:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alumno actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Alumno no encontrado
 */
router.put("/:id", verificarToken, verificarAccesoAlumno, alumnoController.actualizarAlumno);

/**
 * @swagger
 * /api/v1/alumnos/{id}:
 *   delete:
 *     summary: Eliminar un alumno (requiere autorización)
 *     tags: [Alumnos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del alumno
 *     responses:
 *       200:
 *         description: Alumno eliminado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Alumno no encontrado
 */
router.delete("/:id", verificarToken, verificarAccesoAlumno, alumnoController.eliminarAlumno);

module.exports = router;
