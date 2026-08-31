export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`);
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  post: async <T>(url: string, data: any): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  put: async <T>(url: string, data: any): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  patch: async <T>(url: string, data: any): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
  delete: async <T>(url: string): Promise<T> => {
    const res = await fetch(`${API_URL}${url}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("API request failed");
    return res.json();
  },
};
