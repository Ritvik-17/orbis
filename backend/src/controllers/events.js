import prisma from '../config/database.js';
//import { createNotification } from "../utils/notification.js";

export const createEvent = async (req, res) => {
  try {
    const userId = req.auth.payload.sub;
    const eventData = req.body;

    // Find user first
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate user role
    if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Only organizers can create events.' });
    }

    // delete previous autosave
    if (req.body.id) {
      await prisma.event.delete({
        where: { id: req.body.id }
      });
    }

    console.log('Full eventData:', JSON.stringify(eventData, null, 2));
    console.log('Event Branding Data:', JSON.stringify(eventData.eventBranding, null, 2));
    console.log('Logo Image Public URL:', eventData.eventBranding?.logoImage?.publicUrl);
    console.log('Cover Image Public URL:', eventData.eventBranding?.coverImage?.publicUrl);

    const event = await prisma.event.create({
      data: {
        name: eventData.name,
        tagline: eventData.tagline || null,
        about: eventData.about || null,
        type: eventData.type || 'HACKATHON',
        maxTeamSize: eventData.maxTeamSize ? parseInt(eventData.maxTeamSize) : null,
        maxParticipants: eventData.maxParticipants ? parseInt(eventData.maxParticipants) : null,
        minTeamSize: eventData.minTeamSize ? parseInt(eventData.minTeamSize) : null,
        mode: eventData.mode,
        status: eventData.status || 'PUBLISHED',
        createdById: user.id,

        timeline: {
          create: {
            eventStart: eventData.eventTimeline.eventStart,
            eventEnd: eventData.eventTimeline.eventEnd,
            applicationsStart: eventData.eventTimeline.applicationsStart,
            applicationsEnd: eventData.eventTimeline.applicationsEnd,
            rsvpDaysBeforeDeadline: parseInt(eventData.eventTimeline.rsvpDaysBeforeDeadline)
          }
        },

        branding: {
          create: {
            logoUrl: eventData.eventBranding.logoImage || null,
            coverUrl: eventData.eventBranding.coverImage || null,
            brandColor: eventData.eventBranding.brandColor || '#000000'
          }
        },

        links: {
          create: {
            websiteUrl: eventData.eventLinks[0].websiteUrl || null,
            micrositeUrl: eventData.eventLinks[0].micrositeUrl || null,
            contactEmail: eventData.eventLinks[0].contactEmail || null,
            socialLinks: eventData.eventLinks[0].socialLinks || {}
          }
        },

        tracks: {
          create: eventData.tracks.map(track => ({
            name: track.name,
            description: track.description,
            prizes: {
              create: track.prizes?.map(prize => ({
                title: prize.title,
                description: prize.description,
                value: parseFloat(prize.value) || 0
              })) || []
            }
          }))
        },

        sponsors: {
          create: eventData.sponsors.map(sponsor => ({
            name: sponsor.name,
            websiteUrl: sponsor.websiteUrl || '',
            logoUrl: sponsor.logoUrl || null,
            tier: sponsor.tier || 'GOLD'
          }))
        },

        eventPeople: {
          create: eventData.eventPeople.map(person => ({
            name: person.name,
            role: person.role || 'JUDGE',
            imageUrl: person.avatar || null,
            description: person.bio || null,
            socialLinks: person.socialLinks || null
          }))
        },

        applicationForm: {
          create: {
            educationRequired: eventData.applicationForm?.educationRequired || false,
            experienceRequired: eventData.applicationForm?.experienceRequired || false,
            profilesRequired: eventData.applicationForm?.profilesRequired || false,
            contactRequired: eventData.applicationForm?.contactRequired || false,
            tShirtSizeRequired: eventData.applicationForm?.tShirtSizeRequired || false,
          }
        },

        customQuestions: {
          create: eventData.customQuestions.map(question => ({
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            isRequired: question.isRequired
          }))
        }
      },
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event', details: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true,
        applicationForm: true,
        applications: {
          include: {
            team: true,
            user: {
            select: { username: true }
            }
          }
        },
        customQuestions: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true,
        customQuestions: true,
        applicationForm: true,
        applications: {
          include: {
            team: true
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const getCustomQuestions = async (req, res) => {
  try {
    const { eventId } = req.params; // Extract eventId from URL

    const questions = await prisma.customQuestion.findMany({
      where: { eventId: parseInt(eventId) },
      select: {
        questionText: true,
        questionType: true,
        options: true,
        isRequired: true
      }
    });

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const getAutoSave = async (req, res) => {
  try {
    const userId = req.user.id;

    const event = await prisma.event.findFirst({
      where: {
        AND: [
          { status: 'AUTOSAVE' },
          { createdById: userId }
        ]
      },
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true,
        customQuestions: true,
        applicationForm: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetchingas event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.payload.sub;
    const updateData = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.auth0Id !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this event' });
    }

    // If it's just a status update
    if (Object.keys(updateData).length === 1 && updateData.status) {
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: { status: updateData.status },
        include: {
          timeline: true,
          branding: true,
          links: true,
          tracks: {
            include: {
              prizes: true
            }
          },
          sponsors: true,
          eventPeople: true,
          customQuestions: true,
          applicationForm: true,
          createdBy: {
            select: {
              id: true,
              username: true,
              profile: true
            }
          }
        }
      });

      return res.json(updatedEvent);
    }

    // Handle full event update
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: {
        name: updateData.name,
        tagline: updateData.tagline || null,
        about: updateData.about || null,
        type: updateData.type || 'HACKATHON',
        maxParticipants: updateData.maxParticipants,
        minTeamSize: updateData.minTeamSize,
        maxTeamSize: updateData.maxTeamSize,
        mode: updateData.mode,
        status: updateData.status || event.status,

        timeline: {
          update: {
            eventStart: updateData.eventTimeline.eventStart,
            eventEnd: updateData.eventTimeline.eventEnd,
            applicationsStart: updateData.eventTimeline.applicationsStart,
            applicationsEnd: updateData.eventTimeline.applicationsEnd,
            rsvpDaysBeforeDeadline: updateData.eventTimeline.rsvpDaysBeforeDeadline
          }
        },

        branding: {
          update: {
            logoUrl: updateData.eventBranding?.logoImage?.publicUrl || null,
            coverUrl: updateData.eventBranding?.coverImage?.publicUrl || null,
            brandColor: updateData.eventBranding?.brandColor || '#000000'
          }
        },

        links: {
          update: {
            websiteUrl: updateData.eventLinks[0]?.websiteUrl || '',
            micrositeUrl: updateData.eventLinks[0]?.micrositeUrl || '',
            contactEmail: updateData.eventLinks[0]?.contactEmail || '',
            socialLinks: updateData.eventLinks[0]?.socialLinks || null
          }
        }
      },
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            profile: true
          }
        }
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event', details: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.payload.sub;

    // Find user
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find event with its creator
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.auth0Id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this event' });
    }

    // Delete all related records and the event itself
    await prisma.$transaction([
      // Delete applications first
      prisma.application.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete prizes
      prisma.prize.deleteMany({
        where: {
          track: {
            eventId: parseInt(id)
          }
        }
      }),

      // Delete tracks
      prisma.track.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete timeline
      prisma.eventTimeline.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete branding
      prisma.eventBranding.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete links
      prisma.eventLink.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete sponsors
      prisma.sponsor.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Delete event people
      prisma.eventPerson.deleteMany({
        where: { eventId: parseInt(id) }
      }),

      // Finally delete the event
      prisma.event.delete({
        where: { id: parseInt(id) }
      })
    ]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event', details: error.message });
  }
};

export const joinEvent = async (req, res) => {
  // ... existing joinEvent code ...
  // If you want me to paste the full joinEvent implementation here, tell me and I'll include it.
};

export const applyToEvent = async (req, res) => {
  try {
    console.log("Received request body:", req.body);

    const { id: eventId } = req.params;
    const auth0Id = req.auth.payload.sub;
    const { userData, responses, team, mode } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { auth0Id: auth0Id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let existingTeam;

    // Check if the team already exists using the hashCode
    if (mode === 'create') {
      existingTeam = await prisma.team.findUnique({
        where: {
          hashCode: team.hash
        }
      });

      if (!existingTeam) {
        // If the team doesn't exist, create it
        existingTeam = await prisma.team.create({
          data: {
            eventId: parseInt(eventId),
            name: team.name,
            hashCode: team.hash,
          }
        });
      } else {
        return res.status(500).json({ error: 'Generate a new hash.' }); //Incase hash is already in use
      }

      // Add the user as a member of the team if not already a member
      const existingTeamMember = await prisma.teamMember.findFirst({
        where: {
          teamId: existingTeam.id,
          userId: user.id
        }
      });

      if (!existingTeamMember) {
        await prisma.teamMember.create({
          data: {
            teamId: existingTeam.id,
            userId: user.id,
            role: 'LEADER'
          }
        });
      } else {
        return res.status(500).json({ error: 'Already in the team' });
      }
    } else if (mode === 'join') {
      existingTeam = await prisma.team.findUnique({
        where: {
          hashCode: team.hash,
          eventId: parseInt(eventId)
        }
      });

      if (!existingTeam) {
        return res.status(500).json({ error: 'Team does not exist' });
      }

      let presentInTeam = await prisma.teamMember.count({
        where: {
          teamId: existingTeam.id,
          userId: user.id
        }
      });

      if (presentInTeam > 0) {
        return res.status(500).json({ error: 'Registrant is already a part of the team.' });
      }

      let maxTeamSize = await prisma.event.findUnique({
        where: { id: parseInt(eventId) },
        select: { maxTeamSize: true }
      });

      let currentTeamSize = await prisma.teamMember.count({
        where: { teamId: existingTeam.id }
      });

      if (currentTeamSize === maxTeamSize.maxTeamSize) {
        return res.status(500).json({ error: 'Team is at maximum capacity' });
      }

      await prisma.teamMember.create({
        data: {
          teamId: existingTeam.id,
          userId: user.id,
          role: 'MEMBER'
        }
      });
    }

    // Create application with team reference
    const application = await prisma.application.create({
      data: {
        eventId: parseInt(eventId),
        userId: user.id,
        teamId: existingTeam.id,
        status: 'PENDING',
        userData: userData,
        responses: responses || {}
      },
      include: {
        team: true
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Error in applyToEvent:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

export const publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.payload.sub;

    // Find user
    const user = await prisma.user.findUnique({
      where: { auth0Id: userId },
      include: {
        events: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: parseInt(id) },
      include: {
        createdBy: true
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user owns the event
    if (event.createdBy.auth0Id !== userId) {
      return res.status(403).json({ error: 'Not authorized to publish this event' });
    }

    // Update event status
    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(id) },
      data: { status: 'PUBLISHED' },
      include: {
        timeline: true,
        branding: true,
        links: true,
        tracks: {
          include: {
            prizes: true
          }
        },
        sponsors: true,
        eventPeople: true
      }
    });

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).json({ error: 'Failed to publish event' });
  }
};

export const getApplication = async (req, res) => {
  try {
    // Extract user ID from Auth0 token
    const auth0Id = req.auth.payload.sub;
    const eventId = parseInt(req.params.eventId, 10);

    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized: No user ID found" });
    }

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const application = await prisma.application.findFirst({
      where: {
        userId: user.id,
        eventId,
      },
      include: {
        event: true,
        team: true,
      },
    });

    if (!application) {
      return res.status(200).json({ error: "Application not found for this user and event" });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error fetching application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateApplication = async (req, res) => {
  try {
    // Extract Auth0 ID from token
    const auth0Id = req.auth?.payload?.sub;
    const eventId = parseInt(req.params.eventId, 10);
    const { userId, status, responses, teamId } = req.body;

    if (!auth0Id) {
      return res.status(401).json({ error: "Unauthorized: No Auth0 ID found" });
    }

    if (isNaN(eventId)) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    // Find the application belonging to the user and event
    const application = await prisma.application.findFirst({
      where: {
        userId,
        eventId,
      },
    });

    console.log(application);

    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Update the application
    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: status || application.status,
        responses: responses || application.responses,
        teamId: teamId !== undefined ? teamId : application.teamId,
      },
    });

    // 🔔 Trigger notification if status changed to ACCEPTED or REJECTED
    if (status === "ACCEPTED") {
      try {
        await createNotification({
          userId: updatedApplication.userId,
          title: "Application Approved 🎉",
          message: "Congratulations! Your application has been accepted.",
          type: "APPLICATION",
        });
      } catch (notifErr) {
        console.error("Failed to create ACCEPTED notification:", notifErr);
        // don't fail the request if notification fails
      }
    }

    if (status === "REJECTED") {
      try {
        await createNotification({
          userId: updatedApplication.userId,
          title: "Application Update",
          message: "Your application was not selected this time.",
          type: "APPLICATION",
        });
      } catch (notifErr) {
        console.error("Failed to create REJECTED notification:", notifErr);
      }
    }

    res.status(200).json(updatedApplication);
  } catch (error) {
    console.error("Error updating application:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// PATCH /api/events/:id/attendance
export const updateAttendance = async (req, res) => {
    const { applicationId, attendance } = req.body;
    
    try {
        const updated = await prisma.application.update({
            where: { id: applicationId },
            data: { attendance }
        });
        res.json(updated);
    } catch (err) {
        console.error('Error updating attendance:', err);
        res.status(500).json({ error: 'Failed to update attendance' });
    }
};

// export const deleteApplication = async (req, res) => {
//   try {
//     // Extract user ID from Auth0 token
//     const auth0Id = req.auth?.payload?.sub;
//     const eventId = parseInt(req.params.eventId, 10);

//     if (!auth0Id) {
//       return res.status(401).json({ error: "Unauthorized: No user ID found" });
//     }

//     if (isNaN(eventId)) {
//       return res.status(400).json({ error: "Invalid event ID" });
//     }

//     // Find the user based on auth0Id
//     const user = await prisma.user.findUnique({
//       where: { auth0Id },
//       select: { id: true },
//     });

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }

//     // Check if the application exists
//     const application = await prisma.application.findFirst({
//       where: {
//         userId: user.id,
//         eventId,
//       },
//     });

//     if (!application) {
//       return res.status(404).json({ error: "Application not found" });
//     }

//     // Delete the application
//     await prisma.application.delete({
//       where: { id: application.id },
//     });

//     res.status(200).json({ message: "Application deleted successfully" });
//   } catch (error) {
//     console.error("Error deleting application:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };