// src/services/notificationService.ts
import NotificationModel, { INotification } from '../models/notification';
import UserModel from '../models/user';
import mongoose from 'mongoose';


export interface CreateNotificationData {
    userId: string;
    type: 'new_follower' | 'achievement_unlocked' | 'challenge_completed' | 'activity_update' | 'chat_message' | 'friend_request' | 'system';
    title: string;
    message: string;
    data?: any;
    priority?: 'low' | 'normal' | 'high';
    expiresAt?: Date;
}

export interface NotificationResponse {
    notifications: INotification[];
    totalNotifications: number;
    unreadCount: number;
    totalPages: number;
    currentPage: number;
}

// =============================
// FUNCIONES PRINCIPALES
// =============================

/**
 * Crear una nueva notificación
 */
export const createNotification = async (notificationData: CreateNotificationData): Promise<INotification> => {
    try {
        console.log(` Creando notificación para usuario ${notificationData.userId}`);
        
        // Verificar que el usuario existe
        const userExists = await UserModel.findById(notificationData.userId);
        if (!userExists) {
            throw new Error('Usuario no encontrado');
        }

        // Crear la notificación
        const notification = new NotificationModel({
            userId: new mongoose.Types.ObjectId(notificationData.userId),
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            priority: notificationData.priority || 'normal',
            expiresAt: notificationData.expiresAt
        });

        const savedNotification = await notification.save();
        console.log(` Notificación creada: ${savedNotification._id}`);
        
        return savedNotification;
    } catch (error) {
        console.error(' Error creating notification:', error);
        throw error;
    }
};

/**
 * Crear y enviar notificación en tiempo real
 */
export const createAndSendNotification = async (
    notificationData: CreateNotificationData,
    socketIO?: any
): Promise<INotification> => {
    try {
        // Crear la notificación
        const notification = await createNotification(notificationData);
        
        // Enviar por Socket.IO si está disponible
        if (socketIO) {
            await sendNotificationViaSocket(notification, socketIO);
        }
        
        return notification;
    } catch (error) {
        console.error(' Error creating and sending notification:', error);
        throw error;
    }
};

/**
 * Enviar notificación por Socket.IO
 */
export const sendNotificationViaSocket = async (
    notification: INotification,
    socketIO: any
): Promise<void> => {
    try {
        console.log(`🔔 Enviando notificación por Socket.IO a usuario ${notification.userId}`);
        
        // Buscar el socket del usuario específico
        const sockets = await socketIO.fetchSockets();
        const userSocket = sockets.find((socket: any) => 
            socket.data?.userId === notification.userId.toString()
        );
        
        if (userSocket) {
            // Enviar a este usuario específico
            userSocket.emit('new_notification', {
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                read: notification.read,
                priority: notification.priority,
                createdAt: notification.createdAt
            });
            
            console.log(` Notificación enviada por Socket.IO a ${notification.userId}`);
        } else {
            console.log(` Usuario ${notification.userId} no está conectado por Socket.IO`);
        }
    } catch (error) {
        console.error(' Error sending notification via Socket.IO:', error);
    }
};

/**
 * Obtener notificaciones de un usuario con paginación
 */
export const getUserNotifications = async (
    userId: string,
    page: number = 1,
    limit: number = 20,
    onlyUnread: boolean = false
): Promise<NotificationResponse> => {
    try {
        const skip = (page - 1) * limit;
        
        // Construir filtro
        const filter: any = {
            userId: new mongoose.Types.ObjectId(userId)
        };
        
        if (onlyUnread) {
            filter.read = false;
        }
        
        // Obtener notificaciones paginadas
        const notifications = await NotificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        
        // Contar total y no leídas
        const [totalNotifications, unreadCount] = await Promise.all([
            NotificationModel.countDocuments(filter),
            NotificationModel.countDocuments({
                userId: new mongoose.Types.ObjectId(userId),
                read: false
            })
        ]);
        
        const totalPages = Math.ceil(totalNotifications / limit);
        
        console.log(`📋 Obtenidas ${notifications.length} notificaciones para usuario ${userId}`);
        
        return {
            notifications: notifications as INotification[],
            totalNotifications,
            unreadCount,
            totalPages,
            currentPage: page
        };
    } catch (error) {
        console.error(' Error getting user notifications:', error);
        throw error;
    }
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (
    notificationId: string,
    userId: string
): Promise<INotification | null> => {
    try {
        const notification = await NotificationModel.findOneAndUpdate(
            { 
                _id: new mongoose.Types.ObjectId(notificationId),
                userId: new mongoose.Types.ObjectId(userId)
            },
            { 
                read: true,
                readAt: new Date()
            },
            { new: true }
        );
        
        if (notification) {
            console.log(` Notificación ${notificationId} marcada como leída`);
        }
        
        return notification;
    } catch (error) {
        console.error(' Error marking notification as read:', error);
        throw error;
    }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<number> => {
    try {
        const result = await NotificationModel.updateMany(
            { 
                userId: new mongoose.Types.ObjectId(userId),
                read: false
            },
            { 
                read: true,
                readAt: new Date()
            }
        );
        
        console.log(` ${result.modifiedCount} notificaciones marcadas como leídas para usuario ${userId}`);
        return result.modifiedCount;
    } catch (error) {
        console.error(' Error marking all notifications as read:', error);
        throw error;
    }
};

/**
 * Eliminar notificación
 */
export const deleteNotification = async (
    notificationId: string,
    userId: string
): Promise<boolean> => {
    try {
        const result = await NotificationModel.findOneAndDelete({
            _id: new mongoose.Types.ObjectId(notificationId),
            userId: new mongoose.Types.ObjectId(userId)
        });
        
        if (result) {
            console.log(`🗑️ Notificación ${notificationId} eliminada`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(' Error deleting notification:', error);
        throw error;
    }
};

/**
 * Obtener conteo de notificaciones no leídas
 */
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
    try {
        const count = await NotificationModel.countDocuments({
            userId: new mongoose.Types.ObjectId(userId),
            read: false
        });
        
        return count;
    } catch (error) {
        console.error(' Error getting unread notifications count:', error);
        throw error;
    }
};



/**
 * Crear notificación de nuevo seguidor
 */
export const createFollowerNotification = async (
    followedUserId: string,
    followerUserId: string,
    followerUsername: string,
    socketIO?: any
): Promise<INotification> => {
    try {
        const notificationData: CreateNotificationData = {
            userId: followedUserId,
            type: 'new_follower',
            title: '¡Nuevo seguidor!',
            message: `${followerUsername} ha comenzado a seguirte`,
            data: {
                followerId: followerUserId,
                followerUsername: followerUsername,
                type: 'follow',
                actionUrl: `/profile/${followerUserId}`
            },
            priority: 'normal'
        };
        
        return await createAndSendNotification(notificationData, socketIO);
    } catch (error) {
        console.error(' Error creating follower notification:', error);
        throw error;
    }
};

/**
 * Crear notificación de logro desbloqueado
 */
export const createAchievementNotification = async (
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
    achievementId: string,
    socketIO?: any
): Promise<INotification> => {
    try {
        const notificationData: CreateNotificationData = {
            userId,
            type: 'achievement_unlocked',
            title: '🏆 ¡Logro desbloqueado!',
            message: `Has desbloqueado: ${achievementTitle}`,
            data: {
                achievementId,
                achievementTitle,
                achievementDescription,
                type: 'achievement',
                actionUrl: `/achievements/${achievementId}`
            },
            priority: 'high'
        };
        
        return await createAndSendNotification(notificationData, socketIO);
    } catch (error) {
        console.error(' Error creating achievement notification:', error);
        throw error;
    }
};

/**
 * Crear notificación de actividad
 */
export const createActivityNotification = async (
    userId: string,
    activityName: string,
    activityId: string,
    socketIO?: any
): Promise<INotification> => {
    try {
        const notificationData: CreateNotificationData = {
            userId,
            type: 'activity_update',
            title: 'Actividad completada',
            message: `Has completado: ${activityName}`,
            data: {
                activityId,
                activityName,
                type: 'activity',
                actionUrl: `/activities/${activityId}`
            },
            priority: 'normal'
        };
        
        return await createAndSendNotification(notificationData, socketIO);
    } catch (error) {
        console.error(' Error creating activity notification:', error);
        throw error;
    }
};

/**
 * Limpiar notificaciones antiguas (tarea de mantenimiento)
 */
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await NotificationModel.deleteMany({
            createdAt: { $lt: cutoffDate },
            read: true
        });
        
        console.log(`🧹 ${result.deletedCount} notificaciones antiguas eliminadas`);
        return result.deletedCount;
    } catch (error) {
        console.error(' Error cleaning up old notifications:', error);
        throw error;
    }
};