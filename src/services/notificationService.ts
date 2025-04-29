import NotificationModel, { INotification } from '../models/notification';
import mongoose from 'mongoose';
import { getIO } from '../config/socketConfig';

// Crear una nueva notificación
export const createNotification = async (notificationData: {
  recipientId: string;
  senderId: string;
  type: string;
  content: string;
  entityId?: string;
  entityType?: string;
}): Promise<INotification> => {
  try {
    const notification = new NotificationModel({
      recipient: new mongoose.Types.ObjectId(notificationData.recipientId),
      sender: new mongoose.Types.ObjectId(notificationData.senderId),
      type: notificationData.type,
      content: notificationData.content,
      entityId: notificationData.entityId ? new mongoose.Types.ObjectId(notificationData.entityId) : undefined,
      entityType: notificationData.entityType,
      isRead: false,
      createdAt: new Date()
    });

    const savedNotification = await notification.save();
    
    // Emitir evento de notificación a través de Socket.IO
    const io = getIO();
    io.to(`user:${notificationData.recipientId}`).emit('notification', {
      id: savedNotification._id,
      type: savedNotification.type,
      content: savedNotification.content,
      senderInfo: { id: notificationData.senderId },
      entityId: notificationData.entityId,
      entityType: notificationData.entityType,
      createdAt: savedNotification.createdAt
    });
    
    // También emitir actualización del contador de notificaciones no leídas
    const unreadCount = await getUnreadNotificationsCount(notificationData.recipientId);
    io.to(`user:${notificationData.recipientId}`).emit('unread_notifications_count', unreadCount);
    
    return savedNotification;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    throw error;
  }
};

// Obtener notificaciones para un usuario
export const getNotificationsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  notifications: INotification[];
  total: number;
  page: number;
  pages: number;
}> => {
  const skip = (page - 1) * limit;
  
  const total = await NotificationModel.countDocuments({ 
    recipient: new mongoose.Types.ObjectId(userId) 
  });
  
  const notifications = await NotificationModel.find({ 
    recipient: new mongoose.Types.ObjectId(userId) 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username profilePicture')
    .populate({
      path: 'entityId',
      select: '_id name title content',
      options: { lean: true }
    });
  
  return {
    notifications,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
};

// Obtener notificaciones no leídas para un usuario
export const getUnreadNotifications = async (
  userId: string,
  limit: number = 10
): Promise<INotification[]> => {
  return await NotificationModel.find({ 
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false 
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'username profilePicture');
};

// Obtener el número de notificaciones no leídas
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  return await NotificationModel.countDocuments({ 
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false 
  });
};

// Marcar notificación como leída
export const markNotificationAsRead = async (notificationId: string): Promise<INotification | null> => {
  return await NotificationModel.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

// Marcar todas las notificaciones de un usuario como leídas
export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
  const result = await NotificationModel.updateMany(
    { 
      recipient: new mongoose.Types.ObjectId(userId),
      isRead: false
    },
    { isRead: true }
  );
  
  return result.modifiedCount;
};

// Eliminar una notificación
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  const result = await NotificationModel.deleteOne({ _id: notificationId });
  return result.deletedCount > 0;
};

// Crear una notificación de chat
export const createChatNotification = async (
  recipientId: string,
  senderId: string,
  roomId: string,
  messageContent: string
): Promise<INotification> => {
  try {
    // Obtener información del remitente para formar el contenido
    const senderName = await getSenderUsername(senderId);
    
    return await createNotification({
      recipientId,
      senderId,
      type: 'chat',
      content: `${senderName} te ha enviado un mensaje: "${messageContent.substring(0, 30)}${messageContent.length > 30 ? '...' : ''}"`,
      entityId: roomId,
      entityType: 'ChatRoom'
    });
  } catch (error) {
    console.error('Error al crear notificación de chat:', error);
    throw error;
  }
};

// Crear una notificación de actividad
export const createActivityNotification = async (
  recipientId: string,
  senderId: string,
  activityId: string,
  action: 'like' | 'comment'
): Promise<INotification> => {
  try {
    const senderName = await getSenderUsername(senderId);
    
    const content = action === 'like' 
      ? `A ${senderName} le ha gustado tu actividad`
      : `${senderName} ha comentado en tu actividad`;
    
    return await createNotification({
      recipientId,
      senderId,
      type: 'activity',
      content,
      entityId: activityId,
      entityType: 'Activity'
    });
  } catch (error) {
    console.error('Error al crear notificación de actividad:', error);
    throw error;
  }
};

// Crear una notificación de logro
export const createAchievementNotification = async (
  recipientId: string,
  achievementId: string,
  achievementTitle: string
): Promise<INotification> => {
  try {
    return await createNotification({
      recipientId,
      senderId: recipientId, // El sistema es el remitente
      type: 'achievement',
      content: `¡Has desbloqueado el logro "${achievementTitle}"!`,
      entityId: achievementId,
      entityType: 'Achievement'
    });
  } catch (error) {
    console.error('Error al crear notificación de logro:', error);
    throw error;
  }
};

// Crear una notificación de reto
export const createChallengeNotification = async (
  recipientId: string,
  senderId: string,
  challengeId: string,
  challengeTitle: string,
  action: 'invite' | 'complete' | 'update'
): Promise<INotification> => {
  try {
    const senderName = await getSenderUsername(senderId);
    
    let content = '';
    switch (action) {
      case 'invite':
        content = `${senderName} te ha invitado al reto "${challengeTitle}"`;
        break;
      case 'complete':
        content = `${senderName} ha completado el reto "${challengeTitle}"`;
        break;
      case 'update':
        content = `El reto "${challengeTitle}" ha sido actualizado`;
        break;
    }
    
    return await createNotification({
      recipientId,
      senderId,
      type: 'challenge',
      content,
      entityId: challengeId,
      entityType: 'Challenge'
    });
  } catch (error) {
    console.error('Error al crear notificación de reto:', error);
    throw error;
  }
};

// Función auxiliar para obtener el nombre de usuario
async function getSenderUsername(senderId: string): Promise<string> {
  try {
    // Importar el modelo User dinámicamente para evitar dependencia circular
    const User = mongoose.model('User');
    const user = await User.findById(senderId).select('username');
    return user?.username || 'Usuario';
  } catch (error) {
    console.error('Error al obtener nombre de usuario:', error);
    return 'Usuario';
  }
}