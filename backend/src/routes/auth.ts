import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', authenticateToken, requireAdmin, authController.register);
router.post('/login', authController.login);
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.put('/users/:id', authenticateToken, authController.updateUser);

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working', timestamp: new Date().toISOString() });
});

// Test bcryptjs endpoint
router.get('/test-bcrypt', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const testPassword = 'password123';
    const testHash = '$2b$12$4ozcyf3gWf4VpkdmtfUYKubx8WTcDM/.bXlSKzpcDNT9n3BCWtQcC';
    
    console.log('Testing bcryptjs with:', { testPassword, testHash });
    const result = await bcrypt.compare(testPassword, testHash);
    console.log('Bcryptjs test result:', result);
    
    res.json({ 
      message: 'Bcryptjs test completed', 
      password: testPassword,
      hash: testHash,
      result 
    });
  } catch (error) {
    console.error('Bcryptjs test error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;