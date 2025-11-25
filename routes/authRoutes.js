const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/authController');
const { signupValidator, loginValidator } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

router.post('/signup', signupValidator, signup);
router.post('/login', loginValidator, login);
router.get('/profile', authenticate, getProfile);

module.exports = router;


