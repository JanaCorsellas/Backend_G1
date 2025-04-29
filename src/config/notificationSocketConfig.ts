import { Server } from 'socket.io';
import { getIO } from './socketConfig';
import * as notificationService from '../services/notificationService';

export const initializeNotificationSockets = (): void => {
  const io = getIO();
  
  // Asegurarse de que haya una instancia de Socket.IO disponible
  if (!io) {
    console.error('Socket.IO no inicializado');
    return;
  }
  
  // El middleware ya está configurado en socketConfig.ts
  
  // Escuchar el evento de nuevo mensaje para generar notificaciones
  io.on('connection', (socket) => {
    // Cuando un usuario envía un mensaje
    socket.on('send_message', async (messageData) => {
      try {
        // El evento estándar ya se maneja en socketConfig.ts
        // Aquí solo creamos la notificación si el destinatario no está en la sala
        
        const roomId = messageData.roomId;
        const senderId = socket.data.userId || messageData.senderId;
        
        if (!roomId || !senderId) return;
        
        // Obtener todos los miembros de la sala
        const room = io.sockets.adapter.rooms.get(roomId);
        if (!room) return;
        
        // Verificar qué usuarios están en la sala actualmente
        const socketsInRoom = Array.from(room);
        
        // Obtener los IDs de usuario de cada socket en la sala
        const userIdsInRoom = new Set<string>();
        
        for (const socketId of socketsInRoom) {
          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket && clientSocket.data.userId) {
            userIdsInRoom.add(clientSocket.data.userId);
          }
        }
        
        // Obtener participantes de la sala desde la base de datos
        // Esta función tendría que ser implementada dependiendo de tu modelo de datos
        const roomParticipants = await getRoomParticipantsFromDb(roomId);
        
        // Enviar notificaciones a los participantes que no están actualmente en la sala
        for (const participantId of roomParticipants) {
          // No enviar notificación al remitente
          if (participantId === senderId) continue;
          
          // No enviar notificación si el usuario está en la sala
          if (userIdsInRoom.has(participantId)) continue;
          
          // Crear notificación para el usuario
          await notificationService.createChatNotification(
            participantId,
            senderId,
            roomId,
            messageData.content
          );
        }
      } catch (error) {
        console.error('Error al crear notificación de chat:', error);
      }
    });
    
    // Cuando un usuario solicita contar sus notificaciones no leídas
    socket.on('get_unread_notifications_count', async () => {
      try {
        const userId = socket.data.userId;
        
        if (!userId) return;
        
        const count = await notificationService.getUnreadNotificationsCount(userId);
        socket.emit('unread_notifications_count', count);
      } catch (error) {
        console.error('Error al obtener conteo de notificaciones:', error);
      }
    });
  });
};

// Función auxiliar para obtener participantes de una sala
// Esta implementación debe ser adaptada a tu modelo de datos específico
async function getRoomParticipantsFromDb(roomId: string): Promise<string[]> {
  try {
    // Importar el modelo dinámicamente para evitar dependencia circular
    const mongoose = require('mongoose');
    const ChatRoom = mongoose.model('ChatRoom');
    
    const room = await ChatRoom.findById(roomId);
    if (!room || !room.participants) return [];
    
    // Convertir ObjectId a strings
    return room.participants.map((p: any) => p.toString());
  } catch (error) {
    console.error('Error al obtener participantes de la sala:', error);
    return [];
  }
}

// Función de utilidad para enviar una notificación a un usuario específico
export const sendNotificationToUser = async (
  userId: string,
  notificationType: string,
  content: string,
  senderInfo: any = null,
  entityInfo: any = null
): Promise<void> => {
  try {
    const io = getIO();
    
    if (!io) {
      console.error('Socket.IO no inicializado');
      return;
    }
    
    // Emitir la notificación al usuario específico
    io.to(`user:${userId}`).emit('notification', {
      type: notificationType,
      content,
      senderInfo,
      entityInfo,
      timestamp: new Date().toISOString()
    });
    
    // También actualizar el contador de notificaciones
    const unreadCount = await notificationService.getUnreadNotificationsCount(userId);
    io.to(`user:${userId}`).emit('unread_notifications_count', unreadCount);
  } catch (error) {
    console.error('Error al enviar notificación a usuario:', error);
  }
};