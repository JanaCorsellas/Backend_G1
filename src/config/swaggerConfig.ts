import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = { //Configuració general de Swagger
  definition: {
    openapi: '3.0.0', 
    info: {
      title: 'API de Strava',
      version: '1.0.0',
      description: "Informació sobre l'API de l'aplicació Strava",
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
    ],
    servers: [
      {
        url: `http://localhost:8080`,
        description: 'Servidor local per desenvolupament',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], //La ruta dels fitxers que indiquen les especificacions de l'API
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

//Funció per configurar Swagger en el servidor
const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

export default setupSwagger;