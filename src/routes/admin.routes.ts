import { Router } from 'express';
import { getAdminDashboardStats, getAdminUsers, createCategory, createCourse, createLesson, createAchievement, getCourses, getCategories, getAchievements, updateCategory, updateCourse, createModule, updateModule, updateLesson, getCourseModules, deleteModule, deleteLesson } from '../controllers/admin.controller';
import { auth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication AND admin role
router.use(auth);
router.use(requireAdmin);

router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/users', getAdminUsers);

// CRUD operations
router.get('/courses', getCourses);
router.get('/categories', getCategories);
router.get('/achievements', getAchievements);

router.post('/categories', createCategory);
router.patch('/categories/:key', updateCategory);

router.post('/courses', createCourse);
router.patch('/courses/:id', updateCourse);

router.post('/modules', createModule);
router.patch('/modules/:id', updateModule);

router.post('/lessons', createLesson);
router.patch('/lessons/:id', updateLesson);

router.post('/achievements', createAchievement);

router.get('/courses/:id/modules', getCourseModules);
router.delete('/modules/:id', deleteModule);
router.delete('/lessons/:id', deleteLesson);

export default router;
