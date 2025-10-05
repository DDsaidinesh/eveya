/**
 * Centralized API configuration
 */

// Get API base URL from environment or default to localhost
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// API version prefix
export const API_VERSION = '/api/v1';

// Full API URL with version
export const API_URL = `${API_BASE_URL}${API_VERSION}`;

// Common API configuration
export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

// Environment check utilities
export const isProduction = import.meta.env.PROD;
export const isDevelopment = import.meta.env.DEV;