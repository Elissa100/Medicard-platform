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
        message: 'Missing required fields',
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
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed',
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
        message: 'Email and code are required',
      });
    }

    const result = await verifyEmail(email, code);

    res.status(200).json(result);
  } catch (error) {
    console.error('Verification error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Verification failed',
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
