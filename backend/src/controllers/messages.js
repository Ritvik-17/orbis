import prisma from '../config/database.js';

export const getInbox = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({ where: { auth0Id } });

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: { userId: user.id }
        }
      },
      include: {
        members: {
          include: { user: { include: { profile: true } } }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const auth0Id = req.auth.payload.sub;

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { include: { profile: true } }
      }
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        sender: { auth0Id: { not: auth0Id } },
        isRead: false
      },
      data: { isRead: true }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { conversationId, receiverId, content } = req.body;
    
    const sender = await prisma.user.findUnique({ where: { auth0Id } });
    let convId = conversationId;

    // If starting a new direct message thread
    if (!convId && receiverId) {
      // Find existing
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { members: { some: { userId: sender.id } } },
            { members: { some: { userId: receiverId } } }
          ]
        }
      });

      if (existing) {
        convId = existing.id;
      } else {
        const newConv = await prisma.conversation.create({
          data: {
            members: {
              create: [
                { userId: sender.id },
                { userId: receiverId }
              ]
            }
          }
        });
        convId = newConv.id;
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: sender.id,
        content
      },
      include: {
        sender: { include: { profile: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() }
    });

    // Emit socket event if io is accessible
    const io = req.app.get('socketio');
    if (io) {
      io.to(`conversation_${convId}`).emit('message:receive', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};
