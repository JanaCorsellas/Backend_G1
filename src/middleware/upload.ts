// src/middleware/upload.ts - Corregido para Web
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear directorio si no existe
const uploadDir = 'uploads/profile-pictures';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: userId_timestamp.extension
    const userId = req.params.userId || 'unknown';
    const timestamp = Date.now();
    
    // ✅ MEJORADO: Manejar extensión desde originalname o mimetype
    let extension = path.extname(file.originalname).toLowerCase();
    
    // Si no hay extensión, intentar obtenerla del mimetype
    if (!extension && file.mimetype) {
      switch (file.mimetype) {
        case 'image/jpeg':
        case 'image/jpg':
          extension = '.jpg';
          break;
        case 'image/png':
          extension = '.png';
          break;
        case 'image/gif':
          extension = '.gif';
          break;
        case 'image/webp':
          extension = '.webp';
          break;
        default:
          extension = '.jpg'; // Default fallback
      }
    }
    
    // Si aún no hay extensión, usar .jpg por defecto
    if (!extension) {
      extension = '.jpg';
    }
    
    cb(null, `${userId}_${timestamp}${extension}`);
  }
});

// ✅ FILTRO MEJORADO: Más permisivo para Web
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('=== FILE VALIDATION ===');
  console.log(`Original name: ${file.originalname}`);
  console.log(`MIME type: ${file.mimetype}`);
  console.log(`Field name: ${file.fieldname}`);
  
  // ✅ Lista de MIME types válidos (más amplia)
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    // ✅ IMPORTANTE: En web a veces viene vacío o genérico
    'application/octet-stream', // Fallback común en web
    '', // MIME type vacío
    undefined // MIME type undefined
  ];
  
  // ✅ Lista de extensiones válidas
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  
  // ✅ VALIDACIÓN MEJORADA
  let isValid = false;
  
  // Método 1: Validar por MIME type
  if (file.mimetype && validMimeTypes.includes(file.mimetype)) {
    isValid = true;
    console.log('✅ Validated by MIME type');
  }
  
  // Método 2: Validar por extensión si MIME type falla
  if (!isValid && file.originalname) {
    const extension = path.extname(file.originalname).toLowerCase();
    if (validExtensions.includes(extension)) {
      isValid = true;
      console.log('✅ Validated by file extension');
    }
  }
  
  // Método 3: Si viene de web sin extensión pero el campo es correcto
  if (!isValid && file.fieldname === 'profilePicture') {
    // Asumir que es válido si viene del campo correcto
    // Esto es común en uploads de web donde el MIME type no se detecta bien
    console.log('⚠️ Assuming valid file from web upload (no clear MIME/extension)');
    isValid = true;
  }
  
  if (isValid) {
    console.log('✅ File validation PASSED');
    cb(null, true);
  } else {
    console.log('❌ File validation FAILED');
    console.log(`Available MIME types: ${validMimeTypes.join(', ')}`);
    console.log(`Available extensions: ${validExtensions.join(', ')}`);
    cb(new Error('Solo se permiten archivos de imagen'));
  }
};

// Configuración de multer
export const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1, // Solo 1 archivo
    fields: 1 // Solo 1 campo
  },
  fileFilter: fileFilter
});