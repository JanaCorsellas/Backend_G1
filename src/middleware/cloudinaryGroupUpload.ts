import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';

// Configuración de almacenamiento en Cloudinary para fotos de grupo
const groupStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'group_pictures', // Carpeta diferente para grupos
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    public_id: (req: any, file: Express.Multer.File) => {
      // Generar ID único: groupId_timestamp
      const groupId = req.params.id || 'unknown';
      const timestamp = Date.now();
      return `group_${groupId}_${timestamp}`;
    },
    transformation: [
      {
        width: 500,
        height: 500,
        crop: 'fill',
        gravity: 'face',
        quality: 'auto:good'
      }
    ]
  } as any,
});

// Puedes reutilizar el mismo fileFilter si lo exportas desde tu archivo original
const validMimeTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/tiff'
];

const groupFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype && validMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP, BMP)'));
  }
};

export const uploadGroupPictureCloudinary = multer({
  storage: groupStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
    fields: 1
  },
  fileFilter: groupFileFilter
});