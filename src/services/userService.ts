import mongoose from 'mongoose';
import UserModel, { IUser } from '../models/user';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configuración de multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Asegurarse de que el directorio 'uploads' existe
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Configuración de los tipos de archivos permitidos
const fileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no soportado, use JPG, JPEG o PNG'), false);
  }
};

export const upload = multer({ 
  storage: storage, 
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB max
  fileFilter: fileFilter 
}).single('profilePicture');

/**
 * Obtenir tots els usuaris
 */
export const getUsers = async (page: number, limit: number): Promise<{
  users: IUser[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}> => {
  try {
    const skip = (page - 1) * limit;
    
    const query = {};
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error("La connexió a MongoDB no està disponible");
    }
    
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("La base de de dades no està disponible");
    }
    
    const collection = db.collection('users');
    
    const users = await collection.find(query)
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Excloure la contrasenya
      .toArray();
    
    const totalUsers = await collection.countDocuments(query);
    
    const totalPages = Math.ceil(totalUsers / limit);
    
    console.log(`Trobats ${users.length} usuaris d'un total de ${totalUsers}`);
    
    // Modificar las respuestas para no incluir el buffer de la imagen completo
    const processedUsers = users.map(user => {
      if (user.profilePicture && user.profilePicture.data) {
        return {
          ...user,
          profilePicture: {
            contentType: user.profilePicture.contentType,
            url: user.profilePicture.url,
            hasImage: true
          }
        };
      }
      return user;
    });
    
    return {
      users: processedUsers as unknown as IUser[],
      totalUsers,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error al obtenir usuaris:', error);
    throw error;
  }
};

/**
 * Crear un nuevo usuario con rol especificado
 */
export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  // Aseguramos que el rol sea válido o establecemos el valor por defecto
  if (userData.role && !['user', 'admin'].includes(userData.role)) {
    userData.role = 'user'; // Si el rol no es válido, asignamos 'user' por defecto
  }
  
  const newUser = new UserModel(userData);
  return await newUser.save();
};

/**
 * Obtener un usuario por su ID
 */
export const getUserById = async (userId: string): Promise<IUser | null> => {
  return await UserModel.findById(userId);
};

/**
 * Obtener un usuario por su nombre de usuario
 */
export const getUserByUsername = async (username: string): Promise<IUser | null> => {
  return await UserModel.findOne({ username });
};

/**
 * Actualizar un usuario, incluyendo su rol
 */
export const updateUser = async (userId: string, userData: Partial<IUser>): Promise<IUser | null> => {
  // Validar el rol si se proporciona
  if (userData.role && !['user', 'admin'].includes(userData.role)) {
    throw new Error('Rol inválido. Los valores permitidos son "user" o "admin"');
  }
  
  return await UserModel.findByIdAndUpdate(
    userId,
    userData,
    { new: true }
  );
};

/**
 * Actualizar un usuario incluyendo la imagen del perfil
 */
export const updateUserWithImage = async (userId: string, userData: Partial<IUser>, imageFile?: Express.Multer.File): Promise<IUser | null> => {
  try {
    const updateData: any = { ...userData };
    
    // Si hay un archivo de imagen, procesarlo
    if (imageFile) {
      const imageData = fs.readFileSync(imageFile.path);
      
      updateData.profilePicture = {
        data: imageData,
        contentType: imageFile.mimetype,
        url: null // Limpiar URL si existía
      };
      
      // Eliminar el archivo temporal
      fs.unlinkSync(imageFile.path);
    }
    
    return await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );
  } catch (error) {
    console.error('Error al actualizar usuario con imagen:', error);
    throw error;
  }
};

/**
 * Eliminar un usuario
 */
export const deleteUser = async (userId: string): Promise<IUser | null> => {
  return await UserModel.findByIdAndDelete(userId);
};

/**
 * Añadir una actividad a un usuario
 */
export const addActivityToUser = async (userId: string, activityId: string): Promise<IUser | null> => {
  return await UserModel.findByIdAndUpdate(
    userId,
    { $push: { activities: new mongoose.Types.ObjectId(activityId) } },
    { new: true }
  );
};

export const getUserByIdIgnoringVisibility = async (userId: string): Promise<IUser | null> => {
  // Utilizamos findById pero luego hacemos el lean() para obtener un objeto JS plano
  // y el 'getOptions' con { includeInvisible: true } para indicar que queremos omitir el filtro de visibilidad
  return await UserModel.findById(userId).lean({ getters: true });
};

// Añadir visibilidad a un usuario
export const toggleUserVisibility = async (userId: string): Promise<IUser | null> => {
  try {
    // 1. Primero, obtenemos el documento directamente (saltando los pre-hooks)
    // usando el método findOne directamente con la opción strict false
    const userDoc = await UserModel.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!userDoc) {
      return null;
    }
    
    // 2. Invertimos el valor de visibility
    const currentVisibility = userDoc.visibility !== undefined ? userDoc.visibility : true;
    const newVisibility = !currentVisibility;
    
    // 3. Actualizamos el documento con el nuevo valor
    await UserModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { visibility: newVisibility, updatedAt: new Date() } }
    );
    
    // 4. Para devolver el documento actualizado, lo volvemos a buscar
    // Nota: Este paso podría omitirse o reemplazarse si solo necesitas confirmar que se actualizó
    const updatedUser = await UserModel.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!updatedUser) {
      return null;
    }
    
    // 5. Convertimos el documento a IUser (formato que espera el controlador)
    return {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      password: updatedUser.password,
      profilePicture: updatedUser.profilePicture,
      bio: updatedUser.bio,
      level: updatedUser.level,
      totalDistance: updatedUser.totalDistance,
      totalTime: updatedUser.totalTime,
      activities: updatedUser.activities || [],
      achievements: updatedUser.achievements || [],
      challengesCompleted: updatedUser.challengesCompleted || [],
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      visibility: updatedUser.visibility,
      role: updatedUser.role || 'user'
    } as IUser;
  } catch (error) {
    console.error('Error en toggleUserVisibility:', error);
    return null;
  }
};

/**
 * Obtener la imagen de perfil de un usuario
 */
export const getUserProfilePicture = async (userId: string): Promise<{data: Buffer | null, contentType: string | null}> => {
  const user = await UserModel.findById(userId);
  
  if (!user || !user.profilePicture || !user.profilePicture.data) {
    return { data: null, contentType: null };
  }
  
  return { 
    data: user.profilePicture.data,
    contentType: user.profilePicture.contentType || 'image/jpeg'
  };
};