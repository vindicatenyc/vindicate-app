/**
 * Mock activity data for Maria's accounts
 * 15-20 activities across accounts (calls, letters, payments, disputes)
 */

import type { Activity } from '@vindicate/shared';
import { ACCOUNT_IDS } from './accounts';

export const mockActivities: Activity[] = [
  // Activity 1 & 2: NYU Medical collection calls
  {
    id: 'act-001',
    accountId: ACCOUNT_IDS.nyuMedical,
    type: 'phone-call',
    direction: 'inbound',
    date: '2026-01-28T14:30:00Z',
    title: 'Collection call from IC System',
    notes: 'Collector called asking for full payment. Explained financial situation. They offered to set up a payment plan but the minimum was too high.',
    callerPhone: '888-524-0010',
    callDuration: 12,
    isHarassment: false,
    documentIds: [],
    createdAt: '2026-01-28T14:45:00Z',
    updatedAt: '2026-01-28T14:45:00Z',
  },
  {
    id: 'act-002',
    accountId: ACCOUNT_IDS.nyuMedical,
    type: 'letter-sent',
    direction: 'outbound',
    date: '2026-01-20T10:00:00Z',
    title: 'Debt validation letter sent',
    notes: 'Sent certified mail requesting debt validation per FDCPA. Used template from resource center.',
    templateUsed: 'debt-validation-request',
    documentIds: [],
    createdAt: '2026-01-20T10:15:00Z',
    updatedAt: '2026-01-20T10:15:00Z',
  },

  // Activity 3 & 4: Capital One payment plan
  {
    id: 'act-003',
    accountId: ACCOUNT_IDS.capitalOne,
    type: 'payment-made',
    direction: 'outbound',
    date: '2026-02-01T09:00:00Z',
    title: 'Monthly payment - February',
    notes: 'Payment plan installment #4 of 18',
    amount: 175,
    paymentMethod: 'Bank transfer',
    confirmationNumber: 'CAP-2026-FEB-7821',
    documentIds: [],
    createdAt: '2026-02-01T09:05:00Z',
    updatedAt: '2026-02-01T09:05:00Z',
  },
  {
    id: 'act-004',
    accountId: ACCOUNT_IDS.capitalOne,
    type: 'phone-call',
    direction: 'outbound',
    date: '2025-10-15T11:00:00Z',
    title: 'Negotiated hardship payment plan',
    notes: 'Called to explain financial hardship. Representative was understanding. Agreed to 0% interest, $175/month for 18 months.',
    callDuration: 35,
    documentIds: [],
    createdAt: '2025-10-15T12:00:00Z',
    updatedAt: '2025-10-15T12:00:00Z',
  },

  // Activity 5: Synchrony dispute filed
  {
    id: 'act-005',
    accountId: ACCOUNT_IDS.synchrony,
    type: 'dispute-filed',
    direction: 'outbound',
    date: '2026-01-20T15:00:00Z',
    title: 'Dispute filed with Equifax',
    notes: 'Filed dispute citing incorrect balance. Original balance was $2,340 but they added $550 in fees that were not disclosed.',
    templateUsed: 'credit-bureau-dispute',
    documentIds: [],
    createdAt: '2026-01-20T15:30:00Z',
    updatedAt: '2026-01-20T15:30:00Z',
  },

  // Activity 6: Con Edison settlement
  {
    id: 'act-006',
    accountId: ACCOUNT_IDS.conEdison,
    type: 'payment-made',
    direction: 'outbound',
    date: '2025-12-20T11:00:00Z',
    title: 'Settlement payment - Account closed',
    notes: 'Paid $534 to settle $890 balance (60%). First debt settled! Got confirmation in writing.',
    amount: 534,
    paymentMethod: 'Debit card',
    confirmationNumber: 'CE-SETTLE-2025-1220',
    documentIds: [],
    createdAt: '2025-12-20T11:30:00Z',
    updatedAt: '2025-12-20T11:30:00Z',
  },

  // Activities 7, 8, 12, 13: Discover/Midland harassment
  {
    id: 'act-007',
    accountId: ACCOUNT_IDS.discoveryPersonal,
    type: 'phone-call',
    direction: 'inbound',
    date: '2026-02-05T07:45:00Z',
    title: 'Harassment call - Before 8am',
    notes: 'Midland Credit called at 7:45 AM. This is the third call this week before 8am. Documenting for FDCPA violation.',
    callerPhone: '877-653-2428',
    callDuration: 2,
    isHarassment: true,
    harassmentDetails: {
      timeOfCall: 'Before 8am',
      repeatedCalls: true,
    },
    documentIds: [],
    createdAt: '2026-02-05T08:00:00Z',
    updatedAt: '2026-02-05T08:00:00Z',
  },
  {
    id: 'act-008',
    accountId: ACCOUNT_IDS.discoveryPersonal,
    type: 'phone-call',
    direction: 'inbound',
    date: '2026-02-03T07:30:00Z',
    title: 'Harassment call - Before 8am',
    notes: 'Second early morning call this week.',
    callerPhone: '877-653-2428',
    callDuration: 1,
    isHarassment: true,
    harassmentDetails: {
      timeOfCall: 'Before 8am',
      repeatedCalls: true,
    },
    documentIds: [],
    createdAt: '2026-02-03T07:45:00Z',
    updatedAt: '2026-02-03T07:45:00Z',
  },
  {
    id: 'act-012',
    accountId: ACCOUNT_IDS.discoveryPersonal,
    type: 'phone-call',
    direction: 'inbound',
    date: '2026-01-30T21:15:00Z',
    title: 'Harassment call - After 9pm',
    notes: 'Called after 9pm. When I said I was going to report them, they hung up.',
    callerPhone: '877-653-2428',
    callDuration: 3,
    isHarassment: true,
    harassmentDetails: {
      timeOfCall: 'After 9pm',
    },
    documentIds: [],
    createdAt: '2026-01-30T21:30:00Z',
    updatedAt: '2026-01-30T21:30:00Z',
  },
  {
    id: 'act-013',
    accountId: ACCOUNT_IDS.discoveryPersonal,
    type: 'letter-sent',
    direction: 'outbound',
    date: '2026-02-06T09:00:00Z',
    title: 'Cease and desist letter sent',
    notes: 'Sent cease and desist letter via certified mail due to repeated FDCPA violations.',
    templateUsed: 'cease-and-desist',
    documentIds: [],
    createdAt: '2026-02-06T09:15:00Z',
    updatedAt: '2026-02-06T09:15:00Z',
  },

  // Activity 9: NYU Medical - Letter received
  {
    id: 'act-009',
    accountId: ACCOUNT_IDS.nyuMedical,
    type: 'letter-received',
    direction: 'inbound',
    date: '2026-01-25T00:00:00Z',
    title: 'Collection notice received',
    notes: 'Received initial collection notice from IC System. They claim I have 30 days to dispute.',
    documentIds: [],
    createdAt: '2026-01-25T18:00:00Z',
    updatedAt: '2026-01-25T18:00:00Z',
  },

  // Activity 10: Capital One - Previous payment
  {
    id: 'act-010',
    accountId: ACCOUNT_IDS.capitalOne,
    type: 'payment-made',
    direction: 'outbound',
    date: '2026-01-01T09:00:00Z',
    title: 'Monthly payment - January',
    notes: 'Payment plan installment #3 of 18',
    amount: 175,
    paymentMethod: 'Bank transfer',
    confirmationNumber: 'CAP-2026-JAN-4521',
    documentIds: [],
    createdAt: '2026-01-01T09:05:00Z',
    updatedAt: '2026-01-01T09:05:00Z',
  },

  // Activity 11: Synchrony - Collection letter
  {
    id: 'act-011',
    accountId: ACCOUNT_IDS.synchrony,
    type: 'letter-received',
    direction: 'inbound',
    date: '2026-01-10T00:00:00Z',
    title: 'Collection letter from Portfolio Recovery',
    notes: 'First contact from PRA. Balance seems inflated with fees. Will dispute.',
    documentIds: [],
    createdAt: '2026-01-10T19:00:00Z',
    updatedAt: '2026-01-10T19:00:00Z',
  },

  // Activity 14: Mt. Sinai - Phone call with billing
  {
    id: 'act-014',
    accountId: ACCOUNT_IDS.mtSinaiMedical,
    type: 'phone-call',
    direction: 'outbound',
    date: '2026-01-28T14:00:00Z',
    title: 'Called billing department',
    notes: 'Called to check on insurance claim status. They said it takes 4-6 weeks to process. Will call back in February.',
    callDuration: 18,
    documentIds: [],
    createdAt: '2026-01-28T14:30:00Z',
    updatedAt: '2026-01-28T14:30:00Z',
  },

  // Activity 15: Macy's - Collection letter
  {
    id: 'act-015',
    accountId: ACCOUNT_IDS.macys,
    type: 'letter-received',
    direction: 'inbound',
    date: '2025-11-10T00:00:00Z',
    title: 'Charge-off notice received',
    notes: 'Received notice that account has been charged off. Low priority - focusing on other debts first.',
    documentIds: [],
    createdAt: '2025-11-10T18:00:00Z',
    updatedAt: '2025-11-10T18:00:00Z',
  },

  // Additional activities for variety
  {
    id: 'act-016',
    accountId: ACCOUNT_IDS.capitalOne,
    type: 'note',
    date: '2025-11-01T10:00:00Z',
    title: 'Payment plan confirmation received',
    notes: 'Got written confirmation of the payment plan terms. Keep this for records.',
    documentIds: [],
    createdAt: '2025-11-01T10:30:00Z',
    updatedAt: '2025-11-01T10:30:00Z',
  },
  {
    id: 'act-017',
    accountId: ACCOUNT_IDS.synchrony,
    type: 'credit-report-update',
    date: '2026-01-22T00:00:00Z',
    title: 'Dispute marked on credit report',
    notes: 'Checked Equifax - account now shows "consumer disputes" status. Good sign.',
    documentIds: [],
    createdAt: '2026-01-22T20:00:00Z',
    updatedAt: '2026-01-22T20:00:00Z',
  },
  {
    id: 'act-018',
    accountId: ACCOUNT_IDS.conEdison,
    type: 'settlement-offer',
    direction: 'inbound',
    date: '2025-12-15T00:00:00Z',
    title: 'Settlement offer received',
    notes: 'ConEd offered to settle for 60% ($534). Decided to take it.',
    amount: 534,
    documentIds: [],
    createdAt: '2025-12-15T19:00:00Z',
    updatedAt: '2025-12-15T19:00:00Z',
  },
  {
    id: 'act-019',
    accountId: ACCOUNT_IDS.nyuMedical,
    type: 'letter-received',
    direction: 'inbound',
    date: '2026-02-03T00:00:00Z',
    title: 'Debt validation response received',
    notes: 'IC System sent validation documents. Reviewing to verify accuracy.',
    documentIds: [],
    createdAt: '2026-02-03T18:30:00Z',
    updatedAt: '2026-02-03T18:30:00Z',
  },
];

// Get activities for a specific account
export function getActivitiesForAccount(accountId: string): Activity[] {
  return mockActivities.filter(activity => activity.accountId === accountId);
}

// Get recent activities
export function getRecentActivities(limit: number = 10): Activity[] {
  return [...mockActivities]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

// Get harassment incidents
export function getHarassmentIncidents(): Activity[] {
  return mockActivities.filter(activity => activity.isHarassment);
}
