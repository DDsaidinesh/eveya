/**
 * Session management utility for the chatbot.
 * 
 * This utility handles local session storage, UUID generation,
 * and session validation for the chat interface.
 */

import { v4 as uuidv4 } from 'uuid';

// Session storage keys
const SESSION_STORAGE_KEY = 'eeveya_chat_session';
const USER_ID_STORAGE_KEY = 'eeveya_user_id';
const SESSION_TIMESTAMP_KEY = 'eeveya_session_timestamp';

// Session configuration
const SESSION_TIMEOUT_MINUTES = 30;

export interface SessionData {
  sessionId: string;
  userId?: string;
  timestamp: number;
  isValid: boolean;
}

/**
 * Session manager class for handling chat sessions
 */
export class SessionManager {
  /**
   * Create a new session with optional user ID
   */
  static createSession(userId?: string): SessionData {
    const sessionId = uuidv4();
    const timestamp = Date.now();
    const finalUserId = userId || this.getOrCreateUserId();

    const sessionData: SessionData = {
      sessionId,
      userId: finalUserId,
      timestamp,
      isValid: true,
    };

    // Store in localStorage
    this.storeSession(sessionData);

    console.log('[SessionManager] Created new session:', sessionId);
    return sessionData;
  }

  /**
   * Get current session if it exists and is valid
   */
  static getCurrentSession(): SessionData | null {
    try {
      const sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
      const userId = localStorage.getItem(USER_ID_STORAGE_KEY);
      const timestampStr = localStorage.getItem(SESSION_TIMESTAMP_KEY);

      if (!sessionId || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const sessionData: SessionData = {
        sessionId,
        userId: userId || undefined,
        timestamp,
        isValid: this.isSessionValid(timestamp),
      };

      if (!sessionData.isValid) {
        this.clearSession();
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('[SessionManager] Error getting current session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Update session timestamp to extend its validity
   */
  static updateSessionActivity(sessionId?: string): void {
    const currentSession = this.getCurrentSession();
    
    if (currentSession && (!sessionId || currentSession.sessionId === sessionId)) {
      const newTimestamp = Date.now();
      currentSession.timestamp = newTimestamp;
      this.storeSession(currentSession);
      
      console.log('[SessionManager] Updated session activity:', currentSession.sessionId);
    }
  }

  /**
   * Clear current session from storage
   */
  static clearSession(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(SESSION_TIMESTAMP_KEY);
      // Keep userId for future sessions
      
      console.log('[SessionManager] Cleared session');
    } catch (error) {
      console.error('[SessionManager] Error clearing session:', error);
    }
  }

  /**
   * Get or create a persistent user ID
   */
  static getOrCreateUserId(): string {
    try {
      let userId = localStorage.getItem(USER_ID_STORAGE_KEY);
      
      if (!userId) {
        userId = uuidv4();
        localStorage.setItem(USER_ID_STORAGE_KEY, userId);
        console.log('[SessionManager] Created new user ID:', userId);
      }
      
      return userId;
    } catch (error) {
      console.error('[SessionManager] Error with user ID:', error);
      return uuidv4(); // Return temporary ID if localStorage fails
    }
  }

  /**
   * Check if a session timestamp is still valid
   */
  static isSessionValid(timestamp: number): boolean {
    const now = Date.now();
    const sessionAge = now - timestamp;
    const maxAge = SESSION_TIMEOUT_MINUTES * 60 * 1000; // Convert to milliseconds
    
    return sessionAge < maxAge;
  }

  /**
   * Get session age in minutes
   */
  static getSessionAge(timestamp: number): number {
    const now = Date.now();
    const ageMs = now - timestamp;
    return Math.floor(ageMs / (60 * 1000));
  }

  /**
   * Store session data in localStorage
   */
  private static storeSession(sessionData: SessionData): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionData.sessionId);
      localStorage.setItem(SESSION_TIMESTAMP_KEY, sessionData.timestamp.toString());
      
      if (sessionData.userId) {
        localStorage.setItem(USER_ID_STORAGE_KEY, sessionData.userId);
      }
    } catch (error) {
      console.error('[SessionManager] Error storing session:', error);
    }
  }

  /**
   * Get session info for debugging
   */
  static getSessionInfo(): {
    hasSession: boolean;
    sessionId?: string;
    userId?: string;
    ageMinutes?: number;
    isValid?: boolean;
  } {
    const session = this.getCurrentSession();
    
    if (!session) {
      return { hasSession: false };
    }

    return {
      hasSession: true,
      sessionId: session.sessionId,
      userId: session.userId,
      ageMinutes: this.getSessionAge(session.timestamp),
      isValid: session.isValid,
    };
  }
}

// Export singleton-like functions for convenience
export const sessionManager = {
  create: SessionManager.createSession.bind(SessionManager),
  getCurrent: SessionManager.getCurrentSession.bind(SessionManager),
  updateActivity: SessionManager.updateSessionActivity.bind(SessionManager),
  clear: SessionManager.clearSession.bind(SessionManager),
  getOrCreateUserId: SessionManager.getOrCreateUserId.bind(SessionManager),
  isValid: SessionManager.isSessionValid.bind(SessionManager),
  getInfo: SessionManager.getSessionInfo.bind(SessionManager),
};





