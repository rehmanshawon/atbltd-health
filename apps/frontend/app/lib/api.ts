const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.atbltd.health/api";

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: any;
  token?: string;
  isPublic?: boolean;
}

export async function apiCall<T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body, token, isPublic = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}`,
    );
  }

  return data;
}

// Auth API
export const authApi = {
  register: (data: any) =>
    apiCall("/auth/register", { method: "POST", body: data, isPublic: true }),
  login: (data: { identifier: string; password: string }) =>
    apiCall("/auth/login", { method: "POST", body: data, isPublic: true }),
  sendOtp: (mobileNumber: string) =>
    apiCall("/auth/send-otp", {
      method: "POST",
      body: { mobileNumber },
      isPublic: true,
    }),
  verifyOtp: (data: { mobileNumber: string; otp: string }) =>
    apiCall("/auth/verify-otp", { method: "POST", body: data, isPublic: true }),
  getProfile: (token: string) => apiCall("/auth/profile", { token }),
};

// Membership API
export const membershipApi = {
  getDashboard: (token: string) => apiCall("/membership/dashboard", { token }),
  getStatus: (token: string) => apiCall("/membership/status", { token }),
  getDigitalCard: (token: string) =>
    apiCall("/membership/digital-card", { token }),
};

// Admin API
export const adminApi = {
  getDashboard: (token: string) => apiCall("/admin/dashboard", { token }),
  getPendingPayments: (token: string) =>
    apiCall("/admin/payments/pending", { token }),
  verifyPayment: (paymentId: string, token: string) =>
    apiCall(`/admin/payments/${paymentId}/verify`, { method: "POST", token }),
  getPayments: (token: string, status?: string, page?: number) =>
    apiCall(`/admin/payments?status=${status || ""}&page=${page || 1}`, {
      token,
    }),
  getAuditLogs: (token: string, page?: number) =>
    apiCall(`/admin/audit-logs?page=${page || 1}`, { token }),
};

// Users API
export const usersApi = {
  getStats: (token: string) => apiCall("/users/stats", { token }),
  findAll: (token: string, page?: number, role?: string) =>
    apiCall(`/users?page=${page || 1}&role=${role || ""}`, { token }),
  search: (token: string, query: string) =>
    apiCall(`/users/search?q=${query}`, { token }),
};
