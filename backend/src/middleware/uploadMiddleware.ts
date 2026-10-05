import multer from 'multer';

// Use memory storage so uploaded files are held in buffer
// This allows uploading directly to Cloudinary (production-ready) or saving to local disk as fallback.
const storage = multer.memoryStorage();

export const uploadDocumentMiddleware = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});
