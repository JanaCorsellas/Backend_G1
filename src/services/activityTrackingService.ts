import mongoose from 'mongoose';
import ActivityTrackingModel, { IActivityTracking, ILocationPoint } from '../models/activityTracking';
import { getIO } from '../config/socketConfig';

// Cálculo de distancia entre dos puntos GPS usando la fórmula Haversine
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Radio de la tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
};

// Cálculo de la elevación ganada (solo cuenta subidas, no bajadas)
const calculateElevationGain = (prevAltitude: number, currentAltitude: number): number => {
  const diff = currentAltitude - prevAltitude;
  return diff > 0 ? diff : 0;
};

// Iniciar una nueva actividad de tracking
export const startActivityTracking = async (userId: string, activityType: string): Promise<IActivityTracking> => {
  const tracking = new ActivityTrackingModel({
    userId: new mongoose.Types.ObjectId(userId),
    activityType,
    startTime: new Date(),
    isActive: true,
    isPaused: false
  });

  const savedTracking = await tracking.save();
  
  // Emitir evento a través de Socket.IO
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit('tracking_started', {
      trackingId: savedTracking._id,
      activityType: savedTracking.activityType,
      startTime: savedTracking.startTime
    });
  } catch (error) {
    console.error('Error al emitir evento de inicio de tracking:', error);
  }

  return savedTracking;
};

// Actualizar tracking con una nueva ubicación
export const updateTrackingLocation = async (
  trackingId: string,
  locationData: ILocationPoint
): Promise<IActivityTracking | null> => {
  try {
    // Buscar el tracking activo
    const tracking = await ActivityTrackingModel.findById(trackingId);
    
    if (!tracking || !tracking.isActive || tracking.isPaused) {
      return null;
    }

    // Añadir el punto de ubicación
    const newPoint = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      altitude: locationData.altitude || 0,
      timestamp: new Date(),
      speed: locationData.speed || 0
    };

    // Calcular distancia si hay puntos previos
    if (tracking.locationPoints.length > 0) {
      const prevPoint = tracking.locationPoints[tracking.locationPoints.length - 1];
      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        newPoint.latitude,
        newPoint.longitude
      );

      // Actualizar distancia total
      tracking.currentDistance += distance;

      // Calcular elevación ganada
      if (prevPoint.altitude !== undefined && newPoint.altitude !== undefined) {
        tracking.elevationGain += calculateElevationGain(prevPoint.altitude, newPoint.altitude);
      }

      // Actualizar velocidad actual
      tracking.currentSpeed = newPoint.speed || 0;

      // Actualizar velocidad máxima si corresponde
      if (tracking.currentSpeed > tracking.maxSpeed) {
        tracking.maxSpeed = tracking.currentSpeed;
      }
    }

    // Calcular duración actual
    const now = new Date();
    const durationMs = now.getTime() - tracking.startTime.getTime() - tracking.totalPausedTime;
    tracking.currentDuration = Math.floor(durationMs / 1000); // Convertir a segundos

    // Calcular velocidad promedio
    if (tracking.currentDuration > 0) {
      tracking.averageSpeed = tracking.currentDistance / tracking.currentDuration;
    }

    // Añadir el nuevo punto
    tracking.locationPoints.push(newPoint);

    // Guardar los cambios
    const updatedTracking = await tracking.save();

    // Emitir actualización a través de Socket.IO
    try {
      const io = getIO();
      io.to(`user:${tracking.userId}`).emit('tracking_updated', {
        trackingId: updatedTracking._id,
        currentDistance: updatedTracking.currentDistance,
        currentDuration: updatedTracking.currentDuration,
        currentSpeed: updatedTracking.currentSpeed,
        averageSpeed: updatedTracking.averageSpeed,
        elevationGain: updatedTracking.elevationGain
      });
    } catch (error) {
      console.error('Error al emitir evento de actualización de tracking:', error);
    }

    return updatedTracking;
  } catch (error) {
    console.error('Error updating tracking location:', error);
    return null;
  }
};

// Pausar actividad
export const pauseActivityTracking = async (trackingId: string): Promise<IActivityTracking | null> => {
  const tracking = await ActivityTrackingModel.findById(trackingId);
  
  if (!tracking || !tracking.isActive || tracking.isPaused) {
    return null;
  }

  tracking.isPaused = true;
  tracking.pauseTime = new Date();

  const updatedTracking = await tracking.save();

  // Emitir evento a través de Socket.IO
  try {
    const io = getIO();
    io.to(`user:${tracking.userId}`).emit('tracking_paused', {
      trackingId: updatedTracking._id,
      pauseTime: updatedTracking.pauseTime
    });
  } catch (error) {
    console.error('Error al emitir evento de pausa de tracking:', error);
  }

  return updatedTracking;
};

// Reanudar actividad
export const resumeActivityTracking = async (trackingId: string): Promise<IActivityTracking | null> => {
  const tracking = await ActivityTrackingModel.findById(trackingId);
  
  if (!tracking || !tracking.isActive || !tracking.isPaused) {
    return null;
  }

  // Calcular tiempo pausado
  if (tracking.pauseTime) {
    const now = new Date();
    const pausedMs = now.getTime() - tracking.pauseTime.getTime();
    tracking.totalPausedTime += pausedMs;
  }

  tracking.isPaused = false;
  tracking.pauseTime = undefined;

  const updatedTracking = await tracking.save();

  // Emitir evento a través de Socket.IO
  try {
    const io = getIO();
    io.to(`user:${tracking.userId}`).emit('tracking_resumed', {
      trackingId: updatedTracking._id,
      totalPausedTime: updatedTracking.totalPausedTime
    });
  } catch (error) {
    console.error('Error al emitir evento de reanudación de tracking:', error);
  }

  return updatedTracking;
};

// Finalizar actividad
export const finishActivityTracking = async (trackingId: string): Promise<IActivityTracking | null> => {
  const tracking = await ActivityTrackingModel.findById(trackingId);
  
  if (!tracking || !tracking.isActive) {
    return null;
  }

  // Si estaba pausado, actualizar el tiempo total pausado
  if (tracking.isPaused && tracking.pauseTime) {
    const now = new Date();
    const pausedMs = now.getTime() - tracking.pauseTime.getTime();
    tracking.totalPausedTime += pausedMs;
  }

  tracking.isActive = false;
  tracking.isPaused = false;
  tracking.endTime = new Date();

  // Recalcular duración final
  const durationMs = tracking.endTime.getTime() - tracking.startTime.getTime() - tracking.totalPausedTime;
  tracking.currentDuration = Math.floor(durationMs / 1000); // Convertir a segundos

  // Recalcular velocidad promedio final
  if (tracking.currentDuration > 0) {
    tracking.averageSpeed = tracking.currentDistance / tracking.currentDuration;
  }

  const finishedTracking = await tracking.save();

  // Emitir evento a través de Socket.IO
  try {
    const io = getIO();
    io.to(`user:${tracking.userId}`).emit('tracking_finished', {
      trackingId: finishedTracking._id,
      endTime: finishedTracking.endTime,
      totalDistance: finishedTracking.currentDistance,
      totalDuration: finishedTracking.currentDuration,
      averageSpeed: finishedTracking.averageSpeed,
      maxSpeed: finishedTracking.maxSpeed,
      elevationGain: finishedTracking.elevationGain
    });
  } catch (error) {
    console.error('Error al emitir evento de finalización de tracking:', error);
  }

  return finishedTracking;
};

// Obtener un tracking por ID
export const getTrackingById = async (trackingId: string): Promise<IActivityTracking | null> => {
  return await ActivityTrackingModel.findById(trackingId);
};

// Obtener todos los trackings activos de un usuario
export const getActiveTrackingsByUserId = async (userId: string): Promise<IActivityTracking[]> => {
  return await ActivityTrackingModel.find({
    userId: new mongoose.Types.ObjectId(userId),
    isActive: true
  });
};

// Descartar un tracking (eliminarlo sin convertirlo en actividad)
export const discardTracking = async (trackingId: string): Promise<boolean> => {
  const result = await ActivityTrackingModel.deleteOne({ _id: trackingId });
  
  return result.deletedCount === 1;
};