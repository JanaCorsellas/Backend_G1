import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

// Configuración de Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'API de Actividades', // Título general de la API
      version: '1.0.0',
      description: 'API para gestionar actividades deportivas', // Descripción de la API
    },

    tags: [ //Definim les categories para cada una de les rutes per tenir una estructura més ordenada
      {
        name: 'Users',
        description: "Rutes relacionades amb la gestió d'usuaris",
      },
      {
        name: 'Achievements',
        description: "Rutes relacionades amb els assoliments",
      },
      {
        name: 'Challenges',
        description: 'Rutes relacionades amb els reptes',
      },
      {
        name: 'Activities',
        description: 'Rutes relacionades amb les activitats',
      },
      {
        name: 'ReferencePoints',
        description: 'Rutes relacionades amb els punts de referència',
      },
      {
        name: 'Songs',
        description: 'Rutes relacionades amb les cançons',
      }
,
      {
        name: 'Chat',
        description: 'Rutes relacionades amb el xat',
      },
      {
        name: 'ActivityHistory',
        description: 'Rutes relacionades amb l\'historial d\'activitats',
      },
      {
        name: 'Auth',
        description: 'Rutes relacionades amb l\'autenticació',
      },
      
    ],

    servers: [
      {
        url: `http://localhost:8080`,
        description: 'Servidor local per desenvolupament',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Especifica las rutas que Swagger debe leer para la documentación
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Función para configurar Swagger en el servidor
const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;