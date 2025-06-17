import NotificationModel, { INotification } from '../models/notification';
import UserModel from '../models/user';
import mongoose from 'mongoose';
import admin from '../config/firebaseAdmin'; 


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


// Crear una nova notificació
export const createNotification = async (notificationData: CreateNotificationData): Promise<INotification> => {
    try {
        console.log(` Creando notificación para usuario ${notificationData.userId}`);
        
        // Verificar que l'usuari existeix
        const userExists = await UserModel.findById(notificationData.userId);
        if (!userExists) {
            throw new Error('Usuario no encontrado');
        }

        // Crear la notificació
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

// Enviar notificació per Socket.IO
export const sendNotificationViaSocket = async (
    notification: INotification,
    socketIO: any
): Promise<void> => {
    try {
        console.log(`Enviando notificación por Socket.IO a usuario ${notification.userId}`);
        
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

// Obtenir notificacions d'un usuari amb paginació
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
        
        console.log(`Obtenidas ${notifications.length} notificaciones para usuario ${userId}`);
        
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

// Marcar notificació com llegida
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

// Marcar totes les notificacions com llegides
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

// Eliminar notificació
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
            console.log(`Notificación ${notificationId} eliminada`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(' Error deleting notification:', error);
        throw error;
    }
};

// Obtenir contador de notificacions no llegides
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

// Crear notificació d'assoliment desbloquejat
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
            title: '¡Logro desbloqueado!',
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
        
        return await createAndSendNotificationWithFCM(notificationData, socketIO);
    } catch (error) {
        console.error(' Error creating achievement notification:', error);
        throw error;
    }
};

// Netejar notificacions antigues
export const cleanupOldNotifications = async (daysOld: number = 30): Promise<number> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await NotificationModel.deleteMany({
            createdAt: { $lt: cutoffDate },
            read: true
        });
        
        console.log(`${result.deletedCount} notificaciones antiguas eliminadas`);
        return result.deletedCount;
    } catch (error) {
        console.error(' Error cleaning up old notifications:', error);
        throw error;
    }
};

// Enviar notificació push via Firebase FCM
export const sendPushNotification = async (
    userIds: string[],
    title: string,
    message: string,
    data: any = {},
    type: string
): Promise<void> => {
    try {
        console.log(`Enviando notificación FCM a ${userIds.length} usuarios`);

        // Obtenir usuaris amb FCM tokens
        const users = await UserModel.find({
            _id: { $in: userIds },
            fcmToken: { $exists: true, $ne: null }
        }).select('_id fcmToken notificationSettings username');

        if (users.length === 0) {
            console.log('No hay usuarios con FCM tokens en la BD');
            return;
        }

        console.log(`Encontrados ${users.length} usuarios con FCM tokens en BD`);

        // Filtrar segons configuració de notificacions
        const usersToNotify = users.filter(user => {
            if (!user.notificationSettings) return true;
            
            switch (type) {
                case 'new_follower':
                case 'friend_request':
                    return user.notificationSettings.friendRequests !== false;
                case 'activity_update':
                    return user.notificationSettings.activityUpdates !== false;
                case 'achievement_unlocked':
                    return user.notificationSettings.achievements !== false;
                case 'challenge_completed':
                    return user.notificationSettings.challenges !== false;
                case 'chat_message':
                    return user.notificationSettings.chatMessages !== false;
                default:
                    return true;
            }
        });

        if (usersToNotify.length === 0) {
            console.log('No hay usuarios con notificaciones habilitadas para este tipo');
            return;
        }

        console.log(`${usersToNotify.length} usuarios tienen notificaciones habilitadas`);

        // FILTRAR TOKENS VÀLIDS CORRECTAMENT
        const tokens = usersToNotify
            .map(user => user.fcmToken)
            .filter((token): token is string => {
                return token !== null && token !== undefined && token.length > 0;
            });

        if (tokens.length === 0) {
            console.log('No hay tokens FCM válidos después del filtrado');
            return;
        }

        console.log(`Enviando a ${tokens.length} tokens FCM válidos`);

        // Enviar via FCM
        const fcmMessage = {
            tokens: tokens,
            notification: {
                title: title,
                body: message,
            },
            data: {
                type: type,
                ...data,
                clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                timestamp: new Date().toISOString()
            },
            webpush: {
                fcmOptions: {
                    link: 'http://localhost:60066/#/notifications'
                }
            }
        };

        const response = await admin.messaging().sendEachForMulticast(fcmMessage);
        console.log(`FCM: ${response.successCount} enviadas, ${response.failureCount} fallidas`);

        // Netejar tokens invàlids
        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error('Token fallido:', tokens[idx], resp.error?.code);
                }
            });
            
            if (failedTokens.length > 0) {
                await cleanInvalidFcmTokens(failedTokens);
            }
        }

        // Informació de debugging
        console.log(`Resumen FCM:`, {
            usuariosObjetivo: userIds.length,
            usuariosConToken: users.length,
            usuariosConNotifHabilitadas: usersToNotify.length,
            tokensValidos: tokens.length,
            enviadas: response.successCount,
            fallidas: response.failureCount
        });

    } catch (error) {
        console.error('Error enviando notificación FCM:', error);
        throw error; // Re-lanzar para que el calling code pueda manejar el error
    }
};

// Netejar tokens FCM invàlids
export const cleanInvalidFcmTokens = async (invalidTokens: string[]): Promise<void> => {
    try {
        await UserModel.updateMany(
            { 
                $or: [
                    { fcmToken: { $in: invalidTokens } },
                    { fcmTokens: { $in: invalidTokens } }
                ]
            },
            { 
                $unset: { fcmToken: 1 },
                $pullAll: { fcmTokens: invalidTokens }
            }
        );

        console.log(`Limpiados ${invalidTokens.length} tokens FCM inválidos`);
    } catch (error) {
        console.error('Error limpiando tokens inválidos:', error);
    }
};

export const createAndSendNotificationWithFCM = async (
    notificationData: CreateNotificationData,
    socketIO?: any,
    sendPush: boolean = true
): Promise<INotification> => {
    try {
        // 1. Crear la notificación en BD (tu función existente)
        const notification = await createNotification(notificationData);
        
        // 2. Enviar por Socket.IO si está disponible (tu función existente)
        if (socketIO) {
            await sendNotificationViaSocket(notification, socketIO);
        }
        
        // 3. Enviar por FCM si está habilitado
        if (sendPush) {
            await sendPushNotification(
                [notificationData.userId],
                notificationData.title,
                notificationData.message,
                notificationData.data || {},
                notificationData.type
            );
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating and sending notification with FCM:', error);
        throw error;
    }
};

// Crear una notificació de nou seguidor amb FCM
export const createFollowerNotificationWithFCM = async (
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
        
        // Usar la nueva función que incluye FCM
        return await createAndSendNotificationWithFCM(notificationData, socketIO, true);
    } catch (error) {
        console.error('Error creating follower notification with FCM:', error);
        throw error;
    }
};

// Crear una notificació de nova activitat per als seguidors
export const createActivityNotificationForFollowers = async (
    userId: string,
    activityData: any,
    socketIO?: any
): Promise<void> => {
    try {
        // Obtener el usuario y sus seguidores
        const user = await UserModel.findById(userId)
            .populate('followers', '_id username')
            .select('username followers');

        if (!user || !user.followers || user.followers.length === 0) {
            console.log('Usuario no tiene seguidores para notificar actividad');
            return;
        }

        const activityTypes: { [key: string]: string } = {
            'running': '🏃‍♂️ corriendo',
            'cycling': '🚴‍♀️ en bicicleta',
            'walking': '🚶‍♀️ caminando',
            'swimming': '🏊‍♀️ nadando',
            'hiking': '🥾 senderismo'
        };

        const activityEmoji = activityTypes[activityData.type] || '🏃‍♂️ ejercicio';
        const distance = activityData.distance ? `${(activityData.distance / 1000).toFixed(2)} km` : '';
        
        const formatDuration = (durationInSeconds: number): string => {
            if (durationInSeconds < 60) {
                return ' durante 0 min';  // Activitats curtes es mostren com 0 min
            } else if (durationInSeconds < 3600) {
                const minutes = Math.round(durationInSeconds / 60);
                return ` durante ${minutes} min`;
            } else {
                const hours = Math.floor(durationInSeconds / 3600);
                const remainingMinutes = Math.round((durationInSeconds % 3600) / 60);
                if (remainingMinutes === 0) {
                    return ` durante ${hours}h`;
                } else {
                    return ` durante ${hours}h ${remainingMinutes}min`;
                }
            }
        };
        const duration = activityData.duration ? formatDuration(activityData.duration) : '';

        // Crear notificaciones para cada seguidor
        const followerIds = user.followers.map((follower: any) => follower._id.toString());
        
        // Filtrar seguidores que tienen notificaciones de actividad habilitadas
        const followersToNotify = user.followers.filter((follower: any) => {
            if (!follower.notificationSettings) return true; // Por defecto habilitado
            return follower.notificationSettings.activityUpdates !== false;
        });
        console.log(`Enviando notificaciones a ${followersToNotify.length} de ${user.followers.length} seguidores`);

        // Crear notificaciones individuales para cada seguidor
        const notificationPromises = followersToNotify.map(async (follower: any) => {
            const notificationData: CreateNotificationData = {
                userId: follower._id.toString(),
                type: 'activity_update',
                title: '¡Nueva actividad!',
                message: `${user.username} ha estado ${activityEmoji}${distance}${duration}`,
                data: {
                    senderId: userId,
                    senderUsername: user.username,
                    activityId: activityData._id?.toString() || activityData.id || '',
                    activityType: activityData.type,
                    activityName: activityData.name || `Actividad de ${activityEmoji}`,
                    distance: activityData.distance?.toString() || '',
                    duration: activityData.duration?.toString() || '',
                    actionUrl: `/activity/${activityData._id || activityData.id}`
                },
                priority: 'normal'
            };
            
            return await createAndSendNotificationWithFCM(notificationData, socketIO, true);
        });
        await Promise.all(notificationPromises);

        console.log(`Notificaciones de actividad enviadas a ${followersToNotify.length} seguidores`);
    } catch (error) {
        console.error('Error enviando notificaciones de actividad:', error);
    }
};


// Crear una notificació d'assoliment desbloquejat amb FCM
export const createAchievementUnlockedNotificationWithFCM = async (
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
            title: '¡Logro desbloqueado!',
            message: `Has desbloqueado el logro: ${achievementTitle}`,
            data: {
                achievementId,
                achievementTitle,
                achievementDescription,
                type: 'achievement',
                actionUrl: `/achievements/${achievementId}`
            },
            priority: 'high'
        };

        // Usar la nueva función que incluye FCM
        return await createAndSendNotificationWithFCM(notificationData, socketIO, true);
    } catch (error) {
        console.error('Error creating achievement unlocked notification with FCM:', error);
        throw error;
    }
};


// Crear una notificació de sol·licitut d'amistat