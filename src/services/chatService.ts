import mongoose from 'mongoose';
import ChatRoomModel, { IChatRoom } from '../models/chatRoom';
import MessageModel, { IMessage } from '../models/message';
import { getIO } from '../config/socketConfig';

// Crear una sala de chat
export const createChatRoom = async (roomData: {
  name: string;
  description?: string;
  participants: string[];
  isGroup?: boolean;
  groupPictureUrl?: string;
}): Promise<IChatRoom> => {
  // Convertir los IDs de string a ObjectId
  const participantIds = roomData.participants.map(id => new mongoose.Types.ObjectId(id));
  
  // Si son exactamente 2 participantes y no es grupo, verificar si ya existe una sala privada entre ellos
  if (participantIds.length === 2 && !roomData.isGroup) {
    // Ordenar los IDs para asegurar una búsqueda consistente
    const sortedParticipantIds = [...participantIds].sort((a, b) => a.toString().localeCompare(b.toString()));
    
    // Buscar sala existente con exactamente estos dos participantes
    console.log(`Buscando sala existente entre participantes: ${sortedParticipantIds.map(id => id.toString())}`);
    
    const existingRoom = await ChatRoomModel.findOne({
      participants: { $all: sortedParticipantIds },
      isGroup: false,
      // Asegurarse de que no hay más participantes que los especificados
      $expr: { $eq: [{ $size: "$participants" }, 2] }
    });
    
    if (existingRoom) {
      console.log(`Sala existente encontrada: ${existingRoom._id}`);
      return existingRoom;
    }
    
    console.log('No se encontró sala existente. Creando nueva sala.');
  }
  
  // Crear una nueva sala
  const chatRoom = new ChatRoomModel({
    name: roomData.name,
    description: roomData.description,
    participants: participantIds,
    isGroup: roomData.isGroup ?? (participantIds.length > 2),
    groupPictureUrl: roomData.groupPictureUrl,
    createdAt: new Date()
  });
  
  const savedRoom = await chatRoom.save();
  console.log(`Nueva sala creada: ${savedRoom._id}`);
  
  // Notificar a los participantes a través de Socket.IO
  try {
    const io = getIO();
    
    // Emitir evento a todos los participantes
    for (const participantId of roomData.participants) {
      io.to(`user:${participantId}`).emit('new_room', {
        roomId: savedRoom._id,
        name: savedRoom.name,
        participants: savedRoom.participants,
        isGroup: savedRoom.isGroup
      });
    }
  } catch (error) {
    console.error('Error al notificar creación de sala por Socket.IO:', error);
  }
  
  return savedRoom;
};

// Obtener salas de chat para un usuario
export const getChatRoomsForUser = async (userId: string): Promise<IChatRoom[]> => {
  return await ChatRoomModel.find({ 
    participants: new mongoose.Types.ObjectId(userId) 
  })
  .populate('participants', 'username profilePicture')
  .sort({ lastMessageTime: -1 });
};

// Obtener detalles de una sala de chat
export const getChatRoomById = async (roomId: string): Promise<IChatRoom | null> => {
  return await ChatRoomModel.findById(roomId)
    .populate('participants', 'username profilePicture');
};

// Guardar un mensaje
export const saveMessage = async (messageData: {
  roomId: string;
  senderId: string;
  content: string;
}): Promise<IMessage> => {
  console.log(`Guardando mensaje en sala ${messageData.roomId} del usuario ${messageData.senderId}`);
  
  // Crear mensaje
  const message = new MessageModel({
    roomId: new mongoose.Types.ObjectId(messageData.roomId),
    senderId: new mongoose.Types.ObjectId(messageData.senderId),
    content: messageData.content,
    timestamp: new Date(),
    readBy: [new mongoose.Types.ObjectId(messageData.senderId)] // El remitente lo marca como leído automáticamente
  });
  
  const savedMessage = await message.save();
  console.log(`Mensaje guardado con ID: ${savedMessage._id}`);
  
  // Actualizar la sala de chat con el último mensaje
  await ChatRoomModel.findByIdAndUpdate(
    messageData.roomId,
    { 
      lastMessage: messageData.content,
      lastMessageTime: new Date()
    }
  );
  
  // Poblar la información del remitente
  const populatedMessage = await MessageModel.findById(savedMessage._id)
    .populate('senderId', 'username profilePicture');
  
  if (!populatedMessage) {
    throw new Error('No se encontró el mensaje después de guardarlo');
  }
  
  return populatedMessage;
};

// Obtener mensajes para una sala
export const getMessagesForRoom = async (roomId: string, limit: number = 50, before?: Date): Promise<IMessage[]> => {
  console.log(`Obteniendo mensajes para sala ${roomId}`);
  
  const query: any = { roomId: new mongoose.Types.ObjectId(roomId) };
  
  if (before) {
    query.timestamp = { $lt: before };
  }
  
  const messages = await MessageModel.find(query)
    .populate('senderId', 'username profilePicture')
    .sort({ timestamp: -1 })
    .limit(limit);
    
  console.log(`Encontrados ${messages.length} mensajes para la sala ${roomId}`);
  return messages;
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (roomId: string, userId: string): Promise<number> => {
  const result = await MessageModel.updateMany(
    { 
      roomId: new mongoose.Types.ObjectId(roomId),
      readBy: { $ne: new mongoose.Types.ObjectId(userId) }
    },
    { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }
  );
  
  return result.modifiedCount;
};

export const updateGroupPicture = async (roomId: string, groupPictureUrl: string): Promise<IChatRoom | null> => {
  const updatedRoom = await ChatRoomModel.findByIdAndUpdate(
    roomId,
    { groupPictureUrl },
    { new: true }
  );
  return updatedRoom;
};

// Eliminar una sala de chat
export const deleteChatRoom = async (roomId: string): Promise<boolean> => {
  console.log(`Eliminando sala de chat: ${roomId}`);
  
  try {
    // Primero eliminar todos los mensajes asociados
    await MessageModel.deleteMany({ roomId: new mongoose.Types.ObjectId(roomId) });
    console.log(`Mensajes eliminados para sala ${roomId}`);
    
    // Luego eliminar la sala
    const result = await ChatRoomModel.deleteOne({ _id: new mongoose.Types.ObjectId(roomId) });
    
    if (result.deletedCount > 0) {
      console.log(`Sala ${roomId} eliminada exitosamente`);
      
      // Notificar a todos los clientes que la sala ha sido eliminada
      try {
        const io = getIO();
        io.to(`room:${roomId}`).emit('room_deleted', { roomId });
      } catch (error) {
        console.error('Error al notificar eliminación de sala por Socket.IO:', error);
      }
      
      return true;
    } else {
      console.log(`Sala ${roomId} no encontrada para eliminar`);
      return false;
    }
  } catch (error) {
    console.error(`Error eliminando sala ${roomId}:`, error);
    return false;
  }
};

// Obtener mensajes no leídos por usuario
export const getUnreadMessagesCount = async (userId: string): Promise<{ [roomId: string]: number }> => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  
  // Obtener todas las salas del usuario
  const userRooms = await ChatRoomModel.find({ participants: userObjectId });
  
  const result: { [roomId: string]: number } = {};
  
  // Contar mensajes no leídos para cada sala
  for (const room of userRooms as { _id: mongoose.Types.ObjectId }[]) {
    const count = await MessageModel.countDocuments({
      roomId: room._id,
      senderId: { $ne: userObjectId },
      readBy: { $ne: userObjectId }
    });
    
    if (count > 0) {
      result[room._id.toString()] = count;
    }
  }
  
  return result;
};