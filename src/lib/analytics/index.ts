// Analytics System Entry Point
// Simplified analytics system for Discord activity tracking

import { getAnalyticsDatabase } from './database';
import { getAnalyticsService } from './service';

// Initialize analytics system
export function initializeAnalytics() {
  console.log('🚀 Initializing Komplexáci Analytics System...');

  try {
    // Initialize database
    const database = getAnalyticsDatabase();
    console.log('✅ Analytics database initialized');

    // Initialize analytics service
    const analytics = getAnalyticsService();
    console.log('✅ Analytics service initialized');

    console.log('🎉 Analytics system fully initialized!');

    return {
      database,
      analytics
    };
  } catch (error) {
    console.error('❌ Analytics system initialization failed:', error);
    throw error;
  }
}

// Graceful shutdown
export function shutdownAnalytics() {
  try {
    console.log('🔄 Shutting down analytics system...');

    // Close database connections
    const database = getAnalyticsDatabase();
    database.close();

    console.log('✅ Analytics system shutdown complete');
  } catch (error) {
    console.error('❌ Analytics shutdown failed:', error);
  }
}

// Export core services
export {
  getAnalyticsDatabase,
  getAnalyticsService
};

// Export types
export type {
  DailySnapshot,
  GameSession,
  VoiceSession,
  SpotifySession
} from './database';

export type {
  UserActivity
} from './service';

// Default export for easy importing
export default {
  initialize: initializeAnalytics,
  shutdown: shutdownAnalytics,
  services: {
    database: getAnalyticsDatabase,
    analytics: getAnalyticsService
  }
};
