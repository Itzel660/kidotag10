const express = require("express");
const router = express.Router();
const mensajeController = require("../controllers/mensaje.controller");
const { verificarToken, esTutor } = require("../middlewares/auth.middleware");

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @swagger
 * /api/v1/mensajes/no-leidos:
 *   get:
 *     summary: Contar mensajes no leídos para el usuario autenticado
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cantidad de mensajes no leídos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *       401:
 *         description: No autenticado
 */
router.get("/no-leidos", mensajeController.contarNoLeidos);

/**
 * @swagger
 * /api/v1/mensajes:
 *   get:
 *     summary: Obtener lista de mensajes (según rol)
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mensajes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Mensaje'
 *       401:
 *         description: No autenticado
 */
router.get("/", mensajeController.obtenerMensajes);

/**
 * @swagger
 * /api/v1/mensajes:
 *   post:
 *     summary: Enviar mensaje (solo tutores)
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alumnoId, tipo, mensaje, fecha]
 *             properties:
 *               alumnoId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [inasistencia, salida_temprana]
 *               mensaje:
 *                 type: string
 *               fecha:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Mensaje creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Mensaje'
 *       401:
 *         description: No autenticado o credenciales inválidas
 *       403:
 *         description: Acceso denegado (alumno no pertenece al tutor)
 */
router.post("/", esTutor, mensajeController.enviarMensaje);

/**
 * @swagger
 * /api/v1/mensajes/{id}/leer:
 *   put:
 *     summary: Marcar mensaje como leído
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del mensaje
 *     responses:
 *       200:
 *         description: Mensaje marcado como leído
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Mensaje'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Sin permiso
 *       404:
 *         description: Mensaje no encontrado
 */
router.put("/:id/leer", mensajeController.marcarLeido);

/**
 * @swagger
 * /api/v1/mensajes/{id}/responder:
 *   put:
 *     summary: Profesor aprueba o rechaza un mensaje
 *     tags: [Mensajes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del mensaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [aprobado, rechazado]
 *               respuesta:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mensaje respondido con estado actualizado
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Solo profesores permitidos o admin
 *       404:
 *         description: Mensaje no encontrado
 */
router.put("/:id/responder", mensajeController.responderMensaje);

module.exports = router;
