import prisma from '../config/database.js';

export const createPost = async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { content, eventId, tags, images } = req.body;

    const post = await prisma.post.create({
      data: {
        content,
        author: { connect: { auth0Id: userId } },
        ...(eventId && { event: { connect: { id: eventId } } }),
        ...(images && images.length > 0 && {
          images: {
            create: images.map(url => ({ url }))
          }
        }),
        ...(tags && tags.length > 0 && {
          tags: {
            create: tags.map(tag => ({
              tag: {
                connectOrCreate: {
                  where: { name: tag },
                  create: { name: tag }
                }
              }
            }))
          }
        })
      },
      include: {
        author: { include: { profile: true } },
        images: true,
        tags: { include: { tag: true } },
        event: true,
        reactions: true,
        _count: { select: { comments: true, reactions: true } }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { include: { profile: true } },
        images: true,
        tags: { include: { tag: true } },
        event: true,
        reactions: true,
        _count: { select: { comments: true } }
      }
    });

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

export const reactToPost = async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const { id: postId } = req.params;
    const { type } = req.body; // LIKE, CELEBRATE, SUPPORT

    const user = await prisma.user.findUnique({ where: { auth0Id: userId } });

    // Check existing reaction
    const existing = await prisma.reaction.findUnique({
      where: { postId_userId: { postId, userId: user.id } }
    });

    if (existing) {
      if (existing.type === type) {
        // Toggle off
        await prisma.reaction.delete({ where: { id: existing.id } });
        return res.json({ message: 'Reaction removed' });
      } else {
        // Update type
        const updated = await prisma.reaction.update({
          where: { id: existing.id },
          data: { type }
        });
        return res.json(updated);
      }
    }

    const reaction = await prisma.reaction.create({
      data: {
        type,
        post: { connect: { id: postId } },
        user: { connect: { id: user.id } }
      }
    });

    res.json(reaction);
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const addComment = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { id: postId } = req.params;
    const { content, parentCommentId } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: postId } },
        user: { connect: { auth0Id } },
        ...(parentCommentId && { parentComment: { connect: { id: parentCommentId } } })
      },
      include: {
        user: { include: { profile: true } }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { id: postId } = req.params;
    
    // Fetch top level comments and their replies (1 level deep)
    const comments = await prisma.comment.findMany({
      where: { postId, parentCommentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { include: { profile: true } },
        replies: {
          include: { user: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        education: true,
        experience: true,
        skills: true,
        socialProfiles: true,
        projects: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send sensitive info like auth0Id
    const { auth0Id, ...publicUser } = user;
    res.json(publicUser);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};
