import mongoose, { Mongoose } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async (): Promise<void> => {
    try{
        mongoose.set('strictQuery', true);
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/ProyectoEA_bd');
        console.log('Connexió exitosa amb MongoDB');
  
        // Manejadores de eventos para la conexión a MongoDB
        mongoose.connection.on('connected', () => {
        console.log('Mongoose connectat a la base de dades');
        });
    
        mongoose.connection.on('error', (err) => {
        console.error('Error en la connexió de Mongoose:', err);
        });
    
        mongoose.connection.on('disconnected', () => {
        console.log('Mongoose desconnectat de la base de dades');
        });
    
        // Manejador para cerrar la conexión cuando se detiene la aplicación
        process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Connexió de Mongoose tancada degut a la finalització del programa');
        process.exit(0);
        });
      }
    catch(error){
      console.error('Error de connexió amb MongoDB:', error);
      console.error("Assegura't de que MongoDB s'està executant en el sistema");
      throw error;
    }
};

export default connectDatabase;