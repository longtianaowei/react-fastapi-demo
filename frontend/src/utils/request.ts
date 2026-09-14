import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { ApiResponse } from "@/types/response";

const BASE_URL = "http://localhost:8000";
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

const rawClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

type TokenData = {
  access_token: string;
  token_type: string;
};

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let accessToken: string | null = null;
let refreshPromise: Promise<TokenData> | null = null;

function setTokens(token: string) {
  accessToken = token;
}

function clearTokens() {
  accessToken = null;
}

function expireSession() {
  clearTokens();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

function refreshTokens() {
  if (!refreshPromise) {
    refreshPromise = rawClient
      .post<ApiResponse<TokenData>>("/auth/refresh")
      .then(({ data: result }) => {
        if (result.code !== 0) {
          throw new Error(result.message);
        }

        setTokens(result.data.access_token);
        return result.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response.config.responseType === "blob") {
      return response.data as never;
    }

    const result = response.data as ApiResponse<unknown>;

    if (result.code !== 0) {
      return Promise.reject(new Error(result.message));
    }

    return result.data as never;
  },
  async (error: AxiosError<{ message?: string; detail?: string } | Blob>) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;
    const status = error.response?.status;
    const isAuthRequest =
      originalRequest?.url?.endsWith("/auth/login") ||
      originalRequest?.url?.endsWith("/auth/refresh") ||
      originalRequest?.url?.endsWith("/auth/logout");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const requestAuthorization = originalRequest.headers.Authorization;

      if (
        accessToken &&
        requestAuthorization &&
        requestAuthorization !== `Bearer ${accessToken}`
      ) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      }

      if (accessToken) {
        try {
          const tokens = await refreshTokens();
          originalRequest.headers.Authorization = `Bearer ${tokens.access_token}`;
          return client(originalRequest);
        } catch (refreshError) {
          if (axios.isAxiosError(refreshError) && refreshError.response?.status === 401) {
            expireSession();
          }
        }
      } else {
        return Promise.reject(error);
      }
    }

    const data = error.response?.data;

    if (data instanceof Blob) {
      const text = await data.text();

      try {
        const result = JSON.parse(text) as { message?: string; detail?: string };
        return Promise.reject(new Error(result.message ?? result.detail ?? error.message));
      } catch {
        return Promise.reject(new Error(text || error.message));
      }
    }

    const message = data?.message ?? data?.detail ?? error.message;
    return Promise.reject(new Error(message));
  },
);

const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.get<ApiResponse<T>>(url, config) as unknown as Promise<T>;
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post<ApiResponse<T>>(url, data, config) as unknown as Promise<T>;
  },

  upload<T>(url: string, file: File, fieldName = "file", config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return client.post<ApiResponse<T>>(url, formData, config) as unknown as Promise<T>;
  },

  async download(url: string, filename: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await client.get<Blob>(url, {
      ...config,
      responseType: "blob",
    });
    const objectUrl = URL.createObjectURL(response as unknown as Blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  },

  put<T>(url: string, data: unknown): Promise<T> {
    return client.put<ApiResponse<T>>(url, data) as unknown as Promise<T>;
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.delete<ApiResponse<T>>(url, config) as unknown as Promise<T>;
  },

  setTokens,
  clearTokens,
};

export default request;
