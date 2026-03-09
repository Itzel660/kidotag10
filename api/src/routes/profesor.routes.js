const express = require("express");
const router = express.Router();
const profesorController = require("../controllers/profesor.controller");

/**
 * @swagger
 * /api/v1/profesores:
 *   post:
 *     summary: Registrar un nuevo profesor
 *     tags: [Profesores]
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
 *                 example: Carlos Ramírez
 *               email:
 *                 type: string
 *                 example: carlos@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               telefono:
 *                 type: string
 *                 example: 5559876543
 *               especialidad:
 *                 type: string
 *                 example: Matemáticas
 *     responses:
 *       201:
 *         description: Profesor registrado exitosamente
 */
router.post("/", profesorController.registrarProfesor);

/**
 * @swagger
 * /api/v1/profesores:
 *   get:
 *     summary: Listar todos los profesores
 *     tags: [Profesores]
 *     responses:
 *       200:
 *         description: Lista de profesores
 */
router.get("/", profesorController.listarProfesores);

/**
 * @swagger
 * /api/v1/profesores/{id}:
 *   get:
 *     summary: Obtener un profesor por ID
 *     tags: [Profesores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del profesor
 */
router.get("/:id", profesorController.obtenerProfesor);

/**
 * @swagger
 * /api/v1/profesores/{id}:
 *   put:
 *     summary: Actualizar un profesor
 *     tags: [Profesores]
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
 *               especialidad:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Profesor actualizado
 */
router.put("/:id", profesorController.actualizarProfesor);

/**
 * @swagger
 * /api/v1/profesores/{id}:
 *   delete:
 *     summary: Eliminar un profesor
 *     tags: [Profesores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Profesor eliminado
 */
router.delete("/:id", profesorController.eliminarProfesor);

/**
 * @swagger
 * /api/v1/profesores/{id}/grupos:
 *   get:
 *     summary: Obtener los grupos de un profesor
 *     tags: [Profesores]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grupos del profesor
 */
router.get("/:id/grupos", profesorController.obtenerGruposProfesor);

module.exports = router;
