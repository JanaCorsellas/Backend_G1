import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  name: string;
  description?: string;
  participants: mongoose.Types.ObjectId[];
  createdAt: Date;
  lastMessage?: string;
  lastMessageTime?: Date;
  isGroup: boolean;
  groupPictureUrl?: string;
}

const chatRoomSchema = new Schema<IChatRoom>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: String,
    required: false
  },
  lastMessageTime: {
    type: Date,
    required: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  groupPictureUrl: {
    type: String,
    required: false
  }
});

// Índices para mejorar el rendimiento de las consultas
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ lastMessageTime: -1 });

const ChatRoomModel = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
export default ChatRoomModel;