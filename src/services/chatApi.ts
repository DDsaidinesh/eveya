/**
 * Chat API service for communicating with the backend chatbot endpoints.
 * 
 * This service handles all communication with the FastAPI backend for
 * chat functionality, including session management and message exchange.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { supabase } from '@/integrations/supabase/client';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';
const API_VERSION = '/api/v1';

// Request/Response Types
export interface ChatStartResponse {
  session_id: string;
  message: string;
  timestamp: string;
}

export interface ChatMessageRequest {
  message: string;
  user_id?: string;
}

export interface ChatMessageResponse {
  response: string;
  session_id: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatMessage[];
}

export interface ChatError {
  error: string;
  message: string;
  session_id?: string;
}

/**
 * Custom error class for chat API errors
 */
export class ChatApiError extends Error {
  public readonly statusCode: number;
  public readonly details: string;
  public readonly sessionId?: string;

  constructor(message: string, statusCode: number = 500, details?: string, sessionId?: string) {
    super(message);
    this.name = 'ChatApiError';
    this.statusCode = statusCode;
    this.details = details || message;
    this.sessionId = sessionId;
  }
}

/**
 * Chat API service class
 */
export class ChatApiService {
  private api: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_VERSION}`;
    
    // Create axios instance with default configuration
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging and auth
    this.api.interceptors.request.use(
      async (config) => {
        console.log(`[ChatAPI] ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add auth token if available
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
          }
        } catch (error) {
          console.warn('[ChatAPI] Could not add auth token:', error);
        }
        
        return config;
      },
      (error) => {
        console.error('[ChatAPI] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log(`[ChatAPI] Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Start a new chat session
   */
  async startSession(userId?: string): Promise<ChatStartResponse> {
    try {
      const response = await this.api.post<ChatStartResponse>('/chat/start', {
        user_id: userId,
      });

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Send a message to an existing chat session
   */
  async sendMessage(
    sessionId: string,
    message: string,
    userId?: string
  ): Promise<ChatMessageResponse> {
    try {
      const response = await this.api.post<ChatMessageResponse>(
        `/chat/${sessionId}/message`,
        {
          message,
          user_id: userId,
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get chat history for a session
   */
  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    try {
      const response = await this.api.get<ChatHistoryResponse>(
        `/chat/${sessionId}/history`
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Get chat service statistics (for debugging)
   */
  async getStats(): Promise<{
    active_sessions: number;
    total_sessions: number;
    timestamp: string;
  }> {
    try {
      const response = await this.api.get('/chat/stats');
      return response.data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * Check if the chat service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch (error) {
      console.warn('[ChatAPI] Health check failed:', error);
      return false;
    }
  }

  /**
   * Handle API errors and convert them to ChatApiError
   */
  private handleApiError(error: any): ChatApiError {
    if (error instanceof ChatApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ChatError>;
      
      if (axiosError.response) {
        // Server responded with error status
        const { status, data } = axiosError.response;
        const errorData = data as ChatError;
        
        let message = 'An error occurred while processing your request.';
        
        switch (status) {
          case 404:
            message = 'Chat session not found or expired. Please start a new conversation.';
            break;
          case 429:
            message = 'Too many requests. Please wait a moment before trying again.';
            break;
          case 500:
            message = 'Server error. Please try again in a moment.';
            break;
          default:
            message = errorData?.message || axiosError.message || message;
        }

        return new ChatApiError(
          message,
          status,
          errorData?.error || axiosError.message,
          errorData?.session_id
        );
      } else if (axiosError.request) {
        // Network error
        return new ChatApiError(
          'Unable to connect to chat service. Please check your internet connection.',
          0,
          'Network error'
        );
      }
    }

    // Unknown error
    return new ChatApiError(
      'An unexpected error occurred. Please try again.',
      500,
      error.message || 'Unknown error'
    );
  }
}

// Export a singleton instance
export const chatApi = new ChatApiService();
