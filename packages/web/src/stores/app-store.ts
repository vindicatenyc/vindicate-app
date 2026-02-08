'use client';

/**
 * Global application state with Zustand + persist middleware
 * Handles theme, sidebar, Vinny chat, filters, and user preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ThemePreference,
  NotificationPreferences,
  VinnyMessage,
  VinnySession,
  AccountStatus,
  AccountCategory,
} from '@vindicate/shared';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@vindicate/shared';
import { findVinnyResponse, getRandomEncouragement } from '@/lib/mock-data';

// =============================================================================
// TYPES
// =============================================================================

interface SidebarState {
  isOpen: boolean;
  isCollapsed: boolean;
}

interface AccountFiltersState {
  statuses: AccountStatus[];
  categories: AccountCategory[];
  search: string;
  sortField: 'creditorName' | 'currentBalance' | 'dateOfLastActivity' | 'status';
  sortDirection: 'asc' | 'desc';
}

interface VinnyChatState {
  isOpen: boolean;
  session: VinnySession | null;
  isTyping: boolean;
}

interface OnboardingState {
  hasCompleted: boolean;
  currentStep: number;
  totalSteps: number;
}

interface AppState {
  // Theme
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;

  // Sidebar
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  toggleSidebarCollapse: () => void;

  // Account Filters
  accountFilters: AccountFiltersState;
  setAccountStatusFilter: (statuses: AccountStatus[]) => void;
  setAccountCategoryFilter: (categories: AccountCategory[]) => void;
  setAccountSearch: (search: string) => void;
  setAccountSort: (field: AccountFiltersState['sortField'], direction: 'asc' | 'desc') => void;
  resetAccountFilters: () => void;

  // Vinny Chat
  vinnyChat: VinnyChatState;
  toggleVinnyChat: () => void;
  openVinnyChat: () => void;
  closeVinnyChat: () => void;
  sendMessageToVinny: (message: string) => void;
  clearVinnySession: () => void;

  // Notification Preferences
  notificationPreferences: NotificationPreferences;
  updateNotificationPreference: (key: keyof NotificationPreferences, value: boolean) => void;
  resetNotificationPreferences: () => void;

  // Onboarding
  onboarding: OnboardingState;
  completeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  resetOnboarding: () => void;

  // User Info (minimal for MVP)
  userState: string | null; // For SOL calculations
  setUserState: (state: string | null) => void;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const defaultAccountFilters: AccountFiltersState = {
  statuses: [],
  categories: [],
  search: '',
  sortField: 'dateOfLastActivity',
  sortDirection: 'desc',
};

const defaultVinnyChat: VinnyChatState = {
  isOpen: false,
  session: null,
  isTyping: false,
};

const defaultOnboarding: OnboardingState = {
  hasCompleted: false,
  currentStep: 0,
  totalSteps: 5,
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function createVinnyResponse(userMessage: string): VinnyMessage {
  const response = findVinnyResponse(userMessage);

  return {
    id: generateMessageId(),
    role: 'assistant',
    content: response.response,
    timestamp: new Date().toISOString(),
    suggestedReplies: response.suggestedReplies,
    resourceLink: response.resourceLink,
  };
}

// =============================================================================
// STORE
// =============================================================================

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebar: {
        isOpen: true,
        isCollapsed: false,
      },
      toggleSidebar: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen },
        })),
      setSidebarOpen: (isOpen) =>
        set((state) => ({
          sidebar: { ...state.sidebar, isOpen },
        })),
      toggleSidebarCollapse: () =>
        set((state) => ({
          sidebar: { ...state.sidebar, isCollapsed: !state.sidebar.isCollapsed },
        })),

      // Account Filters
      accountFilters: defaultAccountFilters,
      setAccountStatusFilter: (statuses) =>
        set((state) => ({
          accountFilters: { ...state.accountFilters, statuses },
        })),
      setAccountCategoryFilter: (categories) =>
        set((state) => ({
          accountFilters: { ...state.accountFilters, categories },
        })),
      setAccountSearch: (search) =>
        set((state) => ({
          accountFilters: { ...state.accountFilters, search },
        })),
      setAccountSort: (sortField, sortDirection) =>
        set((state) => ({
          accountFilters: { ...state.accountFilters, sortField, sortDirection },
        })),
      resetAccountFilters: () => set({ accountFilters: defaultAccountFilters }),

      // Vinny Chat
      vinnyChat: defaultVinnyChat,
      toggleVinnyChat: () =>
        set((state) => ({
          vinnyChat: { ...state.vinnyChat, isOpen: !state.vinnyChat.isOpen },
        })),
      openVinnyChat: () => {
        const state = get();
        const now = new Date().toISOString();

        // Create new session if none exists
        if (!state.vinnyChat.session) {
          const welcomeMessage: VinnyMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: `Hey there! I'm Vinny, your financial recovery companion. ${getRandomEncouragement()} How can I help you today?`,
            timestamp: now,
            suggestedReplies: [
              'What can you help me with?',
              'Tell me about my rights',
              "I'm stressed about debt",
            ],
          };

          set({
            vinnyChat: {
              isOpen: true,
              isTyping: false,
              session: {
                id: generateSessionId(),
                messages: [welcomeMessage],
                startedAt: now,
                lastMessageAt: now,
              },
            },
          });
        } else {
          set((state) => ({
            vinnyChat: { ...state.vinnyChat, isOpen: true },
          }));
        }
      },
      closeVinnyChat: () =>
        set((state) => ({
          vinnyChat: { ...state.vinnyChat, isOpen: false },
        })),
      sendMessageToVinny: (message) => {
        const state = get();
        const now = new Date().toISOString();

        // Create user message
        const userMessage: VinnyMessage = {
          id: generateMessageId(),
          role: 'user',
          content: message,
          timestamp: now,
        };

        // Add user message and set typing
        set((state) => ({
          vinnyChat: {
            ...state.vinnyChat,
            isTyping: true,
            session: state.vinnyChat.session
              ? {
                  ...state.vinnyChat.session,
                  messages: [...state.vinnyChat.session.messages, userMessage],
                  lastMessageAt: now,
                }
              : {
                  id: generateSessionId(),
                  messages: [userMessage],
                  startedAt: now,
                  lastMessageAt: now,
                },
          },
        }));

        // Simulate typing delay and add response
        setTimeout(() => {
          const vinnyResponse = createVinnyResponse(message);

          set((state) => ({
            vinnyChat: {
              ...state.vinnyChat,
              isTyping: false,
              session: state.vinnyChat.session
                ? {
                    ...state.vinnyChat.session,
                    messages: [...state.vinnyChat.session.messages, vinnyResponse],
                    lastMessageAt: vinnyResponse.timestamp,
                  }
                : null,
            },
          }));
        }, 800 + Math.random() * 600); // 800-1400ms delay
      },
      clearVinnySession: () =>
        set((state) => ({
          vinnyChat: {
            ...state.vinnyChat,
            session: null,
          },
        })),

      // Notification Preferences
      notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
      updateNotificationPreference: (key, value) =>
        set((state) => ({
          notificationPreferences: {
            ...state.notificationPreferences,
            [key]: value,
          },
        })),
      resetNotificationPreferences: () =>
        set({ notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES }),

      // Onboarding
      onboarding: defaultOnboarding,
      completeOnboarding: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            hasCompleted: true,
            currentStep: state.onboarding.totalSteps,
          },
        })),
      setOnboardingStep: (step) =>
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        })),
      resetOnboarding: () => set({ onboarding: defaultOnboarding }),

      // User Info
      userState: 'NY',
      setUserState: (state) => set({ userState: state }),
    }),
    {
      name: 'vindicate-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        theme: state.theme,
        sidebar: state.sidebar,
        accountFilters: state.accountFilters,
        notificationPreferences: state.notificationPreferences,
        onboarding: state.onboarding,
        userState: state.userState,
        // Note: Vinny chat session is also persisted for continuity
        vinnyChat: {
          ...state.vinnyChat,
          isTyping: false, // Reset typing state on reload
        },
      }),
    }
  )
);

// =============================================================================
// SELECTOR HOOKS
// =============================================================================

// Theme selectors
export const useTheme = () => useAppStore((state) => state.theme);
export const useSetTheme = () => useAppStore((state) => state.setTheme);

// Sidebar selectors
export const useSidebar = () => useAppStore((state) => state.sidebar);
export const useToggleSidebar = () => useAppStore((state) => state.toggleSidebar);

// Vinny chat selectors
export const useVinnyChat = () => useAppStore((state) => state.vinnyChat);
export const useVinnyChatActions = () => {
  const toggleVinnyChat = useAppStore((state) => state.toggleVinnyChat);
  const openVinnyChat = useAppStore((state) => state.openVinnyChat);
  const closeVinnyChat = useAppStore((state) => state.closeVinnyChat);
  const sendMessageToVinny = useAppStore((state) => state.sendMessageToVinny);
  const clearVinnySession = useAppStore((state) => state.clearVinnySession);

  return {
    toggleVinnyChat,
    openVinnyChat,
    closeVinnyChat,
    sendMessageToVinny,
    clearVinnySession,
  };
};

// Account filter selectors
export const useAccountFilters = () => useAppStore((state) => state.accountFilters);

// Onboarding selectors
export const useOnboarding = () => useAppStore((state) => state.onboarding);
