// Simple script to test the API endpoints
require('dotenv').config();
const { connectToDatabase } = require('./api/mongodb');

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    const db = await connectToDatabase();
    console.log('Connected to MongoDB successfully!');
    
    // Test inserting a sample score
    const result = await db.collection('leaderboard').insertOne({
      email: 'test@example.com',
      score: 100,
      timestamp: new Date()
    });
    console.log('Inserted test score:', result.insertedId);
    
    // Test retrieving scores
    const scores = await db
      .collection('leaderboard')
      .find({})
      .sort({ score: -1 })
      .limit(10)
      .toArray();
    
    console.log('Retrieved leaderboard data:');
    console.table(scores);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing API:', error);
    process.exit(1);
  }
}

testConnection(); 