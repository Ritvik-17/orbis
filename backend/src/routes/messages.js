import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { getInbox, getConversation, sendMessage } from '../controllers/messages.js';

const router = express.Router();

router.use(checkJwt);
router.use(ensureUser);

router.get('/inbox', getInbox);
router.get('/:conversationId', getConversation);
router.post('/', sendMessage);

export default router;
