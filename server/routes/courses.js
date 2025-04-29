const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');

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
ensureDirectoryExists('uploads/documents');
ensureDirectoryExists('uploads/videos');

// Configure Multer storage for course files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'image') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'document') {
      uploadPath += 'documents/';
    } else if (file.fieldname === 'video') {
      uploadPath += 'videos/';
    }
    
    // Ensure the directory exists
    ensureDirectoryExists(uploadPath);
    
    console.log('Uploading to:', uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// File filter for different types of content
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed for course images!'), false);
  }
  if (file.fieldname === 'document') {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
  }
  if (file.fieldname === 'video') {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only MP4, WebM, and OGG video formats are allowed!'), false);
    }
  }
  cb(null, true);
};

// General upload middleware for other routes
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Updated video upload middleware with better configuration
const videoUpload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only MP4, WebM, OGG, and QuickTime video formats are allowed!'), false);
      }
    } else if (file.fieldname === 'thumbnail') {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only JPEG, PNG, GIF, and WebP image formats are allowed for thumbnails!'), false);
      }
    }
    cb(null, true);
  },
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
    files: 2 // Allow up to 2 files (video + optional thumbnail)
  }
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Configure Multer storage for document files
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/documents/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Document upload middleware
const documentUpload = multer({
  storage: documentStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
}).single('document');

// Fetch all courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
});

// Add a new course (only for teachers) with image upload
router.post('/', auth, upload.single('image'), async (req, res) => {
  // Check if authentication data is available
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can add courses' });
  }

  const { title, instructor, duration, price, description } = req.body;
  let imageUrl = '';

  if (req.file) {
    imageUrl = '/uploads/images/' + req.file.filename;
  } else {
    return res.status(400).json({ error: 'Image file is required' });
  }

  try {
    // Convert duration and price to numbers
    const parsedDuration = parseFloat(duration);
    const parsedPrice = parseFloat(price);

    const newCourse = new Course({
      title,
      instructor,
      duration: parsedDuration,
      price: parsedPrice,
      description,
      image: imageUrl
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error saving course:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        error: error.message
      });
    }
    res.status(500).json({ 
      message: 'Error adding course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get course statistics
router.get('/stats', auth, async (req, res) => {
  try {
    // Get overall statistics
    const overallStats = await Course.aggregate([
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          averagePrice: { $avg: "$price" },
          averageDuration: { $avg: "$duration" },
          totalEnrolled: { $sum: "$enrolledCount" }
        }
      }
    ]);

    // Get statistics by category
    const categoryStats = await Course.aggregate([
      {
        $group: {
          _id: "$category",
          courseCount: { $sum: 1 },
          totalEnrolled: { $sum: "$enrolledCount" },
          averagePrice: { $avg: "$price" }
        }
      },
      {
        $sort: { courseCount: -1 }
      }
    ]);

    res.json({
      overall: overallStats[0] || {
        totalCourses: 0,
        averagePrice: 0,
        averageDuration: 0,
        totalEnrolled: 0
      },
      byCategory: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course stats', error: error.message });
  }
});

// Test route to verify the router is working
router.get('/test', auth, (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route working' });
});

// Get a single course with content
router.get('/:title', auth, async (req, res) => {
  try {
    const course = await Course.findOne({ title: req.params.title });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ 
      message: 'Error fetching course', 
      error: error.message 
    });
  }
});

// DELETE course route with improved error handling and logging
router.delete('/:id', auth, async (req, res) => {
  try {
    const courseId = req.params.id;
    console.log('Delete request received for course ID:', courseId);
    console.log('User requesting deletion:', req.user.name, req.user._id);
    
    // Validate MongoDB ID format
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('Invalid MongoDB ID format:', courseId);
      return res.status(400).json({ error: 'Invalid course ID format' });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found with ID:', courseId);
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check permission (optional - uncomment if needed)
    // if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Not authorized to delete this course' });
    // }
    
    // Delete course files if they exist (optional)
    // if (course.imageUrl) {
    //   const imagePath = path.join(__dirname, '../', course.imageUrl);
    //   if (fs.existsSync(imagePath)) {
    //     fs.unlinkSync(imagePath);
    //     console.log('Course image deleted:', imagePath);
    //   }
    // }
    
    // Delete the course
    await Course.findByIdAndDelete(courseId);
    console.log('Course deleted successfully:', courseId);
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update course content (description, syllabus)
router.patch('/:id/content', auth, async (req, res) => {
  try {
    const { detailedDescription, syllabus } = req.body;
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor
    if (course.instructor !== req.user.name && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    if (detailedDescription) course.detailedDescription = detailedDescription;
    if (syllabus) course.syllabus = syllabus;
    
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error updating course content', error: error.message });
  }
});

// Add video to course - completely rebuilt
router.post('/:id/videos', auth, (req, res) => {
  videoUpload(req, res, async (err) => {
    if (err) {
      console.error('Video upload error:', err);
      return res.status(400).json({ 
        message: err.message || 'Error uploading video',
        error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
      });
    }

    try {
      // Validate course ID
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid course ID format' });
      }

      const course = await Course.findById(req.params.id);
      
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      // Check if user is the instructor
      if (course.instructor !== req.user.name && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to update this course' });
      }

      // Validate required fields
      if (!req.body.title || req.body.title.trim() === '') {
        return res.status(400).json({ message: 'Video title is required' });
      }
      
      // Process video file
      let videoUrl = '';
      if (req.files && req.files.video && req.files.video[0]) {
        const videoFile = req.files.video[0];
        videoUrl = `/uploads/videos/${videoFile.filename}`;
        
        // Verify the file exists
        const videoPath = path.join(__dirname, '..', videoUrl);
        if (!fs.existsSync(videoPath)) {
          return res.status(500).json({ message: 'Video file was not saved correctly' });
        }

        console.log(`Video saved successfully: ${videoPath}`);
      } else if (req.body.videoUrl) {
        // Allow external video URLs
        try {
          const url = new URL(req.body.videoUrl);
          videoUrl = req.body.videoUrl;
        } catch (e) {
          return res.status(400).json({ message: 'Invalid video URL format' });
        }
      } else {
        return res.status(400).json({ message: 'Video file or URL is required' });
      }
      
      // Process thumbnail
      let thumbnailUrl = '';
      if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
        const thumbnailFile = req.files.thumbnail[0];
        thumbnailUrl = `/uploads/images/${thumbnailFile.filename}`;
        
        // Verify the thumbnail exists
        const thumbnailPath = path.join(__dirname, '..', thumbnailUrl);
        if (!fs.existsSync(thumbnailPath)) {
          return res.status(500).json({ message: 'Thumbnail was not saved correctly' });
        }

        console.log(`Thumbnail saved successfully: ${thumbnailPath}`);
      } else if (req.body.thumbnailUrl) {
        // Allow external thumbnail URLs
        try {
          const url = new URL(req.body.thumbnailUrl);
          thumbnailUrl = req.body.thumbnailUrl;
        } catch (e) {
          // If invalid, just use the course image instead
          thumbnailUrl = course.image;
        }
      } else {
        // Default to course image if no thumbnail provided
        thumbnailUrl = course.image;
      }
      
      // Create the video object
      const video = {
        title: req.body.title.trim(),
        url: videoUrl,
        description: req.body.description || '',
        thumbnail: thumbnailUrl,
        duration: req.body.duration ? parseFloat(req.body.duration) : 0,
        order: (course.videos || []).length + 1
      };
      
      // Add the video to the course
      if (!course.videos) course.videos = [];
      course.videos.push(video);
      
      // Save the updated course
      await course.save();
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Video added successfully',
        course
      });
    } catch (error) {
      console.error('Error adding video:', error);
      res.status(500).json({ 
        message: 'Error adding video', 
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    }
  });
});

// Add document to course
router.post('/:courseId/documents', auth, documentUpload, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the instructor
    if (course.instructor !== req.user.name && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    let documentUrl = '';
    if (req.file) {
      documentUrl = `/uploads/documents/${req.file.filename}`;
    } else if (req.body.url) {
      documentUrl = req.body.url;
    } else {
      return res.status(400).json({ message: 'Document file or URL is required' });
    }

    const document = {
      title,
      url: documentUrl,
      type: req.file ? path.extname(req.file.originalname).slice(1) : 'pdf',
      order: (course.documents || []).length + 1
    };

    course.documents.push(document);
    await course.save();

    res.status(201).json({ success: true, course });
  } catch (error) {
    res.status(500).json({ message: 'Error adding document', error: error.message });
  }
});

// Remove video from course
router.delete('/:courseId/videos/:videoIndex', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor
    if (course.instructor !== req.user.name && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    const videoIndex = parseInt(req.params.videoIndex);
    if (!course.videos || videoIndex >= course.videos.length) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    course.videos.splice(videoIndex, 1);
    await course.save();
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error removing video', error: error.message });
  }
});

// Remove document from course
router.delete('/:courseId/documents/:documentIndex', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the instructor
    if (course.instructor !== req.user.name && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    const documentIndex = parseInt(req.params.documentIndex);
    if (!course.documents || documentIndex >= course.documents.length) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    course.documents.splice(documentIndex, 1);
    await course.save();
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error removing document', error: error.message });
  }
});

module.exports = router;
