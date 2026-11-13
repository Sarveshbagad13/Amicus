/**
 * Native fetch API client for Amicus Legal Text Analyzer
 * Strict constraint: Pure native fetch without third-party HTTP wrappers.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const { token, body, isFormData = false, ...customConfig } = options;

  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data?.error?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.code = data?.error?.code || 'API_ERROR';
      error.details = data?.error?.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const netErr = new Error('Unable to connect to the Amicus backend server. Please verify the API is running.');
      netErr.status = 503;
      netErr.code = 'NETWORK_ERROR';
      throw netErr;
    }
    throw err;
  }
}

export const api = {
  auth: {
    register: (email, password, fullName) =>
      request('/api/auth/register', {
        method: 'POST',
        body: { email, password, full_name: fullName },
      }),
    login: (email, password) =>
      request('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    me: (token) =>
      request('/api/auth/me', {
        method: 'GET',
        token,
      }),
  },
  documents: {
    upload: (file, token) => {
      const formData = new FormData();
      formData.append('file', file);
      return request('/api/documents/upload', {
        method: 'POST',
        body: formData,
        isFormData: true,
        token,
      });
    },
    /** List documents with optional pagination. */
    list: (token, { page = 1, limit = 20 } = {}) =>
      request(`/api/documents?page=${page}&limit=${limit}`, {
        method: 'GET',
        token,
      }),
    getById: (documentId, token) =>
      request(`/api/documents/${documentId}`, {
        method: 'GET',
        token,
      }),
    delete: (documentId, token) =>
      request(`/api/documents/${documentId}`, {
        method: 'DELETE',
        token,
      }),
    reanalyze: (documentId, text, token) =>
      request(`/api/documents/${documentId}/analyze`, {
        method: 'POST',
        body: { text },
        token,
      }),
    /**
     * Export the analysis report as a PDF file.
     * Returns a Blob on success.
     */
    exportPdf: async (documentId, token) => {
      const url = `${API_BASE_URL}/api/documents/${documentId}/export`;
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const error = new Error(errData?.error?.message || `Export failed with status ${response.status}`);
        error.status = response.status;
        error.code = errData?.error?.code || 'EXPORT_FAILED';
        throw error;
      }
      return response.blob();
    },
  },
  health: {
    check: () => request('/api/health', { method: 'GET' }),
  },
};
