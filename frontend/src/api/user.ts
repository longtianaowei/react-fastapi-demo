import type { PageData } from "../types/response";
import type { User } from "../types/user";

import request from "./request";

export function getUsers(page = 1, pageSize = 10) {
  return request.get<PageData<User>>("/users/all", {
    params: {
      page,
      page_size: pageSize,
    },
  });
}

export function createUser(data: { name: string; email: string }) {
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
