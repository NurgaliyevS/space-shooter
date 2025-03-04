const { connectToDatabase } = require('./mongodb');

function isValidEmail(email) {
  return email && email.includes('@') && email.indexOf('.', email.indexOf('@')) > email.indexOf('@');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, score } = req.body;
      if (!isValidEmail(email) || !score) {
        return res.status(400).json({ error: 'Invalid data. Email must be valid and score is required.' });
      }
      const db = await connectToDatabase();
      await db.collection('leaderboard').insertOne({
        email,
        score: Number(score),
        timestamp: new Date()
      });
      res.status(201).json({ message: 'Score submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error submitting score' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};