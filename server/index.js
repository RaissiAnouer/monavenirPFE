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
const corsOrigin = process.env.FRONTEND_URL || 'https://frontend-pfe.azurewebsites.net';
console.log('CORS Origin set to:', corsOrigin); // Add this for debugging
app.use(cors({
  origin: corsOrigin,
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
  res.setHeader('Access-Control-Allow-Origin', corsOrigin);
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
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false
});
/*app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);*/

// Security headers for video streaming
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});

// Body parsers
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Configure upload limits
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000);
  res.setTimeout(10 * 60 * 1000);
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

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', corsOrigin);
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Credentials', 'true');
  }
}));

// Serve images from public directory
app.use('/images', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
}, express.static(path.join(__dirname, 'public/images')));

// Serve course banner images with authentication
app.use('/uploads', auth, (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Video streaming route
app.get('/api/stream/:filename', (req, res) => {
  const { token } = req.query;
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', 'videos', filename);

  console.log(`Streaming request for: ${filename}`);
  console.log(`Token: ${token ? token : 'missing'}`);

  if (!/^[a-zA-Z0-9_\-\.]+$/.test(filename)) {
    console.log('Invalid filename:', filename);
    return res.status(400).json({ message: 'Invalid filename' });
  }

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified:', decoded);
  } catch (err) {
    console.log('Token verification failed:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return res.status(404).json({ message: 'Video not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;

    if (start >= fileSize || end >= fileSize) {
      return res.status(416).json({ message: 'Requested range is not satisfiable' });
    }

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);

    file.on('error', (err) => {
      console.error(`Stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming video' });
      }
    });
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes',
    };

    res.writeHead(200, head);
    const file = fs.createReadStream(filePath);
    file.pipe(res);

    file.on('error', (err) => {
      console.error(`Stream error: ${err.message}`);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming video' });
      }
    });
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
    res.header('Access-Control-Allow-Origin', corsOrigin);
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
