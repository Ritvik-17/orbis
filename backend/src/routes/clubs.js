import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import {
  getClubs,
  getClubById,
  createProject,
  updateProject,
  deleteProject,
  getComments,
  createComment,
  deleteComment
} from '../controllers/clubs.js';

const router = express.Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.get('/', getClubs);
router.get('/:id', getClubById);
router.get('/:projectId/comments', getComments);

// ─── Protected routes (logged in) ─────────────────────────────────────────────
router.post('/:projectId/comments', checkJwt, ensureUser, createComment);
router.delete('/comments/:id', checkJwt, ensureUser, deleteComment);

// ─── Convener only routes ──────────────────────────────────────────────────────
router.post('/:id/projects', checkJwt, ensureUser, createProject);
router.put('/projects/:id', checkJwt, ensureUser, updateProject);
router.delete('/projects/:id', checkJwt, ensureUser, deleteProject);

export default router;