import prisma from '../config/database.js';

export const getClubs = async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        convener: {
          select: { id: true, username: true }
        },
        projects: {
          select: { id: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clubs);
  } catch (err) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
};

export const getClubById = async (req, res) => {
  try {
    const { id } = req.params;
    const club = await prisma.club.findUnique({
      where: { id: parseInt(id) },
      include: {
        convener: {
          select: { id: true, username: true }
        },
        projects: {
          include: {
            comments: {
              where: { parentId: null },
              include: {
                user: { select: { id: true, username: true } },
                replies: {
                  include: {
                    user: { select: { id: true, username: true } },
                    replies: {
                      include: {
                        user: { select: { id: true, username: true } }
                      }
                    }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json(club);
  } catch (err) {
    console.error('Error fetching club:', err);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
};

export const createProject = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { title, description, githubUrl, demoUrl, contributors } = req.body;

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: { club: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'CONVENER') return res.status(403).json({ error: 'Only conveners can add projects' });
    if (!user.club) return res.status(403).json({ error: 'You are not assigned to a club' });

    const project = await prisma.project.create({
      data: {
        clubId: user.club.id,
        title,
        description,
        githubUrl: githubUrl || null,
        demoUrl: demoUrl || null,
        contributors: contributors || []
      }
    });

    res.status(201).json(project);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { id } = req.params;
    const { title, description, githubUrl, demoUrl, contributors } = req.body;

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: { club: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'CONVENER') return res.status(403).json({ error: 'Only conveners can edit projects' });

    const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.clubId !== user.club?.id) return res.status(403).json({ error: 'You can only edit your own club projects' });

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { title, description, githubUrl, demoUrl, contributors }
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      include: { club: true }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role !== 'CONVENER') return res.status(403).json({ error: 'Only conveners can delete projects' });

    const project = await prisma.project.findUnique({ where: { id: parseInt(id) } });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.clubId !== user.club?.id) return res.status(403).json({ error: 'You can only delete your own club projects' });

    await prisma.project.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const getComments = async (req, res) => {
  try {
    const { projectId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        projectId: parseInt(projectId),
        parentId: null
      },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true } },
            replies: {
              include: {
                user: { select: { id: true, username: true } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

export const createComment = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { projectId } = req.params;
    const { content, parentId } = req.body;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });

    const comment = await prisma.comment.create({
      data: {
        projectId: parseInt(projectId),
        userId: user.id,
        content: content.trim(),
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        user: { select: { id: true, username: true } },
        replies: {
          include: {
            user: { select: { id: true, username: true } }
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const comment = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.userId !== user.id) return res.status(403).json({ error: 'You can only delete your own comments' });

    await prisma.comment.deleteMany({ where: { parentId: parseInt(id) } });
    await prisma.comment.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};