import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { validateBody, validateParams, idParamSchema } from '../middleware/validation';
import { 
  loginSchema, 
  registerSchema, 
  createUserSchema, 
  updateUserSchema, 
  resetPasswordSchema 
} from '../validation/schemas';

const router = Router();

// Authentication routes with validation
router.post('/register', 
  validateBody(registerSchema), 
  authenticateToken, 
  requireAdmin, 
  authController.register
);

router.post('/login', 
  validateBody(loginSchema), 
  loginRateLimiter, 
  authController.login
);

router.get('/profile', authenticateToken, authController.getProfile);

// User management routes with validation
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);

router.post('/users', 
  validateBody(createUserSchema), 
  authenticateToken, 
  requireAdmin, 
  authController.createUser
);

router.put('/users/:id', 
  validateParams(idParamSchema),
  validateBody(updateUserSchema),
  authenticateToken, 
  authController.updateUser
);

router.delete('/users/:id', 
  validateParams(idParamSchema),
  authenticateToken, 
  requireAdmin, 
  authController.deleteUser
);

router.post('/users/:id/reset-password', 
  validateParams(idParamSchema),
  validateBody(resetPasswordSchema),
  authenticateToken, 
  requireAdmin, 
  authController.resetUserPassword
);

export default router;