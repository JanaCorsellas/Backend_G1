// src/controllers/userController.ts - Versión corregida
import { Request, Response } from 'express';
import User from '../models/user';
import { deleteActivity } from '../services/activityService';
import bcrypt from 'bcrypt';
import * as userService from '../services/userService';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

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

// ✅ MEJORADO: Función para subir imagen de perfil con mejor logging
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    console.log('=== UPLOAD REQUEST ===');
    console.log(`User ID: ${userId}`);
    console.log(`Files received: ${req.files ? Object.keys(req.files).length : 0}`);
    console.log(`File received: ${req.file ? 'YES' : 'NO'}`);
    
    if (req.file) {
      console.log('File details:');
      console.log(`  Original name: ${req.file.originalname}`);
      console.log(`  MIME type: ${req.file.mimetype}`);
      console.log(`  Size: ${req.file.size} bytes`);
      console.log(`  Field name: ${req.file.fieldname}`);
      console.log(`  Filename: ${req.file.filename}`);
      console.log(`  Path: ${req.file.path}`);
    }
    
    if (!req.file) {
      console.log('❌ No file received in request');
      res.status(400).json({ 
        message: 'No se proporcionó ningún archivo',
        debug: {
          headers: req.headers,
          body: req.body,
          files: req.files
        }
      });
      return;
    }
    
    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      // Eliminar el archivo subido si el usuario no existe
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    console.log(`✅ User found: ${user.username}`);
    
    // Eliminar la imagen anterior si existe
    if (user.profilePicture) {
      const oldImagePath = path.join(process.cwd(), user.profilePicture);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log(`🗑️ Old image deleted: ${oldImagePath}`);
      }
    }
    
    // Actualizar la ruta de la imagen en la base de datos
    const imagePath = req.file.path.replace(/\\/g, '/'); // Normalizar separadores de ruta
    user.profilePicture = imagePath;
    await user.save();
    
    // Construir URL completa
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const profilePictureUrl = `${baseUrl}/${imagePath}`;
    
    console.log(`✅ Image uploaded successfully:`);
    console.log(`  Path: ${imagePath}`);
    console.log(`  URL: ${profilePictureUrl}`);
    
    res.status(200).json({
      message: 'Imagen de perfil subida exitosamente',
      profilePicture: imagePath,
      profilePictureUrl: profilePictureUrl,
      debug: {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        filename: req.file.filename
      }
    });
  } catch (error: any) {
    console.error('❌ Error uploading profile picture:', error);
    
    // Limpiar el archivo en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log(`🗑️ Cleanup: Deleted file after error`);
    }
    
    res.status(500).json({ 
      message: 'Error subiendo imagen de perfil',
      error: error.message,
      debug: {
        stack: error.stack,
        file: req.file ? {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        } : null
      }
    });
  }
};

// ✅ CORREGIDO: Función para eliminar imagen de perfil 
export const deleteProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId;
    
    console.log(`=== DELETE PROFILE PICTURE ===`);
    console.log(`User ID: ${userId}`);
    
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }
    
    console.log(`✅ User found: ${user.username}`);
    console.log(`Current profile picture: ${user.profilePicture}`);
    
    if (!user.profilePicture) {
      console.log(`⚠️ User has no profile picture to delete`);
      res.status(400).json({ message: 'El usuario no tiene imagen de perfil' });
      return;
    }
    
    // Guardar la ruta de la imagen antes de eliminarla de la BD
    const oldProfilePicture = user.profilePicture;
    
    // ✅ PASO 1: Primero eliminar la referencia de la base de datos
    user.profilePicture = undefined;
    await user.save();
    
    console.log(`✅ Profile picture reference removed from database`);
    console.log(`Updated user profilePicture field: ${user.profilePicture}`);
    
    // ✅ PASO 2: Después eliminar el archivo del sistema de archivos
    const imagePath = path.join(process.cwd(), oldProfilePicture);
    console.log(`Attempting to delete file: ${imagePath}`);
    
    if (fs.existsSync(imagePath)) {
      try {
        fs.unlinkSync(imagePath);
        console.log(`✅ File deleted successfully: ${imagePath}`);
      } catch (fileError) {
        console.error(`❌ Error deleting file: ${fileError}`);
        // No fallar si no se puede eliminar el archivo físico
      }
    } else {
      console.log(`⚠️ File does not exist: ${imagePath}`);
    }
    
    // ✅ PASO 3: Obtener el usuario actualizado de la base de datos para confirmar
    const refreshedUser = await User.findById(userId).select('-password');
    
    // ✅ Respuesta con información detallada
    res.status(200).json({
      message: 'Imagen de perfil eliminada exitosamente',
      success: true,
      user: {
        id: refreshedUser!._id,
        username: refreshedUser!.username,
        profilePicture: refreshedUser!.profilePicture, // Debería ser undefined/null
        profilePictureUrl: refreshedUser!.profilePictureUrl // También debería ser null
      },
      debug: {
        fileDeleted: !fs.existsSync(imagePath),
        previousPath: oldProfilePicture,
        currentPath: refreshedUser!.profilePicture,
        databaseUpdated: refreshedUser!.profilePicture === undefined || refreshedUser!.profilePicture === null
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
    const users = await userService.findUsersByQuery(query);
    if (users.length === 0) {
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