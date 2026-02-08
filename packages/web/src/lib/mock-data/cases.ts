/**
 * Mock case data for Maria's disputes
 * 2-3 active cases (credit bureau dispute, debt validation)
 */

import type { VindicateCase } from '@vindicate/shared';
import { ACCOUNT_IDS } from './accounts';

export const mockCases: VindicateCase[] = [
  // Case 1: Credit Bureau Dispute - Synchrony/Amazon card
  {
    id: 'case-001',
    accountId: ACCOUNT_IDS.synchrony,
    type: 'credit-bureau-dispute',
    status: 'under-review',
    statusHistory: [
      {
        from: 'draft',
        to: 'filed',
        date: '2026-01-20T15:30:00Z',
        notes: 'Dispute submitted online to Equifax',
      },
      {
        from: 'filed',
        to: 'under-review',
        date: '2026-01-22T00:00:00Z',
        notes: 'Equifax confirmed receipt and investigation started',
      },
    ],
    title: 'Equifax Dispute - Synchrony Incorrect Balance',
    description: 'Disputing the reported balance. Portfolio Recovery Associates added $550 in fees that were never disclosed. Original balance was $2,340 but they report $2,890.',
    caseNumber: 'EQ-2026-7845321',
    creditBureau: 'equifax',
    disputeReason: 'Incorrect balance - unauthorized fees added',
    dateFiled: '2026-01-20',
    responseDeadline: '2026-02-19',
    documentIds: [],
    activityIds: ['act-005', 'act-017'],
    reminders: [
      {
        id: 'rem-001',
        caseId: 'case-001',
        title: 'Check for Equifax response',
        date: '2026-02-10',
        isCompleted: false,
        notes: 'They have 30 days to investigate. Follow up if no response.',
      },
      {
        id: 'rem-002',
        caseId: 'case-001',
        title: 'Response deadline',
        date: '2026-02-19',
        isCompleted: false,
        notes: 'Final deadline for Equifax to respond to dispute.',
      },
    ],
    createdAt: '2026-01-20T15:00:00Z',
    updatedAt: '2026-01-22T10:00:00Z',
  },

  // Case 2: Debt Validation - NYU Medical / IC System
  {
    id: 'case-002',
    accountId: ACCOUNT_IDS.nyuMedical,
    type: 'debt-validation',
    status: 'response-received',
    statusHistory: [
      {
        from: 'draft',
        to: 'filed',
        date: '2026-01-20T10:15:00Z',
        notes: 'Debt validation letter sent certified mail',
      },
      {
        from: 'filed',
        to: 'under-review',
        date: '2026-01-25T00:00:00Z',
        notes: 'Letter delivered per USPS tracking',
      },
      {
        from: 'under-review',
        to: 'response-received',
        date: '2026-02-03T18:30:00Z',
        notes: 'IC System sent validation documents',
      },
    ],
    title: 'Debt Validation - IC System / NYU Langone',
    description: 'Requested validation of $8,750 medical debt. Want to verify: 1) Original creditor agreement, 2) Complete payment history, 3) How current balance was calculated, 4) Their legal authority to collect.',
    dateFiled: '2026-01-20',
    responseDeadline: '2026-02-19',
    documentIds: [],
    activityIds: ['act-002', 'act-019'],
    reminders: [
      {
        id: 'rem-003',
        caseId: 'case-002',
        title: 'Review validation documents',
        date: '2026-02-08',
        isCompleted: false,
        notes: 'Compare documents to original hospital bills. Look for discrepancies.',
      },
      {
        id: 'rem-004',
        caseId: 'case-002',
        title: 'Decide next steps',
        date: '2026-02-15',
        isCompleted: false,
        notes: 'If validation incomplete, file credit bureau dispute. If valid, consider negotiation.',
      },
    ],
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-02-03T18:45:00Z',
  },

  // Case 3: Potential FDCPA Complaint - Midland Credit (Draft)
  {
    id: 'case-003',
    accountId: ACCOUNT_IDS.discoveryPersonal,
    type: 'fdcpa-complaint',
    status: 'draft',
    statusHistory: [],
    title: 'FDCPA Complaint - Midland Credit Management',
    description: 'Documenting multiple FDCPA violations: 1) Calls before 8am (documented 3 times), 2) Call after 9pm (documented once). Considering filing CFPB complaint and/or lawsuit.',
    dateFiled: '2026-02-06', // Date started drafting
    documentIds: [],
    activityIds: ['act-007', 'act-008', 'act-012', 'act-013'],
    reminders: [
      {
        id: 'rem-005',
        caseId: 'case-003',
        title: 'Gather all harassment documentation',
        date: '2026-02-10',
        isCompleted: false,
        notes: 'Compile call logs, times, and notes for each violation.',
      },
      {
        id: 'rem-006',
        caseId: 'case-003',
        title: 'Research FDCPA lawsuit options',
        date: '2026-02-15',
        isCompleted: false,
        notes: 'Can recover $1,000 statutory damages plus actual damages. Consider finding FDCPA attorney.',
      },
    ],
    createdAt: '2026-02-06T10:00:00Z',
    updatedAt: '2026-02-06T10:00:00Z',
  },
];

// Helper functions
export function getCasesForAccount(accountId: string): VindicateCase[] {
  return mockCases.filter(c => c.accountId === accountId);
}

export function getActiveCases(): VindicateCase[] {
  return mockCases.filter(c => !['resolved', 'closed'].includes(c.status));
}

export function getCasesWithUpcomingDeadlines(daysAhead: number = 14): VindicateCase[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + daysAhead);

  return mockCases.filter(c => {
    if (!c.responseDeadline) return false;
    const deadline = new Date(c.responseDeadline);
    return deadline <= cutoff && deadline >= new Date();
  });
}

export function getUpcomingReminders(): Array<{ reminder: VindicateCase['reminders'][0]; case: VindicateCase }> {
  const allReminders: Array<{ reminder: VindicateCase['reminders'][0]; case: VindicateCase }> = [];

  for (const caseItem of mockCases) {
    for (const reminder of caseItem.reminders) {
      if (!reminder.isCompleted) {
        allReminders.push({ reminder, case: caseItem });
      }
    }
  }

  return allReminders.sort((a, b) =>
    new Date(a.reminder.date).getTime() - new Date(b.reminder.date).getTime()
  );
}
