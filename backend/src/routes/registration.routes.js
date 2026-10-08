import express from 'express';
import {
  register,
  verify,
  processPayment,
  getSubscription,
} from '../controllers/registration.controller.js';

const router = express.Router();

/**
 * @route   POST /api/v1/registration/register
 * @desc    Register a new patient
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/v1/registration/verify
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify', verify);

/**
 * @route   POST /api/v1/registration/payment
 * @desc    Process payment and create subscription
 * @access  Public
 */
router.post('/payment', processPayment);

/**
 * @route   GET /api/v1/registration/subscription/:patientId
 * @desc    Get patient subscription
 * @access  Public (token required in header)
 */
router.get('/subscription/:patientId', getSubscription);

export default router;
