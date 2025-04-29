import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: string;
  content: string;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  isRead: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['chat', 'activity', 'challenge', 'achievement', 'follow', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  entityId: {
    type: Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    enum: ['ChatRoom', 'Message', 'Activity', 'Challenge', 'Achievement', 'User']
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Índices para mejorar el rendimiento
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const NotificationModel = mongoose.model<INotification>('Notification', notificationSchema);
export default NotificationModel;