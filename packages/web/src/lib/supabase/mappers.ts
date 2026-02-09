/**
 * Mappers to convert between DB snake_case rows and TypeScript camelCase types.
 * Each entity has a `fromRow` function (DB → TS) and a `toRow` function (TS → DB).
 */

import type {
  Account,
  Activity,
  VindicateCase,
  CaseReminder,
  Budget,
  IncomeEntry,
  ExpenseEntry,
  SavingsGoal,
  CreditScore,
  Notification,
  Document,
  ProcessingStatus,
  StatusChange,
  CaseStatusChange,
  HarassmentDetails,
  CreditFactor,
  CreditScoreEntry,
  DebtPayment,
} from "@vindicate/shared";

// =============================================================================
// Generic helpers
// =============================================================================

function toISOString(val: string | null | undefined): string {
  if (!val) return new Date().toISOString();
  return new Date(val).toISOString();
}

function toDateString(val: string | null | undefined): string {
  if (!val) return new Date().toISOString().split("T")[0];
  // If already a date string (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  return new Date(val).toISOString().split("T")[0];
}

function toNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

// =============================================================================
// Account mappers
// =============================================================================

export function accountFromRow(row: DbRow): Account {
  return {
    id: row.id,
    creditorName: row.creditor_name,
    collectorName: row.collector_name ?? undefined,
    accountNumber: row.account_number ?? undefined,
    creditorPhone: row.creditor_phone ?? undefined,
    creditorAddress: row.creditor_address ?? undefined,
    creditorEmail: row.creditor_email ?? undefined,
    originalBalance: toNumber(row.original_balance),
    currentBalance: toNumber(row.current_balance),
    interestRate: row.interest_rate != null ? toNumber(row.interest_rate) : undefined,
    minimumPayment: row.minimum_payment != null ? toNumber(row.minimum_payment) : undefined,
    status: row.status,
    statusHistory: (row.status_history ?? []) as StatusChange[],
    dateOpened: toDateString(row.date_opened),
    dateOfLastActivity: toDateString(row.date_of_last_activity),
    dateAddedToApp: toDateString(row.date_added_to_app),
    statuteOfLimitationsDate: row.statute_of_limitations_date
      ? toDateString(row.statute_of_limitations_date)
      : undefined,
    statuteOfLimitationsState: row.statute_of_limitations_state ?? undefined,
    category: row.category ?? undefined,
    tags: row.tags ?? [],
    notes: row.notes ?? undefined,
    activityIds: row.activity_ids ?? [],
    caseIds: row.case_ids ?? [],
    documentIds: row.document_ids ?? [],
    paymentPlanId: row.payment_plan_id ?? undefined,
    importSource: row.import_source ?? undefined,
    creditBureaus: row.credit_bureaus ?? [],
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

export function accountToRow(account: Partial<Account>): DbRow {
  const row: DbRow = {};
  if (account.creditorName !== undefined) row.creditor_name = account.creditorName;
  if (account.collectorName !== undefined) row.collector_name = account.collectorName || null;
  if (account.accountNumber !== undefined) row.account_number = account.accountNumber || null;
  if (account.creditorPhone !== undefined) row.creditor_phone = account.creditorPhone || null;
  if (account.creditorAddress !== undefined) row.creditor_address = account.creditorAddress || null;
  if (account.creditorEmail !== undefined) row.creditor_email = account.creditorEmail || null;
  if (account.originalBalance !== undefined) row.original_balance = account.originalBalance;
  if (account.currentBalance !== undefined) row.current_balance = account.currentBalance;
  if (account.interestRate !== undefined) row.interest_rate = account.interestRate ?? null;
  if (account.minimumPayment !== undefined) row.minimum_payment = account.minimumPayment ?? null;
  if (account.status !== undefined) row.status = account.status;
  if (account.statusHistory !== undefined) row.status_history = account.statusHistory;
  if (account.dateOpened !== undefined) row.date_opened = account.dateOpened;
  if (account.dateOfLastActivity !== undefined) row.date_of_last_activity = account.dateOfLastActivity;
  if (account.dateAddedToApp !== undefined) row.date_added_to_app = account.dateAddedToApp;
  if (account.statuteOfLimitationsDate !== undefined) row.statute_of_limitations_date = account.statuteOfLimitationsDate ?? null;
  if (account.statuteOfLimitationsState !== undefined) row.statute_of_limitations_state = account.statuteOfLimitationsState ?? null;
  if (account.category !== undefined) row.category = account.category ?? null;
  if (account.tags !== undefined) row.tags = account.tags;
  if (account.notes !== undefined) row.notes = account.notes ?? null;
  if (account.activityIds !== undefined) row.activity_ids = account.activityIds;
  if (account.caseIds !== undefined) row.case_ids = account.caseIds;
  if (account.documentIds !== undefined) row.document_ids = account.documentIds;
  if (account.paymentPlanId !== undefined) row.payment_plan_id = account.paymentPlanId ?? null;
  if (account.importSource !== undefined) row.import_source = account.importSource ?? null;
  if (account.creditBureaus !== undefined) row.credit_bureaus = account.creditBureaus;
  return row;
}

// =============================================================================
// Activity mappers
// =============================================================================

export function activityFromRow(row: DbRow): Activity {
  return {
    id: row.id,
    accountId: row.account_id ?? "",
    type: row.type,
    direction: row.direction ?? undefined,
    date: toISOString(row.date),
    title: row.title,
    notes: row.notes ?? undefined,
    templateUsed: row.template_used ?? undefined,
    callerPhone: row.caller_phone ?? undefined,
    callDuration: row.call_duration != null ? row.call_duration : undefined,
    amount: row.amount != null ? toNumber(row.amount) : undefined,
    paymentMethod: row.payment_method ?? undefined,
    confirmationNumber: row.confirmation_number ?? undefined,
    isHarassment: row.is_harassment ?? false,
    harassmentDetails: (row.harassment_details as HarassmentDetails) ?? undefined,
    documentIds: row.document_ids ?? [],
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

export function activityToRow(activity: Partial<Activity>): DbRow {
  const row: DbRow = {};
  if (activity.accountId !== undefined) row.account_id = activity.accountId || null;
  if (activity.type !== undefined) row.type = activity.type;
  if (activity.direction !== undefined) row.direction = activity.direction ?? null;
  if (activity.date !== undefined) row.date = activity.date;
  if (activity.title !== undefined) row.title = activity.title;
  if (activity.notes !== undefined) row.notes = activity.notes ?? null;
  if (activity.templateUsed !== undefined) row.template_used = activity.templateUsed ?? null;
  if (activity.callerPhone !== undefined) row.caller_phone = activity.callerPhone ?? null;
  if (activity.callDuration !== undefined) row.call_duration = activity.callDuration ?? null;
  if (activity.amount !== undefined) row.amount = activity.amount ?? null;
  if (activity.paymentMethod !== undefined) row.payment_method = activity.paymentMethod ?? null;
  if (activity.confirmationNumber !== undefined) row.confirmation_number = activity.confirmationNumber ?? null;
  if (activity.isHarassment !== undefined) row.is_harassment = activity.isHarassment;
  if (activity.harassmentDetails !== undefined) row.harassment_details = activity.harassmentDetails ?? null;
  if (activity.documentIds !== undefined) row.document_ids = activity.documentIds;
  return row;
}

// =============================================================================
// Case mappers
// =============================================================================

export function caseFromRow(row: DbRow): VindicateCase {
  return {
    id: row.id,
    accountId: row.account_id ?? "",
    type: row.type,
    status: row.status,
    statusHistory: (row.status_history ?? []) as CaseStatusChange[],
    title: row.title,
    description: row.description ?? undefined,
    caseNumber: row.case_number ?? undefined,
    creditBureau: row.credit_bureau ?? undefined,
    disputeReason: row.dispute_reason ?? undefined,
    courtName: row.court_name ?? undefined,
    courtAddress: row.court_address ?? undefined,
    judgeName: row.judge_name ?? undefined,
    opposingCounsel: row.opposing_counsel ?? undefined,
    dateFiled: toDateString(row.date_filed),
    responseDeadline: row.response_deadline ? toDateString(row.response_deadline) : undefined,
    hearingDate: row.hearing_date ? toDateString(row.hearing_date) : undefined,
    resolutionDate: row.resolution_date ? toDateString(row.resolution_date) : undefined,
    outcome: row.outcome ?? undefined,
    outcomeDetails: row.outcome_details ?? undefined,
    settlementAmount: row.settlement_amount != null ? toNumber(row.settlement_amount) : undefined,
    documentIds: row.document_ids ?? [],
    activityIds: row.activity_ids ?? [],
    reminders: ((row.reminders ?? []) as DbRow[]).map(reminderFromRow),
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

function reminderFromRow(row: DbRow): CaseReminder {
  return {
    id: row.id,
    caseId: row.caseId ?? row.case_id ?? "",
    title: row.title,
    date: row.date,
    isCompleted: row.isCompleted ?? row.is_completed ?? false,
    notes: row.notes ?? undefined,
  };
}

export function caseToRow(c: Partial<VindicateCase>): DbRow {
  const row: DbRow = {};
  if (c.accountId !== undefined) row.account_id = c.accountId || null;
  if (c.type !== undefined) row.type = c.type;
  if (c.status !== undefined) row.status = c.status;
  if (c.statusHistory !== undefined) row.status_history = c.statusHistory;
  if (c.title !== undefined) row.title = c.title;
  if (c.description !== undefined) row.description = c.description ?? null;
  if (c.caseNumber !== undefined) row.case_number = c.caseNumber ?? null;
  if (c.creditBureau !== undefined) row.credit_bureau = c.creditBureau ?? null;
  if (c.disputeReason !== undefined) row.dispute_reason = c.disputeReason ?? null;
  if (c.courtName !== undefined) row.court_name = c.courtName ?? null;
  if (c.courtAddress !== undefined) row.court_address = c.courtAddress ?? null;
  if (c.judgeName !== undefined) row.judge_name = c.judgeName ?? null;
  if (c.opposingCounsel !== undefined) row.opposing_counsel = c.opposingCounsel ?? null;
  if (c.dateFiled !== undefined) row.date_filed = c.dateFiled;
  if (c.responseDeadline !== undefined) row.response_deadline = c.responseDeadline ?? null;
  if (c.hearingDate !== undefined) row.hearing_date = c.hearingDate ?? null;
  if (c.resolutionDate !== undefined) row.resolution_date = c.resolutionDate ?? null;
  if (c.outcome !== undefined) row.outcome = c.outcome ?? null;
  if (c.outcomeDetails !== undefined) row.outcome_details = c.outcomeDetails ?? null;
  if (c.settlementAmount !== undefined) row.settlement_amount = c.settlementAmount ?? null;
  if (c.documentIds !== undefined) row.document_ids = c.documentIds;
  if (c.activityIds !== undefined) row.activity_ids = c.activityIds;
  if (c.reminders !== undefined) row.reminders = c.reminders;
  return row;
}

// =============================================================================
// Budget mappers
// =============================================================================

export function budgetFromRow(
  row: DbRow,
  incomeRows: DbRow[],
  expenseRows: DbRow[]
): Budget {
  return {
    id: row.id,
    month: row.month,
    income: incomeRows.map(incomeFromRow),
    expenses: expenseRows.map(expenseFromRow),
    totalIncome: toNumber(row.total_income),
    totalExpenses: toNumber(row.total_expenses),
    availableForDebt: toNumber(row.available_for_debt),
    debtPayments: (row.debt_payments ?? []) as DebtPayment[],
    repaymentStrategy: row.repayment_strategy ?? "snowball",
    createdAt: toISOString(row.created_at),
    updatedAt: toISOString(row.updated_at),
  };
}

export function incomeFromRow(row: DbRow): IncomeEntry {
  return {
    id: row.id,
    source: row.source,
    amount: toNumber(row.amount),
    frequency: row.frequency ?? "monthly",
    isRecurring: row.is_recurring ?? true,
  };
}

export function expenseFromRow(row: DbRow): ExpenseEntry {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    amount: toNumber(row.amount),
    isFixed: row.is_fixed ?? false,
    isRecurring: row.is_recurring ?? true,
  };
}

export function savingsGoalFromRow(row: DbRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: toNumber(row.target_amount),
    currentAmount: toNumber(row.current_amount),
    monthlyContribution: toNumber(row.monthly_contribution),
    targetDate: row.target_date ? toDateString(row.target_date) : undefined,
    createdAt: toISOString(row.created_at),
  };
}

// =============================================================================
// Credit Score mappers
// =============================================================================

export function creditScoreFromRow(row: DbRow): CreditScore {
  return {
    score: row.score,
    rating: row.rating,
    date: toDateString(row.date),
    source: row.source ?? "Mock",
    factors: (row.factors ?? []) as CreditFactor[],
    history: (row.history ?? []) as CreditScoreEntry[],
  };
}

// =============================================================================
// Notification mappers
// =============================================================================

export function notificationFromRow(row: DbRow): Notification {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    title: row.title,
    message: row.message,
    actionUrl: row.action_url ?? undefined,
    actionLabel: row.action_label ?? undefined,
    accountId: row.account_id ?? undefined,
    caseId: row.case_id ?? undefined,
    isRead: row.is_read ?? false,
    isDismissed: row.is_dismissed ?? false,
    createdAt: toISOString(row.created_at),
    readAt: row.read_at ? toISOString(row.read_at) : undefined,
    expiresAt: row.expires_at ? toISOString(row.expires_at) : undefined,
  };
}

export function notificationToRow(n: Partial<Notification>): DbRow {
  const row: DbRow = {};
  if (n.type !== undefined) row.type = n.type;
  if (n.priority !== undefined) row.priority = n.priority;
  if (n.title !== undefined) row.title = n.title;
  if (n.message !== undefined) row.message = n.message;
  if (n.actionUrl !== undefined) row.action_url = n.actionUrl ?? null;
  if (n.actionLabel !== undefined) row.action_label = n.actionLabel ?? null;
  if (n.accountId !== undefined) row.account_id = n.accountId ?? null;
  if (n.caseId !== undefined) row.case_id = n.caseId ?? null;
  if (n.isRead !== undefined) row.is_read = n.isRead;
  if (n.isDismissed !== undefined) row.is_dismissed = n.isDismissed;
  if (n.readAt !== undefined) row.read_at = n.readAt ?? null;
  return row;
}

// =============================================================================
// Document mappers
// =============================================================================

export function documentFromRow(row: DbRow): Document {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    mimeType: row.mime_type ?? "application/octet-stream",
    size: row.size ?? 0,
    url: row.url ?? "#",
    thumbnailUrl: row.thumbnail_url ?? undefined,
    accountId: row.account_id ?? undefined,
    caseId: row.case_id ?? undefined,
    activityId: row.activity_id ?? undefined,
    uploadedAt: toISOString(row.uploaded_at ?? row.created_at),
    description: row.description ?? undefined,
    tags: row.tags ?? [],
    // AI Processing fields
    processingStatus: (row.processing_status as ProcessingStatus) ?? undefined,
    extractedData: row.extracted_data ?? undefined,
    extractionConfidence: row.extraction_confidence != null ? row.extraction_confidence : undefined,
    extractionModel: row.extraction_model ?? undefined,
    extractionTokensUsed: row.extraction_tokens_used != null ? row.extraction_tokens_used : undefined,
    extractionCost: row.extraction_cost != null ? row.extraction_cost : undefined,
    autoClassifiedType: row.auto_classified_type ?? undefined,
  };
}

export function documentToRow(doc: Partial<Document>): DbRow {
  const row: DbRow = {};
  if (doc.name !== undefined) row.name = doc.name;
  if (doc.type !== undefined) row.type = doc.type;
  if (doc.mimeType !== undefined) row.mime_type = doc.mimeType;
  if (doc.size !== undefined) row.size = doc.size;
  if (doc.url !== undefined) row.url = doc.url;
  if (doc.thumbnailUrl !== undefined) row.thumbnail_url = doc.thumbnailUrl ?? null;
  if (doc.accountId !== undefined) row.account_id = doc.accountId ?? null;
  if (doc.caseId !== undefined) row.case_id = doc.caseId ?? null;
  if (doc.activityId !== undefined) row.activity_id = doc.activityId ?? null;
  if (doc.description !== undefined) row.description = doc.description ?? null;
  if (doc.tags !== undefined) row.tags = doc.tags;
  if (doc.processingStatus !== undefined) row.processing_status = doc.processingStatus;
  if (doc.extractedData !== undefined) row.extracted_data = doc.extractedData ?? null;
  if (doc.extractionConfidence !== undefined) row.extraction_confidence = doc.extractionConfidence ?? null;
  if (doc.extractionModel !== undefined) row.extraction_model = doc.extractionModel ?? null;
  if (doc.extractionTokensUsed !== undefined) row.extraction_tokens_used = doc.extractionTokensUsed ?? null;
  if (doc.extractionCost !== undefined) row.extraction_cost = doc.extractionCost ?? null;
  if (doc.autoClassifiedType !== undefined) row.auto_classified_type = doc.autoClassifiedType ?? null;
  return row;
}
