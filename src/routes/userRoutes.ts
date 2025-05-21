import express from 'express';
import * as userController from '../controllers/userController';
import { upload } from '../services/userService';

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
 *           type: object
 *           properties:
 *             contentType:
 *               type: string
 *               description: Tipo de contenido de la imagen
 *             hasImage:
 *               type: boolean
 *               description: Indica si el usuario tiene una imagen de perfil
 *           description: Información sobre la imagen de perfil del usuario
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
 *              type: string
 *              format: objectId
 *              description: ID de les activitats associades a l'usuari
 *         achievements:
 *            type: array
 *            items:
 *              type: string
 *              format: objectId
 *              description: ID dels asol·liments associades a l'usuari
 *         challengesCompleted:
 *            type: array
 *            items:
 *              type: string
 *              format: objectId
 *              description: ID dels reptes completats associats a l'usuari
 *         createdAt:
 *            type: string
 *            format: date-time
 *            description: Hora i data de la creació de l'usuari
 *         updatedAt:
 *            type: string
 *            format: date-time
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
 *         profilePicture:
 *           contentType: image/jpeg
 *           hasImage: true
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
 * /api/users/{id}/profile-picture:
 *   get:
 *     summary: Get user profile picture
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
 *         description: Profile picture
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Profile picture not found
 *       500:
 *         description: Error fetching profile picture
 */
router.get('/:id/profile-picture', userController.getUserProfilePicture);

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Nombre de usuario
 *               email:
 *                 type: string
 *                 description: Correo electrónico
 *               password:
 *                 type: string
 *                 description: Contraseña
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de perfil del usuario (JPEG, JPG o PNG)
 *               bio:
 *                 type: string
 *                 description: Biografía del usuario
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Rol del usuario (user o admin)
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating user
 */
router.put('/:id', upload, userController.updateUser);

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

export default router;