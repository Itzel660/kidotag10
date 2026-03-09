const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { verificarToken } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * /api/v1/auth/login/tutor:
 *   post:
 *     summary: Login de tutor
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: maria@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               deviceId:
 *                 type: string
 *                 description: ID único del dispositivo (opcional)
 *                 example: device-abc-123
 *               deviceType:
 *                 type: string
 *                 enum: [web, mobile]
 *                 description: Tipo de dispositivo (opcional)
 *                 example: web
 *               deviceName:
 *                 type: string
 *                 description: Nombre del dispositivo (opcional)
 *                 example: Chrome on Windows
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     tipo:
 *                       type: string
 *                       example: tutor
 *                     usuario:
 *                       type: object
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login/tutor", authController.loginTutor);

/**
 * @swagger
 * /api/v1/auth/login/profesor:
 *   post:
 *     summary: Login de profesor
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: carlos@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token
 *                     tipo:
 *                       type: string
 *                       example: profesor
 *                     usuario:
 *                       type: object
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login/profesor", authController.loginProfesor);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/me", verificarToken, authController.obtenerUsuarioActual);

/**
 * @swagger
 * /api/v1/auth/cambiar-password:
 *   put:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - passwordActual
 *               - passwordNuevo
 *             properties:
 *               passwordActual:
 *                 type: string
 *                 example: password123
 *               passwordNuevo:
 *                 type: string
 *                 example: newpassword456
 *     responses:
 *       200:
 *         description: Password actualizado
 *       401:
 *         description: Password actual incorrecto
 */
router.put("/cambiar-password", verificarToken, authController.cambiarPassword);

module.exports = router;
