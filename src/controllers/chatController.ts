import { Request, Response } from 'express';
import * as chatService from '../services/chatService';
import { getIO } from '../config/socketConfig';

// Crear una sala de chat
export const createChatRoomController = async (req: Request, res: Response) => {
  try {
    const { name, participants, description, isGroup } = req.body;
    
    // Validar datos requeridos
    if (!name || !participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ message: 'Datos inválidos. Se requiere nombre y al menos 2 participantes' });
    }
    
    const chatRoom = await chatService.createChatRoom({
      name,
      participants,
      description,
      isGroup
    });
    
    res.status(201).json(chatRoom);
  } catch (error: any) {
    console.error('Error al crear sala de chat:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener salas de chat para un usuario
export const getChatRoomsForUserController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'Se requiere ID de usuario' });
    }
    
    const chatRooms = await chatService.getChatRoomsForUser(userId);
    res.status(200).json(chatRooms);
  } catch (error: any) {
    console.error('Error al obtener salas de chat:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener detalles de una sala de chat
export const getChatRoomByIdController = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Se requiere ID de sala' });
    }
    
    const chatRoom = await chatService.getChatRoomById(roomId);
    
    if (!chatRoom) {
      return res.status(404).json({ message: 'Sala no encontrada' });
    }
    
    res.status(200).json(chatRoom);
  } catch (error: any) {
    console.error('Error al obtener detalles de sala:', error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener mensajes para una sala
export const getMessagesForRoomController = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.roomId;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Se requiere ID de sala' });
    }
    
    const messages = await chatService.getMessagesForRoom(roomId, limit, before);
    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ message: error.message });
  }
};

// Enviar un mensaje
export const sendMessageController = async (req: Request, res: Response) => {
  try {
    const { roomId, senderId, content } = req.body;
    
    // Validar datos requeridos
    if (!roomId || !senderId || !content) {
      return res.status(400).json({ message: 'Se requiere ID de sala, ID de remitente y contenido' });
    }
    
    const message = await chatService.saveMessage({
      roomId,
      senderId,
      content
    });
    
    // Notificar a través de Socket.IO
    try {
      const io = getIO();
      io.to(roomId).emit('new_message', {
        id: message._id,
        roomId: message.roomId,
        senderId: message.senderId,
        content: message.content,
        timestamp: message.timestamp,
        readBy: message.readBy
      });
    } catch (error) {
      console.error('Error al enviar mensaje por Socket.IO:', error);
    }
    
    res.status(201).json(message);
  } catch (error: any) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: error.message });
  }
};

// Marcar mensajes como leídos
export const markMessagesAsReadController = async (req: Request, res: Response) => {
  try {
    const { roomId, userId } = req.body;
    
    // Validar datos requeridos
    if (!roomId || !userId) {
      return res.status(400).json({ message: 'Se requiere ID de sala e ID de usuario' });
    }
    
    const updatedCount = await chatService.markMessagesAsRead(roomId, userId);
    
    res.status(200).json({ 
      message: `${updatedCount} mensajes marcados como leídos`, 
      count: updatedCount 
    });
  } catch (error: any) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una sala de chat
export const deleteChatRoomController = async (req: Request, res: Response) => {
  try {
    const roomId = req.params.id;
    
    if (!roomId) {
      return res.status(400).json({ message: 'Se requiere ID de sala' });
    }
    
    console.log(`Solicitud para eliminar sala de chat ${roomId}`);
    
    const deleted = await chatService.deleteChatRoom(roomId);
    
    if (!deleted) {
      console.log(`Sala ${roomId} no encontrada o no se pudo eliminar`);
      return res.status(404).json({ message: 'Sala no encontrada o error al eliminar' });
    }
    
    // Notificar a todos los clientes que la sala ha sido eliminada
    try {
      const io = getIO();
      io.sockets.emit(`room_deleted`, { roomId });
    } catch (error) {
      console.error('Error al notificar eliminación de sala por Socket.IO:', error);
    }
    
    res.status(200).json({ message: 'Sala eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar sala de chat:', error);
    res.status(500).json({ message: error.message });
  }
};
// Obtener conteo de mensajes no leídos
export const getUnreadMessagesCountController = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'Se requiere ID de usuario' });
    }
    
    const unreadCounts = await chatService.getUnreadMessagesCount(userId);
    res.status(200).json(unreadCounts);
  } catch (error: any) {
    console.error('Error al obtener conteo de mensajes no leídos:', error);
    res.status(500).json({ message: error.message });
  }
};