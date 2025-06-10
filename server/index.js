const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const courseRoutes = require('./routes/courses');
const videoUploadRoutes = require('./routes/videoUpload');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const auth = require('./middleware/auth');
const jwt = require('jsonwebtoken');
const emailVerificationRoutes = require('./routes/emailVerification');

console.log('MONGO_URI:', process.env.MONGO_URI ? 'exists' : 'missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'exists' : 'missing');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL ? process.env.FRONTEND_URL : 'missing');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('mongoose', mongoose);

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',    // Local frontend (React default)
      'http://localhost:5000',    // Local backend
      'https://pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net', // Production frontend
      'https://pfe-backend-hac7djg2eubjbsar.canadacentral-01.azurewebsites.net'   // Production backend
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Range'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Range',
    'Content-Disposition',
    'Accept-Ranges'
  ]
}));

// Explicitly handle OPTIONS for /api/auth routes
app.options('/api/auth/*', (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-CSRF-Token,X-Requested-With,Accept,Origin,Range');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiter configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Aggressive rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 100 : 20, // More lenient in development
  message: 'Too many authentication attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false
});

// Only apply strict rate limiting in production
if (process.env.NODE_ENV === 'production') {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/signup', authLimiter);
} else {
  // More lenient rate limiting for development
  app.use('/api/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many authentication attempts, please try again in 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
  }));
  app.use('/api/auth/signup', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many signup attempts, please try again in 15 minutes',
    standardHeaders: true,
    legacyHeaders: false
  }));
}

// Security headers for video streaming
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure upload limits
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const uploadPaths = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/images'),
    path.join(__dirname, 'uploads/documents'),
    path.join(__dirname, 'uploads/videos'),
    path.join(__dirname, 'public/images'),
  ];

  uploadPaths.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
        console.log(`Created directory: ${dir}`);
      } else {
        fs.chmodSync(dir, 0o755);
      }

      const testFile = path.join(dir, '.test-write-permission');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log(`Directory ${dir} is writable`);
    } catch (err) {
      console.error(`Error with directory ${dir}: ${err.message}`);
    }
  });
};

createUploadDirectories();

// Serve static files from uploads directory with proper headers
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Set caching headers for images
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
      res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.set('Content-Type', getContentType(path));
    }
    
    // Set security headers
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

// Helper function to get content type based on file extension
const getContentType = (path) => {
  const ext = path.split('.').pop().toLowerCase();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return contentTypes[ext] || 'application/octet-stream';
};

// Serve images from public directory
app.use('/images', express.static(path.join(__dirname, 'public/images'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
}));

// Video streaming route
app.get('/api/stream/:filename', (req, res) => {
  const { token } = req.query;
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', 'videos', filename);

  console.log(`Streaming request for: ${filename}`);
  console.log(`Token: ${token ? token : 'missing'}`);
  console.log(`Attempting to stream file from path: ${filePath}`);

  try {
    // Validate request
    if (!filename || filename.includes('..')) {
      throw { status: 400, message: 'Invalid filename' };
    }
    if (!token) {
      throw { status: 401, message: 'No token provided' };
    }
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Check file existence
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`);
      throw { status: 404, message: 'Video not found' };
    }

    console.log(`File found: ${filePath}`);

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set common headers
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Handle range request
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        throw { status: 416, message: 'Requested range is not satisfiable' };
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      });
      
      file.pipe(res);
      file.on('error', (err) => {
        console.error(`Stream error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error streaming video' });
        }
      });
      return;
    }

    // Handle full video request
    const file = fs.createReadStream(filePath);
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    });
    
    file.pipe(res);
    file.on('error', (err) => {
      console.error(`Stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming video' });
      }
    });
  } catch (error) {
    console.log(error.message);
    res.status(error.status || 500).json({ message: error.message });
  }
});

// File check route
app.get('/check-file', auth, (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ exists: false, message: 'No file path provided' });
  }

  const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  if (normalizedPath !== filePath) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const fullPath = path.join(__dirname, normalizedPath);
  const exists = fs.existsSync(fullPath);

  res.json({
    exists,
    path: normalizedPath,
    fullPath,
    message: exists ? 'File exists' : 'File does not exist'
  });
});

// Debug route for video files
app.get('/api/debug/video/:filename', auth, (req, res) => {
  const filename = req.params.filename;

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    return res.status(400).json({ message: 'Invalid filename' });
  }

  const videoPath = path.join(__dirname, 'uploads', 'videos', filename);
  const exists = fs.existsSync(videoPath);
  let stats = null;
  let readable = false;

  if (exists) {
    try {
      stats = fs.statSync(videoPath);
      fs.accessSync(videoPath, fs.constants.R_OK);
      readable = true;
    } catch (err) {
      console.error(`Error accessing video file: ${err.message}`);
    }
  }

  res.json({
    filename,
    exists,
    path: videoPath,
    stats: stats ? {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    } : null,
    readable,
    message: exists ? (readable ? 'File exists and is readable' : 'File exists but is not readable') : 'File does not exist'
  });
});

// Development middleware
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'pfe-frontend-gyc5frhrczdug0cy.canadacentral-01.azurewebsites.net');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mongodb: mongoose.connection.readyState === 1 
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the E-Learning Platform API' });
});

// API Routes
app.use('/api/courses', courseRoutes);
app.use('/api/courses', videoUploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/email', emailVerificationRoutes);

// PDF download route with rate limiting
const pdfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Trop de téléchargements. Veuillez réessayer plus tard.',
  standardHeaders: true,
  legacyHeaders: false
});

app.get('/api/pdf/:filename', [auth, pdfLimiter], async (req, res) => {
  const filename = req.params.filename;

  console.log('PDF download request for:', filename);

  if (!/^[a-zA-Z0-9_\-\.]+\.pdf$/.test(filename)) {
    console.log('Invalid filename format:', filename);
    return res.status(400).json({ 
      message: 'Format de nom de fichier invalide',
      details: 'Le nom de fichier contient des caractères non autorisés'
    });
  }

  const documentsDir = path.join(__dirname, 'uploads', 'documents');
  const pdfPath = path.join(documentsDir, filename);

  if (!pdfPath.startsWith(documentsDir)) {
    console.log('Path traversal attempt detected:', pdfPath);
    return res.status(403).json({ message: 'Accès refusé' });
  }

  console.log('Looking for PDF at path:', pdfPath);

  try {
    await fs.promises.mkdir(documentsDir, { recursive: true, mode: 0o755 });
  } catch (dirErr) {
    console.error('Failed to ensure documents directory exists:', dirErr);
    return res.status(500).json({ 
      message: 'Erreur de configuration du serveur',
      details: 'Le répertoire des documents n\'est pas accessible'
    });
  }

  try {
    const stats = await fs.promises.stat(pdfPath);

    if (!stats.isFile()) {
      console.error('Path exists but is not a file:', pdfPath);
      return res.status(400).json({ 
        message: 'Le chemin spécifié n\'est pas un fichier' 
      });
    }

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size || end >= stats.size) {
        res.status(416).json({ message: 'Plage demandée non satisfiable' });
        return;
      }

      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(pdfPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      });

      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    });

    const stream = fs.createReadStream(pdfPath);

    stream.on('error', (streamErr) => {
      console.error('Error streaming file:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: 'Erreur lors de la lecture du fichier',
          details: streamErr.message
        });
      }
      stream.destroy();
      res.destroy();
    });

    req.on('close', () => {
      stream.destroy();
    });

    stream.on('end', () => {
      console.log(`Successfully streamed PDF: ${filename}`);
    });

    stream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('PDF file not found:', pdfPath);
      try {
        const availableFiles = await fs.promises.readdir(documentsDir);
        return res.status(404).json({ 
          message: 'Fichier PDF non trouvé',
          details: {
            requestedFile: filename,
            documentsDir: documentsDir,
            availableFiles: availableFiles
          }
        });
      } catch (readErr) {
        console.error('Error reading documents directory:', readErr);
        return res.status(404).json({ 
          message: 'Fichier PDF non trouvé',
          details: { requestedFile: filename }
        });
      }
    }

    console.error('Error accessing PDF file:', error);
    res.status(500).json({ 
      message: 'Erreur d\'accès au fichier',
      details: error.message
    });
  }
});

// File debug route
app.get('/api/debug/file', auth, async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ 
      exists: false, 
      message: 'Chemin de fichier non fourni' 
    });
  }

  try {
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(__dirname, normalizedPath);
    const uploadsDir = path.join(__dirname, 'uploads');

    if (!fullPath.startsWith(uploadsDir)) {
      console.log('Access denied - path outside uploads directory:', fullPath);
      return res.status(403).json({ 
        exists: false, 
        message: 'Accès refusé - le chemin doit être dans le répertoire uploads' 
      });
    }

    const documentsDir = path.join(__dirname, 'uploads', 'documents');
    await fs.promises.mkdir(documentsDir, { recursive: true, mode: 0o755 })
      .catch(err => console.error('Error creating documents directory:', err));

    const exists = await fs.promises.access(fullPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    let fileInfo = null;
    if (exists) {
      const stats = await fs.promises.stat(fullPath);
      fileInfo = {
        size: stats.size,
        isDirectory: stats.isDirectory(),
        created: stats.birthtime,
        modified: stats.mtime,
        permissions: stats.mode.toString(8).slice(-3)
      };

      try {
        await fs.promises.access(fullPath, fs.constants.R_OK);
        fileInfo.readable = true;
      } catch (err) {
        fileInfo.readable = false;
        console.error('File not readable:', fullPath, err);
      }
    }

    const dirPath = path.dirname(fullPath);
    let availableFiles = [];
    try {
      availableFiles = await fs.promises.readdir(dirPath);
    } catch (err) {
      console.error('Error reading directory:', dirPath, err);
    }

    console.log('File check result:', {
      path: filePath,
      exists,
      readable: fileInfo?.readable,
      availableFiles
    });

    res.json({
      exists,
      path: filePath,
      fullPath,
      info: fileInfo,
      directory: {
        path: dirPath,
        files: availableFiles
      },
      message: exists 
        ? (fileInfo?.readable ? 'File exists and is readable' : 'File exists but is not readable')
        : 'File does not exist'
    });
  } catch (error) {
    console.error('Error checking file:', error);
    res.status(500).json({
      exists: false,
      path: filePath,
      error: error.message,
      message: 'Erreur lors de la vérification du fichier'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    status: err.status
  });

  if (err.name === 'CORSError') {
    return res.status(403).json({
      message: 'CORS error',
      details: err.message,
      code: 'CORS_ERROR'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Une erreur est survenue sur le serveur',
    code: err.code || 'SERVER_ERROR',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for URL:', req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Start server and connect to MongoDB
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

startServer();
