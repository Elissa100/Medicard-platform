import {
  registerPatient,
  verifyEmail,
  createSubscription,
  getPatientSubscription,
} from '../services/registration.service.js';

/**
 * Register a new patient
 */
export async function register(req, res) {
  try {
    const { email, phone, password, firstName, lastName, plan } = req.body;

    // Validate required fields
    if (!email || !phone || !password || !firstName || !lastName || !plan) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required. Please fill in all information.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Validate phone number
    if (phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid phone number',
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Validate plan
    if (!['BASIC', 'PREMIUM'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan. Must be BASIC or PREMIUM',
      });
    }

    const result = await registerPatient({
      email,
      phone,
      password,
      firstName,
      lastName,
      plan,
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.message.includes('Email already registered')) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered. Please login instead.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again later.',
    });
  }
}

/**
 * Verify email with code
 */
export async function verify(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required',
      });
    }

    if (code.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Verification code must be 6 digits',
      });
    }

    const result = await verifyEmail(email, code);

    res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error);
    
    if (error.message.includes('Invalid or expired')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code. Please request a new code.',
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    });
  }
}

/**
 * Process payment and create subscription
 */
export async function processPayment(req, res) {
  try {
    const { patientId, plan, amount, paymentMethod, paymentReference } = req.body;

    if (!patientId || !plan || !amount || !paymentMethod || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // TODO: Verify payment with Xentripay
    // For now, we'll assume payment is successful if reference is provided
    const isPaymentValid = paymentReference && paymentReference.length > 0;

    if (!isPaymentValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment reference',
      });
    }

    const subscription = await createSubscription(
      patientId,
      plan,
      amount,
      paymentMethod,
      paymentReference
    );

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      subscription,
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment processing failed',
    });
  }
}

/**
 * Get patient subscription
 */
export async function getSubscription(req, res) {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
      });
    }

    const subscription = await getPatientSubscription(patientId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found',
      });
    }

    res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get subscription',
    });
  }
}
