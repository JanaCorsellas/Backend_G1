import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import User from '../models/user';
import { verifyToken } from '../utils/jwt.handle';

// Estructura para almacenar información de usuario conectado
interface ConnectedUser {
  socketIds: string[];
  username: string;
}

// Mapa para almacenar usuarios conectados: userId -> ConnectedUser
const connectedUsers = new Map<string, ConnectedUser>();

// Estructura para almacenar mensajes
interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

let io: Server;

export const initializeSocket = (server: HttpServer): void => {
  io = new Server(server, {
    cors: {
      origin: "*", // En producción, restringir a tu dominio frontend
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'] // Habilitar ambos transportes para mayor compatibilidad
  });

  // Middleware para validar token JWT en cada conexión
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const userId = socket.handshake.auth?.userId;
    
    // Si hay token, verificamos la autenticación JWT
    if (token) {
      try {
        const tokenData = verifyToken(token);
        if (tokenData && typeof tokenData !== 'string' && tokenData.id) {
          // Autenticación JWT exitosa
          socket.data.tokenAuth = true;
          if (typeof tokenData !== 'string' && tokenData.id) {
            socket.data.userId = tokenData.id;
          }
          socket.data.role = (typeof tokenData !== 'string' && tokenData.role) || 'user';
          socket.data.username = (typeof tokenData !== 'string' && tokenData.name) || socket.handshake.auth?.username || 'Usuario';
          return next();
        } else {
          console.log('Token JWT inválido o sin id');
        }
      } catch (error) {
        console.error('Error validando token JWT:', error);
        // No rechazamos la conexión para mantener compatibilidad hacia atrás
      }
    }
    
    // Fallback: permitir autenticación sin JWT si proporciona userId
    if (userId) {
      console.log(`Autenticación sin JWT para usuario ${userId}`);
      socket.data.tokenAuth = false;
      socket.data.userId = userId;
      socket.data.username = socket.handshake.auth?.username || 'Usuario';
      return next();
    }
    
    // Si no tiene token ni userId, rechazamos la conexión
    return next(new Error('Autenticación insuficiente'));
  });

  io.on('connection', async (socket: Socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Datos de autenticación (ya validados en el middleware)
    const userId = socket.data.userId;
    const username = socket.data.username;
    const isTokenAuth = socket.data.tokenAuth || false;

    if (userId) {
      // Log con información de autenticación
      console.log(`Usuario ${username} (${userId}) registrado con socket ${socket.id} - Auth JWT: ${isTokenAuth ? 'Sí' : 'No'}`);
      
      // Si no tenemos username, intentar obtenerlo de la base de datos
      if (username === 'Usuario') {
        try {
          const user = await User.findById(userId);
          if (user) {
            socket.data.username = user.username;
            console.log(`Username actualizado desde DB: ${user.username}`);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
      
      // Registrar en el mapa de usuarios conectados
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, {
          socketIds: [socket.id],
          username: socket.data.username
        });
      } else {
        const userData = connectedUsers.get(userId);
        if (userData) {
          userData.socketIds.push(socket.id);
          // Actualizar nombre si ahora tenemos mejor información
          if (socket.data.username && socket.data.username !== 'Usuario') {
            userData.username = socket.data.username;
          }
        }
      }
      
      // Unir al usuario a su sala personal para recibir mensajes
      socket.join(`user:${userId}`);
      
      // Emitir lista actualizada de usuarios en línea
      emitOnlineUsers();
    } else {
      console.log(`Socket ${socket.id} conectado sin identificación de usuario`);
    }

    // Evento para actualización de token
    socket.on('token_updated', (data) => {
      if (data && data.token) {
        console.log(`Token actualizado para socket ${socket.id}`);
        try {
          const tokenData = verifyToken(data.token);
          if (tokenData && typeof tokenData !== 'string' && tokenData.id) {
            socket.data.tokenAuth = true;
            socket.data.userId = tokenData.id;
            socket.data.role = tokenData.role || 'user';
            socket.data.username = tokenData.name || socket.data.username || 'Usuario';
            console.log(`Token actualizado exitosamente para usuario ${socket.data.username}`);
          }
        } catch (error) {
          console.error('Error validando token actualizado:', error);
          socket.emit('token_expired', { message: 'Token inválido' });
        }
      }
    });

    // Join a chat room
    socket.on('join_room', (roomId: string) => {
      if (!roomId) return;
      
      socket.join(roomId);
      console.log(`Socket ${socket.id} unido a sala ${roomId}`);
      
      // Notify room that a user joined
      io.to(roomId).emit('user_joined', {
        userId: socket.data.userId,
        username: socket.data.username,
        roomId
      });
    });

    // Send message
    socket.on('send_message', (message: Message) => {
      if (!message.roomId || !message.content) {
        console.error('Datos de mensaje incompletos', message);
        return;
      }
      
      // Ensure message has sender (from socket if not in message)
      const finalMessage = {
        ...message,
        senderId: message.senderId || socket.data.userId,
        senderName: message.senderName || socket.data.username || 'Usuario',
        timestamp: message.timestamp || new Date().toISOString()
      };
      
      console.log(`Mensaje enviado a sala ${finalMessage.roomId}: ${finalMessage.content.substring(0, 30)}...`);
      
      // Validar token antes de procesar mensaje
      if (socket.data.tokenAuth === false) {
        // Para conexiones sin JWT, podríamos implementar validaciones adicionales aquí
      }
      
      // Emit message to everyone in the room
      io.to(finalMessage.roomId).emit('new_message', finalMessage);
    });

    // User is typing
    socket.on('typing', (roomId: string) => {
      if (!socket.data.userId || !roomId) return;
      
      socket.to(roomId).emit('user_typing', {
        userId: socket.data.userId,
        username: socket.data.username,
        roomId
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
      
      const userId = socket.data.userId;
      if (userId) {
        // Remove this socket from connected users map
        const userData = connectedUsers.get(userId);
        if (userData) {
          const updatedSockets = userData.socketIds.filter(id => id !== socket.id);
          
          if (updatedSockets.length > 0) {
            userData.socketIds = updatedSockets;
            connectedUsers.set(userId, userData);
          } else {
            connectedUsers.delete(userId);
          }
        }
        
        // Emit updated list of online users
        emitOnlineUsers();
      }
    });
  });

  console.log('Servidor Socket.IO inicializado');
};

// Improved: Emit list of connected users with usernames
function emitOnlineUsers() {
  // Create array of user objects with both ID and username
  const onlineUsers = Array.from(connectedUsers.entries()).map(([userId, userData]) => ({
    id: userId,
    username: userData.username
  }));
  
  console.log('Usuarios conectados:', onlineUsers);
  io.emit('online_users', onlineUsers);
}

// Get Socket.IO instance
export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO no ha sido inicializado');
  }
  return io;
};