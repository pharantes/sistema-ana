/**
 * API Error Handling Utilities
 * Provides consistent error handling and user-friendly error messages
 */

/**
 * Standard error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
  FORBIDDEN: 'Você não tem permissão para esta ação.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Dados inválidos. Verifique os campos.',
  SERVER_ERROR: 'Erro no servidor. Tente novamente.',
  TIMEOUT: 'Tempo de requisição excedido.',
  UNKNOWN: 'Erro inesperado. Tente novamente.',
};

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Determines user-friendly error message based on error type
 * 
 * @param {Error|APIError} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  // Handle APIError with custom message
  if (error instanceof APIError) {
    return error.message;
  }

  // Handle fetch/network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK;
  }

  // Handle timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return ERROR_MESSAGES.TIMEOUT;
  }

  // Handle HTTP status codes
  if (error.statusCode || error.status) {
    const status = error.statusCode || error.status;

    switch (status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 422:
      case 400:
        return ERROR_MESSAGES.VALIDATION;
      case 500:
      case 502:
      case 503:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return error.message || ERROR_MESSAGES.UNKNOWN;
    }
  }

  // Return error message or fallback
  return error.message || ERROR_MESSAGES.UNKNOWN;
}

/**
 * Handles API response and throws appropriate error
 * 
 * @param {Response} response - Fetch response object
 * @returns {Promise<any>} Parsed JSON response
 * @throws {APIError} If response is not ok
 */
export async function handleAPIResponse(response) {
  if (!response.ok) {
    let errorMessage = ERROR_MESSAGES.UNKNOWN;
    let errorDetails = null;

    try {
      const data = await response.json();
      errorMessage = data.error || data.message || errorMessage;
      errorDetails = data.details || data.errors || null;
    } catch {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new APIError(errorMessage, response.status, errorDetails);
  }

  return response.json();
}

/**
 * Makes an API request with error handling
 * 
 * @param {string} url - API endpoint URL
 * @param {RequestInit} [options] - Fetch options
 * @returns {Promise<any>} API response data
 * @throws {APIError} If request fails
 */
export async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return await handleAPIResponse(response);
  } catch (error) {
    // Re-throw APIError as is
    if (error instanceof APIError) {
      throw error;
    }

    // Wrap other errors
    const message = getErrorMessage(error);
    throw new APIError(message, 0, error);
  }
}

/**
 * Logs error for debugging (only in development)
 * 
 * @param {string} context - Context where error occurred
 * @param {Error} error - Error object
 */
export function logError(context, error) {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
  }
}

/**
 * Safe error handler that prevents application crashes
 * 
 * @param {Function} fn - Async function to execute
 * @param {string} [context] - Context for logging
 * @returns {Promise<[Error|null, any]>} Tuple of [error, result]
 */
export async function tryCatch(fn, context = 'unknown') {
  try {
    const result = await fn();
    return [null, result];
  } catch (error) {
    logError(context, error);
    return [error, null];
  }
}
