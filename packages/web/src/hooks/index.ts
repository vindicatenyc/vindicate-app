/**
 * Custom Hooks Barrel Export
 * All custom hooks for Vindicate NYC MVP
 */

export { useAccounts } from './use-accounts';
export type {
  NewAccount,
  AccountUpdate,
  AccountFilters,
  AccountSort,
  AccountSortField,
  SortDirection,
} from './use-accounts';

export { useActivities } from './use-activities';
export type {
  NewActivity,
  ActivityUpdate,
  ActivityFilters,
  ActivitySort,
  ActivitySortField,
} from './use-activities';

export { useCases } from './use-cases';
export type {
  NewCase,
  CaseUpdate,
  CaseFilters,
  CaseSort,
  CaseSortField,
} from './use-cases';

export { useBudget } from './use-budget';
export type {
  NewIncomeEntry,
  NewExpenseEntry,
  NewSavingsGoal,
} from './use-budget';

export { useNotifications } from './use-notifications';
export type { NewNotification } from './use-notifications';

export { useCreditScore } from './use-credit-score';
