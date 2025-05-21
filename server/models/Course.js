const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Title is required'] 
  },
  instructor: { 
    type: String, 
    required: [true, 'Instructor is required'] 
  },
  duration: { 
    type: Number, 
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 hour']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'] 
  },
  detailedDescription: {
    type: String,
    default: ''
  },
  image: { 
    type: String, 
    required: [true, 'Image URL is required'],
    validate: {
      validator: function(v) {
        return (/^(http|https):\/\/[^ "]+$/.test(v)) || v.startsWith('/uploads/images/');
      },
      message: 'Invalid image URL format'
    }
  },
  enrolledCount: { 
    type: Number, 
    default: 0 
  },
  videos: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    order: { type: Number, default: 0 }
  }],
  documents: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, default: 'pdf' }, // pdf, doc, etc.
    order: { type: Number, default: 0 }
  }],
  syllabus: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
