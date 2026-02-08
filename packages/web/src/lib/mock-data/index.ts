/**
 * Mock Data Barrel Export
 * All mock data for Vindicate NYC MVP
 */

// Accounts
export {
  mockAccounts,
  mockAccountsSummary,
  ACCOUNT_IDS,
} from './accounts';

// Activities
export {
  mockActivities,
  getActivitiesForAccount,
  getRecentActivities,
  getHarassmentIncidents,
} from './activities';

// Cases
export {
  mockCases,
  getCasesForAccount,
  getActiveCases,
  getCasesWithUpcomingDeadlines,
  getUpcomingReminders,
} from './cases';

// Budget
export {
  mockBudgets,
  mockSavingsGoals,
  getCurrentBudget,
  getBudgetByMonth,
  getBudgetSummary,
  getExpensesByCategory,
} from './budget';

// Notifications
export {
  mockNotifications,
  getUnreadNotifications,
  getNotificationsByType,
  getNotificationsForAccount,
  getNotificationsForCase,
  getRecentNotifications,
  getUnreadCount,
} from './notifications';

// Credit Score
export {
  mockCreditScore,
  mockCreditScoreHistory,
  mockCreditFactors,
  getCreditRating,
  getScoreChange,
  getTotalImprovement,
  getPositiveFactors,
  getNegativeFactors,
  getHighImpactFactors,
  predictScoreImpact,
} from './credit-score';

// Vinny Responses
export {
  mockVinnyResponses,
  findVinnyResponse,
  getResponsesByCategory,
  getRandomEncouragement,
} from './vinny-responses';

// Resources
export {
  mockRightsSummaries,
  mockTemplateLetters,
  mockGlossaryTerms,
  mockArticles,
  getResourceBySlug,
  getResourcesByCategory,
  searchResources,
  searchGlossary,
} from './resources';
