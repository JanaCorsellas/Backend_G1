import mongoose, { Schema, Document } from 'mongoose';

// Esquema para un punto de ubicación GPS
const locationPointSchema = new Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  altitude: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  speed: {
    type: Number,
    default: 0  // metros por segundo
  }
});

// Esquema para el tracking en tiempo real
export const activityTrackingSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activityType: {
    type: String,
    enum: ['running', 'cycling', 'hiking', 'walking'],
    required: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPaused: {
    type: Boolean,
    default: false
  },
  pauseTime: {
    type: Date
  },
  totalPausedTime: {
    type: Number,
    default: 0  // en milisegundos
  },
  currentDistance: {
    type: Number,
    default: 0  // en metros
  },
  currentDuration: {
    type: Number,
    default: 0  // en segundos
  },
  currentSpeed: {
    type: Number,
    default: 0  // metros por segundo
  },
  averageSpeed: {
    type: Number,
    default: 0  // metros por segundo
  },
  maxSpeed: {
    type: Number,
    default: 0  // metros por segundo
  },
  elevationGain: {
    type: Number,
    default: 0  // en metros
  },
  locationPoints: [locationPointSchema]
});

// Interfaz para un punto de ubicación
export interface ILocationPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
  timestamp?: Date;
  speed?: number;
}

// Interfaz para el tracking de actividad
export interface IActivityTracking extends Document {
  userId: mongoose.Types.ObjectId;
  activityType: 'running' | 'cycling' | 'hiking' | 'walking';
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isPaused: boolean;
  pauseTime?: Date;
  totalPausedTime: number;
  currentDistance: number;
  currentDuration: number;
  currentSpeed: number;
  averageSpeed: number;
  maxSpeed: number;
  elevationGain: number;
  locationPoints: ILocationPoint[];
}

const ActivityTrackingModel = mongoose.model<IActivityTracking>('ActivityTracking', activityTrackingSchema);
export default ActivityTrackingModel;