import { z } from 'zod';

// =============================================================================
// LEGACY TYPES (from original IRS OIC calculator)
// =============================================================================

/**
 * Case status enum matching the state machine
 */
export const CaseStatus = {
  INTAKE: 'INTAKE',
  STRATEGY: 'STRATEGY',
  DISCOVERY: 'DISCOVERY',
  HEARING: 'HEARING',
  RESOLUTION: 'RESOLUTION',
  APPEAL: 'APPEAL',
} as const;

export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

/**
 * User schema with validation
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Case schema (legacy)
 */
export const CaseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.nativeEnum(CaseStatus),
  caseNumber: z.string().optional(),
  plaintiffName: z.string().optional(),
  defendantName: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Case = z.infer<typeof CaseSchema>;

/**
 * Financial snapshot for calculations
 */
export const FinancialSnapshotSchema = z.object({
  grossMonthlyIncome: z.number().nonnegative(),
  businessIncome: z.number().nonnegative().default(0),
  otherIncome: z.number().nonnegative().default(0),
  liquidAssets: z.number().nonnegative().default(0),
  familySize: z.number().int().positive().default(1),
  state: z.string().length(2).default('NY'),
  expenses: z.array(z.object({
    category: z.string(),
    amount: z.number().nonnegative(),
    description: z.string(),
  })),
  debts: z.array(z.object({
    creditorName: z.string(),
    balance: z.number().nonnegative(),
    monthlyPayment: z.number().nonnegative(),
  })),
});

export type FinancialSnapshot = z.infer<typeof FinancialSnapshotSchema>;

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * Audit log entry
 */
export interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

// =============================================================================
// VINDICATE NYC - ACCOUNT TYPES
// =============================================================================

export type AccountStatus =
  | 'current'
  | 'late'
  | 'in-collections'
  | 'charged-off'
  | 'disputed'
  | 'payment-plan'
  | 'settled'
  | 'paid-in-full'
  | 'in-litigation'
  | 'bankrupt'
  | 'unknown';

export type AccountCategory =
  | 'credit-card'
  | 'medical'
  | 'student-loan'
  | 'auto-loan'
  | 'personal-loan'
  | 'utility'
  | 'rent'
  | 'tax'
  | 'other';

export type CreditBureau = 'equifax' | 'experian' | 'transunion';

export interface StatusChange {
  from: AccountStatus;
  to: AccountStatus;
  date: string; // ISO timestamp
  reason?: string;
}

export interface Account {
  id: string; // UUID

  // Creditor Information
  creditorName: string; // Original creditor name
  collectorName?: string; // Current collection agency (if different)
  accountNumber?: string; // Account/reference number
  creditorPhone?: string;
  creditorAddress?: string;
  creditorEmail?: string;

  // Financial Details
  originalBalance: number; // Original debt amount
  currentBalance: number; // Current amount owed
  interestRate?: number; // Annual interest rate (if known)
  minimumPayment?: number; // Minimum monthly payment

  // Status & Tracking
  status: AccountStatus;
  statusHistory: StatusChange[]; // Full status history
  dateOpened: string; // ISO date — when debt originated
  dateOfLastActivity: string; // ISO date — last creditor/collector activity
  dateAddedToApp: string; // ISO date — when user added this

  // Legal
  statuteOfLimitationsDate?: string; // ISO date — SOL expiry
  statuteOfLimitationsState?: string; // Which state's SOL applies

  // Organization
  category?: AccountCategory;
  tags?: string[];
  notes?: string;

  // Relations
  activityIds: string[]; // Linked activity IDs
  caseIds: string[]; // Linked case IDs
  documentIds: string[]; // Linked document IDs
  paymentPlanId?: string; // Active payment plan

  // Metadata
  importSource?: 'manual' | 'credit-report';
  creditBureaus?: CreditBureau[]; // Which bureaus report this

  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

// =============================================================================
// VINDICATE NYC - ACTIVITY TYPES
// =============================================================================

export type ActivityType =
  | 'phone-call'
  | 'letter-received'
  | 'letter-sent'
  | 'email-received'
  | 'email-sent'
  | 'payment-made'
  | 'payment-received'
  | 'dispute-filed'
  | 'court-filing'
  | 'settlement-offer'
  | 'credit-report-update'
  | 'note'
  | 'other';

export interface HarassmentDetails {
  timeOfCall?: string; // "Before 8am" or "After 9pm"
  threatsOfViolence?: boolean;
  obsceneLanguage?: boolean;
  repeatedCalls?: boolean;
  calledWorkplace?: boolean;
  disclosedToThirdParty?: boolean;
  falseRepresentation?: boolean;
  otherViolation?: string;
}

export interface Activity {
  id: string; // UUID
  accountId: string; // Linked account

  type: ActivityType;
  direction?: 'inbound' | 'outbound'; // For calls/letters

  date: string; // ISO timestamp

  // Content
  title: string; // Short description
  notes?: string; // Detailed notes
  templateUsed?: string; // If created from a template

  // Call-specific
  callerPhone?: string;
  callDuration?: number; // Minutes

  // Payment-specific
  amount?: number;
  paymentMethod?: string;
  confirmationNumber?: string;

  // Harassment tracking (FDCPA)
  isHarassment?: boolean;
  harassmentDetails?: HarassmentDetails;

  // Documents
  documentIds: string[];

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VINDICATE NYC - CASE TYPES
// =============================================================================

export type CaseType =
  | 'credit-bureau-dispute'
  | 'debt-validation'
  | 'fdcpa-complaint'
  | 'lawsuit-defendant'
  | 'lawsuit-plaintiff'
  | 'arbitration'
  | 'cfpb-complaint'
  | 'other';

export type VindicateCaseStatus =
  | 'draft'
  | 'filed'
  | 'under-review'
  | 'response-received'
  | 'hearing-scheduled'
  | 'in-progress'
  | 'resolved'
  | 'escalated'
  | 'closed';

export type CaseOutcome =
  | 'won'
  | 'lost'
  | 'settled'
  | 'dismissed'
  | 'withdrawn'
  | 'pending';

export interface CaseStatusChange {
  from: VindicateCaseStatus;
  to: VindicateCaseStatus;
  date: string;
  notes?: string;
}

export interface CaseReminder {
  id: string;
  caseId: string;
  title: string;
  date: string; // ISO date
  isCompleted: boolean;
  notes?: string;
}

export interface VindicateCase {
  id: string; // UUID
  accountId: string; // Linked account

  type: CaseType;
  status: VindicateCaseStatus;
  statusHistory: CaseStatusChange[];

  // Details
  title: string;
  description?: string;
  caseNumber?: string; // Court/bureau case number

  // For credit bureau disputes
  creditBureau?: CreditBureau;
  disputeReason?: string;

  // For lawsuits
  courtName?: string;
  courtAddress?: string;
  judgeName?: string;
  opposingCounsel?: string;

  // Key Dates
  dateFiled: string; // ISO date
  responseDeadline?: string; // ISO date
  hearingDate?: string; // ISO date
  resolutionDate?: string; // ISO date

  // Outcome
  outcome?: CaseOutcome;
  outcomeDetails?: string;
  settlementAmount?: number;

  // Relations
  documentIds: string[];
  activityIds: string[];

  // Reminders
  reminders: CaseReminder[];

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VINDICATE NYC - BUDGET TYPES
// =============================================================================

export interface IncomeEntry {
  id: string;
  source: string; // "Salary", "Side gig", "Benefits"
  amount: number;
  frequency: 'monthly' | 'biweekly' | 'weekly' | 'one-time';
  isRecurring: boolean;
}

export type ExpenseCategory =
  | 'housing'
  | 'utilities'
  | 'food'
  | 'transportation'
  | 'healthcare'
  | 'insurance'
  | 'debt-payments'
  | 'personal'
  | 'education'
  | 'savings'
  | 'other';

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  isFixed: boolean; // Rent vs groceries
  isRecurring: boolean;
}

export interface DebtPayment {
  accountId: string;
  allocatedAmount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface Budget {
  id: string;
  month: string; // "2026-02" format

  income: IncomeEntry[];
  expenses: ExpenseEntry[];

  // Computed (but stored for historical)
  totalIncome: number;
  totalExpenses: number;
  availableForDebt: number;

  // Debt allocation
  debtPayments: DebtPayment[];
  repaymentStrategy: 'snowball' | 'avalanche' | 'custom';

  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string; // "Emergency Fund", "Settlement Fund"
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate?: string;
  createdAt: string;
}

// =============================================================================
// VINDICATE NYC - CREDIT SCORE TYPES
// =============================================================================

export type CreditRating = 'poor' | 'fair' | 'good' | 'very-good' | 'excellent';

export type FactorImpact = 'high' | 'medium' | 'low';

export type FactorStatus = 'positive' | 'negative' | 'neutral';

export interface CreditFactor {
  name: string; // "Payment History", "Credit Utilization"
  impact: FactorImpact;
  status: FactorStatus;
  description: string;
}

export interface CreditScoreEntry {
  score: number;
  date: string;
}

export interface CreditScore {
  score: number; // 300-850
  rating: CreditRating;
  date: string; // ISO date
  source: string; // "Mock" for MVP

  factors: CreditFactor[];
  history: CreditScoreEntry[];
}

// =============================================================================
// VINDICATE NYC - NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | 'deadline-approaching'
  | 'payment-due'
  | 'credit-score-change'
  | 'account-status-change'
  | 'budget-alert'
  | 'milestone-reached'
  | 'vinny-tip'
  | 'system';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;

  type: NotificationType;
  priority: NotificationPriority;

  title: string;
  message: string;

  // Navigation
  actionUrl?: string; // Where clicking takes you
  actionLabel?: string; // "View Account", "Review Case"

  // Relations
  accountId?: string;
  caseId?: string;

  // State
  isRead: boolean;
  isDismissed: boolean;

  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

// =============================================================================
// VINDICATE NYC - USER PROFILE TYPES
// =============================================================================

export interface NotificationPreferences {
  deadlines: boolean;
  payments: boolean;
  creditScore: boolean;
  accountActivity: boolean;
  budgetAlerts: boolean;
  milestones: boolean;
  vinnyTips: boolean;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserProfile {
  id: string;

  // Personal (optional in MVP)
  firstName?: string;
  lastName?: string;
  email?: string;
  state?: string; // For SOL calculations

  // Preferences
  theme: ThemePreference;
  notificationPreferences: NotificationPreferences;

  // Onboarding
  hasCompletedOnboarding: boolean;
  onboardingStep?: number;

  // Stats (computed)
  memberSince: string;

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// VINDICATE NYC - DOCUMENT TYPES
// =============================================================================

export type DocumentType =
  | 'validation-letter'
  | 'dispute-letter'
  | 'court-document'
  | 'payment-receipt'
  | 'credit-report'
  | 'correspondence'
  | 'settlement-agreement'
  | 'bank-statement'
  | 'tax-document'
  | 'income-verification'
  | 'identity-document'
  | 'medical-bill'
  | 'other';

export type ProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'needs_review'
  | 'skipped';

export interface Document {
  id: string;

  name: string;
  type: DocumentType;
  mimeType: string;
  size: number; // bytes

  // In MVP, this is a mock URL or data URI
  url: string;
  thumbnailUrl?: string;

  // Relations
  accountId?: string;
  caseId?: string;
  activityId?: string;

  // Metadata
  uploadedAt: string;
  description?: string;
  tags?: string[];

  // AI Processing (Phase 9)
  processingStatus?: ProcessingStatus;
  extractedData?: Record<string, unknown>;
  extractionConfidence?: number;
  extractionModel?: string;
  extractionTokensUsed?: number;
  extractionCost?: number;
  autoClassifiedType?: string;
}

// =============================================================================
// VINDICATE NYC - VINNY (AI COMPANION) TYPES
// =============================================================================

export type VinnyMessageRole = 'user' | 'assistant';

export interface VinnyResourceLink {
  title: string;
  url: string;
}

export interface VinnyMessage {
  id: string;
  role: VinnyMessageRole;
  content: string;
  timestamp: string;

  // Quick replies offered after this message
  suggestedReplies?: string[];

  // If Vinny references a resource
  resourceLink?: VinnyResourceLink;
}

export interface VinnySession {
  id: string;
  messages: VinnyMessage[];
  startedAt: string;
  lastMessageAt: string;
}

export interface VinnyMockResponse {
  keywords: string[]; // Trigger keywords
  category: string; // "rights", "credit", "dispute", "encouragement"
  response: string;
  suggestedReplies?: string[];
  resourceLink?: VinnyResourceLink;
}

// =============================================================================
// VINDICATE NYC - RESOURCE CENTER TYPES
// =============================================================================

export type ResourceType = 'rights-summary' | 'template-letter' | 'article' | 'glossary-term' | 'external-link';

export interface Resource {
  id: string;
  slug: string;
  type: ResourceType;
  title: string;
  description: string;
  content: string; // Markdown content
  category: string; // "rights", "templates", "articles", "glossary"
  tags: string[];
  relatedResourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  relatedTerms: string[];
}

export interface TempleLetter {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // Template with placeholders like {{creditor_name}}
  category: 'validation' | 'dispute' | 'cease-desist' | 'negotiation' | 'goodwill';
  placeholders: string[]; // List of placeholders in the template
}
