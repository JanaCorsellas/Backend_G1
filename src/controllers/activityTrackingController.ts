import { Request, Response } from 'express';
import * as activityTrackingService from '../services/activityTrackingService';
import ActivityModel from '../models/activity';
import UserModel from '../models/user';
import mongoose from 'mongoose';
import ReferencePointModel from '../models/referencePoint';
import { createActivityNotificationForFollowers } from '../services/notificationService';
import { getIO } from '../config/socketConfig';

// Iniciar una nueva actividad de tracking
export const startTrackingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, activityType } = req.body;

    if (!userId || !activityType) {
      res.status(400).json({ message: 'Se requiere ID de usuario y tipo de actividad' });
      return;
    }

    // Verificar que el usuario existe
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    // Verificar que el tipo de actividad es válido
    const validTypes = ['running', 'cycling', 'hiking', 'walking'];
    if (!validTypes.includes(activityType)) {
      res.status(400).json({ message: 'Tipo de actividad no válido' });
      return;
    }

    // Verificar si ya hay una actividad activa para este usuario
    const activeTrackings = await activityTrackingService.getActiveTrackingsByUserId(userId);
    if (activeTrackings.length > 0) {
      res.status(400).json({ 
        message: 'Ya existe una actividad de tracking activa para este usuario',
        activeTrackingId: activeTrackings[0]._id
      });
      return;
    }

    const newTracking = await activityTrackingService.startActivityTracking(userId, activityType);
    
    res.status(201).json({
      message: 'Tracking iniciado con éxito',
      tracking: {
        id: newTracking._id,
        activityType: newTracking.activityType,
        startTime: newTracking.startTime
      }
    });
  } catch (error: any) {
    console.error('Error al iniciar tracking:', error);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar ubicación en un tracking existente
export const updateLocationController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;
    const { latitude, longitude, altitude, speed } = req.body;

    if (!trackingId || !latitude || !longitude) {
      res.status(400).json({ message: 'Se requiere ID de tracking, latitud y longitud' });
      return;
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      altitude: altitude ? parseFloat(altitude) : undefined,
      speed: speed ? parseFloat(speed) : undefined
    };

    const updatedTracking = await activityTrackingService.updateTrackingLocation(trackingId, locationData);

    if (!updatedTracking) {
      res.status(404).json({ message: 'Tracking no encontrado o no está activo' });
      return;
    }

    res.status(200).json({
      message: 'Ubicación actualizada con éxito',
      tracking: {
        id: updatedTracking._id,
        currentDistance: updatedTracking.currentDistance,
        currentDuration: updatedTracking.currentDuration,
        currentSpeed: updatedTracking.currentSpeed,
        averageSpeed: updatedTracking.averageSpeed,
        elevationGain: updatedTracking.elevationGain
      }
    });
  } catch (error: any) {
    console.error('Error al actualizar ubicación:', error);
    res.status(500).json({ message: error.message });
  }
};

// Pausar una actividad de tracking
export const pauseTrackingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      res.status(400).json({ message: 'Se requiere ID de tracking' });
      return;
    }

    const pausedTracking = await activityTrackingService.pauseActivityTracking(trackingId);

    if (!pausedTracking) {
      res.status(404).json({ message: 'Tracking no encontrado o no está activo' });
      return;
    }

    res.status(200).json({
      message: 'Tracking pausado con éxito',
      tracking: {
        id: pausedTracking._id,
        isPaused: pausedTracking.isPaused,
        pauseTime: pausedTracking.pauseTime
      }
    });
  } catch (error: any) {
    console.error('Error al pausar tracking:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reanudar una actividad de tracking
export const resumeTrackingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      res.status(400).json({ message: 'Se requiere ID de tracking' });
      return;
    }

    const resumedTracking = await activityTrackingService.resumeActivityTracking(trackingId);

    if (!resumedTracking) {
      res.status(404).json({ message: 'Tracking no encontrado, no está activo o no está pausado' });
      return;
    }

    res.status(200).json({
      message: 'Tracking reanudado con éxito',
      tracking: {
        id: resumedTracking._id,
        isPaused: resumedTracking.isPaused,
        totalPausedTime: resumedTracking.totalPausedTime
      }
    });
  } catch (error: any) {
    console.error('Error al reanudar tracking:', error);
    res.status(500).json({ message: error.message });
  }
};

// Finalizar una actividad de tracking y convertirla en actividad permanente
export const finishTrackingController = async (req: Request, res: Response): Promise<void> => {
    try {
      const { trackingId } = req.params;
      const { name } = req.body; // Nombre opcional para la actividad
  
      if (!trackingId) {
        res.status(400).json({ message: 'Se requiere ID de tracking' });
        return;
      }
  
      const finishedTracking = await activityTrackingService.finishActivityTracking(trackingId);
  
      if (!finishedTracking) {
        res.status(404).json({ message: 'Tracking no encontrado o no está activo' });
        return;
      }
  
      // Crear una nueva actividad basada en el tracking completado
      try {
        // 1. Primero creamos ReferencePoints para cada punto de la ruta
        const referencePoints = [];
        
        for (const point of finishedTracking.locationPoints) {
          const refPoint = new ReferencePointModel({
            latitude: point.latitude,
            longitude: point.longitude,
            altitude: point.altitude || 0
          });
          
          const savedRefPoint = await refPoint.save();
          referencePoints.push(savedRefPoint._id);
        }
        
        // 2. Ahora creamos la actividad con referencias a los puntos creados
        const newActivity = new ActivityModel({
          author: finishedTracking.userId,
          name: name || `${finishedTracking.activityType.charAt(0).toUpperCase() + finishedTracking.activityType.slice(1)} ${finishedTracking.startTime.toLocaleDateString()}`,
          startTime: finishedTracking.startTime,
          endTime: finishedTracking.endTime,
          duration: finishedTracking.currentDuration / 60, // Convertir a minutos para el modelo de actividad
          distance: finishedTracking.currentDistance,
          elevationGain: finishedTracking.elevationGain,
          averageSpeed: finishedTracking.averageSpeed,
          type: finishedTracking.activityType,
          route: referencePoints, // Array de ObjectIds de ReferencePoint
          musicPlaylist: [] // Playlist vacía por defecto
        });
  
        const savedActivity = await newActivity.save();
  
        // Actualizar el usuario con la nueva actividad
        await UserModel.findByIdAndUpdate(
          finishedTracking.userId,
          { 
            $push: { activities: savedActivity._id },
            $inc: { 
              totalDistance: finishedTracking.currentDistance,
              totalTime: finishedTracking.currentDuration / 60 // Convertir a minutos
            }
          }
        );

        // Enviar notificacions als seguidors

        try {
          //const { getIO } = await import('../config/socketConfig.js');  
          const socketIO = getIO();
            
            const activityNotificationData = {
                _id: savedActivity._id,
                id: savedActivity._id,
                name: savedActivity.name,
                type: savedActivity.type,
                distance: savedActivity.distance,
                duration: savedActivity.duration,
                startTime: savedActivity.startTime,
                endTime: savedActivity.endTime
            };

            console.log(`Enviando notificaciones de actividad completada...`);
            
            // Enviar notificaciones de forma asíncrona
            setImmediate(async () => {
                await createActivityNotificationForFollowers(
                    finishedTracking.userId.toString(), 
                    activityNotificationData, 
                    socketIO
                );
            });
            
        } catch (notificationError) {
            console.error('Error enviando notificaciones de actividad:', notificationError);
            // No fallar la operación principal
        }
  
        res.status(200).json({
          message: 'Tracking finalizado y actividad creada con éxito',
          tracking: {
            id: finishedTracking._id,
            endTime: finishedTracking.endTime,
            totalDistance: finishedTracking.currentDistance,
            totalDuration: finishedTracking.currentDuration
          },
          activity: {
            id: savedActivity._id,
            name: savedActivity.name
          }
        });
      } catch (activityError: any) {
        console.error('Error al crear actividad:', activityError);
        res.status(200).json({
          message: 'Tracking finalizado pero hubo un error al crear la actividad',
          tracking: {
            id: finishedTracking._id,
            endTime: finishedTracking.endTime,
            totalDistance: finishedTracking.currentDistance,
            totalDuration: finishedTracking.currentDuration
          },
          error: activityError.message
        });
      }
    } catch (error: any) {
      console.error('Error al finalizar tracking:', error);
      res.status(500).json({ message: error.message });
    }
};

// Descartar un tracking (eliminar sin convertir en actividad)
export const discardTrackingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      res.status(400).json({ message: 'Se requiere ID de tracking' });
      return;
    }

    const discarded = await activityTrackingService.discardTracking(trackingId);

    if (!discarded) {
      res.status(404).json({ message: 'Tracking no encontrado' });
      return;
    }

    res.status(200).json({
      message: 'Tracking descartado con éxito'
    });
  } catch (error: any) {
    console.error('Error al descartar tracking:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener un tracking por ID
export const getTrackingController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { trackingId } = req.params;

    if (!trackingId) {
      res.status(400).json({ message: 'Se requiere ID de tracking' });
      return;
    }

    const tracking = await activityTrackingService.getTrackingById(trackingId);

    if (!tracking) {
      res.status(404).json({ message: 'Tracking no encontrado' });
      return;
    }

    res.status(200).json(tracking);
  } catch (error: any) {
    console.error('Error al obtener tracking:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los trackings activos de un usuario
export const getActiveTrackingsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'Se requiere ID de usuario' });
      return;
    }

    const trackings = await activityTrackingService.getActiveTrackingsByUserId(userId);

    res.status(200).json({
      count: trackings.length,
      trackings
    });
  } catch (error: any) {
    console.error('Error al obtener trackings activos:', error);
    res.status(500).json({ message: error.message });
  }
};