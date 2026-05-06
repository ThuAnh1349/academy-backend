import { Router } from 'express';
import { academyController } from '../controllers/academy.controller';
import { auth } from '../middleware/auth.middleware';

const router = Router();

router.get('/learn/dashboard', auth, academyController.getDashboard);
router.get('/learn/courses', auth, academyController.getCourses);
router.get('/learn/courses/:slug', auth, academyController.getCourseDetail);
router.get('/learn/lessons/:id', auth, academyController.getLessonContent);
router.get('/learn/gamification', auth, academyController.getGamification);

export default router;
