export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const getAdminAuthHeaders = () => {
  if (!import.meta.env.DEV) {
    throw new Error('Admin authentication is unavailable');
  }

  const secret = localStorage.getItem('DEV_ADMIN_SECRET');
  if (!secret) {
    throw new Error('DEV_ADMIN_SECRET is not configured in localStorage');
  }

  return {
    'Authorization': secret
  };
};

const getHeaders = (url: string, customHeaders?: HeadersInit) => {
  let headers = { ...customHeaders };
  if (url.startsWith('/api/admin') || url.startsWith('/admin')) {
    try {
      headers = { ...headers, ...getAdminAuthHeaders() };
    } catch (e) {
      console.warn("Could not attach admin auth headers:", e);
    }
  }
  return headers;
};

export const apiClient = {
  get: async <T>(url: string, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, { headers: getHeaders(url, headers) });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  post: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  put: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  patch: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  delete: async <T>(url: string, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "DELETE",
      headers: getHeaders(url, headers),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
};
