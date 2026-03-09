const express = require("express");
const router = express.Router();
const grupoController = require("../controllers/grupo.controller");

/**
 * @swagger
 * /api/v1/grupos:
 *   post:
 *     summary: Crear un nuevo grupo
 *     tags: [Grupos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - profesor
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Grupo 3A
 *               descripcion:
 *                 type: string
 *                 example: Grupo de tercer año sección A
 *               profesor:
 *                 type: string
 *                 description: ID del profesor
 *               alumnos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: []
 *               horario:
 *                 type: string
 *                 example: Lunes a Viernes 8:00-14:00
 *     responses:
 *       201:
 *         description: Grupo creado exitosamente
 */
router.post("/", grupoController.crearGrupo);

/**
 * @swagger
 * /api/v1/grupos:
 *   get:
 *     summary: Listar todos los grupos
 *     tags: [Grupos]
 *     responses:
 *       200:
 *         description: Lista de grupos
 */
router.get("/", grupoController.listarGrupos);

/**
 * @swagger
 * /api/v1/grupos/{id}:
 *   get:
 *     summary: Obtener un grupo por ID
 *     tags: [Grupos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del grupo
 */
router.get("/:id", grupoController.obtenerGrupo);

/**
 * @swagger
 * /api/v1/grupos/{id}:
 *   put:
 *     summary: Actualizar un grupo
 *     tags: [Grupos]
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
 *               descripcion:
 *                 type: string
 *               profesor:
 *                 type: string
 *               alumnos:
 *                 type: array
 *                 items:
 *                   type: string
 *               horario:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Grupo actualizado
 */
router.put("/:id", grupoController.actualizarGrupo);

/**
 * @swagger
 * /api/v1/grupos/{id}:
 *   delete:
 *     summary: Eliminar un grupo
 *     tags: [Grupos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grupo eliminado
 */
router.delete("/:id", grupoController.eliminarGrupo);

/**
 * @swagger
 * /api/v1/grupos/{id}/alumnos:
 *   post:
 *     summary: Agregar un alumno al grupo
 *     tags: [Grupos]
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
 *     responses:
 *       200:
 *         description: Alumno agregado al grupo
 */
router.post("/:id/alumnos", grupoController.agregarAlumno);

/**
 * @swagger
 * /api/v1/grupos/{id}/alumnos/{alumnoId}:
 *   delete:
 *     summary: Remover un alumno del grupo
 *     tags: [Grupos]
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
 *         description: Alumno removido del grupo
 */
router.delete("/:id/alumnos/:alumnoId", grupoController.removerAlumno);

module.exports = router;
