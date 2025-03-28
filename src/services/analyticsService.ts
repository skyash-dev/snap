import { trackEvent } from "@aptabase/tauri";

export const Analytics = {
  // App lifecycle events
  trackAppStart: () => trackEvent("app_started"),
  trackAppExit: () => trackEvent("app_exited"),

  // Snap events
  trackSnapCreated: (contentType: string) =>
    trackEvent("snap_created", { content_type: contentType }),
  trackSnapDeleted: () => trackEvent("snap_deleted"),
  trackSnapViewed: () => trackEvent("snap_viewed"),

  // Search events
  trackSearch: (queryLength: number) =>
    trackEvent("search_performed", { query_length: queryLength }),

  // Settings events
  trackSettingsChanged: (setting: string, value: string) =>
    trackEvent("settings_changed", { setting, value }),

  // Tab navigation
  trackTabChange: (tabName: string) =>
    trackEvent("tab_changed", { tab: tabName }),

  // Error events
  trackError: (errorType: string, message: string) =>
    trackEvent("error_occurred", { error_type: errorType, message }),
};

// We'll keep this as a type definition for consistent event naming
export const AnalyticsEvents = {
  // App lifecycle
  APP_STARTED: "app_started",
  APP_EXITED: "app_exited",

  // Snap events
  SNAP_CREATED: "snap_created",
  SNAP_DELETED: "snap_deleted",
  SNAP_VIEWED: "snap_viewed",

  // Search events
  SEARCH_PERFORMED: "search_performed",

  // Settings events
  SETTINGS_CHANGED: "settings_changed",

  // Tab events
  TAB_CHANGED: "tab_changed",

  // Error events
  ERROR_OCCURRED: "error_occurred",
} as const;
