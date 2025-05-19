import ActivityModel, { IActivity } from "../models/activity";
import UserModel from "../models/user";
import mongoose from "mongoose";
import * as activityHistoryService from './activityHistoryService';
import { IActivityHistory } from "../models/activityHistory";
import * as achievementService from './achievementService';

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

    // Verificar y desbloquear nuevos logros
    try {
        const { checkAndUnlockAchievements } = await import('./achievementService.js');
        const newAchievements = await checkAndUnlockAchievements(userId);
        
        if (newAchievements.length > 0) {
            console.log(`Usuario ${userId} desbloqueó ${newAchievements.length} nuevos logros`);
            // Aquí podrías enviar una notificación al usuario sobre los nuevos logros
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
/*
// Obtener todas las actividades de un usuario
export const getActivitiesByUserId = async (userId: string): Promise<IActivity[]> => {
    return await ActivityModel.find({ author: userId }).populate('route').populate('musicPlaylist');
};*/
export const getActivitiesByUserIdPaginated = async (
  userId: string,
  page: number = 1,
  limit: number = 4
): Promise<{
  activities: IActivity[];
  totalActivities: number;
  totalPages: number;
  currentPage: number;
}> => {
  const skip = (page - 1) * limit;

  const [activities, totalActivities] = await Promise.all([
    ActivityModel.find({ author: userId })
      .skip(skip)
      .limit(limit)
      .populate('route')
      .populate('musicPlaylist'),
    ActivityModel.countDocuments({ author: userId })
  ]);

  return {
    activities,
    totalActivities,
    totalPages: Math.ceil(totalActivities / limit),
    currentPage: page
  };
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