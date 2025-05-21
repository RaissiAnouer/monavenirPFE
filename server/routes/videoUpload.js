const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
};

// Create upload directories if they don't exist
ensureDirectoryExists('uploads');
ensureDirectoryExists('uploads/images');
ensureDirectoryExists('uploads/videos');

// Generate a secure random filename
const generateSecureFilename = (originalname) => {
  const ext = path.extname(originalname);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
};

// Validate file type
const validateFileType = (file, allowedTypes) => {
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return false;
  }
  
  // Additional check for file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogg'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
  };
  
  return allowedExtensions[file.mimetype]?.includes(ext) || false;
};

// Configure Multer storage for video files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'video') {
      uploadPath += 'videos/';
    } else if (file.fieldname === 'thumbnail') {
      uploadPath += 'images/';
    }
    
    // Ensure the directory exists
    ensureDirectoryExists(uploadPath);
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const secureFilename = generateSecureFilename(file.originalname);
    cb(null, secureFilename);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  let allowedTypes = [];
  if (file.fieldname === 'video') {
    allowedTypes = allowedVideoTypes;
  } else if (file.fieldname === 'thumbnail') {
    allowedTypes = allowedImageTypes;
  }
  
  if (validateFileType(file, allowedTypes)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed.`), false);
  }
};

// Video upload middleware with improved configuration
const videoUpload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB max file size
    files: 2 // Max 2 files (video + thumbnail)
  },
  fileFilter: fileFilter
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Upload video route with improved error handling
router.post('/:id/videos', auth, async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Check if user is a teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only teachers and admins can upload videos' 
      });
    }
    
    const courseId = req.params.id;
    
    // Validate course ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course ID format' 
      });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    // Check if user is the instructor of the course
    if (course.instructor !== req.user.name && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to upload videos to this course'
      });
    }
    
    // Use the upload middleware
    videoUpload(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Video file is too large. Maximum size is 500MB'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(400).json({ 
          success: false, 
          message: err.message || 'Error when uploading files' 
        });
      }
      
      try {
        // Check if files were uploaded
        if (!req.files || !req.files.video) {
          return res.status(400).json({ 
            success: false, 
            message: 'No video file uploaded' 
          });
        }
        
        const videoFile = req.files.video[0];
        const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
        
        // Get video details from request body
        const { title, description } = req.body;
        
        if (!title) {
          return res.status(400).json({ 
            success: false, 
            message: 'Video title is required' 
          });
        }
        
        // Create video object
        const videoObj = {
          title: title.trim(),
          url: `/uploads/videos/${videoFile.filename}`,
          description: description ? description.trim() : '',
          thumbnail: thumbnailFile ? `/uploads/images/${thumbnailFile.filename}` : course.image,
          duration: 0, // Will be updated later if possible
          order: course.videos.length
        };
        
        // Add video to course
        course.videos.push(videoObj);
        
        // Save course
        await course.save();
        
        res.status(201).json({
          success: true,
          message: 'Video uploaded successfully',
          course: course
        });
      } catch (error) {
        console.error('Error processing upload:', error);
        
        // Clean up uploaded files on error
        if (req.files) {
          if (req.files.video) {
            fs.unlinkSync(req.files.video[0].path);
          }
          if (req.files.thumbnail) {
            fs.unlinkSync(req.files.thumbnail[0].path);
          }
        }
        
        res.status(500).json({
          success: false,
          message: 'Server error during video upload',
          error: error.message
        });
      }
    });
  } catch (error) {
    console.error('Video upload route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete video route
router.delete('/:courseId/videos/:videoIndex', auth, async (req, res) => {
  try {
    // Check if user is a teacher or admin
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only teachers and admins can delete videos' 
      });
    }
    
    const { courseId, videoIndex } = req.params;
    
    // Validate course ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid course ID format' 
      });
    }
    
    // Validate video index
    const index = parseInt(videoIndex);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid video index' 
      });
    }
    
    // Find course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    // Check if video exists
    if (index >= course.videos.length) {
      return res.status(404).json({ 
        success: false, 
        message: 'Video not found' 
      });
    }
    
    // Get video URL to delete file
    const videoUrl = course.videos[index].url;
    const thumbnailUrl = course.videos[index].thumbnail;
    
    // Remove video from course
    course.videos.splice(index, 1);
    
    // Save course
    await course.save();
    
    // Delete video file if it exists
    if (videoUrl) {
      const videoPath = path.join(__dirname, '..', videoUrl);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    
    // Delete thumbnail file if it exists
    if (thumbnailUrl) {
      const thumbnailPath = path.join(__dirname, '..', thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }
    
    res.json({
      success: true,
      message: 'Video deleted successfully',
      course: course
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during video deletion',
      error: error.message
    });
  }
});

module.exports = router; 