// src/controllers/userController.ts - Completo con Sistema de Seguimiento
import { Request, Response } from 'express';
import User from '../models/user';
import { deleteActivity } from '../services/activityService';
import bcrypt from 'bcrypt';
import * as userService from '../services/userService';
import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { extractPublicIdFromUrl } from '../middleware/cloudinaryUpload';
import { 
  updateFcmToken as updateFcmTokenService, 
  getUsersWithFcmTokens 
} from '../services/userService';
import admin from '../config/firebaseAdmin';

/**
 * Crear un nou usuari
 */
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, profilePicture, bio, role } = req.body;
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username });
    if (existingUser && existingUser.visibility !== false) {
      res.status(400).json({ message: 'Username already exists' });
      return;
    }
    
    // Validar el rol si se proporciona
    if (role && !['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role. Allowed values are "user" or "admin"' });
      return;
    }
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Crear nuevo usuario
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profilePicture: null,
      bio,
      level: 1,
      totalDistance: 0,
      totalTime: 0,
      activities: [],
      achievements: [],
      challengesCompleted: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      role: role || 'user'
    });
    
    // Guardar usuario en la base de datos
    await newUser.save();
    
    // Respuesta sin incluir la contraseña
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      profilePicture: newUser.profilePicture,
      bio: newUser.bio,
      level: newUser.level,
      role: newUser.role,
      createdAt: newUser.createdAt
    };
    
    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * Iniciar sessió
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    // Verificar que se proporcionaron usuario y contraseña
    if (!username || !password) {
      res.status(400).json({ message: 'Please provide username and password' });
      return;
    }
    
    // Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    
    // Respuesta sin incluir la contraseña
    const userResponse = {
      id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      level: user.level,
      role: user.role || 'user'
    };
    
    res.status(200).json({
      message: 'Login successful',
      user: userResponse
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

/**
 * Obtenir tots els usuaris
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtenir pàgina i límit dels paràmetres de consulta
    const page = parseInt(req.query.page?.toString() || '1', 10);
    const limit = parseInt(req.query.limit?.toString() || '10', 10);
    
    // Processar el paràmetre includeInvisible
    const includeInvisible = req.query.includeInvisible === 'true';
    
    console.log(`Sol·licitud d'usuaris: pàgina ${page}, límit ${limit}, incloure invisibles: ${includeInvisible}`);
    
    // Validar paràmetres de paginació
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({ message: 'Paràmetres de paginació invàlids' });
      return;
    }
    
    // Obtenir usuaris paginats
    const result = await userService.getUsers(page, limit);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Error al obtenir usuaris:', error);
    res.status(500).json({ message: 'Error al obtenir usuaris' });
  }
};

/**
 * Obtenir un usuari per ID
 */
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

/**
 * Actualitzar un usuari
 */
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Validar el rol si se está actualizando
    if (updates.role && !['user', 'admin'].includes(updates.role)) {
      res.status(400).json({ message: 'Invalid role. Allowed values are "user" or "admin"' });
      return;
    }
    
    // Si se actualiza la contraseña, hashearla
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }
    
    // Añadir fecha de actualización
    updates.updatedAt = new Date();
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updates, 
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};

/**
 * Eliminar un usuari
 */
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try{
    const user = await userService.getUserById(req.params.id);
    if(!user){
      res.status(401).json({message: `User "${req.params.title}" not found`});
      return;
    }
    if(user !== null && user.activities){
      for (let activity of user.activities) {
        await deleteActivity(activity._id.toString());
      }
    }
    await userService.deleteUser(req.params.id);
    res.status(201).json(user);
  } catch(err:any){
    res.status(500).json({message:"Server error: ", err});
  }
};

/**
 * Alternar visibilitat d'un usuari
 */
export const toggleUserVisibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    // Utilitzem directament el mètode de connexió de MongoDB per evitar els hooks de Mongoose
    const db = mongoose.connection.db;
    
    if (!db) {
      res.status(500).json({ message: 'Error de conexión con la base de datos' });
      return;
    }
    
    const usersCollection = db.collection('users');
    
    // Pas 1: trobar l'usuari per ID
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Pas 2: Invertir el valor de visibility
    const currentVisibility = user.visibility !== undefined ? user.visibility : true;
    const newVisibility = !currentVisibility;
    
    // Pas 3: actualitzar el document i esborrar les seves activitats
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { visibility: newVisibility, updatedAt: new Date() } }
    );
    
    // Pas 4: obtenir l'usuari actualitzat
    const updatedUser = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!updatedUser) {
      res.status(500).json({ message: 'Error al recuperar el usuario actualizado' });
      return;
    }
    
    // Pas 5: Enviar resposta
    res.status(200).json({
      message: `Usuario ${newVisibility ? 'visible' : 'oculto'} correctamente`,
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        visibility: newVisibility,
        role: updatedUser.role || 'user'
      }
    });
  } catch (error) {
    console.error('Error al cambiar la visibilidad del usuario:', error);
    res.status(500).json({ message: 'Error al cambiar la visibilidad del usuario' });
  }
};

/**
 * Buscar usuarios
 */
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const search = req.query.search?.toString() || '';

    console.log(`🔍 Búsqueda de usuarios con término: "${search}"`);

    if (search.length < 2) {
      res.status(400).json({ 
        message: 'Search query too short',
        users: [] 
      });
      return;
    }

    
    const users = await userService.searchUsersToFollow('', search, 20);

    if (!users || users.length === 0) {
      res.status(404).json({ 
        message: 'No users found',
        users: [] 
      });
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuarios con datos de seguimiento`);

    res.status(200).json({
      message: 'Users found successfully',
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error('Error buscando usuarios:', error);
    res.status(500).json({ 
      message: 'Error searching users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePictureCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // Verificar configuración de Cloudinary ANTES del upload
    const { cloudinary } = require('../config/cloudinary');
    const cloudConfig = cloudinary.config();
   
    if (!cloudConfig.cloud_name || !cloudConfig.api_key || !cloudConfig.api_secret) {
      res.status(500).json({ 
        message: 'Cloudinary configuration error',
        debug: {
          cloud_name: cloudConfig.cloud_name || 'MISSING',
          api_key: cloudConfig.api_key ? 'SET' : 'MISSING',
          api_secret: cloudConfig.api_secret ? 'SET' : 'MISSING'
        }
      });
      return;
    }
    
    // Verificar que hay archivo
    if (!req.file) {
      res.status(400).json({ message: 'No se proporcionó archivo' });
      return;
    }
    
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Eliminar imagen anterior si existe
    if (user.profilePicture) {
      try {
      const publicId = extractPublicIdFromUrl(user.profilePicture);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Imagen anterior eliminada: ${publicId}`);
      }
      } catch (deleteError) {
      console.warn('No se pudo eliminar la imagen anterior:', deleteError);
      }
    }
    
    // Actualizar usuario con nueva URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        profilePicture: req.file.path,
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      res.status(404).json({ message: 'Usuario no encontrado después de actualizar' });
      return;
    }
    
    res.status(200).json({
      message: 'Imagen de perfil actualizada exitosamente',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        profilePicture: updatedUser.profilePicture,
        updatedAt: updatedUser.updatedAt
      },
      cloudinary: {
        url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (error: any) {
    console.error('❌ Error uploading profile picture:', error);
    res.status(500).json({ 
      message: 'Error subiendo imagen de perfil',
      error: error.message
    });
  }
};

/**
 * Delete profile picture
 */
export const deleteProfilePictureCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    const oldProfilePicture = user.profilePicture;
    
    if (!oldProfilePicture) {
      res.status(400).json({ message: 'El usuario no tiene imagen de perfil' });
      return;
    }
    
    let cloudinaryDeleted = false;
    
    // Intentar eliminar de Cloudinary si es una URL de Cloudinary
    if (oldProfilePicture.includes('cloudinary.com')) {
      try {
        const publicId = extractPublicIdFromUrl(oldProfilePicture);
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          cloudinaryDeleted = result.result === 'ok';
          console.log(`🗑️ Resultado eliminación Cloudinary:`, result);
        }
      } catch (cloudinaryError) {
        console.warn('⚠️ Error eliminando de Cloudinary:', cloudinaryError);
      }
    }
    
    // Actualizar usuario eliminando la referencia
    const refreshedUser = await User.findByIdAndUpdate(
      userId,
      { 
        $unset: { profilePicture: "" },
        updatedAt: new Date()
      },
      { new: true }
    ).select('-password');
    
    res.status(200).json({
      message: 'Imagen de perfil eliminada exitosamente',
      user: {
        id: refreshedUser!._id,
        username: refreshedUser!.username,
        profilePicture: refreshedUser!.profilePicture,
        updatedAt: refreshedUser!.updatedAt
      },
      debug: {
        oldImageUrl: oldProfilePicture,
        imageType: oldProfilePicture.includes('cloudinary.com') ? 'cloudinary' : 
                 oldProfilePicture.startsWith('uploads/') ? 'local_old' : 'unknown',
        databaseUpdated: refreshedUser!.profilePicture === undefined || refreshedUser!.profilePicture === null,
        cloudinaryDeleted: cloudinaryDeleted
      }
    });
  } catch (error: any) {
    console.error('❌ Error deleting profile picture:', error);
    res.status(500).json({ 
      message: 'Error eliminando imagen de perfil',
      error: error.message
    });
  }
};

// =============================
// CONTROLADORES DE SEGUIMIENTO
// =============================

/**
 * Obtener seguidores de un usuario
 */
export const getUserFollowersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const followers = await userService.getUserFollowers(userId);

    res.status(200).json({
      message: 'Followers retrieved successfully',
      count: followers.length,
      followers
    });
  } catch (error) {
    console.error('Error fetching user followers:', error);
    res.status(500).json({ message: 'Error fetching user followers' });
  }
};

/**
 * Obtener usuarios que sigue un usuario
 */
export const getUserFollowingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const following = await userService.getUserFollowing(userId);

    res.status(200).json({
      message: 'Following retrieved successfully',
      count: following.length,
      following
    });
  } catch (error) {
    console.error('Error fetching user following:', error);
    res.status(500).json({ message: 'Error fetching user following' });
  }
};

/**
 * Seguir a un usuario
 */
export const followUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const targetUserId = req.params.targetUserId;

    if (!userId || !targetUserId) {
      res.status(400).json({ message: 'User ID and Target User ID are required' });
      return;
    }

    const result = await userService.followUser(userId, targetUserId);

    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ message: 'Error following user' });
  }
};

/**
 * Dejar de seguir a un usuario
 */
export const unfollowUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const targetUserId = req.params.targetUserId;

    if (!userId || !targetUserId) {
      res.status(400).json({ message: 'User ID and Target User ID are required' });
      return;
    }

    const result = await userService.unfollowUser(userId, targetUserId);

    if (!result.success) {
      res.status(400).json({ message: result.message });
      return;
    }

    res.status(200).json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
};

/**
 * Verificar estado de seguimiento entre dos usuarios
 */
export const checkFollowStatusController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    const targetUserId = req.params.targetUserId;

    if (!userId || !targetUserId) {
      res.status(400).json({ message: 'User ID and Target User ID are required' });
      return;
    }

    const status = await userService.checkFollowStatus(userId, targetUserId);

    res.status(200).json({
      message: 'Follow status retrieved successfully',
      userId,
      targetUserId,
      ...status
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ message: 'Error checking follow status' });
  }
};

/**
 * Obtener estadísticas de seguimiento de un usuario
 */
export const getUserFollowStatsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const stats = await userService.getUserFollowStats(userId);

    if (!stats) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Follow stats retrieved successfully',
      userId,
      ...stats
    });
  } catch (error) {
    console.error('Error getting user follow stats:', error);
    res.status(500).json({ message: 'Error getting user follow stats' });
  }
};

/**
 * Obtener usuarios sugeridos para seguir
 */
export const getSuggestedUsersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const limit = parseInt(req.query.limit?.toString() || '10', 10);

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const suggestedUsers = await userService.getSuggestedUsers(userId, limit);

    res.status(200).json({
      message: 'Suggested users retrieved successfully',
      count: suggestedUsers.length,
      users: suggestedUsers
    });
  } catch (error) {
    console.error('Error getting suggested users:', error);
    res.status(500).json({ message: 'Error getting suggested users' });
  }
};

/**
 * Buscar usuarios para seguir
 */
export const searchUsersToFollowController = async (req: Request, res: Response): Promise<void> => {
  try {
    const currentUserId = req.params.userId;
    const searchTerm = req.query.search?.toString() || '';
    const limit = parseInt(req.query.limit?.toString() || '20', 10);

    if (!currentUserId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    if (searchTerm.length < 2) {
      res.status(400).json({ message: 'Search term must be at least 2 characters long' });
      return;
    }

    const users = await userService.searchUsersToFollow(currentUserId, searchTerm, limit);

    res.status(200).json({
      message: 'Users search completed successfully',
      searchTerm,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Error searching users to follow:', error);
    res.status(500).json({ message: 'Error searching users to follow' });
  }
};

// Exportar funciones existentes y nuevas
export const uploadProfilePicture = uploadProfilePictureCloudinary;
export const deleteProfilePicture = deleteProfilePictureCloudinary;

// Mantener compatibilidad con funciones existentes
export const startFollowingUserController = followUserController;

/**
 * Actualizar FCM token del usuario
 */
export const updateFcmToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { fcmToken, platform = 'web' } = req.body;

    // Validaciones básicas
    if (!fcmToken) {
      res.status(400).json({
        success: false,
        error: 'FCM token es requerido'
      });
      return;
    }

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'User ID es requerido'
      });
      return;
    }

    console.log(`Actualizando FCM token para usuario ${userId}`);

    // Llamar a tu método del service
    const result = await updateFcmTokenService(userId, fcmToken);

    res.status(200).json({
      success: true,
      message: 'FCM token actualizado correctamente',
      data: {
        userId: userId,
        platform: platform,
        updatedAt: new Date().toISOString()
      }
    });

    console.log(`FCM token actualizado exitosamente para usuario ${userId}`);

  } catch (error: any) {
    console.error('Error in updateFcmToken controller:', error);
    
    if (error.message === 'Usuario no encontrado') {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
};

/**
 * Enviar notificación de prueba usando Firebase Admin (CORREGIDO)
 */
export const sendTestNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { title = 'Notificación de prueba', message = 'Esta es una prueba desde el backend' } = req.body;

    console.log(`Enviando notificación de prueba a usuario ${userId}`);

    // Usar tu método getUsersWithFcmTokens
    const users = await getUsersWithFcmTokens([userId]);
    
    if (users.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o sin FCM token configurado'
      });
      return;
    }

    const user = users[0];

    // Verificar que el usuario tenga FCM token
    if (!user.fcmToken) {
      res.status(400).json({
        success: false,
        error: 'Usuario no tiene FCM token configurado'
      });
      return;
    }

    const notificationMessage = {
      token: user.fcmToken,
      notification: {
        title: title,
        body: message
      },
      data: {
        type: 'test',
        userId: userId,
        timestamp: new Date().toISOString()
      },
      webpush: {
        fcmOptions: {
          link: 'http://localhost:60066/#/notifications'
        }
      }
    };

    const response = await admin.messaging().send(notificationMessage);

    res.status(200).json({
      success: true,
      message: 'Notificación de prueba enviada correctamente',
      data: {
        userId: userId,
        username: user.username,
        fcmResponse: response,
        sentAt: new Date().toISOString()
      }
    });

    console.log(`Notificación de prueba enviada:`, response);

  } catch (error: any) {
    console.error('Error in sendTestNotification controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error enviando notificación de prueba',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * Obtener estadísticas básicas de FCM tokens
 */
export const getFcmTokenStats = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log(`Obteniendo estadísticas básicas de FCM tokens`);

    // CORRECTO: Import sin extensión .js
    const totalUsers = await User.countDocuments();
    const usersWithTokens = await User.countDocuments({ 
      fcmToken: { $exists: true, $ne: null } 
    });

    const stats = {
      totalUsers,
      usersWithTokens,
      percentage: totalUsers > 0 ? (usersWithTokens / totalUsers * 100).toFixed(2) : 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        retrievedAt: new Date().toISOString(),
        description: 'Estadísticas básicas de FCM tokens'
      }
    });

    console.log(`Estadísticas FCM obtenidas:`, stats);

  } catch (error: any) {
    console.error('Error in getFcmTokenStats controller:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};