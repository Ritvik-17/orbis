import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './src/middleware/error.js';
import prisma from './src/config/database.js';
import { checkJwt } from './src/middleware/auth.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './src/routes/auth.js';
import eventRoutes from './src/routes/events.js';
import teamRoutes from './src/routes/teams.js';
import projectRoutes from './src/routes/projects.js';
import profileRoutes from './src/routes/profiles.js';
<<<<<<< HEAD
import clubRoutes from './src/routes/clubs.js';
=======
import postRoutes from './src/routes/posts.js';
import friendRoutes from './src/routes/friends.js';
import messageRoutes from './src/routes/messages.js';
>>>>>>> community-module

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Make io accessible in our routes
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes); // Remove checkJwt from public routes
app.use('/api/teams', checkJwt, teamRoutes);
app.use('/api/projects', checkJwt, projectRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api', checkJwt, profileRoutes); // Changed from '/api/profiles' to '/api' to match frontend calls
app.use('/api/posts', postRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

// Error handling
app.use(errorHandler);

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`- Local: http://localhost:${PORT}`);
  if (process.env.SERVER_URL) {
    console.log(`- Production: ${process.env.SERVER_URL}`);
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Starting graceful shutdown...');
  
  // Close server
  server.close(() => {
    console.log('Express server closed');
  });

  try {
    // Disconnect Prisma
    await prisma.$disconnect();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

