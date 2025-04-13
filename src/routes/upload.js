import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';


// Set up __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../public/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}


// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads')); // Set destination folder
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`); // Set filename
  }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

export default upload;
