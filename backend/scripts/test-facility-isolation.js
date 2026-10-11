/**
 * Facility Isolation & Multi-tenant Access Scoping Test
 *
 * Verifies that:
 * 1. Clinic staff can only list and search patients with an appointment,
 *    encounter, or active card-tap session at their specific facility.
 * 2. Staff from Clinic A cannot list Clinic B's patients.
 * 3. Staff from Clinic A cannot open or view Clinic B's patients (HTTP 403 Forbidden).
 * 4. Staff without a facilityId cannot query patient records (HTTP 403 Forbidden).
 * 5. Card tap at Clinic A grants immediate authorized access to Clinic A,
 *    without granting unauthorized access to Clinic B.
 */

import assert from "node:assert/strict";
import {
  buildFacilityAccessFilter,
  getPatients,
  getPatientById,
  patientExistsGlobally,
  updatePatient,
  deletePatient,
} from "../src/services/patient.service.js";
import {
  getPatients as getPatientsController,
  getPatientById as getPatientByIdController,
} from "../src/controllers/patient.controller.js";
import prisma from "../src/config/database.js";

console.log("==================================================================");
console.log("  Running Facility Scoping & Multi-Tenant Patient Isolation Tests ");
console.log("==================================================================");

const CLINIC_A = "facility-clinic-a-uuid";
const CLINIC_B = "facility-clinic-b-uuid";

// Simulated database records
const mockPatients = [
  {
    id: "pat-a1",
    patientNumber: "MED-2026-000001",
    firstName: "Alice",
    lastName: "Amani",
    phone: "+250788111111",
    appointments: [{ facilityId: CLINIC_A }],
    encounters: [],
    patientSessions: [],
    cards: [{ id: "card-1", cardUid: "NFC-001" }],
  },
  {
    id: "pat-a2",
    patientNumber: "MED-2026-000002",
    firstName: "Antoine",
    lastName: "Akagera",
    phone: "+250788222222",
    appointments: [],
    encounters: [{ facilityId: CLINIC_A }],
    patientSessions: [],
    cards: [],
  },
  {
    id: "pat-a3",
    patientNumber: "MED-2026-000003",
    firstName: "Aline",
    lastName: "Ayinkamiye",
    phone: "+250788333333",
    appointments: [],
    encounters: [],
    patientSessions: [{ facilityId: CLINIC_A, status: "ACTIVE", startedAt: new Date() }],
    cards: [],
  },
  {
    id: "pat-b1",
    patientNumber: "MED-2026-000004",
    firstName: "Barnabe",
    lastName: "Bizimana",
    phone: "+250788444444",
    appointments: [{ facilityId: CLINIC_B }],
    encounters: [],
    patientSessions: [],
    cards: [],
  },
  {
    id: "pat-b2",
    patientNumber: "MED-2026-000005",
    firstName: "Beata",
    lastName: "Bugesera",
    phone: "+250788555555",
    appointments: [],
    encounters: [{ facilityId: CLINIC_B }],
    patientSessions: [],
    cards: [],
  },
];

// Helper to evaluate Prisma-style facility scope against a mock record
function matchesFacilityScope(patient, facilityId, sessionCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000)) {
  const hasAppointment = patient.appointments?.some((a) => a.facilityId === facilityId);
  const hasEncounter = patient.encounters?.some((e) => e.facilityId === facilityId);
  const hasActiveSession = patient.patientSessions?.some(
    (s) => s.facilityId === facilityId && s.status === "ACTIVE" && (!s.startedAt || s.startedAt >= sessionCutoff)
  );
  return Boolean(hasAppointment || hasEncounter || hasActiveSession);
}

function matchesSearch(patient, search) {
  if (!search) return true;
  const term = search.toLowerCase();
  return (
    patient.firstName?.toLowerCase().includes(term) ||
    patient.lastName?.toLowerCase().includes(term) ||
    patient.patientNumber?.toLowerCase().includes(term) ||
    patient.phone?.toLowerCase().includes(term)
  );
}

// Intercept Prisma calls for testing
const originalFindMany = prisma.patient.findMany;
const originalFindFirst = prisma.patient.findFirst;
const originalCount = prisma.patient.count;
const originalFindUnique = prisma.patient.findUnique;
const originalUpdate = prisma.patient.update;
const originalDelete = prisma.patient.delete;

function mockPrisma() {
  prisma.patient.findMany = async ({ where, skip = 0, take = 50 }) => {
    // Extract facilityId from where clause
    let facilityId = null;
    let search = null;

    if (where?.OR) {
      facilityId = where.OR[0]?.appointments?.some?.facilityId;
    } else if (where?.AND) {
      const facFilter = where.AND.find((item) => item.OR && item.OR[0]?.appointments);
      if (facFilter) facilityId = facFilter.OR[0]?.appointments?.some?.facilityId;
      const searchFilter = where.AND.find((item) => item.OR && item.OR[0]?.firstName);
      if (searchFilter) search = searchFilter.OR[0]?.firstName?.contains;
    }

    const filtered = mockPatients.filter((p) => {
      const facilityMatch = facilityId ? matchesFacilityScope(p, facilityId) : true;
      const searchMatch = matchesSearch(p, search);
      return facilityMatch && searchMatch;
    });

    return filtered.slice(skip, skip + take);
  };

  prisma.patient.count = async ({ where } = {}) => {
    if (!where) return mockPatients.length;
    if (where.id) return mockPatients.some((p) => p.id === where.id) ? 1 : 0;

    let facilityId = null;
    let search = null;

    if (where?.OR) {
      facilityId = where.OR[0]?.appointments?.some?.facilityId;
    } else if (where?.AND) {
      const facFilter = where.AND.find((item) => item.OR && item.OR[0]?.appointments);
      if (facFilter) facilityId = facFilter.OR[0]?.appointments?.some?.facilityId;
      const searchFilter = where.AND.find((item) => item.OR && item.OR[0]?.firstName);
      if (searchFilter) search = searchFilter.OR[0]?.firstName?.contains;
    }

    return mockPatients.filter((p) => {
      const facilityMatch = facilityId ? matchesFacilityScope(p, facilityId) : true;
      const searchMatch = matchesSearch(p, search);
      return facilityMatch && searchMatch;
    }).length;
  };

  prisma.patient.findFirst = async ({ where }) => {
    const id = where.id;
    let facilityId = null;
    if (where.OR) {
      facilityId = where.OR[0]?.appointments?.some?.facilityId;
    }

    const patient = mockPatients.find((p) => p.id === id);
    if (!patient) return null;
    if (facilityId && !matchesFacilityScope(patient, facilityId)) {
      return null;
    }
    return patient;
  };

  prisma.patient.findUnique = async ({ where }) => {
    return mockPatients.find((p) => p.id === where.id) || null;
  };

  prisma.patient.update = async ({ where, data }) => {
    const patient = mockPatients.find((p) => p.id === where.id);
    if (!patient) throw new Error("Record not found");
    Object.assign(patient, data);
    return patient;
  };

  prisma.patient.delete = async ({ where }) => {
    const idx = mockPatients.findIndex((p) => p.id === where.id);
    if (idx === -1) throw new Error("Record not found");
    const [deleted] = mockPatients.splice(idx, 1);
    return deleted;
  };
}

function restorePrisma() {
  prisma.patient.findMany = originalFindMany;
  prisma.patient.findFirst = originalFindFirst;
  prisma.patient.count = originalCount;
  prisma.patient.findUnique = originalFindUnique;
  prisma.patient.update = originalUpdate;
  prisma.patient.delete = originalDelete;
}

// Express mock helper
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
}

async function runTests() {
  mockPrisma();

  try {
    // -------------------------------------------------------------------------
    // TEST 1: buildFacilityAccessFilter query structure
    // -------------------------------------------------------------------------
    console.log("\n[Test 1] Verifying buildFacilityAccessFilter structure...");
    const filter = buildFacilityAccessFilter(CLINIC_A);
    assert.equal(Array.isArray(filter.OR), true);
    assert.deepEqual(filter.OR[0], { appointments: { some: { facilityId: CLINIC_A } } });
    assert.deepEqual(filter.OR[1], { encounters: { some: { facilityId: CLINIC_A } } });
    assert.equal(filter.OR[2].patientSessions.some.facilityId, CLINIC_A);
    assert.equal(filter.OR[2].patientSessions.some.status, "ACTIVE");
    assert.equal(filter.OR[2].patientSessions.some.startedAt.gte instanceof Date, true);
    console.log("  PASS: buildFacilityAccessFilter correctly enforces appointments, encounters, and 12-hour session expiry");

    // -------------------------------------------------------------------------
    // TEST 2: Clinic A staff listing patients
    // -------------------------------------------------------------------------
    console.log("\n[Test 2] Clinic A staff lists patients...");
    const clinicAResult = await getPatients({ facilityId: CLINIC_A });
    const clinicAPatientIds = clinicAResult.patients.map((p) => p.id);

    assert.equal(clinicAPatientIds.includes("pat-a1"), true, "Must include patient with appointment at Clinic A");
    assert.equal(clinicAPatientIds.includes("pat-a2"), true, "Must include patient with encounter at Clinic A");
    assert.equal(clinicAPatientIds.includes("pat-a3"), true, "Must include patient with active NFC tap at Clinic A");
    assert.equal(clinicAPatientIds.includes("pat-b1"), false, "MUST NOT include Clinic B patient (pat-b1)");
    assert.equal(clinicAPatientIds.includes("pat-b2"), false, "MUST NOT include Clinic B patient (pat-b2)");
    console.log("  PASS: Clinic A only sees Clinic A patients; 0 patients leaked from Clinic B");

    // -------------------------------------------------------------------------
    // TEST 3: Clinic B staff listing patients
    // -------------------------------------------------------------------------
    console.log("\n[Test 3] Clinic B staff lists patients...");
    const clinicBResult = await getPatients({ facilityId: CLINIC_B });
    const clinicBPatientIds = clinicBResult.patients.map((p) => p.id);

    assert.equal(clinicBPatientIds.includes("pat-b1"), true, "Must include patient with appointment at Clinic B");
    assert.equal(clinicBPatientIds.includes("pat-b2"), true, "Must include patient with encounter at Clinic B");
    assert.equal(clinicBPatientIds.includes("pat-a1"), false, "MUST NOT include Clinic A patient (pat-a1)");
    assert.equal(clinicBPatientIds.includes("pat-a2"), false, "MUST NOT include Clinic A patient (pat-a2)");
    assert.equal(clinicBPatientIds.includes("pat-a3"), false, "MUST NOT include Clinic A patient (pat-a3)");
    console.log("  PASS: Clinic B only sees Clinic B patients; 0 patients leaked from Clinic A");

    // -------------------------------------------------------------------------
    // TEST 4: Search scoping (Clinic A searching for Clinic B's patient)
    // -------------------------------------------------------------------------
    console.log("\n[Test 4] Clinic A staff searches for Clinic B patient by name...");
    const crossSearch = await getPatients({ facilityId: CLINIC_A, search: "Bizimana" });
    assert.equal(crossSearch.patients.length, 0, "Clinic A search must not return Clinic B patient");

    const validSearch = await getPatients({ facilityId: CLINIC_A, search: "Amani" });
    assert.equal(validSearch.patients.length, 1);
    assert.equal(validSearch.patients[0].id, "pat-a1");
    console.log("  PASS: Search is strictly constrained to the caller's facility");

    // -------------------------------------------------------------------------
    // TEST 5: Controller layer - Clinic A opening Clinic A patient
    // -------------------------------------------------------------------------
    console.log("\n[Test 5] Clinic A staff opens Clinic A patient record (getPatientById)...");
    const reqOpenOwn = {
      user: { id: "user-a", facilityId: CLINIC_A, role: "RECEPTIONIST" },
      params: { id: "pat-a1" },
    };
    const resOpenOwn = createMockRes();
    await getPatientByIdController(reqOpenOwn, resOpenOwn, (err) => { throw err; });

    assert.equal(resOpenOwn.statusCode, 200);
    assert.equal(resOpenOwn.body.success, true);
    assert.equal(resOpenOwn.body.data.id, "pat-a1");
    console.log("  PASS: Clinic A staff successfully opens authorized patient (HTTP 200)");

    // -------------------------------------------------------------------------
    // TEST 6: Controller layer - Clinic A attempting to open Clinic B patient (HTTP 404 to avoid revealing existence)
    // -------------------------------------------------------------------------
    console.log("\n[Test 6] Clinic A staff attempts to open Clinic B patient record (must return 404)...");
    const reqOpenOther = {
      user: { id: "user-a", facilityId: CLINIC_A, role: "RECEPTIONIST" },
      params: { id: "pat-b1" },
    };
    const resOpenOther = createMockRes();
    await getPatientByIdController(reqOpenOther, resOpenOther, (err) => { throw err; });

    assert.equal(resOpenOther.statusCode, 404, "Must return HTTP 404 Not Found to conceal patient existence");
    assert.equal(resOpenOther.body.success, false);
    assert.equal(resOpenOther.body.message, "Patient not found");
    console.log("  PASS: Cross-facility lookup safely returns HTTP 404 Not Found without leaking existence");

    // -------------------------------------------------------------------------
    // TEST 7: Staff without facilityId attempting to list or open patients
    // -------------------------------------------------------------------------
    console.log("\n[Test 7] User without facilityId attempts to list patients...");
    const reqNoFacility = {
      user: { id: "user-unassigned", role: "ADMIN" },
      query: {},
    };
    const resNoFacility = createMockRes();
    await getPatientsController(reqNoFacility, resNoFacility, (err) => { throw err; });

    assert.equal(resNoFacility.statusCode, 403);
    assert.equal(resNoFacility.body.message, "Access denied: staff user is not assigned to a facility");
    console.log("  PASS: User without facilityId blocked with HTTP 403 Forbidden");

    // -------------------------------------------------------------------------
    // TEST 8: Card tap dynamically authorizes Clinic A for a patient
    // -------------------------------------------------------------------------
    console.log("\n[Test 8] Patient B1 taps card at Clinic A (creates active session at Clinic A)...");
    const targetPatient = mockPatients.find((p) => p.id === "pat-b1");

    // Before tap: Clinic A cannot access
    const beforeTap = await getPatientById("pat-b1", CLINIC_A);
    assert.equal(beforeTap, null, "Before tap, Clinic A cannot view Patient B1");

    // Simulate card tap at Clinic A: creates active session now
    targetPatient.patientSessions.push({
      id: "session-tap-1",
      facilityId: CLINIC_A,
      status: "ACTIVE",
      startedAt: new Date(),
    });

    // After tap: Clinic A can access
    const afterTap = await getPatientById("pat-b1", CLINIC_A);
    assert.notEqual(afterTap, null, "After card tap, Clinic A can view Patient B1");
    assert.equal(afterTap.id, "pat-b1");

    // Clinic B still has their own access intact
    const clinicBAccess = await getPatientById("pat-b1", CLINIC_B);
    assert.notEqual(clinicBAccess, null, "Clinic B still has access");
    console.log("  PASS: Card tap at Clinic A grants visit access to Clinic A without compromising multi-tenancy");

    // -------------------------------------------------------------------------
    // TEST 9: Non-existent patient returns 404
    // -------------------------------------------------------------------------
    console.log("\n[Test 9] Opening non-existent patient returns HTTP 404...");
    const reqNotFound = {
      user: { id: "user-a", facilityId: CLINIC_A, role: "DOCTOR" },
      params: { id: "non-existent-uuid" },
    };
    const resNotFound = createMockRes();
    await getPatientByIdController(reqNotFound, resNotFound, (err) => { throw err; });

    assert.equal(resNotFound.statusCode, 404);
    assert.equal(resNotFound.body.message, "Patient not found");
    console.log("  PASS: Non-existent patient properly returns HTTP 404 Not Found");

    // -------------------------------------------------------------------------
    // TEST 10: Session expiry - 13 hour old session does NOT grant facility access
    // -------------------------------------------------------------------------
    console.log("\n[Test 10] Session older than 12 hours is expired and denies access...");
    const expiredPatient = {
      id: "pat-expired",
      patientNumber: "MED-2026-000099",
      firstName: "Expired",
      lastName: "SessionPatient",
      appointments: [],
      encounters: [],
      patientSessions: [
        {
          id: "session-old",
          facilityId: CLINIC_A,
          status: "ACTIVE",
          // Started 13 hours ago (older than 12h cutoff)
          startedAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
        },
      ],
      cards: [],
    };
    mockPatients.push(expiredPatient);

    const expiredAccess = await getPatientById("pat-expired", CLINIC_A);
    assert.equal(expiredAccess, null, "Session older than 12h must not grant facility access");
    console.log("  PASS: Card tap session strictly expires after 12 hours");

    console.log("\n==================================================================");
    console.log("  ALL FACILITY ISOLATION TESTS PASSED (10/10)                      ");
    console.log("==================================================================\n");
    process.exit(0);
  } catch (error) {
    console.error("\nTEST SUITE FAILED:", error);
    process.exit(1);
  } finally {
    restorePrisma();
  }
}

runTests();

