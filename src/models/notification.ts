// src/models/notification.ts
import mongoose, { Schema, Types, Document } from "mongoose";

const notificationSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true 
    },
    type: {
        type: String,
        enum: [
            'new_follower',          
            'achievement_unlocked',  
            'challenge_completed',  
            'activity_update',       
            'chat_message',          
            'friend_request',       
            'system'                 
        ],
        required: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        type: Schema.Types.Mixed,
        default: {}
    },
    read: {
        type: Boolean,
        default: false,
        index: true // Para optimizar consultas de no leídas
    },
    readAt: {
        type: Date,
        default: null
    },
    // Metadatos útiles
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal'
    },
    expiresAt: {
        type: Date,
        default: null // null = no expira
    }
}, {
    timestamps: true,
    versionKey: false
});

// Índice compuesto para consultas eficientes
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

notificationSchema.methods.markAsRead = function() {
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

notificationSchema.methods.isExpired = function() {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
};

notificationSchema.statics.markAllAsRead = function(userId: string) {
    return this.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), read: false },
        { 
            read: true, 
            readAt: new Date() 
        }
    );
};

notificationSchema.statics.deleteOldNotifications = function(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return this.deleteMany({
        createdAt: { $lt: cutoffDate },
        read: true
    });
};

notificationSchema.statics.getUnreadCount = function(userId: string) {
    return this.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false
    });
};


// Limpiar notificaciones expiradas antes de guardar
notificationSchema.pre('save', function(this: INotification, next) {
    if (this.isExpired()) {
        return next(new Error('Cannot save expired notification'));
    }
    next();
});

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: 'new_follower' | 'achievement_unlocked' | 'challenge_completed' | 'activity_update' | 'chat_message' | 'friend_request' | 'system';
    title: string;
    message: string;
    data: any;
    read: boolean;
    readAt?: Date;
    priority: 'low' | 'normal' | 'high';
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    
    // Métodos de instancia
    markAsRead(): Promise<INotification>;
    isExpired(): boolean;
}

// Interfaces para métodos estáticos
export interface INotificationModel extends mongoose.Model<INotification> {
    markAllAsRead(userId: string): Promise<any>;
    deleteOldNotifications(daysOld?: number): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
}

const NotificationModel = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);
export default NotificationModel;