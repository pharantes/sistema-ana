/**
 * Custom hooks for API calls with loading and error states
 */
import { useState, useCallback } from 'react';

/**
 * Hook for managing async API calls with loading and error states
 * @returns {Object} API state and fetch function
 */
export function useApiCall() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (apiFunction, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunction(...args);
      setLoading(false);
      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err?.message || 'Erro ao processar requisição';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, execute, reset };
}

/**
 * Hook for fetching data with automatic loading states
 * @param {Function} fetchFunction - Async function to fetch data
 * @param {*} initialData - Initial data value
 * @returns {Object} Data, loading, error, and refetch function
 */
export function useFetch(fetchFunction, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction(...args);
      setData(result);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err?.message || 'Erro ao carregar dados';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, [fetchFunction]);

  return { data, loading, error, refetch: fetchData, setData };
}

/**
 * Hook for form submission with loading and error states
 * @param {Function} submitFunction - Async function to submit form
 * @param {Object} options - Configuration options
 * @returns {Object} Submit handler, loading, error, and success states
 */
export function useFormSubmit(submitFunction, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { onSuccess, onError, resetOnSuccess = true } = options;

  const handleSubmit = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await submitFunction(formData);
      setLoading(false);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(result);
      }

      if (resetOnSuccess) {
        setTimeout(() => setSuccess(false), 3000);
      }

      return { success: true, data: result };
    } catch (err) {
      const errorMessage = err?.message || 'Erro ao enviar formulário';
      setError(errorMessage);
      setLoading(false);
      setSuccess(false);

      if (onError) {
        onError(err);
      }

      return { success: false, error: errorMessage };
    }
  }, [submitFunction, onSuccess, onError, resetOnSuccess]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return { handleSubmit, loading, error, success, reset };
}
