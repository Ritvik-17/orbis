import express from 'express';
import authRoutes from './auth.js';
import eventRoutes from './events.js';
import clubRoutes from './clubs.js'; 
import { checkJwt } from '../middleware/auth.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/events', checkJwt, eventRoutes); // Protected route
router.use('/clubs', clubRoutes);

export default router; 