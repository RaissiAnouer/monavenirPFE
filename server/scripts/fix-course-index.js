require('dotenv').config();
const mongoose = require('mongoose');

async function dropIdIndex() {
  try {
    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eduplatformdb';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the courses collection
    const db = mongoose.connection.db;
    const coursesCollection = db.collection('courses');

    // Get all indexes
    const indexes = await coursesCollection.indexes();
    console.log('Current indexes:', indexes);

    // Check if id_1 index exists
    const idIndex = indexes.find(index => index.name === 'id_1');
    
    if (idIndex) {
      console.log('Found id_1 index, dropping it...');
      await coursesCollection.dropIndex('id_1');
      console.log('Successfully dropped id_1 index');
    } else {
      console.log('No id_1 index found');
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIdIndex(); 