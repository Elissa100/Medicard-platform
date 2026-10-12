import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
  authenticateVaultClinic,
  requireVaultRole,
  VAULT_CLINIC_JWT_SECRET,
  recordFailedAttempt,
  clearFailedAttempts,
  isIpLocked,
} from "../../src/middleware/vault-clinic.middleware.js";
import {
  checkClinicianConflict,
} from "../../src/vault-clinic/services/appointment.service.js";

console.log("==================================================================");
console.log("  Running System 2 (Patient Vault Clinic) Security & Integrity Tests");
console.log("==================================================================");

let testsPassed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    throw err;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    throw err;
  }
}

// TEST 1: Token Audience Isolation
runTest("System 1 / Foreign JWT token is rejected by Vault Clinic middleware", () => {
  const foreignToken = jwt.sign(
    { id: "staff-123", facilityId: "fac-1", type: "staff", role: "DOCTOR" },
    process.env.JWT_SECRET || "medcard-secret-key-change-in-production",
    { expiresIn: "1h" }
  );

  let statusCalled = null;
  let jsonCalled = null;
  const req = {
    headers: { authorization: `Bearer ${foreignToken}` },
  };
  const res = {
    status(s) {
      statusCalled = s;
      return this;
    },
    json(j) {
      jsonCalled = j;
      return this;
    },
  };
  let nextCalled = false;

  authenticateVaultClinic(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false, "Should not call next() for foreign token");
  assert.equal(statusCalled, 401, "Should return 401 Unauthorized");
  assert.ok(jsonCalled.message.includes("Invalid, expired, or non-vault-clinic token"));
});

// TEST 2: Valid Vault Clinic token payload
runTest("Vault Clinic token with matching audience is decoded correctly", () => {
  const validPayload = {
    staffId: "staff-uuid-1",
    facilityId: "fac-uuid-1",
    role: "CLINICIAN",
    aud: "vault-clinic",
  };
  const token = jwt.sign(validPayload, VAULT_CLINIC_JWT_SECRET, { expiresIn: "1h" });

  const decoded = jwt.verify(token, VAULT_CLINIC_JWT_SECRET, { audience: "vault-clinic" });
  assert.equal(decoded.aud, "vault-clinic");
  assert.equal(decoded.staffId, "staff-uuid-1");
  assert.equal(decoded.role, "CLINICIAN");
});

// TEST 3: Role gating
runTest("requireVaultRole rejects unauthorized roles with 403", () => {
  const req = {
    vaultStaff: { id: "staff-admin", role: "CLINIC_ADMIN" },
  };
  let status = null;
  let json = null;
  const res = {
    status(s) { status = s; return this; },
    json(j) { json = j; return this; },
  };
  let next = false;

  const clinicianGuard = requireVaultRole("CLINICIAN");
  clinicianGuard(req, res, () => { next = true; });

  assert.equal(next, false);
  assert.equal(status, 403);
  assert.ok(json.message.includes("Insufficient permissions"));
});

runTest("requireVaultRole allows authorized roles", () => {
  const req = {
    vaultStaff: { id: "staff-doc", role: "CLINICIAN" },
  };
  let next = false;
  const clinicianGuard = requireVaultRole("CLINICIAN");
  clinicianGuard(req, {}, () => { next = true; });
  assert.equal(next, true);
});

// TEST 4: Brute force lockout counter
runTest("IP lockout triggers after 5 failed attempts within window", () => {
  const testIp = "192.168.10.99";
  clearFailedAttempts(testIp);
  assert.equal(isIpLocked(testIp), false);

  for (let i = 1; i <= 4; i++) {
    recordFailedAttempt(testIp);
    assert.equal(isIpLocked(testIp), false);
  }

  recordFailedAttempt(testIp);
  assert.equal(isIpLocked(testIp), true);

  clearFailedAttempts(testIp);
  assert.equal(isIpLocked(testIp), false);
});

// TEST 5: Password hash verification
await runAsyncTest("Password hashing and comparison works reliably", async () => {
  const password = "SafePassword#2026";
  const hash = await bcrypt.hash(password, 10);
  const isValid = await bcrypt.compare(password, hash);
  const isInvalid = await bcrypt.compare("WrongPass", hash);

  assert.equal(isValid, true);
  assert.equal(isInvalid, false);
});

console.log(`\n==================================================================`);
console.log(`  All ${testsPassed} System 2 security and integrity tests passed!`);
console.log(`==================================================================\n`);

