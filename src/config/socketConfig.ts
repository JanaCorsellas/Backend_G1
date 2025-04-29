import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import User from '../models/user';

// Improved structure to store connected user information
interface ConnectedUser {
  socketIds: string[];
  username: string;
}

// Map to store connected users: userId -> ConnectedUser
const connectedUsers = new Map<string, ConnectedUser>();

// Structure for storing messages
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
      origin: "*", // In production, restrict this to your frontend domain
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'] // Explicitly enable both transports
  });

  io.on('connection', async (socket: Socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Extract auth data from handshake
    const { userId, username } = socket.handshake.auth as { 
      userId?: string, 
      username?: string 
    };

    if (userId) {
      console.log(`Usuario ${username || 'Desconocido'} (${userId}) registrado con socket ${socket.id}`);
      
      // Store data in socket
      socket.data.userId = userId;
      socket.data.username = username || 'Usuario';
      
      // If username is missing, try to fetch it from database
      let finalUsername = username;
      if (!finalUsername || finalUsername === 'Usuario') {
        try {
          const user = await User.findById(userId);
          if (user) {
            finalUsername = user.username;
            socket.data.username = finalUsername;
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      }
      
      // Register in connected users map with username
      if (!connectedUsers.has(userId)) {
        connectedUsers.set(userId, {
          socketIds: [socket.id],
          username: finalUsername || 'Usuario'
        });
      } else {
        const userData = connectedUsers.get(userId);
        if (userData) {
          userData.socketIds.push(socket.id);
          // Update username if we now have better information
          if (finalUsername && finalUsername !== 'Usuario') {
            userData.username = finalUsername;
          }
        }
      }
      
      // Emit updated list of online users
      emitOnlineUsers();
    } else {
      console.log(`Socket ${socket.id} conectado sin identificación de usuario`);
    }

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