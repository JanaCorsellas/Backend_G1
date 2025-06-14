import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';

// Configuración de almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    public_id: (req: any, file: Express.Multer.File) => {
      // Generar ID único: userId_timestamp
      const userId = req.params.userId || 'unknown';
      const timestamp = Date.now();
      return `user_${userId}_${timestamp}`;
    },
    transformation: [
      {
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face', // Enfocar en la cara si es posible
        quality: 'auto:good'
      }
    ]
  } as any,
});

// Filtro de archivos mejorado
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('=== CLOUDINARY FILE VALIDATION ===');
  console.log(`Original name: ${file.originalname}`);
  console.log(`MIME type: ${file.mimetype}`);
  console.log(`Field name: ${file.fieldname}`);
  
  // Lista de MIME types válidos
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff'
  ];
  
  // Validar MIME type
  if (file.mimetype && validMimeTypes.includes(file.mimetype)) {
    console.log(' File validation PASSED');
    cb(null, true);
  } else {
    console.log(' File validation FAILED');
    console.log(`Received MIME type: ${file.mimetype}`);
    console.log(`Valid MIME types: ${validMimeTypes.join(', ')}`);
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP, BMP)'));
  }
};

// Configuración de multer con Cloudinary
export const uploadProfilePictureCloudinary = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo (Cloudinary maneja la compresión)
    files: 1,
    fields: 1
  },
  fileFilter: fileFilter
});

// Función auxiliar para extraer public_id de URL de Cloudinary
export const extractPublicIdFromUrl = (url: string): string => {
  try {
    // URL típica de Cloudinary: 
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/profile_pictures/user_123_1234567890.jpg
    const matches = url.match(/\/v\d+\/(.+)\.[a-zA-Z]+$/);
    if (matches && matches[1]) {
      return matches[1]; // Retorna: "profile_pictures/user_123_1234567890"
    }
    
    // Fallback: intentar extraer después del último '/'
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const nameWithoutExtension = filename.split('.')[0];
    return `profile_pictures/${nameWithoutExtension}`;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return '';
  }
};