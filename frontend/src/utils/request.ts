import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

import type { ApiResponse } from "@/types/response";

const client = axios.create({
  baseURL: "http://localhost:8000",
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
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.detail ??
      error.message;

    return Promise.reject(new Error(message));
  },
);

const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return client.get<ApiResponse<T>>(url, config) as unknown as Promise<T>;
  },

  post<T>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post<ApiResponse<T>>(url, data, config) as unknown as Promise<T>;
  },

  upload<T>(url: string, file: File, fieldName = "file", config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return client.post<ApiResponse<T>>(url, formData, config) as unknown as Promise<T>;
  },

  download(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    return client.get(url, { ...config, responseType: "blob" }) as unknown as Promise<Blob>;
  },

  put<T>(url: string, data: unknown): Promise<T> {
    return client.put<ApiResponse<T>>(url, data) as unknown as Promise<T>;
  },

  delete<T>(url: string): Promise<T> {
    return client.delete<ApiResponse<T>>(url) as unknown as Promise<T>;
  },
};

export default request;
