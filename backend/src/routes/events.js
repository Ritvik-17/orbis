import express from 'express';
import { checkJwt, ensureUser, isOrganizer, requireCompleteProfile } from '../middleware/auth.js';
import { 
  getEvents, 
  getEventById, 
  getCustomQuestions,
  createEvent, 
  updateEvent, 
  deleteEvent,
  applyToEvent,
  joinEvent,
  publishEvent,
  getAutoSave,
  getApplication,
  updateApplication,
  updateAttendance
} from '../controllers/events.js';
import { validate, eventSchema, eventDraftSchema } from '../middleware/validate.js';

const router = express.Router();

// Protected Organizer only route
router.get('/autosave', checkJwt, ensureUser, isOrganizer, getAutoSave);

// Public routes
router.get('/', getEvents);
router.get('/:id', getEventById);
router.get('/:eventId/custom-questions', getCustomQuestions);

// Protected routes
router.use(checkJwt);
router.use(ensureUser);

// Organizer routes
router.post('/', isOrganizer, createEvent);
router.post('/draft', isOrganizer, validate(eventDraftSchema), createEvent);
router.put('/:id', isOrganizer, updateEvent);
router.delete('/:id', isOrganizer, deleteEvent);

// Participant routes
router.post('/:id/apply', checkJwt, ensureUser, requireCompleteProfile, applyToEvent);
router.post('/:id/join', joinEvent);

// Application routes
router.get('/:eventId/application', checkJwt, ensureUser, getApplication);
router.put('/:eventId/application', checkJwt, ensureUser, updateApplication);

// Attendance route            
router.patch('/:id/attendance', updateAttendance);

export default router;