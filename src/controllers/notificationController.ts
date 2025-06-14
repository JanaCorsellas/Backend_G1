import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

// Obtener notificaciones de un usuario
export const getUserNotificationsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page?.toString() || '1', 10);
        const limit = parseInt(req.query.limit?.toString() || '20', 10);
        const onlyUnread = req.query.unread === 'true';

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        if (page < 1 || limit < 1 || limit > 100) {
            res.status(400).json({ message: 'Invalid pagination parameters' });
            return;
        }

        const result = await notificationService.getUserNotifications(userId, page, limit, onlyUnread);

        res.status(200).json({
            message: 'Notifications retrieved successfully',
            notifications: result.notifications,
            totalNotifications: result.totalNotifications,
            unreadCount: result.unreadCount,
            totalPages: result.totalPages,
            currentPage: result.currentPage
        });
    } catch (error) {
        console.error('Error getting user notifications:', error);
        res.status(500).json({ message: 'Error getting user notifications' });
    }
};

// Marcar notificación como leída
export const markNotificationAsReadController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        if (!notificationId || !userId) {
            res.status(400).json({ message: 'Notification ID and User ID are required' });
            return;
        }

        const notification = await notificationService.markNotificationAsRead(notificationId, userId);

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsReadController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        const updatedCount = await notificationService.markAllNotificationsAsRead(userId);

        res.status(200).json({
            message: 'All notifications marked as read',
            updatedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Error marking all notifications as read' });
    }
};

// Eliminar notificación
export const deleteNotificationController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { notificationId } = req.params;
        const { userId } = req.body;

        if (!notificationId || !userId) {
            res.status(400).json({ message: 'Notification ID and User ID are required' });
            return;
        }

        const deleted = await notificationService.deleteNotification(notificationId, userId);

        if (!deleted) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Error deleting notification' });
    }
};

// Obtener conteo de notificaciones no leídas
export const getUnreadCountController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        const unreadCount = await notificationService.getUnreadNotificationsCount(userId);

        res.status(200).json({
            message: 'Unread count retrieved successfully',
            unreadCount
        });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Error getting unread count' });
    }
};

// Crear notificación de prueba (solo para testing)
export const createTestNotificationController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId, type, title, message, data } = req.body;

        if (!userId || !type || !title || !message) {
            res.status(400).json({ 
                message: 'userId, type, title, and message are required' 
            });
            return;
        }

        // Obtener Socket.IO desde el contexto global (si está disponible)
        const socketIO = (global as any).io;

        const notification = await notificationService.createAndSendNotificationWithFCM({
            userId,
            type,
            title,
            message,
            data: data || {}
        }, socketIO);

        res.status(201).json({
            message: 'Test notification created and sent successfully',
            notification
        });
    } catch (error) {
        console.error('Error creating test notification:', error);
        res.status(500).json({ message: 'Error creating test notification' });
    }
};

// Obtener estadísticas de notificacione
export const getNotificationStatsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' });
            return;
        }

        // Obtener estadísticas usando el servicio
        const [totalResult, unreadCount] = await Promise.all([
            notificationService.getUserNotifications(userId, 1, 1),
            notificationService.getUnreadNotificationsCount(userId)
        ]);

        const stats = {
            totalNotifications: totalResult.totalNotifications,
            unreadNotifications: unreadCount,
            readNotifications: totalResult.totalNotifications - unreadCount,
            readPercentage: totalResult.totalNotifications > 0 
                ? Math.round((totalResult.totalNotifications - unreadCount) / totalResult.totalNotifications * 100)
                : 0
        };

        res.status(200).json({
            message: 'Notification stats retrieved successfully',
            stats
        });
    } catch (error) {
        console.error('Error getting notification stats:', error);
        res.status(500).json({ message: 'Error getting notification stats' });
    }
};

// Limpiar notificaciones antiguas
export const cleanupOldNotificationsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const daysOld = parseInt(req.query.days?.toString() || '30', 10);

        if (daysOld < 1 || daysOld > 365) {
            res.status(400).json({ 
                message: 'Days must be between 1 and 365' 
            });
            return;
        }

        const deletedCount = await notificationService.cleanupOldNotifications(daysOld);

        res.status(200).json({
            message: 'Old notifications cleaned up successfully',
            deletedCount
        });
    } catch (error) {
        console.error('Error cleaning up old notifications:', error);
        res.status(500).json({ message: 'Error cleaning up old notifications' });
    }
};