const { connectToDatabase } = require('./mongodb');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const db = await connectToDatabase();
      const scores = await db
        .collection('leaderboard')
        .find({})
        .sort({ score: -1 })
        .limit(10)
        .toArray();

      res.status(200).json(scores);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching leaderboard data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 