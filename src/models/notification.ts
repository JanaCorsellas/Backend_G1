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
            'friend_request_accepted',      
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
        index: true // Per optimitzar consultes no llegides
    },
    readAt: {
        type: Date,
        default: null
    },
    sentViaPush: {
        type: Boolean,
        default: false
    },
    pushDelivered: {
        type: Boolean,
        default: false
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

// TTL per eliminar notificaciones antigues
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

notificationSchema.methods.markAsRead = function() {
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

notificationSchema.methods.getSummary = function() {
  return {
    id: this._id,
    type: this.type,
    title: this.title,
    message: this.message,
    read: this.read,
    createdAt: this.createdAt,
    data: this.data
  };
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
// Configuración para JSON serialization
notificationSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

notificationSchema.set('toObject', { virtuals: true });

export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: 'new_follower' | 'achievement_unlocked' | 'challenge_completed' | 'activity_update' | 'chat_message' | 'friend_request' | 'friend_request_accepted' | 'system';
    title: string;
    message: string;
    data?: {
        senderId?: string;
        senderUsername?: string;
        senderAvatar?: string;
        activityId?: string;
        activityType?: string;
        challengeId?: string;
        roomId?: string;
        achievementId?: string;
        [key: string]: any;
    }
    read: boolean;
    sentViaPush: boolean;
    pushDelivered: boolean;
    readAt?: Date;
    priority: 'low' | 'normal' | 'high';
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    
    markAsRead(): Promise<INotification>;
    getSummary(): any;
    isExpired(): boolean;
}

export interface INotificationModel extends mongoose.Model<INotification> {
    markAllAsRead(userId: string): Promise<any>;
    deleteOldNotifications(daysOld?: number): Promise<any>;
    getUnreadCount(userId: string): Promise<number>;
}

const NotificationModel = mongoose.model<INotification, INotificationModel>('Notification', notificationSchema);
export default NotificationModel;