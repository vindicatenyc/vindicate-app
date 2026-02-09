/**
 * Mock Data Barrel Export
 * Only static content data (resources, Vinny responses) remain.
 * Domain data (accounts, activities, cases, etc.) now comes from Supabase.
 */

// Vinny Responses
export {
  findVinnyResponse,
  getRandomEncouragement,
} from './vinny-responses';

// Resources (static content, not DB-backed)
export {
  mockRightsSummaries,
  mockTemplateLetters,
  mockArticles,
} from './resources';
