import { Request, Response } from 'express';
import * as notificationService from '../services/notificationService';

// Obtener notificaciones para el usuario actual
export const getUserNotificationsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.params.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }
    
    const result = await notificationService.getNotificationsByUser(userId, page, limit);
    
    res.status(200).json(result);
  } catch (error: any) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener notificaciones no leídas
export const getUnreadNotificationsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.params.userId;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }
    
    const notifications = await notificationService.getUnreadNotifications(userId, limit);
    
    res.status(200).json(notifications);
  } catch (error: any) {
    console.error('Error al obtener notificaciones no leídas:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener el número de notificaciones no leídas
export const getUnreadNotificationsCountController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.params.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }
    
    const count = await notificationService.getUnreadNotificationsCount(userId);
    
    res.status(200).json({ count });
  } catch (error: any) {
    console.error('Error al obtener conteo de notificaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

// Marcar notificación como leída
export const markNotificationAsReadController = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    
    if (!notificationId) {
      return res.status(400).json({ message: 'ID de notificación requerido' });
    }
    
    const result = await notificationService.markNotificationAsRead(notificationId);
    
    if (!result) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    res.status(200).json({ message: 'Notificación marcada como leída', notification: result });
  } catch (error: any) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: error.message });
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsReadController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autorizado' });
    }
    
    const updatedCount = await notificationService.markAllNotificationsAsRead(userId);
    
    res.status(200).json({ 
      message: `${updatedCount} notificaciones marcadas como leídas`,
      count: updatedCount
    });
  } catch (error: any) {
    console.error('Error al marcar notificaciones como leídas:', error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar notificación
export const deleteNotificationController = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    
    if (!notificationId) {
      return res.status(400).json({ message: 'ID de notificación requerido' });
    }
    
    const success = await notificationService.deleteNotification(notificationId);
    
    if (!success) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }
    
    res.status(200).json({ message: 'Notificación eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar notificación:', error);
    res.status(500).json({ message: error.message });
  }
};

// Crear notificación de prueba (útil para desarrollo y pruebas)
export const createTestNotificationController = async (req: Request, res: Response) => {
  try {
    const { recipientId, senderId, type, content, entityId, entityType } = req.body;
    
    if (!recipientId || !senderId || !type || !content) {
      return res.status(400).json({ 
        message: 'recipientId, senderId, type, y content son campos requeridos' 
      });
    }
    
    const notification = await notificationService.createNotification({
      recipientId,
      senderId,
      type,
      content,
      entityId,
      entityType
    });
    
    res.status(201).json(notification);
  } catch (error: any) {
    console.error('Error al crear notificación de prueba:', error);
    res.status(500).json({ message: error.message });
  }
};