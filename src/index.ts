import express from 'express';
import http from 'http';
import userRoutes from './routes/userRoutes';
import referencePointRoutes from './routes/referencePointRoutes';
import activityRoutes from './routes/activityRoutes';
import connectDatabase from './config/db';
import achievementRoutes from './routes/achievementRoutes';
import challengeRoutes from './routes/challengeRoutes';
import songRoutes from './routes/songRoutes';
import cors from 'cors';
import dotenv from 'dotenv';
import setupSwagger from './config/swaggerConfig';
import activityHistoryRoutes from './routes/activityHistoryRoutes';
import chatRoutes from './routes/chatRoutes'; 
import authRoutes from './routes/auth_routes';
import { initializeSocket } from './config/socketConfig';
import activityTrackingRoutes from './routes/activityTrackingRoutes';
import { verifyCloudinaryConfig } from './config/cloudinary'; 

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Setup Swagger
setupSwagger(app);

// Middleware
app.use(express.json());

const corsOptions = {
  origin: '*' ,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); 
  next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/referencePoints', referencePointRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/activity-history', activityHistoryRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activity-tracking', activityTrackingRoutes);


app.get('/', (req, res) => {
  res.send('API en funcionament, la documentació es troba a /api-docs.');
});

// Not found routes handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no trobada'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Error intern del servidor'
  });
});

async function startServer() {
  try {

    console.log(' Verificando configuración de Cloudinary...');
    const cloudinaryConfigured = verifyCloudinaryConfig();
    
    if (!cloudinaryConfigured) {
      console.error(' Error: Configuración de Cloudinary incompleta');
      console.error('   Las imágenes de perfil no funcionarán correctamente');
      console.error('   Configura las variables de entorno de Cloudinary antes de continuar');
   
    }
    
    await connectDatabase();
      

    server.listen(PORT, () => {
      console.log(` Servidor ejecutándose en http://localhost:${PORT}`);
      console.log(` Documentación disponible en http://localhost:${PORT}/api-docs`);
      

      if (cloudinaryConfigured) {
        console.log('  Cloudinary configurado correctamente para imágenes');
      } else {
        console.log('  Cloudinary NO configurado - revisar variables de entorno');
      }
    });
  } catch (error) {
    console.error(' Error al iniciar el servidor:', error);
    process.exit(1);
  }
}
  
startServer();