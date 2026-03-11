import prisma from '../config/database.js';

export const sendFriendRequest = async (req, res) => {
  try {
    const senderAuth0Id = req.auth.payload.sub;
    const { receiverId } = req.body; // This is the user ID of the receiver

    const sender = await prisma.user.findUnique({ where: { auth0Id: senderAuth0Id } });

    // Prevent duplicate requests
    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: sender.id, receiverId },
          { senderId: receiverId, receiverId: sender.id }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Request already exists or you are already friends.' });
    }

    const request = await prisma.friendRequest.create({
      data: {
        senderId: sender.id,
        receiverId
      }
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ error: 'Failed to send request' });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    const userAuth0Id = req.auth.payload.sub;

    const user = await prisma.user.findUnique({ where: { auth0Id: userAuth0Id } });

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.receiverId !== user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (action === 'ACCEPT') {
      await prisma.$transaction([
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status: 'ACCEPTED' }
        }),
        prisma.friendship.create({
          data: { userId: request.senderId, friendId: request.receiverId }
        }),
        prisma.friendship.create({
          data: { userId: request.receiverId, friendId: request.senderId }
        })
      ]);
    } else {
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' }
      });
    }

    res.json({ success: true, action });
  } catch (error) {
    console.error('Respond to request error:', error);
    res.status(500).json({ error: 'Failed to respond to request' });
  }
};

export const getFriends = async (req, res) => {
  try {
    const userAuth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({ where: { auth0Id: userAuth0Id } });

    const friendships = await prisma.friendship.findMany({
      where: { userId: user.id },
      include: {
        friend: { include: { profile: true } }
      }
    });

    res.json(friendships.map(f => f.friend));
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

export const followOrganizer = async (req, res) => {
  // Simplified follow logic
  try {
    const followerAuth0Id = req.auth.payload.sub;
    const { organizerId } = req.body;

    const follower = await prisma.user.findUnique({ where: { auth0Id: followerAuth0Id } });

    const follow = await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId: organizerId
      }
    });

    res.status(201).json(follow);
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow' });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userAuth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({ where: { auth0Id: userAuth0Id } });

    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: user.id, status: 'PENDING' },
      include: {
        sender: { include: { profile: true } }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        username: { contains: query, mode: 'insensitive' }
      },
      take: 10,
      include: { profile: true }
    });

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};
