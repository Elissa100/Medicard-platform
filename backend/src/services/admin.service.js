import prisma from "../config/database.js";

function maskPhone(phone) {
  if (!phone) return "—";
  const str = String(phone).trim();
  if (str.length <= 6) return "***";
  const start = str.slice(0, Math.min(6, str.length - 3));
  const end = str.slice(-3);
  return `${start} *** ${end}`;
}

async function logAdminAction(adminUser, action, metadata = null, { ipAddress, userAgent } = {}) {
  try {
    await prisma.securityAuditLog.create({
      data: {
        userId: adminUser?.id || null,
        email: adminUser?.email || "system",
        action,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    });
  } catch (err) {
    console.error("failed to log admin action:", err.message);
  }
}

export async function getOverview() {
  const [
    totalClinics,
    activeClinics,
    totalPatients,
    cardsIssued,
    activeSubscriptions,
    todayAppointments,
    allPayments,
  ] = await Promise.all([
    prisma.facility.count(),
    prisma.facility.count({ where: { status: "ACTIVE" } }),
    prisma.patient.count(),
    prisma.patientCard.count(),
    prisma.patientSubscription.count({ where: { status: "ACTIVE" } }),
    prisma.appointment.count({
      where: {
        scheduledAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.patientVaultPayment.findMany({
      where: { status: { in: ["COMPLETED", "SUCCESS", "SUCCESSFUL"] } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const totalRevenue = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthRevenue = allPayments
    .filter((p) => new Date(p.createdAt) >= startOfMonth)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    counts: {
      clinics: totalClinics,
      activeClinics,
      patients: totalPatients,
      cardsIssued,
      activeSubscriptions,
      todayAppointments,
    },
    revenue: {
      total: totalRevenue,
      thisMonth: monthRevenue,
      currency: "RWF",
    },
  };
}

export async function getClinics() {
  const clinics = await prisma.facility.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          users: true,
          appointments: true,
        },
      },
    },
  });

  return clinics.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    phone: c.phone || "—",
    email: c.email || "—",
    address: c.address || "—",
    status: c.status,
    staffCount: c._count.users,
    appointmentCount: c._count.appointments,
    createdAt: c.createdAt,
  }));
}

export async function updateClinicStatus(clinicId, status, adminUser, context = {}) {
  const updated = await prisma.facility.update({
    where: { id: clinicId },
    data: { status },
  });

  await logAdminAction(
    adminUser,
    "CLINIC_STATUS_UPDATED",
    { clinicId, newStatus: status, clinicName: updated.name },
    context
  );

  return updated;
}

export async function createClinic(data, adminUser, context = {}) {
  const clinic = await prisma.facility.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase().trim(),
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      status: "ACTIVE",
    },
  });

  await logAdminAction(
    adminUser,
    "CLINIC_CREATED",
    { clinicId: clinic.id, name: clinic.name, code: clinic.code },
    context
  );

  return clinic;
}

export async function getUsers({ search, role, page = 1, limit = 20 }) {
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where = {};

  if (role && role !== "ALL") {
    where.role = role;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { firstName: { contains: s, mode: "insensitive" } },
      { lastName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        facility: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function updateUserStatus(userId, isActive, adminUser, context = {}) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  await logAdminAction(
    adminUser,
    "USER_STATUS_UPDATED",
    { targetUserId: userId, targetEmail: updated.email, isActive },
    context
  );

  return updated;
}

export async function getCards({ search, status, page = 1, limit = 20 }) {
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { cardUid: { contains: s, mode: "insensitive" } },
      {
        patient: {
          OR: [
            { patientNumber: { contains: s, mode: "insensitive" } },
            { firstName: { contains: s, mode: "insensitive" } },
            { lastName: { contains: s, mode: "insensitive" } },
            { nationalId: { contains: s, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [cards, total] = await Promise.all([
    prisma.patientCard.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { issuedAt: "desc" },
      select: {
        id: true,
        cardUid: true,
        status: true,
        issuedAt: true,
        expiresAt: true,
        lastUsedAt: true,
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
            phone: true,
            nationalId: true,
          },
        },
      },
    }),
    prisma.patientCard.count({ where }),
  ]);

  const sanitizedCards = cards.map((c) => ({
    id: c.id,
    cardUid: c.cardUid,
    status: c.status,
    issuedAt: c.issuedAt,
    expiresAt: c.expiresAt,
    lastUsedAt: c.lastUsedAt,
    patient: c.patient
      ? {
          id: c.patient.id,
          patientNumber: c.patient.patientNumber,
          name: `${c.patient.firstName} ${c.patient.lastName}`,
          maskedPhone: maskPhone(c.patient.phone),
          maskedNationalId: c.patient.nationalId
            ? `${c.patient.nationalId.slice(0, 4)} *** ${c.patient.nationalId.slice(-3)}`
            : "—",
        }
      : null,
  }));

  return {
    cards: sanitizedCards,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function linkCard({ cardUid, patientIdentifier }, adminUser, context = {}) {
  const patient = await prisma.patient.findFirst({
    where: {
      OR: [
        { patientNumber: patientIdentifier },
        { nationalId: patientIdentifier },
        { id: patientIdentifier },
      ],
    },
  });

  if (!patient) {
    throw new Error("Patient not found by that identifier");
  }

  const existingCard = await prisma.patientCard.findUnique({
    where: { cardUid },
  });

  let card;
  if (existingCard) {
    card = await prisma.patientCard.update({
      where: { cardUid },
      data: {
        patientId: patient.id,
        status: "ACTIVE",
      },
    });
  } else {
    card = await prisma.patientCard.create({
      data: {
        cardUid,
        patientId: patient.id,
        status: "ACTIVE",
      },
    });
  }

  await logAdminAction(
    adminUser,
    "CARD_LINKED",
    { cardUid, patientId: patient.id, patientNumber: patient.patientNumber },
    context
  );

  return card;
}

export async function updateCardStatus(cardUid, status, adminUser, context = {}) {
  const card = await prisma.patientCard.update({
    where: { cardUid },
    data: { status },
  });

  await logAdminAction(
    adminUser,
    "CARD_STATUS_UPDATED",
    { cardUid, newStatus: status },
    context
  );

  return card;
}

export async function getPlans() {
  const [basicCount, premiumCount] = await Promise.all([
    prisma.patientSubscription.count({
      where: {
        plan: { in: ["BASIC", "Basic", "STANDARD", "Standard"] },
        status: "ACTIVE",
      },
    }),
    prisma.patientSubscription.count({
      where: {
        plan: { in: ["PREMIUM", "Premium", "Premium Vault"] },
        status: "ACTIVE",
      },
    }),
  ]);

  return {
    plans: [
      {
        id: "BASIC",
        name: "Basic",
        priceRwf: 1000,
        billingCycle: "monthly",
        description: "Essential personal health vault for individuals.",
        activeSubscribers: basicCount,
        features: [
          "Secure personal medical records",
          "Digital prescriptions and lab results",
          "Appointment scheduling",
          "Emergency summary access",
        ],
      },
      {
        id: "PREMIUM",
        name: "Premium",
        priceRwf: 5000,
        billingCycle: "monthly",
        description: "Complete vault with family profiles and connected NFC card.",
        activeSubscribers: premiumCount,
        features: [
          "All Basic plan features",
          "Connected MedCard NFC physical card",
          "Family and dependent profiles",
          "Priority clinic booking support",
          "Direct consultation notes history",
        ],
      },
    ],
  };
}

export async function getFinanceOverview() {
  const payments = await prisma.patientVaultPayment.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      amount: true,
      currency: true,
      plan: true,
      paymentMethod: true,
      status: true,
      createdAt: true,
    },
  });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalRevenue = 0;
  let todayRevenue = 0;
  let weekRevenue = 0;
  let monthRevenue = 0;

  const byPlan = { Basic: 0, Premium: 0 };
  const byMethod = { MOBILE_MONEY: 0, CARD: 0, OTHER: 0 };

  for (const p of payments) {
    const isSuccess = ["COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(p.status);
    const amount = Number(p.amount) || 0;
    const createdAt = new Date(p.createdAt);

    if (isSuccess) {
      totalRevenue += amount;
      if (createdAt >= startOfToday) todayRevenue += amount;
      if (createdAt >= startOfWeek) weekRevenue += amount;
      if (createdAt >= startOfMonth) monthRevenue += amount;

      const planKey = (p.plan || "").toUpperCase().includes("PREM") ? "Premium" : "Basic";
      byPlan[planKey] = (byPlan[planKey] || 0) + amount;

      const methodKey = (p.paymentMethod || "").toUpperCase().includes("CARD")
        ? "CARD"
        : (p.paymentMethod || "").toUpperCase().includes("MONEY") || (p.paymentMethod || "").toUpperCase().includes("MOMO")
        ? "MOBILE_MONEY"
        : "OTHER";
      byMethod[methodKey] = (byMethod[methodKey] || 0) + amount;
    }
  }

  return {
    totals: {
      allTime: totalRevenue,
      thisMonth: monthRevenue,
      thisWeek: weekRevenue,
      today: todayRevenue,
      currency: "RWF",
    },
    byPlan,
    byMethod,
    successfulCount: payments.filter((p) => ["COMPLETED", "SUCCESS", "SUCCESSFUL"].includes(p.status)).length,
    totalAttemptCount: payments.length,
  };
}

export async function getFinanceTransactions({
  search,
  status,
  plan,
  paymentMethod,
  startDate,
  endDate,
  page = 1,
  limit = 20,
}) {
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where = {};

  if (status && status !== "ALL") {
    where.status = status;
  }

  if (plan && plan !== "ALL") {
    where.plan = { contains: plan, mode: "insensitive" };
  }

  if (paymentMethod && paymentMethod !== "ALL") {
    where.paymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      where.createdAt.lte = e;
    }
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { customerReference: { contains: s, mode: "insensitive" } },
      { gatewayReference: { contains: s, mode: "insensitive" } },
      {
        patient: {
          OR: [
            { patientNumber: { contains: s, mode: "insensitive" } },
            { firstName: { contains: s, mode: "insensitive" } },
            { lastName: { contains: s, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.patientVaultPayment.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        patient: {
          select: {
            id: true,
            patientNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.patientVaultPayment.count({ where }),
  ]);

  const sanitized = payments.map((p) => ({
    id: p.id,
    customerReference: p.customerReference,
    gatewayReference: p.gatewayReference ? `REF-${p.gatewayReference.slice(-6)}` : "—",
    plan: p.plan,
    amount: p.amount,
    currency: p.currency,
    paymentMethod: p.paymentMethod,
    maskedPhone: maskPhone(p.phone),
    status: p.status,
    patientName: p.patient ? `${p.patient.firstName} ${p.patient.lastName}` : "—",
    patientNumber: p.patient ? p.patient.patientNumber : "—",
    createdAt: p.createdAt,
  }));

  return {
    transactions: sanitized,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

export async function getFinanceTransactionDetail(id) {
  const payment = await prisma.patientVaultPayment.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Transaction not found");
  }

  return {
    id: payment.id,
    customerReference: payment.customerReference,
    gatewayReference: payment.gatewayReference || "—",
    plan: payment.plan,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod,
    maskedPhone: maskPhone(payment.phone),
    status: payment.status,
    patientName: payment.patient ? `${payment.patient.firstName} ${payment.patient.lastName}` : "—",
    patientNumber: payment.patient ? payment.patient.patientNumber : "—",
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export async function exportFinanceTransactions(query, adminUser, context = {}) {
  const { transactions } = await getFinanceTransactions({ ...query, page: 1, limit: 10000 });

  await logAdminAction(
    adminUser,
    "FINANCE_EXPORT_DOWNLOADED",
    { filterQuery: query, recordCount: transactions.length },
    context
  );

  const headers = [
    "Date",
    "Reference",
    "Gateway Ref",
    "Patient Name",
    "Patient Number",
    "Plan",
    "Amount",
    "Currency",
    "Method",
    "Phone (Masked)",
    "Status",
  ];

  const rows = transactions.map((t) => [
    new Date(t.createdAt).toISOString(),
    `"${t.customerReference}"`,
    `"${t.gatewayReference}"`,
    `"${t.patientName}"`,
    `"${t.patientNumber}"`,
    `"${t.plan}"`,
    t.amount,
    t.currency,
    `"${t.paymentMethod}"`,
    `"${t.maskedPhone}"`,
    `"${t.status}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export async function getAuditLogs({ search, action, page = 1, limit = 50 }) {
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const where = {};

  if (action && action !== "ALL") {
    where.action = action;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { email: { contains: s, mode: "insensitive" } },
      { action: { contains: s, mode: "insensitive" } },
      { ipAddress: { contains: s, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.securityAuditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.securityAuditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
}

