// src/controllers/userController.ts - Completo con Cloudinary
import { Request, Response } from 'express';
import User from '../models/user';
import { deleteActivity } from '../services/activityService';
import bcrypt from 'bcrypt';
import * as userService from '../services/userService';
import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary';
import { extractPublicIdFromUrl } from '../middleware/cloudinaryUpload';

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
      role: role || 'user' // Si no se proporciona rol, asignar 'user' por defecto
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
    const isMatch = await bcrypt.compare(password, user.password!);
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
      role: user.role || 'user' // Incluir el rol en la respuesta
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
    
    if (req.file) {
    
    }
    
    if (!req.file) {
      console.log(' No file received in request');
      res.status(400).json({ 
        message: 'No se proporcionó ningún archivo'
      });
      return;
    }
    
    // Verificar que el usuario existe
    console.log(' Looking for user...');
    const user = await User.findById(userId);
    if (!user) {
    
      
      // Eliminar la imagen de Cloudinary si el usuario no existe
      try {
        await cloudinary.uploader.destroy((req.file as any).filename);
        console.log(' Image deleted from Cloudinary due to user not found');
      } catch (cloudError) {
        console.error('Error deleting image from Cloudinary:', cloudError);
      }
      
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    // Eliminar la imagen anterior de Cloudinary si existe
    if (user.profilePicture && user.profilePicture.includes('cloudinary.com')) {
      try {
        const { extractPublicIdFromUrl } = require('../middleware/cloudinaryUpload');
        const oldPublicId = extractPublicIdFromUrl(user.profilePicture);
        console.log(` Attempting to delete old image: ${oldPublicId}`);
        if (oldPublicId) {
          const deleteResult = await cloudinary.uploader.destroy(oldPublicId);
          console.log(` Delete result:`, deleteResult);
        }
      } catch (deleteError) {
        console.error(' Error deleting old image (continuing anyway):', deleteError);
      }
    }
    
    // Actualizar la URL de la imagen en la base de datos
    const cloudinaryUrl = (req.file as any).path; // URL completa de Cloudinary
    
    
    user.profilePicture = cloudinaryUrl;
    await user.save();
    

    
    res.status(200).json({
      message: 'Imagen de perfil subida exitosamente a Cloudinary',
      profilePicture: cloudinaryUrl,
      profilePictureUrl: cloudinaryUrl,
      cloudinaryData: {
        publicId: (req.file as any).filename,
        originalName: req.file.originalname,
        size: req.file.size,
        format: (req.file as any).format || 'auto'
      }
    });
  } catch (error: any) {
    console.error(' FATAL ERROR in uploadProfilePictureCloudinary:', error);
    console.error(' Error stack:', error.stack);
    
    // Limpiar Cloudinary en caso de error
    if (req.file && (req.file as any).filename) {
      try {
        const { cloudinary } = require('../config/cloudinary');
        await cloudinary.uploader.destroy((req.file as any).filename);
        console.log('🗑️ Cleanup: Deleted file from Cloudinary after error');
      } catch (cleanupError) {
        console.error('Error during Cloudinary cleanup:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      message: 'Error subiendo imagen de perfil a Cloudinary',
      error: error.message,
      debug: {
        errorType: error.constructor.name,
        stack: error.stack
      }
    });
  }
};


export const deleteProfilePictureCloudinary = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    console.log(`=== DELETE PROFILE PICTURE ===`);
    console.log(`User ID: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log(` User not found: ${userId}`);
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    
    
    if (!user.profilePicture) {
      console.log(`⚠️ User has no profile picture to delete`);
      res.status(400).json({ message: 'El usuario no tiene imagen de perfil' });
      return;
    }
    
    // Guardar la URL anterior para logging
    const oldProfilePicture = user.profilePicture;
    let cloudinaryDeleted = false;
    let publicId = '';
    
    // VERIFICAR SI ES UNA URL DE CLOUDINARY O UNA URL LOCAL ANTIGUA
    if (user.profilePicture.includes('cloudinary.com')) {
      
      
      try {
        const { extractPublicIdFromUrl } = require('../middleware/cloudinaryUpload');
        const { cloudinary } = require('../config/cloudinary');
        
        publicId = extractPublicIdFromUrl(user.profilePicture);
       
        
        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId);
          
          
          if (result.result === 'ok') {
            cloudinaryDeleted = true;
            
          } else {
            
          }
        }
      } catch (cloudinaryError) {
        console.error(` Error deleting from Cloudinary:`, cloudinaryError);
        // No fallar completamente, continuar con la limpieza de BD
      }
    } else if (user.profilePicture.startsWith('uploads/')) {
      // ⚠️ Es una URL local antigua - solo limpiar de BD
      
      
      cloudinaryDeleted = false; // No estaba en Cloudinary
      publicId = 'N/A (local file)';
    } else {
    
      
      publicId = 'Unknown format';
    }
    
    // PASO 1: Eliminar referencia de la base de datos (SIEMPRE)
    user.profilePicture = undefined;
    await user.save();
 
    
    // PASO 2: Obtener usuario actualizado para confirmar
    const refreshedUser = await User.findById(userId).select('-password');
    
    res.status(200).json({
      message: 'Imagen de perfil eliminada exitosamente',
      success: true,
      user: {
        id: refreshedUser!._id,
        username: refreshedUser!.username,
        profilePicture: refreshedUser!.profilePicture, // Debería ser undefined/null
        profilePictureUrl: null // También null después de la eliminación
      },
      cloudinary: {
        wasCloudinaryImage: oldProfilePicture.includes('cloudinary.com'),
        deleted: cloudinaryDeleted,
        publicId: publicId,
        previousUrl: oldProfilePicture
      },
      debug: {
        urlType: oldProfilePicture.includes('cloudinary.com') ? 'cloudinary' : 
                 oldProfilePicture.startsWith('uploads/') ? 'local_old' : 'unknown',
        databaseUpdated: refreshedUser!.profilePicture === undefined || refreshedUser!.profilePicture === null,
        cloudinaryDeleted: cloudinaryDeleted
      }
    });
  } catch (error: any) {
    console.error(' Error deleting profile picture:', error);
    res.status(500).json({ 
      message: 'Error eliminando imagen de perfil',
      error: error.message
    });
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

export const searchUsers = async (req: Request, res: Response) => {
   const query = (req.query.search as string) || '';
    if (query.length < 2) {
      res.status(400).json({ message: 'Query demasiado corto' });
      return;
    }

  try {

    const users = await userService.findUsersByQuery(query) as unknown as any[];
    if (!users || users.length === 0) {

      res.status(404).json({ message: 'No se encontraron usuarios' });
      return;
    }

    res.json({ users });
    return;
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
    return;
  }

};


export const uploadProfilePicture = uploadProfilePictureCloudinary;
export const deleteProfilePicture = deleteProfilePictureCloudinary;

export const getUserFollowersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    const followers = await userService.getUserFollowers(userId);

    res.status(200).json(followers);
  } catch (error) {
    console.error('Error fetching user followers:', error);
    res.status(500).json({ message: 'Error fetching user followers' });
  }
}

