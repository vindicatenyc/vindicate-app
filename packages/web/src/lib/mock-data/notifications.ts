/**
 * Mock notification data for Maria
 * 8-10 notifications of various types
 */

import type { Notification } from '@vindicate/shared';
import { ACCOUNT_IDS } from './accounts';

export const mockNotifications: Notification[] = [
  // High priority - Deadline approaching
  {
    id: 'notif-001',
    type: 'deadline-approaching',
    priority: 'high',
    title: 'Equifax dispute deadline in 11 days',
    message: 'The credit bureau has until Feb 19 to respond to your dispute on the Synchrony account.',
    actionUrl: '/cases/case-001',
    actionLabel: 'View Case',
    caseId: 'case-001',
    isRead: false,
    isDismissed: false,
    createdAt: '2026-02-08T08:00:00Z',
  },

  // Payment due reminder
  {
    id: 'notif-002',
    type: 'payment-due',
    priority: 'medium',
    title: 'Capital One payment due March 1',
    message: 'Your monthly payment of $175 is due in 21 days. Keep up the good work!',
    actionUrl: '/accounts/acc-002-capital-one',
    actionLabel: 'View Account',
    accountId: ACCOUNT_IDS.capitalOne,
    isRead: false,
    isDismissed: false,
    createdAt: '2026-02-08T07:00:00Z',
  },

  // Milestone reached
  {
    id: 'notif-003',
    type: 'milestone-reached',
    priority: 'low',
    title: 'You made your 4th payment!',
    message: "You've completed 4 payments on your Capital One plan. Only 14 to go - you're making real progress!",
    actionUrl: '/accounts/acc-002-capital-one',
    actionLabel: 'View Progress',
    accountId: ACCOUNT_IDS.capitalOne,
    isRead: true,
    isDismissed: false,
    createdAt: '2026-02-01T10:00:00Z',
    readAt: '2026-02-01T12:30:00Z',
  },

  // Account status change
  {
    id: 'notif-004',
    type: 'account-status-change',
    priority: 'medium',
    title: 'Debt validation response received',
    message: 'IC System responded to your debt validation request for the NYU Langone account. Review the documents they sent.',
    actionUrl: '/cases/case-002',
    actionLabel: 'Review Documents',
    accountId: ACCOUNT_IDS.nyuMedical,
    caseId: 'case-002',
    isRead: false,
    isDismissed: false,
    createdAt: '2026-02-03T19:00:00Z',
  },

  // Vinny tip
  {
    id: 'notif-005',
    type: 'vinny-tip',
    priority: 'low',
    title: 'Tip: Document those collection calls',
    message: "I noticed you've logged several harassment incidents with Midland Credit. Keep documenting - you may have a strong FDCPA case!",
    actionUrl: '/cases/case-003',
    actionLabel: 'View FDCPA Case',
    isRead: false,
    isDismissed: false,
    createdAt: '2026-02-06T14:00:00Z',
  },

  // Budget alert
  {
    id: 'notif-006',
    type: 'budget-alert',
    priority: 'medium',
    title: 'Food spending update',
    message: "You've spent $280 on food this month - that's 65% of your $430 budget with 3 weeks left.",
    actionUrl: '/budget',
    actionLabel: 'View Budget',
    isRead: true,
    isDismissed: false,
    createdAt: '2026-02-07T18:00:00Z',
    readAt: '2026-02-07T20:15:00Z',
  },

  // Credit score change (mocked positive)
  {
    id: 'notif-007',
    type: 'credit-score-change',
    priority: 'low',
    title: 'Credit score update: +8 points!',
    message: 'Your credit score increased from 572 to 580. Your consistent payments and dispute are making a difference!',
    actionUrl: '/budget',
    actionLabel: 'View Credit Score',
    isRead: true,
    isDismissed: false,
    createdAt: '2026-02-01T06:00:00Z',
    readAt: '2026-02-01T08:45:00Z',
  },

  // System notification
  {
    id: 'notif-008',
    type: 'system',
    priority: 'low',
    title: 'Welcome to Vindicate NYC!',
    message: "You're taking control of your financial future. Explore your dashboard and let Vinny help guide you.",
    actionUrl: '/',
    actionLabel: 'Go to Dashboard',
    isRead: true,
    isDismissed: false,
    createdAt: '2026-01-15T10:30:00Z',
    readAt: '2026-01-15T10:32:00Z',
  },

  // Another deadline
  {
    id: 'notif-009',
    type: 'deadline-approaching',
    priority: 'medium',
    title: 'Reminder: Review validation documents',
    message: 'You set a reminder to review the debt validation documents by Feb 8.',
    actionUrl: '/cases/case-002',
    actionLabel: 'Review Now',
    caseId: 'case-002',
    isRead: false,
    isDismissed: false,
    createdAt: '2026-02-08T06:00:00Z',
  },

  // Milestone - First settlement
  {
    id: 'notif-010',
    type: 'milestone-reached',
    priority: 'low',
    title: 'First debt settled!',
    message: 'Congratulations! You settled the Con Edison account for 60% of the balance. One down!',
    actionUrl: '/accounts/acc-004-con-edison',
    actionLabel: 'View Details',
    accountId: ACCOUNT_IDS.conEdison,
    isRead: true,
    isDismissed: false,
    createdAt: '2025-12-20T12:00:00Z',
    readAt: '2025-12-20T12:05:00Z',
  },
];

// Helper functions
export function getUnreadNotifications(): Notification[] {
  return mockNotifications.filter(n => !n.isRead && !n.isDismissed);
}

export function getNotificationsByType(type: Notification['type']): Notification[] {
  return mockNotifications.filter(n => n.type === type);
}

export function getNotificationsForAccount(accountId: string): Notification[] {
  return mockNotifications.filter(n => n.accountId === accountId);
}

export function getNotificationsForCase(caseId: string): Notification[] {
  return mockNotifications.filter(n => n.caseId === caseId);
}

export function getRecentNotifications(limit: number = 10): Notification[] {
  return [...mockNotifications]
    .filter(n => !n.isDismissed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getUnreadCount(): number {
  return mockNotifications.filter(n => !n.isRead && !n.isDismissed).length;
}
