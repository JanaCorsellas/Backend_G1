import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  timestamp: Date;
  readBy: mongoose.Types.ObjectId[];
}

const messageSchema = new Schema<IMessage>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Índices para mejorar el rendimiento
messageSchema.index({ roomId: 1, timestamp: -1 });
messageSchema.index({ senderId: 1 });

const MessageModel = mongoose.model<IMessage>('Message', messageSchema);
export default MessageModel;