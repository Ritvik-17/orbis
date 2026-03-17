import express from 'express';
import { checkJwt, ensureUser } from '../middleware/auth.js';
import { sendFriendRequest, respondToRequest, getFriends, followOrganizer, getPendingRequests, searchUsers } from '../controllers/friends.js';

const router = express.Router();

router.use(checkJwt);
router.use(ensureUser);

router.post('/request', sendFriendRequest);
router.post('/request/:requestId', respondToRequest); // action in body
router.get('/requests/pending', getPendingRequests);
router.get('/search', searchUsers);
router.get('/', getFriends);
router.post('/follow', followOrganizer);

export default router;
