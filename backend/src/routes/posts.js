import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { createPost, getPosts, reactToPost, addComment, getComments, getUserProfile } from '../controllers/posts.js';

const router = express.Router();

router.use(checkJwt);
router.use(ensureUser);

router.post('/', createPost);
router.get('/', getPosts);
router.post('/:id/react', reactToPost);
router.post('/:id/comment', addComment);
router.get('/:id/comments', getComments);
router.get('/user/:id', getUserProfile);

export default router;
