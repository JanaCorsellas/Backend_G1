import express from 'express';
import * as userController from '../controllers/userController';
import { uploadProfilePictureCloudinary } from '../middleware/cloudinaryUpload'; 

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
 *           description: URL completa de Cloudinary de la imagen de perfil
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
 *         profilePicture: https://res.cloudinary.com/dz1gi6amk/image/upload/v1647875123/profile_pictures/user_60d5ecb74d2dbb001f645a7c_1647875123456.jpg
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
 * /api/users/search:
 *   get:
 *     summary: Buscar usuarios por nombre de usuario
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de usuario a buscar
 *     responses:
 *       200:
 *         description: Lista de usuarios encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       username:
 *                         type: string
 *                       profilePicture:
 *                         type: string
 *                       level:
 *                         type: integer
 *       400:
 *         description: El parámetro de búsqueda es obligatorio
 *       500:
 *         description: Error interno del servidor
 */
router.get('/search',userController.searchUsers);

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
 *     summary: Upload profile picture to Cloudinary
 *     description: Sube una imagen de perfil a Cloudinary para un usuario específico. La imagen se optimiza automáticamente (500x500px, calidad auto, enfoque en cara). Acepta JPG, PNG, GIF, WebP, BMP con un tamaño máximo de 10MB.
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
 *                 description: Archivo de imagen - Se optimizará automáticamente a 500x500px con enfoque en cara
 *           encoding:
 *             profilePicture:
 *               contentType: image/*
 *     responses:
 *       200:
 *         description: Imagen subida exitosamente a Cloudinary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Imagen de perfil subida exitosamente a Cloudinary"
 *                 profilePicture:
 *                   type: string
 *                   example: "https://res.cloudinary.com/dz1gi6amk/image/upload/v1647875123/profile_pictures/user_60d5ecb74d2dbb001f645a7c_1647875123456.jpg"
 *                 profilePictureUrl:
 *                   type: string
 *                   example: "https://res.cloudinary.com/dz1gi6amk/image/upload/v1647875123/profile_pictures/user_60d5ecb74d2dbb001f645a7c_1647875123456.jpg"
 *                 cloudinaryData:
 *                   type: object
 *                   properties:
 *                     publicId:
 *                       type: string
 *                       example: "profile_pictures/user_60d5ecb74d2dbb001f645a7c_1647875123456"
 *                     originalName:
 *                       type: string
 *                       example: "mi_foto.jpg"
 *                     size:
 *                       type: number
 *                       example: 2048576
 *                     format:
 *                       type: string
 *                       example: "jpg"
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
 *                     message: "Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP, BMP)"
 *       404:
 *         description: Usuario no encontrado
 *       413:
 *         description: Archivo demasiado grande (>10MB)
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:userId/profile-picture', 
  uploadProfilePictureCloudinary.single('profilePicture'), 
  userController.uploadProfilePictureCloudinary 
);

/**
 * @openapi
 * /api/users/{userId}/profile-picture:
 *   delete:
 *     summary: Delete profile picture from Cloudinary
 *     description: Elimina la imagen de perfil del usuario tanto de Cloudinary como de la base de datos
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
 *         description: Imagen eliminada exitosamente de Cloudinary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Imagen de perfil eliminada exitosamente"
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     profilePicture:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     profilePictureUrl:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                 cloudinary:
 *                   type: object
 *                   properties:
 *                     deleted:
 *                       type: boolean
 *                       example: true
 *                     publicId:
 *                       type: string
 *                       example: "profile_pictures/user_60d5ecb74d2dbb001f645a7c_1647875123456"
 *                     previousUrl:
 *                       type: string
 *                       example: "https://res.cloudinary.com/dz1gi6amk/image/upload/..."
 *       400:
 *         description: El usuario no tiene imagen de perfil
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:userId/profile-picture', userController.deleteProfilePictureCloudinary); 

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
 * /api/users/followers/{id}:
 *   get:
 *     summary: Get followers of a user
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
 *         description: List of follower IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Error fetching user followers
 */
router.get('/followers/:id', userController.getUserFollowersController);

export default router;