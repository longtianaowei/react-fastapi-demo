import type { PageData } from "@/types/response";
import type { User } from "@/types/user";

import request from "@/utils/request";

export function getUsers({ page, page_size }: { page: number; page_size: number }) {
  return request.get<PageData<User>>("/users/all", {
    params: { page, page_size },
  });
}

export function createUser(data: { name: string; email: string; password: string }) {
  return request.post<User>("/users/create", data);
}

export function updateUser(
  id: number,
  data: {
    name: string;
    email: string;
  },
) {
  return request.put<User>(`/users/${id}`, data);
}

export function deleteUser(id: number) {
  return request.delete<User>(`/users/${id}`);
}
