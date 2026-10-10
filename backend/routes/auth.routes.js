const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', verifyToken, AuthController.getMe);
router.get('/profile', verifyToken, AuthController.getMe);
router.put('/profile', verifyToken, AuthController.updateProfile);

module.exports = router;
