import UserModel, { IUser } from '../models/user';
import mongoose from 'mongoose';
import admin from '../config/firebaseAdmin';

// Obtenir tots els usuaris
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
    
    return {
      users: users as unknown as IUser[],
      totalUsers,
      totalPages,
      currentPage: page
    };
  } catch (error) {
    console.error('Error al obtenir usuaris:', error);
    throw error;
  }
};

// Crear un nou usuari amb un rol específic
export const createUser = async (userData: Partial<IUser>): Promise<IUser> => {
  if (userData.role && !['user', 'admin'].includes(userData.role)) {
    userData.role = 'user'; // Si el rol no es vàlido, assignem 'user' per defecte
  }
  
  const newUser = new UserModel(userData);
  return await newUser.save();
};

// Obtenir un usuario per la seva ID
export const getUserById = async (userId: string): Promise<IUser | null> => {
  return await UserModel.findById(userId);
};

// Obtenir un usuario per nom d'usuari
export const getUserByUsername = async (username: string): Promise<IUser | null> => {
  return await UserModel.findOne({ username });
};

// Actualitzar un usuari
export const updateUser = async (userId: string, userData: Partial<IUser>): Promise<IUser | null> => {
  if (userData.role && !['user', 'admin'].includes(userData.role)) {
    throw new Error('Rol inválido. Los valores permitidos son "user" o "admin"');
  }
  
  return await UserModel.findByIdAndUpdate(userId, userData, { new: true });
};

// Eliminar un usuari
export const deleteUser = async (userId: string): Promise<IUser | null> => {
  return await UserModel.findByIdAndDelete(userId);
};

// Alternar visibilitat d'un usuari
export const toggleUserVisibility = async (userId: string): Promise<IUser | null> => {
  try {
    // 1. Buscar al usuario por ID
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return null;
    }
    
    // 2. Invertir el valor de visibility
    const currentVisibility = user.visibility !== undefined ? user.visibility : true;
    const newVisibility = !currentVisibility;
    
    // 3. Actualizamos el documento con el nuevo valor
    await UserModel.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { visibility: newVisibility, updatedAt: new Date() } }
    );
    
    // 4. Para devolver el documento actualizado, lo volvemos a buscar
    const updatedUser = await UserModel.collection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    
    if (!updatedUser) {
      return null;
    }
    
    // 5. Convertimos el documento a IUser
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
      role: updatedUser.role || 'user',
      followers: updatedUser.followers || [],
      following: updatedUser.following || []
    } as IUser;
  } catch (error) {
    console.error('Error en toggleUserVisibility:', error);
    return null;
  }
};

// Obtenir seguidors d'un usuari
export const getUserFollowers = async (userId: string): Promise<any[]> => {
  try {
    const user = await UserModel.findById(userId)
      .populate('followers', 'username profilePicture level bio createdAt followers following')
      .lean();
    
    if (!user || !user.followers) {
      return [];
    }
    
    // Verificar si los followers están populados
    const followers = user.followers;
    if (followers.length > 0 && typeof followers[0] === 'object' && 'username' in followers[0]) {
      // CALCULAR contadores para cada follower
      const followersWithCounts = (followers as unknown as IUser[]).map(follower => ({
        ...follower,
        followersCount: follower.followers ? follower.followers.length : 0,
        followingCount: follower.following ? follower.following.length : 0
      }));
      
      console.log(`getUserFollowers: Devolviendo ${followersWithCounts.length} seguidores con contadores`);
      return followersWithCounts;
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user followers:', error);
    throw error;
  }
};

// Obtenir usuaris que segueix un usuari
export const getUserFollowing = async (userId: string): Promise<IUser[]> => {
  try {
    const user = await UserModel.findById(userId)
      .populate('following', 'username profilePicture level bio createdAt followers following')
      .lean();
    
    if (!user || !user.following) {
      return [];
    }
    
    // Verificar si los following están populados
    const following = user.following;
    if (following.length > 0 && typeof following[0] === 'object' && 'username' in following[0]) {
      // CALCULAR contadores para cada usuario seguido
      const followingWithCounts = (following as unknown as IUser[]).map(followedUser => ({
        ...followedUser,
        followersCount: followedUser.followers ? followedUser.followers.length : 0,
        followingCount: followedUser.following ? followedUser.following.length : 0
      }));
      
      console.log(`getUserFollowing: Devolviendo ${followingWithCounts.length} seguidos con contadores`);
      return followingWithCounts as unknown as IUser[];
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user following:', error);
    throw error;
  }
};

// Seguir un usuari
export const followUser = async (userId: string, targetUserId: string): Promise<{
  success: boolean;
  message: string;
  follower?: IUser;
  following?: IUser;
}> => {
  try {
    console.log(`👥 Iniciando seguimiento: ${userId} -> ${targetUserId}`);
    
    // Validaciones básicas
    if (userId === targetUserId) {
      return { success: false, message: 'No puedes seguirte a ti mismo' };
    }

    // Verificar que ambos usuarios existen
    const [user, targetUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(targetUserId)
    ]);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    if (!targetUser) {
      return { success: false, message: 'Usuario objetivo no encontrado' };
    }

    // Verificar si ya se sigue
    const isAlreadyFollowing = user.following.includes(new mongoose.Types.ObjectId(targetUserId));
    if (isAlreadyFollowing) {
      return { success: false, message: 'Ya sigues a este usuario' };
    }

    console.log(` Validaciones pasadas, procediendo con seguimiento`);

    // Realizar las actualizaciones SIN transacciones
    try {
      // 1. Agregar targetUser a la lista following del user
      const updateUserResult = await UserModel.findByIdAndUpdate(
        userId,
        { $addToSet: { following: new mongoose.Types.ObjectId(targetUserId) } },
        { new: true }
      );

      if (!updateUserResult) {
        console.error(' Error actualizando usuario que sigue');
        return { success: false, message: 'Error actualizando usuario' };
      }

      console.log(` Usuario ${userId} actualizado - ahora sigue a ${targetUserId}`);

      // 2. Agregar user a la lista followers del targetUser
      const updateTargetResult = await UserModel.findByIdAndUpdate(
        targetUserId,
        { $addToSet: { followers: new mongoose.Types.ObjectId(userId) } },
        { new: true }
      );

      if (!updateTargetResult) {
        console.error(' Error actualizando usuario objetivo');
        
        // ROLLBACK MANUAL: revertir el primer cambio
        await UserModel.findByIdAndUpdate(
          userId,
          { $pull: { following: new mongoose.Types.ObjectId(targetUserId) } }
        );
        
        return { success: false, message: 'Error actualizando usuario objetivo' };
      }

      console.log(`Usuario ${targetUserId} actualizado - ahora es seguido por ${userId}`);
      console.log(` Seguimiento completado exitosamente`);

      return {
        success: true,
        message: 'Usuario seguido exitosamente',
        follower: updateUserResult,
        following: updateTargetResult
      };

    } catch (updateError) {
      console.error('Error durante actualizaciones:', updateError);
      return { success: false, message: 'Error durante la actualización' };
    }

  } catch (error) {
    console.error(' Error en followUser:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};

// Deixar de seguir un usuari
export const unfollowUser = async (userId: string, targetUserId: string): Promise<{
  success: boolean;
  message: string;
  follower?: IUser;
  following?: IUser;
}> => {
  try {
    console.log(`👥 Iniciando unfollow: ${userId} -/-> ${targetUserId}`);
    
    // Validaciones básicas
    if (userId === targetUserId) {
      return { success: false, message: 'No puedes dejar de seguirte a ti mismo' };
    }

    // Verificar que ambos usuarios existen
    const [user, targetUser] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findById(targetUserId)
    ]);

    if (!user) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    if (!targetUser) {
      return { success: false, message: 'Usuario objetivo no encontrado' };
    }

    // Verificar si realmente se sigue
    const isFollowing = user.following.includes(new mongoose.Types.ObjectId(targetUserId));
    if (!isFollowing) {
      return { success: false, message: 'No sigues a este usuario' };
    }

    console.log(` Validaciones pasadas, procediendo con unfollow`);

    // Realizar las actualizaciones SIN transacciones
    try {
      // 1. Remover targetUser de la lista following del user
      const updateUserResult = await UserModel.findByIdAndUpdate(
        userId,
        { $pull: { following: new mongoose.Types.ObjectId(targetUserId) } },
        { new: true }
      );

      if (!updateUserResult) {
        console.error(' Error actualizando usuario que deja de seguir');
        return { success: false, message: 'Error actualizando usuario' };
      }

      console.log(`Usuario ${userId} actualizado - ya no sigue a ${targetUserId}`);

      // 2. Remover user de la lista followers del targetUser
      const updateTargetResult = await UserModel.findByIdAndUpdate(
        targetUserId,
        { $pull: { followers: new mongoose.Types.ObjectId(userId) } },
        { new: true }
      );

      if (!updateTargetResult) {
        console.error(' Error actualizando usuario objetivo');
        
        // ROLLBACK MANUAL: revertir el primer cambio
        await UserModel.findByIdAndUpdate(
          userId,
          { $addToSet: { following: new mongoose.Types.ObjectId(targetUserId) } }
        );
        
        return { success: false, message: 'Error actualizando usuario objetivo' };
      }

      console.log(` Usuario ${targetUserId} actualizado - ya no es seguido por ${userId}`);
      console.log(` Unfollow completado exitosamente`);

      return {
        success: true,
        message: 'Dejaste de seguir al usuario exitosamente',
        follower: updateUserResult,
        following: updateTargetResult
      };

    } catch (updateError) {
      console.error(' Error durante actualizaciones:', updateError);
      return { success: false, message: 'Error durante la actualización' };
    }

  } catch (error) {
    console.error(' Error en unfollowUser:', error);
    return { success: false, message: 'Error interno del servidor' };
  }
};

// Verificar si un usuario segueix un altre
export const checkFollowStatus = async (userId: string, targetUserId: string): Promise<{
  isFollowing: boolean;
  isFollowedBy: boolean;
}> => {
  try {
    if (userId === targetUserId) {
      return { isFollowing: false, isFollowedBy: false };
    }

    const user = await UserModel.findById(userId).select('following followers').lean();
    
    if (!user) {
      return { isFollowing: false, isFollowedBy: false };
    }

    const targetObjectId = new mongoose.Types.ObjectId(targetUserId);
    
    const isFollowing = user.following.some(id => id.equals(targetObjectId));
    const isFollowedBy = user.followers.some(id => id.equals(targetObjectId));

    return { isFollowing, isFollowedBy };
  } catch (error) {
    console.error('Error checking follow status:', error);
    return { isFollowing: false, isFollowedBy: false };
  }
};

// Obtenir estadístiques de seguiment d'un usuari
export const getUserFollowStats = async (userId: string): Promise<{
  followersCount: number;
  followingCount: number;
  followers: IUser[];
  following: IUser[];
} | null> => {
  try {
    const user = await UserModel.findById(userId)
      .populate('followers', 'username profilePicture level')
      .populate('following', 'username profilePicture level')
      .select('followers following')
      .lean();

    if (!user) {
      return null;
    }

    // Verificar y convertir followers
    let followersArray: IUser[] = [];
    if (user.followers && user.followers.length > 0) {
      const followers = user.followers;
      if (typeof followers[0] === 'object' && 'username' in followers[0]) {
        followersArray = followers as unknown as IUser[];
      }
    }

    // Verificar y convertir following
    let followingArray: IUser[] = [];
    if (user.following && user.following.length > 0) {
      const following = user.following;
      if (typeof following[0] === 'object' && 'username' in following[0]) {
        followingArray = following as unknown as IUser[];
      }
    }

    return {
      followersCount: followersArray.length,
      followingCount: followingArray.length,
      followers: followersArray,
      following: followingArray
    };
  } catch (error) {
    console.error('Error getting user follow stats:', error);
    throw error;
  }
};
// Buscar usuaris per query
export const findUsersByQuery = async (search: string): Promise<IUser[]> => {
  try {
    if (!search || search.length < 2) {
      return [];
    }

    const regex = new RegExp(search, 'i');

    const users = await UserModel.find({
      $or: [
        { username: regex },
        { email: regex }
      ],
      visibility: { $ne: false } // Solo usuarios visibles
    })
    .select('username email profilePicture level bio createdAt followers following')
    .limit(20)
    .lean();

    // CALCULAR contadores de seguidores
    const usersWithCounts = users.map(user => ({
      ...user,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }));

    console.log(`Búsqueda "${search}" encontró ${users.length} usuarios con datos de seguimiento`);
    return usersWithCounts as unknown as IUser[];
  } catch (error) {
    console.error('Error en findUsersByQuery:', error);
    throw error;
  }
};

// Buscar usuaris per seguir
export const searchUsersToFollow = async (
  currentUserId: string, 
  searchTerm: string, 
  limit: number = 20
): Promise<IUser[]> => {
  try {
    const regex = new RegExp(searchTerm, 'i');

    // QUERY base
    const baseQuery: any = {
      $or: [
        { username: regex },
        { bio: regex }
      ],
      visibility: { $ne: false }
    };

    // SOLO excluir currentUserId si se proporciona y no está vacío
    if (currentUserId && currentUserId.trim() !== '') {
      baseQuery._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
    }

    const users = await UserModel.find(baseQuery)
      .select('username profilePicture level bio followers following')
      .limit(limit)
      .lean();

    // CALCULAR contadores de seguidores
    const usersWithCounts = users.map(user => ({
      ...user,
      followersCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0
    }));

    return usersWithCounts as unknown as IUser[];
  } catch (error) {
    console.error('Error searching users to follow:', error);
    throw error;
  }
};


// Obtenir usuaris suggerits per seguir
export const getSuggestedUsers = async (userId: string, limit: number = 10): Promise<IUser[]> => {
  try {
    const user = await UserModel.findById(userId).select('following').lean();
    
    if (!user) {
      return [];
    }

    // Obtener usuarios que no sigue actualmente, excluyéndose a sí mismo
    const suggestedUsers = await UserModel.find({
      _id: { 
        $nin: [...user.following, new mongoose.Types.ObjectId(userId)] 
      },
      visibility: { $ne: false }
    })
    .select('username profilePicture level bio createdAt')
    .limit(limit)
    .lean();

    return suggestedUsers as unknown as IUser[];
  } catch (error) {
    console.error('Error getting suggested users:', error);
    throw error;
  }
};


// Mantener funciones existentes para compatibilidad
export const startFollowingUser = followUser;

// Actualitzar el token FCM d'un usuari
export const updateFcmToken = async (userId: string, fcmToken: string, platform: string = 'web'): Promise<any> => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Actualitzar el token principal
    user.fcmToken = fcmToken;
    user.fcmTokenUpdatedAt = new Date();

    // Mantenir array de tokens per múltiples dispositius
    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }
    
    // Evitar duplicats
    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
    }

    await user.save();

    console.log(`FCM token actualizado para usuario ${userId}`);
    return {
      success: true,
      message: 'FCM token actualizado correctamente',
      tokenCount: user.fcmTokens.length
    };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    throw error;
  }
};

// Obtener usuaris amb tokens FCM vàlids
export const getUsersWithFcmTokens = async (userIds: string[]): Promise<any[]> => {
  try {
    const users = await UserModel.find({
      _id: { $in: userIds },
      fcmToken: { $exists: true, $ne: null }
    }).select('_id username fcmToken fcmTokens notificationSettings');

    console.log(`Encontrados ${users.length} usuarios con FCM tokens`);
    return users;
  } catch (error) {
    console.error('Error getting users with FCM tokens:', error);
    throw error;
  }
};