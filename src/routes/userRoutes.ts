import express from 'express';
import * as userController from '../controllers/userController';
import { uploadProfilePicture } from '../middleware/upload';

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Nom d'usuari
 *         email:
 *           type: string
 *           description: Correu electrònic de l'usuari
 *         password:
 *           type: string
 *           description: Contrasenya d'autentificació de l'usuari
 *         profilePicture:
 *           type: string
 *           description: Ruta del archivo de imagen de perfil
 *         bio:
 *           type: string
 *           description: Biografía definida de l'usuari
 *         level:
 *           type: number
 *           description: Nivell d'experiència de l'usuari
 *         totalDistance:
 *           type: number
 *           description: Distància recorreguda en total per l'usuari
 *         totalTime:
 *           type: number
 *           description: Temps invertit en rutes (en total) per l'usuari
 *         activities:
 *            type: array
 *            items:
 *              type: objectId
 *              description: ID de les activitats associades a l'usuari
 *         achievements:
 *            type: array
 *            items:
 *              type: objectId
 *              description: ID dels asol·liments associades a l'usuari
 *         challengesCompleted:
 *            type: array
 *            items:
 *              type: objectId
 *              description: ID dels reptes completats associats a l'usuari
 *         createdAt:
 *            type: date-time
 *            description: Hora i data de la creació de l'usuari
 *         updatedAt:
 *            type: date-time
 *            description: Hora i data de l'última actualització de l'usuari
 *         visibility:
 *            type: boolean
 *            description: Indica si l'usuari és visible o no en la base de dades
 *         role:
 *            type: string
 *            enum: [user, admin]
 *            description: Rol de l'usuari (user o admin)
 *       example:
 *         username: Corredor44858
 *         email: nosequeficar@strava.es
 *         password: e%4e488585u4u€3|
 *         profilePicture: uploads/profile-pictures/userId_timestamp.jpg
 *         bio:
 *         level: 5
 *         totalDistance: 567
 *         activities: ['60d725b4e2f7cb001bce5ab1', '60d725b4e2f7cb001bce5ab2']
 *         achievements: ['60d725b4e2f7cb001bce5ab1', '60d725b4e2f7cb001bce5ab2']
 *         challengesCompleted: ['60d725b4e2f7cb001bce5ab1', '60d725b4e2f7cb001bce5ab2']
 *         createdAt: 2025-03-20T09:20:00Z
 *         updatedAt: 2025-03-20T09:20:00Z
 *         visibility: true
 *         role: user
 */

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *               bio:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Rol del usuario (por defecto 'user')
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Error creating user
 */
router.post('/', userController.createUser);

/**
 * @openapi
 * /api/users/login:
 *   post:
 *     summary: User login
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Error logging in
 */
router.post('/login', userController.loginUser);

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: List of users with pagination metadata
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Error fetching users
 */
router.get('/', userController.getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching user
 */
router.get('/:id', userController.getUserById);

/**
 * @openapi
 * /api/users/{userId}/profile-picture:
 *   post:
 *     summary: Upload profile picture
 *     description: Sube una imagen de perfil para un usuario específico. Solo acepta archivos de imagen (JPG, PNG, GIF, etc.) con un tamaño máximo de 5MB.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "60d5ecb74d2dbb001f645a7c"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Archivo de imagen (JPG, PNG, GIF, etc.) - Máximo 5MB
 *           encoding:
 *             profilePicture:
 *               contentType: image/*
 *     responses:
 *       200:
 *         description: Imagen de perfil subida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Imagen de perfil subida exitosamente"
 *                 profilePicture:
 *                   type: string
 *                   example: "uploads/profile-pictures/60d5ecb74d2dbb001f645a7c_1647875123456.jpg"
 *                 profilePictureUrl:
 *                   type: string
 *                   example: "http://localhost:3000/uploads/profile-pictures/60d5ecb74d2dbb001f645a7c_1647875123456.jpg"
 *       400:
 *         description: Error en la petición
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               examples:
 *                 no_file:
 *                   summary: No se proporcionó archivo
 *                   value:
 *                     message: "No se proporcionó ningún archivo"
 *                 invalid_file:
 *                   summary: Archivo inválido
 *                   value:
 *                     message: "Solo se permiten archivos de imagen"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       413:
 *         description: Archivo demasiado grande
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "File too large"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error subiendo imagen de perfil"
 */
router.post('/:userId/profile-picture', 
  uploadProfilePicture.single('profilePicture'), 
  userController.uploadProfilePicture
);

/**
 * @openapi
 * /api/users/{userId}/profile-picture:
 *   delete:
 *     summary: Delete profile picture
 *     description: Elimina la imagen de perfil actual del usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *         example: "60d5ecb74d2dbb001f645a7c"
 *     responses:
 *       200:
 *         description: Imagen de perfil eliminada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Imagen de perfil eliminada exitosamente"
 *       400:
 *         description: El usuario no tiene imagen de perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "El usuario no tiene imagen de perfil"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error eliminando imagen de perfil"
 */
router.delete('/:userId/profile-picture', userController.deleteProfilePicture);

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               profilePicture:
 *                 type: string
 *               bio:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Rol del usuario (user o admin)
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating user
 */
router.put('/:id', userController.updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error deleting user
 */
router.delete('/:id', userController.deleteUser);

/**
 * @openapi
 * /api/users/{id}/toggle-visibility:
 *   put:
 *     summary: Toggle user visibility
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User visibility toggled successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error toggling user visibility
 */
router.put('/:id/toggle-visibility', userController.toggleUserVisibility);

/**
 * @openapi
 * /uploads/{imagePath}:
 *   get:
 *     summary: Serve profile picture
 *     description: Sirve una imagen de perfil específica. Esta ruta es servida por Express como archivo estático.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: imagePath
 *         required: true
 *         schema:
 *           type: string
 *         description: Ruta de la imagen (sin 'uploads/')
 *         example: "profile-pictures/60d5ecb74d2dbb001f645a7c_1647875123456.jpg"
 *     responses:
 *       200:
 *         description: Imagen servida exitosamente
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Imagen no encontrada
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "Cannot GET /uploads/profile-pictures/nonexistent.jpg"
 */

export default router;