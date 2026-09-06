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
    headers = { ...headers, ...getAdminAuthHeaders() };
  }
  return headers;
};

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('DEV_ADMIN_SECRET');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error("API request failed");
  return res.json();
};

export const apiClient = {
  get: async <T>(url: string, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, { headers: getHeaders(url, headers) });
    return handleResponse(res);
  },
  post: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  put: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  patch: async <T>(url: string, data: any, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getHeaders(url, headers) },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  delete: async <T>(url: string, headers?: HeadersInit): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "DELETE",
      headers: getHeaders(url, headers),
    });
    return handleResponse(res);
  },
};
