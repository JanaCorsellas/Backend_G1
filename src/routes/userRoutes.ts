import { Router } from 'express';
import * as userController from '../controllers/userController';
import { uploadProfilePictureCloudinary } from '../middleware/cloudinaryUpload';

const router = Router();

// =============================
// RUTAS BÁSICAS DE USUARIOS
// =============================
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
 *       400:
 *         description: Query demasiado corto
 *       404:
 *         description: No se encontraron usuarios
 *       500:
 *         description: Error interno del servidor
 */
router.get('/search', userController.searchUsers);
/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
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
 *       - in: query
 *         name: includeInvisible
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include invisible users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching user
 */
router.get('/:id', userController.getUserById);

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Create new user
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

// =============================
// RUTAS DE PERFIL Y CLOUDINARY
// =============================

/**
 * @openapi
 * /api/users/{userId}/profile-picture:
 *   post:
 *     summary: Upload profile picture to Cloudinary
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Image file for profile picture
 *     responses:
 *       200:
 *         description: Profile picture uploaded successfully
 *       400:
 *         description: No file provided or invalid file
 *       404:
 *         description: User not found
 *       500:
 *         description: Error uploading profile picture
 */
router.post('/:userId/profile-picture', 
  uploadProfilePictureCloudinary.single('profilePicture'), 
  userController.uploadProfilePictureCloudinary
);

/**
 * @openapi
 * /api/users/{userId}/profile-picture:
 *   delete:
 *     summary: Delete profile picture
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Profile picture deleted successfully
 *       400:
 *         description: User has no profile picture
 *       404:
 *         description: User not found
 *       500:
 *         description: Error deleting profile picture
 */
router.delete('/:userId/profile-picture', userController.deleteProfilePictureCloudinary);

// =============================
// SISTEMA DE SEGUIMIENTO COMPLETO
// =============================

/**
 * @openapi
 * /api/users/{id}/followers:
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
 *         description: List of followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 followers:
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
 *         description: User ID is required
 *       500:
 *         description: Error fetching user followers
 */
router.get('/:id/followers', userController.getUserFollowersController);

/**
 * @openapi
 * /api/users/{id}/following:
 *   get:
 *     summary: Get users that a user is following
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
 *         description: List of following users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 following:
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
 *         description: User ID is required
 *       500:
 *         description: Error fetching user following
 */
router.get('/:id/following', userController.getUserFollowingController);

/**
 * @openapi
 * /api/users/{userId}/follow/{targetUserId}:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user who wants to follow
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be followed
 *     responses:
 *       200:
 *         description: Started following user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       400:
 *         description: User ID and Target User ID are required, or already following
 *       404:
 *         description: Target user not found
 *       500:
 *         description: Error following user
 */
router.post('/:userId/follow/:targetUserId', userController.followUserController);

/**
 * @openapi
 * /api/users/{userId}/unfollow/{targetUserId}:
 *   post:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user who wants to unfollow
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be unfollowed
 *     responses:
 *       200:
 *         description: Unfollowed user successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *       400:
 *         description: User ID and Target User ID are required, or not following
 *       404:
 *         description: Target user not found
 *       500:
 *         description: Error unfollowing user
 */
router.post('/:userId/unfollow/:targetUserId', userController.unfollowUserController);

/**
 * @openapi
 * /api/users/{userId}/follow-status/{targetUserId}:
 *   get:
 *     summary: Check follow status between two users
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the first user
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the second user
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 targetUserId:
 *                   type: string
 *                 isFollowing:
 *                   type: boolean
 *                   description: Whether userId follows targetUserId
 *                 isFollowedBy:
 *                   type: boolean
 *                   description: Whether userId is followed by targetUserId
 *       400:
 *         description: User ID and Target User ID are required
 *       500:
 *         description: Error checking follow status
 */
router.get('/:userId/follow-status/:targetUserId', userController.checkFollowStatusController);

/**
 * @openapi
 * /api/users/{id}/follow-stats:
 *   get:
 *     summary: Get follow statistics for a user
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
 *         description: Follow stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 followersCount:
 *                   type: integer
 *                 followingCount:
 *                   type: integer
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                 following:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: User ID is required
 *       404:
 *         description: User not found
 *       500:
 *         description: Error getting user follow stats
 */
router.get('/:id/follow-stats', userController.getUserFollowStatsController);

/**
 * @openapi
 * /api/users/{id}/suggested:
 *   get:
 *     summary: Get suggested users to follow
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of suggested users to return
 *     responses:
 *       200:
 *         description: Suggested users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
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
 *                       bio:
 *                         type: string
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Error getting suggested users
 */
router.get('/:id/suggested', userController.getSuggestedUsersController);

/**
 * @openapi
 * /api/users/{userId}/search-to-follow:
 *   get:
 *     summary: Search users to follow
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Current user ID
 *       - in: query
 *         name: search
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users to return
 *     responses:
 *       200:
 *         description: Users search completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 searchTerm:
 *                   type: string
 *                 count:
 *                   type: integer
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
 *                       bio:
 *                         type: string
 *                       followers:
 *                         type: array
 *                       following:
 *                         type: array
 *       400:
 *         description: User ID is required or search term too short
 *       500:
 *         description: Error searching users to follow
 */
router.get('/:userId/search-to-follow', userController.searchUsersToFollowController);

// =============================
// RUTAS DE COMPATIBILIDAD (mantener las existentes)
// =============================

/**
 * @openapi
 * /api/users/followers/{userId}/{targetUserId}:
 *   put:
 *     summary: Start following a user (legacy route)
 *     tags: [Users]
 *     deprecated: true
 *     description: Use POST /api/users/{userId}/follow/{targetUserId} instead
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user who wants to follow
 *       - in: path
 *         name: targetUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to be followed
 *     responses:
 *       200:
 *         description: Started following user successfully
 *       400:
 *         description: User ID and Target User ID are required
 *       404:
 *         description: Target user not found
 *       500:
 *         description: Error starting to follow user
 */
router.put('/followers/:userId/:targetUserId', userController.startFollowingUserController);

/**
 * @openapi
 * /api/users/followers/{id}:
 *   get:
 *     summary: Get followers of a user (legacy route)
 *     tags: [Users]
 *     deprecated: true
 *     description: Use GET /api/users/{id}/followers instead
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
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Error fetching user followers
 */
router.get('/followers/:id', userController.getUserFollowersController);

/**
 * @openapi
 * /api/users/{userId}/fcm-token:
 *   post:
 *     summary: Actualizar FCM token del usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
 *                 description: Token FCM del dispositivo
 *                 example: "c-gvd79xZPnXGGXmB7aAip:APA91bE..."
 *               platform:
 *                 type: string
 *                 enum: [web, android, ios]
 *                 default: web
 *                 description: Plataforma del dispositivo
 *     responses:
 *       200:
 *         description: FCM token actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "FCM token actualizado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     platform:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: FCM token requerido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/:userId/fcm-token', userController.updateFcmToken);

/**
 * @openapi
 * /api/users/{userId}/test-notification:
 *   post:
 *     summary: Enviar notificación de prueba al usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 default: "Notificación de prueba"
 *                 description: Título de la notificación
 *               message:
 *                 type: string
 *                 default: "Esta es una prueba desde el backend"
 *                 description: Mensaje de la notificación
 *     responses:
 *       200:
 *         description: Notificación enviada correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notificación de prueba enviada correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     username:
 *                       type: string
 *                     fcmResponse:
 *                       type: string
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Usuario no tiene FCM token configurado
 *       404:
 *         description: Usuario no encontrado o sin FCM token
 *       500:
 *         description: Error enviando notificación
 */
router.post('/:userId/test-notification', userController.sendTestNotification);

/**
 * @openapi
 * /api/users/fcm-stats:
 *   get:
 *     summary: Obtener estadísticas de FCM tokens (Admin)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                       example: 150
 *                       description: Total de usuarios registrados
 *                     usersWithTokens:
 *                       type: number
 *                       example: 120
 *                       description: Usuarios con FCM token configurado
 *                     percentage:
 *                       type: string
 *                       example: "80.00"
 *                       description: Porcentaje de adopción de notificaciones
 *                     retrievedAt:
 *                       type: string
 *                       format: date-time
 *                     description:
 *                       type: string
 *                       example: "Estadísticas básicas de FCM tokens"
 *       500:
 *         description: Error interno del servidor
 */
router.get('/fcm-stats', userController.getFcmTokenStats);

export default router;