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
  async (error: AxiosError<{ message?: string; detail?: string } | Blob>) => {
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

  post<T>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
    return client.post<ApiResponse<T>>(url, data, config) as unknown as Promise<T>;
  },

  upload<T>(url: string, file: File, fieldName = "file", config?: AxiosRequestConfig): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    return client.post<ApiResponse<T>>(url, formData, config) as unknown as Promise<T>;
  },

  async download(
    url: string,
    filename: string,
    config?: AxiosRequestConfig,
  ): Promise<void> {
    const blob = await client.get(url, {
      ...config,
      responseType: "blob",
    });
    const objectUrl = URL.createObjectURL(blob.data);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 1000);
  },

  put<T>(url: string, data: unknown): Promise<T> {
    return client.put<ApiResponse<T>>(url, data) as unknown as Promise<T>;
  },

  delete<T>(url: string): Promise<T> {
    return client.delete<ApiResponse<T>>(url) as unknown as Promise<T>;
  },
};

export default request;
