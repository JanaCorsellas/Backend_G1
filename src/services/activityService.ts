import ActivityModel, { IActivity } from "../models/activity";
import UserModel from "../models/user";
import mongoose from "mongoose";
import * as activityHistoryService from './activityHistoryService';
import { IActivityHistory } from "../models/activityHistory";
import * as achievementService from './achievementService';
import { createActivityNotificationForFollowers } from './notificationService';
import { getIO } from '../config/socketConfig';

// Función auxiliar para normalizar las fechas (eliminar la influencia de zona horaria)
const normalizeDate = (date: Date | string | undefined): string => {
  if (!date) return '';
  
  // Convertir a objeto Date si es string
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Extraer solo la parte de fecha y hora, sin la zona horaria
  return dateObj.toISOString().split('.')[0] + 'Z';
};

// Crear una nueva actividad y asociarla a un usuario
export const createActivity = async (userId: string, activityData: Omit<IActivity, 'author'>): Promise<IActivity> => {
    const activity = await ActivityModel.create({ ...activityData, author: userId });

    // Agregar la actividad al array de actividades del usuario
    await UserModel.findByIdAndUpdate(userId, { $push: { activities: activity._id } });

    // Registrar en el historial
    await activityHistoryService.createActivityHistory({
        activityId: activity._id,
        userId: new mongoose.Types.ObjectId(userId),
        changeType: 'create',
        newValues: activity.toObject()
    });

    // Enviar notificacions als seguidors
    try {
        //const { getIO } = await import('../config/socketConfig.js');
        const socketIO = getIO(); // Obtener instancia de Socket.IO
        
        // Preparar datos de la actividad para las notificaciones
        const activityNotificationData = {
            _id: activity._id,
            id: activity._id,
            name: activity.name,
            type: activity.type,
            distance: activity.distance,
            duration: activity.duration,
            startTime: activity.startTime,
            endTime: activity.endTime
        };

        console.log(`Enviando notificaciones de nueva actividad...`);
        
        // Llamar a la función de notificaciones de forma asíncrona para no bloquear
        setImmediate(async () => {
            await createActivityNotificationForFollowers(
                userId, 
                activityNotificationData, 
                socketIO
            );
        });
        
    } catch (notificationError) {
        console.error('Error enviando notificaciones de actividad (no crítico):', notificationError);
        // No fallar la creación de actividad si fallan las notificaciones
    }

    // Verificar y desbloquear nuevos logros
    try {
        const newAchievements = await achievementService.checkAndUnlockAchievements(userId);
        
        if (newAchievements.length > 0) {
            console.log(`Usuario ${userId} desbloqueó ${newAchievements.length} nuevos logros`);
            
            // No es necesario actualizar manualmente aquí, ya que checkAndUnlockAchievements
            // ahora también actualiza el array de achievements del usuario
        }
    } catch (error) {
        console.error('Error checking achievements:', error);
        // No fallar la creación de actividad si falla la verificación de logros
    }

    return activity;
};

// Obtener una actividad por ID
export const getActivityById = async (activityId: string): Promise<IActivity | null> => {
    return await ActivityModel.findById(activityId).populate('route').populate('musicPlaylist').populate('author');
};

// Obtener todas las actividades de un usuario
export const getActivitiesByUserId = async (userId: string): Promise<IActivity[]> => {
    return await ActivityModel.find({ author: userId }).populate('route').populate('musicPlaylist');
};

// Obtener todas las actividades
export const getAllActivities = async (): Promise<IActivity[]> => {
    return await ActivityModel.find().populate('route').populate('musicPlaylist').populate('author');
};

// Actualizar una actividad - Versión mejorada con corrección de zonas horarias
export const updateActivity = async (activityId: string, activityData: Partial<IActivity>): Promise<IActivity | null> => {
    // Obtener la actividad anterior para el historial
    const previousActivity = await ActivityModel.findById(activityId);
    
    if (!previousActivity) {
        return null;
    }
    
    // Realizar la actualización
    const updatedActivity = await ActivityModel.findByIdAndUpdate(
        activityId, 
        activityData, 
        { new: true }
    );
    
    if (updatedActivity) {
        // Determinar qué campos realmente cambiaron excluyendo campos derivados
        const changedFields = Object.keys(activityData).filter(key => {
            // Ignorar campos derivados o calculados
            if (key === 'authorName' || key === '__v') return false;
            
            const keyAsKeyof = key as keyof IActivity;
            const prevValue = previousActivity[keyAsKeyof];
            const newValue = activityData[keyAsKeyof];
            
            // Para fechas, normalizar antes de comparar para evitar problemas de zona horaria
            if (key === 'startTime' || key === 'endTime') {
                const normalizedPrev = normalizeDate(prevValue as Date);
                const normalizedNew = normalizeDate(newValue as Date);
                return normalizedPrev !== normalizedNew;
            }
            
            // Comparación simple para valores primitivos
            if (typeof prevValue !== 'object' && typeof newValue !== 'object') {
                return prevValue !== newValue;
            }
            
            // Para objetos y arrays, usar comparación JSON
            return JSON.stringify(prevValue) !== JSON.stringify(newValue);
        });
        
        // Registrar en el historial solo si hay cambios reales
        if (changedFields.length > 0) {
            await activityHistoryService.createActivityHistory({
                activityId: updatedActivity._id,
                userId: typeof updatedActivity.author === 'object' 
                    ? updatedActivity.author._id 
                    : updatedActivity.author,
                changeType: 'update',
                changedFields: changedFields,
                previousValues: previousActivity.toObject(),
                newValues: updatedActivity.toObject()
            });
        }
    }
    
    return updatedActivity;
};

// Eliminar una actividad y quitar la referencia del usuario
export const deleteActivity = async (activityId: string): Promise<IActivity | null> => {
    // Obtener la actividad para el historial antes de eliminarla
    const activity = await ActivityModel.findById(activityId);
    
    if (!activity) {
        return null;
    }
    
    // Eliminar la actividad
    const deletedActivity = await ActivityModel.findByIdAndDelete(activityId);
    
    if (deletedActivity) {
        // Quitar la referencia del usuario
        await UserModel.findByIdAndUpdate(
            deletedActivity.author, 
            { $pull: { activities: activityId } }
        );
        
        // Registrar en el historial
        await activityHistoryService.createActivityHistory({
            activityId: deletedActivity._id,
            userId: typeof deletedActivity.author === 'object' 
                ? deletedActivity.author._id 
                : deletedActivity.author,
            changeType: 'delete',
            previousValues: deletedActivity.toObject()
        });
    }
    
    return deletedActivity;
};

// Buscar actividades por criterios
export const searchActivities = async (
    criteria: any, 
    page: number = 1, 
    limit: number = 10, 
    sortField: string = 'startTime', 
    sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
    activities: IActivity[];
    total: number;
    page: number;
    pages: number;
}> => {
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const query = { ...criteria };
    
    // Búsqueda por nombre (parcial)
    if (query.name && typeof query.name === 'string') {
        query.name = { $regex: query.name, $options: 'i' };
    }
    
    const total = await ActivityModel.countDocuments(query);
    
    const activities = await ActivityModel.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username')
        .populate('route')
        .populate('musicPlaylist');
    
    return {
        activities,
        total,
        page,
        pages: Math.ceil(total / limit)
    };
};