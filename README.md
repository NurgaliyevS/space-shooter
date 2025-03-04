# AI Space Shooter with Leaderboard

A retro-style space shooter game with a global leaderboard system.

## Features

- Classic arcade-style space shooter gameplay
- Neural network-inspired visual effects
- Sound effects using p5.js sound library
- Global leaderboard system using MongoDB Atlas
- Serverless API with Vercel

## How to Play

- Use arrow keys to control your ship
- Press SPACE to shoot
- After game over, press E to submit your score to the leaderboard
- Press SPACE to restart the game

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   ```
4. Run locally:
   ```
   vercel dev
   ```

## Deployment

This project is set up for easy deployment on Vercel:

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```
2. Login to Vercel:
   ```
   vercel login
   ```
3. Deploy:
   ```
   vercel
   ```
4. Add your MongoDB connection string as an environment variable in the Vercel dashboard.

## MongoDB Atlas Setup

1. Create a free MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Create a database named `space-shooter-db`
4. Create a collection named `leaderboard`
5. Get your connection string from the Atlas dashboard
6. Add your connection string to the `.env` file and Vercel environment variables

## Technologies Used

- p5.js for game rendering and sound
- MongoDB Atlas for database
- Vercel for serverless functions and hosting
- Node.js for backend API
