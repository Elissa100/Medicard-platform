import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendWelcomeEmail } from './email.service.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Calculate expiration time (10 minutes from now)
 */
function calculateExpiration() {
  return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
}

/**
 * Register a new patient
 */
export async function registerPatient(data) {
  const { email, phone, password, firstName, lastName, plan } = data;

  // Check if email already exists in Patient table
  const existingPatient = await prisma.patient.findFirst({
    where: { email },
  });

  if (existingPatient) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate patient number
  const patientNumber = `PAT${Date.now().toString().slice(-8)}`;

  // Create patient
  const patient = await prisma.patient.create({
    data: {
      patientNumber,
      firstName,
      lastName,
      email,
      phone,
      passwordHash,
    },
  });

  // Generate verification code
  const code = generateVerificationCode();
  const expiresAt = calculateExpiration();

  // Store verification code
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // Send verification email via Brevo
  try {
    await sendVerificationEmail(email, code);
  } catch (emailError) {
    console.error('Failed to send verification email:', emailError);
    // Continue even if email fails - user can request resend
  }

  return {
    success: true,
    message: 'Registration successful. Please check your email for verification code.',
    patientId: patient.id,
    email,
  };
}

/**
 * Verify email with code
 */
export async function verifyEmail(email, code) {
  // Find valid verification code
  const verificationCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      verified: false,
      expiresAt: {
        gte: new Date(),
      },
    },
  });

  if (!verificationCode) {
    throw new Error('Invalid or expired verification code');
  }

  // Mark as verified
  await prisma.verificationCode.update({
    where: { id: verificationCode.id },
    data: { verified: true },
  });

  return {
    success: true,
    message: 'Email verified successfully',
  };
}

/**
 * Create subscription after payment
 */
export async function createSubscription(patientId, plan, amount, paymentMethod, paymentReference) {
  // Calculate end date (1 month from now)
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  const subscription = await prisma.patientSubscription.create({
    data: {
      patientId,
      plan,
      amount: parseInt(amount),
      currency: 'RWF',
      paymentMethod,
      paymentReference,
      startDate: new Date(),
      endDate,
      status: 'ACTIVE',
    },
  });

  // Get patient details for welcome email
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (patient && patient.email) {
    try {
      await sendWelcomeEmail(patient.email, patient.firstName, plan);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }
  }

  return subscription;
}

/**
 * Get patient subscription
 */
export async function getPatientSubscription(patientId) {
  const subscription = await prisma.patientSubscription.findFirst({
    where: {
      patientId,
      status: 'ACTIVE',
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return subscription;
}
