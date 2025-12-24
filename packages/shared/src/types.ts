import { z } from 'zod';

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
 * Case schema
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
